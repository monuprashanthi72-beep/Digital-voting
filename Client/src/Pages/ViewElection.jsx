import React, { useContext, useEffect, useState, useRef, useCallback } from "react";
import { TransactionContext } from "../context/TransactionContext";
import { useParams } from "react-router-dom";
import { Button, Grid, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Box, CircularProgress, TextField } from "@mui/material";
import Webcam from "react-webcam";
import { serverLink } from "../Data/Variables";

// face-api.js is now loaded via CDN in index.html to avoid Webpack 5 polyfill issues
const faceapi = window.faceapi;

const calculateEAR = (eye) => {
  const p1 = eye[0];
  const p2 = eye[1];
  const p3 = eye[2];
  const p4 = eye[3];
  const p5 = eye[4];
  const p6 = eye[5];
  const dist = (a, b) => Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
  return (dist(p2, p6) + dist(p3, p5)) / (2.0 * dist(p1, p4));
};

export default function ViewElection() {
  const { sendTransaction, connectWallet, currentAccount } = useContext(TransactionContext);
  const { id } = useParams();

  const [candidates, setCandidates] = useState([]);

  // Machine Learning / Face Auth State
  const [targetCandidate, setTargetCandidate] = useState(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [scanning, setScanning] = useState(false);
  const webcamRef = useRef(null);
  const [blinkStatus, setBlinkStatus] = useState("Face Scan Required");
  const [hasBlinked, setHasBlinked] = useState(false);
  const [currentEAR, setCurrentEAR] = useState(0);

  // New MFA State
  const [inputVoterId, setInputVoterId] = useState("");
  const [inputPasscode, setInputPasscode] = useState("");
  const [isCredentialVerified, setIsCredentialVerified] = useState(false);

  useEffect(() => {
    async function fetchCandidates() {
      try {
        const res = await fetch(serverLink + `election/${id}`);
        const data = await res.json();
        setCandidates(data.candidates || []);
      } catch (e) {
        console.error("Failed to fetch candidates");
      }
    }
    fetchCandidates();
  }, [id]);

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = process.env.PUBLIC_URL + '/models';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
      ]);
      setModelsLoaded(true);
    };
    loadModels();
  }, []);

  const handleVoteClick = (candidate) => {
    if (!currentAccount) {
      alert("Connect Wallet First");
      return;
    }
    
    // User must be logged in to localStorage to authenticate biometricly
    const userProfileStr = localStorage.getItem("userProfile");
    if (!userProfileStr) {
      alert("Session expired or missing profile. Please login again.");
      window.location.href = "/login";
      return;
    }
    
    setTargetCandidate(candidate);
    setIsAuthenticating(true); // Pops up the MFA + Webcam Dialog
    setIsCredentialVerified(false);
    setInputVoterId("");
    setInputPasscode("");
  };

  const handleVerifyCredentials = () => {
    const profile = JSON.parse(localStorage.getItem("userProfile"));
    if (inputVoterId === profile.voterId && inputPasscode === profile.passcode) {
      setIsCredentialVerified(true);
      setScanning(true);
      setHasBlinked(false);
      setBlinkStatus("Initializing live scan...");
    } else {
      alert("Invalid Voter ID or Passcode. Please check your registry email.");
    }
  };

  const handlePostLivenessAuth = useCallback(async (liveDescriptor) => {
    setScanning(false);
    
    // Fetch registered descriptor from local storage
    const profile = JSON.parse(localStorage.getItem("userProfile"));
    const registeredDescriptorArray = profile.faceDescriptor;

    if (!registeredDescriptorArray || registeredDescriptorArray.length === 0) {
      alert("No biometric profile found. Enroll face during registration.");
      setIsAuthenticating(false);
      return;
    }

    const distance = faceapi.euclideanDistance(new Float32Array(liveDescriptor), new Float32Array(registeredDescriptorArray));
    
    if (distance < 0.6) {
      alert(`Identity Verified! Match confidence: ${(1 - distance).toFixed(2)}. Proceeding with Blockchain Transaction.`);
      setIsAuthenticating(false);
      
      const user_id = currentAccount;
      const result = await sendTransaction(id, targetCandidate, user_id);
      alert(result.mess);
    } else {
      alert("IDENTITY REJECTED: Face does not match registered voter.");
      setIsAuthenticating(false);
    }
  }, [currentAccount, id, sendTransaction, targetCandidate]);

  useEffect(() => {
    let interval;
    if (scanning && modelsLoaded && isAuthenticating) {
      interval = setInterval(async () => {
        if (webcamRef.current && webcamRef.current.video) {
          const video = webcamRef.current.video;
          const detections = await faceapi.detectSingleFace(
            video, 
            new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.3 })
          ).withFaceLandmarks().withFaceDescriptor();

          if (detections) {
            const earLeft = calculateEAR(detections.landmarks.getLeftEye());
            const earRight = calculateEAR(detections.landmarks.getRightEye());
            const avgEAR = (earLeft + earRight) / 2;
            setCurrentEAR(avgEAR);

            console.log("Voting EAR:", avgEAR.toFixed(3));

            if (avgEAR < 0.28) {
              setHasBlinked(true);
              setBlinkStatus("Blink detected! Now open your eyes...");
            } else if (hasBlinked && avgEAR > 0.30) {
              // Valid blink sequence
              handlePostLivenessAuth(detections.descriptor);
            } else if (!hasBlinked) {
              setBlinkStatus("Please BLINK to verify identity...");
            }
          } else {
            setBlinkStatus("No face detected. Please center your face.");
          }
        }
      }, 150);
    }
    return () => clearInterval(interval);
  }, [scanning, modelsLoaded, isAuthenticating, hasBlinked, handlePostLivenessAuth]);

  return (
    <div style={{ padding: "40px" }}>
      <Typography variant="h4">Election Dashboard</Typography>
      <Typography variant="body1" color="textSecondary" style={{ marginTop: "10px", marginBottom: "30px" }}>
        Election UUID: {id}
      </Typography>

      {!currentAccount && (
        <Button variant="contained" size="large" color="error" onClick={connectWallet} style={{ marginBottom: "30px" }}>
          Connect MetaMask Wallet to Vote
        </Button>
      )}

      <Typography variant="h5" gutterBottom>
        Select your Candidate:
      </Typography>

      <Grid container spacing={3} style={{ marginTop: "10px" }}>
        {candidates.map((cand, index) => (
          <Grid item key={index}>
            <Button
              variant="contained"
              size="large"
              color="primary"
              onClick={() => handleVoteClick(cand)}
            >
              {cand.toUpperCase()}
            </Button>
          </Grid>
        ))}
      </Grid>

      {/* BIOMETRIC AUTHENTICATION MODAL */}
      <Dialog open={isAuthenticating} onClose={() => !scanning && setIsAuthenticating(false)} maxWidth="sm" fullWidth>
        <DialogTitle align="center" style={{ fontWeight: "bold", background: "#f5f5f5" }}>
           Live Biometric Security Check
        </DialogTitle>
        <DialogContent style={{ padding: 20 }}>
          <Typography variant="body1" align="center" gutterBottom style={{ marginBottom: 15 }}>
            You are attempting to cast a vote for <b>{targetCandidate?.toUpperCase()}</b>.
            Please verify your identity.
          </Typography>

          {!modelsLoaded ? (
            <Box display="flex" justifyContent="center" alignItems="center" p={4}>
               <CircularProgress size={30} style={{ marginRight: 15 }} />
               <Typography>Loading secure AI modules...</Typography>
            </Box>
          ) : !isCredentialVerified ? (
            <Box p={2}>
              <Typography variant="body2" color="textSecondary" style={{ marginBottom: 20 }}>
                Please enter your credentials sent to your email to unlock biometric voting.
              </Typography>
              <TextField
                fullWidth
                label="Voter ID"
                variant="outlined"
                margin="normal"
                value={inputVoterId}
                onChange={(e) => setInputVoterId(e.target.value)}
              />
              <TextField
                fullWidth
                label="Security Passcode"
                type="password"
                variant="outlined"
                margin="normal"
                value={inputPasscode}
                onChange={(e) => setInputPasscode(e.target.value)}
              />
            </Box>
          ) : (
            <Grid container direction="column" alignItems="center">
              <Webcam
                 audio={false}
                 ref={webcamRef}
                 screenshotFormat="image/jpeg"
                 width="100%"
                 style={{ borderRadius: "10px", border: "4px solid #1976d2", boxShadow: "0 4px 8px rgba(0,0,0,0.2)" }}
              />
              <Box mt={2} textAlign="center">
                <Typography variant="h6" color="secondary">
                  {blinkStatus}
                </Typography>
                <Typography variant="caption" color="textSecondary" style={{ display: 'block', marginTop: 5 }}>
                  Sensitivity Debug (EAR): {currentEAR.toFixed(3)}
                </Typography>
                {!hasBlinked && (
                  <Typography variant="body2" color="textSecondary">
                    Liveness verification required.
                  </Typography>
                )}
              </Box>
            </Grid>
          )}

        </DialogContent>
        <DialogActions style={{ justifyContent: "center", paddingBottom: 25 }}>
           <Button variant="outlined" color="error" onClick={() => { setScanning(false); setIsAuthenticating(false); }}>
             Cancel
           </Button>
           {!isCredentialVerified ? (
             <Button variant="contained" color="primary" onClick={handleVerifyCredentials} style={{ marginLeft: 15 }}>
               Verify Credentials
             </Button>
           ) : (
             <Typography variant="body2" color="primary" style={{ marginLeft: 15, fontWeight: "bold" }}>
               Scan Active: Please Blink
             </Typography>
           )}
        </DialogActions>
      </Dialog>

    </div>
  );
}