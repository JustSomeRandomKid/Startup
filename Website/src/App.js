import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import "./App.css";

const socket = io("http://localhost:5000");

const App = () => {
  const [isCameraStarted, setIsCameraStarted] = useState(false);
  const [inCall, setInCall] = useState(false);
  const [partnerStream, setPartnerStream] = useState(null);
  const [waitingForPartner, setWaitingForPartner] = useState(false); // Add a state for waiting
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const candidateQueueRef = useRef([]);

  // Update remote video element when partnerStream changes
  useEffect(() => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = partnerStream;
    }
  }, [partnerStream]);

  useEffect(() => {
    socket.on("candidate", (candidate) => {
      if (
        peerConnectionRef.current &&
        peerConnectionRef.current.remoteDescription
      ) {
        peerConnectionRef.current
          .addIceCandidate(new RTCIceCandidate(candidate))
          .catch((err) => console.error("Error adding candidate:", err));
      } else {
        candidateQueueRef.current.push(candidate);
      }
    });

    socket.on("answer", async (answer) => {
      if (peerConnectionRef.current) {
        // If remoteDescription isn't set, set it and flush queued ICE candidates.
        if (!peerConnectionRef.current.remoteDescription) {
          try {
            await peerConnectionRef.current.setRemoteDescription(answer);
            flushCandidateQueue();
          } catch (err) {
            console.error(
              "Error setting remote description from answer:",
              err
            );
          }
        } else {
          console.log("Remote description already set; ignoring duplicate answer.");
        }
      }
    });

    socket.on("offer", (offer) => {
      console.log("Received offer:", offer);
      handleOffer(offer);
    });

  socket.on("disconnectCall", () => {
    leaveCall();
    // Automatically attempt to find a new partner after a delay
    setTimeout(() => {
      if (localVideoRef.current?.srcObject) {
        initPeerConnection(localVideoRef.current.srcObject);
        joinCall();
      }
    }, 500);
  });

    return () => {
      socket.off("candidate");
      socket.off("answer");
      socket.off("offer");
      socket.off("disconnectCall");
    };
  }, [partnerStream]);

  const flushCandidateQueue = () => {
    if (
      peerConnectionRef.current &&
      peerConnectionRef.current.remoteDescription
    ) {
      candidateQueueRef.current.forEach((candidate) => {
        peerConnectionRef.current
          .addIceCandidate(new RTCIceCandidate(candidate))
          .catch((err) =>
            console.error("Error adding queued candidate:", err)
          );
      });
      candidateQueueRef.current = [];
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setIsCameraStarted(true);
      initPeerConnection(stream);
    } catch (error) {
      console.error("Camera start failed", error);
    }
  };

  const initPeerConnection = (localStream) => {
    // Close existing peer connection if it exists
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    // Create new peer connection
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    peerConnectionRef.current = pc;

    localStream.getTracks().forEach((track) =>
      pc.addTrack(track, localStream)
    );

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("Sending ICE candidate:", event.candidate);
        socket.emit("candidate", event.candidate);
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setPartnerStream(event.streams[0]);
      }
    };
  };

  // Create and send a valid SDP offer.
  const joinCall = async () => {
    // Reinitialize connection if needed.
    if (!peerConnectionRef.current) {
      initPeerConnection(localVideoRef.current.srcObject);
    }
    try {
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      socket.emit("findPartner", offer);
      setWaitingForPartner(true); // Set waiting state to true
      setInCall(true);
    } catch (error) {
      console.error("Error creating offer:", error);
    }
  };

  // Handle received offer: set remote description, flush queued ICE candidates, then send answer.
  const handleOffer = async (offer) => {
    if (!peerConnectionRef.current) return;
    if (peerConnectionRef.current.remoteDescription) {
      console.warn("Offer received but remote description already set; ignoring duplicate offer.");
      return;
    }
    try {
      await peerConnectionRef.current.setRemoteDescription(offer);
      flushCandidateQueue();
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      socket.emit("answer", answer);
      setInCall(true);
      setWaitingForPartner(false); // Partner connected, stop waiting
    } catch (error) {
      console.error("Error handling offer:", error);
    }
  };

  // Leave call: close connection, stop media tracks, notify server, and reset state.
  const leaveCall = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    // Stop only the partner's stream, not the local stream
    if (partnerStream) {
      partnerStream.getTracks().forEach((track) => track.stop());
      setPartnerStream(null);
    }
    socket.emit("disconnectCall");
    setInCall(false);
    setWaitingForPartner(false);
  };

  // Skip call: leave the current call and then rejoin after a short delay.
  const skipCall = () => {
    leaveCall();
    setTimeout(() => {
      if (isCameraStarted) {
        // Reinitialize peer connection using the current local stream.
        initPeerConnection(localVideoRef.current.srcObject);
        joinCall();
      }
    }, 500);
  };

  return (
    <div className="app">
      <div className="video-container">
        <div className="local-video">
          <video ref={localVideoRef} autoPlay playsInline muted />
        </div>
        <div className="remote-video">
          {partnerStream ? (
            <video ref={remoteVideoRef} autoPlay playsInline />
          ) : waitingForPartner ? (
            <div className="loading-overlay">
              <div className="loading-circle"></div>
              <div className="waiting-text">Waiting for partner...</div>
            </div>
          ) : (
            <div className="disconnected-overlay">
              <div className="disconnected-text">Nexus</div>
            </div>
          )}
        </div>
      </div>
      <div className="controls">
        {!isCameraStarted && (
          <button onClick={startCamera}>Start Camera</button>
        )}
        {isCameraStarted && !inCall && (
          <button onClick={joinCall}>Join Call</button>
        )}
        {inCall && (
          <>
            <button onClick={leaveCall}>Leave Call</button>
            <button onClick={skipCall}>Skip</button>
          </>
        )}
      </div>
    </div>
  );
};

export default App;
