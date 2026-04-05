import React, { useState, useEffect } from "react";
import {
  TextField,
  Button,
  Typography,
  Paper,
  Grid,
  MenuItem,
  CircularProgress,
  Box,
  FormControlLabel,
  Checkbox
} from "@mui/material";

import axios from "axios";
import { serverLink, isRegistrationOpen } from "../Data/Variables";

// face-api.js is now loaded via CDN in index.html to avoid Webpack 5 polyfill issues
const faceapi = window.faceapi;

// Removed webcam and blink detection helper functions for registration.
// Registration now uses photo upload instead of live biometric capture.


const UserRegister = () => {

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    fname: "",
    lname: "",
    email: "",
    mobile: "",
    location: "",
    voterId: "",
    isNRI: false
  });

  const handleChange = (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  // --- FACE RECOGNITION ML LOGIC ---
  // Face Recognition States
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceDescriptor, setFaceDescriptor] = useState(null);
  const [profileFile, setProfileFile] = useState(null); // Actual binary file for backend profile
  const [profilePreview, setProfilePreview] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [idCardFile, setIdCardFile] = useState(null);
  const [idCardPreview, setIdCardPreview] = useState(null);


  useEffect(() => {
    const loadModels = async () => {
      try {
        console.log("Starting to load face-api models...");
        const MODEL_URL = '/models'; // Switch back to simple relative path
        console.log("Using Model URL:", MODEL_URL);
        
        await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        
        console.log("Face-api models loaded successfully!");
        setModelsLoaded(true);
      } catch (error) {
        console.error("Error loading face-api models:", error);
      }
    };
    loadModels();
  }, []);

  const handleProfileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!modelsLoaded) {
      alert("AI models are still loading. Please wait a moment.");
      return;
    }

    setProfileFile(file);
    setProfilePreview(URL.createObjectURL(file));
    setIsProcessing(true);
    setFaceDescriptor(null);

    try {
      // Create an image element to process with face-api
      const img = await faceapi.bufferToImage(file);
      const detections = await faceapi.detectSingleFace(
        img, 
        new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 })
      ).withFaceLandmarks().withFaceDescriptor();
      
      if (detections) {
        setFaceDescriptor(Array.from(detections.descriptor));
        alert("Facial biometric data extracted successfully! You can now complete registration.");
      } else {
        alert("CRITICAL: No face detected in the photo. Please upload a clear, front-facing portrait of yourself.");
        setProfileFile(null);
        setProfilePreview(null);
      }
    } catch (err) {
      console.error("AI Processing Error:", err);
      alert("Error processing image. Please try a different photo.");
    } finally {
      setIsProcessing(false);
    }
  };


  const handleIdCardUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIdCardFile(file);
    setIdCardPreview(URL.createObjectURL(file));
    alert("Voter ID Document uploaded successfully!");
  };

  const handleRegister = async () => {
    // Verification check removed for Demo
    if (!faceDescriptor) {
      alert("Please upload a clear profile photo to extract facial data.");
      return;
    }
    if (!formData.username || !formData.password || !formData.voterId || !formData.email) {
      alert("Please fill in Username, Password, Voter ID, and Email.");
      return;
    }

    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    
    // Inject the mathematical face string
    data.append("faceDescriptor", JSON.stringify(faceDescriptor));
    
    // Add the actual files for the backend (naming must match multer .fields())
    if (profileFile) {
      data.append("profile", profileFile);
    }
    if (idCardFile) {
      data.append("idCard", idCardFile);
    }

    try {
      const res = await axios.post(serverLink + "/register", data);
      
      // 🏆 CRITICAL: Capture the Passcode from the server response
      const passcode = res.data.passcode;

      alert(`Registration Successful!\n\nYour Voter ID: ${formData.voterId}\nYour SECURE PASSCODE: ${passcode}\n\n(IMPORTANT: Copy your PASSCODE now! You need it to login and vote.)`);
      window.location.href = "/login";

    } catch (e) {
      console.error(e);
      const errorMsg = e.response?.data?.message || e.response?.data || "Registration failed";
      const errorDetail = e.response?.data?.error || "";
      alert(`${errorMsg}${errorDetail ? ": " + errorDetail : ""}`);
    }
  };

  if (!isRegistrationOpen) {
    return (
      <Grid container justifyContent="center" style={{ marginTop: "100px", marginBottom: "50px" }}>
        <Paper style={{ padding: 60, width: "60%", textAlign: "center", background: "#f8d7da" }}>
          <Typography variant="h4" color="error" gutterBottom>
            Registration is Currently Closed
          </Typography>
          <Typography variant="body1">
            The Election Commission has closed the registration window. You cannot register at this time.
            Please wait for the next Pre-Election Voter Roll Initialization phase.
          </Typography>
          <Button variant="contained" color="primary" href="/" style={{ marginTop: 20 }}>
            Return to Home
          </Button>
        </Paper>
      </Grid>
    );
  }

  return (
    <Grid container justifyContent="center" style={{ marginTop: "100px", marginBottom: "50px" }}>
      <Paper style={{ padding: 40, width: "85%" }}>
        <Typography variant="h4" align="center" gutterBottom>
          Secure Voter Registration
        </Typography>

        <Grid container spacing={3}>
          
          <Grid item xs={12}>
             <Typography variant="h6" color="primary" style={{ marginTop: 20 }}>Account Credentials</Typography>
          </Grid>

          <Grid item xs={6}>
            <TextField fullWidth name="username" label="Username" value={formData.username} onChange={handleChange} />
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth name="password" label="Password" type="password" value={formData.password} onChange={handleChange} />
          </Grid>

          <Grid item xs={12}>
             <Typography variant="h6" color="primary" style={{ marginTop: 10 }}>Personal Details</Typography>
          </Grid>

          <Grid item xs={6}>
            <TextField fullWidth name="fname" label="First Name" value={formData.fname} onChange={handleChange} />
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth name="lname" label="Last Name" value={formData.lname} onChange={handleChange} />
          </Grid>

          <Grid item xs={6}>
            <TextField
              fullWidth
              type="date"
              label="Date of Birth"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={6}>
            <TextField select fullWidth label="Gender" defaultValue="Male">
              <MenuItem value="Male">Male</MenuItem>
              <MenuItem value="Female">Female</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </TextField>
          </Grid>

          {/* Identity */}
          <Grid item xs={12}>
             <Typography variant="h6" color="primary" style={{ marginTop: 10 }}>Identity Documents</Typography>
             <FormControlLabel
               control={<Checkbox checked={formData.isNRI} onChange={handleChange} name="isNRI" />}
               label="🔴 I am an NRI (Non-Resident Indian) registering remotely"
               style={{ marginTop: 5, color: "#d32f2f", fontWeight: "bold" }}
             />
          </Grid>

          <Grid item xs={6}>
            <TextField fullWidth name="voterId" label={formData.isNRI ? "Passport Number (NRI)" : "Voter ID Number"} value={formData.voterId} onChange={handleChange} />
          </Grid>

          <Grid item xs={6}>
            <TextField fullWidth label={formData.isNRI ? "Overseas Visa / Resident Permit (Optional)" : "Aadhaar Number"} />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              name="email"
              label="Email"
              placeholder="Enter your email address"
              value={formData.email}
              onChange={handleChange}
              variant="outlined"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              name="mobile"
              label="Phone Number"
              value={formData.mobile}
              onChange={handleChange}
              placeholder="e.g. 9876543210"
            />
            <Typography variant="caption" color="textSecondary">No mobile OTP verification required.</Typography>
          </Grid>

          <Grid item xs={12}>
             <Typography variant="h6" color="primary" style={{ marginTop: 10 }}>Address</Typography>
          </Grid>

          <Grid item xs={6}>
            <TextField fullWidth name="location" label="City" value={formData.location} onChange={handleChange} />
          </Grid>

          <Grid item xs={6}>
            <TextField fullWidth label="Pincode" />
          </Grid>

          {/* FACIAL CAPTURE INTEGRATION */}
          <Grid item xs={12}>
             <Typography variant="h6" color="primary" style={{ marginTop: 10 }}>Biometric Profile Setup</Typography>
             <Typography variant="body2" color="textSecondary" style={{ marginBottom: 15 }}>
               Please upload a clear portrait photo. Our AI will extract your facial biometric matrix which will be used to verify your identity during voting. 
               <b> (Live liveness/blink detection is only required during the actual voting process).</b>
             </Typography>
             
             {!modelsLoaded ? (
                 <Box display="flex" alignItems="center">
                   <CircularProgress size={24} style={{ marginRight: 15 }} />
                   <Typography>Initializing AI modules...</Typography>
                 </Box>
              ) : (
                  <Box>
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="profile-upload"
                      type="file"
                      onChange={handleProfileUpload}
                    />
                    <label htmlFor="profile-upload">
                      <Button variant="contained" component="span" color="primary">
                        Upload Profile Photo
                      </Button>
                    </label>

                    {isProcessing && (
                      <Box mt={2} display="flex" alignItems="center">
                        <CircularProgress size={20} style={{ marginRight: 10 }} />
                        <Typography variant="body2">AI is analyzing face data...</Typography>
                      </Box>
                    )}

                    {profilePreview && (
                      <Box mt={2} textAlign="center">
                        <img 
                          src={profilePreview} 
                          alt="Profile Preview" 
                          style={{ width: 200, height: 200, objectFit: 'cover', borderRadius: '50%', border: "4px solid #1976d2" }} 
                        />
                        {faceDescriptor ? (
                          <Typography variant="body2" style={{ color: 'green', fontWeight: 'bold', marginTop: 10 }}>
                             ✅ Face Detected & Biometric Profile Created
                          </Typography>
                        ) : !isProcessing && (
                          <Typography variant="body2" color="error" style={{ marginTop: 10 }}>
                             ❌ No Face Detected. Try another photo.
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Box>
               )}
          </Grid>

          {/* VOTER ID DOCUMENT UPLOAD */}
          <Grid item xs={12}>
             <Typography variant="h6" color="primary" style={{ marginTop: 10 }}>Multi-Layer Identity Verification</Typography>
             <Typography variant="body2" color="textSecondary" style={{ marginBottom: 15 }}>
               {formData.isNRI ? (
                 <>Please upload a clear scan or photo of your <b>Valid Indian Passport</b> for remote verification by the election commission.</>
               ) : (
                 <>Please upload a clear scan or photo of your <b>Voter ID Card</b> or <b>Aadhaar Card</b> for manual verification by the election commission.</>
               )}
               {formData.isNRI && (
                 <span style={{ display: "block", color: "#d32f2f", marginTop: "5px" }}>
                   (NRI Mode: Ensure your Passport scan clearly shows your photo and identifying details. If your local consulate requires visa verification, please combine your Passport and Visa scan into a single PDF.)
                 </span>
               )}
             </Typography>
             <Box>
                <input
                  accept="image/*,application/pdf"
                  style={{ display: 'none' }}
                  id="id-card-file"
                  type="file"
                  onChange={handleIdCardUpload}
                />
                <label htmlFor="id-card-file">
                  <Button variant="contained" component="span" color="info">
                    Upload Identity Document
                  </Button>
                </label>

                {idCardPreview && (
                  <Box mt={2}>
                    {idCardFile && idCardFile.type && idCardFile.type.includes("image") ? (
                      <img src={idCardPreview} alt="ID Preview" style={{ width: 300, borderRadius: 8, border: "2px solid #ccc" }} />
                    ) : (
                      <Typography color="primary">Document Uploaded ✓</Typography>
                    )}
                    <Typography style={{ color: "green", fontWeight: "bold", marginTop: 10 }}>
                      ✅ Identity Document Ready!
                    </Typography>
                  </Box>
                )}
             </Box>
          </Grid>
        </Grid>

        <Grid container justifyContent="center" style={{ marginTop: 40 }}>
          <Button variant="contained" size="large" color="secondary" onClick={handleRegister}>
            Finalize Registration
          </Button>
        </Grid>

      </Paper>
    </Grid>
  );
};

export default UserRegister;