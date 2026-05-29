# AI MOM (Minutes of Meeting) Application

A full-stack, real-time AI-powered Minutes of Meeting application that captures live meeting audio, generates transcripts, converts them into structured MOM format, allows editing, and exports to PDF/DOCX.

---

## 🎯 Project Goal

This assignment is built to demonstrate real-world engineering thinking, not just UI work.

**Core Workflow:**

---

## ✅ Features

- 🎙️ Live audio recording (Microphone + System/Tab audio)
- 📝 Real-time transcription using Groq Whisper
- 🤖 AI-powered structured MOM generation
- ✏️ Editable MOM interface (add/edit/delete items)
- 📄 Export to PDF and DOCX
- 🔒 Secure API key handling via .env

---

## 🛠️ Tech Stack

### Frontend

- React (Vite)
- Axios
- jsPDF (PDF export)
- docx + file-saver (DOCX export)
- MediaRecorder API (audio capture)
- Web Audio API (mic + system audio mixing)

### Backend

- Node.js
- Express
- Multer (file handling)
- Groq SDK (Whisper + Llama)

### AI/Transcription

- Groq Whisper Large V3 (transcription)
- Groq Llama 3.3 70B (MOM generation)

---

## ⚙️ Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/nileshsarwade/ai-mom-app.git
cd ai-mom-app
```

### 2. Backend Setup

```bash
cd server
npm install
```

### 3. Environment Variables

Create a `.env` file inside the `server` folder:

Get your free API key from: https://console.groq.com

### 4. Start Backend

```bash
node server.js
```

### 5. Frontend Setup

```bash
cd ..
npm install
npm run dev
```

### 6. Open App

---

## 📁 Project Structure

ai-mom-app/
├── server/
│ ├── server.js # Express backend
│ ├── .env # API keys (not committed)
│ ├── uploads/ # Recorded audio files
│ └── package.json
├── src/
│ ├── App.jsx # Main React component
│ ├── App.css # Styles
│ └── main.jsx
├── public/
├── package.json
└── README.md

---

## 🔄 Complete Application Workflow

User clicks "Start Recording"
↓
Browser requests Mic + Screen Share permission
↓
Web Audio API mixes both audio streams
↓
MediaRecorder captures mixed audio
↓
User clicks "Stop Recording"
↓
Audio Blob → FormData → Axios POST
↓
Multer saves file to uploads/
↓
Groq Whisper API transcribes audio
↓
Groq Llama generates structured MOM
↓
Frontend displays editable MOM
↓
User edits and exports PDF/DOCX

---

## 📅 Development Progress

### Day 1 — Project Foundation

- Created React frontend using Vite
- Created Express backend using `npm init -y`
- Installed Axios for HTTP communication
- Connected frontend to backend
- Verified request-response flow
- Set up Git workflow and pushed initial code

### Day 2 — Audio Recording

- Added microphone access using browser media API
- Implemented audio recording with `MediaRecorder`
- Added Start/Stop recording controls
- Generated playable audio URL after recording
- Applied basic UI styling

### Day 3 — Backend Upload Pipeline

- Installed and configured Multer
- Created uploads folder
- Implemented backend audio upload route
- Sent audio blob from frontend using FormData
- Saved uploaded files with unique filenames
- Configured Express static file serving
- Improved Git workflow using `.gitignore`

### Day 4 — AI Integration + Full Features

- Integrated Groq Whisper for real transcription
- Added System + Tab audio capture using `getDisplayMedia()`
- Mixed Mic + System audio using Web Audio API
- Integrated Groq Llama 3.3 for structured MOM generation
- Built editable MOM interface
- Added PDF export using jsPDF
- Added DOCX export using docx + file-saver

---

## 🔌 APIs Used

| API                   | Purpose             | Cost |
| --------------------- | ------------------- | ---- |
| Groq Whisper Large V3 | Audio transcription | Free |
| Groq Llama 3.3 70B    | MOM generation      | Free |

---

## 🔑 Key Concepts Used

### FormData

Files cannot be sent using normal JSON.

```js
const formData = new FormData();
formData.append("audio", audioBlob, "recording.webm");
```

### Multer Disk Storage

```js
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});
```

### Web Audio API — Mixing Streams

```js
const audioContext = new AudioContext();
const destination = audioContext.createMediaStreamDestination();
micSource.connect(destination);
systemSource.connect(destination);
```

---

## 🚧 Challenges Faced

- **System Audio Capture** — Browser security restrictions; solved using `getDisplayMedia()` with screen share
- **Mixed Audio Streams** — Used Web Audio API `AudioContext` to mix mic and system audio
- **Structured JSON from AI** — Prompted Llama to return strict JSON format with fallback parsing
- **Model Deprecation** — `llama3-8b-8192` was decommissioned; migrated to `llama-3.3-70b-versatile`

---

## 🔮 Future Improvements

- [ ] Speaker diarization (who said what)
- [ ] Real-time live captions during recording
- [ ] Meeting history with database
- [ ] Authentication system
- [ ] Cloud storage for recordings
- [ ] Timestamped transcripts
- [ ] AI-generated action item assignments
- [ ] Collaborative editing

---

## 👤 Author

Nilesh Sarwade
