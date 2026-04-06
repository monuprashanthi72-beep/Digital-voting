import React, { useEffect, useState } from "react";
import BasicTable from "../../../Components/BasicTable";
import ContentHeader from "../../../Components/ContentHeader";
import Card from "@mui/material/Card";
import "../../../style.css";
import axios from "axios";
import Button from "@mui/material/Button";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { serverLink, facesLink } from "../../../Data/Variables";
import { Alert, Snackbar } from "@mui/material";
import { Link } from "react-router-dom";

const ViewUser = () => {
  const [data, setData] = useState([]);
  const [open, setOpen] = useState(false);

  const defaultAvatar =
    "https://firebasestorage.googleapis.com/v0/b/luxuryhub-3b0f6.appspot.com/o/Site%20Images%2Fprofile.png?alt=media&token=6f94d26d-315c-478b-9892-67fda99d2cd6";

  const getAvatarUrl = (avatar) => {
    if (!avatar) return defaultAvatar;
    if (avatar.startsWith("http")) return avatar;
    return facesLink + avatar;
  };

  const getDocumentUrl = (doc) => {
    if (!doc) return null;
    if (doc.startsWith("http")) return doc;
    return facesLink + doc;
  };

  const columns = [
    {
      field: "avatar",
      headerName: "Photo",
      width: 80,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <img
          src={getAvatarUrl(params.row.avatar)}
          alt={params.row.username}
          onError={(e) => { e.target.onerror = null; e.target.src = defaultAvatar; }}
          style={{
            width: 46,
            height: 46,
            borderRadius: "50%",
            objectFit: "cover",
            border: "2px solid #1976d2",
          }}
        />
      ),
    },
    { field: "id", headerName: "ID", width: 220, hide: true },
    { field: "username", headerName: "Username", width: 140 },
    { field: "email", headerName: "Email", width: 230 },
    { field: "mobile", headerName: "Mobile", width: 140 },
    { field: "voterId", headerName: "Voter ID", width: 150 },
    { field: "aadharNumber", headerName: "Aadhaar No.", width: 150 },
    { field: "location", headerName: "Location", width: 110 },
    {
      field: "time",
      headerName: "Updated At",
      width: 200,
      valueGetter: (params) => {
        let date = new Date(params.row.updatedAt);
        return (
          date.getFullYear() +
          "/" +
          (date.getMonth() + 1) +
          "/" +
          date.getDate()
        );
      },
      hide: true,
    },
    {
      field: "edit",
      headerName: "Edit",
      width: 80,
      renderCell: (params) => {
        const link = "edit/" + params.row.id;
        return (
          <Link to={link}>
            <Button>
              <EditIcon />
            </Button>
          </Link>
        );
      },
    },
    {
      field: "delete",
      headerName: "Delete",
      width: 80,
      renderCell: (params) => {
        const deleteBtn = () => {
          const link = serverLink + "user/delete/" + params.row.id;
          axios.get(link);
          setOpen(true);
        };
        return (
          <Button onClick={deleteBtn}>
            <DeleteIcon sx={{ color: "error.main" }} />
          </Button>
        );
      },
    },
    {
      field: "idCardImage",
      headerName: "Documents",
      width: 120,
      renderCell: (params) => {
        const viewDoc = () => {
          if (params.row.idCardImage) {
            window.open(getDocumentUrl(params.row.idCardImage), "_blank");
          } else {
            alert("No document uploaded for this user.");
          }
        };
        return (
          <Button onClick={viewDoc} disabled={!params.row.idCardImage}>
            <VisibilityIcon color="primary" />
          </Button>
        );
      },
    },
  ];

  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setOpen(false);
  };

  useEffect(() => {
    async function getData() {
      let res = await axios.get(serverLink + "users");
      let users = res.data;
      setData(users);
    }
    getData();
  }, [open]);

  return (
    <div className="admin__content">
      <ContentHeader title="Add Voter" link="/admin/user/add" />
      <div className="content" style={{ paddingBottom: "20px" }}>
        <Card variant="outlined">
          <BasicTable columns={columns} rows={data} checkboxSelection={true} />
        </Card>
      </div>
      <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
        <Alert onClose={handleClose} severity="error" sx={{ width: "100%" }}>
          Voter Deleted
        </Alert>
      </Snackbar>
    </div>
  );
};

export default ViewUser;
