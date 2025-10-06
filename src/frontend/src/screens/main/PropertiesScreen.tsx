import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import {
  Text,
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  Searchbar,
  FAB,
  Menu,
  Divider,
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';

import { RootState, AppDispatch } from '../../store';
import { fetchProperties, setFilters } from '../../store/slices/propertySlice';

const PropertiesScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();
  const { properties, isLoading, filters } = useSelector((state: RootState) => state.property);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  useEffect(() => {
    dispatch(fetchProperties({ ...filters, search: searchQuery }));
  }, [dispatch, filters, searchQuery]);

  const handleRefresh = () => {
    dispatch(fetchProperties({ ...filters, search: searchQuery }));
  };

  const handlePropertyPress = (property: any) => {
    navigation.navigate('PropertyDetail' as never, { propertyId: property.id } as never);
  };

  const handleCreateProperty = () => {
    navigation.navigate('CreateProperty' as never);
  };

  const handleFilterChange = (filterType: string, value: string) => {
    dispatch(setFilters({ [filterType]: value }));
    setShowFilterMenu(false);
  };

  const clearFilters = () => {
    dispatch(setFilters({}));
    setSearchQuery('');
  };

  const renderProperty = ({ item }: { item: any }) => (
    <Card style={styles.propertyCard} onPress={() => handlePropertyPress(item)}>
      <Card.Content>
        <Title style={styles.propertyTitle}>{item.name}</Title>
        <Paragraph style={styles.propertyLocation}>{item.location}</Paragraph>
        <View style={styles.propertyDetails}>
          <Chip mode="outlined" style={styles.propertyChip}>
            {item.type}
          </Chip>
          <Chip mode="outlined" style={styles.propertyChip}>
            {item.status}
          </Chip>
        </View>
        <View style={styles.propertyInfo}>
          <Text style={styles.propertyPrice}>₹{item.price.toLocaleString()}</Text>
          <Text style={styles.propertyArea}>{item.area} sq ft</Text>
        </View>
      </Card.Content>
    </Card>
  );

  const hasActiveFilters = Object.values(filters).some(value => value);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Searchbar
          placeholder="Search properties..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
        <Menu
          visible={showFilterMenu}
          onDismiss={() => setShowFilterMenu(false)}
          anchor={
            <Button
              mode="outlined"
              onPress={() => setShowFilterMenu(true)}
              icon="filter"
              style={styles.filterButton}
            >
              Filter
            </Button>
          }
        >
          <Menu.Item
            onPress={() => handleFilterChange('status', 'AVAILABLE')}
            title="Available"
          />
          <Menu.Item
            onPress={() => handleFilterChange('status', 'BOOKED')}
            title="Booked"
          />
          <Menu.Item
            onPress={() => handleFilterChange('type', 'APARTMENT')}
            title="Apartment"
          />
          <Menu.Item
            onPress={() => handleFilterChange('type', 'VILLA')}
            title="Villa"
          />
          <Menu.Item
            onPress={() => handleFilterChange('type', 'PLOT')}
            title="Plot"
          />
          <Divider />
          <Menu.Item
            onPress={clearFilters}
            title="Clear Filters"
          />
        </Menu>
      </View>

      {hasActiveFilters && (
        <View style={styles.activeFilters}>
          <Text style={styles.filterLabel}>Active Filters:</Text>
          {filters.status && (
            <Chip
              mode="outlined"
              onClose={() => handleFilterChange('status', '')}
              style={styles.activeFilterChip}
            >
              Status: {filters.status}
            </Chip>
          )}
          {filters.type && (
            <Chip
              mode="outlined"
              onClose={() => handleFilterChange('type', '')}
              style={styles.activeFilterChip}
            >
              Type: {filters.type}
            </Chip>
          )}
        </View>
      )}

      <FlatList
        data={properties}
        renderItem={renderProperty}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No properties found</Text>
            <Button mode="contained" onPress={handleCreateProperty}>
              Create First Property
            </Button>
          </View>
        }
      />

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
  header: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    elevation: 2,
  },
  searchbar: {
    flex: 1,
    marginRight: 8,
  },
  filterButton: {
    marginLeft: 8,
  },
  activeFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterLabel: {
    marginRight: 8,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  activeFilterChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  listContainer: {
    padding: 16,
  },
  propertyCard: {
    marginBottom: 16,
    elevation: 2,
  },
  propertyTitle: {
    fontSize: 18,
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
    marginBottom: 8,
  },
  propertyChip: {
    marginRight: 8,
    marginBottom: 4,
  },
  propertyInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  propertyPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  propertyArea: {
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#2196F3',
  },
});

export default PropertiesScreen;
