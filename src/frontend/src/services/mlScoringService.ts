import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';

/**
 * ML-based Property Scoring Service
 * Uses TensorFlow.js for predictive lead conversion and property matching
 */

interface PropertyFeatures {
  priceScore: number;
  locationScore: number;
  typeScore: number;
  bedroomsScore: number;
  amenitiesScore: number;
  areaScore: number;
  viewsCount: number;
  inquiriesCount: number;
  daysOnMarket: number;
}

interface MLScoreResult {
  score: number;
  confidence: number;
  conversionProbability: number;
  reasons: string[];
}

class MLScoringService {
  private static instance: MLScoringService;
  private model: tf.LayersModel | null = null;
  private modelLoaded: boolean = false;

  private constructor() {
    this.initializeModel();
  }

  public static getInstance(): MLScoringService {
    if (!MLScoringService.instance) {
      MLScoringService.instance = new MLScoringService();
    }
    return MLScoringService.instance;
  }

  /**
   * Initialize TensorFlow.js model
   * In production, load a pre-trained model from server
   */
  private async initializeModel(): Promise<void> {
    try {
      // Wait for TF.js to be ready
      await tf.ready();

      // Create a simple neural network for property scoring
      // In production, replace this with a trained model loaded from URL
      this.model = this.createScoringModel();
      this.modelLoaded = true;

      console.log('ML Scoring Model initialized successfully');
    } catch (error) {
      console.error('Failed to initialize ML model:', error);
      this.modelLoaded = false;
    }
  }

  /**
   * Create a simple neural network for property scoring
   * 9 input features -> 2 hidden layers -> 1 output (probability)
   */
  private createScoringModel(): tf.LayersModel {
    const model = tf.sequential();

    // Input layer (9 features)
    model.add(tf.layers.dense({
      inputShape: [9],
      units: 16,
      activation: 'relu',
      kernelInitializer: 'heNormal',
    }));

    // Hidden layer with dropout for regularization
    model.add(tf.layers.dropout({ rate: 0.2 }));
    model.add(tf.layers.dense({
      units: 8,
      activation: 'relu',
      kernelInitializer: 'heNormal',
    }));

    // Output layer (probability between 0 and 1)
    model.add(tf.layers.dense({
      units: 1,
      activation: 'sigmoid',
    }));

    // Compile model
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy'],
    });

    // Initialize with random weights (in production, use trained weights)
    return model;
  }

  /**
   * Extract features from property and preferences
   */
  private extractFeatures(property: any, preferences: any): PropertyFeatures {
    // Price score (0-1 normalized)
    let priceScore = 0;
    if (preferences?.budget) {
      const { min, max } = preferences.budget;
      const midpoint = (min + max) / 2;
      const range = max - min;
      const deviation = Math.abs(property.price - midpoint);
      priceScore = Math.max(0, 1 - (deviation / range));
    } else {
      priceScore = 0.5; // neutral if no preference
    }

    // Location score (0-1)
    let locationScore = 0.5;
    if (preferences?.location?.length) {
      const match = preferences.location.some((loc: string) => 
        property.location?.toLowerCase().includes(String(loc).toLowerCase())
      );
      locationScore = match ? 1 : 0.3;
    }

    // Type score (0-1)
    let typeScore = 0.5;
    if (preferences?.propertyType?.length) {
      typeScore = preferences.propertyType.includes(property.type) ? 1 : 0.3;
    }

    // Bedrooms score (0-1)
    let bedroomsScore = 0.5;
    if (preferences?.bedrooms && property.bedrooms) {
      const diff = Math.abs(property.bedrooms - preferences.bedrooms);
      bedroomsScore = Math.max(0, 1 - (diff * 0.25));
    }

    // Amenities score (0-1)
    let amenitiesScore = 0.5;
    if (preferences?.amenities?.length && property.amenities?.length) {
      const matches = preferences.amenities.filter((a: string) => 
        property.amenities.includes(a)
      ).length;
      amenitiesScore = matches / preferences.amenities.length;
    }

    // Area score (0-1)
    let areaScore = 0.5;
    if (preferences?.minArea && property.area) {
      areaScore = property.area >= preferences.minArea ? 1 : 0.3;
    }

    // Popularity indicators (normalized)
    const viewsCount = Math.min(1, (property.views || 0) / 100);
    const inquiriesCount = Math.min(1, (property.inquiries || 0) / 50);
    const daysOnMarket = Math.min(1, (property.daysOnMarket || 30) / 365);

    return {
      priceScore,
      locationScore,
      typeScore,
      bedroomsScore,
      amenitiesScore,
      areaScore,
      viewsCount,
      inquiriesCount,
      daysOnMarket,
    };
  }

  /**
   * Predict property score using ML model
   */
  public async predictScore(property: any, preferences: any): Promise<MLScoreResult> {
    try {
      // Fallback to rule-based if model not ready
      if (!this.modelLoaded || !this.model) {
        return this.fallbackRuleBasedScore(property, preferences);
      }

      // Extract features
      const features = this.extractFeatures(property, preferences);
      
      // Convert to tensor
      const inputTensor = tf.tensor2d([
        [
          features.priceScore,
          features.locationScore,
          features.typeScore,
          features.bedroomsScore,
          features.amenitiesScore,
          features.areaScore,
          features.viewsCount,
          features.inquiriesCount,
          features.daysOnMarket,
        ]
      ]);

      // Make prediction
      const prediction = this.model.predict(inputTensor) as tf.Tensor;
      const probability = (await prediction.data())[0];

      // Clean up tensors
      inputTensor.dispose();
      prediction.dispose();

      // Calculate confidence based on feature consistency
      const confidence = this.calculateConfidence(features);

      // Generate reasons
      const reasons = this.generateReasons(features, probability);

      return {
        score: probability,
        confidence,
        conversionProbability: probability,
        reasons,
      };
    } catch (error) {
      console.error('ML prediction error:', error);
      return this.fallbackRuleBasedScore(property, preferences);
    }
  }

  /**
   * Calculate confidence score based on feature quality
   */
  private calculateConfidence(features: PropertyFeatures): number {
    const scores = [
      features.priceScore,
      features.locationScore,
      features.typeScore,
      features.bedroomsScore,
      features.amenitiesScore,
    ];

    // Confidence is higher when features are more extreme (0 or 1)
    const extremeness = scores.reduce((sum, score) => {
      return sum + Math.abs(score - 0.5) * 2;
    }, 0) / scores.length;

    return extremeness;
  }

  /**
   * Generate human-readable reasons for the score
   */
  private generateReasons(features: PropertyFeatures, score: number): string[] {
    const reasons: string[] = [];

    if (features.priceScore > 0.8) {
      reasons.push('Excellent price match for your budget');
    } else if (features.priceScore < 0.3) {
      reasons.push('Price outside preferred range');
    }

    if (features.locationScore > 0.8) {
      reasons.push('Located in your preferred area');
    } else if (features.locationScore < 0.5) {
      reasons.push('Different location than preferred');
    }

    if (features.typeScore > 0.8) {
      reasons.push('Matches your property type preference');
    }

    if (features.bedroomsScore > 0.8) {
      reasons.push('Perfect bedroom count match');
    }

    if (features.amenitiesScore > 0.7) {
      reasons.push('Includes most of your desired amenities');
    }

    if (features.viewsCount > 0.5) {
      reasons.push('Popular property with high interest');
    }

    if (features.inquiriesCount > 0.5) {
      reasons.push('Many inquiries - act fast!');
    }

    if (score > 0.8) {
      reasons.push('🎯 Highly recommended based on ML analysis');
    } else if (score > 0.6) {
      reasons.push('Good match based on your preferences');
    } else if (score < 0.4) {
      reasons.push('May not fully match your requirements');
    }

    return reasons;
  }

  /**
   * Fallback to rule-based scoring if ML fails
   */
  private fallbackRuleBasedScore(property: any, preferences: any): MLScoreResult {
    const features = this.extractFeatures(property, preferences);
    
    // Weighted average of features (rule-based)
    const score = (
      features.priceScore * 0.4 +
      features.locationScore * 0.25 +
      features.typeScore * 0.15 +
      features.bedroomsScore * 0.1 +
      features.amenitiesScore * 0.1
    );

    const confidence = 0.7; // Lower confidence for rule-based
    const reasons = this.generateReasons(features, score);

    return {
      score,
      confidence,
      conversionProbability: score,
      reasons,
    };
  }

  /**
   * Batch prediction for multiple properties
   */
  public async predictBatch(
    properties: any[],
    preferences: any
  ): Promise<MLScoreResult[]> {
    const predictions = await Promise.all(
      properties.map(property => this.predictScore(property, preferences))
    );
    return predictions;
  }

  /**
   * Check if model is ready
   */
  public isReady(): boolean {
    return this.modelLoaded;
  }

  /**
   * Dispose of model and free memory
   */
  public dispose(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
      this.modelLoaded = false;
    }
  }
}

export default MLScoringService;
export { MLScoreResult };

