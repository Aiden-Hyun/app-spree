import { Redirect } from "expo-router";
import { useAuth } from "../src/contexts/AuthContext";
import { View, ActivityIndicator, StyleSheet } from "react-native";

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#00b894" />
      </View>
    );
  }

  return user ? <Redirect href="/(tabs)/browse" /> : <Redirect href="/login" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
});
