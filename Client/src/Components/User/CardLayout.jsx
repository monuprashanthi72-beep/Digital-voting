import React from "react";
import { Card, CardContent, Typography, Button } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";

const CardLayout = ({ title, election }) => {

  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = () => {

    // ✅ if inside RESULT page → go to result
    if (location.pathname.includes("result")) {
      navigate(`/result/${election}`);
    } 
    // ✅ otherwise → go to voting
    else {
      navigate(`/election/${election}`);
    }

  };

  return (
    <Card sx={{ minWidth: 275 }}>
      <CardContent>

        <Typography variant="h5" gutterBottom>
          {title}
        </Typography>

        <Button variant="contained" onClick={handleClick}>
          View Details
        </Button>

      </CardContent>
    </Card>
  );
};

export default CardLayout;