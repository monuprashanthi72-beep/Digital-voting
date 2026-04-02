import axios from "axios";
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Button,
  Typography,
  Box,
  Grid,
  Paper,
  Autocomplete,
  TextField,
} from "@mui/material";
import InputField from "../../../Components/Form/InputField";
import { ErrorMessage } from "../../../Components/Form/ErrorMessage";
import { serverLink } from "../../../Data/Variables";
import ContentHeader from "../../../Components/ContentHeader";
import InputTags from "../../../Components/Form/InputTags";
import { phases } from "../../../Data/Variables";

const EditPhase = () => {
  const { id } = useParams();
  const [data, setData] = useState("");
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);

  useEffect(() => {
    async function getData() {
      let link = serverLink + "election/" + id;
      let res = await axios.get(link);
      let tmp = res.data;
      setData(tmp);
      console.log(tmp);
      setCandidates(tmp.candidates);
    }
    getData();
  }, [id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const name = e.target.name.value;
    const currentPhase = e.target.currentPhase.value;
    const startDate = e.target.startDate.value;
    const endDate = e.target.endDate.value;

    const newData = { name, currentPhase, startDate, endDate };

    console.log(newData);

    const link = serverLink + "phase/edit/" + data._id;

    axios.post(link, newData).then((res) => {
      if (res.status === 201) {
        navigate("/admin/phase");
      }
    });
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
                  Edit Phase
                </Typography>
                <Grid container pt={3} spacing={3}>
                  <Grid item xs={12} sm={12}>
                    <InputField
                      label="name"
                      name="name"
                      fullWidth={true}
                      value={data.name}
                    />
                    <ErrorMessage />
                  </Grid>

                  <Grid item xs={12} sm={12}>
                    <InputTags
                      setCandidates={setCandidates}
                      candidates={candidates}
                      readOnly
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>Election Start Date & Time</Typography>
                    <TextField
                      fullWidth
                      name="startDate"
                      type="datetime-local"
                      defaultValue={data.startDate ? new Date(data.startDate).toISOString().slice(0, 16) : ""}
                      InputLabelProps={{ shrink: true }}
                      helperText="When the voting phase officially becomes active."
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>Election End Date & Time</Typography>
                    <TextField
                      fullWidth
                      name="endDate"
                      type="datetime-local"
                      defaultValue={data.endDate ? new Date(data.endDate).toISOString().slice(0, 16) : ""}
                      InputLabelProps={{ shrink: true }}
                      helperText="When the system automatically stops accepting votes."
                    />
                  </Grid>

                  <Grid item xs={12} sm={12}>
                    <Autocomplete
                      id="combo-box-demo"
                      options={phases}
                      defaultValue={data.currentPhase}
                      sx={{ width: 300 }}
                      renderInput={(params) => (
                        <TextField
                          required
                          {...params}
                          name="currentPhase"
                          label="Phase"
                        />
                      )}
                    />
                  </Grid>
                </Grid>
                <Box mt={3}>
                  <Button type="submit" variant="contained" color="primary">
                    Update Election Details
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

export default EditPhase;
