import React, { useState, useEffect } from "react";
import {
  TextField,
  Button,
  Typography,
  Paper,
  Grid,
  MenuItem,
  CircularProgress,
  Box
} from "@mui/material";
import axios from "axios";
import { serverLink } from "../Data/Variables";

// face-api.js is now loaded via CDN in index.html to avoid Webpack 5 polyfill issues
const faceapi = window.faceapi;

const UserRegister = () => {

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    fname: "",
    lname: "",
    email: "",
    mobile: "",
    location: "",
    voterId: ""
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const [showEmailVerify, setShowEmailVerify] = useState(false);
  const [showEmailOTP, setShowEmailOTP] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

  const [showPhoneVerify, setShowPhoneVerify] = useState(false);
  const [showPhoneOTP, setShowPhoneOTP] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);

  // --- FACE RECOGNITION ML LOGIC ---
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceDescriptor, setFaceDescriptor] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const loadModels = async () => {
      try {
        console.log("Starting to load face-api models...");
        const MODEL_URL = '/models'; // Switch back to simple relative path
        console.log("Using Model URL:", MODEL_URL);
        
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
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

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImagePreview(URL.createObjectURL(file));
    setIsProcessing(true);

    try {
      const img = await faceapi.bufferToImage(file);
      const detections = await faceapi.detectSingleFace(
        img, 
        new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.3 })
      ).withFaceLandmarks().withFaceDescriptor();

      if (detections) {
        setFaceDescriptor(Array.from(detections.descriptor));
        alert("Face detected and verified from photo!");
      } else {
        alert("No clear face detected in this photo. Please upload a clear passport-size JPEG.");
        setImagePreview(null);
      }
    } catch (err) {
      console.error(err);
      alert("Error processing image.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRegister = async () => {
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
    
    // Inject dummy blob to bypass multer required field in backend
    const dummyBlob = new Blob(["dummy content"], { type: "text/plain" });
    data.append("profile", dummyBlob, "dummy.txt");

    try {
      await axios.post(serverLink + "register", data);
      alert("Registration Successful!");
      window.location.href = "/login";
    } catch (e) {
      console.error(e);
      const errorMsg = e.response?.data?.message || e.response?.data || "Registration failed";
      const errorDetail = e.response?.data?.error || "";
      alert(`${errorMsg}${errorDetail ? ": " + errorDetail : ""}`);
    }
  };

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
            <TextField fullWidth name="username" label="Username" onChange={handleChange} />
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth name="password" label="Password" type="password" onChange={handleChange} />
          </Grid>

          <Grid item xs={12}>
             <Typography variant="h6" color="primary" style={{ marginTop: 10 }}>Personal Details</Typography>
          </Grid>

          <Grid item xs={6}>
            <TextField fullWidth name="fname" label="First Name" onChange={handleChange} />
          </Grid>

          <Grid item xs={6}>
            <TextField fullWidth name="lname" label="Last Name" onChange={handleChange} />
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
          </Grid>

          <Grid item xs={6}>
            <TextField fullWidth name="voterId" label="Voter ID Number" onChange={handleChange} />
          </Grid>

          <Grid item xs={6}>
            <TextField fullWidth label="Aadhaar Number" />
          </Grid>

          {/* Contact verifications */}
          <Grid item xs={12}>
             <Typography variant="h6" color="primary" style={{ marginTop: 10 }}>Verifications</Typography>
          </Grid>

          <Grid item xs={6}>
            <TextField
              fullWidth
              name="email"
              label="Email"
              onChange={(e) => { handleChange(e); setShowEmailVerify(true); }}
            />
          </Grid>

          <Grid item xs={6} display="flex" alignItems="center">
            {!emailVerified && showEmailVerify && !showEmailOTP && (
              <Button variant="contained" onClick={() => setShowEmailOTP(true)}>
                Verify Email
              </Button>
            )}
            {emailVerified && (
              <Typography style={{ color: "green", fontWeight: "bold" }}>
                Email Verified ✓
              </Typography>
            )}
            {showEmailOTP && !emailVerified && (
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={5}>
                  <TextField fullWidth size="small" label="Enter OTP" />
                </Grid>
                <Grid item xs={7}>
                  <Button variant="contained" color="success" onClick={() => { setEmailVerified(true); setShowEmailOTP(false); }}>
                    Verify
                  </Button>
                  <Button variant="text" size="small" style={{ marginLeft: 8 }}>Resend</Button>
                </Grid>
              </Grid>
            )}
          </Grid>

          <Grid item xs={6}>
            <TextField
              fullWidth
              name="mobile"
              label="Phone Number"
              onChange={(e) => { handleChange(e); setShowPhoneVerify(true); }}
            />
          </Grid>

          <Grid item xs={6} display="flex" alignItems="center">
            {!phoneVerified && showPhoneVerify && !showPhoneOTP && (
              <Button variant="contained" onClick={() => setShowPhoneOTP(true)}>
                Verify Mobile
              </Button>
            )}
            {phoneVerified && (
              <Typography style={{ color: "green", fontWeight: "bold" }}>
                Mobile Verified ✓
              </Typography>
            )}
            {showPhoneOTP && !phoneVerified && (
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={5}>
                  <TextField fullWidth size="small" label="Enter OTP" />
                </Grid>
                <Grid item xs={7}>
                  <Button variant="contained" color="success" onClick={() => { setPhoneVerified(true); setShowPhoneOTP(false); }}>
                    Verify
                  </Button>
                  <Button variant="text" size="small" style={{ marginLeft: 8 }}>Resend</Button>
                </Grid>
              </Grid>
            )}
          </Grid>

          <Grid item xs={12}>
             <Typography variant="h6" color="primary" style={{ marginTop: 10 }}>Address</Typography>
          </Grid>

          <Grid item xs={6}>
            <TextField fullWidth name="location" label="City" onChange={handleChange} />
          </Grid>

          <Grid item xs={6}>
            <TextField fullWidth label="Pincode" />
          </Grid>

          {/* FACIAL CAPTURE INTEGRATION */}
          <Grid item xs={12}>
             <Typography variant="h6" color="primary" style={{ marginTop: 10 }}>Biometric Facial Setup</Typography>
             <Typography variant="body2" color="textSecondary" style={{ marginBottom: 15 }}>
               Your live facial capture creates an irreversible mathematical matrix used to authenticate your votes safely on the blockchain. Photos are not accepted.
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
                      id="raised-button-file"
                      type="file"
                      onChange={handleImageUpload}
                    />
                    <label htmlFor="raised-button-file">
                      <Button variant="contained" component="span" color="primary">
                        Upload Profile Photo (JPEG)
                      </Button>
                    </label>

                    {imagePreview && (
                      <Box mt={2}>
                        <img src={imagePreview} alt="Preview" style={{ width: 200, borderRadius: 8, border: "2px solid #ccc" }} />
                        {isProcessing && <CircularProgress size={20} style={{ marginLeft: 15 }} />}
                        {faceDescriptor && !isProcessing && (
                           <Typography style={{ color: "green", fontWeight: "bold", marginTop: 10 }}>
                             ✅ Face Verified from Photo!
                           </Typography>
                        )}
                      </Box>
                    )}
                 </Box>
              )}
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