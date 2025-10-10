import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  PanResponder,
  Animated,
  Alert
} from 'react-native';
import { Card, Button, Chip, IconButton } from 'react-native-paper';
import { PlotLayout, Block, Floor, Plot } from '../../../shared/types';

interface Layout3DViewerProps {
  layout: PlotLayout;
  onPlotSelect?: (plot: Plot) => void;
  onPlotBook?: (plot: Plot) => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const Layout3DViewer: React.FC<Layout3DViewerProps> = ({
  layout,
  onPlotSelect,
  onPlotBook
}) => {
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null);
  const [viewMode, setViewMode] = useState<'2D' | '3D'>('3D');
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        if (viewMode === '3D') {
          setRotation(prev => prev + gestureState.dx * 0.5);
        } else {
          setPan(prev => ({
            x: prev.x + gestureState.dx,
            y: prev.y + gestureState.dy
          }));
        }
      },
      onPanResponderRelease: () => {
        // Handle pan end if needed
      }
    })
  ).current;

  const handlePlotPress = (plot: Plot) => {
    setSelectedPlot(plot);
    onPlotSelect?.(plot);
  };

  const handlePlotBook = (plot: Plot) => {
    if (plot.status === 'available') {
      onPlotBook?.(plot);
    } else {
      Alert.alert(
        'Plot Not Available',
        `This plot is currently ${plot.status}. Please select an available plot.`,
        [{ text: 'OK' }]
      );
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

  const formatPrice = (price: number) => {
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(1)} Cr`;
    } else if (price >= 100000) {
      return `₹${(price / 100000).toFixed(1)} L`;
    } else {
      return `₹${price.toLocaleString()}`;
    }
  };

  const render3DBlock = (block: Block, blockIndex: number) => {
    const blockWidth = 200;
    const blockHeight = 300;
    const floorHeight = 60;
    
    return (
      <View
        key={block.id}
        style={[
          styles.block3D,
          {
            transform: [
              { translateX: blockIndex * 220 + pan.x },
              { translateY: pan.y },
              { rotateY: `${rotation}deg` },
              { scale: zoom }
            ],
            width: blockWidth,
            height: blockHeight,
          }
        ]}
      >
        {/* Block Label */}
        <View style={styles.blockLabel}>
          <Text style={styles.blockLabelText}>{block.name}</Text>
          <Chip style={styles.blockStatsChip}>
            {block.availablePlots}/{block.totalPlots}
          </Chip>
        </View>

        {/* Floors */}
        {block.floors.map((floor, floorIndex) => (
          <View
            key={floor.id}
            style={[
              styles.floor3D,
              {
                bottom: floorIndex * floorHeight,
                height: floorHeight,
                backgroundColor: floorIndex % 2 === 0 ? '#E3F2FD' : '#F3E5F5'
              }
            ]}
          >
            <Text style={styles.floorLabel}>F{floor.number}</Text>
            
            {/* Plots on this floor */}
            <View style={styles.plotsContainer}>
              {floor.plots.map((plot, plotIndex) => (
                <TouchableOpacity
                  key={plot.id}
                  style={[
                    styles.plot3D,
                    {
                      backgroundColor: getStatusColor(plot.status),
                      left: plotIndex * 45 + 10,
                      top: 10,
                    }
                  ]}
                  onPress={() => handlePlotPress(plot)}
                >
                  <Text style={styles.plot3DNumber}>{plot.number}</Text>
                  <Text style={styles.plot3DPrice}>
                    {formatPrice(plot.price).replace('₹', '')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </View>
    );
  };

  const render2DBlock = (block: Block, blockIndex: number) => {
    return (
      <View
        key={block.id}
        style={[
          styles.block2D,
          {
            transform: [
              { translateX: blockIndex * 250 + pan.x },
              { translateY: pan.y },
              { scale: zoom }
            ]
          }
        ]}
      >
        <View style={styles.block2DHeader}>
          <Text style={styles.block2DTitle}>{block.name}</Text>
          <Chip style={styles.block2DStats}>
            {block.availablePlots} Available
          </Chip>
        </View>

        <View style={styles.block2DContent}>
          {block.floors.map((floor) => (
            <View key={floor.id} style={styles.floor2D}>
              <Text style={styles.floor2DLabel}>Floor {floor.number}</Text>
              <View style={styles.floor2DPlots}>
                {floor.plots.map((plot) => (
                  <TouchableOpacity
                    key={plot.id}
                    style={[
                      styles.plot2D,
                      { backgroundColor: getStatusColor(plot.status) }
                    ]}
                    onPress={() => handlePlotPress(plot)}
                  >
                    <Text style={styles.plot2DNumber}>{plot.number}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Controls */}
      <View style={styles.controls}>
        <View style={styles.controlGroup}>
          <Button
            mode={viewMode === '2D' ? 'contained' : 'outlined'}
            onPress={() => setViewMode('2D')}
            style={styles.controlButton}
          >
            2D
          </Button>
          <Button
            mode={viewMode === '3D' ? 'contained' : 'outlined'}
            onPress={() => setViewMode('3D')}
            style={styles.controlButton}
          >
            3D
          </Button>
        </View>

        <View style={styles.controlGroup}>
          <IconButton
            icon="minus"
            onPress={() => setZoom(Math.max(0.5, zoom - 0.1))}
            style={styles.zoomButton}
          />
          <Text style={styles.zoomText}>{Math.round(zoom * 100)}%</Text>
          <IconButton
            icon="plus"
            onPress={() => setZoom(Math.min(2, zoom + 0.1))}
            style={styles.zoomButton}
          />
        </View>

        <Button
          mode="outlined"
          onPress={() => {
            setRotation(0);
            setPan({ x: 0, y: 0 });
            setZoom(1);
          }}
          style={styles.resetButton}
        >
          Reset
        </Button>
      </View>

      {/* 3D/2D View */}
      <View style={styles.viewContainer} {...panResponder.panHandlers}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {layout.blocks.map((block, index) => 
            viewMode === '3D' ? render3DBlock(block, index) : render2DBlock(block, index)
          )}
        </ScrollView>
      </View>

      {/* Selected Plot Details */}
      {selectedPlot && (
        <Card style={styles.selectedPlotCard}>
          <Card.Content>
            <View style={styles.selectedPlotHeader}>
              <Text style={styles.selectedPlotTitle}>Plot {selectedPlot.number}</Text>
              <Chip
                style={[
                  styles.selectedPlotStatus,
                  { backgroundColor: getStatusColor(selectedPlot.status) }
                ]}
                textStyle={styles.selectedPlotStatusText}
              >
                {selectedPlot.status.toUpperCase()}
              </Chip>
            </View>

            <View style={styles.selectedPlotDetails}>
              <Text style={styles.selectedPlotPrice}>{formatPrice(selectedPlot.price)}</Text>
              <Text style={styles.selectedPlotArea}>{selectedPlot.area} sq ft</Text>
              <Text style={styles.selectedPlotInfo}>
                {selectedPlot.bedrooms} BHK • {selectedPlot.bathrooms} Bath • {selectedPlot.facing} Facing
              </Text>
              <Text style={styles.selectedPlotVastu}>{selectedPlot.vastu}</Text>
            </View>

            {selectedPlot.status === 'available' && (
              <Button
                mode="contained"
                style={styles.bookButton}
                onPress={() => handlePlotBook(selectedPlot)}
              >
                Book This Plot
              </Button>
            )}
          </Card.Content>
        </Card>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    elevation: 2,
  },
  controlGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    marginHorizontal: 4,
  },
  zoomButton: {
    margin: 0,
  },
  zoomText: {
    fontSize: 14,
    fontWeight: '500',
    marginHorizontal: 8,
  },
  resetButton: {
    marginLeft: 8,
  },
  viewContainer: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  scrollContent: {
    padding: 20,
  },
  block3D: {
    position: 'relative',
    marginRight: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  blockLabel: {
    position: 'absolute',
    top: -30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  blockLabelText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  blockStatsChip: {
    backgroundColor: '#4CAF50',
  },
  floor3D: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
  },
  floorLabel: {
    position: 'absolute',
    top: 4,
    left: 4,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
  },
  plotsContainer: {
    position: 'relative',
    height: '100%',
  },
  plot3D: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  plot3DNumber: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  plot3DPrice: {
    fontSize: 8,
    color: '#fff',
  },
  block2D: {
    width: 200,
    marginRight: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2,
  },
  block2DHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  block2DTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  block2DStats: {
    backgroundColor: '#4CAF50',
  },
  block2DContent: {
    padding: 12,
  },
  floor2D: {
    marginBottom: 12,
  },
  floor2DLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  floor2DPlots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  plot2D: {
    width: 30,
    height: 30,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
    marginBottom: 4,
  },
  plot2DNumber: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  selectedPlotCard: {
    margin: 16,
    elevation: 4,
  },
  selectedPlotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectedPlotTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  selectedPlotStatus: {
    height: 28,
  },
  selectedPlotStatusText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  selectedPlotDetails: {
    marginBottom: 16,
  },
  selectedPlotPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4,
  },
  selectedPlotArea: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  selectedPlotInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  selectedPlotVastu: {
    fontSize: 12,
    color: '#999',
  },
  bookButton: {
    borderRadius: 20,
  },
});

export default Layout3DViewer;
