import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Button,
  Card,
  Chip,
  RadioButton,
  Divider,
} from 'react-native-paper';

export interface DataConflict {
  id: string;
  type: 'property' | 'lead' | 'customer' | 'booking' | 'payment';
  localData: any;
  serverData: any;
  conflictFields: string[];
  timestamp: Date;
}

interface ConflictResolutionDialogProps {
  visible: boolean;
  conflicts: DataConflict[];
  onResolve: (resolutions: { conflictId: string; resolution: 'local' | 'server' | 'merge' }[]) => void;
  onCancel: () => void;
}

const ConflictResolutionDialog: React.FC<ConflictResolutionDialogProps> = ({
  visible,
  conflicts,
  onResolve,
  onCancel,
}) => {
  const [resolutions, setResolutions] = useState<Map<string, 'local' | 'server' | 'merge'>>(
    new Map()
  );

  const handleResolutionChange = (conflictId: string, resolution: 'local' | 'server' | 'merge') => {
    const newResolutions = new Map(resolutions);
    newResolutions.set(conflictId, resolution);
    setResolutions(newResolutions);
  };

  const handleResolveAll = () => {
    const resolutionArray = conflicts.map(conflict => ({
      conflictId: conflict.id,
      resolution: resolutions.get(conflict.id) || 'server',
    }));
    onResolve(resolutionArray);
    setResolutions(new Map());
  };

  const handleKeepAllLocal = () => {
    const resolutionArray = conflicts.map(conflict => ({
      conflictId: conflict.id,
      resolution: 'local' as const,
    }));
    onResolve(resolutionArray);
    setResolutions(new Map());
  };

  const handleKeepAllServer = () => {
    const resolutionArray = conflicts.map(conflict => ({
      conflictId: conflict.id,
      resolution: 'server' as const,
    }));
    onResolve(resolutionArray);
    setResolutions(new Map());
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'Not set';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const getConflictTypeLabel = (type: DataConflict['type']): string => {
    const labels = {
      property: 'Property',
      lead: 'Lead',
      customer: 'Customer',
      booking: 'Booking',
      payment: 'Payment',
    };
    return labels[type] || type;
  };

  const renderConflictCard = (conflict: DataConflict) => {
    const resolution = resolutions.get(conflict.id) || 'server';

    return (
      <Card key={conflict.id} style={styles.conflictCard}>
        <Card.Content>
          {/* Conflict Header */}
          <View style={styles.conflictHeader}>
            <Chip icon="alert-circle" style={styles.typeChip}>
              {getConflictTypeLabel(conflict.type)}
            </Chip>
            <Text style={styles.conflictId}>ID: {conflict.id.slice(0, 8)}</Text>
          </View>

          {/* Conflict Fields */}
          <View style={styles.fieldsContainer}>
            <Text style={styles.sectionTitle}>Conflicting Fields:</Text>
            {conflict.conflictFields.map((field, index) => (
              <View key={index} style={styles.fieldComparison}>
                <Text style={styles.fieldName}>{field}:</Text>
                
                <View style={styles.valueComparison}>
                  <View style={styles.valueColumn}>
                    <Text style={styles.valueLabel}>Local (Offline)</Text>
                    <Text style={styles.localValue}>
                      {formatValue(conflict.localData[field])}
                    </Text>
                  </View>
                  
                  <View style={styles.valueDivider} />
                  
                  <View style={styles.valueColumn}>
                    <Text style={styles.valueLabel}>Server (Online)</Text>
                    <Text style={styles.serverValue}>
                      {formatValue(conflict.serverData[field])}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Resolution Options */}
          <View style={styles.resolutionContainer}>
            <Text style={styles.sectionTitle}>Choose Resolution:</Text>
            
            <TouchableOpacity
              style={styles.radioOption}
              onPress={() => handleResolutionChange(conflict.id, 'local')}
            >
              <RadioButton.Android
                value="local"
                status={resolution === 'local' ? 'checked' : 'unchecked'}
                onPress={() => handleResolutionChange(conflict.id, 'local')}
              />
              <View style={styles.radioLabel}>
                <Text style={styles.radioText}>Keep Local Changes</Text>
                <Text style={styles.radioDescription}>
                  Use the data from your offline edits
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.radioOption}
              onPress={() => handleResolutionChange(conflict.id, 'server')}
            >
              <RadioButton.Android
                value="server"
                status={resolution === 'server' ? 'checked' : 'unchecked'}
                onPress={() => handleResolutionChange(conflict.id, 'server')}
              />
              <View style={styles.radioLabel}>
                <Text style={styles.radioText}>Keep Server Version</Text>
                <Text style={styles.radioDescription}>
                  Use the latest data from the server
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.radioOption}
              onPress={() => handleResolutionChange(conflict.id, 'merge')}
            >
              <RadioButton.Android
                value="merge"
                status={resolution === 'merge' ? 'checked' : 'unchecked'}
                onPress={() => handleResolutionChange(conflict.id, 'merge')}
              />
              <View style={styles.radioLabel}>
                <Text style={styles.radioText}>Smart Merge</Text>
                <Text style={styles.radioDescription}>
                  Combine both versions intelligently
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Resolve Sync Conflicts</Text>
          <Text style={styles.headerSubtitle}>
            {conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''} detected
          </Text>
        </View>

        {/* Warning Banner */}
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>
            ⚠️ Changes were made offline and online. Please resolve conflicts to continue.
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Button
            mode="outlined"
            onPress={handleKeepAllLocal}
            style={styles.quickButton}
            compact
          >
            Keep All Local
          </Button>
          <Button
            mode="outlined"
            onPress={handleKeepAllServer}
            style={styles.quickButton}
            compact
          >
            Keep All Server
          </Button>
        </View>

        {/* Conflicts List */}
        <ScrollView style={styles.conflictsList}>
          {conflicts.map(conflict => renderConflictCard(conflict))}
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            mode="outlined"
            onPress={onCancel}
            style={styles.cancelButton}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleResolveAll}
            style={styles.resolveButton}
            disabled={resolutions.size < conflicts.length}
          >
            Resolve All
          </Button>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  warningBanner: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FFE0B2',
  },
  warningText: {
    color: '#E65100',
    fontSize: 13,
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  quickButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  conflictsList: {
    flex: 1,
    padding: 16,
  },
  conflictCard: {
    marginBottom: 16,
    elevation: 2,
  },
  conflictHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  typeChip: {
    backgroundColor: '#FF9800',
  },
  conflictId: {
    fontSize: 12,
    color: '#999',
  },
  fieldsContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  fieldComparison: {
    marginBottom: 16,
  },
  fieldName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  valueComparison: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
  },
  valueColumn: {
    flex: 1,
  },
  valueDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 12,
  },
  valueLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
    fontWeight: '600',
  },
  localValue: {
    fontSize: 13,
    color: '#1976D2',
  },
  serverValue: {
    fontSize: 13,
    color: '#388E3C',
  },
  resolutionContainer: {
    marginTop: 8,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  radioLabel: {
    flex: 1,
    marginLeft: 8,
  },
  radioText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  radioDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  resolveButton: {
    flex: 1,
    marginLeft: 8,
  },
});

export default ConflictResolutionDialog;

