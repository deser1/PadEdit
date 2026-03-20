import 'react-native-gesture-handler';
import './src/polyfills';
import React, { useEffect, useState, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { initDb } from './src/utils/database';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform, Alert } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Brak uprawnień do powiadomień push!');
      return;
    }
    try {
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      if (!projectId) {
        // Fallback jeśli nie używamy EAS build
        token = (await Notifications.getExpoPushTokenAsync()).data;
      } else {
        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      }
      console.log('Expo Push Token:', token);
    } catch (e) {
      console.log(e);
    }
  }

  return token;
}

export default function App() {
  const [dbInitialized, setDbInitialized] = useState(false);
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    // Inicjalizacja bazy danych
    const setupDb = async () => {
      try {
        await initDb();
        setDbInitialized(true);
      } catch (e) {
        console.error('Database initialization failed:', e);
      }
    };
    setupDb();

    // Inicjalizacja powiadomień push (dla serwerów CI/CD itp.)
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        // Tu można by wysłać token do własnego backendu/API
        console.log('Gotowy do odbierania powiadomień CI/CD');
      }
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      // Obsługa powiadomienia, gdy aplikacja jest na pierwszym planie
      console.log(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      // Reakcja na kliknięcie w powiadomienie
      console.log(response);
    });

    return () => {
      if (notificationListener.current) notificationListener.current.remove();
      if (responseListener.current) responseListener.current.remove();
    };
  }, []);

  if (!dbInitialized) {
    return null; // Można tu dodać ekran ładowania (SplashScreen)
  }

  return (
    <SafeAreaProvider>
      <AppNavigator />
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
