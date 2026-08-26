import * as Network from 'expo-network';
import { DatabaseService } from './DatabaseService';
import { FirebaseService } from './FirebaseService';
import { Evidence } from '../types/models';

export const SyncService = {
  processQueue: async () => {
    try {
      const state = await Network.getNetworkStateAsync();
      if (!state.isConnected || !state.isInternetReachable) {
        console.log('[SyncService] Offline. Queue processing deferred.');
        return;
      }

      const pendingItems = DatabaseService.getPendingSyncItems();
      if (pendingItems.length === 0) {
        return;
      }

      console.log(`[SyncService] Processing ${pendingItems.length} items in queue.`);

      for (const item of pendingItems) {
        // Mark as syncing
        DatabaseService.updateSyncItemStatus(item.id, 'SYNCING', item.retryCount + 1, new Date().toISOString());

        try {
          if (item.type === 'EVIDENCE_UPLOAD') {
            const evidence: Evidence = JSON.parse(item.payload);
            await FirebaseService.uploadEvidence(evidence);
          } else if (item.type === 'INCIDENT_UPDATE') {
            const incident = JSON.parse(item.payload);
            await FirebaseService.syncIncident(incident);
            DatabaseService.markIncidentSynced(incident.id);
          }

          // Mark as synced
          DatabaseService.updateSyncItemStatus(item.id, 'SYNCED', item.retryCount + 1, new Date().toISOString());
        } catch (error) {
          console.error(`[SyncService] Failed to process item ${item.id}:`, error);
          DatabaseService.updateSyncItemStatus(item.id, 'FAILED', item.retryCount + 1, new Date().toISOString());
        }
      }
    } catch (e) {
      console.error('[SyncService] Queue processing error:', e);
    }
  }
};
