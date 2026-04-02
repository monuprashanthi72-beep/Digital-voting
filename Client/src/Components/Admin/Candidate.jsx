import React, { useEffect, useState } from "react";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Typography from "@mui/material/Typography";
import { Avatar, Box } from "@mui/material";
import axios from "axios";
import { stringToColor, stringToAv } from "../../Data/Methods";
import { serverLink, facesLink } from "../../Data/Variables";

const Candidate = (props) => {
  const [data, setData] = useState("");

  useEffect(() => {
    async function getData() {
      let res = await axios.get(serverLink + "candidate/" + props.username);
      let user = res.data;
      setData(user);
    }
    getData();
  }, [props.username]);

  return (
    <>
      <Card sx={{ maxWidth: 345 }}>
          <CardMedia
            component="img"
            height="200"
            image={facesLink + props.username + ".png"}
            alt={props.username}
            sx={{ 
              objectFit: 'cover',
              borderBottom: '1px solid #eee'
            }}
            onError={(e) => {
              e.target.onerror = null; 
              // Fallback to Avatar logic if image missing
              e.target.style.display = 'none';
            }}
          />
          {/* FALLBACK AVATAR IF IMAGE NOT FOUND */}
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <Avatar
              aria-label="recipe"
              sx={{
                width: "150px",
                height: "150px",
                fontSize: "40px",
                bgcolor: stringToColor(data.firstName + " " + data.lastName),
                display: (document.querySelector(`img[alt="${props.username}"]`)?.style.display === 'none') ? 'flex' : 'none'
              }}
            >
              {data !== "" && stringToAv(data.firstName, data.lastName)}
            </Avatar>
          </Box>
        <CardContent>
          <Typography gutterBottom variant="h5" component="div">
            {props.username}
          </Typography>
          <Typography variant="body2" color="text.secondary" component="div">
            {data !== null && (
              <>
                <Typography>
                  Name : {data.firstName + " " + data.lastName}
                </Typography>
                <Typography>Total Vote : {props.vote}</Typography>
                <Typography>Location: {data.location}</Typography>
              </>
            )}
          </Typography>
        </CardContent>
        <CardActions>
          {/* <Button size="small" onClick={() => handleClick(data._id)}>
            Vote
          </Button> */}
        </CardActions>
      </Card>
    </>
  );
};

export default Candidate;
