import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  FlatList,
} from 'react-native';
import {
  Text,
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  Divider,
  ProgressBar,
  List,
  Badge,
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';

import { RootState, AppDispatch } from '../../store';
import I18nService from '../../services/i18nService';
import { formatCurrency, formatDate } from '../../utils/formatting';

interface Booking {
  id: string;
  propertyId: string;
  propertyName: string;
  customerId: string;
  customerName: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  bookingDate: string;
  checkInDate: string;
  checkOutDate: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentSchedule: PaymentSchedule[];
}

interface PaymentSchedule {
  id: string;
  bookingId: string;
  dueDate: string;
  amount: number;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  description: string;
}

interface CustomerPortalState {
  bookings: Booking[];
  isLoading: boolean;
  error: string | null;
  summary: {
    totalBookings: number;
    activeBookings: number;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
    overduePayments: number;
  };
}

const CustomerPortalScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();
  const { user } = useSelector((state: RootState) => state.auth);
  const { isOnline } = useSelector((state: RootState) => state.offline);
  
  const [state, setState] = useState<CustomerPortalState>({
    bookings: [],
    isLoading: false,
    error: null,
    summary: {
      totalBookings: 0,
      activeBookings: 0,
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0,
      overduePayments: 0,
    },
  });

  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'payments'>('overview');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Mock data - in real app, this would come from API
      const mockBookings: Booking[] = [
        {
          id: '1',
          propertyId: 'prop1',
          propertyName: 'Luxury Villa in Dubai Marina',
          customerId: user?.id || 'customer1',
          customerName: user?.name || 'John Doe',
          status: 'CONFIRMED',
          bookingDate: '2024-01-15',
          checkInDate: '2024-02-01',
          checkOutDate: '2024-02-15',
          totalAmount: 50000,
          paidAmount: 25000,
          remainingAmount: 25000,
          paymentSchedule: [
            {
              id: 'pay1',
              bookingId: '1',
              dueDate: '2024-01-20',
              amount: 25000,
              status: 'PAID',
              description: 'Initial Payment',
            },
            {
              id: 'pay2',
              bookingId: '1',
              dueDate: '2024-02-01',
              amount: 25000,
              status: 'PENDING',
              description: 'Final Payment',
            },
          ],
        },
        {
          id: '2',
          propertyId: 'prop2',
          propertyName: 'Modern Apartment in Downtown',
          customerId: user?.id || 'customer1',
          customerName: user?.name || 'John Doe',
          status: 'PENDING',
          bookingDate: '2024-01-20',
          checkInDate: '2024-03-01',
          checkOutDate: '2024-03-10',
          totalAmount: 30000,
          paidAmount: 0,
          remainingAmount: 30000,
          paymentSchedule: [
            {
              id: 'pay3',
              bookingId: '2',
              dueDate: '2024-01-25',
              amount: 15000,
              status: 'OVERDUE',
              description: 'Initial Payment',
            },
            {
              id: 'pay4',
              bookingId: '2',
              dueDate: '2024-02-25',
              amount: 15000,
              status: 'PENDING',
              description: 'Final Payment',
            },
          ],
        },
      ];

      const summary = calculateSummary(mockBookings);
      
      setState(prev => ({
        ...prev,
        bookings: mockBookings,
        summary,
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to load data',
        isLoading: false,
      }));
    }
  };

  const calculateSummary = (bookings: Booking[]) => {
    const totalBookings = bookings.length;
    const activeBookings = bookings.filter(b => b.status === 'CONFIRMED' || b.status === 'PENDING').length;
    const totalAmount = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
    const paidAmount = bookings.reduce((sum, b) => sum + b.paidAmount, 0);
    const pendingAmount = totalAmount - paidAmount;
    
    const overduePayments = bookings.reduce((count, booking) => {
      return count + booking.paymentSchedule.filter(p => p.status === 'OVERDUE').length;
    }, 0);

    return {
      totalBookings,
      activeBookings,
      totalAmount,
      paidAmount,
      pendingAmount,
      overduePayments,
    };
  };

  const handleRefresh = () => {
    loadData();
  };

  const handleBookingPress = (booking: Booking) => {
    // Navigate to booking details
    console.log('Navigate to booking details:', booking.id);
  };

  const handlePaymentPress = (payment: PaymentSchedule) => {
    // Navigate to payment details or initiate payment
    console.log('Handle payment:', payment.id);
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'PENDING': '#FF9800',
      'CONFIRMED': '#4CAF50',
      'CANCELLED': '#F44336',
      'COMPLETED': '#2196F3',
      'PAID': '#4CAF50',
      'OVERDUE': '#F44336',
    };
    return colors[status] || '#757575';
  };

  const renderBooking = ({ item }: { item: Booking }) => (
    <Card style={styles.bookingCard} onPress={() => handleBookingPress(item)}>
      <Card.Content>
        <View style={styles.bookingHeader}>
          <Title style={styles.bookingTitle}>{item.propertyName}</Title>
          <Chip
            mode="outlined"
            style={[styles.statusChip, { borderColor: getStatusColor(item.status) }]}
            textStyle={{ color: getStatusColor(item.status) }}
          >
            {item.status}
          </Chip>
        </View>
        
        <Paragraph style={styles.bookingDates}>
          Check-in: {formatDate(new Date(item.checkInDate))}
        </Paragraph>
        <Paragraph style={styles.bookingDates}>
          Check-out: {formatDate(new Date(item.checkOutDate))}
        </Paragraph>
        
        <View style={styles.bookingAmounts}>
          <Text style={styles.amountLabel}>Total Amount:</Text>
          <Text style={styles.amountValue}>
            {formatCurrency(item.totalAmount, 'AED')}
          </Text>
        </View>
        
        <View style={styles.bookingAmounts}>
          <Text style={styles.amountLabel}>Paid Amount:</Text>
          <Text style={[styles.amountValue, { color: '#4CAF50' }]}>
            {formatCurrency(item.paidAmount, 'AED')}
          </Text>
        </View>
        
        <View style={styles.bookingAmounts}>
          <Text style={styles.amountLabel}>Remaining:</Text>
          <Text style={[styles.amountValue, { color: '#F44336' }]}>
            {formatCurrency(item.remainingAmount, 'AED')}
          </Text>
        </View>
        
        {item.paymentSchedule.some(p => p.status === 'OVERDUE') && (
          <Badge style={styles.overdueBadge}>
            Overdue Payments
          </Badge>
        )}
      </Card.Content>
    </Card>
  );

  const renderPayment = ({ item }: { item: PaymentSchedule }) => (
    <Card style={styles.paymentCard} onPress={() => handlePaymentPress(item)}>
      <Card.Content>
        <View style={styles.paymentHeader}>
          <Title style={styles.paymentTitle}>{item.description}</Title>
          <Chip
            mode="outlined"
            style={[styles.statusChip, { borderColor: getStatusColor(item.status) }]}
            textStyle={{ color: getStatusColor(item.status) }}
          >
            {item.status}
          </Chip>
        </View>
        
        <View style={styles.paymentDetails}>
          <Text style={styles.paymentAmount}>
            {formatCurrency(item.amount, 'AED')}
          </Text>
          <Text style={styles.paymentDueDate}>
            Due: {formatDate(new Date(item.dueDate))}
          </Text>
        </View>
        
        {item.status === 'PENDING' && (
          <Button
            mode="contained"
            onPress={() => handlePaymentPress(item)}
            style={styles.payButton}
          >
            Pay Now
          </Button>
        )}
      </Card.Content>
    </Card>
  );

  const renderOverview = () => (
    <ScrollView style={styles.overviewContainer}>
      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Title style={styles.summaryTitle}>Total Bookings</Title>
            <Text style={styles.summaryValue}>{state.summary.totalBookings}</Text>
            <Text style={styles.summarySubtext}>
              {state.summary.activeBookings} active
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.summaryCard}>
          <Card.Content>
            <Title style={styles.summaryTitle}>Total Amount</Title>
            <Text style={styles.summaryValue}>
              {formatCurrency(state.summary.totalAmount, 'AED')}
            </Text>
            <Text style={styles.summarySubtext}>
              {formatCurrency(state.summary.paidAmount, 'AED')} paid
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.summaryCard}>
          <Card.Content>
            <Title style={styles.summaryTitle}>Pending Amount</Title>
            <Text style={[styles.summaryValue, { color: '#F44336' }]}>
              {formatCurrency(state.summary.pendingAmount, 'AED')}
            </Text>
            <Text style={styles.summarySubtext}>
              {state.summary.overduePayments} overdue
            </Text>
          </Card.Content>
        </Card>
      </View>

      {/* Payment Progress */}
      <Card style={styles.progressCard}>
        <Card.Content>
          <Title>Payment Progress</Title>
          <View style={styles.progressItem}>
            <Text>Overall Progress</Text>
            <ProgressBar
              progress={state.summary.totalAmount > 0 ? state.summary.paidAmount / state.summary.totalAmount : 0}
              color="#4CAF50"
              style={styles.progressBar}
            />
            <Text style={styles.progressText}>
              {Math.round((state.summary.paidAmount / state.summary.totalAmount) * 100)}% Complete
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Recent Bookings */}
      <Card style={styles.recentCard}>
        <Card.Content>
          <Title>Recent Bookings</Title>
          {state.bookings.slice(0, 3).map((booking) => (
            <View key={booking.id} style={styles.recentItem}>
              <View style={styles.recentItemLeft}>
                <Text style={styles.recentItemTitle}>{booking.propertyName}</Text>
                <Text style={styles.recentItemDate}>
                  {formatDate(new Date(booking.bookingDate))}
                </Text>
              </View>
              <Text style={[styles.recentItemAmount, { color: getStatusColor(booking.status) }]}>
                {formatCurrency(booking.totalAmount, 'AED')}
              </Text>
            </View>
          ))}
        </Card.Content>
      </Card>
    </ScrollView>
  );

  const allPayments = state.bookings.flatMap(booking => 
    booking.paymentSchedule.map(payment => ({ ...payment, bookingName: booking.propertyName }))
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.headerTitle}>Customer Portal</Title>
        <Text style={styles.headerSubtitle}>Manage your bookings and payments</Text>
      </View>

      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>Offline Mode - Some features may be limited</Text>
        </View>
      )}

      <View style={styles.tabContainer}>
        <Button
          mode={activeTab === 'overview' ? 'contained' : 'outlined'}
          onPress={() => setActiveTab('overview')}
          style={styles.tabButton}
        >
          Overview
        </Button>
        <Button
          mode={activeTab === 'bookings' ? 'contained' : 'outlined'}
          onPress={() => setActiveTab('bookings')}
          style={styles.tabButton}
        >
          Bookings
        </Button>
        <Button
          mode={activeTab === 'payments' ? 'contained' : 'outlined'}
          onPress={() => setActiveTab('payments')}
          style={styles.tabButton}
        >
          Payments
        </Button>
      </View>

      {activeTab === 'overview' ? (
        renderOverview()
      ) : activeTab === 'bookings' ? (
        <FlatList
          data={state.bookings}
          renderItem={renderBooking}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={state.isLoading} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No bookings found</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={allPayments}
          renderItem={renderPayment}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={state.isLoading} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No payments found</Text>
            </View>
          }
        />
      )}
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
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
  tabContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    elevation: 2,
  },
  tabButton: {
    flex: 1,
    marginHorizontal: 4,
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
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summarySubtext: {
    fontSize: 12,
    color: '#666',
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
  progressText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
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
  bookingCard: {
    marginBottom: 16,
    elevation: 2,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bookingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  statusChip: {
    marginLeft: 8,
  },
  bookingDates: {
    color: '#666',
    marginBottom: 4,
  },
  bookingAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  amountLabel: {
    fontSize: 14,
    color: '#666',
  },
  amountValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  overdueBadge: {
    backgroundColor: '#F44336',
    marginTop: 8,
  },
  paymentCard: {
    marginBottom: 16,
    elevation: 2,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  paymentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  paymentDueDate: {
    fontSize: 14,
    color: '#666',
  },
  payButton: {
    marginTop: 8,
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
  },
});

export default CustomerPortalScreen;
