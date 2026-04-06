import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { Grid, Toolbar, Typography, Box, Card, LinearProgress, Divider } from "@mui/material";
import axios from "axios";
import { serverLink } from "../Data/Variables";
import { getResult } from "../Data/Methods";
import { TransactionContext } from "../context/TransactionContext";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import BarChartIcon from "@mui/icons-material/BarChart";

const ResultCandidate = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [turnoutStats, setTurnoutStats] = useState(null);
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

        // 🏆 MAPPING FIX: Always use the FULL list of candidates from the election
        // Then find how many votes each one got from the blockchain.
        const voteMap = final?.candidates.reduce((acc, name, index) => {
          acc[name.toLowerCase()] = final.vote[index];
          return acc;
        }, {}) || {};

        setData({
          name: election.name,
          candidates: election.candidates || [], // Use the source of truth
          vote: (election.candidates || []).map(c => voteMap[c.toLowerCase()] || 0)
        });

        // ✅ Fetch all users for participation statistics
        const userRes = await axios.get(serverLink + "users");
        const allUsers = userRes.data.filter(u => !u.isAdmin);

        const total = allUsers.length;
        const voted = allUsers.filter(u => u.hasVoted).length;
        const notVoted = total - voted;

        // Group by location
        const locMap = {};
        allUsers.forEach(u => {
          const loc = u.location || "Other";
          if (!locMap[loc]) locMap[loc] = { total: 0, voted: 0 };
          locMap[loc].total++;
          if (u.hasVoted) locMap[loc].voted++;
        });

        setTurnoutStats({
          total,
          voted,
          notVoted,
          locations: locMap
        });

      } catch (err) {
        console.log(err);
        setData({ error: "Error loading results" });
      }
    };

    fetchData();
  }, [id, getAllTransactions]);

  if (!data) {
    return <Typography align="center" mt={5}>Loading results...</Typography>;
  }

  if (data.error) {
    return <Typography align="center" mt={5} color="error">{data.error}</Typography>;
  }

  return (
    <div style={{ paddingBottom: 50, paddingLeft: 20, paddingRight: 20 }}>
      <Toolbar />

      <Box mt={3} textAlign="center">
          <Typography variant="h3" fontWeight="bold" color="primary" gutterBottom>
            {data.name} Official Results
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Final counts as verified by the blockchain network.
          </Typography>
      </Box>

      {/* ── Candidate Results Section ── */}
      <Grid container spacing={3} justifyContent="center" mt={4}>
        {data.candidates.map((c, i) => (
          <Grid item xs={12} md={4} key={i}>
            <Card sx={{ p: 3, textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderTop: '5px solid #1976d2' }}>
              <Typography variant="h5" color="textPrimary" fontWeight="bold" gutterBottom>
                {c.toUpperCase()}
              </Typography>
              <Box fontSize="3rem" fontWeight="bold" color="primary.main">
                {data.vote[i] || 0}
              </Box>
              <Typography variant="subtitle2" color="textSecondary">
                Verified Votes
              </Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 6 }} />

      {/* ── Participation Stats Section ── */}
      {turnoutStats && (
        <Grid container spacing={4} justifyContent="center">
          <Grid item xs={12}>
             <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
                <BarChartIcon sx={{ fontSize: 35, verticalAlign: 'middle', mr: 1, color: '#1976d2' }} /> General Participation Statistics
             </Typography>
          </Grid>

          {/* Quick Metrics */}
          <Grid item xs={12} md={3}>
             <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="primary">{turnoutStats.total}</Typography>
                <Typography variant="body2" color="textSecondary">Total Voters</Typography>
             </Card>
          </Grid>
          <Grid item xs={12} md={3}>
             <Card variant="outlined" sx={{ p: 2, textAlign: 'center', borderColor: '#4caf50' }}>
                <Typography variant="h4" color="success.main">{turnoutStats.voted}</Typography>
                <Typography variant="body2" color="textSecondary">Voted</Typography>
             </Card>
          </Grid>
          <Grid item xs={12} md={3}>
             <Card variant="outlined" sx={{ p: 2, textAlign: 'center', borderColor: '#f44336' }}>
                <Typography variant="h4" color="error">{turnoutStats.notVoted}</Typography>
                <Typography variant="body2" color="textSecondary">Didn't Vote</Typography>
             </Card>
          </Grid>

          {/* Regional Turnout Rates */}
          <Grid item xs={12} mt={3}>
            <Card sx={{ p: 4, borderRadius: 3, bgcolor: '#f5f5f5' }}>
               <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ display: 'flex', alignItems: 'center' }}>
                  <LocationOnIcon color="error" sx={{ mr: 1 }} /> Participation by Region
               </Typography>
               <Grid container spacing={3} mt={1}>
                  {Object.entries(turnoutStats.locations).map(([loc, stats]) => {
                    const rate = ((stats.voted / stats.total) * 100).toFixed(1);
                    return (
                      <Grid item xs={12} sm={6} md={3} key={loc}>
                        <Box p={2} sx={{ bgcolor: '#fff', borderRadius: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                           <Box display="flex" justifyContent="space-between" mb={1}>
                              <Typography variant="body1" fontWeight="bold">{loc}</Typography>
                              <Typography variant="body2" color="primary">{rate}%</Typography>
                           </Box>
                           <LinearProgress 
                              variant="determinate" 
                              value={parseFloat(rate)} 
                              sx={{ height: 8, borderRadius: 4 }}
                              color={rate >= 50 ? "success" : "primary"}
                           />
                        </Box>
                      </Grid>
                    );
                  })}
               </Grid>
            </Card>
          </Grid>
        </Grid>
      )}
    </div>
  );
};

export default ResultCandidate;