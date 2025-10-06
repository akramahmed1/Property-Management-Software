import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Card, Title, Paragraph, Chip, Button, IconButton } from 'react-native-paper';
import { useTheme } from '../theme';
import { Property } from '../types/property';
import { formatCurrency } from '../utils/formatting';

interface PropertyCardProps {
  property: Property;
  onPress?: (property: Property) => void;
  onEdit?: (property: Property) => void;
  onDelete?: (property: Property) => void;
  onFavorite?: (property: Property) => void;
  showActions?: boolean;
  isFavorite?: boolean;
}

const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  onPress,
  onEdit,
  onDelete,
  onFavorite,
  showActions = true,
  isFavorite = false,
}) => {
  const theme = useTheme();

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

  const handlePress = () => {
    if (onPress) {
      onPress(property);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(property);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(property);
    }
  };

  const handleFavorite = () => {
    if (onFavorite) {
      onFavorite(property);
    }
  };

  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
        <View style={styles.imageContainer}>
          {property.images && property.images.length > 0 ? (
            <Image
              source={{ uri: property.images[0] }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.placeholderImage, { backgroundColor: theme.colors.surfaceVariant }]}>
              <IconButton
                icon="home"
                size={40}
                iconColor={theme.colors.outline}
              />
            </View>
          )}
          
          <View style={styles.statusContainer}>
            <Chip
              style={[
                styles.statusChip,
                { backgroundColor: getStatusColor(property.status) }
              ]}
              textStyle={styles.statusText}
            >
              {getStatusText(property.status)}
            </Chip>
          </View>

          {onFavorite && (
            <View style={styles.favoriteContainer}>
              <IconButton
                icon={isFavorite ? "heart" : "heart-outline"}
                size={24}
                iconColor={isFavorite ? theme.colors.error : theme.colors.outline}
                onPress={handleFavorite}
              />
            </View>
          )}
        </View>

        <Card.Content style={styles.content}>
          <Title style={[styles.title, { color: theme.colors.onSurface }]}>
            {property.name}
          </Title>
          
          <Paragraph style={[styles.location, { color: theme.colors.onSurfaceVariant }]}>
            {property.location}
          </Paragraph>

          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <IconButton
                icon="bed"
                size={16}
                iconColor={theme.colors.onSurfaceVariant}
              />
              <Paragraph style={[styles.detailText, { color: theme.colors.onSurfaceVariant }]}>
                {property.bedrooms}
              </Paragraph>
            </View>

            <View style={styles.detailItem}>
              <IconButton
                icon="shower"
                size={16}
                iconColor={theme.colors.onSurfaceVariant}
              />
              <Paragraph style={[styles.detailText, { color: theme.colors.onSurfaceVariant }]}>
                {property.bathrooms}
              </Paragraph>
            </View>

            <View style={styles.detailItem}>
              <IconButton
                icon="square"
                size={16}
                iconColor={theme.colors.onSurfaceVariant}
              />
              <Paragraph style={[styles.detailText, { color: theme.colors.onSurfaceVariant }]}>
                {property.area} sq ft
              </Paragraph>
            </View>
          </View>

          <View style={styles.priceContainer}>
            <Title style={[styles.price, { color: theme.colors.primary }]}>
              {formatCurrency(property.price)}
            </Title>
            <Chip
              style={[styles.typeChip, { backgroundColor: theme.colors.primaryContainer }]}
              textStyle={[styles.typeText, { color: theme.colors.primary }]}
            >
              {property.type}
            </Chip>
          </View>
        </Card.Content>
      </TouchableOpacity>

      {showActions && (
        <Card.Actions style={styles.actions}>
          <Button
            mode="outlined"
            onPress={handleEdit}
            icon="pencil"
            compact
          >
            Edit
          </Button>
          <Button
            mode="outlined"
            onPress={handleDelete}
            icon="delete"
            compact
            buttonColor={theme.colors.errorContainer}
            textColor={theme.colors.error}
          >
            Delete
          </Button>
        </Card.Actions>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 8,
    elevation: 4,
    borderRadius: 12,
  },
  imageContainer: {
    position: 'relative',
    height: 200,
  },
  image: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  statusContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
  },
  statusChip: {
    borderRadius: 16,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  favoriteContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    marginBottom: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    marginLeft: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  typeChip: {
    borderRadius: 12,
  },
  typeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  actions: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});

export default PropertyCard;
