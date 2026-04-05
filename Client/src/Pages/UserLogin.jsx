import React, { useState, useContext } from "react";
import { TextField, Button, Typography, Paper, Grid } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { TransactionContext } from "../context/TransactionContext";
import axios from "axios";
import { serverLink } from "../Data/Variables";

const UserLogin = () => {
  const { setIsLoggedIn } = useContext(TransactionContext);
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (username && password) {
      try {
        const res = await axios.post(serverLink + "/login", { username, password });
        if (res.status === 201 || res.status === 200) { 
          alert("Login Successful! \n\n🔒 YOUR SECURE SESSION PASSCODE IS: " + res.data.passcode + "\n\n(Write this code down! You will need it to cast your vote.)");
          setIsLoggedIn(true);
          // Store the full user object (including faceDescriptor) in localStorage
          localStorage.setItem("userProfile", JSON.stringify(res.data));
          navigate("/");
        } else {
          alert(res.data); // Invalid Username or Password
        }
      } catch(e) {
        console.error(e);
        alert("Server Error during login");
      }
    } else {
      alert("Enter credentials");
    }
  };

  return (
    <Grid container justifyContent="center" style={{ marginTop: "100px" }}>
      <Paper style={{ padding: 30, width: 350 }}>
        <Typography variant="h5" align="center" gutterBottom>
          Login
        </Typography>

        <TextField
          fullWidth
          label="Username"
          margin="normal"
          onChange={(e) => setUsername(e.target.value)}
        />

        <TextField
          fullWidth
          label="Password"
          type="password"
          margin="normal"
          onChange={(e) => setPassword(e.target.value)}
        />

        <Button
          fullWidth
          variant="contained"
          style={{ marginTop: 20 }}
          onClick={handleLogin}
        >
          LOGIN
        </Button>

        <Typography align="center" style={{ marginTop: 15 }}>
          Not registered? <Link to="/register">Register here</Link>
        </Typography>
        <Typography align="center" style={{ marginTop: 10 }}>
          <Link to="/forgot-password" style={{ color: '#d32f2f', textDecoration: 'none', fontSize: '0.875rem' }}>
            Forgot Password?
          </Link>
        </Typography>
      </Paper>
    </Grid>
  );
};

export default UserLogin;