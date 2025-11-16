import NetInfo from "@react-native-community/netinfo";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

const WEBSITE_URL = "https://app.getscorefusion.com/";

interface WebViewComponentProps {
  onError?: () => void;
  onNoInternet?: () => void;
}

export default function WebViewComponent({
  onError,
  onNoInternet,
}: WebViewComponentProps) {
  const webViewRef = useRef<WebView>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected ?? false);
      if (!state.isConnected && onNoInternet) {
        onNoInternet();
      }
    });

    return () => unsubscribe();
  }, [onNoInternet]);

  const handleRefresh = () => {
    setRefreshing(true);
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleNavigationStateChange = (navState: any) => {
    const { url } = navState;
    const mainDomain = "getscorefusion.com";

    if (!url.includes(mainDomain)) {
      if (webViewRef.current) {
        webViewRef.current.stopLoading();
      }
      WebBrowser.openBrowserAsync(url);
      return false;
    }
  };

  const handleShouldStartLoadWithRequest = (request: any) => {
    const { url } = request;
    const mainDomain = "getscorefusion.com";

    if (!url.includes(mainDomain)) {
      WebBrowser.openBrowserAsync(url);
      return false;
    }

    return true;
  };

  const handleError = () => {
    setIsLoading(false);
    if (onError) {
      onError();
    }
  };

  if (!isConnected) {
    return null;
  }

  return (
    <View style={styles.container}>
      {Platform.OS === "ios" ? (
        <ScrollView
          contentContainerStyle={{ flex: 1 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          <WebView
            ref={webViewRef}
            source={{ uri: WEBSITE_URL }}
            style={styles.webview}
            onLoadStart={() => setIsLoading(true)}
            onLoadEnd={() => setIsLoading(false)}
            onError={handleError}
            onNavigationStateChange={handleNavigationStateChange}
            onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
            startInLoadingState={true}
            cacheEnabled={true}
            cacheMode="LOAD_CACHE_ELSE_NETWORK"
            javaScriptEnabled={true}
            domStorageEnabled={true}
            sharedCookiesEnabled={true}
          />
        </ScrollView>
      ) : (
        <WebView
          ref={webViewRef}
          source={{ uri: WEBSITE_URL }}
          style={styles.webview}
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}
          onError={handleError}
          onNavigationStateChange={handleNavigationStateChange}
          onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
          startInLoadingState={true}
          cacheEnabled={true}
          cacheMode="LOAD_CACHE_ELSE_NETWORK"
          javaScriptEnabled={true}
          domStorageEnabled={true}
          sharedCookiesEnabled={true}
          pullToRefreshEnabled={true}
        />
      )}

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFA500" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
  },
});
