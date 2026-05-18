import { useState, useRef } from "react";
import "./App.css";
import axios from "axios";

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);

  const uploadAudio = async (audioBlob) => {
    const formData = new FormData();

    formData.append("audio", audioBlob, "recording.webm");

    try {
      const response = await axios.post(
        "http://localhost:3000/upload-audio",
        formData,
      );

      console.log(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  const startRecording = async () => {
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
  };
  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    streamRef.current.getTracks().forEach((track) => track.stop());
    setIsRecording(false);
  };

  return (
    <div className="App">
      <h2>AI MOM App</h2>
      <p>Microphone recording</p>
      {!isRecording ? (
        <button onClick={startRecording}>Start Recording</button>
      ) : (
        <button onClick={stopRecording}> Stop Recording</button>
      )}

      {audioUrl && (
        <div className="audio-Box">
          <p>Recorded audio</p>
          <audio controls src={audioUrl}></audio>
        </div>
      )}
    </div>
  );
}

export default App;
