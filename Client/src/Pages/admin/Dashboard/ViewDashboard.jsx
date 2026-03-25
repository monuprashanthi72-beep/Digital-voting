import React from "react";
import ContentHeader from "../../../Components/ContentHeader";
import { useEffect } from "react";
import axios from "axios";
import { useState } from "react";
import DashboardCard from "../../../Components/DashboardCard";
import { serverLink } from "../../../Data/Variables";

const ViewDashboard = () => {
  const [users, setUsers] = useState(0);
  const [voted, setVoted] = useState(0);
  const [candidates, setCandidates] = useState(0);
  const [elections, setElections] = useState(0);

  useEffect(() => {
    async function getUsers() {
      let res = await axios.get(serverLink + "users");
      let allUsers = res.data.filter((u) => !u.isAdmin);
      setUsers(allUsers.length);
      setVoted(allUsers.filter((u) => u.hasVoted).length);
      res = await axios.get(serverLink + "candidates");
      setCandidates(res.data.length);
      res = await axios.get(serverLink + "elections");
      setElections(res.data.length);
    }
    getUsers();
  }, []);

  return (
    <div className="admin__content">
      <ContentHeader />
      <div
        style={{
          display: "flex",
          width: "100%",
          gap: "15px",
          justifyContent: "space-between",
          flexWrap: "wrap",
        }}
      >
        <DashboardCard title="Voters" data={users} />
        <DashboardCard title="Voted" data={voted} />
        <DashboardCard title="Candidates" data={candidates} />
        <DashboardCard title="Elections" data={elections} />
      </div>
    </div>
  );
};

export default ViewDashboard;
