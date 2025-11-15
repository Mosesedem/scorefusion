import AsyncStorage from "@react-native-async-storage/async-storage";
import * as WebBrowser from "expo-web-browser";
import { MailIcon, MessageCircle, Users } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const STORAGE_KEY = "@social_popup_dismiss";
const ONE_DAY = 24 * 60 * 60 * 1000;
const THREE_DAYS = 3 * ONE_DAY;

const SOCIAL_LINKS = {
  telegram: "https://t.me/Donaldauthorr",
  channel: "https://t.me/+QysfcefOapnhAbKA",
  email:
    "mailto:Scorefusionn@gmail.com?subject=VIP%20Subscription%20Payment&body=Hi,%0D%0A%0D%0AI%20want%20to%20subscribe%20to%20the%20",
  // facebook: "https://www.facebook.com/scorefusion",
  // tiktok: "https://www.tiktok.com/@scorefusion",
  whatsapp:
    "https://api.whatsapp.com/send?phone=84589950720&text=Hello%2C%20I%20would%20like%20to%20get%20in%20touch%20with%20Score%20Fusion.",
};

export default function SocialFollowModal() {
  const [visible, setVisible] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    checkShouldShowModal();
  }, []);

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const checkShouldShowModal = async () => {
    try {
      const dismissData = await AsyncStorage.getItem(STORAGE_KEY);

      if (!dismissData) {
        setVisible(true);
        return;
      }

      const { timestamp } = JSON.parse(dismissData);
      const now = Date.now();

      if (now - timestamp > 0) {
        setVisible(true);
      }
    } catch (error) {
      console.error("Error checking modal state:", error);
      setVisible(true);
    }
  };

  const handleDismiss = async (duration: number) => {
    try {
      const dismissUntil = Date.now() + duration;
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ timestamp: dismissUntil })
      );

      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setVisible(false);
      });
    } catch (error) {
      console.error("Error saving dismiss state:", error);
    }
  };

  const handleSocialPress = async (platform: keyof typeof SOCIAL_LINKS) => {
    try {
      await WebBrowser.openBrowserAsync(SOCIAL_LINKS[platform]);
    } catch (error) {
      console.error("Error opening social link:", error);
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={() => handleDismiss(ONE_DAY)}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [
                {
                  scale: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.title}>Connect With Us</Text>
          <Text style={styles.message}>
            Follow and connect with us for updates, tips, and exclusive content!
          </Text>

          <View style={styles.socialButtons}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleSocialPress("whatsapp")}
            >
              <MessageCircle size={32} color="#25D366" strokeWidth={2} />
              <Text style={styles.socialText}>Whatsapp</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleSocialPress("telegram")}
            >
              <MessageCircle size={32} color="#0088cc" strokeWidth={2} />
              <Text style={styles.socialText}>Telegram</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleSocialPress("channel")}
            >
              <Users size={32} color="#0088cc" strokeWidth={2} />
              <Text style={styles.socialText}>Telegram Channel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleSocialPress("email")}
            >
              <MailIcon size={32} color="#000000" strokeWidth={2} />
              <Text style={styles.socialText}>Email</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dismissButtons}>
            <TouchableOpacity
              style={[styles.dismissButton, styles.remindLater]}
              onPress={() => handleDismiss(ONE_DAY)}
            >
              <Text style={styles.dismissButtonText}>Remind me later</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.dismissButton, styles.dontShow]}
              onPress={() => handleDismiss(THREE_DAYS)}
            >
              <Text style={styles.dismissButtonText}>Don't show for now</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: width * 0.85,
    maxWidth: 400,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a1a1a",
    textAlign: "center",
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  socialButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    marginBottom: 24,
  },
  socialButton: {
    alignItems: "center",
    padding: 12,
    width: "45%",
    marginBottom: 12,
  },
  socialText: {
    marginTop: 8,
    fontSize: 14,
    color: "#333333",
    fontWeight: "500",
  },
  dismissButtons: {
    gap: 12,
  },
  dismissButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  remindLater: {
    backgroundColor: "#f0f0f0",
  },
  dontShow: {
    backgroundColor: "#e8e8e8",
  },
  dismissButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333333",
  },
});
