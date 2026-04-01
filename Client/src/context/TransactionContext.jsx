import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { contractABI, contractAddress } from "../utils/Constant";
import { serverLink } from "../Data/Variables";
import axios from "axios";

export const TransactionContext = React.createContext();

const { ethereum } = window;

export const TransactionProvider = ({ children }) => {
  const [currentAccount, setCurrentAccount] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);


  const createEthereumContract = () => {
    if (!ethereum) return null;

    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();

    return new ethers.Contract(
      contractAddress,
      contractABI.abi ? contractABI.abi : contractABI,
      signer
    );
  };

  const connectWallet = async () => {
    if (!ethereum) return alert("Install MetaMask");
    const accounts = await ethereum.request({
      method: "eth_requestAccounts",
    });
    setCurrentAccount(accounts[0]);
  };

  // ✅ FIXED TRANSACTION
  const sendTransaction = async (election_id, candidate_id, user_id) => {
    try {
      console.log(`[FRONTEND] Requesting gasless vote for ${candidate_id}...`);
      const response = await axios.post(serverLink + "cast-vote", {
        election_id,
        candidate_id,
        user_id
      });

      if (response.data.success) {
        await getAllTransactions();
        return { 
          success: true, 
          hash: response.data.hash, 
          mess: "Vote Casted Successfully on Blockchain via Server Relayer." 
        };
      } else {
        return { success: false, mess: response.data.message || "Server rejected transaction." };
      }
    } catch (error) {
      console.error(error);
      return { success: false, mess: "Could not connect to back-end relayer." };
    }
  };

  // ✅ FIXED DATA FETCH (IMPORTANT CHANGE)
  const getAllTransactions = useCallback(async () => {
    try {
      console.log("[FRONTEND] Fetching blockchain transactions via server...");
      const response = await axios.get(serverLink + "get-transactions");
      
      const formatted = response.data.map((tx) => ({
        election_id: tx.election_id,
        candidate_id: tx.candidate_id,
        user_id: tx.user_id,
      }));

      setTransactions(formatted);
      return formatted;
    } catch (error) {
      console.error("[FRONTEND] Failed to sync with blockchain:", error);
      return [];
    }
  }, []);

  const getElectionTimes = async () => {
    try {
      const contract = createEthereumContract();
      const start = await contract.startTime();
      const end = await contract.endTime();
      return { start: start.toNumber(), end: end.toNumber() };
    } catch (error) {
      console.error(error);
      return { start: 0, end: 0 };
    }
  };

  const setElectionTimes = async (startTimeUnix, endTimeUnix) => {
    try {
      if (!ethereum) return alert("Please install MetaMask.");
      const transactionsContract = createEthereumContract();
      const transactionHash = await transactionsContract.setElectionPeriod(startTimeUnix, endTimeUnix);
      console.log(`Loading - ${transactionHash.hash}`);
      await transactionHash.wait();
      console.log(`Success - ${transactionHash.hash}`);
      return { success: true };
    } catch (error) {
      console.error(error);
      return { success: false, message: error.message };
    }
  };

  useEffect(() => {
    if (ethereum) {
      getAllTransactions();
    }
  }, [currentAccount, getAllTransactions]);

  return (
    <TransactionContext.Provider
      value={{
        connectWallet,
        currentAccount,
        sendTransaction,
        getAllTransactions,
        getElectionTimes,
        setElectionTimes,
        transactions,
        isLoggedIn,
        setIsLoggedIn,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};