import * as SQLite from 'expo-sqlite';
import { Incident, LocationSnapshot, SyncQueueItem, Evidence } from '../types/models';

// We initialize the database connection
// Expo SQLite in SDK 57 uses openDatabaseSync
const db = SQLite.openDatabaseSync('safeher.db');

export const DatabaseService = {
  init: () => {
    try {
      // Create tables if they don't exist
      db.execSync(`
        CREATE TABLE IF NOT EXISTS incidents (
          id TEXT PRIMARY KEY NOT NULL,
          userId TEXT NOT NULL,
          triggerType TEXT NOT NULL,
          status TEXT NOT NULL,
          createdAt TEXT NOT NULL,
          confirmedAt TEXT,
          resolvedAt TEXT,
          latitude REAL,
          longitude REAL,
          accuracy REAL,
          notes TEXT,
          synced INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS locations (
          id TEXT PRIMARY KEY NOT NULL,
          incidentId TEXT NOT NULL,
          latitude REAL NOT NULL,
          longitude REAL NOT NULL,
          accuracy REAL NOT NULL,
          timestamp TEXT NOT NULL,
          FOREIGN KEY (incidentId) REFERENCES incidents (id)
        );

        CREATE TABLE IF NOT EXISTS sync_queue (
          id TEXT PRIMARY KEY NOT NULL,
          type TEXT NOT NULL,
          entityId TEXT NOT NULL,
          payload TEXT NOT NULL,
          createdAt TEXT NOT NULL,
          retryCount INTEGER DEFAULT 0,
          lastAttempt TEXT,
          status TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS evidence (
          id TEXT PRIMARY KEY NOT NULL,
          incidentId TEXT NOT NULL,
          userId TEXT NOT NULL,
          type TEXT NOT NULL,
          localUri TEXT NOT NULL,
          remoteUri TEXT,
          capturedAt TEXT NOT NULL,
          isUploaded INTEGER DEFAULT 0,
          FOREIGN KEY (incidentId) REFERENCES incidents (id)
        );

        CREATE TABLE IF NOT EXISTS trusted_contacts (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          phone TEXT NOT NULL,
          relationship TEXT,
          notifyOnSOS INTEGER DEFAULT 1
        );
      `);
      
      // Simple migration strategy for existing users during dev:
      try {
        db.execSync('ALTER TABLE incidents ADD COLUMN synced INTEGER DEFAULT 0;');
      } catch (e) {
        // Column already exists, ignore
      }
    } catch (error) {
      console.error('Failed to initialize database schemas:', error);
    }
  },

  // Insert a new incident
  createIncident: (incident: Incident) => {
    const statement = db.prepareSync(`
      INSERT INTO incidents (id, userId, triggerType, status, createdAt, confirmedAt, resolvedAt, latitude, longitude, accuracy, notes, synced)
      VALUES ($id, $userId, $triggerType, $status, $createdAt, $confirmedAt, $resolvedAt, $latitude, $longitude, $accuracy, $notes, $synced)
    `);

    statement.executeSync({
      $id: incident.id,
      $userId: incident.userId,
      $triggerType: incident.triggerType,
      $status: incident.status,
      $createdAt: incident.createdAt,
      $confirmedAt: incident.confirmedAt || null,
      $resolvedAt: incident.resolvedAt || null,
      $latitude: incident.latitude || null,
      $longitude: incident.longitude || null,
      $accuracy: incident.accuracy || null,
      $notes: incident.notes || null,
      $synced: incident.synced ? 1 : 0,
    });
  },

  // Update incident status
  updateIncidentStatus: (id: string, status: string, resolvedAt?: string) => {
    const statement = db.prepareSync(`
      UPDATE incidents 
      SET status = $status, resolvedAt = $resolvedAt, synced = 0
      WHERE id = $id
    `);
    statement.executeSync({
      $id: id,
      $status: status,
      $resolvedAt: resolvedAt || null,
    });
  },

  markIncidentSynced: (id: string) => {
    const statement = db.prepareSync('UPDATE incidents SET synced = 1 WHERE id = $id');
    statement.executeSync({ $id: id });
  },

  getIncidentById: (id: string): Incident | null => {
    const result = db.getFirstSync<any>('SELECT * FROM incidents WHERE id = ?', [id]);
    if (!result) return null;
    return {
      ...result,
      synced: result.synced === 1
    };
  },

  // Add a location to an incident
  addLocation: (location: LocationSnapshot) => {
    const statement = db.prepareSync(`
      INSERT INTO locations (id, incidentId, latitude, longitude, accuracy, timestamp)
      VALUES ($id, $incidentId, $latitude, $longitude, $accuracy, $timestamp)
    `);
    statement.executeSync({
      $id: location.id,
      $incidentId: location.incidentId,
      $latitude: location.latitude,
      $longitude: location.longitude,
      $accuracy: location.accuracy,
      $timestamp: location.timestamp,
    });
  },

  getLocationsForIncident: (incidentId: string): LocationSnapshot[] => {
    return db.getAllSync<LocationSnapshot>('SELECT * FROM locations WHERE incidentId = ? ORDER BY timestamp ASC', [incidentId]);
  },

  // Get all incidents (newest first)
  getIncidents: (): Incident[] => {
    const raw = db.getAllSync<any>('SELECT * FROM incidents ORDER BY createdAt DESC');
    return raw.map(i => ({
      ...i,
      synced: i.synced === 1
    }));
  },
  
  // Get latest active incident
  getActiveIncident: (): Incident | null => {
    const result = db.getFirstSync<any>("SELECT * FROM incidents WHERE status = 'active' ORDER BY createdAt DESC LIMIT 1");
    if (!result) return null;
    return {
      ...result,
      synced: result.synced === 1
    };
  },

  // ---- EVIDENCE OPERATIONS ----
  
  saveEvidence: (evidence: Evidence) => {
    const statement = db.prepareSync(`
      INSERT INTO evidence (id, incidentId, userId, type, localUri, remoteUri, capturedAt, isUploaded)
      VALUES ($id, $incidentId, $userId, $type, $localUri, $remoteUri, $capturedAt, $isUploaded)
    `);
    statement.executeSync({
      $id: evidence.id,
      $incidentId: evidence.incidentId,
      $userId: evidence.userId,
      $type: evidence.type,
      $localUri: evidence.localUri,
      $remoteUri: evidence.remoteUri || null,
      $capturedAt: evidence.capturedAt,
      $isUploaded: evidence.isUploaded ? 1 : 0
    });
  },

  getEvidenceForIncident: (incidentId: string): Evidence[] => {
    return db.getAllSync<Evidence>('SELECT * FROM evidence WHERE incidentId = ? ORDER BY capturedAt ASC', [incidentId]);
  },

  getAllEvidence: (): Evidence[] => {
    return db.getAllSync<Evidence>('SELECT * FROM evidence ORDER BY capturedAt DESC');
  },

  markEvidenceUploaded: (id: string, remoteUri: string) => {
    const statement = db.prepareSync('UPDATE evidence SET isUploaded = 1, remoteUri = $remoteUri WHERE id = $id');
    statement.executeSync({ $id: id, $remoteUri: remoteUri });
  },

  // ---- SYNC QUEUE OPERATIONS ----
  
  addToSyncQueue: (item: SyncQueueItem) => {
    const statement = db.prepareSync(`
      INSERT INTO sync_queue (id, type, entityId, payload, createdAt, retryCount, lastAttempt, status)
      VALUES ($id, $type, $entityId, $payload, $createdAt, $retryCount, $lastAttempt, $status)
    `);
    statement.executeSync({
      $id: item.id,
      $type: item.type,
      $entityId: item.entityId,
      $payload: item.payload,
      $createdAt: item.createdAt,
      $retryCount: item.retryCount,
      $lastAttempt: item.lastAttempt || null,
      $status: item.status
    });
  },

  getPendingSyncItems: (): SyncQueueItem[] => {
    return db.getAllSync<SyncQueueItem>("SELECT * FROM sync_queue WHERE status = 'PENDING' OR status = 'FAILED' ORDER BY createdAt ASC");
  },

  updateSyncItemStatus: (id: string, status: string, retryCount: number, lastAttempt: string) => {
    const statement = db.prepareSync(`
      UPDATE sync_queue
      SET status = $status, retryCount = $retryCount, lastAttempt = $lastAttempt
      WHERE id = $id
    `);
    statement.executeSync({
      $id: id,
      $status: status,
      $retryCount: retryCount,
      $lastAttempt: lastAttempt
    });
  },

  // ---- DATA MANAGEMENT (Part 7) ----
  deleteIncident: (id: string) => {
    db.execSync(`DELETE FROM sync_queue WHERE entityId = '${id}';`);
    db.execSync(`DELETE FROM locations WHERE incidentId = '${id}';`);
    db.execSync(`DELETE FROM evidence WHERE incidentId = '${id}';`);
    db.execSync(`DELETE FROM incidents WHERE id = '${id}';`);
  },

  // ---- CONTACTS ----
  getContacts: (): { id: string; name: string; phone: string; relationship: string; notifyOnSOS: boolean }[] => {
    const raw = db.getAllSync<any>('SELECT * FROM trusted_contacts');
    return raw.map(c => ({
      ...c,
      notifyOnSOS: c.notifyOnSOS === 1
    }));
  },

  addContact: (id: string, name: string, phone: string, relationship: string, notifyOnSOS: boolean) => {
    const statement = db.prepareSync(`
      INSERT INTO trusted_contacts (id, name, phone, relationship, notifyOnSOS)
      VALUES ($id, $name, $phone, $relationship, $notifyOnSOS)
    `);
    statement.executeSync({
      $id: id,
      $name: name,
      $phone: phone,
      $relationship: relationship,
      $notifyOnSOS: notifyOnSOS ? 1 : 0
    });
  },

  deleteContact: (id: string) => {
    db.execSync(`DELETE FROM trusted_contacts WHERE id = '${id}';`);
  },

  wipeDatabase: () => {
    db.execSync('DELETE FROM sync_queue;');
    db.execSync('DELETE FROM locations;');
    db.execSync('DELETE FROM evidence;');
    db.execSync('DELETE FROM incidents;');
    db.execSync('DELETE FROM trusted_contacts;');
  }
};
