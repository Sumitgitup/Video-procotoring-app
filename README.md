# 📹 Video Interview Proctoring System  

A **smart proctoring tool** that uses browser-based AI to monitor candidates during video interviews, ensuring **integrity** by detecting focus loss and unauthorized items.  

---

## ✨ Core Features  

### 👨‍💻 **Real-time Focus Detection**  
- **Looking Away:** Flags when a candidate turns their head away from the screen for more than **5 seconds**.  
- **User Absent:** Flags when no face is detected for more than **10 seconds**.  
- **Multiple Faces:** Flags if more than **one face** appears in the video.  

### 📱 **Suspicious Item Detection**  
- Identifies unauthorized items such as a **cell phone** or **book** in the candidate's view.  

### 📄 **Automated Reporting**  
- **Logs** all suspicious events with **timestamps** in a clean interface.  
- Calculates a final **Integrity Score** and generates a **downloadable PDF report**.  
- Saves a permanent report to a **database** for later review.  

---

## 🛠️ Tech Stack  

This project is a **full-stack application** that performs all heavy AI processing directly in the **user's browser**, ensuring **privacy** and **real-time performance**.  

| **Component**      | **Technology**        | **Purpose**                                   |
|---------------------|----------------------|-----------------------------------------------|
| **Frontend**        | React.js (Vite)      | Building the **interactive user interface**.  |
| **AI / ML**         | TensorFlow.js        | Running **AI models** directly in the browser.|
| **Face Tracking**   | MediaPipe Face Mesh  | Detect **facial landmarks** for focus analysis.|
| **Object Detection**| COCO-SSD Model       | Identify **unauthorized objects**.            |
| **Backend**         | Node.js & Express.js | API to **save and retrieve reports**.         |
| **Database**        | Google Firestore     | Securely **storing the final reports**.       |

---

## 🚀 How to Run This Project Locally  

Follow this step-by-step guide to run the project on your local machine.  

---

### 🔹 Step 1: **Prerequisites**  
- Install **Node.js (v18 or higher)**.  
- Create a free **Google Firebase account** for the database.  

---

### 🔹 Step 2: **Clone the Project**  

`git clone https://github.com/Sumitgitup/Video-procotoring-app.git`


cd Video-procotoring-app



### 🔹 Step 3: **Configure Firebase (Crucial Step!)**

Create a Firebase Project

Go to the Firebase Console
 → Create a new project.

Create a Firestore Database

Navigate to Build > Firestore Database → Click Create database → Start in Test Mode.

Generate a Secret Key

In Firebase, go to Project Settings → Service Accounts.

Click Generate new private key → confirm → a .json file will download.

Add Key to Project

Move the downloaded .json file into the backend/ folder.

Rename it to:

serviceAccountKey.json


⚠️ Security Note: This key file is secret!

The .gitignore is already configured to ignore this file, so it won’t be pushed to GitHub.

### 🔹 Step 4: **Set Up and Run the Backend**

Open a terminal for the backend:

## 1. Navigate to backend
cd backend

## 2. Install dependencies
npm install

## 3. Start the backend server
npm run dev


✅ Backend will run at: http://localhost:8080

### 🔹 Step 5: **Set Up and Run the Frontend**

Open another terminal for the frontend:

## 1. Navigate to frontend
cd frontend

## 2. Install dependencies
npm install

## 3. Start the frontend app
npm run dev


✅ Frontend will open at: http://localhost:5173

You can now start the proctoring session! 🎥
