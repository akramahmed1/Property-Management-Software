import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Card, Button, Chip, Badge, ProgressBar } from 'react-native-paper';
import { Property } from '../../../shared/types';
import { computeAdvancedScore } from '../services/aiScoring';

interface AIPropertyRecommendationProps {
  customerId?: string;
  preferences?: {
    budget?: { min: number; max: number };
    location?: string[];
    propertyType?: string[];
    bedrooms?: number;
    bathrooms?: number;
    amenities?: string[];
  };
  onPropertySelect?: (property: Property) => void;
  onPropertyBook?: (property: Property) => void;
}

interface AIRecommendation {
  property: Property;
  score: number;
  reasons: string[];
  matchPercentage: number;
  confidence?: number;
  conversionProbability?: number;
  usedML?: boolean;
}

const AIPropertyRecommendation: React.FC<AIPropertyRecommendationProps> = ({
  customerId,
  preferences = {},
  onPropertySelect,
  onPropertyBook
}) => {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  // AI-powered recommendation algorithm
  const generateAIRecommendations = async (preferences: any): Promise<AIRecommendation[]> => {
    // Simulate AI analysis with mock data
    const mockProperties: Property[] = [
      {
        id: '1',
        name: 'Luxury Villa in Palm Jumeirah',
        type: 'VILLA',
        status: 'AVAILABLE',
        location: 'Palm Jumeirah, Dubai',
        address: 'Palm Jumeirah, Dubai, UAE',
        city: 'Dubai',
        state: 'Dubai',
        country: 'UAE',
        price: 15000000,
        area: 3500,
        bedrooms: 4,
        bathrooms: 5,
        floors: 2,
        facing: 'Sea',
        vastu: 'Vastu Compliant',
        amenities: ['Swimming Pool', 'Garden', 'Gym', 'Security', 'Parking'],
        features: ['Sea View', 'Private Beach', 'Smart Home', 'Solar Panels'],
        description: 'Luxury villa with stunning sea views and private beach access',
        images: [],
        videos: [],
        documents: [],
        isActive: true,
        isFeatured: true,
        views: 150,
        inquiries: 25,
        bookings: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdById: 'system',
        updatedById: 'system'
      },
      {
        id: '2',
        name: 'Modern Apartment in Downtown',
        type: 'APARTMENT',
        status: 'AVAILABLE',
        location: 'Downtown Dubai',
        address: 'Downtown Dubai, UAE',
        city: 'Dubai',
        state: 'Dubai',
        country: 'UAE',
        price: 3500000,
        area: 1200,
        bedrooms: 2,
        bathrooms: 2,
        floors: 1,
        facing: 'City',
        vastu: 'Vastu Compliant',
        amenities: ['Gym', 'Swimming Pool', 'Concierge', 'Parking'],
        features: ['City View', 'Balcony', 'Modern Kitchen'],
        description: 'Modern apartment in the heart of Downtown Dubai',
        images: [],
        videos: [],
        documents: [],
        isActive: true,
        isFeatured: false,
        views: 89,
        inquiries: 12,
        bookings: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdById: 'system',
        updatedById: 'system'
      },
      {
        id: '3',
        name: 'Spacious Villa in Jumeirah',
        type: 'VILLA',
        status: 'AVAILABLE',
        location: 'Jumeirah, Dubai',
        address: 'Jumeirah, Dubai, UAE',
        city: 'Dubai',
        state: 'Dubai',
        country: 'UAE',
        price: 8500000,
        area: 2800,
        bedrooms: 3,
        bathrooms: 4,
        floors: 2,
        facing: 'Garden',
        vastu: 'Vastu Compliant',
        amenities: ['Garden', 'Swimming Pool', 'Gym', 'Security'],
        features: ['Garden View', 'Private Pool', 'BBQ Area'],
        description: 'Spacious villa with beautiful garden and private pool',
        images: [],
        videos: [],
        documents: [],
        isActive: true,
        isFeatured: true,
        views: 120,
        inquiries: 18,
        bookings: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdById: 'system',
        updatedById: 'system'
      }
    ];

    // AI scoring algorithm using ML service
    const calculateAIScore = async (property: Property, prefs: any): Promise<AIRecommendation> => {
      const mlResult = await computeAdvancedScore(property, prefs);
      let score = 0;
      const reasons: string[] = [];

      // Budget matching (40% weight)
      if (prefs.budget) {
        const { min, max } = prefs.budget;
        if (property.price >= min && property.price <= max) {
          score += 40;
          reasons.push('Perfect budget match');
        } else if (property.price < min * 1.2) {
          score += 30;
          reasons.push('Within budget range');
        } else if (property.price > max * 0.8) {
          score += 20;
          reasons.push('Slightly above budget but good value');
        } else {
          score += 5;
          reasons.push('Budget mismatch');
        }
      } else {
        score += 20; // Default score if no budget preference
      }

      // Location matching (25% weight)
      if (prefs.location && prefs.location.length > 0) {
        const locationMatch = prefs.location.some((loc: string) => 
          property.location.toLowerCase().includes(loc.toLowerCase())
        );
        if (locationMatch) {
          score += 25;
          reasons.push('Preferred location');
        } else {
          score += 10;
          reasons.push('Different location');
        }
      } else {
        score += 15; // Default score if no location preference
      }

      // Property type matching (15% weight)
      if (prefs.propertyType && prefs.propertyType.length > 0) {
        if (prefs.propertyType.includes(property.type)) {
          score += 15;
          reasons.push('Preferred property type');
        } else {
          score += 5;
          reasons.push('Different property type');
        }
      } else {
        score += 10; // Default score if no type preference
      }

      // Bedrooms matching (10% weight)
      if (prefs.bedrooms) {
        if (property.bedrooms === prefs.bedrooms) {
          score += 10;
          reasons.push('Exact bedroom count match');
        } else if (property.bedrooms && Math.abs(property.bedrooms - prefs.bedrooms) === 1) {
          score += 7;
          reasons.push('Close bedroom count match');
        } else {
          score += 3;
          reasons.push('Bedroom count differs');
        }
      } else {
        score += 5; // Default score if no bedroom preference
      }

      // Amenities matching (10% weight)
      if (prefs.amenities && prefs.amenities.length > 0) {
        const amenityMatches = prefs.amenities.filter((amenity: string) =>
          property.amenities.some(propAmenity => 
            propAmenity.toLowerCase().includes(amenity.toLowerCase())
          )
        ).length;
        const amenityScore = (amenityMatches / prefs.amenities.length) * 10;
        score += amenityScore;
        if (amenityMatches > 0) {
          reasons.push(`${amenityMatches} preferred amenities available`);
        }
      } else {
        score += 5; // Default score if no amenity preference
      }

      // Additional AI factors
      if (property.isFeatured) {
        score += 5;
        reasons.push('Featured property');
      }

      if (property.views > 100) {
        score += 3;
        reasons.push('Popular choice');
      }

      if (property.inquiries > 20) {
        score += 2;
        reasons.push('High demand');
      }

      // Use ML result instead of old rule-based
      return {
        property,
        score: mlResult.score,
        reasons: mlResult.reasons,
        matchPercentage: Math.round(mlResult.score * 100),
        confidence: mlResult.confidence,
        conversionProbability: mlResult.conversionProbability,
        usedML: mlResult.usedML,
      };
    };

    // Generate recommendations using ML scoring
    const recommendations = await Promise.all(
      mockProperties.map(property => calculateAIScore(property as any, preferences))
    );

    // Sort by score (highest first)
    return recommendations.sort((a, b) => b.score - a.score);
  };

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        setLoading(true);
        setError(null);

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Generate AI recommendations using ML
        const aiRecommendations = await generateAIRecommendations(preferences);
        setRecommendations(aiRecommendations);

      } catch (err) {
        setError('Failed to load AI recommendations');
        console.error('Error loading recommendations:', err);
      } finally {
        setLoading(false);
      }
    };

    loadRecommendations();
  }, [preferences, customerId]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FF9800';
    return '#F44336';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'High Match';
    if (score >= 60) return 'Medium Match';
    return 'Low Match';
  };

  const filteredRecommendations = recommendations.filter(rec => {
    switch (selectedTab) {
      case 'high': return rec.score >= 80;
      case 'medium': return rec.score >= 60 && rec.score < 80;
      case 'low': return rec.score < 60;
      default: return true;
    }
  });

  const formatPrice = (price: number) => {
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(1)} Cr`;
    } else if (price >= 100000) {
      return `₹${(price / 100000).toFixed(1)} L`;
    } else {
      return `₹${price.toLocaleString()}`;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>AI is analyzing your preferences...</Text>
        <ProgressBar progress={0.7} color="#2196F3" style={styles.progressBar} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={() => window.location.reload()}>
          Retry
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <Card style={styles.headerCard}>
        <Card.Content>
          <Text style={styles.title}>AI-Powered Recommendations</Text>
          <Text style={styles.subtitle}>
            Based on your preferences and market analysis
          </Text>
        </Card.Content>
      </Card>

      {/* Filter Tabs */}
      <View style={styles.tabContainer}>
        {[
          { key: 'all', label: 'All', count: recommendations.length },
          { key: 'high', label: 'High Match', count: recommendations.filter(r => r.score >= 80).length },
          { key: 'medium', label: 'Medium Match', count: recommendations.filter(r => r.score >= 60 && r.score < 80).length },
          { key: 'low', label: 'Low Match', count: recommendations.filter(r => r.score < 60).length }
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              selectedTab === tab.key && styles.selectedTab
            ]}
            onPress={() => setSelectedTab(tab.key as any)}
          >
            <Text style={[
              styles.tabText,
              selectedTab === tab.key && styles.selectedTabText
            ]}>
              {tab.label}
            </Text>
            <Badge style={styles.tabBadge}>{tab.count}</Badge>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recommendations List */}
      <ScrollView style={styles.recommendationsList}>
        {filteredRecommendations.map((recommendation, index) => (
          <Card key={recommendation.property.id} style={styles.recommendationCard}>
            <Card.Content>
              {/* Property Header */}
              <View style={styles.propertyHeader}>
                <View style={styles.propertyInfo}>
                  <Text style={styles.propertyName}>{recommendation.property.name}</Text>
                  <Text style={styles.propertyLocation}>{recommendation.property.location}</Text>
                  <Text style={styles.propertyPrice}>{formatPrice(recommendation.property.price)}</Text>
                </View>
                <View style={styles.scoreContainer}>
                  <Chip
                    style={[
                      styles.scoreChip,
                      { backgroundColor: getScoreColor(recommendation.score) }
                    ]}
                    textStyle={styles.scoreChipText}
                  >
                    {recommendation.matchPercentage}%
                  </Chip>
                  <Text style={styles.scoreLabel}>
                    {getScoreLabel(recommendation.score)}
                  </Text>
                </View>
              </View>

              {/* Property Details */}
              <View style={styles.propertyDetails}>
                <Text style={styles.propertyArea}>{recommendation.property.area} sq ft</Text>
                <Text style={styles.propertyType}>
                  {recommendation.property.bedrooms} BHK • {recommendation.property.type}
                </Text>
                <Text style={styles.propertyFacing}>
                  {recommendation.property.facing} Facing • {recommendation.property.vastu}
                </Text>
              </View>

              {/* ML Metadata */}
              {recommendation.usedML && (
                <View style={styles.mlMetadataContainer}>
                  <Chip icon="brain" style={styles.mlChip} textStyle={{ fontSize: 10 }}>
                    ML-Powered
                  </Chip>
                  {recommendation.confidence !== undefined && (
                    <Text style={styles.mlText}>
                      Confidence: {Math.round(recommendation.confidence * 100)}%
                    </Text>
                  )}
                </View>
              )}

              {/* AI Reasons */}
              <View style={styles.reasonsContainer}>
                <Text style={styles.reasonsTitle}>Why this property matches:</Text>
                {recommendation.reasons.map((reason, reasonIndex) => (
                  <Chip
                    key={reasonIndex}
                    style={styles.reasonChip}
                    textStyle={styles.reasonChipText}
                  >
                    {reason}
                  </Chip>
                ))}
              </View>

              {/* Amenities */}
              <View style={styles.amenitiesContainer}>
                <Text style={styles.amenitiesTitle}>Key Amenities:</Text>
                <View style={styles.amenitiesList}>
                  {recommendation.property.amenities.slice(0, 4).map((amenity, amenityIndex) => (
                    <Chip
                      key={amenityIndex}
                      style={styles.amenityChip}
                      textStyle={styles.amenityChipText}
                    >
                      {amenity}
                    </Chip>
                  ))}
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <Button
                  mode="outlined"
                  style={styles.actionButton}
                  onPress={() => onPropertySelect?.(recommendation.property)}
                >
                  View Details
                </Button>
                <Button
                  mode="contained"
                  style={styles.actionButton}
                  onPress={() => onPropertyBook?.(recommendation.property)}
                >
                  Book Now
                </Button>
              </View>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  progressBar: {
    width: 200,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    marginBottom: 20,
    textAlign: 'center',
  },
  headerCard: {
    margin: 16,
    elevation: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedTab: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
  selectedTabText: {
    color: '#fff',
  },
  tabBadge: {
    marginLeft: 4,
    backgroundColor: '#4CAF50',
  },
  recommendationsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  recommendationCard: {
    marginBottom: 16,
    elevation: 2,
  },
  propertyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  propertyInfo: {
    flex: 1,
  },
  propertyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  propertyLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  propertyPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scoreChip: {
    height: 32,
  },
  scoreChipText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },
  mlMetadataContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  mlChip: {
    height: 24,
    backgroundColor: '#673AB7',
    marginRight: 8,
  },
  mlText: {
    fontSize: 11,
    color: '#673AB7',
    marginRight: 12,
    fontWeight: '600',
  },
  propertyDetails: {
    marginBottom: 12,
  },
  propertyArea: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  propertyType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  propertyFacing: {
    fontSize: 14,
    color: '#666',
  },
  reasonsContainer: {
    marginBottom: 12,
  },
  reasonsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  reasonChip: {
    marginRight: 8,
    marginBottom: 4,
    backgroundColor: '#E3F2FD',
  },
  reasonChipText: {
    fontSize: 10,
    color: '#1976D2',
  },
  amenitiesContainer: {
    marginBottom: 16,
  },
  amenitiesTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  amenitiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  amenityChip: {
    marginRight: 8,
    marginBottom: 4,
    backgroundColor: '#F3E5F5',
  },
  amenityChipText: {
    fontSize: 10,
    color: '#7B1FA2',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
});

export default AIPropertyRecommendation;
