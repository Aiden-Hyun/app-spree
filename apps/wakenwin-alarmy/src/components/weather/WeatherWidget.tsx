import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WeatherService } from "../../services/weatherService";

interface WeatherData {
  temperature: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  city: string;
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWeather();
  }, []);

  const fetchWeather = async () => {
    try {
      const data = await WeatherService.getCurrentWeather();
      setWeather(data);
    } catch (error) {
      console.error("Error fetching weather:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading weather...</Text>
      </View>
    );
  }

  if (!weather) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.mainInfo}>
        <Ionicons
          name={WeatherService.getWeatherIcon(weather.icon) as any}
          size={48}
          color="#fff"
        />
        <Text style={styles.temperature}>{weather.temperature}°C</Text>
      </View>
      <Text style={styles.description}>{weather.description}</Text>
      <Text style={styles.city}>{weather.city}</Text>
      <View style={styles.details}>
        <View style={styles.detailItem}>
          <Ionicons name="water" size={16} color="#ecf0f1" />
          <Text style={styles.detailText}>{weather.humidity}%</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="speedometer" size={16} color="#ecf0f1" />
          <Text style={styles.detailText}>{weather.windSpeed} m/s</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  loadingText: {
    color: "#ecf0f1",
    fontSize: 14,
  },
  mainInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 8,
  },
  temperature: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#fff",
  },
  description: {
    fontSize: 16,
    color: "#ecf0f1",
    textTransform: "capitalize",
  },
  city: {
    fontSize: 14,
    color: "#bdc3c7",
    marginTop: 4,
  },
  details: {
    flexDirection: "row",
    gap: 20,
    marginTop: 12,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    color: "#ecf0f1",
  },
});
