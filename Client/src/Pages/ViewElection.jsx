import React, { useContext, useEffect, useState, useRef, useCallback } from "react";
import { TransactionContext } from "../context/TransactionContext";
import { useParams } from "react-router-dom";
import { Button, Grid, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Box, CircularProgress, TextField, LinearProgress, Alert } from "@mui/material";
import Webcam from "react-webcam";
import { serverLink } from "../Data/Variables";
import axios from "axios";

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
  const { sendTransaction, connectWallet, currentAccount, getElectionTimes } = useContext(TransactionContext);
  const { id } = useParams();

  const [candidates, setCandidates] = useState([]);
  
  // Election Timer State
  const [electionWindow, setElectionWindow] = useState({ start: 0, end: 0 });
  const [isElectionActive, setIsElectionActive] = useState(true);
  const [windowMessage, setWindowMessage] = useState("");

  // Machine Learning / Face Auth State
  const [targetCandidate, setTargetCandidate] = useState(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [scanning, setScanning] = useState(false);
  const webcamRef = useRef(null);
  const [blinkStatus, setBlinkStatus] = useState("Face Scan Required");
  const [hasBlinked, setHasBlinked] = useState(false);
  const [currentEAR, setCurrentEAR] = useState(0);
  const isProcessingAuthRef = useRef(false);
  const blinkWasDetectedRef = useRef(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState({ hash: "", voterId: "", candidate: "" });

  // New MFA State
  const [inputVoterId, setInputVoterId] = useState("");
  const [inputPasscode, setInputPasscode] = useState("");
  const [isCredentialVerified, setIsCredentialVerified] = useState(false);
  const [timer, setTimer] = useState(180); // 180 seconds session limit
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
    async function fetchTimes() {
      if (getElectionTimes) {
        const times = await getElectionTimes();
        setElectionWindow(times);
      }
    }
    fetchTimes();
  }, [getElectionTimes]);

  useEffect(() => {
    const checkWindow = () => {
      if (electionWindow.start === 0 && electionWindow.end === 0) return;
      const now = Math.floor(Date.now() / 1000);
      if (now < electionWindow.start) {
        setIsElectionActive(false);
        setWindowMessage(`Election starts at: ${new Date(electionWindow.start * 1000).toLocaleString()}`);
      } else if (now > electionWindow.end) {
        setIsElectionActive(false);
        setWindowMessage(`Election ended at: ${new Date(electionWindow.end * 1000).toLocaleString()}`);
      } else {
        setIsElectionActive(true);
        setWindowMessage(`Election ends at: ${new Date(electionWindow.end * 1000).toLocaleString()}`);
      }
    };
    checkWindow();
    const inv = setInterval(checkWindow, 10000);
    return () => clearInterval(inv);
  }, [electionWindow]);

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = process.env.PUBLIC_URL + '/models';
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL), // Higher precision
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
      ]);
      setModelsLoaded(true);
    };
    loadModels();
  }, []);

  const handleVoteClick = (candidate) => {
    if (!isElectionActive) {
      alert(`Access Denied: The Smart Contract has locked the voting terminal!\n\n${windowMessage || "The administrative election period is currently not active."}`);
      return;
    }

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
    setTimer(180); // Reset timer to 180s
    isProcessingAuthRef.current = false;
    blinkWasDetectedRef.current = false;
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
    
    // Fetch registered descriptor from local storage (set at login)
    const profile = JSON.parse(localStorage.getItem("userProfile"));
    const registeredDescriptorArray = profile.faceDescriptor;

    // 🔒 SECURITY FIX #1: Strictly block if no biometric data is enrolled
    if (
      !registeredDescriptorArray ||
      !Array.isArray(registeredDescriptorArray) ||
      registeredDescriptorArray.length < 128  // face-api descriptors are always 128 floats
    ) {
      alert(
        "⛔ BIOMETRIC VERIFICATION FAILED\n\n" +
        "No valid facial biometric profile is enrolled for this account.\n" +
        "Voting is not permitted without a registered face profile.\n\n" +
        "Please re-register with a clear profile photo to enroll your biometrics."
      );
      setIsAuthenticating(false);
      return;
    }

    // 🔒 SECURITY FIX #2: Strict threshold 0.45 (face-api recommends < 0.4–0.5 for identity)
    // Previous threshold was 0.6 which was way too lenient — almost any face could pass
    const STRICT_THRESHOLD = 0.45;

    const distance = faceapi.euclideanDistance(
      new Float32Array(liveDescriptor),
      new Float32Array(registeredDescriptorArray)
    );

    console.log(`[FACE AUTH] Euclidean distance: ${distance.toFixed(4)} | Threshold: ${STRICT_THRESHOLD}`);
    
    if (distance < STRICT_THRESHOLD) {
      const confidence = ((1 - distance) * 100).toFixed(1);
      alert(`✅ Identity Verified!\nMatch confidence: ${confidence}%\n\nProceeding with Blockchain Transaction.`);
      setIsAuthenticating(false);
      
      const user_id = currentAccount;
      const candidateName = targetCandidate.name || targetCandidate;
      const candidateId = targetCandidate.id || targetCandidate;
      
      const result = await sendTransaction(id, candidateId, user_id);
      
      if (result.success) {
        // Record voter participation (not who they voted for — ballot secrecy preserved)
        try {
          await axios.post(serverLink + "user/voted/" + profile._id);
        } catch (err) {
          console.error("Could not record vote participation:", err);
        }
        setReceiptData({
          hash: result.hash,
          voterId: profile.voterId,
          candidate: candidateName
        });
        setShowReceipt(true);
      } else {
        alert(result.mess || "Blockchain Transaction Failed. Please try again.");
      }
    } else {
      const confidence = ((1 - distance) * 100).toFixed(1);
      alert(
        `⛔ IDENTITY REJECTED\n\n` +
        `Your face does NOT match the registered voter profile.\n` +
        `Match score: ${confidence}% (minimum 55% required)\n\n` +
        `If this is you, ensure good lighting and remove glasses/mask.`
      );
      setIsAuthenticating(false);
    }
  }, [currentAccount, id, sendTransaction, targetCandidate]);

  useEffect(() => {
    let timeoutId;
    let isActive = true;

    const runScanner = async () => {
      if (!scanning || !modelsLoaded || !isAuthenticating || !isActive) return;
      if (isProcessingAuthRef.current) return;

      try {
        if (webcamRef.current && webcamRef.current.video && webcamRef.current.video.readyState === 4) {
          const video = webcamRef.current.video;
          const detections = await faceapi.detectSingleFace(
            video, 
            new faceapi.SsdMobilenetv1Options({ minConfidence: 0.35 })
          ).withFaceLandmarks().withFaceDescriptor();

          if (detections) {
            const earLeft = calculateEAR(detections.landmarks.getLeftEye());
            const earRight = calculateEAR(detections.landmarks.getRightEye());
            const avgEAR = (earLeft + earRight) / 2;
            setCurrentEAR(avgEAR);
            console.log("LIVE SCAN EAR:", avgEAR.toFixed(3));

            if (avgEAR > 0.05) {
              if (avgEAR < 0.25) {
                blinkWasDetectedRef.current = true;
                setHasBlinked(true); // Still update state for UI bar
                setBlinkStatus("Blink detected! Now open your eyes...");
              } else if (blinkWasDetectedRef.current && avgEAR > 0.27) {
                isProcessingAuthRef.current = true;
                handlePostLivenessAuth(detections.descriptor);
              } else if (!blinkWasDetectedRef.current) {
                setBlinkStatus("Please BLINK to verify identity...");
              }
            } else {
              setBlinkStatus("Please look directly at the camera.");
            }
          } else {
            setBlinkStatus("No face detected. Please center your face.");
          }
        }
      } catch (err) {
        console.error("Scanner Error:", err);
      }

      if (isActive && !isProcessingAuthRef.current) {
        timeoutId = setTimeout(runScanner, 10); // Super fast 10ms gap
      }
    };

    if (scanning && modelsLoaded && isAuthenticating) {
        runScanner();
    }

    return () => {
      isActive = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [scanning, modelsLoaded, isAuthenticating, handlePostLivenessAuth]);

  // NEW: Manual override for face-paint/lighting issues
  const handleManualOverride = async () => {
    if (webcamRef.current) {
        setBlinkStatus("Manual Capture Processing...");
        const video = webcamRef.current.video;
        const detections = await faceapi.detectSingleFace(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 })).withFaceLandmarks().withFaceDescriptor();
        if (detections) {
            handlePostLivenessAuth(detections.descriptor);
        } else {
            alert("No face detected. Make sure you are clearly visible.");
        }
    }
  };

  // 🏆 RESEARCH FEATURE #2: 60-Second Security Timer
  useEffect(() => {
    let countdown;
    if (isAuthenticating && isCredentialVerified && timer > 0) {
      countdown = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      alert("SESSION TIMEOUT: For your security, the voting window has closed (Coercion Resistance Policy).");
      setIsAuthenticating(false);
      setScanning(false);
      setTimer(180);
    }
    return () => clearInterval(countdown);
  }, [isAuthenticating, isCredentialVerified, timer]);

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

      {windowMessage && (
        <Alert severity={isElectionActive ? "success" : "warning"} style={{ marginBottom: "20px" }}>
          {isElectionActive ? "🟢 ELECTION IS ACTIVE" : "🔴 ELECTION IS CLOSED"} — {windowMessage}
        </Alert>
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
              color={!isElectionActive ? "secondary" : "primary"}
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
              <Box mt={3} width="100%" textAlign="center">
                <Typography variant="subtitle2" color="primary" gutterBottom style={{ fontWeight: 'bold', letterSpacing: 1 }}>
                   BIO-METRIC LIVENESS ANALYSIS
                </Typography>
                
                {/* RESEARCH UI: Liveness Progress Bar */}
                <Box display="flex" alignItems="center" mb={1}>
                  <Box width="100%" mr={1}>
                    <LinearProgress 
                      variant="determinate" 
                      value={hasBlinked ? 100 : 40} 
                      color={hasBlinked ? "success" : "primary"}
                      style={{ height: 10, borderRadius: 5 }}
                    />
                  </Box>
                  <Box minWidth={35}>
                    <Typography variant="body2" color="textSecondary">{`${hasBlinked ? 100 : 40}%`}</Typography>
                  </Box>
                </Box>

                <Typography variant="h6" color={hasBlinked ? "success.main" : "secondary.main"} style={{ fontWeight: 'bold' }}>
                  {blinkStatus}
                </Typography>

                <Grid container spacing={1} justifyContent="center" mt={1}>
                   <Grid item>
                      <Typography variant="caption" style={{ background: '#eee', padding: '2px 8px', borderRadius: 4 }}>
                         EAR: {currentEAR.toFixed(3)}
                      </Typography>
                   </Grid>
                   <Grid item>
                      <Typography variant="caption" style={{ background: hasBlinked ? '#e8f5e9' : '#fff3e0', padding: '2px 8px', borderRadius: 4, color: hasBlinked ? '#2e7d32' : '#ef6c00' }}>
                         Status: {hasBlinked ? "LIVE HUMAN" : "SCANNING..."}
                      </Typography>
                   </Grid>
                </Grid>

                {/* TIMER DISPLAY */}
                <Box mt={2} p={1} style={{ border: '1px solid #ffcdd2', borderRadius: 4, backgroundColor: '#ffebee' }}>
                  <Typography variant="caption" color="error" style={{ fontWeight: 'bold' }}>
                    SESSION SECURITY TIMER: {timer}s
                  </Typography>
                  <Typography variant="body2" color="textSecondary" style={{ fontSize: '0.7rem' }}>
                    (Coercion Resistance: Vote must be cast within 180s)
                  </Typography>
                </Box>
                {/* FALLBACK BUTTON FOR TURMERIC/FACEPAINT */}
                <Box mt={2}>
                    <Button 
                      variant="outlined" 
                      size="small" 
                      color="secondary" 
                      onClick={handleManualOverride}
                      style={{ fontSize: '0.7rem' }}
                    >
                      Can't Detect Blink? Click for Static Capture
                    </Button>
                </Box>
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

      {/* DIGITAL RECEIPT DIALOG */}
      <Dialog 
        open={showReceipt} 
        onClose={() => setShowReceipt(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          style: { borderRadius: 15, padding: 10, border: '2px solid #4caf50' }
        }}
      >
        <DialogTitle style={{ textAlign: 'center', color: '#2e7d32', fontWeight: 'bold' }}>
          ✓ VOTE SECURELY RECORDED
        </DialogTitle>
        <DialogContent>
          <Box p={2} style={{ background: '#f9f9f9', borderRadius: 10, border: '1px dashed #ccc' }}>
            <Typography variant="subtitle2" color="textSecondary">Voter ID:</Typography>
            <Typography variant="body1" style={{ fontWeight: 'bold', marginBottom: 10 }}>{receiptData.voterId}</Typography>
            
            <Typography variant="subtitle2" color="textSecondary">Candidate Choice:</Typography>
            <Typography variant="body1" style={{ fontWeight: 'bold', marginBottom: 10, color: '#1976d2' }}>{receiptData.candidate}</Typography>
            
            <Typography variant="subtitle2" color="textSecondary">Blockchain Transaction Hash:</Typography>
            <Typography variant="caption" style={{ wordBreak: 'break-all', display: 'block', background: '#eee', padding: 5, borderRadius: 5, marginTop: 5 }}>
              {receiptData.hash}
            </Typography>
          </Box>
          <Typography variant="body2" style={{ marginTop: 15, textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
            This receipt is your cryptographic proof of voting. Please save the hash above for your audits.
          </Typography>
        </DialogContent>
        <DialogActions style={{ justifyContent: 'center', paddingBottom: 20 }}>
          <Button variant="contained" color="success" onClick={() => setShowReceipt(false)} style={{ borderRadius: 20, padding: '10px 30px' }}>
            DOWNLOAD RECEIPT (CLOSE)
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}