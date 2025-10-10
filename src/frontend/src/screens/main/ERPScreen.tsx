import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  ScrollView,
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
  ProgressBar,
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';

import { RootState, AppDispatch } from '../../store';
import { setTransactions, setPayments, setLoading, setError } from '../../store/slices/erpSlice';
import offlineService from '../../services/offlineService';
import syncService from '../../services/syncService';
import I18nService from '../../services/i18nService';

const ERPScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();
  const { transactions, payments, summary, isLoading } = useSelector((state: RootState) => state.erp);
  const { isOnline } = useSelector((state: RootState) => state.offline);
  
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    loadData();
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
    // This would make API calls to fetch financial data
    // For now, we'll load from offline storage
    await loadFromOffline();
  };

  const loadFromOffline = async () => {
    const [offlineTransactions, offlinePayments] = await Promise.all([
      offlineService.getTransactions(),
      offlineService.getPayments(),
    ]);
    
    dispatch(setTransactions(offlineTransactions));
    dispatch(setPayments(offlinePayments));
  };

  const handleRefresh = () => {
    loadData();
  };

  const handleCreateTransaction = () => {
    // Navigate to create transaction screen
  };

  const handleTransactionPress = (transaction: any) => {
    // Navigate to transaction details
  };

  const getFilteredTransactions = () => {
    let filtered = transactions;

    if (searchQuery) {
      filtered = filtered.filter(transaction =>
        transaction.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.reference?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(transaction => transaction.type === filterType);
    }

    return filtered;
  };

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'INCOME': '#4CAF50',
      'EXPENSE': '#F44336',
      'TRANSFER': '#2196F3',
      'REFUND': '#FF9800',
    };
    return colors[type] || '#757575';
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'PENDING': '#FF9800',
      'COMPLETED': '#4CAF50',
      'FAILED': '#F44336',
      'CANCELLED': '#757575',
    };
    return colors[status] || '#757575';
  };

  const renderTransaction = ({ item }: { item: any }) => (
    <Card style={styles.itemCard} onPress={() => handleTransactionPress(item)}>
      <Card.Content>
        <View style={styles.itemHeader}>
          <Title style={styles.itemTitle}>{item.description || item.category}</Title>
          <Text style={[styles.amountText, { color: getTypeColor(item.type) }]}>
            {item.type === 'INCOME' ? '+' : '-'}₹{item.amount.toLocaleString()}
          </Text>
        </View>
        <Paragraph style={styles.itemSubtitle}>{item.category}</Paragraph>
        <View style={styles.itemDetails}>
          <Chip
            mode="outlined"
            style={[styles.typeChip, { borderColor: getTypeColor(item.type) }]}
            textStyle={{ color: getTypeColor(item.type) }}
          >
            {item.type}
          </Chip>
          <Chip
            mode="outlined"
            style={[styles.statusChip, { borderColor: getStatusColor(item.status) }]}
            textStyle={{ color: getStatusColor(item.status) }}
          >
            {item.status}
          </Chip>
        </View>
        <Text style={styles.dateText}>
          {new Date(item.date).toLocaleDateString()}
        </Text>
        {item.reference && (
          <Text style={styles.referenceText}>
            Ref: {item.reference}
          </Text>
        )}
      </Card.Content>
    </Card>
  );

  const renderOverview = () => (
    <ScrollView style={styles.overviewContainer}>
      {/* Financial Summary Cards */}
      <View style={styles.summaryContainer}>
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Title style={styles.summaryTitle}>Total Income</Title>
            <Text style={[styles.summaryAmount, { color: '#4CAF50' }]}>
              ₹{summary.totalIncome.toLocaleString()}
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.summaryCard}>
          <Card.Content>
            <Title style={styles.summaryTitle}>Total Expense</Title>
            <Text style={[styles.summaryAmount, { color: '#F44336' }]}>
              ₹{summary.totalExpense.toLocaleString()}
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.summaryCard}>
          <Card.Content>
            <Title style={styles.summaryTitle}>Net Profit</Title>
            <Text style={[styles.summaryAmount, { 
              color: summary.netProfit >= 0 ? '#4CAF50' : '#F44336' 
            }]}>
              ₹{summary.netProfit.toLocaleString()}
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.summaryCard}>
          <Card.Content>
            <Title style={styles.summaryTitle}>Profit Margin</Title>
            <Text style={[styles.summaryAmount, { 
              color: summary.profitMargin >= 0 ? '#4CAF50' : '#F44336' 
            }]}>
              {summary.profitMargin.toFixed(1)}%
            </Text>
          </Card.Content>
        </Card>
      </View>

      {/* Progress Indicators */}
      <Card style={styles.progressCard}>
        <Card.Content>
          <Title>Financial Health</Title>
          <View style={styles.progressItem}>
            <Text>Income vs Expense Ratio</Text>
            <ProgressBar
              progress={summary.totalIncome > 0 ? summary.totalExpense / summary.totalIncome : 0}
              color="#2196F3"
              style={styles.progressBar}
            />
          </View>
          <View style={styles.progressItem}>
            <Text>Completed Transactions</Text>
            <ProgressBar
              progress={summary.completedTransactions / (summary.completedTransactions + summary.pendingTransactions)}
              color="#4CAF50"
              style={styles.progressBar}
            />
          </View>
        </Card.Content>
      </Card>

      {/* Recent Transactions */}
      <Card style={styles.recentCard}>
        <Card.Content>
          <Title>Recent Transactions</Title>
          {summary.recentTransactions?.slice(0, 3).map((transaction: any) => (
            <View key={transaction.id} style={styles.recentItem}>
              <View style={styles.recentItemLeft}>
                <Text style={styles.recentItemTitle}>{transaction.description || transaction.category}</Text>
                <Text style={styles.recentItemDate}>
                  {new Date(transaction.date).toLocaleDateString()}
                </Text>
              </View>
              <Text style={[styles.recentItemAmount, { color: getTypeColor(transaction.type) }]}>
                {transaction.type === 'INCOME' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
              </Text>
            </View>
          ))}
        </Card.Content>
      </Card>

      {/* Currency formatting examples by region and locale */}
      <Card style={[styles.recentCard, { marginTop: 16 }]}>
        <Card.Content>
          <Title>Currency Formatting</Title>
          <Paragraph>
            UAE (English): {I18nService.getInstance().formatCurrencyByRegion(10000, 'UAE')}
          </Paragraph>
          <Paragraph>
            UAE (Arabic): {(() => { const svc = I18nService.getInstance(); svc['currentLanguage'] = 'ar'; return svc.formatCurrencyByRegion(10000, 'UAE'); })()}
          </Paragraph>
        </Card.Content>
      </Card>
    </ScrollView>
  );

  const filteredTransactions = getFilteredTransactions();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SegmentedButtons
          value={activeTab}
          onValueChange={setActiveTab}
          buttons={[
            { value: 'overview', label: 'Overview' },
            { value: 'transactions', label: 'Transactions' },
            { value: 'payments', label: 'Payments' },
          ]}
          style={styles.segmentedButtons}
        />
        
        {activeTab !== 'overview' && (
          <>
            <Searchbar
              placeholder={`Search ${activeTab}...`}
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
                onPress={() => setFilterType('all')}
                title="All Types"
              />
              <Menu.Item
                onPress={() => setFilterType('INCOME')}
                title="Income"
              />
              <Menu.Item
                onPress={() => setFilterType('EXPENSE')}
                title="Expense"
              />
              <Menu.Item
                onPress={() => setFilterType('TRANSFER')}
                title="Transfer"
              />
            </Menu>
          </>
        )}
      </View>

      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>Offline Mode - Data may not be up to date</Text>
        </View>
      )}

      {activeTab === 'overview' ? (
        renderOverview()
      ) : (
        <FlatList
          data={filteredTransactions}
          renderItem={renderTransaction}
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
              <Button mode="contained" onPress={handleCreateTransaction}>
                Create First Transaction
              </Button>
            </View>
          }
        />
      )}

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleCreateTransaction}
        label="Add Transaction"
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
  overviewContainer: {
    flex: 1,
    padding: 16,
  },
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryCard: {
    width: '48%',
    marginBottom: 8,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  progressCard: {
    marginBottom: 16,
    elevation: 2,
  },
  progressItem: {
    marginBottom: 16,
  },
  progressBar: {
    marginTop: 8,
  },
  recentCard: {
    elevation: 2,
  },
  recentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  recentItemLeft: {
    flex: 1,
  },
  recentItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  recentItemDate: {
    fontSize: 12,
    color: '#666',
  },
  recentItemAmount: {
    fontSize: 16,
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
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemSubtitle: {
    color: '#666',
    marginBottom: 8,
  },
  itemDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  typeChip: {
    marginRight: 8,
    marginBottom: 4,
  },
  statusChip: {
    marginRight: 8,
    marginBottom: 4,
  },
  dateText: {
    color: '#666',
    fontSize: 12,
  },
  referenceText: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
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

export default ERPScreen;