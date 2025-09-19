const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

// --- FIREBASE SETUP ---
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
// --- END FIREBASE SETUP ---

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).send('Backend server is running!');
});

// Endpoint to SAVE a new report
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

// NEW: Endpoint to GET a specific report by its ID
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
  console.log(`Server is listening on http://localhost:${PORT}`);
});



// http://localhost:8080/api/report/[YOUR_DOCUMENT_ID]
    

