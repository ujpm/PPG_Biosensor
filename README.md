# ❤️ MicroSmart PPG Biosensor

A professional-grade, web-based Photoplethysmography (PPG) application that turns any smartphone camera into a clinical-grade biosensor. This app detects blood volume changes in the fingertip to calculate Heart Rate (BPM), Heart Rate Variability (HRV), and Respiration Rate, powered by Google Gemini AI for real-time health triage.

## 🚀 Key Features

* **Real-Time Biosensing:** Uses the main camera and flash to capture raw PPG signals directly from the user's fingertip.
* **Advanced Signal Processing:** Custom algorithms for signal smoothing, inverted peak detection, and artifact rejection.
* **AI Health Triage:** Integrated with **Google Gemini 2.0 Flash** to analyze vital signs and provide instant, context-aware clinical assessments.
* **Live Visualization:** High-performance, real-time charting of blood flow data using `chart.js`.
* **Cloud Sync:** Secure authentication and history storage using **Firebase**.
* **PDF Reports:** One-click generation of detailed health reports with charts and AI insights.
* **Responsive Design:** Fully optimized for mobile devices with haptic feedback and glassmorphism UI.

## 🛠️ Tech Stack

* **Core:** React 19, TypeScript, Vite
* **Styling:** Bootstrap 5, Sass (SCSS), Framer Motion
* **Data & AI:** Google Gemini AI SDK (`@google/genai`), Firebase (Auth & Firestore)
* **Visualization:** Chart.js, React-Chartjs-2, React Circular Progressbar
* **Utilities:** HTML2Canvas, JSPDF (for exports)

## 📦 Installation

1. **Clone the repository:**
```bash
git clone https://github.com/your-username/ppg-biosensor.git
cd ppg-biosensor

```


2. **Install dependencies:**
```bash
npm install

```


3. **Environment Configuration:**
Create a `.env` file in the root directory. You will need API keys for Google Gemini and Firebase.
```env
# Google AI Studio Key (Required for AI Analysis)
VITE_GOOGLE_AI_KEY=your_gemini_api_key_here

# Firebase Configuration (Required for Login/History)
VITE_FIREBASE_API_KEY=your_firebase_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

```


4. **Run Development Server:**
```bash
npm run dev

```



## 📱 Usage Guide

1. **Grant Permissions:** Allow the app to access your camera when prompted.
2. **Calibration:** Place your index finger gently over the **Main Camera** and **Flash**.
3. **Scan:** Click "Start Bioscan". Hold still for 30–60 seconds while the graph stabilizes.
4. **Analysis:** View your BPM, HRV, and Breathing Rate results.
5. **AI Insight:** Click "Analyze with AI" to get a generative assessment of your physiological state.

## ⚠️ Hardware Requirements

* **Device:** Smartphone with a rear camera and flash (Torch).
* **Browser:** Chrome (Android) or Safari (iOS) recommended for full hardware access.
* **Note:** This application relies on the `torch` constraint which is primarily supported on mobile browsers. Desktop webcams may fail to initialize the scanner properly.

## 🤝 Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any enhancements or bug fixes.

## 📄 License

This project is licensed under the MIT License.