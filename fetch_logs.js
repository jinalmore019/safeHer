const https = require('https');
const zlib = require('zlib');
const fs = require('fs');

const url = 'https://expo.dev/api/v2/projects/@jinalmore019/safeher/builds/50d64d24-2be6-49d8-bf5d-3097595bfa93';

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const buildInfo = JSON.parse(data);
    const artifacts = buildInfo.data.artifacts;
    if (artifacts && artifacts.buildUrl) {
      console.log('Build URL:', artifacts.buildUrl);
    }
    const errorLogs = buildInfo.data.error;
    console.log(JSON.stringify(buildInfo.data, null, 2));
  });
});
