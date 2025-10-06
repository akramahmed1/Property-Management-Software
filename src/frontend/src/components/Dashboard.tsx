import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Card, Title, Paragraph, Button, Chip, ProgressBar } from 'react-native-paper';
import { useTheme } from '../theme';
import { useTranslation } from '../services/i18nService';
import { PropertyAnalytics } from '../types/property';
import { formatCurrency, formatNumber } from '../utils/formatting';

interface DashboardProps {
  analytics?: PropertyAnalytics;
  onRefresh?: () => void;
  onNavigateToProperties?: () => void;
  onNavigateToCustomers?: () => void;
  onNavigateToLeads?: () => void;
  onNavigateToBookings?: () => void;
  onNavigateToReports?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  analytics,
  onRefresh,
  onNavigateToProperties,
  onNavigateToCustomers,
  onNavigateToLeads,
  onNavigateToBookings,
  onNavigateToReports,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (onRefresh) {
      await onRefresh();
    }
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'available':
        return theme.colors.success;
      case 'sold':
        return theme.colors.error;
      case 'rented':
        return theme.colors.warning;
      case 'maintenance':
        return theme.colors.maintenance;
      default:
        return theme.colors.outline;
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'available':
        return 'Available';
      case 'sold':
        return 'Sold';
      case 'rented':
        return 'Rented';
      case 'maintenance':
        return 'Maintenance';
      default:
        return status;
    }
  };

  if (!analytics) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Card.Content style={styles.cardContent}>
              <Title style={[styles.title, { color: theme.colors.onSurface }]}>
                {t('dashboard.title')}
              </Title>
              <Paragraph style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
                Loading analytics...
              </Paragraph>
            </Card.Content>
          </Card>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Overview Cards */}
        <View style={styles.overviewRow}>
          <Card style={[styles.overviewCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content style={styles.overviewContent}>
              <Title style={[styles.overviewTitle, { color: theme.colors.primary }]}>
                {formatNumber(analytics.totalProperties)}
              </Title>
              <Paragraph style={[styles.overviewSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                {t('dashboard.totalProperties')}
              </Paragraph>
            </Card.Content>
          </Card>

          <Card style={[styles.overviewCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content style={styles.overviewContent}>
              <Title style={[styles.overviewTitle, { color: theme.colors.success }]}>
                {formatNumber(analytics.availableProperties)}
              </Title>
              <Paragraph style={[styles.overviewSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                {t('dashboard.availableProperties')}
              </Paragraph>
            </Card.Content>
          </Card>
        </View>

        <View style={styles.overviewRow}>
          <Card style={[styles.overviewCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content style={styles.overviewContent}>
              <Title style={[styles.overviewTitle, { color: theme.colors.warning }]}>
                {formatNumber(analytics.soldProperties)}
              </Title>
              <Paragraph style={[styles.overviewSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                {t('dashboard.soldProperties')}
              </Paragraph>
            </Card.Content>
          </Card>

          <Card style={[styles.overviewCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content style={styles.overviewContent}>
              <Title style={[styles.overviewTitle, { color: theme.colors.info }]}>
                {formatNumber(analytics.rentedProperties)}
              </Title>
              <Paragraph style={[styles.overviewSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                {t('dashboard.rentedProperties')}
              </Paragraph>
            </Card.Content>
          </Card>
        </View>

        {/* Financial Overview */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Title style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
              Financial Overview
            </Title>
            
            <View style={styles.financialRow}>
              <View style={styles.financialItem}>
                <Paragraph style={[styles.financialLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Total Value
                </Paragraph>
                <Title style={[styles.financialValue, { color: theme.colors.primary }]}>
                  {formatCurrency(analytics.totalValue)}
                </Title>
              </View>
              
              <View style={styles.financialItem}>
                <Paragraph style={[styles.financialLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Average Price
                </Paragraph>
                <Title style={[styles.financialValue, { color: theme.colors.secondary }]}>
                  {formatCurrency(analytics.averagePrice)}
                </Title>
              </View>
            </View>

            <View style={styles.priceRangeContainer}>
              <Paragraph style={[styles.priceRangeLabel, { color: theme.colors.onSurfaceVariant }]}>
                Price Range
              </Paragraph>
              <View style={styles.priceRangeRow}>
                <Chip
                  style={[styles.priceChip, { backgroundColor: theme.colors.primaryContainer }]}
                  textStyle={[styles.priceChipText, { color: theme.colors.primary }]}
                >
                  {formatCurrency(analytics.priceRange.min)}
                </Chip>
                <Paragraph style={[styles.priceRangeSeparator, { color: theme.colors.onSurfaceVariant }]}>
                  to
                </Paragraph>
                <Chip
                  style={[styles.priceChip, { backgroundColor: theme.colors.primaryContainer }]}
                  textStyle={[styles.priceChipText, { color: theme.colors.primary }]}
                >
                  {formatCurrency(analytics.priceRange.max)}
                </Chip>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Property Status Distribution */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Title style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
              Property Status
            </Title>
            
            {Object.entries(analytics.statusDistribution).map(([status, count]) => (
              <View key={status} style={styles.statusRow}>
                <View style={styles.statusInfo}>
                  <Chip
                    style={[
                      styles.statusChip,
                      { backgroundColor: getStatusColor(status) }
                    ]}
                    textStyle={styles.statusChipText}
                  >
                    {getStatusText(status)}
                  </Chip>
                  <Paragraph style={[styles.statusCount, { color: theme.colors.onSurface }]}>
                    {formatNumber(count)}
                  </Paragraph>
                </View>
                <ProgressBar
                  progress={count / analytics.totalProperties}
                  color={getStatusColor(status)}
                  style={styles.statusProgress}
                />
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* Quick Actions */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Title style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
              {t('dashboard.quickActions')}
            </Title>
            
            <View style={styles.actionsGrid}>
              <Button
                mode="contained"
                onPress={onNavigateToProperties}
                icon="home"
                style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
                contentStyle={styles.actionButtonContent}
              >
                {t('dashboard.addProperty')}
              </Button>
              
              <Button
                mode="contained"
                onPress={onNavigateToCustomers}
                icon="account"
                style={[styles.actionButton, { backgroundColor: theme.colors.secondary }]}
                contentStyle={styles.actionButtonContent}
              >
                {t('dashboard.addCustomer')}
              </Button>
              
              <Button
                mode="contained"
                onPress={onNavigateToLeads}
                icon="target"
                style={[styles.actionButton, { backgroundColor: theme.colors.tertiary }]}
                contentStyle={styles.actionButtonContent}
              >
                {t('dashboard.addLead')}
              </Button>
              
              <Button
                mode="contained"
                onPress={onNavigateToBookings}
                icon="calendar"
                style={[styles.actionButton, { backgroundColor: theme.colors.info }]}
                contentStyle={styles.actionButtonContent}
              >
                {t('dashboard.createBooking')}
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Top Performing Properties */}
        {analytics.topPerformingProperties && analytics.topPerformingProperties.length > 0 && (
          <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Title style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
                Top Performing Properties
              </Title>
              
              {analytics.topPerformingProperties.map((property, index) => (
                <View key={property.id} style={styles.performanceRow}>
                  <View style={styles.performanceInfo}>
                    <Paragraph style={[styles.performanceName, { color: theme.colors.onSurface }]}>
                      {property.name}
                    </Paragraph>
                    <View style={styles.performanceMetrics}>
                      <Chip
                        style={[styles.metricChip, { backgroundColor: theme.colors.surfaceVariant }]}
                        textStyle={[styles.metricChipText, { color: theme.colors.onSurfaceVariant }]}
                      >
                        {formatNumber(property.views)} views
                      </Chip>
                      <Chip
                        style={[styles.metricChip, { backgroundColor: theme.colors.surfaceVariant }]}
                        textStyle={[styles.metricChipText, { color: theme.colors.onSurfaceVariant }]}
                      >
                        {formatNumber(property.inquiries)} inquiries
                      </Chip>
                      <Chip
                        style={[styles.metricChip, { backgroundColor: theme.colors.surfaceVariant }]}
                        textStyle={[styles.metricChipText, { color: theme.colors.onSurfaceVariant }]}
                      >
                        {formatNumber(property.bookings)} bookings
                      </Chip>
                    </View>
                  </View>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 4,
    borderRadius: 12,
  },
  cardContent: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 16,
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  overviewCard: {
    flex: 1,
    marginHorizontal: 4,
    elevation: 2,
    borderRadius: 8,
  },
  overviewContent: {
    alignItems: 'center',
    padding: 16,
  },
  overviewTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  overviewSubtitle: {
    fontSize: 12,
    textAlign: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  financialItem: {
    alignItems: 'center',
  },
  financialLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  financialValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  priceRangeContainer: {
    alignItems: 'center',
  },
  priceRangeLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  priceRangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceChip: {
    borderRadius: 16,
  },
  priceChipText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  priceRangeSeparator: {
    marginHorizontal: 8,
    fontSize: 14,
  },
  statusRow: {
    marginBottom: 12,
  },
  statusInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusChip: {
    borderRadius: 12,
  },
  statusChipText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusCount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusProgress: {
    height: 4,
    borderRadius: 2,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    marginBottom: 8,
    borderRadius: 8,
  },
  actionButtonContent: {
    paddingVertical: 8,
  },
  performanceRow: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  performanceInfo: {
    flex: 1,
  },
  performanceName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  performanceMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metricChip: {
    marginRight: 8,
    marginBottom: 4,
    borderRadius: 12,
  },
  metricChipText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default Dashboard;
