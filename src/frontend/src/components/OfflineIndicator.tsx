import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { Card, Text, Button, IconButton } from 'react-native-paper';
import { useTheme } from '../theme';
import SyncManager from '../services/syncManager';
import { logger } from '../utils/logger';

interface OfflineIndicatorProps {
  onRetrySync?: () => void;
  onViewOfflineData?: () => void;
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  onRetrySync,
  onViewOfflineData,
}) => {
  const theme = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [syncStatus, setSyncStatus] = useState({
    isOnline: true,
    isSyncing: false,
    lastSyncTime: null as number | null,
    pendingCount: 0,
    failedCount: 0,
  });
  const [slideAnim] = useState(new Animated.Value(-100));
  const [syncProgress, setSyncProgress] = useState({
    total: 0,
    completed: 0,
    failed: 0,
    current: '',
    isRunning: false,
  });

  useEffect(() => {
    const syncManager = SyncManager.getInstance();
    
    // Initialize sync manager
    syncManager.initialize().catch(error => {
      logger.error('Failed to initialize sync manager:', error);
    });

    // Set up listeners
    const updateSyncStatus = async () => {
      try {
        const status = await syncManager.getSyncStatus();
        setSyncStatus(status);
        
        // Show indicator if offline or has pending/failed items
        const shouldShow = !status.isOnline || status.pendingCount > 0 || status.failedCount > 0;
        setIsVisible(shouldShow);
        
        if (shouldShow) {
          slideIn();
        } else {
          slideOut();
        }
      } catch (error) {
        logger.error('Failed to update sync status:', error);
      }
    };

    const handleSyncProgress = (progress: typeof syncProgress) => {
      setSyncProgress(progress);
    };

    const handleSyncResult = (result: any) => {
      // Update status after sync completes
      updateSyncStatus();
    };

    // Add listeners
    syncManager.addProgressListener(handleSyncProgress);
    syncManager.addResultListener(handleSyncResult);

    // Initial status update
    updateSyncStatus();

    // Set up interval to check status periodically
    const interval = setInterval(updateSyncStatus, 5000);

    return () => {
      syncManager.removeProgressListener(handleSyncProgress);
      syncManager.removeResultListener(handleSyncResult);
      clearInterval(interval);
    };
  }, []);

  const slideIn = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const slideOut = () => {
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleRetrySync = async () => {
    try {
      const syncManager = SyncManager.getInstance();
      await syncManager.forceSync();
      if (onRetrySync) {
        onRetrySync();
      }
    } catch (error) {
      logger.error('Failed to retry sync:', error);
    }
  };

  const handleViewOfflineData = () => {
    if (onViewOfflineData) {
      onViewOfflineData();
    }
  };

  const getStatusColor = () => {
    if (!syncStatus.isOnline) {
      return theme.colors.error;
    } else if (syncStatus.failedCount > 0) {
      return theme.colors.warning;
    } else if (syncStatus.pendingCount > 0) {
      return theme.colors.info;
    } else {
      return theme.colors.success;
    }
  };

  const getStatusText = () => {
    if (!syncStatus.isOnline) {
      return 'Offline Mode';
    } else if (syncStatus.isSyncing) {
      return 'Syncing...';
    } else if (syncStatus.failedCount > 0) {
      return `${syncStatus.failedCount} items failed to sync`;
    } else if (syncStatus.pendingCount > 0) {
      return `${syncStatus.pendingCount} items pending sync`;
    } else {
      return 'All data synced';
    }
  };

  const getStatusIcon = () => {
    if (!syncStatus.isOnline) {
      return 'wifi-off';
    } else if (syncStatus.isSyncing) {
      return 'sync';
    } else if (syncStatus.failedCount > 0) {
      return 'alert-circle';
    } else if (syncStatus.pendingCount > 0) {
      return 'clock';
    } else {
      return 'check-circle';
    }
  };

  const formatLastSyncTime = (timestamp: number | null) => {
    if (!timestamp) {
      return 'Never';
    }
    
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content style={styles.content}>
          <View style={styles.header}>
            <View style={styles.statusInfo}>
              <IconButton
                icon={getStatusIcon()}
                size={20}
                iconColor={getStatusColor()}
              />
              <View style={styles.textContainer}>
                <Text style={[styles.statusText, { color: getStatusColor() }]}>
                  {getStatusText()}
                </Text>
                {syncStatus.lastSyncTime && (
                  <Text style={[styles.lastSyncText, { color: theme.colors.onSurfaceVariant }]}>
                    Last sync: {formatLastSyncTime(syncStatus.lastSyncTime)}
                  </Text>
                )}
              </View>
            </View>
            
            <IconButton
              icon="close"
              size={20}
              iconColor={theme.colors.onSurfaceVariant}
              onPress={() => setIsVisible(false)}
            />
          </View>

          {syncStatus.isSyncing && syncProgress.total > 0 && (
            <View style={styles.progressContainer}>
              <View style={styles.progressInfo}>
                <Text style={[styles.progressText, { color: theme.colors.onSurfaceVariant }]}>
                  {syncProgress.current}
                </Text>
                <Text style={[styles.progressText, { color: theme.colors.onSurfaceVariant }]}>
                  {syncProgress.completed}/{syncProgress.total}
                </Text>
              </View>
              <View style={[styles.progressBar, { backgroundColor: theme.colors.surfaceVariant }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: theme.colors.primary,
                      width: `${(syncProgress.completed / syncProgress.total) * 100}%`,
                    },
                  ]}
                />
              </View>
            </View>
          )}

          {!syncStatus.isOnline && (
            <View style={styles.offlineActions}>
              <Text style={[styles.offlineText, { color: theme.colors.onSurfaceVariant }]}>
                You're currently offline. Some features may be limited.
              </Text>
              <Button
                mode="outlined"
                onPress={handleViewOfflineData}
                icon="database"
                compact
                style={styles.actionButton}
              >
                View Offline Data
              </Button>
            </View>
          )}

          {syncStatus.isOnline && (syncStatus.pendingCount > 0 || syncStatus.failedCount > 0) && (
            <View style={styles.syncActions}>
              <Button
                mode="contained"
                onPress={handleRetrySync}
                icon="sync"
                compact
                style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
                loading={syncStatus.isSyncing}
                disabled={syncStatus.isSyncing}
              >
                {syncStatus.isSyncing ? 'Syncing...' : 'Sync Now'}
              </Button>
              
              {syncStatus.pendingCount > 0 && (
                <Text style={[styles.pendingText, { color: theme.colors.onSurfaceVariant }]}>
                  {syncStatus.pendingCount} items pending
                </Text>
              )}
              
              {syncStatus.failedCount > 0 && (
                <Text style={[styles.failedText, { color: theme.colors.error }]}>
                  {syncStatus.failedCount} items failed
                </Text>
              )}
            </View>
          )}
        </Card.Content>
      </Card>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  card: {
    elevation: 8,
    borderRadius: 8,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  textContainer: {
    flex: 1,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  lastSyncText: {
    fontSize: 12,
    marginTop: 2,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressText: {
    fontSize: 12,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  offlineActions: {
    marginTop: 8,
    alignItems: 'center',
  },
  offlineText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  syncActions: {
    marginTop: 8,
    alignItems: 'center',
  },
  actionButton: {
    marginTop: 8,
  },
  pendingText: {
    fontSize: 12,
    marginTop: 4,
  },
  failedText: {
    fontSize: 12,
    marginTop: 4,
  },
});

export default OfflineIndicator;
