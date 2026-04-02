import * as React from "react";
import { TextField, Button, Typography, Box, Grid, Paper } from "@mui/material";
import DatePicker from "../../../Components/Form/DatePicker";
import ContentHeader from "../../../Components/ContentHeader";
import { serverLink } from "../../../Data/Variables";
import InputField from "../../../Components/Form/InputField";
import { ErrorMessage } from "../../../Components/Form/ErrorMessage";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";

export default function AddCandidate() {
  const today = new Date();
  const maxDate =
    today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate();
  const navigate = useNavigate();
  const [join, setJoin] = useState(2000);

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append("username", e.target.username.value);
    data.append("firstName", e.target.fname.value);
    data.append("lastName", e.target.lname.value);
    data.append("dob", e.target.dob.value);
    data.append("qualification", e.target.qualification.value);
    data.append("join", join);
    data.append("location", e.target.location.value);
    data.append("description", e.target.description.value);

    const fileInput = e.target.candidateImage;
    if (fileInput && fileInput.files[0]) {
      data.append("candidateImage", fileInput.files[0]);
    }

    axios
      .post(serverLink + "candidate/register", data)
      .then((res) => {
        if (res.status === 201) {
          navigate("/admin/candidate");
        }
      })
      .catch(err => alert("Error adding candidate: " + err.message));
  };

  return (
    <div className="admin__content">
      <ContentHeader />
      <div className="content">
        <form onSubmit={handleSubmit} method="POST">
          <Paper elevation={3}>
            <Box px={3} py={2}>
              <Typography variant="h6" align="center" margin="dense">
                Add Candidate
              </Typography>
              <Grid container pt={3} spacing={3}>
                <Grid item xs={12} sm={12}>
                  <InputField
                    label="username"
                    name="username"
                    fullWidth={true}
                  />
                  <ErrorMessage />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <InputField
                    label="First Name"
                    name="fname"
                    fullWidth={true}
                  />
                  <ErrorMessage />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <InputField label="Last Name" name="lname" fullWidth={true} />
                  <ErrorMessage />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DatePicker name="dob" title="Birth Date" max={maxDate} />
                  <ErrorMessage />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    type="number"
                    label="Politices Join From (Year)"
                    fullWidth
                    readOnly
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
                  />
                  <ErrorMessage />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <InputField
                    label="Location"
                    name="location"
                    fullWidth={true}
                  />
                  <ErrorMessage />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">
                    Candidate Photo
                  </Typography>
                  <input
                    type="file"
                    name="candidateImage"
                    accept="image/*"
                    style={{ marginTop: "8px" }}
                  />
                </Grid>
                <Grid item xs={12} sm={12}>
                  <TextField
                    label="Description"
                    name="description"
                    multiline
                    rows={5}
                    fullWidth={true}
                  />
                  <ErrorMessage />
                </Grid>
              </Grid>
              <Box mt={3}>
                <Button type="submit" variant="contained" color="primary">
                  Add Candidate
                </Button>
              </Box>
            </Box>
          </Paper>
        </form>
      </div>
    </div>
  );
}
