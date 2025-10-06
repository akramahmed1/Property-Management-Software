import { PrismaClient, Payment, PaymentMethod, PaymentStatus, Booking } from '@prisma/client';
import Razorpay from 'razorpay';
import { logger } from '../utils/logger';
import { Redis } from 'ioredis';

const prisma = new PrismaClient();

// Redis client for caching
let redis: Redis;
try {
  redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
} catch (error) {
  logger.warn('Redis connection failed, payment caching disabled:', error);
}

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || ''
});

export interface PaymentRequest {
  bookingId?: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  customerId: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  id: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  method: PaymentMethod;
  gatewayId?: string;
  gatewayData?: any;
  processedAt?: Date;
  failureReason?: string;
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
  created_at: number;
}

export interface PayTabsResponse {
  transaction_id: string;
  payment_url: string;
  status: string;
}

export class PaymentService {
  private static instance: PaymentService;
  private readonly CACHE_PREFIX = 'payment:';
  private readonly CACHE_TTL = 300; // 5 minutes

  private constructor() {}

  public static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  /**
   * Create a new payment
   */
  async createPayment(paymentData: PaymentRequest, userId: string) {
    try {
      // Validate payment data
      if (!paymentData.amount || paymentData.amount <= 0) {
        throw new Error('Invalid payment amount');
      }

      if (!paymentData.currency) {
        paymentData.currency = 'INR';
      }

      // Create payment record
      const payment = await prisma.payment.create({
        data: {
          amount: paymentData.amount,
        currency: paymentData.currency,
          method: paymentData.method,
          status: PaymentStatus.PENDING,
          gateway: this.getGatewayForMethod(paymentData.method),
          bookingId: paymentData.bookingId,
          metadata: paymentData.metadata || {}
        }
      });

      // Log payment creation
      logger.info(`Payment created: ${payment.id} for amount ${paymentData.amount} ${paymentData.currency}`);

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'CREATE_PAYMENT',
          entity: 'Payment',
          entityId: payment.id,
          newData: {
            amount: payment.amount,
            currency: payment.currency,
            method: payment.method
          }
        }
      });

      return payment;
    } catch (error) {
      logger.error('Error creating payment:', error);
      throw error;
    }
  }

  /**
   * Process payment based on method
   */
  async processPayment(paymentId: string, paymentData: any, userId: string) {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId }
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== PaymentStatus.PENDING) {
        throw new Error('Payment is not in pending status');
      }

      let result: PaymentResponse;

      switch (payment.method) {
        case PaymentMethod.UPI:
          result = await this.processUPIPayment(payment, paymentData);
          break;
        case PaymentMethod.CARD:
          result = await this.processCardPayment(payment, paymentData);
          break;
        case PaymentMethod.NET_BANKING:
          result = await this.processNetBankingPayment(payment, paymentData);
          break;
        case PaymentMethod.WALLET:
          result = await this.processWalletPayment(payment, paymentData);
          break;
        case PaymentMethod.CASH:
          result = await this.processCashPayment(payment, paymentData);
          break;
        case PaymentMethod.CHEQUE:
          result = await this.processChequePayment(payment, paymentData);
          break;
        case PaymentMethod.BANK_TRANSFER:
          result = await this.processBankTransferPayment(payment, paymentData);
          break;
        default:
          throw new Error('Unsupported payment method');
      }

      // Update payment record
      const updatedPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: result.status,
          gatewayId: result.gatewayId,
          gatewayData: result.gatewayData,
          processedAt: result.processedAt || new Date(),
          failureReason: result.failureReason
        }
      });

      // Update booking status if payment is successful
      if (result.status === PaymentStatus.COMPLETED && payment.bookingId) {
        await this.updateBookingPaymentStatus(payment.bookingId, result.status);
      }

      // Log payment processing
      logger.info(`Payment processed: ${paymentId} with status ${result.status}`);

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'PROCESS_PAYMENT',
          entity: 'Payment',
          entityId: paymentId,
          newData: {
            status: result.status,
            gatewayId: result.gatewayId,
            processedAt: result.processedAt
          }
        }
      });

      return updatedPayment;
    } catch (error) {
      logger.error('Error processing payment:', error);
      
      // Update payment status to failed
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.FAILED,
          failureReason: error instanceof Error ? error.message : 'Unknown error'
        }
      });

      throw error;
    }
  }

  /**
   * Create Razorpay order
   */
  async createRazorpayOrder(paymentData: PaymentRequest, userId: string) {
    try {
      const orderData = {
        amount: Math.round(paymentData.amount * 100), // Convert to paise
        currency: paymentData.currency,
        receipt: `receipt_${Date.now()}`,
        notes: {
          bookingId: paymentData.bookingId,
          customerId: paymentData.customerId,
          description: paymentData.description
        }
      };

      const order = await razorpay.orders.create(orderData);

      // Store order in database
      const payment = await prisma.payment.create({
        data: {
          amount: paymentData.amount,
          currency: paymentData.currency,
          method: paymentData.method,
          status: PaymentStatus.PENDING,
          gateway: 'razorpay',
          gatewayId: order.id,
          gatewayData: order,
          bookingId: paymentData.bookingId,
          metadata: paymentData.metadata || {}
        }
      });

      logger.info(`Razorpay order created: ${order.id} for payment ${payment.id}`);

      return {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        paymentId: payment.id
      };
    } catch (error) {
      logger.error('Error creating Razorpay order:', error);
      throw error;
    }
  }

  /**
   * Verify Razorpay payment
   */
  async verifyRazorpayPayment(paymentId: string, razorpayPaymentId: string, razorpaySignature: string, userId: string) {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId }
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      // Verify signature
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
        .update(`${payment.gatewayId}|${razorpayPaymentId}`)
        .digest('hex');

      if (expectedSignature !== razorpaySignature) {
        throw new Error('Invalid payment signature');
      }

      // Fetch payment details from Razorpay
      const razorpayPayment = await razorpay.payments.fetch(razorpayPaymentId);

      // Update payment record
      const updatedPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: razorpayPayment.status === 'captured' ? PaymentStatus.COMPLETED : PaymentStatus.FAILED,
          gatewayId: razorpayPaymentId,
          gatewayData: razorpayPayment,
          processedAt: new Date(),
          failureReason: razorpayPayment.status !== 'captured' ? 'Payment not captured' : null
        }
      });

      // Update booking status if payment is successful
      if (updatedPayment.status === PaymentStatus.COMPLETED && payment.bookingId) {
        await this.updateBookingPaymentStatus(payment.bookingId, updatedPayment.status);
      }

      logger.info(`Razorpay payment verified: ${paymentId} with status ${updatedPayment.status}`);

      return updatedPayment;
    } catch (error) {
      logger.error('Error verifying Razorpay payment:', error);
      throw error;
    }
  }

  /**
   * Create PayTabs payment
   */
  async createPayTabsPayment(paymentData: PaymentRequest, userId: string) {
    try {
      // This is a mock implementation
      // In real implementation, you would integrate with PayTabs API
      const paytabsResponse = {
        transaction_id: `paytabs_${Date.now()}`,
        payment_url: `https://paytabs.com/payment/${Date.now()}`,
        status: 'pending'
      };

      // Store payment in database
      const payment = await prisma.payment.create({
        data: {
          amount: paymentData.amount,
          currency: paymentData.currency,
          method: paymentData.method,
          status: PaymentStatus.PENDING,
          gateway: 'paytabs',
          gatewayId: paytabsResponse.transaction_id,
          gatewayData: paytabsResponse,
          bookingId: paymentData.bookingId,
          metadata: paymentData.metadata || {}
        }
      });

      logger.info(`PayTabs payment created: ${paytabsResponse.transaction_id} for payment ${payment.id}`);

      return {
        transactionId: paytabsResponse.transaction_id,
        paymentUrl: paytabsResponse.payment_url,
        paymentId: payment.id
      };
    } catch (error) {
      logger.error('Error creating PayTabs payment:', error);
      throw error;
    }
  }

  /**
   * Process refund
   */
  async processRefund(paymentId: string, amount: number, reason: string, userId: string) {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId }
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== PaymentStatus.COMPLETED) {
        throw new Error('Can only refund completed payments');
      }

      if (amount > Number(payment.amount)) {
        throw new Error('Refund amount cannot exceed payment amount');
      }

      let refundResult;

      // Process refund based on gateway
      switch (payment.gateway) {
        case 'razorpay':
          refundResult = await this.processRazorpayRefund(payment, amount, reason);
          break;
        case 'paytabs':
          refundResult = await this.processPayTabsRefund(payment, amount, reason);
          break;
        default:
          throw new Error('Refund not supported for this payment gateway');
      }

      // Create refund record
      const refund = await prisma.payment.create({
        data: {
          amount: -amount, // Negative amount for refund
          currency: payment.currency,
          method: payment.method,
          status: PaymentStatus.COMPLETED,
          gateway: payment.gateway,
          gatewayId: refundResult.gatewayId,
          gatewayData: refundResult.gatewayData,
          bookingId: payment.bookingId,
          metadata: {
            type: 'refund',
            originalPaymentId: paymentId,
            reason: reason
          }
        }
      });

      // Update original payment status
      await prisma.payment.update({
        where: { id: paymentId },
        data: { status: PaymentStatus.REFUNDED }
      });

      logger.info(`Refund processed: ${refund.id} for payment ${paymentId}`);

      return refund;
    } catch (error) {
      logger.error('Error processing refund:', error);
      throw error;
    }
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(paymentId: string) {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          booking: {
            include: {
              property: true,
              customer: true
            }
          }
        }
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      return payment;
    } catch (error) {
      logger.error('Error fetching payment:', error);
      throw error;
    }
  }

  /**
   * Get payments with filtering
   */
  async getPayments(filters: any = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        method,
        gateway,
        startDate,
        endDate,
        bookingId
      } = filters;

      const where: any = {};

      if (status) where.status = status;
      if (method) where.method = method;
      if (gateway) where.gateway = gateway;
      if (bookingId) where.bookingId = bookingId;

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      const [payments, total] = await Promise.all([
        prisma.payment.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            booking: {
              include: {
                property: true,
                customer: true
              }
            }
          }
        }),
        prisma.payment.count({ where })
      ]);

      return {
        payments,
        pagination: {
          page,
          limit,
        total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error fetching payments:', error);
      throw error;
    }
  }

  /**
   * Get payment statistics
   */
  async getPaymentStats(period: string = '30d') {
    try {
      const now = new Date();
      let startDate = new Date();

      switch (period) {
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(now.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDate.setDate(now.getDate() - 30);
      }

      const [
        totalPayments,
        completedPayments,
        failedPayments,
        totalAmount,
        averageAmount
      ] = await Promise.all([
        prisma.payment.count({
          where: {
            createdAt: { gte: startDate },
            amount: { gt: 0 } // Exclude refunds
          }
        }),
        prisma.payment.count({
          where: {
            createdAt: { gte: startDate },
            status: PaymentStatus.COMPLETED,
            amount: { gt: 0 }
          }
        }),
        prisma.payment.count({
          where: {
            createdAt: { gte: startDate },
            status: PaymentStatus.FAILED,
            amount: { gt: 0 }
          }
        }),
        prisma.payment.aggregate({
        where: {
            createdAt: { gte: startDate },
            status: PaymentStatus.COMPLETED,
            amount: { gt: 0 }
          },
          _sum: { amount: true }
        }),
        prisma.payment.aggregate({
          where: {
            createdAt: { gte: startDate },
            status: PaymentStatus.COMPLETED,
            amount: { gt: 0 }
          },
          _avg: { amount: true }
        })
      ]);

      return {
        period,
        totalPayments,
        completedPayments,
        failedPayments,
        successRate: totalPayments > 0 ? (completedPayments / totalPayments) * 100 : 0,
        totalAmount: totalAmount._sum.amount || 0,
        averageAmount: averageAmount._avg.amount || 0
      };
    } catch (error) {
      logger.error('Error fetching payment stats:', error);
      throw error;
    }
  }

  // Private helper methods

  private getGatewayForMethod(method: PaymentMethod): string {
    switch (method) {
      case PaymentMethod.UPI:
      case PaymentMethod.CARD:
      case PaymentMethod.NET_BANKING:
      case PaymentMethod.WALLET:
        return 'razorpay';
      case PaymentMethod.CASH:
      case PaymentMethod.CHEQUE:
      case PaymentMethod.BANK_TRANSFER:
        return 'manual';
      default:
        return 'unknown';
    }
  }

  private async processUPIPayment(payment: Payment, paymentData: any): Promise<PaymentResponse> {
    // Mock UPI payment processing
    return {
      id: payment.id,
      status: PaymentStatus.COMPLETED,
      amount: Number(payment.amount),
      currency: payment.currency,
      method: payment.method,
      gatewayId: `upi_${Date.now()}`,
      processedAt: new Date()
    };
  }

  private async processCardPayment(payment: Payment, paymentData: any): Promise<PaymentResponse> {
    // Mock card payment processing
    return {
      id: payment.id,
      status: PaymentStatus.COMPLETED,
      amount: Number(payment.amount),
      currency: payment.currency,
      method: payment.method,
      gatewayId: `card_${Date.now()}`,
      processedAt: new Date()
    };
  }

  private async processNetBankingPayment(payment: Payment, paymentData: any): Promise<PaymentResponse> {
    // Mock net banking payment processing
    return {
      id: payment.id,
      status: PaymentStatus.COMPLETED,
      amount: Number(payment.amount),
      currency: payment.currency,
      method: payment.method,
      gatewayId: `netbanking_${Date.now()}`,
      processedAt: new Date()
    };
  }

  private async processWalletPayment(payment: Payment, paymentData: any): Promise<PaymentResponse> {
    // Mock wallet payment processing
    return {
      id: payment.id,
      status: PaymentStatus.COMPLETED,
      amount: Number(payment.amount),
      currency: payment.currency,
      method: payment.method,
      gatewayId: `wallet_${Date.now()}`,
      processedAt: new Date()
    };
  }

  private async processCashPayment(payment: Payment, paymentData: any): Promise<PaymentResponse> {
    // Cash payments are always successful when recorded
    return {
      id: payment.id,
      status: PaymentStatus.COMPLETED,
      amount: Number(payment.amount),
      currency: payment.currency,
      method: payment.method,
      gatewayId: `cash_${Date.now()}`,
      processedAt: new Date()
    };
  }

  private async processChequePayment(payment: Payment, paymentData: any): Promise<PaymentResponse> {
    // Cheque payments are pending until cleared
    return {
      id: payment.id,
      status: PaymentStatus.PENDING,
      amount: Number(payment.amount),
      currency: payment.currency,
      method: payment.method,
      gatewayId: `cheque_${Date.now()}`,
      processedAt: new Date()
    };
  }

  private async processBankTransferPayment(payment: Payment, paymentData: any): Promise<PaymentResponse> {
    // Bank transfer payments are pending until confirmed
    return {
      id: payment.id,
      status: PaymentStatus.PENDING,
      amount: Number(payment.amount),
      currency: payment.currency,
      method: payment.method,
      gatewayId: `bank_transfer_${Date.now()}`,
      processedAt: new Date()
    };
  }

  private async updateBookingPaymentStatus(bookingId: string, status: PaymentStatus) {
    try {
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          paymentStatus: status === PaymentStatus.COMPLETED ? 'COMPLETED' : 'PENDING'
        }
      });
    } catch (error) {
      logger.error('Error updating booking payment status:', error);
    }
  }

  private async processRazorpayRefund(payment: Payment, amount: number, reason: string) {
    try {
      const refund = await razorpay.payments.refund(payment.gatewayId!, {
        amount: Math.round(amount * 100), // Convert to paise
        notes: {
          reason: reason
        }
      });

      return {
        gatewayId: refund.id,
        gatewayData: refund
      };
    } catch (error) {
      logger.error('Error processing Razorpay refund:', error);
      throw error;
    }
  }

  private async processPayTabsRefund(payment: Payment, amount: number, reason: string) {
    // Mock PayTabs refund processing
    return {
      gatewayId: `refund_${Date.now()}`,
      gatewayData: {
        amount: amount,
        reason: reason,
        status: 'processed'
      }
    };
  }
}

export default PaymentService;