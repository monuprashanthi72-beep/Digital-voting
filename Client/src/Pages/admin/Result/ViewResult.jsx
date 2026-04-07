import React, { useContext, useEffect, useState } from "react";
import { TransactionContext } from "../../../context/TransactionContext";
import { Grid, Toolbar } from "@mui/material";
import ElectionResult from "../../../Components/Admin/ElectionResult";
import ContentHeader from "../../../Components/ContentHeader";
import { getResult } from "../../../Data/Methods";
import axios from "axios";
import { serverLink } from "../../../Data/Variables";

const ViewResult = () => {

  const { getAllTransactions } = useContext(TransactionContext);
  const [result, setResult] = useState([]);

  useEffect(() => {

    async function getData() {
      try {
        const transactions = await getAllTransactions();
        const ans = await getResult(transactions);
        
        // 🏆 WOW FIX: Fetch names from DB to replace IDs
        const electionsRes = await axios.get(serverLink + "/elections");
        const candidatesRes = await axios.get(serverLink + "/candidates");

        const electionsData = electionsRes.data;
        const candidatesData = candidatesRes.data;

        const finalResult = ans.map(item => {
          const election = electionsData.find(e => String(e.id || e._id).trim().toLowerCase() === String(item.election_id).trim().toLowerCase());
          
          const candArray = (election?.candidates || []).map(cid => {
              const candidate = candidatesData.find(c => String(c.id || c._id).trim().toLowerCase() === String(cid).trim().toLowerCase());
              
              const blockchainCountIdx = (item.candidates || []).findIndex(
                bcid => String(bcid).trim().toLowerCase() === String(cid).trim().toLowerCase()
              );
              let count = blockchainCountIdx !== -1 ? item.vote[blockchainCountIdx] : 0;

              return {
                name: candidate ? `${candidate.firstName} ${candidate.lastName || ""}`.trim() : (cid || "Unknown"),
                votes: count
              };
          });

          return {
            ...item,
            election_name: election ? election.name : "Unknown Election",
            candidate_details: candArray
          };
        });

        setResult(finalResult);
      } catch (err) {
        console.error("Error fetching results details:", err);
      }
    }

    getData();

  }, [getAllTransactions]);

  return (
    <div className="admin__content">

      <ContentHeader />

      <div style={{ paddingBottom: 25 }}>

        <Toolbar>

          <Grid container pt={3} spacing={2}>

            {result && result.length > 0 ? (
              result.map((item, index) => (
                <Grid item xs={6} md={4} key={index}>
                  <ElectionResult
                    index={index}
                    title={item.election_name}
                    candidates={item.candidate_details.map(c => `${c.name} (${c.votes} votes)`)}
                    info={item}
                    link={item.election_id}
                  />
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <div style={{ textAlign: "center", width: "100%", padding: "50px", fontSize: "20px", color: "#666" }}>
                  <i className="fas fa-info-circle" style={{ marginRight: "10px" }}></i>
                  No results 
                </div>
              </Grid>
            )}

          </Grid>

        </Toolbar>

      </div>

    </div>
  );
};

export default ViewResult;