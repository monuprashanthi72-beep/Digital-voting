import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { contractABI, contractAddress } from "../utils/Constant";

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
      const contract = createEthereumContract();

      const tx = await contract.addToBlockchain(
        currentAccount,
        user_id,
        election_id,
        candidate_id
      );

      await tx.wait();

      // ✅ FORCE REFRESH AFTER TX
      await getAllTransactions();

      return { success: true, hash: tx.hash, mess: "Vote Casted Successfully" };
    } catch (error) {
      console.error(error);
      return { success: false, mess: "Transaction Failed" };
    }
  };

  // ✅ FIXED DATA FETCH (IMPORTANT CHANGE)
  const getAllTransactions = useCallback(async () => {
    try {
      const contract = createEthereumContract();

      const data = await contract.getAllTransaction();

      console.log("RAW:", data);

      // 🔥 IMPORTANT FIX → PROPER STRING CONVERSION
      const formatted = data.map((tx) => ({
        election_id: tx.election_id.toString(),
        candidate_id: tx.candidate_id.toString(),
        user_id: tx.user_id.toString(),
      }));

      console.log("FORMATTED:", formatted);

      setTransactions(formatted);

      return formatted;
    } catch (error) {
      console.error(error);
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