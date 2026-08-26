import * as Location from 'expo-location';

export interface RouteInfo {
  coordinates: { latitude: number; longitude: number }[];
  distanceKm: number;
  durationMinutes: number;
}

export const RoutingService = {
  /**
   * Resolves a human-readable address/place name into coordinates.
   * Uses expo-location's native geocoder which leverages Google Play Services (Android)
   * or CoreLocation (iOS) for free, accurate local resolution without API keys.
   */
  geocodeAddress: async (address: string): Promise<{ latitude: number; longitude: number } | null> => {
    try {
      if (!address || !address.trim()) return null;
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permissions are required to geocode address.');
      }

      const results = await Location.geocodeAsync(address);
      if (results && results.length > 0) {
        return {
          latitude: results[0].latitude,
          longitude: results[0].longitude
        };
      }
      return null;
    } catch (error) {
      console.error(`[RoutingService] Geocoding failed for: ${address}`, error);
      throw error;
    }
  },

  /**
   * Fetches the polyline route, distance, and duration between source and destination coordinates.
   * Defaults to OSRM (Open Source Routing Machine) public API (free, no API key required),
   * but can be extended or configured to use Google Directions API via environment variables.
   */
  calculateRoute: async (
    source: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number }
  ): Promise<RouteInfo> => {
    // Check if a Google Maps API Key is configured via Expo's environment variables
    const googleApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (googleApiKey) {
      return await RoutingService.fetchGoogleDirections(source, destination, googleApiKey);
    } else {
      return await RoutingService.fetchOSRMRoute(source, destination);
    }
  },

  /**
   * Fetch route using the free OSRM public routing API.
   */
  fetchOSRMRoute: async (
    source: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number }
  ): Promise<RouteInfo> => {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${source.longitude},${source.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson`;
      
      console.log(`[RoutingService] Querying OSRM Route: ${url}`);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`OSRM API responded with status ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.routes || data.routes.length === 0) {
        throw new Error('No route found between these locations.');
      }

      const route = data.routes[0];
      const coordinates = route.geometry.coordinates.map((coord: any) => ({
        latitude: coord[1],
        longitude: coord[0]
      }));

      return {
        coordinates,
        distanceKm: Number((route.distance / 1000).toFixed(1)),
        durationMinutes: Math.round(route.duration / 60)
      };
    } catch (error) {
      console.error('[RoutingService] OSRM route calculation failed', error);
      throw error;
    }
  },

  /**
   * Fetch route using the official Google Directions API.
   */
  fetchGoogleDirections: async (
    source: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number },
    apiKey: string
  ): Promise<RouteInfo> => {
    try {
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${source.latitude},${source.longitude}&destination=${destination.latitude},${destination.longitude}&key=${apiKey}`;
      
      console.log(`[RoutingService] Querying Google Directions API...`);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Google API responded with status ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status !== 'OK' || !data.routes || data.routes.length === 0) {
        throw new Error(`Google Directions failed with status: ${data.status}`);
      }

      const route = data.routes[0];
      const leg = route.legs[0];
      
      // Google returns polyline in encoded format, we need to decode it.
      // For simple cross-platform compatibility, we map steps or decode the polyline.
      const coordinates = RoutingService.decodePolyline(route.overview_polyline.points);

      return {
        coordinates,
        distanceKm: Number((leg.distance.value / 1000).toFixed(1)),
        durationMinutes: Math.round(leg.duration.value / 60)
      };
    } catch (error) {
      console.error('[RoutingService] Google directions call failed, falling back to OSRM', error);
      return await RoutingService.fetchOSRMRoute(source, destination);
    }
  },

  /**
   * Helper utility to decode Google's overview_polyline string format.
   */
  decodePolyline: (encoded: string): { latitude: number; longitude: number }[] => {
    const points: { latitude: number; longitude: number }[] = [];
    let index = 0, len = encoded.length;
    let lat = 0, lng = 0;

    while (index < len) {
      let b, shift = 0, result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      points.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5
      });
    }

    return points;
  }
};
