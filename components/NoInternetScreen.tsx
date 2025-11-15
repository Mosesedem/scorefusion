import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { WifiOff, RefreshCcw } from 'lucide-react-native';

interface NoInternetScreenProps {
  onRetry: () => void;
}

export default function NoInternetScreen({ onRetry }: NoInternetScreenProps) {
  return (
    <View style={styles.container}>
      <WifiOff size={80} color="#999999" strokeWidth={1.5} />
      <Text style={styles.title}>No Internet Connection</Text>
      <Text style={styles.message}>
        Please check your internet connection and try again.
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <RefreshCcw size={20} color="#ffffff" strokeWidth={2} />
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333333',
    marginTop: 24,
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
