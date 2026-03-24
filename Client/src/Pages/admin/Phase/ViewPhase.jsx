import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { serverLink } from "../../../Data/Variables";
import BasicTable from "../../../Components/BasicTable";
import ContentHeader from "../../../Components/ContentHeader";
import Card from "@mui/material/Card";
import EditIcon from "@mui/icons-material/Edit";
import { Link } from "react-router-dom";
import Button from "@mui/material/Button";
import { TransactionContext } from "../../../context/TransactionContext";

const ViewPhase = () => {
  const [data, setData] = useState("");
  const { setElectionTimes } = useContext(TransactionContext);

  const columns = [
    { field: "_id", headerName: "Id", width: 220, hide: true },
    { field: "name", headerName: "Name", width: 220 },
    { field: "candidates", headerName: "Candidates", width: 220, hide: true },
    { field: "currentPhase", headerName: "Phase", width: 220 },
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
      let tmp = res.data;
      setData(tmp);
    }
    getData();
  }, []);

  const handleSetLock = async () => {
    alert("Setting Smart Contract Time-Lock... Please confirm the MetaMask transaction.");
    // Lock effectively in the past so it freezes the voting UI
    const fakeStart = Math.floor(Date.now() / 1000) - 10000;
    const fakeEnd = Math.floor(Date.now() / 1000) - 5000;
    const res = await setElectionTimes(fakeStart, fakeEnd);
    if (res.success) alert("Time-Lock active: Contract is locked.");
    else alert("Failed to secure lock. Make sure you are using the Admin MetaMask Account!\nError: " + res.message);
  };

  const handleUnlock = async () => {
    alert("Unlocking Smart Contract...");
    // Open the smart contract window for 100 years to allow easy testing
    const fakeStart = Math.floor(Date.now() / 1000) - 10000;
    const fakeEnd = Math.floor(Date.now() / 1000) + 3153600000;
    const res = await setElectionTimes(fakeStart, fakeEnd);
    if (res.success) alert("Time-Lock disabled: Contract uses fallback active mode.");
    else alert("Failed to unlock. Make sure you are using the Admin MetaMask Account!\nError: " + res.message);
  };

  return (
    <>
      <div className="admin__content">
        <ContentHeader />
        <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
           <Button variant="contained" color="error" onClick={handleSetLock}>
             LOCK SMART CONTRACT TIME
           </Button>
           <Button variant="outlined" color="primary" onClick={handleUnlock}>
             UNLOCK SMART CONTRACT
           </Button>
        </div>
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
