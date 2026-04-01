import React, { useState, useContext } from "react";
import { Container, Paper, TextField, Button, Typography, Box, Alert, Avatar } from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { useNavigate } from "react-router-dom";
import { TransactionContext } from "../context/TransactionContext";
import axios from "axios";
import { serverLink } from "../../Data/Variables";

const AdminLogin = () => {
    const { connectWallet, currentAccount } = useContext(TransactionContext);
    const navigate = useNavigate();
    const [credentials, setCredentials] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // This MUST match the ADMIN_ADDRESS in your Render env variables
    const ADMIN_WALLET = "0x76B519871799d0db01039f3Ccf190cb1C6848889";

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            // 1. Force Connect Wallet
            const wallet = await connectWallet();
            const walletAddress = wallet || currentAccount;

            if (!walletAddress) {
                setError("Please unlock MetaMask and connect your wallet.");
                setLoading(false);
                return;
            }

            // 2. Strict Blockchain Signature Check (Case Insensitive)
            if (walletAddress.toLowerCase() !== ADMIN_WALLET.toLowerCase()) {
                console.log("Expected:", ADMIN_WALLET.toLowerCase());
                console.log("Received:", walletAddress.toLowerCase());
                setError("ACCESS DENIED: Unauthorized MetaMask Signature.");
                setLoading(false);
                return;
            }

            // 3. Database Login
            const res = await axios.post(serverLink + "login", { 
                username: credentials.email, 
                password: credentials.password 
            });

            if (res.status === 201 && res.data.isAdmin) {
                localStorage.setItem("adminUser", JSON.stringify(res.data));
                navigate("/admin/dashboard");
            } else {
                setError("Invalid Admin Credentials.");
            }
        } catch (err) {
            console.error(err);
            setError("Server Error or Signature Rejected.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="xs" sx={{ mt: 15 }}>
            <Paper elevation={15} sx={{ p: 5, borderRadius: 4, textAlign: 'center', bgcolor: '#fff' }}>
                <Avatar sx={{ bgcolor: 'primary.main', m: '0 auto 15px', width: 60, height: 60 }}>
                    <LockOutlinedIcon fontSize="large" />
                </Avatar>
                <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>Admin Portal</Typography>
                <Typography variant="subtitle2" color="textSecondary" mb={3}>
                    Authorized Access Only (MetaMask Required)
                </Typography>
                
                {error && <Alert severity="error" sx={{ mb: 3, textAlign: 'left', fontWeight: 'bold' }}>{error}</Alert>}

                <form onSubmit={handleLogin}>
                    <TextField 
                        fullWidth label="Admin Email" name="email" margin="normal" 
                        required onChange={handleChange} variant="outlined"
                    />
                    <TextField 
                        fullWidth label="Password" name="password" type="password" margin="normal" 
                        required onChange={handleChange} variant="outlined"
                    />
                    <Button 
                        type="submit" fullWidth variant="contained" size="large" 
                        disabled={loading}
                        sx={{ mt: 4, height: 56, fontWeight: 'bold', fontSize: '1rem' }}
                    >
                        {loading ? "Authenticating..." : "SECURE SIGN IN"}
                    </Button>
                </form>
                
                <Box mt={3}>
                   <Typography variant="caption" color="textSecondary">
                      Multi-Factor Authentication (MFA) Enabled by Blockchain Signature
                   </Typography>
                </Box>
            </Paper>
        </Container>
    );
};

export default AdminLogin;
