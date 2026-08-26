import { Evidence, Incident } from '../types/models';
import { DatabaseService } from './DatabaseService';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';
import { storage, db } from '../config/firebase';

export const FirebaseService = {
  uploadEvidence: async (evidence: Evidence): Promise<string> => {
    try {
      console.log(`[FirebaseService] Uploading evidence: ${evidence.id}`);
      
      const fileRef = ref(storage, `evidence/${evidence.incidentId}/${evidence.id}`);
      
      // We fetch the local file as a blob
      const response = await fetch(evidence.localUri);
      const blob = await response.blob();
      
      // Authenticated upload
      await uploadBytes(fileRef, blob, { customMetadata: { userId: evidence.userId }});
      const remoteUrl = await getDownloadURL(fileRef);
      
      // Update local database to mark as uploaded
      DatabaseService.markEvidenceUploaded(evidence.id, remoteUrl);
      console.log(`[FirebaseService] Evidence uploaded successfully: ${remoteUrl}`);
      
      return remoteUrl;
    } catch (error) {
      console.error(`[FirebaseService] Failed to upload evidence ${evidence.id}`, error);
      throw error;
    }
  },

  syncIncident: async (incident: Incident): Promise<void> => {
    try {
      console.log(`[FirebaseService] Syncing incident: ${incident.id}`);
      await setDoc(doc(db, 'incidents', incident.id), incident);
      console.log(`[FirebaseService] Incident synced successfully`);
    } catch (error) {
      console.error(`[FirebaseService] Failed to sync incident ${incident.id}`, error);
      throw error;
    }
  },

  updateLiveLocation: async (incidentId: string, location: any): Promise<void> => {
    try {
      // Just update the incident document with the latest location for the dashboard
      await setDoc(doc(db, 'incidents', incidentId), {
        latestLocation: {
          latitude: location.latitude,
          longitude: location.longitude,
          timestamp: new Date().toISOString()
        }
      }, { merge: true });
    } catch (error) {
      console.error(`[FirebaseService] Failed to update live location`, error);
    }
  }
};
