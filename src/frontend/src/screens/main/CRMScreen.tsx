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
  SegmentedButtons,
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';

import { RootState, AppDispatch } from '../../store';
import { setLeads, setCustomers, setLoading, setError } from '../../store/slices/crmSlice';
import offlineService, { SyncConflict, ConflictResolution } from '../../services/offlineService';
import syncService from '../../services/syncService';
import io from 'socket.io-client';
import ConflictResolutionDialog from '../../components/ConflictResolutionDialog';

const CRMScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();
  const { leads, customers, isLoading } = useSelector((state: RootState) => state.crm);
  const { isOnline } = useSelector((state: RootState) => state.offline);
  
  const [activeTab, setActiveTab] = useState('leads');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [showConflictDialog, setShowConflictDialog] = useState(false);

  useEffect(() => {
    loadData();
    
    // Set up conflict listener
    const handleConflicts = (detectedConflicts: SyncConflict[]) => {
      setConflicts(detectedConflicts);
      setShowConflictDialog(true);
    };
    
    const service = offlineService.getInstance();
    service.addConflictListener(handleConflicts);
    
    // Realtime: subscribe to lead/customer updates
    const socket = io(String(process.env.EXPO_PUBLIC_WS_URL || process.env.WS_URL || 'http://localhost:3000'));
    socket.on('lead_created', () => loadData());
    socket.on('lead_updated', () => loadData());
    socket.on('lead_deleted', () => loadData());
    socket.on('customer_updated', () => loadData());
    
    return () => {
      socket.disconnect();
      service.removeConflictListener(handleConflicts);
    };
  }, []);

  const loadData = async () => {
    dispatch(setLoading(true));
    try {
      if (isOnline) {
        // Load from API
        await loadFromAPI();
      } else {
        // Load from offline storage
        await loadFromOffline();
      }
    } catch (error) {
      dispatch(setError('Failed to load data'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const loadFromAPI = async () => {
    // This would make API calls to fetch leads and customers
    // For now, we'll load from offline storage
    await loadFromOffline();
  };

  const loadFromOffline = async () => {
    const [offlineLeads, offlineCustomers] = await Promise.all([
      offlineService.getLeads(),
      offlineService.getCustomers(),
    ]);
    
    dispatch(setLeads(offlineLeads));
    dispatch(setCustomers(offlineCustomers));
  };

  const handleRefresh = () => {
    loadData();
  };

  const handleCreateLead = () => {
    // Navigate to create lead screen
    navigation.navigate('LeadDetail' as never);
  };

  const handleCreateCustomer = () => {
    // Navigate to create customer screen
    navigation.navigate('CustomerDetail' as never);
  };

  const handleLeadPress = (lead: any) => {
    navigation.navigate('LeadDetail' as never, { leadId: lead.id } as never);
  };

  const handleCustomerPress = (customer: any) => {
    navigation.navigate('CustomerDetail' as never, { customerId: customer.id } as never);
  };

  const handleViewCustomerPortal = () => {
    navigation.navigate('CustomerPortal' as never);
  };

  const getFilteredLeads = () => {
    let filtered = leads;

    if (searchQuery) {
      filtered = filtered.filter(lead =>
        lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.phone.includes(searchQuery)
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(lead => lead.status === filterStatus);
    }

    return filtered;
  };

  const getFilteredCustomers = () => {
    let filtered = customers;

    if (searchQuery) {
      filtered = filtered.filter(customer =>
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone.includes(searchQuery)
      );
    }

    return filtered;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FF9800';
    return '#F44336';
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'NEW': '#2196F3',
      'CONTACTED': '#FF9800',
      'QUALIFIED': '#4CAF50',
      'PROPOSAL': '#9C27B0',
      'NEGOTIATION': '#FF5722',
      'CLOSED_WON': '#4CAF50',
      'CLOSED_LOST': '#F44336',
    };
    return colors[status] || '#757575';
  };

  const renderLead = ({ item }: { item: any }) => (
    <Card style={styles.itemCard} onPress={() => handleLeadPress(item)}>
      <Card.Content>
        <View style={styles.itemHeader}>
          <Title style={styles.itemTitle}>{item.name}</Title>
          <Chip
            mode="outlined"
            style={[styles.scoreChip, { backgroundColor: getScoreColor(item.score) }]}
            textStyle={{ color: 'white' }}
          >
            {item.score}
          </Chip>
        </View>
        <Paragraph style={styles.itemSubtitle}>{item.email}</Paragraph>
        <Paragraph style={styles.itemPhone}>{item.phone}</Paragraph>
        <View style={styles.itemDetails}>
          <Chip
            mode="outlined"
            style={[styles.statusChip, { borderColor: getStatusColor(item.status) }]}
            textStyle={{ color: getStatusColor(item.status) }}
          >
            {item.status.replace('_', ' ')}
          </Chip>
          <Chip mode="outlined" style={styles.sourceChip}>
            {item.source}
          </Chip>
        </View>
        {item.budget && (
          <Paragraph style={styles.budgetText}>
            Budget: ₹{item.budget.toLocaleString()}
          </Paragraph>
        )}
      </Card.Content>
    </Card>
  );

  const renderCustomer = ({ item }: { item: any }) => (
    <Card style={styles.itemCard} onPress={() => handleCustomerPress(item)}>
      <Card.Content>
        <Title style={styles.itemTitle}>{item.name}</Title>
        <Paragraph style={styles.itemSubtitle}>{item.email}</Paragraph>
        <Paragraph style={styles.itemPhone}>{item.phone}</Paragraph>
        <View style={styles.itemDetails}>
          <Chip mode="outlined" style={styles.infoChip}>
            {item._count?.bookings || 0} Bookings
          </Chip>
          <Chip mode="outlined" style={styles.infoChip}>
            {item._count?.leads || 0} Leads
          </Chip>
        </View>
        {item.occupation && (
          <Paragraph style={styles.occupationText}>
            {item.occupation}
          </Paragraph>
        )}
      </Card.Content>
    </Card>
  );

  const filteredLeads = getFilteredLeads();
  const filteredCustomers = getFilteredCustomers();

  const handleResolveConflicts = async (resolutions: ConflictResolution[]) => {
    try {
      const service = offlineService.getInstance();
      await service.resolveConflicts(resolutions);
      setShowConflictDialog(false);
      setConflicts([]);
      // Reload data after resolution
      await loadData();
    } catch (error) {
      console.error('Failed to resolve conflicts:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Conflict Resolution Dialog */}
      <ConflictResolutionDialog
        visible={showConflictDialog}
        conflicts={conflicts}
        onResolve={handleResolveConflicts}
        onCancel={() => setShowConflictDialog(false)}
      />
      <View style={styles.header}>
        <SegmentedButtons
          value={activeTab}
          onValueChange={setActiveTab}
          buttons={[
            { value: 'leads', label: 'Leads' },
            { value: 'customers', label: 'Customers' },
          ]}
          style={styles.segmentedButtons}
        />
        <Searchbar
          placeholder={`Search ${activeTab}...`}
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
        <View style={styles.headerActions}>
          <Button
            mode="outlined"
            onPress={handleViewCustomerPortal}
            icon="account-circle"
            style={styles.portalButton}
          >
            Customer Portal
          </Button>
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
            onPress={() => setFilterStatus('all')}
            title="All Status"
          />
          <Menu.Item
            onPress={() => setFilterStatus('NEW')}
            title="New"
          />
          <Menu.Item
            onPress={() => setFilterStatus('CONTACTED')}
            title="Contacted"
          />
          <Menu.Item
            onPress={() => setFilterStatus('QUALIFIED')}
            title="Qualified"
          />
          <Menu.Item
            onPress={() => setFilterStatus('CLOSED_WON')}
            title="Closed Won"
          />
        </Menu>
      </View>

      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>Offline Mode - Data may not be up to date</Text>
        </View>
      )}

      <FlatList
        data={activeTab === 'leads' ? filteredLeads : filteredCustomers}
        renderItem={activeTab === 'leads' ? renderLead : renderCustomer}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No {activeTab} found
            </Text>
            <Button mode="contained" onPress={activeTab === 'leads' ? handleCreateLead : handleCreateCustomer}>
              Create First {activeTab === 'leads' ? 'Lead' : 'Customer'}
            </Button>
          </View>
        }
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={activeTab === 'leads' ? handleCreateLead : handleCreateCustomer}
        label={`Add ${activeTab === 'leads' ? 'Lead' : 'Customer'}`}
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
    padding: 16,
    backgroundColor: '#fff',
    elevation: 2,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  searchbar: {
    marginBottom: 8,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  portalButton: {
    marginRight: 8,
  },
  filterButton: {
    marginTop: 8,
  },
  offlineBanner: {
    backgroundColor: '#FF9800',
    padding: 8,
    alignItems: 'center',
  },
  offlineText: {
    color: 'white',
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
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
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  itemSubtitle: {
    color: '#666',
    marginBottom: 4,
  },
  itemPhone: {
    color: '#666',
    marginBottom: 8,
  },
  itemDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  scoreChip: {
    marginRight: 8,
    marginBottom: 4,
  },
  statusChip: {
    marginRight: 8,
    marginBottom: 4,
  },
  sourceChip: {
    marginRight: 8,
    marginBottom: 4,
  },
  infoChip: {
    marginRight: 8,
    marginBottom: 4,
  },
  budgetText: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  occupationText: {
    color: '#666',
    fontStyle: 'italic',
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

export default CRMScreen;