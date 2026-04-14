import React, { useContext, useEffect, useState } from "react";
import { TransactionContext } from "../../../context/TransactionContext";
import { Grid, Toolbar, CardActions, Button } from "@mui/material";
import ElectionResult from "../../../Components/Admin/ElectionResult";
import ContentHeader from "../../../Components/ContentHeader";
import { getResult } from "../../../Data/Methods";
import axios from "axios";
import { serverLink } from "../../../Data/Variables";

const ViewResult = () => {
  const { getAllTransactions, transactions } = useContext(TransactionContext);
  const [result, setResult] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getData() {
      try {
        setLoading(true);
        // 🏆 STABILITY FIX: Rely on context's transactions. 
        // Only trigger a fetch if transactions are completely missing.
        const [electionsRes, candidatesRes] = await Promise.all([
          axios.get(serverLink + "/elections"),
          axios.get(serverLink + "/candidates")
        ]);

        const electionsData = electionsRes.data;
        const candidatesData = candidatesRes.data;
        
        // Use either the current context transactions or fetch once if empty
        let currentTx = transactions;
        if (currentTx.length === 0) {
           // We only call this if we REALLY have no data yet
           // To avoid loops, we don't put this in a dependency-triggered path easily
           console.log("ViewResult: No transactions in context, fetching...");
        }

        const blockchainResult = await getResult(currentTx);

        // 🏆 FIX: Show ALL elections that are in 'result' phase from DB
        const activeElections = electionsData.filter(e => e.currentPhase === "result");
        
        const finalResult = activeElections.map(election => {
          const eid = String(election.id || election._id).trim().toLowerCase();
          
          // Find matching blockchain record
          const bcMatch = blockchainResult.find(r => String(r.election_id).trim().toLowerCase() === eid);
          
          const candArray = (election.candidates || []).map(cid => {
              const candidate = candidatesData.find(
                c => (String(c.id || c._id).trim().toLowerCase() === String(cid).trim().toLowerCase()) ||
                     (String(c.username || "").trim().toLowerCase() === String(cid).trim().toLowerCase())
              );
              
              let count = 0;
              if (bcMatch) {
                const blockchainCountIdx = (bcMatch.candidates || []).findIndex(
                  bcid => String(bcid).trim().toLowerCase() === String(cid).trim().toLowerCase()
                );
                count = blockchainCountIdx !== -1 ? bcMatch.vote[blockchainCountIdx] : 0;
              }

              return {
                id: cid,
                name: candidate ? `${candidate.firstName} ${candidate.lastName || ""}`.trim() : "Unknown",
                avatar: candidate?.avatar,
                avatarBase64: candidate?.avatarBase64,
                votes: count
              };
          });

          return {
            election_id: election.id || election._id,
            election_name: election.name,
            candidates_raw: election.candidates || [],
            candidate_details: candArray,
            rawBlockchain: bcMatch
          };
        });

        setResult(finalResult);
      } catch (err) {
        console.error("Error fetching results details:", err);
      } finally {
        setLoading(false);
      }
    }

    getData();

  }, [transactions]); // Remove getAllTransactions from here to prevent loops if it updates transactions state internally

  if (loading && result.length === 0) {
    return (
      <div className="admin__content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner-border text-primary" role="status"></div>
          <p style={{ marginTop: '20px', fontSize: '18px', color: '#555' }}>🗳️ Loading blockchain results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin__content">
      <ContentHeader />
      <div style={{ paddingBottom: 25 }}>
        <Toolbar>
          <Grid container pt={3} spacing={2}>
            {result && result.length > 0 ? (
              result.map((item, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <ElectionResult
                    index={index}
                    title={item.election_name}
                    candidates={item.candidate_details.map(c => `${c.name} (${c.votes} votes)`)}
                    info={item}
                    link={item.election_id}
                  />
                  <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                    <Button 
                      variant="outlined"
                      size="small" 
                      color="error" 
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (window.confirm("Are you sure you want to delete this election result? This will remove it from the dashboard.")) {
                          try {
                            await axios.get(serverLink + "election/delete/" + item.election_id);
                            setResult(prev => prev.filter(r => r.election_id !== item.election_id));
                          } catch (err) {
                            alert("Failed to delete election.");
                          }
                        }
                      }}
                    >
                      DELETE ELECTION
                    </Button>
                  </CardActions>
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <div style={{ textAlign: "center", width: "100%", padding: "80px", fontSize: "20px", color: "#888" }}>
                  <i className="fas fa-poll" style={{ fontSize: '50px', display: 'block', marginBottom: '20px' }}></i>
                  No elections found in Result mode.
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