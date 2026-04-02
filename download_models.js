const https = require('https');
const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, 'Client', 'public', 'models');
if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true });
}

const baseUrl = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/';
const files = [
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_recognition_model-shard2'
];

let pending = files.length;
files.forEach(file => {
  const dest = path.join(modelsDir, file);
  https.get(baseUrl + file, (response) => {
    if (response.statusCode !== 200) {
      console.error(`Failed to download ${file}: HTTP ${response.statusCode}`);
      pending--;
      return;
    }
    const fileStream = fs.createWriteStream(dest);
    response.pipe(fileStream);
    fileStream.on('finish', () => {
      console.log(`Downloaded ${file}`);
      pending--;
      if (pending === 0) console.log("ALL DOWNLOADS COMPLETE");
    });
  }).on('error', (err) => {
    console.error(`Error downloading ${file}:`, err.message);
    pending--;
  });
});
