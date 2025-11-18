import NetInfo from "@react-native-community/netinfo";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ErrorScreen from "@/components/ErrorScreen";
import InteractiveSplashScreen from "@/components/InteractiveSplashScreen";
import NoInternetScreen from "@/components/NoInternetScreen";
import SocialFollowModal from "@/components/SocialFollowModal";
import WebViewComponent from "@/components/WebViewComponent";
import { useNotifications } from "@/hooks/useNotifications";

SplashScreen.preventAutoHideAsync();

export default function HomeScreen() {
  const [splashVisible, setSplashVisible] = useState(true);
  const [showError, setShowError] = useState(false);
  const [showNoInternet, setShowNoInternet] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  const { expoPushToken } = useNotifications();

  useEffect(() => {
    SplashScreen.hideAsync();
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
      console.log("Push Token (save this on your server):", expoPushToken);
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

  if (splashVisible) {
    return <InteractiveSplashScreen onReady={() => setSplashVisible(false)} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {showNoInternet ? (
        <NoInternetScreen onRetry={handleRetry} />
      ) : showError ? (
        <ErrorScreen onRetry={handleRetry} />
      ) : (
        <WebViewComponent
          onError={handleError}
          onNoInternet={handleNoInternet}
        />
      )}
      <SocialFollowModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
});
