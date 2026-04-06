import { Grid, Toolbar, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import CardLayout from "../Components/User/CardLayout";
import axios from "axios";
import { serverLink } from "../Data/Variables";

const Election = () => {

  const [data, setData] = useState([]);

  const style = {
    pageTitle: {
      paddingTop: 5,
      paddingBottom: 5,
    },
  };

  useEffect(() => {

    async function getData() {

      try {

        const res = await axios.get(serverLink + "voting/elections");

        console.log("Election API response:", res.data);

        setData(res.data || []);

      } catch (error) {

        console.log("Election API error:", error);

      }

    }

    getData();

  }, []);

  return (
    <div style={{ paddingBottom: 25 }}>
      <Toolbar />

      <Grid container spacing={3} justifyContent="center">

        <Grid item xs={12} textAlign="center">
          <Typography variant="h3" style={style.pageTitle}>
            Elections
          </Typography>
        </Grid>

        {data.length === 0 && (
          <Grid item xs={12} textAlign="center">
            <Typography variant="h6">
              No Elections Available
            </Typography>
          </Grid>
        )}

        {data.map((item, index) => {

          return (

            <Grid item xs={12} md={4} key={index}>

              <CardLayout
                index={index}
                title={item.name}
                candidates={item.candidates}
                election={item.id || item._id}
                link={item.id || item._id}
              />

            </Grid>

          );

        })}

      </Grid>

    </div>
  );

};

export default Election;