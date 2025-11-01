import * as Location from "expo-location";

interface WeatherData {
  temperature: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  city: string;
}

export class WeatherService {
  private static readonly API_KEY =
    process.env.EXPO_PUBLIC_WEATHER_API_KEY || "";
  private static readonly BASE_URL = "https://api.openweathermap.org/data/2.5";

  static async getCurrentWeather(): Promise<WeatherData | null> {
    try {
      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Location permission not granted");
        return null;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // Fetch weather data
      const response = await fetch(
        `${this.BASE_URL}/weather?lat=${latitude}&lon=${longitude}&appid=${this.API_KEY}&units=metric`
      );

      if (!response.ok) {
        console.error("Weather API error:", response.status);
        return null;
      }

      const data = await response.json();

      return {
        temperature: Math.round(data.main.temp),
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        humidity: data.main.humidity,
        windSpeed: data.wind.speed,
        city: data.name,
      };
    } catch (error) {
      console.error("Error fetching weather:", error);
      return null;
    }
  }

  static getWeatherIcon(iconCode: string): string {
    const iconMap: { [key: string]: string } = {
      "01d": "sunny",
      "01n": "moon",
      "02d": "partly-sunny",
      "02n": "cloudy-night",
      "03d": "cloudy",
      "03n": "cloudy",
      "04d": "cloudy",
      "04n": "cloudy",
      "09d": "rainy",
      "09n": "rainy",
      "10d": "rainy",
      "10n": "rainy",
      "11d": "thunderstorm",
      "11n": "thunderstorm",
      "13d": "snow",
      "13n": "snow",
      "50d": "cloudy",
      "50n": "cloudy",
    };

    return iconMap[iconCode] || "cloudy";
  }

  static async getWeatherGreeting(): Promise<string> {
    const weather = await this.getCurrentWeather();
    if (!weather) {
      return "Have a great day!";
    }

    const { temperature, description } = weather;

    if (temperature < 0) {
      return `Brrr! It's ${temperature}°C and ${description}. Bundle up!`;
    } else if (temperature < 10) {
      return `It's chilly at ${temperature}°C with ${description}. Grab a jacket!`;
    } else if (temperature < 20) {
      return `Nice weather at ${temperature}°C with ${description}.`;
    } else if (temperature < 30) {
      return `Beautiful day! ${temperature}°C and ${description}.`;
    } else {
      return `Hot day ahead! ${temperature}°C with ${description}. Stay hydrated!`;
    }
  }
}
