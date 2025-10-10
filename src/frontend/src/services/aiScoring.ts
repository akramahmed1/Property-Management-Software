import { Property } from '../../../shared/types';
import MLScoringService from './mlScoringService';

export interface AdvancedScoreResult {
  score: number;
  reasons: string[];
  confidence?: number;
  conversionProbability?: number;
  usedML?: boolean;
}

// Advanced AI scoring with TensorFlow.js ML model
export async function computeAdvancedScore(property: Property, prefs: any): Promise<AdvancedScoreResult> {
  const mlService = MLScoringService.getInstance();
  
  // Try ML-based scoring first
  if (mlService.isReady()) {
    try {
      const mlResult = await mlService.predictScore(property, prefs);
      return {
        score: mlResult.score,
        reasons: mlResult.reasons,
        confidence: mlResult.confidence,
        conversionProbability: mlResult.conversionProbability,
        usedML: true,
      };
    } catch (error) {
      console.warn('ML scoring failed, falling back to rule-based:', error);
    }
  }
  
  // Fallback to rule-based scoring
  return computeRuleBasedScore(property, prefs);
}

// Rule-based scoring (original implementation)
export function computeRuleBasedScore(property: Property, prefs: any): AdvancedScoreResult {
  let score = 0;
  const reasons: string[] = [];

  // Budget (40%)
  if (prefs?.budget) {
    const { min, max } = prefs.budget;
    if (property.price >= min && property.price <= max) {
      score += 40; reasons.push('Perfect budget match');
    } else if (property.price < min * 1.2) {
      score += 30; reasons.push('Within budget range');
    } else if (property.price <= max * 1.2) {
      score += 20; reasons.push('Slightly above preferred budget');
    }
  } else {
    score += 20; reasons.push('No budget preference provided');
  }

  // Location (25%)
  if (prefs?.location?.length) {
    const match = prefs.location.some((loc: string) => property.location?.toLowerCase().includes(String(loc).toLowerCase()));
    score += match ? 25 : 10; reasons.push(match ? 'Preferred location' : 'Different location');
  } else {
    score += 15; reasons.push('No location preference provided');
  }

  // Type (15%)
  if (prefs?.propertyType?.length) {
    const match = prefs.propertyType.includes(property.type as any);
    score += match ? 15 : 5; reasons.push(match ? 'Preferred property type' : 'Different property type');
  } else {
    score += 10; reasons.push('No property type preference provided');
  }

  // Bedrooms (10%)
  if (prefs?.bedrooms) {
    if (property.bedrooms === prefs.bedrooms) { score += 10; reasons.push('Exact bedroom match'); }
    else if (Math.abs((property.bedrooms || 0) - prefs.bedrooms) === 1) { score += 7; reasons.push('Close bedroom match'); }
    else { score += 3; reasons.push('Bedroom count differs'); }
  } else {
    score += 5; reasons.push('No bedrooms preference provided');
  }

  // Amenities (10%)
  if (prefs?.amenities?.length && property.amenities?.length) {
    const matched = prefs.amenities.filter((a: string) => property.amenities!.some(p => p.toLowerCase().includes(String(a).toLowerCase()))).length;
    const amenityScore = Math.min(10, (matched / prefs.amenities.length) * 10);
    score += amenityScore; if (matched) reasons.push(`${matched} preferred amenities available`);
  } else {
    score += 5; reasons.push('No amenities preference provided');
  }

  // Popularity signals
  // @ts-ignore optional fields in shared property
  if (property.isFeatured) { score += 5; reasons.push('Featured property'); }
  // @ts-ignore
  if ((property.views || 0) > 100) { score += 3; reasons.push('Popular choice'); }
  // @ts-ignore
  if ((property.inquiries || 0) > 20) { score += 2; reasons.push('High demand'); }

  return { 
    score: Math.min(100, Math.max(0, score)) / 100, // Normalize to 0-1
    reasons,
    confidence: 0.7,
    conversionProbability: Math.min(100, Math.max(0, score)) / 100,
    usedML: false,
  };
}


