import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { serverLink } from "../../../Data/Variables";
import BasicTable from "../../../Components/BasicTable";
import ContentHeader from "../../../Components/ContentHeader";
import Card from "@mui/material/Card";
import EditIcon from "@mui/icons-material/Edit";
import { Link } from "react-router-dom";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { TransactionContext } from "../../../context/TransactionContext";

const ViewPhase = () => {
  const [data, setData] = useState([]);
  const { setElectionTimes } = useContext(TransactionContext);

  const columns = [
    { field: "_id", headerName: "Id", width: 220, hide: true },
    { field: "name", headerName: "Name", width: 200 },
    { field: "currentPhase", headerName: "Phase", width: 120 },
    { 
      field: "startDate", 
      headerName: "Start Date", 
      width: 180, 
      valueFormatter: (params) => params.value ? new Date(params.value).toLocaleString() : "Not Set" 
    },
    { 
      field: "endDate", 
      headerName: "End Date", 
      width: 180, 
      valueFormatter: (params) => params.value ? new Date(params.value).toLocaleString() : "Not Set" 
    },
    {
      field: "sync",
      headerName: "Blockchain Sync",
      width: 180,
      renderCell: (params) => {
        const handleSync = async () => {
          if (!params.row.startDate || !params.row.endDate) {
            return alert("Establish an election window (Edit) before syncing to Blockchain.");
          }
          const startUnix = Math.floor(new Date(params.row.startDate).getTime() / 1000);
          const endUnix = Math.floor(new Date(params.row.endDate).getTime() / 1000);
          
          alert(`Syncing ${params.row.name} to Blockchain...\n\nStart: ${params.row.startDate}\nEnd: ${params.row.endDate}`);
          const res = await setElectionTimes(startUnix, endUnix);
          if (res.success) alert("SUCCESS: Blockchain Time-Lock Synchronized.");
          else alert("FAILED: Enrollment Error.\n" + res.message);
        };
        return (
          <Button variant="contained" size="small" onClick={handleSync} color="secondary">
            Sync Time
          </Button>
        );
      }
    },
    {
      field: "edit",
      headerName: "Edit",
      width: 80,
      renderCell: (params) => {
        const link = "edit/" + params.row._id;
        return (
          <Link to={link}>
            <Button>
              <EditIcon />
            </Button>
          </Link>
        );
      },
    },
  ];

  useEffect(() => {
    async function getData() {
      let link = serverLink + "elections";
      let res = await axios.get(link);
      setData(Array.isArray(res.data) ? res.data : []);
    }
    getData();
  }, []);

  const activePhase = data && data.length > 0 ? data[0].currentPhase : "system";
  const contextLabel = 
    activePhase === "voting" ? "VOTING" : 
    activePhase === "result" ? "RESULTS" : 
    activePhase === "registration" ? "ENROLLMENT" : "SYSTEM";

  const handleSetLock = async () => {
    if (window.confirm(`CRITICAL ACTION: This will MANUALLY lock ${contextLabel} by setting the smart contract time-lock in the past. Proceed?`)) {
      const fakeStart = Math.floor(Date.now() / 1000) - 10000;
      const fakeEnd = Math.floor(Date.now() / 1000) - 5000;
      const res = await setElectionTimes(fakeStart, fakeEnd);
      if (res.success) alert(`Time-Lock Emergency: ${contextLabel} is now Hard-Locked.`);
    }
  };

  const handleUnlock = async () => {
    if (window.confirm(`EMERGENCY UNLOCK: This overrides all timers and opens the ${contextLabel} context indefinitely. Proceed?`)) {
      const fakeStart = Math.floor(Date.now() / 1000) - 10000;
      const fakeEnd = Math.floor(Date.now() / 1000) + 3153600000;
      const res = await setElectionTimes(fakeStart, fakeEnd);
      if (res.success) alert(`Override Active: ${contextLabel} is now Unlocked indefinitely.`);
    }
  };

  return (
    <>
      <div className="admin__content">
        <ContentHeader />
        
        <Box mb={4} display="flex" gap={2} alignItems="center">
           <Button 
             variant="contained" 
             color="error" 
             onClick={handleSetLock} 
             disabled={!data || data.length === 0}
             sx={{ fontWeight: 'bold' }}
            >
             🔴 LOCK {contextLabel}
           </Button>
           <Button 
             variant="outlined" 
             color="primary" 
             onClick={handleUnlock}
             disabled={!data || data.length === 0}
             sx={{ fontWeight: 'bold' }}
            >
             🔓 UNLOCK {contextLabel}
           </Button>
           <Typography variant="caption" sx={{ color: '#666', fontStyle: 'italic' }}>
             (Emergency blockchain overrides based on current {activePhase} phase)
           </Typography>
        </Box>

        {data && (
          <div className="content" style={{ paddingBottom: "20px" }}>
            <Card variant="outlined">
              <BasicTable columns={columns} checkboxSelection rows={data} />
            </Card>
          </div>
        )}
      </div>
    </>
  );
};

export default ViewPhase;
