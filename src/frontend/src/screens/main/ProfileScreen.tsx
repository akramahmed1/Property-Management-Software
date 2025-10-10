import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Title, Paragraph, Button, List, Divider, Switch } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';

import { RootState, AppDispatch } from '../../store';
import { logout } from '../../store/slices/authSlice';
import AccessibilityUtils from '../../utils/accessibility';
import I18nService, { Language } from '../../services/i18nService';

const ProfileScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();
  const { user } = useSelector((state: RootState) => state.auth);
  const [highContrast, setHighContrast] = useState(AccessibilityUtils.highContrastEnabled);
  const [currentLanguage, setCurrentLanguage] = useState(I18nService.getInstance().getCurrentLanguage());
  const [isRTL, setIsRTL] = useState(I18nService.getInstance().isRTL());

  const handleLogout = () => {
    dispatch(logout());
  };

  const handleEditProfile = () => {
    // Navigate to edit profile screen
  };

  const handleChangePassword = () => {
    // Navigate to change password screen
  };

  const handleSettings = () => {
    // Navigate to settings screen
  };

  const toggleHighContrast = () => {
    const next = !highContrast;
    setHighContrast(next);
    AccessibilityUtils.setHighContrast(next);
    console.log('High contrast mode:', next ? 'enabled' : 'disabled');
  };

  const switchLanguage = async (languageCode: string) => {
    try {
      const i18n = I18nService.getInstance();
      await i18n.setLanguage(languageCode);
      setCurrentLanguage(languageCode);
      setIsRTL(i18n.isRTL());
      console.log('Language switched to:', languageCode);
    } catch (error) {
      console.error('Failed to switch language:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.profileCard}>
        <Card.Content>
          <Title style={styles.profileTitle}>Profile</Title>
          <Paragraph style={styles.profileSubtitle}>
            {user?.name || 'User'}
          </Paragraph>
          <Paragraph style={styles.profileEmail}>
            {user?.email}
          </Paragraph>
          <Paragraph style={styles.profileRole}>
            {user?.role}
          </Paragraph>
        </Card.Content>
      </Card>

      <Card style={styles.menuCard}>
        <Card.Content>
          <List.Item
            title="Edit Profile"
            description="Update your personal information"
            left={(props) => <List.Icon {...props} icon="account-edit" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={handleEditProfile}
          />
          <Divider />
          <List.Item
            title="Change Password"
            description="Update your password"
            left={(props) => <List.Icon {...props} icon="lock" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={handleChangePassword}
          />
          <Divider />
          <List.Item
            title="High Contrast Mode"
            description="Improve visibility for low-vision and color-vision deficiencies"
            left={(props) => <List.Icon {...props} icon="contrast-circle" />}
            right={() => (
              <Switch value={highContrast} onValueChange={toggleHighContrast} />
            )}
          />
          <Divider />
          <List.Item
            title="Settings"
            description="App preferences and configuration"
            left={(props) => <List.Icon {...props} icon="cog" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={handleSettings}
          />
        </Card.Content>
      </Card>

      <Card style={styles.accessibilityCard}>
        <Card.Content>
          <Title>Accessibility & Language</Title>
          
          <List.Subheader>Visual Accessibility</List.Subheader>
          <List.Item
            title="High Contrast Mode"
            description={highContrast ? 'Enabled - Enhanced visibility for low vision' : 'Disabled - Standard color scheme'}
            left={(props) => <List.Icon {...props} icon="contrast-circle" />}
            right={() => (
              <Switch 
                value={highContrast} 
                onValueChange={toggleHighContrast}
                {...AccessibilityUtils.getSwitchProps('High Contrast Mode', highContrast, toggleHighContrast)}
              />
            )}
          />
          <Paragraph style={styles.accessibilityNote}>
            ♿ Improves visibility for users with low vision, color blindness (Deuteranopia, Protanopia), or working in bright sunlight
          </Paragraph>
          
          <Divider style={styles.sectionDivider} />
          
          <List.Subheader>Language & Region</List.Subheader>
          <List.Item
            title="English"
            description="Standard (LTR)"
            left={(props) => <List.Icon {...props} icon="web" />}
            right={() => (
              <Button 
                mode={currentLanguage === 'en' ? 'contained' : 'outlined'}
                compact
                onPress={() => switchLanguage('en')}
              >
                {currentLanguage === 'en' ? '✓ Active' : 'Switch'}
              </Button>
            )}
          />
          <List.Item
            title="العربية (Arabic)"
            description="Right-to-left (RTL)"
            left={(props) => <List.Icon {...props} icon="web" />}
            right={() => (
              <Button 
                mode={currentLanguage === 'ar' ? 'contained' : 'outlined'}
                compact
                onPress={() => switchLanguage('ar')}
              >
                {currentLanguage === 'ar' ? '✓ Active' : 'Switch'}
              </Button>
            )}
          />
          <Paragraph style={styles.accessibilityNote}>
            🌍 RTL layout automatically adjusts for Arabic. Currency and numbers format regionally.
          </Paragraph>
        </Card.Content>
      </Card>

      <Card style={styles.infoCard}>
        <Card.Content>
          <Title>App Information</Title>
          <Paragraph>Version: 1.0.0</Paragraph>
          <Paragraph>Build: 1</Paragraph>
        </Card.Content>
      </Card>

      <Button
        mode="contained"
        onPress={handleLogout}
        style={styles.logoutButton}
        buttonColor="#F44336"
      >
        Sign Out
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  profileCard: {
    margin: 16,
    elevation: 2,
  },
  profileTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  profileSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 14,
    color: '#2196F3',
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  menuCard: {
    margin: 16,
    marginTop: 0,
    elevation: 2,
  },
  accessibilityCard: {
    margin: 16,
    elevation: 2,
  },
  accessibilityNote: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 16,
    lineHeight: 18,
  },
  sectionDivider: {
    marginVertical: 12,
  },
  infoCard: {
    margin: 16,
    marginTop: 0,
    elevation: 2,
  },
  logoutButton: {
    margin: 16,
    marginTop: 0,
    paddingVertical: 8,
  },
});

export default ProfileScreen;
