export interface SafetyZone {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  radius: number; // in meters
  riskFactors: string[];
}

export interface SafetyScoreResult {
  score: number; // 0 - 100
  rating: 'EXCELLENT' | 'GOOD' | 'MODERATE' | 'CRITICAL';
  intersectedZones: SafetyZone[];
}

// Simulated danger zones already established in the Journey screen
export const COMMUNITY_DANGER_ZONES: SafetyZone[] = [
  {
    id: 1,
    name: "Low Lighting Zone (Sector 3)",
    latitude: 28.6150,
    longitude: 77.2100,
    radius: 200,
    riskFactors: ["Poor street lighting", "High isolated pathway risk"]
  },
  {
    id: 2,
    name: "High Incident Corridor (Terminal Link)",
    latitude: 28.6100,
    longitude: 77.2050,
    radius: 300,
    riskFactors: ["Past theft reports", "Low foot traffic"]
  }
];

export const SafetyScoringService = {
  /**
   * Calculates a safety score between 0 and 100 for a route polyline
   * by evaluating its proximity to community-reported danger zones.
   *
   * @param routeCoords - The array of coordinates representing the route geometry.
   * @returns SafetyScoreResult containing the safety score, safety rating, and warning descriptions.
   */
  calculateSafetyScore: (routeCoords: { latitude: number; longitude: number }[]): SafetyScoreResult => {
    if (!routeCoords || routeCoords.length === 0) {
      return { score: 100, rating: 'EXCELLENT', intersectedZones: [] };
    }

    const intersectedZones: SafetyZone[] = [];
    let minimumDistanceToAnyZone = Infinity;

    // Check if any point of the route polyline intersects or comes close to danger zones
    for (const zone of COMMUNITY_DANGER_ZONES) {
      let intersects = false;
      
      for (const coord of routeCoords) {
        const distance = SafetyScoringService.calculateDistance(
          coord.latitude,
          coord.longitude,
          zone.latitude,
          zone.longitude
        );

        if (distance <= zone.radius) {
          intersects = true;
          if (distance < minimumDistanceToAnyZone) {
            minimumDistanceToAnyZone = distance;
          }
          break;
        }
      }

      if (intersects) {
        intersectedZones.push(zone);
      }
    }

    // Safety scoring algorithm:
    // Base score is 100. Each intersected danger zone deducts 20 points.
    // Minimum score is 30.
    const deductions = intersectedZones.length * 20;
    const score = Math.max(100 - deductions, 30);

    let rating: SafetyScoreResult['rating'] = 'EXCELLENT';
    if (score >= 90) rating = 'EXCELLENT';
    else if (score >= 70) rating = 'GOOD';
    else if (score >= 50) rating = 'MODERATE';
    else rating = 'CRITICAL';

    return {
      score,
      rating,
      intersectedZones
    };
  },

  /**
   * Helper utility using Haversine formula to compute distance in meters between two coordinates.
   */
  calculateDistance: (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth radius in meters
    const phi1 = lat1 * Math.PI / 180;
    const phi2 = lat2 * Math.PI / 180;
    const deltaPhi = (lat2 - lat1) * Math.PI / 180;
    const deltaLambda = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
};
