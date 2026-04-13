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
                Edit Candidate: {userData.username}
              </Typography>
              <Grid container pt={3} spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <InputField
                      label="username"
                      name="username"
                      fullWidth={true}
                      value={userData.username || ""}
                      onChange={(e) => setUserData({ ...userData, username: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box textAlign="center">
                       <Typography variant="body2" color="textSecondary">Current Profile Picture</Typography>
                       {userData.avatar ? (
                         <img 
                           src={userData.avatar.startsWith('http') ? userData.avatar : facesLink + userData.avatar} 
                           alt="Preview" 
                           style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', marginTop: '8px', border: '1px solid #ccc' }} 
                         />
                       ) : (
                         <div style={{ width: '100px', height: '100px', background: '#eee', display: 'inline-block', borderRadius: '8px', lineHeight: '100px' }}>No Photo</div>
                       )}
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                   <Typography variant="body2" color="textSecondary">Update Profile Picture (Optional)</Typography>
                    <input type="file" name="avatar" onChange={handleImageChange} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InputField
                      label="First Name"
                      name="firstName"
                      fullWidth={true}
                      value={userData.firstName || ""}
                      onChange={(e) => setUserData({ ...userData, firstName: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InputField
                      label="Last Name"
                      name="lastName"
                      fullWidth={true}
                      value={userData.lastName || ""}
                      onChange={(e) => setUserData({ ...userData, lastName: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InputField
                      type="date"
                      name="dob"
                      fullWidth={true}
                      value={userData.dob || ""}
                      onChange={(e) => setUserData({ ...userData, dob: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InputField
                      label="Politices Join From (Year)"
                      name="joinYear"
                      fullWidth={true}
                      value={userData.joinYear || ""}
                      onChange={(e) => setUserData({ ...userData, joinYear: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InputField
                      label="Qualification"
                      name="qualification"
                      fullWidth={true}
                      value={userData.qualification || ""}
                      onChange={(e) => setUserData({ ...userData, qualification: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InputField
                      label="Location"
                      name="location"
                      fullWidth={true}
                      value={userData.location || ""}
                      onChange={(e) => setUserData({ ...userData, location: e.target.value })}
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
