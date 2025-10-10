import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Card, Button, Chip, Badge } from 'react-native-paper';
import { PlotLayout, Block, Floor, Plot } from '../../../shared/types';

interface PlotAvailabilityViewerProps {
  projectId: string;
  onPlotSelect?: (plot: Plot) => void;
  onPlotBook?: (plot: Plot) => void;
}

const { width: screenWidth } = Dimensions.get('window');

const PlotAvailabilityViewer: React.FC<PlotAvailabilityViewerProps> = ({
  projectId,
  onPlotSelect,
  onPlotBook
}) => {
  const [layout, setLayout] = useState<PlotLayout | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // AI-powered layout generation (simulated)
  const generateAILayout = useCallback((projectId: string): PlotLayout => {
    // Simulate AI-generated layout based on project ID
    const blocks = ['A', 'B', 'C', 'D'];
    const floorsPerBlock = 5;
    const plotsPerFloor = 4;
    
    const blocks: Block[] = blocks.map((blockName, blockIndex) => {
      const floors: Floor[] = [];
      
      for (let floor = 1; floor <= floorsPerBlock; floor++) {
        const plots: Plot[] = [];
        
        for (let plotNum = 1; plotNum <= plotsPerFloor; plotNum++) {
          const plotId = `${blockName}${floor}${plotNum.toString().padStart(2, '0')}`;
          const statuses = ['available', 'sold', 'booked', 'maintenance'];
          const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
          
          // AI-generated pricing based on floor and position
          const basePrice = 5000000; // 50 Lakhs base
          const floorMultiplier = floor * 0.1; // 10% increase per floor
          const cornerBonus = (plotNum === 1 || plotNum === plotsPerFloor) ? 0.05 : 0; // 5% corner bonus
          const price = Math.round(basePrice * (1 + floorMultiplier + cornerBonus));
          
          // AI-generated area
          const baseArea = 1200; // 1200 sq ft
          const areaVariation = Math.random() * 200 - 100; // ±100 sq ft variation
          const area = Math.round(baseArea + areaVariation);
          
          // AI-generated amenities based on floor
          const amenities = floor >= 3 
            ? ['Balcony', 'Garden View', 'Premium Finish', 'Corner Unit']
            : ['Balcony', 'Garden View', 'Standard Finish'];
          
          // AI-generated facing direction
          const facings = ['North', 'South', 'East', 'West'];
          const facing = facings[Math.floor(Math.random() * facings.length)];
          
          // AI-generated Vastu compliance
          const vastuOptions = ['Vastu Compliant', 'Partial Vastu', 'Non-Vastu'];
          const vastu = vastuOptions[Math.floor(Math.random() * vastuOptions.length)];
          
          plots.push({
            id: plotId,
            number: plotId,
            status: randomStatus as any,
            price,
            area,
            bedrooms: 2 + Math.floor(Math.random() * 2), // 2-3 bedrooms
            bathrooms: 2 + Math.floor(Math.random() * 2), // 2-3 bathrooms
            facing,
            vastu,
            amenities,
            coordinates: {
              x: plotNum * 50,
              y: floor * 30,
              z: blockIndex * 100
            }
          });
        }
        
        floors.push({
          id: `floor_${blockName}_${floor}`,
          number: floor,
          plots
        });
      }
      
      const totalPlots = floors.reduce((sum, floor) => sum + floor.plots.length, 0);
      const availablePlots = floors.reduce((sum, floor) => 
        sum + floor.plots.filter(plot => plot.status === 'available').length, 0
      );
      const soldPlots = floors.reduce((sum, floor) => 
        sum + floor.plots.filter(plot => plot.status === 'sold').length, 0
      );
      
      return {
        id: `block_${blockName}`,
        name: `Block ${blockName}`,
        floors,
        totalPlots,
        availablePlots,
        soldPlots
      };
    });
    
    const totalPlots = blocks.reduce((sum, block) => sum + block.totalPlots, 0);
    const availablePlots = blocks.reduce((sum, block) => sum + block.availablePlots, 0);
    const soldPlots = blocks.reduce((sum, block) => sum + block.soldPlots, 0);
    
    return {
      id: `layout_${projectId}`,
      name: `AI Generated Layout - Project ${projectId}`,
      floors: 5,
      blocks,
      totalPlots,
      availablePlots,
      soldPlots
    };
  }, []);

  useEffect(() => {
    const loadLayout = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Generate AI layout
        const aiLayout = generateAILayout(projectId);
        setLayout(aiLayout);
        
        // Auto-select first block
        if (aiLayout.blocks.length > 0) {
          setSelectedBlock(aiLayout.blocks[0].id);
          setSelectedFloor(1);
        }
      } catch (err) {
        setError('Failed to load plot layout');
        console.error('Error loading layout:', err);
      } finally {
        setLoading(false);
      }
    };

    loadLayout();
  }, [projectId, generateAILayout]);

  const handlePlotPress = (plot: Plot) => {
    if (plot.status === 'available') {
      onPlotSelect?.(plot);
    } else {
      Alert.alert(
        'Plot Not Available',
        `This plot is currently ${plot.status}. Please select an available plot.`,
        [{ text: 'OK' }]
      );
    }
  };

  const handlePlotBook = (plot: Plot) => {
    if (plot.status === 'available') {
      onPlotBook?.(plot);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return '#4CAF50';
      case 'sold': return '#F44336';
      case 'booked': return '#FF9800';
      case 'maintenance': return '#9E9E9E';
      default: return '#9E9E9E';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Available';
      case 'sold': return 'Sold';
      case 'booked': return 'Booked';
      case 'maintenance': return 'Maintenance';
      default: return 'Unknown';
    }
  };

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
        <Text style={styles.loadingText}>Generating AI Layout...</Text>
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

  if (!layout) {
    return null;
  }

  const selectedBlockData = layout.blocks.find(block => block.id === selectedBlock);
  const selectedFloorData = selectedBlockData?.floors.find(floor => floor.number === selectedFloor);

  return (
    <View style={styles.container}>
      {/* Header */}
      <Card style={styles.headerCard}>
        <Card.Content>
          <Text style={styles.title}>{layout.name}</Text>
          <View style={styles.statsContainer}>
            <Chip icon="home" style={styles.statChip}>
              {layout.totalPlots} Total
            </Chip>
            <Chip icon="check-circle" style={[styles.statChip, { backgroundColor: '#4CAF50' }]}>
              {layout.availablePlots} Available
            </Chip>
            <Chip icon="sold" style={[styles.statChip, { backgroundColor: '#F44336' }]}>
              {layout.soldPlots} Sold
            </Chip>
          </View>
        </Card.Content>
      </Card>

      {/* Block Selection */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.blockSelector}>
        {layout.blocks.map((block) => (
          <TouchableOpacity
            key={block.id}
            style={[
              styles.blockButton,
              selectedBlock === block.id && styles.selectedBlockButton
            ]}
            onPress={() => {
              setSelectedBlock(block.id);
              setSelectedFloor(1);
            }}
          >
            <Text style={[
              styles.blockButtonText,
              selectedBlock === block.id && styles.selectedBlockButtonText
            ]}>
              {block.name}
            </Text>
            <Badge style={styles.blockBadge}>{block.availablePlots}</Badge>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Floor Selection */}
      {selectedBlockData && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.floorSelector}>
          {selectedBlockData.floors.map((floor) => (
            <TouchableOpacity
              key={floor.id}
              style={[
                styles.floorButton,
                selectedFloor === floor.number && styles.selectedFloorButton
              ]}
              onPress={() => setSelectedFloor(floor.number)}
            >
              <Text style={[
                styles.floorButtonText,
                selectedFloor === floor.number && styles.selectedFloorButtonText
              ]}>
                Floor {floor.number}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Plot Grid */}
      {selectedFloorData && (
        <ScrollView style={styles.plotContainer}>
          <View style={styles.plotGrid}>
            {selectedFloorData.plots.map((plot) => (
              <TouchableOpacity
                key={plot.id}
                style={[
                  styles.plotCard,
                  { borderColor: getStatusColor(plot.status) }
                ]}
                onPress={() => handlePlotPress(plot)}
              >
                <Card style={styles.plotCardInner}>
                  <Card.Content style={styles.plotContent}>
                    <View style={styles.plotHeader}>
                      <Text style={styles.plotNumber}>{plot.number}</Text>
                      <Chip
                        style={[styles.statusChip, { backgroundColor: getStatusColor(plot.status) }]}
                        textStyle={styles.statusChipText}
                      >
                        {getStatusText(plot.status)}
                      </Chip>
                    </View>
                    
                    <Text style={styles.plotPrice}>{formatPrice(plot.price)}</Text>
                    <Text style={styles.plotArea}>{plot.area} sq ft</Text>
                    
                    <View style={styles.plotDetails}>
                      <Text style={styles.plotDetailText}>
                        {plot.bedrooms} BHK • {plot.bathrooms} Bath
                      </Text>
                      <Text style={styles.plotDetailText}>
                        {plot.facing} Facing
                      </Text>
                      <Text style={styles.plotDetailText}>
                        {plot.vastu}
                      </Text>
                    </View>

                    {plot.status === 'available' && (
                      <Button
                        mode="contained"
                        style={styles.bookButton}
                        onPress={() => handlePlotBook(plot)}
                      >
                        Book Now
                      </Button>
                    )}
                  </Card.Content>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
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
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
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
    marginBottom: 12,
    color: '#333',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  blockSelector: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  blockButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedBlockButton: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  blockButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  selectedBlockButtonText: {
    color: '#fff',
  },
  blockBadge: {
    marginLeft: 8,
    backgroundColor: '#4CAF50',
  },
  floorSelector: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  floorButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedFloorButton: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  floorButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  selectedFloorButtonText: {
    color: '#fff',
  },
  plotContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  plotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  plotCard: {
    width: (screenWidth - 48) / 2,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  plotCardInner: {
    elevation: 2,
  },
  plotContent: {
    padding: 12,
  },
  plotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  plotNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statusChip: {
    height: 24,
  },
  statusChipText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  plotPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4,
  },
  plotArea: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  plotDetails: {
    marginBottom: 12,
  },
  plotDetailText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  bookButton: {
    borderRadius: 20,
  },
});

export default PlotAvailabilityViewer;
