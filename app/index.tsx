import { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import NetInfo from '@react-native-community/netinfo';

import WebViewComponent from '@/components/WebViewComponent';
import SocialFollowModal from '@/components/SocialFollowModal';
import NoInternetScreen from '@/components/NoInternetScreen';
import ErrorScreen from '@/components/ErrorScreen';
import { useNotifications } from '@/hooks/useNotifications';

SplashScreen.preventAutoHideAsync();

export default function HomeScreen() {
  const [appReady, setAppReady] = useState(false);
  const [showError, setShowError] = useState(false);
  const [showNoInternet, setShowNoInternet] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  const { expoPushToken } = useNotifications();

  useEffect(() => {
    const timer = setTimeout(async () => {
      setAppReady(true);
      await SplashScreen.hideAsync();
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = state.isConnected ?? false;
      setIsConnected(connected);
      if (!connected) {
        setShowNoInternet(true);
        setShowError(false);
      } else {
        setShowNoInternet(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (expoPushToken) {
      console.log('Push Token (save this on your server):', expoPushToken);
    }
  }, [expoPushToken]);

  const handleRetry = () => {
    setShowError(false);
    setShowNoInternet(false);
  };

  const handleError = () => {
    if (isConnected) {
      setShowError(true);
    }
  };

  const handleNoInternet = () => {
    setShowNoInternet(true);
  };

  if (!appReady) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      {showNoInternet ? (
        <NoInternetScreen onRetry={handleRetry} />
      ) : showError ? (
        <ErrorScreen onRetry={handleRetry} />
      ) : (
        <WebViewComponent onError={handleError} onNoInternet={handleNoInternet} />
      )}
      <SocialFollowModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});
