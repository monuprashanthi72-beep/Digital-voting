import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { contractABI, contractAddress } from "../utils/Constant";

export const TransactionContext = React.createContext();

const { ethereum } = window;

export const TransactionProvider = ({ children }) => {
  const [currentAccount, setCurrentAccount] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [adminAddress, setAdminAddress] = useState("");


  const createEthereumContract = (useSigner = false) => {
    // 🏆 DEMO FIX: Use MetaMask provider directly to avoid 401 Infura errors
    const provider = (window.ethereum) ? new ethers.providers.Web3Provider(window.ethereum) : new ethers.providers.JsonRpcProvider("https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161"); 

    if (ethereum && currentAccount) {
      const web3Provider = new ethers.providers.Web3Provider(ethereum);
      const signer = web3Provider.getSigner();
      return new ethers.Contract(contractAddress, contractABI, signer);
    }
    
    return new ethers.Contract(contractAddress, contractABI, provider);
  };

  const connectWallet = async () => {
    try {
      if (!ethereum) return; 
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  };

  // ✅ FIXED TRANSACTION
  // ✅ GASLESS TRANSACTION (VIA BACKEND)
  const sendTransaction = async (election_id, candidate_id, user_id) => {
    try {
      const { serverLink } = await import("../Data/Variables");
      const axios = (await import("axios")).default;

      // Voters don't need MetaMask! The server signs it.
      const response = await axios.post(serverLink + "/cast-vote", {
        election_id,
        candidate_id,
        user_id,
        voter_wallet: currentAccount || "0x0000000000000000000000000000000000000000"
      });

      if (response.data.success) {
        await getAllTransactions(); // Force Refresh
        return { success: true, hash: response.data.hash, mess: "Vote Casted Successfully" };
      } else {
        return { success: false, mess: response.data.message || "Transaction Failed" };
      }
    } catch (error) {
      console.error(error);
      return { success: false, mess: "Vote Failed: Check Connection" };
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
      // 🏆 SILENT ERROR: If the contract is not deployed on this network, fail gracefully.
      console.warn("Blockchain Data Error: Smart contract call failed or reverted (Method: getAllTransaction).");
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
    async function init() {
      // 🏆 SUPER-FAST DEMO MODE: Use hardcoded admin from Constant.js
      const { adminAddress: masterAdmin } = await import("../utils/Constant");
      setAdminAddress(masterAdmin.toLowerCase());

      // 2. Restore login status
      if (localStorage.getItem("userProfile")) {
        setIsLoggedIn(true);
      }

      // 3. Load transactions in the background (no blocking)
      getAllTransactions();
    }
    init();
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
        adminAddress,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};