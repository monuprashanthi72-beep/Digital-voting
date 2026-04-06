import { Grid, Toolbar, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import CardLayout from "../Components/User/CardLayout";
import axios from "axios";
import { serverLink } from "../Data/Variables";

const ResultElection = () => {

  const [data, setData] = useState([]);

  useEffect(() => {

    const getData = async () => {
      try {

        // ✅ ONLY result phase elections
        const res = await axios.get(serverLink + "result/elections");
        setData(res.data || []);

      } catch (error) {
        console.log("Result error:", error);
      }
    };

    getData();

  }, []);

  return (
    <div style={{ paddingBottom: 25 }}>
      <Toolbar>

        <Grid container pt={3} spacing={2}>

          <Grid container justifyContent="center">
            <Typography variant="h3">
              Election Result
            </Typography>
          </Grid>

          {data.length === 0 && (
            <Grid container justifyContent="center">
              <Typography variant="h6" color="error">
                Results are not available yet.
              </Typography>
            </Grid>
          )}

          {data.map((item, index) => (

            <Grid item xs={6} md={4} key={index}>

              <CardLayout
                title={item.name}
                election={item.id}
              />

            </Grid>

          ))}

        </Grid>

      </Toolbar>
    </div>
  );
};

export default ResultElection;