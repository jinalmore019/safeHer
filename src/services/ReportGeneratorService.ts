import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Incident, Evidence } from '../types/models';
import { DatabaseService } from './DatabaseService';

export class ReportGeneratorService {
  static async generateReportPDF(incident: Incident, evidenceList: Evidence[]) {
    const locations = DatabaseService.getLocationsForIncident(incident.id);
    
    let locHtml = '';
    if (locations.length > 0) {
      locHtml = locations.map(l => `<li>Lat: ${l.latitude}, Lon: ${l.longitude} @ ${new Date(l.timestamp).toLocaleTimeString()}</li>`).join('');
    } else {
      locHtml = '<li>No location data recorded.</li>';
    }

    const evHtml = evidenceList.map(e => `<li>${e.type.toUpperCase()} captured at ${new Date(e.capturedAt).toLocaleTimeString()} (Uploaded: ${e.isUploaded})</li>`).join('');

    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Helvetica, Arial, sans-serif; padding: 20px; color: #333; }
            h1 { color: #8a2be2; border-bottom: 2px solid #8a2be2; padding-bottom: 10px; }
            h2 { color: #555; margin-top: 20px; }
            .badge { background: #eee; padding: 5px 10px; border-radius: 4px; font-weight: bold; }
            .timeline { margin-left: 20px; border-left: 2px solid #ccc; padding-left: 10px; }
          </style>
        </head>
        <body>
          <h1>SafeHer - Incident Report</h1>
          <p><strong>Incident ID:</strong> ${incident.id}</p>
          <p><strong>Date/Time:</strong> ${new Date(incident.createdAt).toLocaleString()}</p>
          <p><strong>Trigger Type:</strong> <span class="badge">${incident.triggerType.toUpperCase()}</span></p>
          <p><strong>Final Status:</strong> <span class="badge">${incident.status.toUpperCase()}</span></p>
          
          <h2>Location Timeline</h2>
          <ul class="timeline">
            ${locHtml}
          </ul>

          <h2>Evidence Gathered</h2>
          <ul class="timeline">
            ${evHtml || '<li>No evidence captured.</li>'}
          </ul>

          <br/>
          <hr/>
          <p><small>Generated securely on-device by SafeHer. This is an auto-generated factual report based on local data.</small></p>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (e) {
      console.error('Failed to generate PDF', e);
    }
  }

  static async generateFIRDraftPDF(incident: Incident, evidenceList: Evidence[]) {
    const locations = DatabaseService.getLocationsForIncident(incident.id);
    const lastLoc = locations.length > 0 ? `${locations[locations.length-1].latitude}, ${locations[locations.length-1].longitude}` : 'Unknown Location';

    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    let aiDescription = "[Please write the detailed description of what happened here...]";

    if (apiKey) {
      try {
        const prompt = `Draft a formal, factual, unbiased police First Information Report (FIR) description based on the following automated device telemetry. Keep it professional and under 250 words.
Telemetry:
- Incident Date: ${new Date(incident.createdAt).toLocaleString()}
- Final Status: ${incident.status}
- Trigger Method: ${incident.triggerType}
- Last Known GPS: ${lastLoc}
- Evidence Count: ${evidenceList.length} files captured.`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
          }
        );

        if (response.ok) {
          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) aiDescription = text.replace(/\n/g, '<br/>');
        }
      } catch (e) {
        console.error('[ReportGeneratorService] AI draft failed:', e);
      }
    }

    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: serif; padding: 40px; color: #000; line-height: 1.6; }
            h1 { text-align: center; text-decoration: underline; }
            h3 { color: #d32f2f; }
            .section { margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <h3>DRAFT FOR REVIEW — NOT AN OFFICIAL FIR</h3>
          <h1>First Information Report (Draft)</h1>
          
          <div class="section">
            <p><strong>To,</strong><br/>The Officer-in-Charge<br/>[Police Station Name]<br/>[City/District]</p>
          </div>

          <div class="section">
            <p><strong>Subject:</strong> Complaint regarding incident on ${new Date(incident.createdAt).toLocaleDateString()}.</p>
          </div>

          <div class="section">
            <p><strong>Respected Sir/Madam,</strong></p>
            <p>I am submitting this information regarding an incident that occurred at approximately <strong>${new Date(incident.createdAt).toLocaleTimeString()}</strong>.</p>
            <p><strong>Location of Incident:</strong> GPS Coordinates ${lastLoc}</p>
            <p><strong>Trigger Method:</strong> The SafeHer safety application was triggered via <strong>${incident.triggerType.toUpperCase()}</strong>.</p>
          </div>

          <div class="section">
            <p><strong>Description of Events (AI Drafted based on Telemetry):</strong><br/>
            ${aiDescription}</p>
          </div>

          <div class="section">
            <p><strong>Available Evidence:</strong></p>
            <ul>
              <li>SafeHer automated GPS logs (${locations.length} points recorded)</li>
              <li>SafeHer automated media capture (${evidenceList.length} files recorded)</li>
            </ul>
          </div>

          <div class="section">
            <p>I request you to kindly register an FIR and take necessary action.</p>
            <br/><br/>
            <p><strong>Signature:</strong> _______________________</p>
            <p><strong>Name:</strong> [Your Name]</p>
            <p><strong>Contact:</strong> [Your Phone Number]</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (e) {
      console.error('Failed to generate FIR Draft', e);
    }
  }
}
