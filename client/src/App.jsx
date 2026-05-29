import { useState, useRef } from "react";
import "./App.css";
import axios from "axios";
import jsPDF from "jspdf";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { saveAs } from "file-saver";

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");
  const [transcript, setTranscript] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [momReply, setMomReply] = useState("");
  const [mom, setMom] = useState(null);
  const [editableMom, setEditableMom] = useState(null);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);

  const uploadAudio = async (audioBlob) => {
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.webm");

    try {
      setIsUploading(true);
      setError("");
      setTranscript("");
      setMom(null);

      const response = await axios.post(
        "http://localhost:3000/upload-audio",
        formData,
      );

      console.log("Response:", response.data);
      setTranscript(response.data.transcript || "No transcript received.");
      const momData = response.data.mom || null;
      setMom(momData);
      setEditableMom(
        momData
          ? {
              ...momData,
              participants: [...momData.participants],
              keyPoints: [...momData.keyPoints],
              actionItems: [...momData.actionItems],
              decisions: [...momData.decisions],
            }
          : null,
      );
    } catch (error) {
      console.log(error);
      setError(
        error?.response?.data?.message || "Upload failed. Backend check karo.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const startRecording = async () => {
    try {
      setError("");
      setTranscript("");

      setAudioUrl("");

      // For getting Microphone audio
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      // For System/Tab audio
      const systemStream = await navigator.mediaDevices.getDisplayMedia({
        video: true, // Important for browser
        audio: true,
      });

      // Step 3 — Dono ko mix karo
      const audioContext = new AudioContext();
      const destination = audioContext.createMediaStreamDestination();

      const micSource = audioContext.createMediaStreamSource(micStream);
      const systemSource = audioContext.createMediaStreamSource(systemStream);

      micSource.connect(destination);
      systemSource.connect(destination);

      //  For Mixed stream save
      streamRef.current = destination.stream;
      chunksRef.current = [];

      const mediaRecorder = new MediaRecorder(destination.stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // For all streams stop
        micStream.getTracks().forEach((t) => t.stop());
        systemStream.getTracks().forEach((t) => t.stop());

        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        await uploadAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.log(error);
      setError("Microphone and Screen share access!");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    setIsRecording(false);
  };
  // ---- Editable MOM Functions ----

  // Simple field update (summary)
  const updateField = (field, value) => {
    setEditableMom((prev) => ({ ...prev, [field]: value }));
  };

  // List item update
  const updateListItem = (field, index, value) => {
    const updated = [...editableMom[field]];
    updated[index] = value;
    setEditableMom((prev) => ({ ...prev, [field]: updated }));
  };

  // List item delete
  const deleteListItem = (field, index) => {
    const updated = editableMom[field].filter((_, i) => i !== index);
    setEditableMom((prev) => ({ ...prev, [field]: updated }));
  };

  // List item add
  const addListItem = (field) => {
    setEditableMom((prev) => ({
      ...prev,
      [field]: [...prev[field], ""],
    }));
  };
  // ---- Export PDF ----
const exportPDF = () => {
  const doc = new jsPDF();
  let y = 20;

  doc.setFontSize(18);
  doc.text("Minutes of Meeting", 20, y);
  y += 15;

  doc.setFontSize(12);

  // Summary
  doc.setFont("helvetica", "bold");
  doc.text("Summary:", 20, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  const summaryLines = doc.splitTextToSize(editableMom.summary, 170);
  doc.text(summaryLines, 20, y);
  y += summaryLines.length * 7 + 8;

  // Participants
  doc.setFont("helvetica", "bold");
  doc.text("Participants:", 20, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  editableMom.participants.forEach((p) => {
    doc.text(`• ${p}`, 25, y);
    y += 7;
  });
  y += 5;

  // Key Points
  doc.setFont("helvetica", "bold");
  doc.text("Key Discussion Points:", 20, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  editableMom.keyPoints.forEach((point) => {
    doc.text(`• ${point}`, 25, y);
    y += 7;
  });
  y += 5;

  // Action Items
  doc.setFont("helvetica", "bold");
  doc.text("Action Items:", 20, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  if (editableMom.actionItems.length === 0) {
    doc.text("• None", 25, y);
    y += 7;
  } else {
    editableMom.actionItems.forEach((item) => {
      doc.text(`• ${item}`, 25, y);
      y += 7;
    });
  }
  y += 5;

  // Decisions
  doc.setFont("helvetica", "bold");
  doc.text("Decisions Taken:", 20, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  if (editableMom.decisions.length === 0) {
    doc.text("• None", 25, y);
  } else {
    editableMom.decisions.forEach((d) => {
      doc.text(`• ${d}`, 25, y);
      y += 7;
    });
  }

  doc.save("minutes-of-meeting.pdf");
};

// ---- Export DOCX ----
const exportDOCX = async () => {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: "Minutes of Meeting",
            heading: HeadingLevel.HEADING_1,
          }),

          new Paragraph({ text: "Summary", heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: editableMom.summary }),

          new Paragraph({ text: "" }),
          new Paragraph({ text: "Participants", heading: HeadingLevel.HEADING_2 }),
          ...editableMom.participants.map(
            (p) => new Paragraph({ text: `• ${p}` })
          ),

          new Paragraph({ text: "" }),
          new Paragraph({ text: "Key Discussion Points", heading: HeadingLevel.HEADING_2 }),
          ...editableMom.keyPoints.map(
            (point) => new Paragraph({ text: `• ${point}` })
          ),

          new Paragraph({ text: "" }),
          new Paragraph({ text: "Action Items", heading: HeadingLevel.HEADING_2 }),
          ...(editableMom.actionItems.length === 0
            ? [new Paragraph({ text: "• None" })]
            : editableMom.actionItems.map(
                (item) => new Paragraph({ text: `• ${item}` })
              )),

          new Paragraph({ text: "" }),
          new Paragraph({ text: "Decisions Taken", heading: HeadingLevel.HEADING_2 }),
          ...(editableMom.decisions.length === 0
            ? [new Paragraph({ text: "• None" })]
            : editableMom.decisions.map(
                (d) => new Paragraph({ text: `• ${d}` })
              )),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, "minutes-of-meeting.docx");
};

  return (
    <div className="page">
      <div className="App">
        <div className="badge">AI MOM APP</div>

        <h1>Voice Recorder</h1>
        <p className="subtitle">Record your voice.</p>

        <div className="action-area">
          {!isRecording ? (
            <button
              className="main-btn start-btn"
              onClick={startRecording}
              disabled={isUploading}
            >
              Start Recording
            </button>
          ) : (
            <button className="main-btn stop-btn" onClick={stopRecording}>
              Stop Recording
            </button>
          )}
        </div>

        <div className="status-row">
          {isRecording && (
            <span className="status-pill recording">Recording...</span>
          )}
          {isUploading && (
            <span className="status-pill uploading">Uploading...</span>
          )}
        </div>

        {audioUrl && (
          <div className="audio-box">
            <p className="section-title">Recorded audio</p>
            <audio controls src={audioUrl}></audio>
          </div>
        )}

        {transcript && (
          <div className="transcript-box">
            <h3>Transcript</h3>
            <p>{transcript}</p>
          </div>
        )}

        {error && (
          <div className="error-box">
            <p>{error}</p>
          </div>
        )}
        {error && (
          <div className="error-box">
            <p>{error}</p>
          </div>
        )}

        {editableMom && (
          <div className="mom-box">
            <h3>📋 Minutes of Meeting</h3>

            {/* Summary */}
            <div className="mom-section">
              <h4>📝 Summary</h4>
              <textarea
                className="edit-textarea"
                value={editableMom.summary}
                onChange={(e) => updateField("summary", e.target.value)}
              />
            </div>

            {/* Participants */}
            <div className="mom-section">
              <h4>👥 Participants</h4>
              {editableMom.participants.map((p, i) => (
                <div className="edit-row" key={i}>
                  <input
                    className="edit-input"
                    value={p}
                    onChange={(e) =>
                      updateListItem("participants", i, e.target.value)
                    }
                  />
                  <button
                    className="delete-btn"
                    onClick={() => deleteListItem("participants", i)}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                className="add-btn"
                onClick={() => addListItem("participants")}
              >
                + Add
              </button>
            </div>

            {/* Key Points */}
            <div className="mom-section">
              <h4>🔑 Key Points</h4>
              {editableMom.keyPoints.map((point, i) => (
                <div className="edit-row" key={i}>
                  <input
                    className="edit-input"
                    value={point}
                    onChange={(e) =>
                      updateListItem("keyPoints", i, e.target.value)
                    }
                  />
                  <button
                    className="delete-btn"
                    onClick={() => deleteListItem("keyPoints", i)}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                className="add-btn"
                onClick={() => addListItem("keyPoints")}
              >
                + Add
              </button>
            </div>

            {/* Action Items */}
            <div className="mom-section">
              <h4>✅ Action Items</h4>
              {editableMom.actionItems.map((item, i) => (
                <div className="edit-row" key={i}>
                  <input
                    className="edit-input"
                    value={item}
                    onChange={(e) =>
                      updateListItem("actionItems", i, e.target.value)
                    }
                  />
                  <button
                    className="delete-btn"
                    onClick={() => deleteListItem("actionItems", i)}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                className="add-btn"
                onClick={() => addListItem("actionItems")}
              >
                + Add
              </button>
            </div>

            {/* Decisions */}
            <div className="mom-section">
              <h4>🎯 Decisions Taken</h4>
              {editableMom.decisions.map((d, i) => (
                <div className="edit-row" key={i}>
                  <input
                    className="edit-input"
                    value={d}
                    onChange={(e) =>
                      updateListItem("decisions", i, e.target.value)
                    }
                  />
                  <button
                    className="delete-btn"
                    onClick={() => deleteListItem("decisions", i)}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                className="add-btn"
                onClick={() => addListItem("decisions")}
              >
                + Add
              </button>
            </div>
          </div>
          
        )}
        {/* Export Buttons */}
    <div className="export-row">
      <button className="export-btn pdf-btn" onClick={exportPDF}>
        📄 Export PDF
      </button>
      <button className="export-btn docx-btn" onClick={exportDOCX}>
        📝 Export DOCX
      </button>
    </div>
      </div>
    </div>
  );
}

export default App;
