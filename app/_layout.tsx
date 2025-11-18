// import { useEffect } from 'react';
// import { Stack } from 'expo-router';
// import { StatusBar } from 'expo-status-bar';
// import { useFrameworkReady } from '@/hooks/useFrameworkReady';

// export default function RootLayout() {
//   useFrameworkReady();

//   return (
//     <>
//       <Stack screenOptions={{ headerShown: false }}>
//         <Stack.Screen name="+not-found" />
//       </Stack>
//       <StatusBar style="auto" />
//     </>
//   );
// }

import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import * as SplashScreen from "expo-splash-screen";
import LottieView from "lottie-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  Linking,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

// Immediately hide any default splash screen
SplashScreen.hideAsync().catch(() => {
  // Ignore errors if splash screen is already hidden
});

// Set the animation options. This is optional.
SplashScreen.setOptions({
  duration: 1000,
  fade: true,
});

// Enhanced notification handler with better configuration
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    // Check if app is in foreground
    const appState = AppState.currentState;

    return {
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: appState !== "active", // Don't show banner when app is active
      shouldShowList: true,
      shouldShowAlert: appState !== "active",
    };
  },
});

// Enhanced push notification sender with better error handling
async function sendPushNotification(
  expoPushToken: string,
  title?: string,
  body?: string,
  data?: any
) {
  if (!expoPushToken || expoPushToken.includes("Error")) {
    console.error("Invalid push token:", expoPushToken);
    return { success: false, error: "Invalid push token" };
  }

  const message = {
    to: expoPushToken,
    sound: "default",
    title: title || "score fusion Notification",
    body: body || "You have a new notification from score fusion",
    data: data || { source: "scorefusion" },
    badge: 1,
    priority: "high" as const,
    channelId: "default",
  };

  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    const responseData = await response.json();

    if (response.ok) {
      console.log("Push notification sent successfully:", responseData);
      return { success: true, data: responseData };
    } else {
      console.error("Failed to send push notification:", responseData);
      return { success: false, error: responseData };
    }
  } catch (error) {
    console.error("Error sending push notification:", error);
    return { success: false, error: error };
  }
}

// Enhanced error handler with user feedback
function handleRegistrationError(
  errorMessage: string,
  showAlert: boolean = true
) {
  console.error("Push notification registration error:", errorMessage);

  if (showAlert) {
    Alert.alert(
      "Notification Setup",
      "Push notifications couldn't be enabled. You can still use the app, but you won't receive notifications.",
      [{ text: "OK" }]
    );
  }

  // Don't throw error, just log it
  return null;
}

// Enhanced push notification registration with better error handling
async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  try {
    // Check if running on physical device
    if (!Device.isDevice) {
      console.warn("Push notifications only work on physical devices");
      return null;
    }

    // Configure Android notification channel
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#ff9100ff",
        sound: "default",
        showBadge: true,
      });
    }

    // Check existing permissions
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not granted
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      finalStatus = status;
    }

    // Handle permission denial
    if (finalStatus !== "granted") {
      handleRegistrationError(
        "Notification permissions not granted. Please enable notifications in your device settings.",
        true
      );
      return null;
    }

    // Get project ID
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;

    if (!projectId) {
      handleRegistrationError(
        "Project ID not found in app configuration",
        false
      );
      return null;
    }

    // Get push token
    const pushTokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    token = pushTokenData.data;
    console.log("Push token obtained:", token);

    // Store token locally for later use
    await AsyncStorage.setItem("expoPushToken", token);

    return token;
  } catch (error) {
    handleRegistrationError(`Failed to get push token: ${error}`, false);
    return null;
  }
}

// Enhanced network connectivity checker
const checkNetworkConnectivity = async (): Promise<boolean> => {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected === true && state.isInternetReachable === true;
  } catch (error) {
    console.error("Network check failed:", error);
    return false;
  }
};

const App = () => {
  // State management
  const [isConnected, setIsConnected] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [webViewError, setWebViewError] = useState(false);
  const [webViewLoading, setWebViewLoading] = useState(false);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<
    Notifications.Notification | undefined
  >(undefined);
  const [notificationPermissionStatus, setNotificationPermissionStatus] =
    useState<string>("unknown");
  const [appIsReady, setAppIsReady] = useState(false);

  // Refs
  const webViewRef = useRef<WebView>(null);
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  // Initialize app
  useEffect(() => {
    let isMounted = true;

    const initializeApp = async () => {
      try {
        // 1. Check network connectivity
        const connected = await checkNetworkConnectivity();
        if (isMounted) {
          setIsConnected(connected);
        }

        // 2. Initialize push notifications
        const { status } = await Notifications.getPermissionsAsync();
        if (isMounted) {
          setNotificationPermissionStatus(status);
        }

        const token = await registerForPushNotificationsAsync();
        if (isMounted) {
          setExpoPushToken(token);
        }

        // 3. Minimum loading time for smooth UX (optional)
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn("App initialization error:", e);
      } finally {
        if (isMounted) {
          setAppIsReady(true);
          // Wait a moment then hide custom splash
          setTimeout(() => {
            if (isMounted) {
              setShowSplash(false);
              setIsLoading(false);
            }
          }, 1000);
        }
      }
    };

    initializeApp();

    return () => {
      isMounted = false;
    };
  }, []);

  // Set up notification listeners
  useEffect(() => {
    if (!appIsReady) return;

    // Set up notification listeners
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("Notification received:", notification);
        setNotification(notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("Notification response:", response);
        // Handle notification tap
        const data = response.notification.request.content.data;
        if (data && data.url) {
          // Navigate to specific URL if provided
          webViewRef.current?.injectJavaScript(
            `window.location.href = '${data.url}';`
          );
        }
      });

    // Set up app state change listener for notification badge
    const appStateListener = AppState.addEventListener(
      "change",
      (nextAppState) => {
        if (nextAppState === "active") {
          // Clear badge when app becomes active
          Notifications.setBadgeCountAsync(0);
        }
      }
    );

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
      appStateListener.remove();
    };
  }, [appIsReady]);

  // Network connectivity listener
  useEffect(() => {
    if (!appIsReady) return;

    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(
        state.isConnected === true && state.isInternetReachable === true
      );
    });

    return unsubscribe;
  }, [appIsReady]);

  // Enhanced retry handler
  const handleRetry = async () => {
    setWebViewError(false);
    setIsLoading(true);

    try {
      const connected = await checkNetworkConnectivity();
      setIsConnected(connected);

      if (connected && webViewRef.current) {
        webViewRef.current.reload();
      }
    } catch (error) {
      console.error("Retry failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // WebView event handlers
  const onWebViewLoadStart = () => {
    setWebViewLoading(true);
    setWebViewError(false);
  };

  const onWebViewLoadEnd = () => {
    setWebViewLoading(false);
  };

  const onWebViewError = (syntheticEvent: any) => {
    console.error("WebView error:", syntheticEvent.nativeEvent);
    setWebViewError(true);
    setWebViewLoading(false);
  };

  // Handle WebView navigation
  const onWebViewNavigationStateChange = (navState: any) => {
    console.log("Navigation state changed:", navState.url);
    // You can implement custom navigation logic here
  };

  // Test push notification function (for debugging)
  const testPushNotification = async () => {
    if (expoPushToken) {
      const result = await sendPushNotification(
        expoPushToken,
        "Test Notification",
        "This is a test notification from Score Fusion",
        { test: true }
      );

      Alert.alert(
        "Test Notification",
        result.success
          ? "Notification sent successfully!"
          : `Failed: ${result.error}`,
        [{ text: "OK" }]
      );
    } else {
      Alert.alert(
        "No Push Token",
        "Push notifications are not available. Please restart the app.",
        [{ text: "OK" }]
      );
    }
  };

  // URL to load in WebView
  const webUrl = "https://app.getscorefusion.com/dashboard";

  // Enhanced Splash Screen Component
  const CustomSplashScreen = () => (
    <SafeAreaView style={styles.splashContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#ffffffff" />
      <View style={styles.splashContent}>
        <LottieView
          source={require("../assets/lottie/splash.json")}
          autoPlay
          loop
          style={styles.lottieAnimation}
        />
        <Text style={styles.splashTitle}>score fusion</Text>
        <Text style={styles.splashLoadingText}>
          Loaading your experience...
        </Text>
        <View style={styles.splashIndicator}>
          <ActivityIndicator size="small" color="#ffffff" />
        </View>
      </View>
    </SafeAreaView>
  );

  // Enhanced Error Screen Component
  const ErrorScreen = ({
    message,
    onRetry,
    showSettings = false,
  }: {
    message: string;
    onRetry: () => void;
    showSettings?: boolean;
  }) => (
    <SafeAreaView style={styles.errorContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={styles.errorContent}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Connection Issue</Text>
        <Text style={styles.errorMessage}>{message}</Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>

          {showSettings && (
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => Linking.openSettings()}
            >
              <Text style={styles.settingsButtonText}>Open Settings</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );

  // Enhanced Preloader Component
  const Preloader = () => (
    setTimeout(() => {
      setWebViewLoading(false);
    }, 3000), // Auto-hide after 5 seconds
    (
      <View style={styles.preloaderContainer}>
        <ActivityIndicator size="large" color="#ff9100ff" />
        <Text style={styles.preloaderText}>Loading...</Text>
      </View>
    )
  );

  // Show custom splash screen immediately
  if (showSplash) {
    return <CustomSplashScreen />;
  }

  // Show error screen for no internet
  if (!isConnected) {
    return (
      <ErrorScreen
        message="No internet connection detected. Please check your network settings and try again."
        onRetry={handleRetry}
        showSettings={true}
      />
    );
  }

  // Show error screen for WebView errors
  if (webViewError) {
    return (
      <ErrorScreen
        message="Unable to load Score Fusion dashboard. Please check your connection and try again."
        onRetry={handleRetry}
      />
    );
  }

  // Show loading screen
  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <ActivityIndicator size="large" color="#ff9100ff" />
        <Text style={styles.loadingText}>Initializing your experience...</Text>
      </SafeAreaView>
    );
  }

  // Main WebView
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* WebView Preloader */}
      {webViewLoading && <Preloader />}

      <WebView
        ref={webViewRef}
        source={{ uri: webUrl }}
        style={styles.webview}
        onLoadStart={onWebViewLoadStart}
        onLoadEnd={onWebViewLoadEnd}
        onError={onWebViewError}
        onNavigationStateChange={onWebViewNavigationStateChange}
        startInLoadingState={true}
        renderLoading={() => <Preloader />}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        mixedContentMode="compatibility"
        thirdPartyCookiesEnabled={true}
        cacheEnabled={true}
        incognito={false}
        allowsBackForwardNavigationGestures={true}
        userAgent="Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36 Score FusionApp/1.0"
        injectedJavaScript={`
          // Inject push token into web page for backend integration
          window.expoPushToken = '${expoPushToken || ""}';
          window.notificationPermissionStatus = '${notificationPermissionStatus}';
          true; // note: this is required, or you'll sometimes get silent failures
        `}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0,
    flex: 1,
    backgroundColor: "#ffffff",
  },

  // Enhanced Splash Screen Styles
  splashContainer: {
    flex: 1,
    backgroundColor: "#fefefeff",
    justifyContent: "center",
    alignItems: "center",
  },
  splashContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  lottieAnimation: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  splashTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 10,
  },
  splashLoadingText: {
    color: "#ffffff",
    fontSize: 16,
    opacity: 0.9,
    textAlign: "center",
    marginBottom: 20,
  },
  splashIndicator: {
    marginTop: 10,
  },

  // Enhanced Error Screen Styles
  errorContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorContent: {
    alignItems: "center",
    maxWidth: 320,
  },
  errorIcon: {
    fontSize: 72,
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#333333",
    textAlign: "center",
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 40,
  },
  buttonContainer: {
    width: "100%",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    // paddingHorizontal: 20,
    // paddingVertical: 10,
  },
  retryButton: {
    backgroundColor: "#ff9100ff",
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 2,
    marginBottom: 15,
  },
  retryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  settingsButton: {
    backgroundColor: "transparent",
    paddingHorizontal: 20,
    paddingVertical: 13,
    marginBottom: 15,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "#ff9100ff",
  },
  settingsButtonText: {
    color: "#ff9100ff",
    fontSize: 16,
    fontWeight: "600",
  },

  // Enhanced Loading Screen Styles
  loadingContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
  },

  // Enhanced Preloader Styles
  preloaderContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  preloaderText: {
    marginTop: 15,
    fontSize: 16,
    color: "#ff9100ff",
    fontWeight: "500",
    textAlign: "center",
  },

  webview: {
    flex: 1,
  },

  // Debug button (remove in production)
  debugButton: {
    position: "absolute",
    bottom: 50,
    right: 20,
    backgroundColor: "#FF6B6B",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 2,
    zIndex: 1000,
  },
  debugButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
});

export default App;
