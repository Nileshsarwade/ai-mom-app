# AI MOM Application

AI MOM Application is a full-stack interview assignment project designed to capture meeting audio, generate a transcript, convert that transcript into Minutes of Meeting (MOM), allow editing, and export the final document. The current implementation focuses on building a clean engineering workflow first, with practical browser-based audio capture and backend processing.

## Project Goal

This assignment is built to demonstrate real-world engineering thinking, not just UI work. The core workflow is:

**Meeting audio capture → Transcript generation → MOM generation → Editing → Export**

### Current Progress

- React frontend setup completed
- Express backend setup completed
- Frontend and backend communication established using Axios
- GitHub repository created and first commit pushed
- Day 1 foundation completed

## Day 1 Progress

Day 1 focused on setting up the project foundation.

### Completed on Day 1

- Created frontend using Vite
- Created backend using `npm init -y`
- Installed Axios for HTTP communication
- Connected frontend to backend using an API request
- Verified request-response flow
- Set up Git workflow and pushed initial code to GitHub

### What Was Learned

#### APIs

The project already uses a basic API route for frontend-backend communication.

Example:

```js
axios.get("http://localhost:3000");
```

Backend example:

```js
app.get("/", (req, res) => {
  res.send("Backend is running");
});
```

#### Client-Server Architecture

- `client/` contains the React frontend
- `server/` contains the Express backend
- Frontend handles UI and user interaction
- Backend handles logic, processing, and future AI integration

#### HTTP Request-Response Cycle

- Frontend sends a request using Axios
- Backend receives the request
- Backend sends back a response
- Frontend displays or uses the result

#### Frontend/Backend Separation

This project is intentionally split into separate `client/` and `server/` folders, which matches real-world full-stack project structure.

#### Async Communication

Axios requests are asynchronous, which is important because recording, upload, transcription, and AI generation all take time.

#### Tech Stack

    React
    Vite
    Express
    Node.js
    Axios
    Multer

### Project Structure

ai-mom-app/
├── client/
├── server/
└── README.md

### Setup Instruction

- Frontend
  cd client
  npm install
  npm run dev

- Backend
  cd server
  npm install
  node server.js

## Day 2 Progress

Day 2 focused on implementing browser-based microphone recording in the React frontend. The goal was to make audio capture work end-to-end before moving to backend upload and transcription. [web:115][web:296]

### Completed on Day 2

- Added microphone access using the browser media API
- Implemented audio recording with `MediaRecorder`
- Added Start Recording and Stop Recording controls
- Generated a playable audio URL after recording stops
- Added recorded audio playback in the UI
- Applied basic styling using `App.css`

### What Was Learned

#### Browser Microphone Access

The app now requests microphone permission from the browser using the media devices API.

```js
navigator.mediaDevices.getUserMedia({ audio: true });
```

# Day 3 Progress

Day 3 focused on implementing the complete audio upload pipeline from the browser frontend to the Express backend.

The goal was to move from temporary browser-only audio storage to real backend file storage.

---

## Completed on Day 3

- Installed and configured Multer
- Created uploads folder
- Implemented backend audio upload route
- Implemented multipart/form-data upload flow
- Sent audio blob from frontend to backend
- Uploaded audio using Axios POST requests
- Saved uploaded audio files on the backend
- Generated unique filenames for recordings
- Configured Express static file serving
- Improved Git workflow using `.gitignore`

---

# What Was Learned on Day 3

## Why Audio Upload Was Needed

Previously, recorded audio only existed in browser memory.

```txt
Browser memory
↓
Refresh page
↓
Audio lost
```

To support transcription and AI processing, audio needed to be uploaded and stored on the backend.

---

## FormData

Files cannot be properly sent using normal JSON.

`FormData` is used to send binary files over HTTP requests.

Example:

```js
const formData = new FormData();

formData.append("audio", audioBlob, "recording.webm");
```

---

## Axios POST Request

The frontend uploads audio using:

```js
await axios.post("http://localhost:3000/upload-audio", formData);
```

This sends the recorded audio to the backend.

---

## Multer Middleware

Express cannot handle file uploads natively.

Multer is used to:

- receive uploaded files
- process multipart/form-data
- save files on disk
- generate file metadata

---

## Multer Disk Storage

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

This controls:

- where files are saved
- how filenames are generated

---

## Unique Filenames

`Date.now()` is used to avoid overwriting previously uploaded recordings.

Example:

```txt
1779091728166.webm
```

---

## Backend Upload Route

```js
app.post("/upload-audio", upload.single("audio"), (req, res) => {
  res.json({
    message: "Audio uploaded successfully",
    file: req.file.filename,
  });
});
```

This route:

```txt
receives audio
↓
saves file
↓
returns response
```

---

## Express Static Files

```js
app.use("/uploads", express.static("uploads"));
```

This allows uploaded audio files to be publicly accessible.

---

## Complete Day 3 Workflow

```txt
Browser microphone
↓
MediaRecorder
↓
Audio Blob
↓
FormData
↓
Axios POST request
↓
Express backend
↓
Multer middleware
↓
uploads folder
```

---

## Git Workflow Improvements

Added:

```txt
server/uploads
```

inside `.gitignore` to prevent uploaded recordings from being committed to GitHub.

---

# Current Application Status

The application can now:

- record microphone audio
- generate browser playback audio
- upload recordings to the backend
- store uploaded files
- maintain a professional Git workflow

---

# Next Planned Feature

## Day 4 Goal

```txt
Audio recording
↓
Speech-to-text transcription
↓
Transcript generation
```

Future integrations may include:

- OpenAI Whisper
- Deepgram
- AssemblyAI
- Google Speech-to-Text
