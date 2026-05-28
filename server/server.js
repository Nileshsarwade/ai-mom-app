require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Groq = require("groq-sdk");

// ---- Groq client banaya ----
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// ---- Multer same raha ----
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname || ".webm");
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
      return res.status(400).json({ message: "No audio file uploaded" });
    }

    // ---- Real Transcription ----
    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(req.file.path),
      model: "whisper-large-v3",
      language: "en",
    });

    //  Structured MOM Generation
    const momResult = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are a professional meeting assistant. 
      Your job is to analyze meeting transcripts and generate 
      structured Minutes of Meeting (MOM).
      
      ALWAYS respond in this EXACT JSON format, nothing else:
      {
        "summary": "2-3 line meeting summary",
        "participants": ["name1", "name2"],
        "keyPoints": ["point1", "point2", "point3"],
        "actionItems": ["action1", "action2"],
        "decisions": ["decision1", "decision2"]
      }
      
      If participants are not clear, write ["Not identified"].
      Keep all points concise and professional.
      Return ONLY the JSON object, no extra text.`,
        },
        {
          role: "user",
          content: `Generate MOM for this transcript: ${transcription.text}`,
        },
      ],
    });

    //    JSON parse
    let structuredMom;
    try {
      const raw = momResult.choices[0].message.content;
      structuredMom = JSON.parse(raw);
    } catch (e) {
      structuredMom = {
        summary: momResult.choices[0].message.content,
        participants: ["Not identified"],
        keyPoints: ["Could not structure the MOM"],
        actionItems: [],
        decisions: [],
      };
    }

    res.json({
      message: "Audio uploaded successfully",
      fileName: req.file.filename,
      transcript: transcription.text,
      mom: structuredMom,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Audio upload failed" });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
