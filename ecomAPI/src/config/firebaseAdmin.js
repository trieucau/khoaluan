import admin from 'firebase-admin';
import path from 'path';

// Use the service account file provided by the user
const serviceAccount = require('./firebase-service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export default admin;
