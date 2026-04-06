import React, { useEffect, useState } from "react";
import ContentHeader from "../../../Components/ContentHeader";
import axios from "axios";
import { serverLink } from "../../../Data/Variables";
import {
  Card,
  Box,
  Typography,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
} from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";

const ViewTurnout = () => {
  const [voters, setVoters] = useState([]);

  useEffect(() => {
    async function getData() {
      const res = await axios.get(serverLink + "users");
      // Exclude admin accounts
      setVoters(res.data.filter((u) => !u.isAdmin));
    }
    getData();
  }, []);

  const total = voters.length;
  const votedList = voters.filter((v) => v.hasVoted);
  const notVotedList = voters.filter((v) => !v.hasVoted);
  const turnoutPct = total > 0 ? ((votedList.length / total) * 100).toFixed(1) : 0;

  // Calculate Turnout by Location
  const locationStats = voters.reduce((acc, curr) => {
    const loc = curr.location || "Unknown";
    if (!acc[loc]) {
      acc[loc] = { total: 0, voted: 0 };
    }
    acc[loc].total += 1;
    if (curr.hasVoted) {
      acc[loc].voted += 1;
    }
    return acc;
  }, {});

  const sortedLocations = Object.entries(locationStats).sort((a, b) => b[1].total - a[1].total);

  return (
    <div className="admin__content">
      <ContentHeader />
      <div className="content" style={{ paddingBottom: 30 }}>

        {/* ── Summary Stats ── */}
        <Grid container spacing={2} mb={4}>
          <Grid item xs={12} md={3}>
            <Card variant="outlined" sx={{ p: 2, textAlign: "center", height: '100%' }}>
              <Typography variant="h3" color="primary" fontWeight="bold">{total}</Typography>
              <Typography variant="body2" color="textSecondary">Total Registered</Typography>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card variant="outlined" sx={{ p: 2, textAlign: "center", borderColor: "#4caf50", height: '100%' }}>
              <Typography variant="h3" sx={{ color: "#2e7d32" }} fontWeight="bold">{votedList.length}</Typography>
              <Typography variant="body2" color="textSecondary">Voted</Typography>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card variant="outlined" sx={{ p: 2, textAlign: "center", borderColor: "#f44336", height: '100%' }}>
              <Typography variant="h3" color="error" fontWeight="bold">{notVotedList.length}</Typography>
              <Typography variant="body2" color="textSecondary">Not Voted</Typography>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card variant="outlined" sx={{ p: 2, textAlign: "center", borderColor: "#1976d2", height: '100%' }}>
              <Typography variant="h3" color="primary" fontWeight="bold">{turnoutPct}%</Typography>
              <Typography variant="body2" color="textSecondary">Total Turnout</Typography>
              <LinearProgress variant="determinate" value={parseFloat(turnoutPct)} sx={{ mt: 1, height: 8, borderRadius: 4 }} />
            </Card>
          </Grid>
        </Grid>

        {/* ── Turnout by Location Analysis ── */}
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', mb: 2 }}>
           <LocationOnIcon sx={{ mr: 1, color: '#d32f2f' }} /> Turnout by Regional Location
        </Typography>
        <Grid container spacing={2} mb={4}>
          {sortedLocations.map(([location, stats]) => {
            const pct = ((stats.voted / stats.total) * 100).toFixed(1);
            return (
              <Grid item xs={12} sm={6} md={4} key={location}>
                <Card variant="outlined" sx={{ p: 2, backgroundColor: '#fafafa' }}>
                   <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="subtitle1" fontWeight="bold">{location}</Typography>
                      <Typography variant="subtitle2" color="primary">{pct}% Rate</Typography>
                   </Box>
                   <LinearProgress variant="determinate" value={parseFloat(pct)} sx={{ height: 10, borderRadius: 5, mb: 1 }} />
                   <Typography variant="caption" color="textSecondary">
                      {stats.voted} / {stats.total} voters participated
                   </Typography>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        <Grid container spacing={3}>
          {/* ── List 1: People who VOTED ── */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom sx={{ color: '#2e7d32', fontWeight: 'bold', mb: 2 }}>
              ✅ Voters Who Participated
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead sx={{ bgcolor: '#e8f5e9' }}>
                  <TableRow>
                    <TableCell><b>Full Name</b></TableCell>
                    <TableCell><b>Voter ID</b></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {votedList.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell>{`${v.fname || ""} ${v.lname || ""}`}</TableCell>
                      <TableCell>{v.voterId}</TableCell>
                    </TableRow>
                  ))}
                  {votedList.length === 0 && (
                    <TableRow><TableCell colSpan={2} align="center" sx={{ py: 3, color: '#999' }}>No votes recorded yet.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>

          {/* ── List 2: People who DID NOT VOTE ── */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom sx={{ color: '#d32f2f', fontWeight: 'bold', mb: 2 }}>
              ⏳ Voters Yet to Participate
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead sx={{ bgcolor: '#ffebee' }}>
                  <TableRow>
                    <TableCell><b>Full Name</b></TableCell>
                    <TableCell><b>Voter ID</b></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {notVotedList.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell>{`${v.fname || ""} ${v.lname || ""}`}</TableCell>
                      <TableCell>{v.voterId}</TableCell>
                    </TableRow>
                  ))}
                  {notVotedList.length === 0 && (
                    <TableRow><TableCell colSpan={2} align="center" sx={{ py: 3, color: '#999' }}>Everyone has participated!</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>
      </div>
    </div>
  );
};

export default ViewTurnout;
