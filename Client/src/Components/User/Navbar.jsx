import React, { useContext } from "react";
import { Toolbar, Typography, AppBar, Grid, Button } from "@mui/material";
import HowToVoteOutlinedIcon from "@mui/icons-material/HowToVoteOutlined";
import { Link, useNavigate } from "react-router-dom";

import { NavbarData } from "../../Data/NavbarData";
import { TransactionContext } from "../../context/TransactionContext";

export default function Navbar() {

  const { isLoggedIn, setIsLoggedIn } = useContext(TransactionContext);
  const navigate = useNavigate();

  const style = {
    logo: { fontSize: 35, paddingRight: 10 },
    navLink: { fontSize: 20, color: "white", textDecoration: "none" }
  };

  return (
    <>
      <AppBar position="fixed">
        <Toolbar>
          <Grid container alignItems="center">

            {/* LEFT SIDE */}
            <Grid item xs={6} display="flex" alignItems="center">
              <HowToVoteOutlinedIcon style={style.logo} />
              <Typography variant="h5">Voting System</Typography>
            </Grid>

            {/* RIGHT SIDE */}
            <Grid item xs={6}>
              <Grid container gap={4} justifyContent="flex-end" alignItems="center">

                {NavbarData.map((item, index) => {

                  // ❌ Hide Election & Result before login
                  if (!isLoggedIn && (item.title === "Election" || item.title === "Result"))
                    return null;

                  // ❌ Hide Admin AFTER login
                  if (isLoggedIn && item.title === "Admin")
                    return null;

                  // ❌ Hide Login/Register AFTER login
                  if (isLoggedIn && item.title === "Login/Register")
                    return null;

                  // ✅ ADMIN → open in new tab (only before login)
                  if (item.title === "Admin") {
                    return (
                      <a
                        key={index}
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ textDecoration: "none", color: "white", fontSize: 20 }}
                      >
                        {item.title}
                      </a>
                    );
                  }

                  // ✅ Normal links
                  return (
                    <Link key={index} to={item.link} style={{ textDecoration: "none" }}>
                      <Typography style={style.navLink}>{item.title}</Typography>
                    </Link>
                  );

                })}

                {/* LOGOUT BUTTON */}
                {isLoggedIn && (
                  <Button
                    variant="outlined"
                    color="inherit"
                    onClick={() => {
                      setIsLoggedIn(false);
                      navigate("/");
                    }}
                  >
                    Logout
                  </Button>
                )}

              </Grid>
            </Grid>

          </Grid>
        </Toolbar>
      </AppBar>

      <Toolbar />
    </>
  );
}