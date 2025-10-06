import { Platform, Alert } from 'react-native';
import PushNotification from 'react-native-push-notification';
import { PermissionsAndroid } from 'react-native';

class NotificationUtils {
  private isInitialized: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    if (this.isInitialized) return;

    PushNotification.configure({
      // Called when token is generated
      onRegister: (token) => {
        console.log('FCM Token:', token);
        // Store token for server communication
        this.storeToken(token.token);
      },

      // Called when a remote or local notification is opened or received
      onNotification: (notification) => {
        console.log('Notification received:', notification);
        
        // Handle different notification types
        this.handleNotification(notification);
      },

      // Called when the user fails to register for remote notifications
      onRegistrationError: (err) => {
        console.error('Notification registration error:', err);
      },

      // IOS only: Called when the user taps on a notification
      onNotificationOpenedApp: (notification) => {
        console.log('Notification opened app:', notification);
        this.handleNotificationTap(notification);
      },

      // Should the initial notification be popped automatically
      popInitialNotification: true,

      // Request permissions on init
      requestPermissions: Platform.OS === 'ios',
    });

    this.isInitialized = true;
  }

  // Request notification permissions
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: 'Notification Permission',
            message: 'This app needs notification permission to send you updates about properties and bookings.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn('Permission request error:', err);
        return false;
      }
    }
    return true;
  }

  // Store FCM token
  private storeToken(token: string): void {
    // Store token in AsyncStorage or send to server
    console.log('Storing FCM token:', token);
  }

  // Handle notification
  private handleNotification(notification: any): void {
    const { data, userInteraction } = notification;

    if (userInteraction) {
      // User tapped the notification
      this.handleNotificationTap(notification);
    } else {
      // Notification was received in foreground
      this.showInAppNotification(notification);
    }
  }

  // Handle notification tap
  private handleNotificationTap(notification: any): void {
    const { data } = notification;

    // Navigate based on notification type
    if (data?.type) {
      switch (data.type) {
        case 'PROPERTY_UPDATE':
          // Navigate to property details
          console.log('Navigate to property:', data.propertyId);
          break;
        case 'BOOKING_UPDATE':
          // Navigate to booking details
          console.log('Navigate to booking:', data.bookingId);
          break;
        case 'LEAD_UPDATE':
          // Navigate to lead details
          console.log('Navigate to lead:', data.leadId);
          break;
        case 'PAYMENT_UPDATE':
          // Navigate to payment details
          console.log('Navigate to payment:', data.paymentId);
          break;
        default:
          // Navigate to home
          console.log('Navigate to home');
      }
    }
  }

  // Show in-app notification
  private showInAppNotification(notification: any): void {
    const { title, message } = notification;

    Alert.alert(
      title || 'Property Management',
      message || 'You have a new notification',
      [
        { text: 'OK', onPress: () => console.log('OK Pressed') },
        { text: 'View', onPress: () => this.handleNotificationTap(notification) },
      ]
    );
  }

  // Send local notification
  sendLocalNotification(title: string, message: string, data?: any): void {
    PushNotification.localNotification({
      title,
      message,
      data,
      playSound: true,
      soundName: 'default',
      vibrate: true,
      vibration: 300,
      priority: 'high',
      importance: 'high',
    });
  }

  // Send scheduled notification
  sendScheduledNotification(
    title: string,
    message: string,
    date: Date,
    data?: any
  ): void {
    PushNotification.localNotificationSchedule({
      title,
      message,
      date,
      data,
      playSound: true,
      soundName: 'default',
      vibrate: true,
      vibration: 300,
      priority: 'high',
      importance: 'high',
    });
  }

  // Cancel all notifications
  cancelAllNotifications(): void {
    PushNotification.cancelAllLocalNotifications();
  }

  // Cancel specific notification
  cancelNotification(id: string): void {
    PushNotification.cancelLocalNotifications({ id });
  }

  // Get notification settings
  async getNotificationSettings(): Promise<any> {
    return new Promise((resolve) => {
      PushNotification.checkPermissions((permissions) => {
        resolve(permissions);
      });
    });
  }

  // Create notification channels (Android)
  createNotificationChannels(): void {
    if (Platform.OS === 'android') {
      PushNotification.createChannel(
        {
          channelId: 'property-management-general',
          channelName: 'General Notifications',
          channelDescription: 'General notifications about the app',
          playSound: true,
          soundName: 'default',
          importance: 4,
          vibrate: true,
        },
        (created) => console.log('General channel created:', created)
      );

      PushNotification.createChannel(
        {
          channelId: 'property-management-urgent',
          channelName: 'Urgent Notifications',
          channelDescription: 'Urgent notifications that require immediate attention',
          playSound: true,
          soundName: 'default',
          importance: 5,
          vibrate: true,
        },
        (created) => console.log('Urgent channel created:', created)
      );

      PushNotification.createChannel(
        {
          channelId: 'property-management-silent',
          channelName: 'Silent Notifications',
          channelDescription: 'Silent notifications for background updates',
          playSound: false,
          importance: 2,
          vibrate: false,
        },
        (created) => console.log('Silent channel created:', created)
      );
    }
  }

  // Send property update notification
  sendPropertyUpdateNotification(propertyName: string, propertyId: string): void {
    this.sendLocalNotification(
      'Property Updated',
      `${propertyName} has been updated`,
      {
        type: 'PROPERTY_UPDATE',
        propertyId,
      }
    );
  }

  // Send booking update notification
  sendBookingUpdateNotification(bookingId: string, status: string): void {
    this.sendLocalNotification(
      'Booking Updated',
      `Your booking status has been updated to ${status}`,
      {
        type: 'BOOKING_UPDATE',
        bookingId,
      }
    );
  }

  // Send lead update notification
  sendLeadUpdateNotification(leadName: string, leadId: string, score: number): void {
    this.sendLocalNotification(
      'Lead Updated',
      `${leadName} lead score updated to ${score}`,
      {
        type: 'LEAD_UPDATE',
        leadId,
      }
    );
  }

  // Send payment update notification
  sendPaymentUpdateNotification(amount: number, paymentId: string, status: string): void {
    this.sendLocalNotification(
      'Payment Updated',
      `Payment of ₹${amount.toLocaleString()} is ${status}`,
      {
        type: 'PAYMENT_UPDATE',
        paymentId,
      }
    );
  }

  // Send offline sync notification
  sendOfflineSyncNotification(syncedCount: number): void {
    this.sendLocalNotification(
      'Data Synced',
      `${syncedCount} items synced successfully`,
      {
        type: 'SYNC_UPDATE',
      }
    );
  }
}

export default new NotificationUtils();
