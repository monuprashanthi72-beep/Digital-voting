import React, { useContext, useEffect, useState } from "react";
import { TransactionContext } from "../../../context/TransactionContext";
import { Grid, Toolbar } from "@mui/material";
import ElectionResult from "../../../Components/Admin/ElectionResult";
import ContentHeader from "../../../Components/ContentHeader";
import { getResult } from "../../../Data/Methods";

const ViewResult = () => {

  const { getAllTransactions } = useContext(TransactionContext);
  const [result, setResult] = useState([]);

  useEffect(() => {

    async function getData() {

      const transactions = await getAllTransactions();
      const ans = await getResult(transactions);

      setResult(ans);

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
                    title={"Election"}
                    candidates={item.candidates}
                    info={item}
                    link={item.election_id}
                  />
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <div style={{ textAlign: "center", width: "100%", padding: "50px", fontSize: "20px", color: "#666" }}>
                  <i className="fas fa-info-circle" style={{ marginRight: "10px" }}></i>
                  No results as no casting of vote is done
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