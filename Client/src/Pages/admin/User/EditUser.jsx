import React from "react";
import { Button, Typography, Box, Grid, Paper } from "@mui/material";
import InputField from "../../../Components/Form/InputField";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ErrorMessage } from "../../../Components/Form/ErrorMessage";
import axios from "axios";
import ContentHeader from "../../../Components/ContentHeader";
import { serverLink, facesLink } from "../../../Data/Variables";

const ViewUser = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    async function getData() {
      const link = serverLink + "user/" + id;
      const t = await axios.get(link);
      setData(t.data);
    }
    getData();
  }, [id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const username = e.target.username.value;
    const email = e.target.email.value;
    const fname = e.target.fname.value;
    const lname = e.target.lname.value;
    const mobile = e.target.mobile.value;
    const profile = e.target.profile.files[0];
    const sendData = new FormData();
    sendData.append("username", username);
    sendData.append("fname", fname);
    sendData.append("lname", lname);
    sendData.append("email", email);
    sendData.append("mobile", mobile);
    sendData.append("profile", profile);
    sendData.append("avatar", username + "." + profile.name.split(".").pop());

    const link = serverLink + "user/edit/" + data._id;

    axios.post(link, sendData).then((res) => {
      if (res.status === 201) {
        navigate("/admin/user");
      }
    });
  };

  const getAvatarUrl = (avatar) => {
    if (!avatar) return null;
    if (avatar.startsWith("http")) return avatar;
    return facesLink + avatar;
  };

  const getDocumentUrl = (doc) => {
    if (!doc) return null;
    if (doc.startsWith("http")) return doc;
    return facesLink + doc;
  };

  return (
    <div className="admin__content">
      <ContentHeader />
      {data && (
        <div className="content">
          <form onSubmit={handleSubmit} method="POST">
            <Paper elevation={3}>
              <Box px={3} py={2}>
                <Typography variant="h6" align="center" margin="dense">
                  Edit User
                </Typography>

                {/* ── PHOTO SECTION ── */}
                <Box
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  mt={2}
                  mb={3}
                  gap={1}
                >
                  {/* Profile photo */}
                  <img
                    src={getAvatarUrl(data.avatar)}
                    alt={`${data.username} profile`}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src =
                        "https://firebasestorage.googleapis.com/v0/b/luxuryhub-3b0f6.appspot.com/o/Site%20Images%2Fprofile.png?alt=media&token=6f94d26d-315c-478b-9892-67fda99d2cd6";
                    }}
                    style={{
                      width: 120,
                      height: 120,
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "4px solid #1976d2",
                      boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
                    }}
                  />
                  <Typography variant="body2" color="textSecondary">
                    Profile Photo
                  </Typography>

                  {/* ID Card / Document button */}
                  {data.idCardImage && (
                    <Button
                      variant="outlined"
                      size="small"
                      color="info"
                      onClick={() =>
                        window.open(
                          getDocumentUrl(data.idCardImage),
                          "_blank"
                        )
                      }
                      style={{ marginTop: 4 }}
                    >
                      View ID Document
                    </Button>
                  )}
                </Box>

                {/* ── FORM FIELDS ── */}
                <Grid container pt={1} spacing={3}>
                  <Grid item xs={12} sm={12}>
                    <InputField
                      label="username"
                      name="username"
                      fullWidth={true}
                      value={data.username}
                    />
                    <ErrorMessage />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InputField
                      label="First Name"
                      name="fname"
                      fullWidth={true}
                      value={data.fname}
                    />
                    <ErrorMessage />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InputField
                      label="Last Name"
                      name="lname"
                      fullWidth={true}
                      value={data.lname}
                    />
                    <ErrorMessage />
                  </Grid>
                  <Grid item xs={12} sm={12}>
                    <InputField
                      label="E-mail"
                      name="email"
                      fullWidth={true}
                      value={data.email}
                    />
                  </Grid>
                  <Grid item xs={12} sm={12}>
                    <InputField
                      label="Mobile"
                      name="mobile"
                      fullWidth={true}
                      value={data.mobile}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InputField
                      label="Voter ID"
                      name="voterId"
                      fullWidth={true}
                      value={data.voterId || ""}
                      disabled={true}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InputField
                      label="Aadhaar Number"
                      name="aadharNumber"
                      fullWidth={true}
                      value={data.aadharNumber || ""}
                      disabled={true}
                    />
                  </Grid>
                  <Grid item xs={12} sm={12}>
                    <Typography variant="body2" color="textSecondary" mb={1}>
                      Update Profile Photo:
                    </Typography>
                    <input type="file" label="Upload Image" name="profile" />
                    <ErrorMessage />
                  </Grid>
                </Grid>
                <Box mt={3}>
                  <Button type="submit" variant="contained" color="primary">
                    Update User
                  </Button>
                </Box>
              </Box>
            </Paper>
          </form>
        </div>
      )}
    </div>
  );
};

export default ViewUser;
