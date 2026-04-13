import * as React from "react";
import { TextField, Button, Typography, Box, Grid, Paper } from "@mui/material";
import DatePicker from "../../../Components/Form/DatePicker";
import ContentHeader from "../../../Components/ContentHeader";
import { serverLink, facesLink } from "../../../Data/Variables";
import InputField from "../../../Components/Form/InputField";
import { ErrorMessage } from "../../../Components/Form/ErrorMessage";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";

export default function EditCandidate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [candidateData, setCandidateData] = useState(null);
  const [join, setJoin] = useState(2000);

  const today = new Date();
  const maxDate =
    today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate();

  useEffect(() => {
    async function fetchCandidate() {
      try {
        const res = await axios.get(serverLink + "candidate/find/" + id);
        setCandidateData(res.data);
        setJoin(res.data.join || 2000);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching candidate:", err);
      }
    }
    fetchCandidate();
  }, [id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("username", e.target.username.value);
    formData.append("firstName", e.target.fname.value);
    formData.append("lastName", e.target.lname.value);
    formData.append("dob", e.target.dob.value);
    formData.append("qualification", e.target.qualification.value);
    formData.append("join", join);
    formData.append("location", e.target.location.value);
    formData.append("description", e.target.description.value);
    
    // Add the image file if selected
    if (e.target.profile.files[0]) {
      formData.append("profile", e.target.profile.files[0]);
    }

    axios
      .post(serverLink + "candidate/edit/" + id, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      })
      .then((res) => {
        if (res.status === 201) {
          alert("✅ Candidate Updated Successfully!");
          navigate("/admin/candidate");
        } else {
          alert("⚠️ Server returned status: " + res.status);
        }
      })
      .catch((err) => {
        console.error("Edit Error:", err);
        alert("❌ Error Updating Candidate: " + (err.response?.data || err.message));
      });
  };

  if (loading) return <Typography align="center">Loading Candidate Data...</Typography>;

  return (
    <div className="admin__content">
      <ContentHeader />
      <div className="content">
        <form onSubmit={handleSubmit} method="POST">
          <Paper elevation={3}>
            <Box px={3} py={2}>
              <Typography variant="h6" align="center" margin="dense">
                Edit Candidate: {candidateData?.username}
              </Typography>
              <Grid container pt={3} spacing={3}>
                <Grid item xs={12} sm={6}>
                  <InputField
                    label="username"
                    name="username"
                    fullWidth={true}
                    defaultValue={candidateData?.username}
                  />
                  <ErrorMessage />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                    Current Profile Picture
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <img 
                      src={candidateData?.avatar 
                        ? (candidateData.avatar.startsWith("http") ? candidateData.avatar : (facesLink + candidateData.avatar))
                        : (facesLink + candidateData?.username + ".png")
                      } 
                      alt="Current Avatar" 
                      style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #ddd' }}
                      onError={(e) => { e.target.src = "https://via.placeholder.com/100?text=No+Photo"; }}
                    />
                  </Box>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                    Update Profile Picture (Optional)
                  </Typography>
                  <input
                    type="file"
                    name="profile"
                    accept="image/*"
                    style={{ marginBottom: '20px' }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <InputField
                    label="First Name"
                    name="fname"
                    fullWidth={true}
                    defaultValue={candidateData?.firstName}
                  />
                  <ErrorMessage />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <InputField 
                    label="Last Name" 
                    name="lname" 
                    fullWidth={true} 
                    defaultValue={candidateData?.lastName}
                  />
                  <ErrorMessage />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DatePicker 
                    name="dob" 
                    title="Birth Date" 
                    max={maxDate} 
                    defaultValue={candidateData?.dob}
                  />
                  <ErrorMessage />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    type="number"
                    label="Politices Join From (Year)"
                    fullWidth
                    inputProps={{ min: 1900, max: 2099 }}
                    value={join}
                    onChange={(e) => {
                      setJoin(e.target.value);
                    }}
                    variant="outlined"
                  />
                  <ErrorMessage />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <InputField
                    label="Qualification"
                    name="qualification"
                    fullWidth={true}
                    defaultValue={candidateData?.qualification}
                  />
                  <ErrorMessage />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <InputField
                    label="Location"
                    name="location"
                    fullWidth={true}
                    defaultValue={candidateData?.location}
                  />
                  <ErrorMessage />
                </Grid>
                <Grid item xs={12} sm={12}>
                  <TextField
                    label="Description"
                    name="description"
                    multiline
                    rows={5}
                    fullWidth={true}
                    defaultValue={candidateData?.description}
                  />
                  <ErrorMessage />
                </Grid>
              </Grid>
              <Box mt={3} display="flex" gap={2}>
                <Button type="submit" variant="contained" color="primary">
                  Save Changes
                </Button>
                <Button variant="outlined" onClick={() => navigate("/admin/candidate")}>
                  Cancel
                </Button>
              </Box>
            </Box>
          </Paper>
        </form>
      </div>
    </div>
  );
}
