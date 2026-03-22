import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { Grid, Toolbar, Typography } from "@mui/material";
import Candidate from "../../../Components/Admin/Candidate";
import ContentHeader from "../../../Components/ContentHeader";
import axios from "axios";
import { serverLink } from "../../../Data/Variables";
import { getResult } from "../../../Data/Methods";
import { TransactionContext } from "../../../context/TransactionContext";

const ViewElectionResult = () => {

  const { id } = useParams();
  const [data, setData] = useState(null);
  const { getAllTransactions } = useContext(TransactionContext);

  useEffect(() => {

    async function fetchData() {
      try {

        console.log("Fetching once for ID:", id);

        const res = await axios.get(serverLink + "result/elections");
        const elections = res.data;

        const election = elections.find(
          e => String(e._id) === String(id)
        );

        if (!election) {
          setData({ error: "Election not found" });
          return;
        }

        const transactions = await getAllTransactions();
        const result = await getResult(transactions);

        const final = result.find(
          r => String(r.election_id) === String(id)
        );

        if (!final) {
          setData({ error: "No result found" });
          return;
        }

        setData({
          name: election.name || "Unknown",
          candidates: final.candidates || [],
          vote: final.vote || []
        });

      } catch (err) {
        console.log("ERROR:", err);
        setData({ error: "Something went wrong" });
      }
    }

    fetchData();

  }, [id, getAllTransactions]); // ✅ FIXED HERE

  if (data?.error) {
    return (
      <Typography variant="h5" align="center" sx={{ mt: 5 }}>
        {data.error}
      </Typography>
    );
  }

  if (!data) {
    return (
      <Typography variant="h5" align="center" sx={{ mt: 5 }}>
        Loading Result...
      </Typography>
    );
  }

  return (
    <div className="admin__content">

      <ContentHeader />

      <div style={{ paddingBottom: 25 }}>
        <Toolbar>

          <Grid container pt={3} spacing={2}>

            <Grid container justifyContent="center">
              <Typography variant="h3">
                Result of {data.name}
              </Typography>
            </Grid>

            {data.candidates.map((item, index) => (
              <Grid item xs={6} md={4} key={index}>
                <Candidate
                  username={item}
                  index={index}
                  id={id}
                  vote={data.vote?.[index] || 0}
                />
              </Grid>
            ))}

          </Grid>

        </Toolbar>
      </div>

    </div>
  );
};

export default ViewElectionResult;