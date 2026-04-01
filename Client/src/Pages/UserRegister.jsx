import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { 
  Container, 
  Paper, 
  TextField, 
  Button, 
  Typography, 
  Box, 
  Grid, 
  Radio, 
  RadioGroup, 
  FormControlLabel, 
  FormControl, 
  FormLabel,
  InputAdornment,
  CircularProgress,
  Avatar
} from "@mui/material";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import Footer from "../Components/User/Footer";
import { serverLink } from "../Data/Variables";

const UserRegister = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [typedEmailOtp, setTypedEmailOtp] = useState("");
  const [actualEmailOtp, setActualEmailOtp] = useState("");

  const [values, setValues] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    aadhar: "",
    dob: "",
    gender: "Male",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleSendEmailOtp = async () => {
    if (!values.email) return alert("Please enter your email first!");
    setLoading(true);
    const otp = generateOTP();
    setActualEmailOtp(otp);

    try {
      await axios.post(serverLink + "otp", { 
        identifier: values.email, 
        otp 
      });
      setEmailOtpSent(true);
      alert("OTP sent to your email!");
    } catch (err) {
      alert("Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const verifyEmailOtp = () => {
    if (typedEmailOtp === actualEmailOtp) {
      setEmailVerified(true);
      alert("Email verified successfully!");
    } else {
      alert("Incorrect OTP!");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!emailVerified) return alert("Please verify your email first!");
    if (values.password !== values.confirmPassword) return alert("Passwords do not match!");

    setLoading(true);
    try {
      const { data } = await axios.post(serverLink + "register", values);
      if (data.status === false) {
        alert(data.message);
      } else {
        alert("Registered Successfully!");
        setTimeout(() => navigate("/login"), 2000);
      }
    } catch (err) {
      alert("Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };

  return (
    <div style={{ background: '#f0f2f5', minHeight: '100vh', padding: '40px 0' }}>
      <Container maxWidth="md">
        <Paper elevation={12} sx={{ p: 5, borderRadius: 4, position: 'relative', overflow: 'hidden' }}>
          {/* Header Accent */}
          <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: '8px', bgcolor: 'primary.main' }} />
          
          <Box textAlign="center" mb={4}>
            <Avatar sx={{ m: '0 auto 10px', bgcolor: 'primary.main', width: 56, height: 56 }}>
                <HowToRegIcon fontSize="large" />
            </Avatar>
            <Typography variant="h3" fontWeight="800" color="primary">Voter Registration</Typography>
            <Typography variant="subtitle1" color="textSecondary">Final Project Demo 2026</Typography>
          </Box>

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField fullWidth label="Full Name" name="name" variant="outlined" required onChange={handleChange} />
              </Grid>

              <Grid item xs={12} md={9}>
                <TextField 
                  fullWidth label="Email ID" type="email" name="email" variant="outlined" 
                  required disabled={emailVerified} onChange={handleChange} 
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <Button 
                  fullWidth variant="contained" color="secondary" sx={{ height: '56px', fontWeight: 'bold' }}
                  onClick={handleSendEmailOtp} disabled={emailVerified || loading}
                >
                  {emailVerified ? "Verified ✅" : "Send OTP"}
                </Button>
              </Grid>

              {!emailVerified && emailOtpSent && (
                <Grid item xs={12}>
                   <TextField 
                    fullWidth label="6-Digit Verification Code" variant="filled"
                    onChange={(e) => setTypedEmailOtp(e.target.value)}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Button variant="contained" color="success" onClick={verifyEmailOtp}>Verify Now</Button>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              )}

              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Aadhar Number" name="aadhar" variant="outlined" required onChange={handleChange} />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Date of Birth" type="date" name="dob" InputLabelProps={{ shrink: true }} required onChange={handleChange} />
              </Grid>

              <Grid item xs={12}>
                <FormControl component="fieldset" fullWidth sx={{ p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                  <FormLabel component="legend" sx={{ px: 1 }}>Gender</FormLabel>
                  <RadioGroup row name="gender" value={values.gender} onChange={handleChange} sx={{ justifyContent: 'center' }}>
                    <FormControlLabel value="Male" control={<Radio color="primary" />} label="Male" />
                    <FormControlLabel value="Female" control={<Radio color="primary" />} label="Female" />
                    <FormControlLabel value="Other" control={<Radio color="primary" />} label="Other" />
                  </RadioGroup>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField fullWidth label="Residential Address" name="address" variant="outlined" required onChange={handleChange} />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField fullWidth label="City" name="city" required onChange={handleChange} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="State" name="state" required onChange={handleChange} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="Pincode" name="pincode" required onChange={handleChange} />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Password" type="password" name="password" variant="outlined" required onChange={handleChange} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Confirm Password" type="password" name="confirmPassword" variant="outlined" required onChange={handleChange} />
              </Grid>

              <Grid item xs={12} sx={{ mt: 3 }}>
                <Button 
                  type="submit" variant="contained" fullWidth size="large" 
                  disabled={!emailVerified || loading}
                  sx={{ height: '60px', fontWeight: 'bold', fontSize: '1.1rem', borderRadius: 2 }}
                >
                  {loading ? <CircularProgress size={28} color="inherit" /> : "COMPLETE REGISTRATION"}
                </Button>
              </Grid>

              <Grid item xs={12} textAlign="center" mt={2}>
                 <Typography variant="body1">
                    Back to <Link to="/login" style={{ fontWeight: 'bold', color: '#1976d2', textDecoration: 'none' }}>Login</Link>
                 </Typography>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Container>
      <Footer />
    </div>
  );
};

export default UserRegister;