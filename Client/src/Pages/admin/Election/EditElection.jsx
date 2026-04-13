import React, { useEffect, useState } from "react";
import { Button, Grid, Paper, Typography, Box, CircularProgress } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import ContentHeader from "../../../Components/ContentHeader";
import { serverLink } from "../../../Data/Variables";
import InputTags from "../../../Components/Form/InputTags";
import InputField from "../../../Components/Form/InputField";

const EditElection = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [electionName, setElectionName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchElection() {
      try {
        const res = await axios.get(serverLink + "election/" + id);
        if (res.data) {
          setElectionName(res.data.name || "");
          setCandidates(res.data.candidates || []);
        }
        setLoading(false);
      } catch (err) {
        console.error("Error fetching election:", err);
        setError("Could not load election data.");
        setLoading(false);
      }
    }
    fetchElection();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const name = e.target.name.value;
    const data = { name, candidates };

    try {
      const res = await axios.post(serverLink + "election/edit/" + id, data);
      if (res.status === 201 || res.status === 200) {
        alert("✅ Election Updated Successfully!");
        navigate("/admin/election");
      }
    } catch (err) {
      console.error("Update Error:", err);
      alert("❌ Failed to update election.");
    }
  };

  if (loading) return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="50vh">
      <CircularProgress />
      <Typography sx={{ mt: 2 }}>Loading Election Details...</Typography>
    </Box>
  );

  if (error) return (
    <Box p={4} textAlign="center">
      <Typography color="error">{error}</Typography>
      <Button onClick={() => navigate("/admin/election")}>Go Back</Button>
    </Box>
  );

  return (
    <div className="admin__content">
      <ContentHeader />
      <div className="content">
        <form onSubmit={handleSubmit}>
          <Paper elevation={3} sx={{ p: 4, borderRadius: '12px' }}>
            <Typography variant="h5" align="center" gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
              Edit Election: {electionName}
            </Typography>
            
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <InputField 
                  label="Election Name" 
                  name="name" 
                  fullWidth={true} 
                  defaultValue={electionName}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'medium' }}>
                  Manage Candidates
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  Search and select the remaining candidates below.
                </Typography>
                <InputTags
                  setCandidates={setCandidates}
                  candidates={candidates}
                />
              </Grid>
            </Grid>

            <Box mt={6} display="flex" gap={2}>
              <Button type="submit" variant="contained" color="primary" size="large" sx={{ px: 4 }}>
                Save Election Changes
              </Button>
              <Button variant="outlined" size="large" onClick={() => navigate("/admin/election")}>
                Cancel
              </Button>
            </Box>
          </Paper>
        </form>
      </div>
    </div>
  );
};

export default EditElection;
