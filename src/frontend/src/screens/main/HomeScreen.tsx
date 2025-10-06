import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import {
  Text,
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  FAB,
  Surface,
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';

import { RootState, AppDispatch } from '../../store';
import { fetchProperties } from '../../store/slices/propertySlice';

const HomeScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();
  const { user } = useSelector((state: RootState) => state.auth);
  const { properties, isLoading } = useSelector((state: RootState) => state.property);
  const { isOnline } = useSelector((state: RootState) => state.offline);

  useEffect(() => {
    dispatch(fetchProperties({ limit: 5 }));
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(fetchProperties({ limit: 5 }));
  };

  const handleViewAllProperties = () => {
    navigation.navigate('Properties' as never);
  };

  const handleCreateProperty = () => {
    navigation.navigate('Properties' as never, { screen: 'CreateProperty' } as never);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <Surface style={styles.header}>
          <Text style={styles.greeting}>
            {getGreeting()}, {user?.name || 'User'}!
          </Text>
          <Text style={styles.subtitle}>
            Welcome to Property Management
          </Text>
          {!isOnline && (
            <Chip icon="wifi-off" style={styles.offlineChip}>
              Offline Mode
            </Chip>
          )}
        </Surface>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Card.Content>
              <Title style={styles.statNumber}>{properties.length}</Title>
              <Paragraph style={styles.statLabel}>Properties</Paragraph>
            </Card.Content>
          </Card>
          <Card style={styles.statCard}>
            <Card.Content>
              <Title style={styles.statNumber}>0</Title>
              <Paragraph style={styles.statLabel}>Bookings</Paragraph>
            </Card.Content>
          </Card>
          <Card style={styles.statCard}>
            <Card.Content>
              <Title style={styles.statNumber}>0</Title>
              <Paragraph style={styles.statLabel}>Leads</Paragraph>
            </Card.Content>
          </Card>
        </View>

        {/* Recent Properties */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Title>Recent Properties</Title>
              <Button mode="text" onPress={handleViewAllProperties}>
                View All
              </Button>
            </View>
            {properties.length > 0 ? (
              properties.slice(0, 3).map((property) => (
                <Card key={property.id} style={styles.propertyCard}>
                  <Card.Content>
                    <Title style={styles.propertyTitle}>{property.name}</Title>
                    <Paragraph style={styles.propertyLocation}>
                      {property.location}
                    </Paragraph>
                    <View style={styles.propertyDetails}>
                      <Chip mode="outlined" style={styles.propertyChip}>
                        {property.type}
                      </Chip>
                      <Chip mode="outlined" style={styles.propertyChip}>
                        ₹{property.price.toLocaleString()}
                      </Chip>
                    </View>
                  </Card.Content>
                </Card>
              ))
            ) : (
              <Paragraph style={styles.emptyText}>
                No properties found. Create your first property!
              </Paragraph>
            )}
          </Card.Content>
        </Card>

        {/* Quick Actions */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Title>Quick Actions</Title>
            <View style={styles.quickActions}>
              <Button
                mode="contained"
                icon="plus"
                onPress={handleCreateProperty}
                style={styles.actionButton}
              >
                Add Property
              </Button>
              <Button
                mode="outlined"
                icon="people"
                onPress={() => navigation.navigate('CRM' as never)}
                style={styles.actionButton}
              >
                Manage Leads
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleCreateProperty}
        label="Add Property"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    marginBottom: 16,
    elevation: 2,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  offlineChip: {
    marginTop: 8,
    backgroundColor: '#FF9800',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
    textAlign: 'center',
  },
  statLabel: {
    textAlign: 'center',
    color: '#666',
  },
  sectionCard: {
    margin: 16,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  propertyCard: {
    marginBottom: 12,
    elevation: 1,
  },
  propertyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  propertyLocation: {
    color: '#666',
    marginBottom: 8,
  },
  propertyDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  propertyChip: {
    marginRight: 8,
    marginBottom: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginVertical: 20,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#2196F3',
  },
});

export default HomeScreen;
