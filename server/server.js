const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();
const OpenAI = require("openai");

const app = express();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(cors());

app.use("/uploads", express.static("uploads"));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);

    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.post("/upload-audio", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No audio file uploaded",
      });
    }

    console.log(req.file);

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(req.file.path),
      model: "whisper-1",
    });

    res.json({
      message: "Audio uploaded and transcribed successfully",
      file: req.file.filename,
      transcript: transcription.text,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Transcription failed",
      error: error.message,
    });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
