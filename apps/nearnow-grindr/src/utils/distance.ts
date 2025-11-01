// Haversine formula to calculate distance between two coordinates
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  unit: "km" | "mi" = "km"
): number {
  const R = unit === "km" ? 6371 : 3959; // Earth's radius in km or miles
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Format distance for display
export function formatDistance(
  distance: number,
  unit: "km" | "mi" = "km"
): string {
  if (unit === "km") {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  } else {
    if (distance < 0.1) {
      return `${Math.round(distance * 5280)}ft`;
    }
    return `${distance.toFixed(1)}mi`;
  }
}

// Fuzzy location for privacy
export function fuzzyLocation(
  lat: number,
  lon: number,
  radiusMeters: number = 500
): { lat: number; lon: number } {
  // Convert radius from meters to degrees
  const radiusInDegrees = radiusMeters / 111320.0;

  // Generate random offset
  const u = Math.random();
  const v = Math.random();
  const w = radiusInDegrees * Math.sqrt(u);
  const t = 2 * Math.PI * v;
  const x = w * Math.cos(t);
  const y = w * Math.sin(t);

  // Adjust for latitude
  const newLat = lat + y;
  const newLon = lon + x / Math.cos((lat * Math.PI) / 180);

  return { lat: newLat, lon: newLon };
}

// Get users within a certain radius
export function isWithinRadius(
  userLat: number,
  userLon: number,
  targetLat: number,
  targetLon: number,
  radiusKm: number
): boolean {
  const distance = calculateDistance(
    userLat,
    userLon,
    targetLat,
    targetLon,
    "km"
  );
  return distance <= radiusKm;
}

// Sort users by distance
export function sortByDistance<
  T extends { location_lat?: number; location_lng?: number }
>(users: T[], userLat: number, userLon: number): (T & { distance?: number })[] {
  return users
    .map((user) => {
      if (user.location_lat && user.location_lng) {
        const distance = calculateDistance(
          userLat,
          userLon,
          user.location_lat,
          user.location_lng,
          "km"
        );
        return { ...user, distance };
      }
      return { ...user, distance: Infinity };
    })
    .sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
}
