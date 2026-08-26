const { withAndroidManifest } = require('@expo/config-plugins');

const withSafeherBackground = (config) => {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults;
    const application = manifest.manifest.application[0];
    
    // Add FOREGROUND_SERVICE permission
    if (!manifest.manifest['uses-permission']) {
      manifest.manifest['uses-permission'] = [];
    }
    
    const permissions = [
      'android.permission.FOREGROUND_SERVICE',
      'android.permission.FOREGROUND_SERVICE_DATA_SYNC',
      'android.permission.VIBRATE',
    ];

    permissions.forEach((permission) => {
      if (!manifest.manifest['uses-permission'].some((p) => p.$['android:name'] === permission)) {
        manifest.manifest['uses-permission'].push({
          $: { 'android:name': permission },
        });
      }
    });

    // Add Service to application
    if (!application.service) {
      application.service = [];
    }

    const serviceName = 'com.safeher.background.ShakeForegroundService';
    if (!application.service.some((s) => s.$['android:name'] === serviceName)) {
      application.service.push({
        $: {
          'android:name': serviceName,
          'android:enabled': 'true',
          'android:exported': 'false',
          'android:foregroundServiceType': 'dataSync',
        },
      });
    }

    return config;
  });
};

module.exports = withSafeherBackground;
