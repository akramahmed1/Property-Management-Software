import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { Request, Response } from 'express';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment processing operations
 */

// Create payment order
router.post('/create-order', authenticate, async (req: Request, res: Response) => {
  try {
    const { amount, currency, customerId, bookingId, description, metadata } = req.body;
    const userId = (req as any).user.id;

    const paymentService = req.app.get('paymentService');

    // Create Razorpay order
    const order = await paymentService.createRazorpayOrder({
      amount,
      currency: currency || 'INR',
      customerId,
      bookingId,
      description,
      metadata,
    });

    // Create payment record
    const payment = await paymentService.createPayment(
      {
        amount,
        currency: currency || 'INR',
        customerId,
        bookingId,
        description,
        metadata,
      },
      order.orderId,
      userId
    );

    res.json({
      success: true,
      data: {
        order,
        payment,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Verify payment
router.post('/verify', authenticate, async (req: Request, res: Response) => {
  try {
    const { orderId, paymentId, signature } = req.body;

    const paymentService = req.app.get('paymentService');

    // Verify payment
    const isValid = await paymentService.verifyRazorpayPayment(orderId, paymentId, signature);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed',
      });
    }

    // Find and update payment
    const payment = await paymentService.updatePaymentStatus(
      orderId, // This would be the payment ID from database
      'COMPLETED',
      {
        paymentId,
        signature,
        verifiedAt: new Date(),
      }
    );

    res.json({
      success: true,
      data: payment,
      message: 'Payment verified successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get payment details
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const paymentService = req.app.get('paymentService');
    const payment = await paymentService.getPaymentDetails(id);

    res.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get payment details',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get payment history
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const {
      customerId,
      bookingId,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = req.query;

    const paymentService = req.app.get('paymentService');
    const result = await paymentService.getPaymentHistory({
      customerId: customerId as string,
      bookingId: bookingId as string,
      status: status as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get payment history',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Refund payment
router.post('/:id/refund', authenticate, authorize('SUPER_ADMIN', 'MANAGER'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, reason } = req.body;

    const paymentService = req.app.get('paymentService');
    const refund = await paymentService.refundPayment(id, amount, reason);

    res.json({
      success: true,
      data: refund,
      message: 'Payment refunded successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to refund payment',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Generate payment report
router.get('/reports/generate', authenticate, authorize('SUPER_ADMIN', 'MANAGER'), async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, format = 'json' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required',
      });
    }

    const paymentService = req.app.get('paymentService');
    const report = await paymentService.generatePaymentReport(
      new Date(startDate as string),
      new Date(endDate as string),
      format as 'json' | 'csv' | 'pdf'
    );

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate payment report',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Webhook endpoint for Razorpay
router.post('/webhook/razorpay', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    const payload = req.body;

    const paymentService = req.app.get('paymentService');
    await paymentService.processRazorpayWebhook(payload, signature);

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Webhook processing failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
