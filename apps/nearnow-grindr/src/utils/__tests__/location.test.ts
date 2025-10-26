import { describe, it, expect } from 'vitest';

describe('Location Utils', () => {
  it('should calculate distance between two points', () => {
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371; // Earth's radius in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };

    // Test with known coordinates (New York to Los Angeles)
    const distance = calculateDistance(40.7128, -74.0060, 34.0522, -118.2437);
    expect(distance).toBeCloseTo(3944, 0); // Approximately 3944 km
  });

  it('should format distance for display', () => {
    const formatDistance = (distanceKm: number) => {
      if (distanceKm < 1) {
        return `${Math.round(distanceKm * 1000)}m`;
      }
      return `${Math.round(distanceKm)}km`;
    };

    expect(formatDistance(0.5)).toBe('500m');
    expect(formatDistance(1.2)).toBe('1km');
    expect(formatDistance(15.7)).toBe('16km');
  });

  it('should check if location is within range', () => {
    const isWithinRange = (userLat: number, userLon: number, targetLat: number, targetLon: number, maxDistanceKm: number) => {
      const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
      };
      
      const distance = calculateDistance(userLat, userLon, targetLat, targetLon);
      return distance <= maxDistanceKm;
    };

    expect(isWithinRange(40.7128, -74.0060, 40.7589, -73.9851, 10)).toBe(true); // NYC to Central Park
    expect(isWithinRange(40.7128, -74.0060, 34.0522, -118.2437, 100)).toBe(false); // NYC to LA
  });
});
