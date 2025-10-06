import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, Title, Paragraph, Button } from 'react-native-paper';

const CreatePropertyScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>Create Property</Title>
          <Paragraph>Property creation form will be implemented here.</Paragraph>
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

export default CreatePropertyScreen;
