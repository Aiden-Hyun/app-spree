import { describe, it, expect } from 'vitest';

describe('Listing Utils', () => {
  it('should format price for display', () => {
    const formatPrice = (price: number, currency: string = 'CAD') => {
      return new Intl.NumberFormat('en-CA', {
        style: 'currency',
        currency: currency,
      }).format(price);
    };

    expect(formatPrice(25.99)).toBe('$25.99');
    expect(formatPrice(1000, 'USD')).toBe('$1,000.00');
    expect(formatPrice(0)).toBe('$0.00');
  });

  it('should calculate distance between locations', () => {
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

    // Test with Toronto coordinates
    const distance = calculateDistance(43.6532, -79.3832, 43.6426, -79.3871);
    expect(distance).toBeCloseTo(1.2, 1); // Approximately 1.2 km
  });

  it('should format listing age', () => {
    const formatListingAge = (createdAt: Date) => {
      const now = new Date();
      const diffTime = now.getTime() - createdAt.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      return `${Math.floor(diffDays / 30)} months ago`;
    };

    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    expect(formatListingAge(today)).toBe('Today');
    expect(formatListingAge(yesterday)).toBe('Yesterday');
    expect(formatListingAge(lastWeek)).toBe('1 weeks ago');
  });
});