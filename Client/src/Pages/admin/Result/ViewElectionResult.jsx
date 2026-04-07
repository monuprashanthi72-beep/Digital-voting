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
        const res = await axios.get(serverLink + "elections");
        const elections = res.data;

        const election = elections.find(
          e => String(e.id || e._id) === String(id)
        );

        if (!election) {
          setData({ error: "Election not found" });
          return;
        }

        const transactions = await getAllTransactions();
        const result = await getResult(transactions);

        // 🏆 ELECTION MATCHING FIX: Case-insensitive, trimmed comparison
        const final = result.find(
          r => String(r.election_id).trim().toLowerCase() === String(id).trim().toLowerCase()
        );

        // ✅ Map IDs to Names for perfect Admin display
        const candRes = await axios.get(serverLink + "candidates");
        const allCandidates = candRes.data;

        const finalVoteArray = (election.candidates || []).map(cid => {
          const targetCid = String(cid).trim().toLowerCase();

          // 1. Try to get the count from the Blockchain
          const blockchainCountIdx = (final?.candidates || []).findIndex(
            bcid => String(bcid).trim().toLowerCase() === targetCid
          );
          let count = blockchainCountIdx !== -1 ? final.vote[blockchainCountIdx] : 0;

          // 2. Find the candidate's name in the database (Check ID, _id, and username)
          const candObj = allCandidates.find(
            c => (c.id && String(c.id).trim().toLowerCase() === targetCid) || 
                 (c._id && String(c._id).trim().toLowerCase() === targetCid) ||
                 (c.username && String(c.username).trim().toLowerCase() === targetCid)
          );

          return {
            username: candObj ? `${candObj.firstName} ${candObj.lastName || ""}`.trim() : (cid || "Unknown"),
            vote: count
          };
        });

        setData({
          name: election.name || "Unknown",
          voteData: finalVoteArray
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

            {data.voteData.map((item, index) => (
              <Grid item xs={6} md={4} key={index}>
                <Candidate
                  username={item.username}
                  index={index}
                  id={id}
                  vote={item.vote}
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