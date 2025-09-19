📹 Video Interview Proctoring System
A smart proctoring tool that uses browser-based AI to monitor candidates during video interviews, ensuring integrity by detecting focus loss and unauthorized items.

✨ Core Features
👨‍💻 Real-time Focus Detection:

Looking Away: Flags when a candidate turns their head away from the screen for more than 5 seconds.

User Absent: Flags when no face is detected in the frame for more than 10 seconds.

Multiple Faces: Instantly flags if more than one face appears in the video.

📱 Suspicious Item Detection:

Identifies unauthorized items like a cell phone or book in the candidate's view.

📄 Automated Reporting:

Logs all suspicious events with timestamps in a clean interface.

Calculates a final Integrity Score based on the number and type of flagged events.

Saves a permanent report to a database for later review.


Storing the final interview reports securely.

🚀 How to Run This Project Locally
Follow this step-by-step guide to get the project running on your local machine.

Step 1: Prerequisites
Ensure you have Node.js (version 16 or higher) installed.

You will need a free Google Firebase account for the database.

Step 2: Clone the Project
git clone [YOUR_REPOSITORY_URL]
cd video-proctoring-system

Step 3: Configure Firebase (The Important Part!)
The backend needs a secret key to connect to your database.

Create a Firebase Project: Go to the Firebase Console and create a new project.

Create a Database: In your project, navigate to Build > Firestore Database and click Create database. Start it in Test mode.

Generate a Secret Key:

Click the ⚙️ icon (Project settings) > Service accounts.

Click "Generate new private key" and confirm.

Add Key to Project:

A .json file will be downloaded.

Move this file into the backend/ folder.

Rename the file to serviceAccountKey.json. The project is pre-configured to look for this exact filename.

🔒 Security: This key file is secret! The project's .gitignore is set up to ignore it, so you won't accidentally commit it to GitHub.

Step 4: Set Up and Run the Backend
Open a terminal window for the backend.

# 1. Navigate to the backend directory
cd backend

# 2. Install all necessary packages
npm install

# 3. Start the server
npm run dev

✅ Your backend should now be running on http://localhost:8080.

Step 5: Set Up and Run the Frontend
Open a second terminal window for the frontend.

# 1. Navigate to the frontend directory
cd frontend

# 2. Install all necessary packages
npm install

# 3. Start the application
npm run dev

✅ Your frontend will automatically open in your browser at http://localhost:5173. You can now start the proctoring session!
