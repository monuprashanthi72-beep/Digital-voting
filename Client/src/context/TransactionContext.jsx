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
    // 🏆 DEMO FIX: Use Stable Public RPC instead of failing Infura key
    const PUBLIC_RPC = "https://ethereum-sepolia-rpc.publicnode.com";
    const provider = (window.ethereum) ? new ethers.providers.Web3Provider(window.ethereum) : new ethers.providers.JsonRpcProvider(PUBLIC_RPC); 

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
      const response = await axios.post(serverLink + "cast-vote", {
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
      const serverError = error.response?.data?.message || error.message;
      return { success: false, mess: "Vote Failed: " + serverError };
    }
  };

  // ✅ FIXED DATA FETCH (IMPORTANT CHANGE)
  const getAllTransactions = useCallback(async () => {
    // 🏆 RPC REDUNDANCY: Try multiple public nodes for maximum uptime
    const PUBLIC_NODES = [
      "https://ethereum-sepolia-rpc.publicnode.com",
      "https://rpc.ankr.com/eth_sepolia",
      "https://1rpc.io/sepolia",
      "https://eth-sepolia.public.blastapi.io"
    ];

    for (let rpcUrl of PUBLIC_NODES) {
      try {
        const readProvider = new ethers.providers.JsonRpcProvider(rpcUrl);
        const readContract = new ethers.Contract(contractAddress, contractABI, readProvider);

        // Fail early if provider is unresponsive
        await readProvider.getNetwork();

        const data = await readContract.getAllTransaction();
        console.log(`BLOCKCHAIN_SUCCESS (RPC: ${rpcUrl}):`, data);

        if (!data) return [];

        const formatted = data.map((tx) => {
          // Robust access: Handles naming differences and index-based struct returns
          const rid = (tx.election_id || tx.electionId || tx[3] || "").toString();
          const cid = (tx.candidate_id || tx.candidateId || tx[4] || "").toString();
          const uid = (tx.user_id || tx.userId || tx[2] || "").toString();
          
          return {
            election_id: rid,
            candidate_id: cid,
            user_id: uid,
          };
        });

        console.log("BLOCKCHAIN_FINAL_FORMATTED:", formatted);
        setTransactions(formatted);
        return formatted;
      } catch (err) {
        console.warn(`RPC Failed (${rpcUrl}):`, err.message);
        continue; // Try next RPC
      }
    }
    
    console.error("ALL PUBLIC RPC NODES FAILED. Please check network.");
    return [];
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
      if (sessionStorage.getItem("userProfile")) {
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