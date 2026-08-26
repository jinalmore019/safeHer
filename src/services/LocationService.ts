import * as Location from 'expo-location';
import { LocationSnapshot } from '../types/models';

export const LocationService = {
  requestPermissions: async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (e) {
      console.error('Failed to request location permissions', e);
      return false;
    }
  },

  getCurrentLocation: async (incidentId?: string): Promise<LocationSnapshot | null> => {
    try {
      // Check if permission is granted before trying
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      return {
        id: Date.now().toString() + Math.random().toString(36).substring(7),
        incidentId: incidentId || 'none',
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || 0,
        timestamp: new Date(location.timestamp).toISOString(),
      };
    } catch (e) {
      console.error('Failed to get location', e);
      return null;
    }
  }
};
