#!/usr/bin/env node
/**
 * Upload ML model files to Firebase Storage
 * 
 * Usage: node upload-to-storage.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK
try {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'training-21219029-6377a.firebasestorage.app'
  });
  console.log('✅ Firebase Admin initialized');
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin:', error.message);
  console.log('\nPlease set FIREBASE_STORAGE_BUCKET environment variable or update the script');
  process.exit(1);
}

const bucket = admin.storage().bucket();

async function uploadFile(localPath, remotePath) {
  console.log(`\nUploading ${localPath} → ${remotePath}...`);
  
  try {
    const file = bucket.file(remotePath);
    
    // Upload with metadata
    await bucket.upload(localPath, {
      destination: remotePath,
      metadata: {
        contentType: remotePath.endsWith('.onnx') ? 'application/octet-stream' : 'application/json',
        cacheControl: 'public, max-age=3600',
      }
    });
    
    console.log(`✅ Uploaded: ${remotePath}`);
    
    // Get download URL
    const [metadata] = await file.getMetadata();
    console.log(`   Size: ${(metadata.size / 1024 / 1024).toFixed(2)} MB`);
    
    return true;
  } catch (error) {
    console.error(`❌ Upload failed: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('=' .repeat(60));
  console.log('Upload ML Models to Firebase Storage');
  console.log('='.repeat(60));
  
  const files = [
    {
      local: path.join(__dirname, 'tss-predictor-v1.onnx'),
      remote: 'ml-models/tss-predictor-v1.onnx'
    },
    {
      local: path.join(__dirname, 'tss-predictor-v1.json'),
      remote: 'ml-models/tss-predictor-v1.json'
    }
  ];
  
  // Check files exist
  for (const file of files) {
    if (!fs.existsSync(file.local)) {
      console.error(`❌ File not found: ${file.local}`);
      process.exit(1);
    }
  }
  
  // Upload files
  let success = true;
  for (const file of files) {
    const uploaded = await uploadFile(file.local, file.remote);
    if (!uploaded) {
      success = false;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  if (success) {
    console.log('✅ All files uploaded successfully!');
    console.log('='.repeat(60));
    console.log('\nNext steps:');
    console.log('1. Deploy storage rules: firebase deploy --only storage');
    console.log('2. Test ML predictions in your app');
  } else {
    console.log('❌ Some uploads failed');
    console.log('='.repeat(60));
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
