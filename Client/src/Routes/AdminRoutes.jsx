import React, { useContext } from "react";
import Sidebar from "../Components/Sidebar";
import ViewUser from "../Pages/admin/User/ViewUser.jsx";
import AddUser from "../Pages/admin/User/AddUser";
import { Button } from "@mui/material";
import { Route, Navigate } from "react-router-dom";
import ViewElection from "../Pages/admin/Election/ViewElection";
import AddElection from "../Pages/admin/Election/AddElection";
import ViewCandidate from "../Pages/admin/Candidate/ViewCandidate";
import AddCandidate from "../Pages/admin/Candidate/AddCandidate";
import ViewDashboard from "../Pages/admin/Dashboard/ViewDashboard";
import AdminLogin from "../Pages/admin/AdminLogin";
import AdminLogout from "../Pages/admin/Logout/AdminLogout";
import EditUser from "../Pages/admin/User/EditUser";
import ViewPhase from "../Pages/admin/Phase/ViewPhase";
import EditPhase from "../Pages/admin/Phase/EditPhase";
import ViewResult from "../Pages/admin/Result/ViewResult";
import ViewElectionResult from "../Pages/admin/Result/ViewElectionResult";
import ViewTurnout from "../Pages/admin/Turnout/ViewTurnout";
import { TransactionContext } from "../context/TransactionContext";

const AdminGuard = ({ children }) => {
  const { currentAccount, adminAddress, connectWallet } = useContext(TransactionContext);
  
  // 🏆 EMERGENCY FALLBACK: If blockchain fetch fails, use the hardcoded admin address
  const fallbackAdmin = "0xd050b48a80d6b85ab316087b184fca1aa4b32a83";
  const effectiveAdmin = adminAddress || fallbackAdmin;

  // If page is fully loaded and we have no adminAddress yet, wait (but with our fallback, it won't wait forever)
  if (!effectiveAdmin) return <div style={{ textAlign: "center", marginTop: "50px" }}>Loading Security...</div>;

  if (!currentAccount) {
    return <AdminLogin />;
  }

  if (currentAccount.toLowerCase() !== effectiveAdmin.toLowerCase()) {
    return (
      <div style={{ textAlign: "center", marginTop: "100px", padding: "20px" }}>
        <h1 style={{ color: "#d32f2f" }}>🚫 Access Denied</h1>
        <p>This dashboard is ONLY for the smart contract owner.</p>
        <p><strong>Required Wallet:</strong> {effectiveAdmin}</p>
        <p><strong>Your Wallet:</strong> {currentAccount}</p>
        <Button variant="outlined" color="primary" onClick={connectWallet} style={{ marginTop: "20px" }}>
           Try Connecting Other Account
        </Button>
      </div>
    );
  }

  return children;
};

export const adminRoutes = [
  <Route path="/admin" exact element={<AdminLogin />} key="adminLogin" />,
  <Route path="/admin" element={<AdminGuard><Sidebar /></AdminGuard>} key="adminData">
    <Route
      path="dashboard"
      element={<ViewDashboard />}
      key="adminDashboard"
    ></Route>
    <Route path="user">
      <Route index element={<ViewUser />} />
      <Route path="add" element={<AddUser />} />
      <Route path="edit/:id" element={<EditUser />} />
    </Route>
    <Route path="candidate">
      <Route index element={<ViewCandidate />} />
      <Route path="add" element={<AddCandidate />} />
    </Route>
    <Route path="election">
      <Route index element={<ViewElection />} />
      <Route path="add" element={<AddElection />} />
    </Route>
    <Route path="phase">
      <Route index element={<ViewPhase />} />
      <Route path="edit/:id" element={<EditPhase />} />
    </Route>
    <Route path="result">
      <Route index element={<ViewResult />} />
      <Route path=":id" element={<ViewElectionResult />} />
    </Route>
    <Route path="turnout" element={<ViewTurnout />} />
    <Route path="logout" element={<AdminLogout />}></Route>
  </Route>,
];
