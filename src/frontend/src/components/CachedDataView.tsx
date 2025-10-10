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
  List,
  Divider,
  Badge,
} from 'react-native-paper';
import { useSelector } from 'react-redux';

import { RootState } from '../store';
import offlineService from '../services/offlineService';
import { formatDate, formatCurrency } from '../utils/formatting';

interface CachedDataViewProps {
  dataType: 'properties' | 'leads' | 'customers' | 'transactions';
  onItemPress?: (item: any) => void;
  onRefresh?: () => void;
}

const CachedDataView: React.FC<CachedDataViewProps> = ({
  dataType,
  onItemPress,
  onRefresh,
}) => {
  const { isOnline } = useSelector((state: RootState) => state.offline);
  const [cachedData, setCachedData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    loadCachedData();
  }, [dataType]);

  const loadCachedData = async () => {
    setIsLoading(true);
    try {
      const offlineItems = await offlineService.getOfflineItems(dataType);
      const data = offlineItems.map(item => item.data);
      setCachedData(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading cached data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    loadCachedData();
    if (onRefresh) {
      onRefresh();
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'AVAILABLE': '#4CAF50',
      'SOLD': '#F44336',
      'RENTED': '#2196F3',
      'MAINTENANCE': '#FF9800',
      'DRAFT': '#757575',
      'NEW': '#FF9800',
      'CONTACTED': '#2196F3',
      'QUALIFIED': '#4CAF50',
      'PROPOSAL': '#9C27B0',
      'NEGOTIATION': '#FF5722',
      'CLOSED': '#4CAF50',
      'LOST': '#F44336',
      'PENDING': '#FF9800',
      'COMPLETED': '#4CAF50',
      'CANCELLED': '#F44336',
    };
    return colors[status] || '#757575';
  };

  const renderProperty = ({ item }: { item: any }) => (
    <Card style={styles.itemCard} onPress={() => onItemPress?.(item)}>
      <Card.Content>
        <View style={styles.itemHeader}>
          <Title style={styles.itemTitle}>{item.name || 'Unnamed Property'}</Title>
          <Chip
            mode="outlined"
            style={[styles.statusChip, { borderColor: getStatusColor(item.status) }]}
            textStyle={{ color: getStatusColor(item.status) }}
          >
            {item.status}
          </Chip>
        </View>
        
        <Paragraph style={styles.itemLocation}>{item.location}</Paragraph>
        <Paragraph style={styles.itemPrice}>
          {formatCurrency(item.price || 0, 'AED')}
        </Paragraph>
        
        <View style={styles.itemDetails}>
          <Text style={styles.detailText}>Type: {item.type}</Text>
          <Text style={styles.detailText}>Area: {item.area} sq ft</Text>
          {item.bedrooms && <Text style={styles.detailText}>Bedrooms: {item.bedrooms}</Text>}
        </View>
        
        <Badge style={styles.offlineBadge}>Cached</Badge>
      </Card.Content>
    </Card>
  );

  const renderLead = ({ item }: { item: any }) => (
    <Card style={styles.itemCard} onPress={() => onItemPress?.(item)}>
      <Card.Content>
        <View style={styles.itemHeader}>
          <Title style={styles.itemTitle}>{item.name || 'Unnamed Lead'}</Title>
          <Chip
            mode="outlined"
            style={[styles.statusChip, { borderColor: getStatusColor(item.status) }]}
            textStyle={{ color: getStatusColor(item.status) }}
          >
            {item.status}
          </Chip>
        </View>
        
        <Paragraph style={styles.itemEmail}>{item.email}</Paragraph>
        <Paragraph style={styles.itemPhone}>{item.phone}</Paragraph>
        
        <View style={styles.itemDetails}>
          <Text style={styles.detailText}>Source: {item.source}</Text>
          <Text style={styles.detailText}>Priority: {item.priority}</Text>
        </View>
        
        <Badge style={styles.offlineBadge}>Cached</Badge>
      </Card.Content>
    </Card>
  );

  const renderCustomer = ({ item }: { item: any }) => (
    <Card style={styles.itemCard} onPress={() => onItemPress?.(item)}>
      <Card.Content>
        <View style={styles.itemHeader}>
          <Title style={styles.itemTitle}>{item.name || 'Unnamed Customer'}</Title>
          <Chip
            mode="outlined"
            style={[styles.statusChip, { borderColor: getStatusColor(item.status) }]}
            textStyle={{ color: getStatusColor(item.status) }}
          >
            {item.status}
          </Chip>
        </View>
        
        <Paragraph style={styles.itemEmail}>{item.email}</Paragraph>
        <Paragraph style={styles.itemPhone}>{item.phone}</Paragraph>
        
        <View style={styles.itemDetails}>
          <Text style={styles.detailText}>Total Bookings: {item.totalBookings || 0}</Text>
          <Text style={styles.detailText}>Total Spent: {formatCurrency(item.totalSpent || 0, 'AED')}</Text>
        </View>
        
        <Badge style={styles.offlineBadge}>Cached</Badge>
      </Card.Content>
    </Card>
  );

  const renderTransaction = ({ item }: { item: any }) => (
    <Card style={styles.itemCard} onPress={() => onItemPress?.(item)}>
      <Card.Content>
        <View style={styles.itemHeader}>
          <Title style={styles.itemTitle}>{item.description || 'Transaction'}</Title>
          <Chip
            mode="outlined"
            style={[styles.statusChip, { borderColor: getStatusColor(item.status) }]}
            textStyle={{ color: getStatusColor(item.status) }}
          >
            {item.status}
          </Chip>
        </View>
        
        <Paragraph style={styles.itemAmount}>
          {item.type === 'INCOME' ? '+' : '-'}{formatCurrency(item.amount || 0, 'AED')}
        </Paragraph>
        
        <View style={styles.itemDetails}>
          <Text style={styles.detailText}>Type: {item.type}</Text>
          <Text style={styles.detailText}>Category: {item.category}</Text>
          <Text style={styles.detailText}>Date: {formatDate(new Date(item.date))}</Text>
        </View>
        
        <Badge style={styles.offlineBadge}>Cached</Badge>
      </Card.Content>
    </Card>
  );

  const renderItem = ({ item }: { item: any }) => {
    switch (dataType) {
      case 'properties':
        return renderProperty({ item });
      case 'leads':
        return renderLead({ item });
      case 'customers':
        return renderCustomer({ item });
      case 'transactions':
        return renderTransaction({ item });
      default:
        return null;
    }
  };

  const getEmptyMessage = () => {
    switch (dataType) {
      case 'properties':
        return 'No cached properties found';
      case 'leads':
        return 'No cached leads found';
      case 'customers':
        return 'No cached customers found';
      case 'transactions':
        return 'No cached transactions found';
      default:
        return 'No cached data found';
    }
  };

  const getTitle = () => {
    switch (dataType) {
      case 'properties':
        return 'Cached Properties';
      case 'leads':
        return 'Cached Leads';
      case 'customers':
        return 'Cached Customers';
      case 'transactions':
        return 'Cached Transactions';
      default:
        return 'Cached Data';
    }
  };

  return (
    <View style={styles.container}>
      <Card style={styles.headerCard}>
        <Card.Content>
          <View style={styles.headerContent}>
            <Title style={styles.headerTitle}>{getTitle()}</Title>
            <Badge style={styles.offlineBadge}>Offline Mode</Badge>
          </View>
          
          {lastUpdated && (
            <Paragraph style={styles.lastUpdatedText}>
              Last updated: {formatDate(lastUpdated)}
            </Paragraph>
          )}
          
          <Paragraph style={styles.offlineMessage}>
            You're viewing cached data. Some information may not be up to date.
          </Paragraph>
        </Card.Content>
      </Card>

      <FlatList
        data={cachedData}
        renderItem={renderItem}
        keyExtractor={(item, index) => item.id || index.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{getEmptyMessage()}</Text>
            <Button
              mode="outlined"
              onPress={handleRefresh}
              style={styles.refreshButton}
            >
              Refresh
            </Button>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerCard: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  lastUpdatedText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  offlineMessage: {
    fontSize: 14,
    color: '#FF9800',
    fontStyle: 'italic',
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  itemCard: {
    marginBottom: 16,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  statusChip: {
    marginLeft: 8,
  },
  itemLocation: {
    color: '#666',
    marginBottom: 4,
  },
  itemEmail: {
    color: '#666',
    marginBottom: 4,
  },
  itemPhone: {
    color: '#666',
    marginBottom: 8,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  itemAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  itemDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginRight: 16,
    marginBottom: 4,
  },
  offlineBadge: {
    backgroundColor: '#FF9800',
    alignSelf: 'flex-start',
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
  refreshButton: {
    marginTop: 8,
  },
});

export default CachedDataView;
