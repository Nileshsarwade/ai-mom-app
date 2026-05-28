import { useState, useRef } from "react";
import "./App.css";
import axios from "axios";

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
      </div>
    </div>
  );
}

export default App;
