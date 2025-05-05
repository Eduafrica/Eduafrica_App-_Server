import admin from 'firebase-admin';
import { config } from 'dotenv';
config()


const serviceAccount = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Fix newline characters
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
  universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN,
};


// Initialize Firebase Admin SDK
try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
  
  //admin.initializeApp({
  //  credential: admin.credential.cert(serviceAccount),
  //});
  console.log('Firebase Admin SDK initialized successfully.');
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
}

const testNotification3 = async () => {
    const testToken = 'eMFlAnWbStuo4sydAJx9ss:APA91bGkKEtOFW_aCVCDgeGzqeHUI2EAOfeFE1sSEAagNCABEw7OXacP6aOxxVIUOXXTbUEuTunfOdz_87k0PPPN1UjeLUT8VnYBLX7_rlGrhW_HeT0MlF0'
    "edbZr9ZjTiqkQUftSx1Pps:APA91bGpTjznHOPhmJXx21ywy2vHOtDGunZfFeV6lpJu_XwfhfpBepnoTXUEFKTLbDoNtok6_q-7seYNexjPfwtkeNeaGWmMH2jkrA9RSz2TtoUvo8FGzag";

  
    const payload = {
        notification: {
            title: "Test Notification from Edu africa",
            body: "If you receive this, FCM works!",
        },
        token: testToken
    };
  
    try {
        console.log('SENDING PUSH NOTIFICATION')
        const response = await admin.messaging().send(payload);
        console.log("Test notification sent:", response);
    } catch (error) {
        console.error("Failed to send test notification:", error);
    }
  };
  
  testNotification3();

export default admin;