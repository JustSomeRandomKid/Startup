import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:5000'); // Connect to the signaling server

const App = () => {
  const videoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const [stream, setStream] = useState(null);
  const [isInCall, setIsInCall] = useState(false);

  useEffect(() => {
    socket.on('offer', async (offer) => {
      if (!peerConnection.current) createPeerConnection();

      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);
      socket.emit('answer', answer);
    });

    socket.on('answer', async (answer) => {
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on('candidate', async (candidate) => {
      if (peerConnection.current) {
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    socket.on('disconnectCall', () => {
      endCall();
    });

    return () => {
      socket.off('offer');
      socket.off('answer');
      socket.off('candidate');
      socket.off('disconnectCall');
    };
  }, []);

  const startCamera = async () => {
    try {
      const userStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(userStream);
      if (videoRef.current) videoRef.current.srcObject = userStream;
    } catch (err) {
      console.error('Error accessing media devices.', err);
    }
  };

  const createPeerConnection = () => {
    peerConnection.current = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    peerConnection.current.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('candidate', event.candidate);
      }
    };

    stream?.getTracks().forEach((track) => {
      peerConnection.current.addTrack(track, stream);
    });
  };

  const joinCall = async () => {
    if (!stream) {
      alert("Start your camera first!");
      return;
    }
    setIsInCall(true);
    createPeerConnection();

    const offer = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(offer);
    socket.emit('findPartner', offer);
  };

  const skipCall = () => {
    socket.emit('disconnectCall');
    endCall();
    joinCall(); // Find a new partner
  };

  const endCall = () => {
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setIsInCall(false);
  };

  return (
    <div>
      <h1>Omegle-Style Video Chat</h1>

      <video ref={videoRef} autoPlay muted style={{ width: '45%', border: '1px solid black' }} />
      <video ref={remoteVideoRef} autoPlay style={{ width: '45%', border: '1px solid black' }} />

      <div>
        <button onClick={startCamera}>Start Camera</button>
        <button onClick={joinCall} disabled={isInCall}>Join Call</button>
        <button onClick={skipCall} disabled={!isInCall}>Skip</button>
      </div>
    </div>
  );
};

export default App;
