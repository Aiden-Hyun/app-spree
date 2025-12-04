import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from "react-native";
import { ProtectedRoute } from "../src/components/ProtectedRoute";

function HelpScreen() {
  const faqs = [
    {
      question: "How do I change my location settings?",
      answer:
        "Go to your device settings > NearNow > Location and select your preferred option. For the best experience, we recommend 'Always Allow'.",
    },
    {
      question: "Why can't I see anyone nearby?",
      answer:
        "Make sure location services are enabled and try expanding your search radius in Settings. Also check if your profile is set to active.",
    },
    {
      question: "How do matches work?",
      answer:
        "When you tap someone and they tap you back, it creates a match! You'll get a notification and can start chatting immediately.",
    },
    {
      question: "Can I undo a tap?",
      answer:
        "Currently, taps cannot be undone. Be thoughtful about who you tap!",
    },
    {
      question: "How do I report inappropriate behavior?",
      answer:
        "You can block users from their profile. For serious issues, contact our support team at support@nearnow.app",
    },
    {
      question: "Is my location private?",
      answer:
        "Yes! We never share your exact location. Other users only see approximate distances, and you can hide your distance completely in privacy settings.",
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        {faqs.map((faq, index) => (
          <View key={index} style={styles.faqItem}>
            <Text style={styles.question}>{faq.question}</Text>
            <Text style={styles.answer}>{faq.answer}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Support</Text>

        <TouchableOpacity
          style={styles.contactItem}
          onPress={() => Linking.openURL("mailto:support@nearnow.app")}
        >
          <Text style={styles.contactIcon}>📧</Text>
          <View style={styles.contactInfo}>
            <Text style={styles.contactTitle}>Email Support</Text>
            <Text style={styles.contactText}>support@nearnow.app</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.contactItem}
          onPress={() => Linking.openURL("https://twitter.com/nearnowapp")}
        >
          <Text style={styles.contactIcon}>🐦</Text>
          <View style={styles.contactInfo}>
            <Text style={styles.contactTitle}>Twitter</Text>
            <Text style={styles.contactText}>@nearnowapp</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Safety Tips</Text>

        <View style={styles.tip}>
          <Text style={styles.tipIcon}>🛡️</Text>
          <Text style={styles.tipText}>
            Never share personal information like your address or financial
            details
          </Text>
        </View>

        <View style={styles.tip}>
          <Text style={styles.tipIcon}>📍</Text>
          <Text style={styles.tipText}>
            Meet in public places for the first time
          </Text>
        </View>

        <View style={styles.tip}>
          <Text style={styles.tipIcon}>🚨</Text>
          <Text style={styles.tipText}>
            Trust your instincts - if something feels wrong, it probably is
          </Text>
        </View>

        <View style={styles.tip}>
          <Text style={styles.tipIcon}>📱</Text>
          <Text style={styles.tipText}>
            Tell a friend where you're going when meeting someone new
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.version}>NearNow v1.0.0</Text>
        <Text style={styles.copyright}>
          © 2024 NearNow. All rights reserved.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  section: {
    backgroundColor: "white",
    marginTop: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#95a5a6",
    textTransform: "uppercase",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  faqItem: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  question: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2d3436",
    marginBottom: 8,
  },
  answer: {
    fontSize: 14,
    color: "#636e72",
    lineHeight: 20,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  contactIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#2d3436",
    marginBottom: 2,
  },
  contactText: {
    fontSize: 14,
    color: "#636e72",
  },
  tip: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  tipIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: "#636e72",
    lineHeight: 20,
  },
  footer: {
    alignItems: "center",
    padding: 32,
  },
  version: {
    fontSize: 14,
    color: "#95a5a6",
    marginBottom: 4,
  },
  copyright: {
    fontSize: 12,
    color: "#b2bec3",
  },
});

export default function Help() {
  return (
    <ProtectedRoute>
      <HelpScreen />
    </ProtectedRoute>
  );
}


