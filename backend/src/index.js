const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

// --- FIREBASE SETUP ---
// This logic now checks for an environment variable first,
// which is necessary for deployment. It falls back to the local file for development.
try {
  const serviceAccountString = process.env.FIREBASE_CREDENTIALS;
  if (serviceAccountString) {
    // If running on the server (Render), parse the credentials from the environment variable
    const serviceAccount = JSON.parse(serviceAccountString);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("Initialized Firebase from environment variable.");
  } else {
    // If running locally, use the serviceAccountKey.json file
    const serviceAccount = require('../serviceAccountKey.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("Initialized Firebase from local file.");
  }
} catch (error) {
  console.error("Firebase initialization failed:", error);
  process.exit(1); // Exit if Firebase can't be initialized
}


const db = admin.firestore();
// --- END FIREBASE SETUP ---

const app = express();
const PORT = process.env.PORT || 4000; // Use port provided by Render or default to 4000

app.use(cors());
app.use(express.json());

// ... (the rest of your API routes are unchanged) ...
app.get('/', (req, res) => {
  res.status(200).send('Backend server is running!');
});

app.post('/api/report', async (req, res) => {
  try {
    const reportData = req.body;
    console.log('Received report data:', reportData);

    const docRef = await db.collection('reports').add(reportData);
    
    console.log('Document written with ID: ', docRef.id);

    res.status(201).json({ 
      message: 'Report saved successfully', 
      reportId: docRef.id 
    });
  } catch (error) {
    console.error("Error saving report: ", error);
    res.status(500).send("Error saving report to database.");
  }
});

app.get('/api/report/:id', async (req, res) => {
  try {
    const reportId = req.params.id;
    const reportRef = db.collection('reports').doc(reportId);
    const doc = await reportRef.get();

    if (!doc.exists) {
      res.status(404).json({ error: 'No report found with that ID' });
    } else {
      res.status(200).json({ id: doc.id, ...doc.data() });
    }
  } catch (error) {
    console.error("Error fetching report: ", error);
    res.status(500).send("Error fetching report from database.");
  }
});


app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

