import React, { useState } from "react";
import { TextField, Button, Typography, Paper, Grid, Box } from "@mui/material";
import { Link } from "react-router-dom";
import axios from "axios";
import { serverLink } from "../Data/Variables";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email) return alert("Please enter your email");
    setLoading(true);
    try {
      const res = await axios.post(serverLink + "forgotPassword", { email });
      setMessage(res.data);
    } catch (e) {
      console.error(e);
      alert("Error processing reset request.");
    }
    setLoading(false);
  };

  return (
    <Grid container justifyContent="center" style={{ marginTop: "100px" }}>
      <Paper style={{ padding: 30, width: 400 }}>
        <Typography variant="h5" align="center" gutterBottom>
          Secure Password Reset
        </Typography>
        
        <Typography variant="body2" color="textSecondary" align="center" style={{ marginBottom: 20 }}>
          Enter your registered email below. A temporary secure access token will be generated for your research demo.
        </Typography>

        {!message ? (
          <>
            <TextField
              fullWidth
              label="Registered Email"
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button
              fullWidth
              variant="contained"
              color="primary"
              style={{ marginTop: 20 }}
              onClick={handleReset}
              disabled={loading}
            >
              {loading ? "Processing..." : "GENERATE RESET TOKEN"}
            </Button>
          </>
        ) : (
          <Box mt={2} p={2} style={{ background: '#e8f5e9', borderRadius: 8, textAlign: 'center' }}>
            <Typography variant="body1" color="success.main" gutterBottom>
              <b>Request Received!</b>
            </Typography>
            <Typography variant="body2">
              {message}
            </Typography>
            <Button variant="outlined" component={Link} to="/login" style={{ marginTop: 15 }}>
               Back to Login
            </Button>
          </Box>
        )}

        <Typography align="center" style={{ marginTop: 20 }}>
          <Link to="/login">Cancel and Return</Link>
        </Typography>
      </Paper>
    </Grid>
  );
};

export default ForgotPassword;
