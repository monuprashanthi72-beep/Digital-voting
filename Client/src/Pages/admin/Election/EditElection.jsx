import React, { useEffect, useState } from "react";
import { Button, Grid, Paper, Typography, Box, CircularProgress } from "@mui/material";
import InputField from "../../../Components/Form/InputField";
import InputTags from "../../../Components/Form/InputTags";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import ContentHeader from "../../../Components/ContentHeader";
import { serverLink } from "../../../Data/Variables";

const EditElection = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [electionName, setElectionName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchElection() {
      try {
        const res = await axios.get(serverLink + "election/" + id);
        setElectionName(res.data.name);
        setCandidates(res.data.candidates || []);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching election:", err);
        setLoading(false);
      }
    }
    fetchElection();
  }, [id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const name = e.target.name.value;
    const data = { name, candidates };

    axios
      .post(serverLink + "election/edit/" + id, data)
      .then((res) => {
        if (res.status === 201) {
          alert("✅ Election Updated Successfully!");
          navigate("/admin/election");
        }
      })
      .catch(err => {
        console.error("Update Error:", err);
        alert("❌ Failed to update election.");
      });
  };

  if (loading) return <Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>;

  return (
    <div className="admin__content">
      <ContentHeader title="Edit Election" />
      <div className="content">
        <form onSubmit={handleSubmit} method="POST">
          <Paper elevation={3}>
            <Box px={3} py={2}>
              <Typography variant="h6" align="center" margin="dense">
                Edit Election: {electionName}
              </Typography>
              <Grid container pt={3} spacing={3}>
                <Grid item xs={12} sm={6}>
                  <InputField 
                    label="Election Name" 
                    name="name" 
                    fullWidth={true} 
                    defaultValue={electionName}
                  />
                </Grid>
                <Grid item xs={12} sm={6}></Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                    Add/Remove Candidates
                  </Typography>
                  <InputTags
                    setCandidates={setCandidates}
                    candidates={candidates}
                  />
                </Grid>
                <Grid item xs={12} sm={6}></Grid>
              </Grid>
              <Box mt={3} display="flex" gap={2}>
                <Button type="submit" variant="contained" color="primary">
                  Save Changes
                </Button>
                <Button variant="outlined" onClick={() => navigate("/admin/election")}>
                  Cancel
                </Button>
              </Box>
            </Box>
          </Paper>
        </form>
      </div>
    </div>
  );
};

export default EditElection;
