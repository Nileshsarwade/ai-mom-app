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
      setMom(response.data.mom || null); // ← YE ADD KARO
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

        {mom && (
          <div className="mom-box">
            <h3>📋 Minutes of Meeting</h3>
            <div className="mom-section">
              <h4>📝 Summary</h4>
              <p>{mom.summary}</p>
            </div>
            <div className="mom-section">
              <h4>👥 Participants</h4>
              <ul>
                {mom.participants.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
            <div className="mom-section">
              <h4>🔑 Key Points</h4>
              <ul>
                {mom.keyPoints.map((point, i) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>
            </div>
            <div className="mom-section">
              <h4>✅ Action Items</h4>
              <ul>
                {mom.actionItems.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="mom-section">
              <h4>🎯 Decisions Taken</h4>
              <ul>
                {mom.decisions.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
