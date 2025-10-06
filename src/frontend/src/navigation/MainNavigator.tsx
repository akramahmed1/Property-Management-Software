import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';

import { RootState } from '../store';
import HomeScreen from '../screens/main/HomeScreen';
import PropertiesScreen from '../screens/main/PropertiesScreen';
import CRMScreen from '../screens/main/CRMScreen';
import ERPScreen from '../screens/main/ERPScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import PropertyDetailScreen from '../screens/main/PropertyDetailScreen';
import CreatePropertyScreen from '../screens/main/CreatePropertyScreen';
import LeadDetailScreen from '../screens/main/LeadDetailScreen';
import CustomerDetailScreen from '../screens/main/CustomerDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const PropertiesStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="PropertiesList" 
      component={PropertiesScreen}
      options={{ title: 'Properties' }}
    />
    <Stack.Screen 
      name="PropertyDetail" 
      component={PropertyDetailScreen}
      options={{ title: 'Property Details' }}
    />
    <Stack.Screen 
      name="CreateProperty" 
      component={CreatePropertyScreen}
      options={{ title: 'Create Property' }}
    />
  </Stack.Navigator>
);

const CRMStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="CRMList" 
      component={CRMScreen}
      options={{ title: 'CRM' }}
    />
    <Stack.Screen 
      name="LeadDetail" 
      component={LeadDetailScreen}
      options={{ title: 'Lead Details' }}
    />
    <Stack.Screen 
      name="CustomerDetail" 
      component={CustomerDetailScreen}
      options={{ title: 'Customer Details' }}
    />
  </Stack.Navigator>
);

const MainNavigator: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Properties') {
            iconName = focused ? 'business' : 'business-outline';
          } else if (route.name === 'CRM') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'ERP') {
            iconName = focused ? 'analytics' : 'analytics-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Properties" component={PropertiesStack} />
      <Tab.Screen name="CRM" component={CRMStack} />
      <Tab.Screen name="ERP" component={ERPScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default MainNavigator;
