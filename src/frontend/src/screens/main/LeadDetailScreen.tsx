import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, Title, Paragraph, Button } from 'react-native-paper';

const LeadDetailScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>Lead Details</Title>
          <Paragraph>Lead management features will be implemented here.</Paragraph>
          <Button mode="contained" style={styles.button}>
            Coming Soon
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  card: {
    elevation: 2,
  },
  button: {
    marginTop: 16,
  },
});

export default LeadDetailScreen;
