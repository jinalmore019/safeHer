// Data Models — SafeHer
// Placeholder types for future feature implementation

export type UserRole = 'user' | 'guardian';

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: UserRole;
  createdAt: string;
  profileImageUri?: string;
  // Future: duress PIN, safe word, etc.
}

export interface TrustedContact {
  id: string;
  userId: string;
  name: string;
  phone: string;
  relationship: string;
  isVerified: boolean;
  notifyOnSOS: boolean;
  notifyOnLocation: boolean;
  createdAt: string;
}

export type IncidentType =
  | 'sos'
  | 'duress'
  | 'shake_trigger'
  | 'scream_trigger'
  | 'safe_word'
  | 'manual';

export type IncidentStatus = 'active' | 'resolved' | 'false_alarm' | 'cancelled';

export interface Incident {
  id: string;
  userId: string;
  triggerType: IncidentType;
  status: IncidentStatus;
  createdAt: string;
  confirmedAt?: string;
  resolvedAt?: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  notes?: string;
  synced?: boolean; // Offline sync status
}

export interface LocationSnapshot {
  id: string;
  incidentId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
}

// SOS Engine States
export type SOSEngineState = 
  | 'IDLE' 
  | 'TRIGGERED'          // Countdown active
  | 'CONFIRMED'          // Confirmed, grabbing GPS & generating incident
  | 'ACTIVE'             // Emergency is live
  | 'DURESS_ACTIVE'      // Secret emergency active
  | 'RESOLVED'
  | 'FAILED_RECOVERABLE';

export type EvidenceType = 'photo' | 'video' | 'audio' | 'screenshot';

export interface Evidence {
  id: string;
  incidentId: string;
  userId: string;
  type: EvidenceType;
  localUri: string;
  remoteUri?: string;
  capturedAt: string;
  isUploaded: boolean;
  // Future: encrypted, tamper-proof hash, etc.
}

// Auth state shape
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export type SyncStatus = 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';

export interface SyncQueueItem {
  id: string;
  type: string; // e.g. 'INCIDENT_CREATE', 'LOCATION_UPDATE', 'SMS_SEND'
  entityId: string;
  payload: string; // JSON string
  createdAt: string;
  retryCount: number;
  lastAttempt?: string;
  status: SyncStatus;
}
