import React, { useState, useContext } from "react";
import { TransactionContext } from "../../context/TransactionContext";
import { Container, Paper, TextField, Button, Typography, Box } from "@mui/material";

const Login = () => {
  const [isRegister, setIsRegister] = useState(false); // Controls which form shows
  const { setIsLoggedIn } = useContext(TransactionContext);

  // Form State
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    mobile: "",
    location: "",
    password: ""
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // For now, let's just let you in!
    console.log("Form Submitted:", formData);
    setIsLoggedIn(true); 
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 10 }}>
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          {isRegister ? "User Registration" : "Enter Credentials"}
        </Typography>

        <form onSubmit={handleSubmit}>
          <Box display="flex" flexDirection="column" gap={2}>
            <TextField 
              label="Username" 
              name="username" 
              required 
              fullWidth 
              onChange={handleChange} 
            />

            {isRegister && (
              <>
                <TextField 
                  label="Email" 
                  name="email" 
                  type="email" 
                  required 
                  fullWidth 
                  onChange={handleChange} 
                />
                <TextField 
                  label="Mobile" 
                  name="mobile" 
                  required 
                  fullWidth 
                  onChange={handleChange} 
                />
                <TextField 
                  label="Location" 
                  name="location" 
                  required 
                  fullWidth 
                  onChange={handleChange} 
                />
              </>
            )}

            <TextField 
              label="Password" 
              name="password" 
              type="password" 
              required 
              fullWidth 
              onChange={handleChange} 
            />

            <Button variant="contained" type="submit" size="large" sx={{ mt: 2 }}>
              {isRegister ? "REGISTER" : "LOGIN"}
            </Button>
          </Box>
        </form>

        <Typography sx={{ mt: 2 }}>
          {isRegister ? "Already registered? " : "Not registered? "}
          <Button onClick={() => setIsRegister(!isRegister)} sx={{ fontWeight: 'bold' }}>
            {isRegister ? "Login here" : "Register here"}
          </Button>
        </Typography>
      </Paper>
    </Container>
  );
};

export default Login;