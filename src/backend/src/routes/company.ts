import { Router } from 'express';
import { Request, Response } from 'express';
import { db } from '../config/drizzle';
import { companies } from '../schema/drizzle';
import { eq } from 'drizzle-orm';
import { getRegionConfig, calculateTax, formatCurrency, getCurrentRegion } from '../../../shared/utils';
import { createSuccessResponse, createErrorResponse } from '../../../shared/utils';
import { logger } from '../utils/logger';

const router = Router();

/**
 * @swagger
 * /api/v1/company:
 *   get:
 *     summary: Get company information with region-specific compliance
 *     tags: [Company]
 *     parameters:
 *       - in: query
 *         name: region
 *         schema:
 *           type: string
 *           enum: [INDIA, UAE, SAUDI, QATAR]
 *         description: Region for compliance calculation
 *     responses:
 *       200:
 *         description: Company information with compliance details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     region:
 *                       type: string
 *                     currency:
 *                       type: string
 *                     gst:
 *                       type: string
 *                     vat:
 *                       type: string
 *                     taxRate:
 *                       type: number
 *                     taxName:
 *                       type: string
 *                     compliance:
 *                       type: object
 *                       properties:
 *                         taxRate:
 *                           type: number
 *                         taxName:
 *                           type: string
 *                         currency:
 *                           type: string
 *                         timezone:
 *                           type: string
 *                         dateFormat:
 *                           type: string
 *                         numberFormat:
 *                           type: string
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const region = (req.query.region as string) || getCurrentRegion();
    
    // Get company information from database
    const company = await db
      .select()
      .from(companies)
      .where(eq(companies.region, region))
      .limit(1);

    if (company.length === 0) {
      // Create default company if not exists
      const regionConfig = getRegionConfig(region as any);
      const newCompany = await db
        .insert(companies)
        .values({
          name: `Property Management Company - ${region}`,
          region: region as any,
          currency: regionConfig.currency,
          taxRate: regionConfig.taxRate.toString(),
          taxName: regionConfig.taxName,
          address: `Address for ${region}`,
          city: region === 'INDIA' ? 'Mumbai' : 'Dubai',
          state: region === 'INDIA' ? 'Maharashtra' : 'Dubai',
          country: region === 'INDIA' ? 'India' : 'UAE',
          isActive: true
        })
        .returning();

      const companyData = newCompany[0];
      const compliance = {
        taxRate: regionConfig.taxRate,
        taxName: regionConfig.taxName,
        currency: regionConfig.currency,
        timezone: regionConfig.timezone,
        dateFormat: regionConfig.dateFormat,
        numberFormat: regionConfig.numberFormat
      };

      logger.info(`Company created for region: ${region}`);
      
      return res.status(200).json(createSuccessResponse({
        ...companyData,
        compliance
      }, 'Company information retrieved successfully'));
    }

    const companyData = company[0];
    const regionConfig = getRegionConfig(region as any);
    const compliance = {
      taxRate: regionConfig.taxRate,
      taxName: regionConfig.taxName,
      currency: regionConfig.currency,
      timezone: regionConfig.timezone,
      dateFormat: regionConfig.dateFormat,
      numberFormat: regionConfig.numberFormat
    };

    logger.info(`Company information retrieved for region: ${region}`);
    
    res.status(200).json(createSuccessResponse({
      ...companyData,
      compliance
    }, 'Company information retrieved successfully'));

  } catch (error) {
    logger.error('Error retrieving company information:', error);
    res.status(500).json(createErrorResponse('Failed to retrieve company information', error));
  }
});

/**
 * @swagger
 * /api/v1/company/tax-calculate:
 *   post:
 *     summary: Calculate tax based on region
 *     tags: [Company]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Amount to calculate tax for
 *               region:
 *                 type: string
 *                 enum: [INDIA, UAE, SAUDI, QATAR]
 *                 description: Region for tax calculation
 *     responses:
 *       200:
 *         description: Tax calculation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     originalAmount:
 *                       type: number
 *                     taxAmount:
 *                       type: number
 *                     totalAmount:
 *                       type: number
 *                     taxRate:
 *                       type: number
 *                     taxName:
 *                       type: string
 *                     currency:
 *                       type: string
 *                     formattedAmount:
 *                       type: string
 */
router.post('/tax-calculate', async (req: Request, res: Response) => {
  try {
    const { amount, region } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json(createErrorResponse('Invalid amount provided'));
    }

    const currentRegion = region || getCurrentRegion();
    const regionConfig = getRegionConfig(currentRegion as any);
    
    const taxAmount = calculateTax(amount, currentRegion as any);
    const totalAmount = amount + taxAmount;
    
    const result = {
      originalAmount: amount,
      taxAmount,
      totalAmount,
      taxRate: regionConfig.taxRate,
      taxName: regionConfig.taxName,
      currency: regionConfig.currency,
      formattedAmount: formatCurrency(totalAmount, currentRegion as any),
      formattedTaxAmount: formatCurrency(taxAmount, currentRegion as any)
    };

    logger.info(`Tax calculated for amount ${amount} in region ${currentRegion}: ${taxAmount}`);
    
    res.status(200).json(createSuccessResponse(result, 'Tax calculated successfully'));

  } catch (error) {
    logger.error('Error calculating tax:', error);
    res.status(500).json(createErrorResponse('Failed to calculate tax', error));
  }
});

/**
 * @swagger
 * /api/v1/company/cities:
 *   get:
 *     summary: Get cities by region
 *     tags: [Company]
 *     parameters:
 *       - in: query
 *         name: region
 *         schema:
 *           type: string
 *           enum: [INDIA, UAE, SAUDI, QATAR]
 *         description: Region to get cities for
 *     responses:
 *       200:
 *         description: List of cities for the region
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       state:
 *                         type: string
 *                       country:
 *                         type: string
 *                       region:
 *                         type: string
 */
router.get('/cities', async (req: Request, res: Response) => {
  try {
    const region = (req.query.region as string) || getCurrentRegion();
    
    // Define cities by region
    const citiesByRegion = {
      INDIA: [
        { name: 'Mumbai', state: 'Maharashtra', country: 'India', region: 'INDIA' },
        { name: 'Delhi', state: 'Delhi', country: 'India', region: 'INDIA' },
        { name: 'Bangalore', state: 'Karnataka', country: 'India', region: 'INDIA' },
        { name: 'Chennai', state: 'Tamil Nadu', country: 'India', region: 'INDIA' },
        { name: 'Kolkata', state: 'West Bengal', country: 'India', region: 'INDIA' },
        { name: 'Hyderabad', state: 'Telangana', country: 'India', region: 'INDIA' },
        { name: 'Pune', state: 'Maharashtra', country: 'India', region: 'INDIA' },
        { name: 'Ahmedabad', state: 'Gujarat', country: 'India', region: 'INDIA' }
      ],
      UAE: [
        { name: 'Dubai', state: 'Dubai', country: 'UAE', region: 'UAE' },
        { name: 'Abu Dhabi', state: 'Abu Dhabi', country: 'UAE', region: 'UAE' },
        { name: 'Sharjah', state: 'Sharjah', country: 'UAE', region: 'UAE' },
        { name: 'Ajman', state: 'Ajman', country: 'UAE', region: 'UAE' },
        { name: 'Ras Al Khaimah', state: 'Ras Al Khaimah', country: 'UAE', region: 'UAE' },
        { name: 'Fujairah', state: 'Fujairah', country: 'UAE', region: 'UAE' },
        { name: 'Umm Al Quwain', state: 'Umm Al Quwain', country: 'UAE', region: 'UAE' }
      ],
      SAUDI: [
        { name: 'Riyadh', state: 'Riyadh', country: 'Saudi Arabia', region: 'SAUDI' },
        { name: 'Jeddah', state: 'Makkah', country: 'Saudi Arabia', region: 'SAUDI' },
        { name: 'Mecca', state: 'Makkah', country: 'Saudi Arabia', region: 'SAUDI' },
        { name: 'Medina', state: 'Medina', country: 'Saudi Arabia', region: 'SAUDI' },
        { name: 'Dammam', state: 'Eastern Province', country: 'Saudi Arabia', region: 'SAUDI' },
        { name: 'Khobar', state: 'Eastern Province', country: 'Saudi Arabia', region: 'SAUDI' }
      ],
      QATAR: [
        { name: 'Doha', state: 'Doha', country: 'Qatar', region: 'QATAR' },
        { name: 'Al Rayyan', state: 'Al Rayyan', country: 'Qatar', region: 'QATAR' },
        { name: 'Al Wakrah', state: 'Al Wakrah', country: 'Qatar', region: 'QATAR' },
        { name: 'Al Khor', state: 'Al Khor', country: 'Qatar', region: 'QATAR' }
      ]
    };

    const cities = citiesByRegion[region as keyof typeof citiesByRegion] || citiesByRegion.INDIA;
    
    logger.info(`Cities retrieved for region: ${region}, count: ${cities.length}`);
    
    res.status(200).json(createSuccessResponse(cities, 'Cities retrieved successfully'));

  } catch (error) {
    logger.error('Error retrieving cities:', error);
    res.status(500).json(createErrorResponse('Failed to retrieve cities', error));
  }
});

export default router;
