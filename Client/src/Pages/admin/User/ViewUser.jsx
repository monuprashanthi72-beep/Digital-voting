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

  const getAvatarUrl = (row) => {
    if (row.avatarBase64) return row.avatarBase64;
    if (!row.avatar) return defaultAvatar;
    if (row.avatar.startsWith("http")) return row.avatar;
    return facesLink + row.avatar;
  };

  const getDocumentUrl = (row) => {
    if (row.idCardBase64) return row.idCardBase64;
    if (!row.idCardImage) return null;
    if (row.idCardImage.startsWith("http")) return row.idCardImage;
    return facesLink + row.idCardImage;
  };

  const handleReset = async () => {
    // SECURITY: Prompt for the Admin Passcode
    const passcode = prompt("SECURITY CHECK: Enter your Admin Passcode to reset ALL voters:");
    if (!passcode) return; // User cancelled or left it empty

    // Double confirmation
    if (window.confirm("CRITICAL: This will reset the voting status for ALL users. They will be able to vote again in the new election. Proceed?")) {
      try {
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        const adminId = storedUser.id || storedUser._id;

        if (!adminId) {
          alert("Error: Admin session not found. Please log in again.");
          return;
        }

        const res = await axios.post(serverLink + "users/reset-status", {
          passcode: passcode,
          adminId: adminId
        });

        alert("Success: " + res.data);
        window.location.reload();
      } catch (e) {
        alert("SECURITY ERROR: " + (e.response?.data || "Unable to reset voters. Check your passcode or ensure no elections are active."));
      }
    }
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
          src={getAvatarUrl(params.row)}
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
    { field: "voterId", headerName: "Voter ID", width: 120 },
    { 
      field: "hasVoted", 
      headerName: "Voted?", 
      width: 90,
      renderCell: (params) => (
        <span style={{ color: params.value ? '#d32f2f' : '#2e7d32', fontWeight: 'bold' }}>
          {params.value ? "YES" : "NO"}
        </span>
      )
    },
    { field: "email", headerName: "Email", width: 200 },
    { field: "mobile", headerName: "Mobile", width: 120 },
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
          if (params.row.idCardImage || params.row.idCardBase64) {
            window.open(getDocumentUrl(params.row), "_blank");
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <ContentHeader title="Add Voter" link="/admin/user/add" />
        <Button 
          variant="contained" 
          color="error" 
          onClick={handleReset}
          sx={{ fontWeight: 'bold', height: 'fit-content', mt: 2 }}
        >
          Reset All Voters
        </Button>
      </div>
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
