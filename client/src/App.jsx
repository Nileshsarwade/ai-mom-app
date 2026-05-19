import { useState, useRef } from "react";
import "./App.css";
import axios from "axios";

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");
  const [transcript, setTranscript] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

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

      const response = await axios.post(
        "http://localhost:3000/upload-audio",
        formData,
      );

      console.log(response.data);
      setTranscript(response.data.transcript || "No transcript received.");
    } catch (error) {
      console.log(error);
      setError(
        error?.response?.data?.message ||
          "Upload ya transcription failed. Backend aur API key check karo.",
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

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        await uploadAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.log(error);
      setError("Microphone access allow karo.");
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

        <h1>Voice to Transcript</h1>
        <p className="subtitle">
          Record your voice and convert it into text instantly.
        </p>

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
      </div>
    </div>
  );
}

export default App;
