import * as React from "react";
import CssBaseline from "@mui/material/CssBaseline";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { Box, Typography, Container } from "@mui/material";
import { TransactionContext } from "../context/TransactionContext";

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

export default function Home() {
  const { isLoggedIn } = React.useContext(TransactionContext);
  
  // Get user details ONLY if we are logged in
  let user = null;
  if (isLoggedIn) {
    const savedUser = localStorage.getItem("userProfile");
    if (savedUser) user = JSON.parse(savedUser);
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <main>
        <Container maxWidth="md">
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "calc(100vh - 128px)",
              textAlign: "center",
              py: 5
            }}
          >
            {isLoggedIn && user ? (
              <>
                <Typography variant="h3" component="h1" gutterBottom fontWeight="bold" color="primary">
                  Welcome to Your Secure Voting Portal
                </Typography>
                <Typography variant="h5" color="textSecondary" mb={4}>
                  Hello, {user.fname || user.username}! Cast your choice for a better future.
                </Typography>
                <img
                  style={{ width: "80%", borderRadius: "12px", boxShadow: "0 8px 30px rgba(0,0,0,0.15)" }}
                  src="/Assets/welcome.png"
                  alt="Welcome Voter"
                />
              </>
            ) : (
              <>
                <Typography variant="h2" component="h1" gutterBottom fontWeight="bold" sx={{ color: '#1a237e', mb: 4 }}>
                  Welcome to Digital Voting Portal
                </Typography>
                <img
                  style={{ width: "85%", borderRadius: "16px", boxShadow: "0 10px 40px rgba(0,0,0,0.2)" }}
                  src="/Assets/landing.png"
                  alt="Digital Voting Portal"
                />
              </>
            )}
          </Box>
        </Container>
      </main>
    </ThemeProvider>
  );
}
