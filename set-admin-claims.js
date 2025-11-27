const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Load service account key
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('ERROR: serviceAccountKey.json not found!');
  console.error('You need to download it from Firebase Console:');
  console.error('1. Go to https://console.firebase.google.com');
  console.error('2. Select your project: termophysics-e9fc1');
  console.error('3. Go to Project Settings → Service Accounts');
  console.error('4. Click "Generate New Private Key"');
  console.error('5. Save it as serviceAccountKey.json in the termo folder');
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://termophysics-e9fc1.firebaseio.com"
});

const ADMIN_EMAILS = [
  'mohamedsallu.sl@gmail.com',
  'mohamedsallu24@gmail.com'
];

async function setAdminClaims() {
  try {
    for (const email of ADMIN_EMAILS) {
      try {
        const user = await admin.auth().getUserByEmail(email);
        await admin.auth().setCustomUserClaims(user.uid, { admin: true });
        console.log(`✅ Set admin claim for: ${email}`);
      } catch (err) {
        if (err.code === 'auth/user-not-found') {
          console.log(`⚠️  User not found: ${email} (will be created on first signup)`);
        } else {
          console.error(`❌ Error setting admin claim for ${email}:`, err.message);
        }
      }
    }
    
    console.log('\n✅ Admin claims setup complete!');
    console.log('Users will need to refresh their token to get the new claims.');
    console.log('They can do this by logging out and logging back in.');
    
    process.exit(0);
  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }
}

setAdminClaims();
