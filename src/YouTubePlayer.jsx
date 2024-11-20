import React, { useState, useRef, useEffect } from "react";
import YouTube from "react-youtube";
import './dark-theme.css'

const YouTubePlayer = () => {
  const [videoId, setVideoId] = useState("dQw4w9WgXcQ"); // Default video ID
  const [inputUrl, setInputUrl] = useState(""); // To store the user's video URL input
  const [timestamps, setTimestamps] = useState([]);
  const [currentTimestamp, setCurrentTimestamp] = useState(null);
  const [status, setStatus] = useState("Stopped"); // "Playing" or "Stopped"
  const youtubePlayerRef = useRef(null);
  const intervalRef = useRef(null); // To track the polling interval
  const [savedVideoUrl, setSavedVideoUrl] = useState(""); // Save the video URL

  const [playerWidth, setPlayerWidth] = useState(640); // Initial width
  const [playerHeight, setPlayerHeight] = useState(390); // Initial height
  const [isResizing, setIsResizing] = useState(false); // To track resizing status
  const playerRef = useRef(null); // To refer to the player container


  const startResize = (e) => {
    setIsResizing(true);
  
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = playerWidth;
    const startHeight = playerHeight;
  
    const onMouseMove = (e) => {
      if (!isResizing) return;
  
      const newWidth = startWidth + (e.clientX - startX);
      const newHeight = startHeight + (e.clientY - startY);
  
      setPlayerWidth(newWidth > 300 ? newWidth : 300); // Minimum width of 300px
      setPlayerHeight(newHeight > 200 ? newHeight : 200); // Minimum height of 200px
    };
  
    const stopResize = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', stopResize);
    };
  
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', stopResize);
  };
  

  const emotions = [
    "Neutral",
    "Happy",
    "Sad",
    "Angry",
    "Fear",
    "Surprise",
    "Disgust"
  ];
  const genders = [
    "Male",
    "Female"
  ];

  const handleDeleteTimestamp = (id) => {
    setTimestamps((prev) => prev.filter((ts) => ts.id !== id));
  };
  

  const handleVideoReady = (event) => {
    youtubePlayerRef.current = event.target;
  };

  const handleAddTimestamp = () => {
    if (!youtubePlayerRef.current) return;
    const time = parseFloat(youtubePlayerRef.current.getCurrentTime().toFixed(2));
    setTimestamps([
      ...timestamps,
      {
        id: Date.now(),
        start: time,
        end: time + 10.0,
        emotion: "Neutral", // Default to Neutral
        gender: "Male", // Default to Unspecified
      },
    ]);
  };

  const handleEditTimestamp = (id, field, value) => {
    setTimestamps((prev) =>
      prev.map((ts) =>
        ts.id === id
          ? {
              ...ts,
              [field]:
                field === "start" || field === "end"
                  ? Math.max(0, parseFloat(value) || 0)
                  : value,
            }
          : ts
      )
    );
  };

  const handlePlayTimestamp = (id) => {
    const ts = timestamps.find((ts) => ts.id === id);
    if (ts && youtubePlayerRef.current) {
      youtubePlayerRef.current.seekTo(ts.start, true);
      setCurrentTimestamp(ts);
      setStatus("Playing");
      youtubePlayerRef.current.playVideo();

      // Start polling the playhead position
      clearInterval(intervalRef.current); // Clear any previous intervals
      intervalRef.current = setInterval(() => {
        if (youtubePlayerRef.current) {
          const currentTime = youtubePlayerRef.current.getCurrentTime();
          if (currentTime >= ts.end) {
            youtubePlayerRef.current.pauseVideo();
            setStatus("Stopped");
            setCurrentTimestamp(null);
            clearInterval(intervalRef.current); // Stop polling
          }
        }
      }, 100); // Check every 100ms
    }
  };

  const handleDownloadTimestamps = () => {
    const data = JSON.stringify(
      {
        videoUrl: savedVideoUrl,
        timestamps,
      },
      null,
      2
    );
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
  
    const link = document.createElement("a");
    link.href = url;
    link.download = "timestamps.json"; // Download file name fixed
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  

  const handleUploadTimestamps = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (data.videoUrl) {
            const videoIdMatch = data.videoUrl.match(
              /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
            );
            if (videoIdMatch) {
              setVideoId(videoIdMatch[1]);
              setSavedVideoUrl(data.videoUrl); // Save the loaded video URL
            } else {
              alert("Invalid video URL in the file");
            }
          }
          setTimestamps(data.timestamps || []);
        } catch (error) {
          alert("Invalid JSON file");
        }
      };
      reader.readAsText(file);
    }
  };

  const handleLoadVideo = () => {
    const videoIdMatch = inputUrl.match(
      /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    if (videoIdMatch) {
      setVideoId(videoIdMatch[1]);
      setSavedVideoUrl(inputUrl); // Save the URL when loaded
      setTimestamps([]); // Clear timestamps when a new video is loaded
      setInputUrl("");
    } else {
      alert("Invalid YouTube URL");
    }
  };

  useEffect(() => {
    // Cleanup interval on component unmount
    return () => clearInterval(intervalRef.current);
  }, []);

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "20px", display: "flex" }}>
      <div style={{ flex: 1, paddingRight: "20px" }}>
        <h1>TIMESTAMPER</h1>
        <div>
          <strong>Current Video URL:</strong> {savedVideoUrl || "None"}
        </div>

        <div style={{ marginBottom: "20px" }}>
          <input
            type="text"
            placeholder="Enter YouTube URL"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            style={{ padding: "10px", width: "60%" }}
          />
          <button
            onClick={handleLoadVideo}
            style={{
              padding: "10px 20px",
              marginLeft: "10px",
              backgroundColor: "#4285f4",
              color: "white",
              border: "none",
              cursor: "pointer",
            }}
          >
            Load Video
          </button>
        </div>
        <YouTube
          videoId={videoId}
          opts={{
            height: "720",
            width: "1280",
            playerVars: { autoplay: 0 },
          }}
          onReady={handleVideoReady}
        />
        <button
          onClick={handleAddTimestamp}
          style={{
            padding: "10px 20px",
            backgroundColor: "#0c9c72",
            color: "white",
            border: "none",
            cursor: "pointer",
          }}
        >
          Add Timestamp
        </button>

        {/*yoyoyoyo*/}


        <button
            onClick={handleDownloadTimestamps}
            style={{
              padding: "10px 20px",
              backgroundColor: "#ffab00",
              color: "white",
              border: "none",
              cursor: "pointer",
            }}
          >
            Download JSON
          </button>
          <input
            type="file"
            accept="application/json"
            onChange={handleUploadTimestamps}
            style={{ marginLeft: "10px" }}
          />
      </div>

      <div
        style={{
          flex: 1,
          maxWidth: "400px",
          overflowY: "auto",
          height: "calc(100vh - 100px)",
        }}
      >
        <h2>Timestamps</h2>
        {timestamps.length === 0 && <p>No timestamps added yet.</p>}
        <ul style={{ listStyle: "none", padding: 0 }}>
          {timestamps
            // Sort timestamps by start time
            .map((ts, index) => (
              <li
                key={ts.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  marginBottom: "15px",
                  padding: "10px",
                  border: "1px solid #ccc",
                  borderRadius: "5px",
                  backgroundColor: currentTimestamp?.id === ts.id ? "#f0f8ff" : "transparent",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <strong>#{index + 1}</strong> {/* Add numbering */}
                  <label>
                    Start:
                    <input
                      type="number"
                      step="0.01"
                      value={ts.start}
                      onChange={(e) =>
                        handleEditTimestamp(ts.id, "start", e.target.value)
                      }
                      style={{ marginLeft: "5px", width: "70px" }}
                    />
                  </label>
                  <label>
                    End:
                    <input
                      type="number"
                      step="0.01"
                      value={ts.end}
                      onChange={(e) =>
                        handleEditTimestamp(ts.id, "end", e.target.value)
                      }
                      style={{ marginLeft: "5px", width: "70px" }}
                    />
                  </label>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <label>
                    Emotion:
                    <select
                      value={ts.emotion}
                      onChange={(e) =>
                        handleEditTimestamp(ts.id, "emotion", e.target.value)
                      }
                    >
                      {emotions.map((emotion) => (
                        <option key={emotion} value={emotion}>
                          {emotion}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Gender:
                    <select
                      value={ts.gender}
                      onChange={(e) => handleEditTimestamp(ts.id, "gender", e.target.value)}
                      style={{ marginLeft: "5px" }}
                    >
                      {genders.map((gender) => (
                        <option key={gender} value={gender}>
                          {gender}
                        </option>
                      ))}
                    </select>

                  </label>

                  <button
      onClick={() => handleDeleteTimestamp(ts.id)}
      style={{
        backgroundColor: "#f44336",
        color: "white",
        border: "none",
        padding: "5px 10px",
        cursor: "pointer",
      }}
    >
      Delete
    </button>
                </div>
                <div>
                  <button
                    onClick={() => handlePlayTimestamp(ts.id)}
                    style={{
                      padding: "5px 10px",
                      backgroundColor: "#4285f4",
                      color: "white",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Play
                  </button>
                </div>
              </li>
            ))}
        </ul>

        

        <div style={{ marginTop: "20px" }}>
          
        </div>
      </div>
    </div>
  );
};

export default YouTubePlayer;
