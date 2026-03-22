import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { Grid, Toolbar, Typography } from "@mui/material";
import axios from "axios";
import { serverLink } from "../Data/Variables";
import { getResult } from "../Data/Methods";
import { TransactionContext } from "../context/TransactionContext";

const ResultCandidate = () => {

  const { id } = useParams();
  const [data, setData] = useState(null);
  const { getAllTransactions } = useContext(TransactionContext);

  useEffect(() => {

    const fetchData = async () => {
      try {

        // ✅ get election (any phase)
        const res = await axios.get(serverLink + "election/" + id);
        const election = res.data;

        if (!election || election.currentPhase !== "result") {
          setData({ error: "Results not available yet." });
          return;
        }

        // ✅ get votes from blockchain
        const transactions = await getAllTransactions();
        const result = await getResult(transactions || []);

        const final = result.find(
          r => String(r.election_id) === String(id)
        );

        setData({
          name: election.name,
          candidates: final?.candidates || election.candidates || [],
          vote: final?.vote || []
        });

      } catch (err) {
        console.log(err);
        setData({ error: "Error loading results" });
      }
    };

    fetchData();

  }, [id, getAllTransactions]);

  if (!data) {
    return <Typography align="center" mt={5}>Loading...</Typography>;
  }

  if (data.error) {
    return <Typography align="center" mt={5}>{data.error}</Typography>;
  }

  return (
    <div style={{ paddingBottom: 25 }}>
      <Toolbar />

      <Grid container spacing={2} justifyContent="center" mt={3}>

        <Grid item xs={12} textAlign="center">
          <Typography variant="h4">
            {data.name} Results
          </Typography>
        </Grid>

        {data.candidates.map((c, i) => (
          <Grid item xs={12} md={4} key={i}>
            <Typography variant="h6">
              {c} - Votes: {data.vote[i] || 0}
            </Typography>
          </Grid>
        ))}

      </Grid>
    </div>
  );
};

export default ResultCandidate;