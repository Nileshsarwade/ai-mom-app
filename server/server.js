const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");

const app = express();

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

app.post("/upload-audio", upload.single("audio"), (req, res) => {
  console.log(req.file);

  res.json({
    message: "Audio uploaded successfully",
    file: req.file.filename,
  });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
