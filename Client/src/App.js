import React from "react";
import { BrowserRouter, Routes } from "react-router-dom";
import { adminRoutes } from "./Routes/AdminRoutes";
import { userRoutes } from "./Routes/UserRoutes";
import { TransactionProvider } from "./context/TransactionContext";

function App() {

  return (
    <TransactionProvider>

      <BrowserRouter>

        <Routes>

          {userRoutes}

          {adminRoutes}

        </Routes>

      </BrowserRouter>

    </TransactionProvider>
  );

}

export default App;