Video Interview Proctoring System
This project is a comprehensive video proctoring system designed to monitor candidates during online interviews. It uses real-time, browser-based AI models to detect a candidate's focus and identify any unauthorized items in their video feed. At the end of the session, it generates a detailed integrity report.

[Live Demo Link Placeholder] - (You can add your Vercel/Netlify link here after deployment)

🎯 Core Features
Real-time Focus Detection:

Detects if the candidate is looking away from the screen for more than 5 seconds.

Flags if no face is present in the frame for more than 10 seconds.

Flags if multiple faces are detected in the video feed.

Suspicious Item Detection:

Uses object detection to identify unauthorized items like mobile phones and books.

Automated Reporting:

Logs all flagged events with timestamps.

Submits a final report to a database upon completion.

Calculates and displays a final "Integrity Score" based on the number and severity of flagged events.

🛠️ Technology Stack
This project is a full-stack application built with modern web technologies. All AI processing is done client-side in the browser for maximum privacy and performance.

Component

Technology

Description

Frontend

React.js (with Vite)

A fast, modern UI library for building the single-page application.

AI / ML

TensorFlow.js

The core library for running machine learning models in the browser.

Face Detection

@tensorflow-models/face-landmarks-detection (with MediaPipe)

A highly optimized model for detecting 478 facial landmarks in real-time.

Object Detection

@tensorflow-models/coco-ssd

A lightweight model for detecting 90 common objects.

Backend

Node.js & Express.js

A simple and fast runtime for building the server-side API.

Database

Google Firestore

A NoSQL database for storing the final proctoring reports.

🚀 Getting Started
Follow these instructions to get a local copy of the project up and running for development and testing purposes.

Prerequisites
Node.js & npm: Make sure you have Node.js (v16 or later) and npm installed.

Firebase Account: You will need a free Google Firebase account to set up the database.

⚙️ Configuration & Setup
1. Clone the Repository

git clone [YOUR_REPOSITORY_URL]
cd video-proctoring-system

2. Firebase Setup (Crucial Step)
The backend needs a way to securely connect to your Firestore database.

Go to the Firebase Console and create a new project.

Inside your new project, go to Build > Firestore Database and create a new database. Start it in Test mode.

Click the gear icon ⚙️ next to "Project Overview" and go to Project settings > Service accounts.

Click "Generate new private key". A JSON file will be downloaded.

Move this JSON file into the backend/ directory of the project and rename it to serviceAccountKey.json.

Security Note: This key is a secret! The .gitignore file is already configured to ignore this file, but you should never commit it to a public repository.

3. Backend Installation & Setup
Open a new terminal and navigate to the backend directory.

# Navigate to the backend folder
cd backend

# Install dependencies
npm install

# Run the development server
npm run dev

Your backend server should now be running on http://localhost:8080.

4. Frontend Installation & Setup
Open another terminal and navigate to the frontend directory.

# Navigate to the frontend folder
cd frontend

# Install dependencies
npm install

# Run the development server
npm run dev

Your frontend React application should now be running and will open in your browser at http://localhost:5173. You can now start the interview.