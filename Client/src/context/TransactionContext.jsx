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
      const serverError = error.response?.data?.message || error.message;
      return { success: false, mess: "Vote Failed: " + serverError };
    }
  };

  const getAllTransactions = useCallback(async (forceRefresh = false) => {
    // 🏆 SPEED FIX: Check session storage first for extremely fast page transitions
    const cached = sessionStorage.getItem("blockchain_votes_cache");
    const cacheTime = sessionStorage.getItem("blockchain_votes_time");
    const now = Date.now();

    if (!forceRefresh && cached && cacheTime && (now - parseInt(cacheTime)) < 60000) {
      const data = JSON.parse(cached);
      setTransactions(data);
      return data;
    }

    const PUBLIC_NODES = [
      "https://ethereum-sepolia-rpc.publicnode.com",
      "https://rpc.ankr.com/eth_sepolia",
      "https://1rpc.io/sepolia",
      "https://rpc.builder0x69.io/sepolia" 
    ];

    const targetAddr = contractAddress || "0xC11F4f9C2bed9f07DbD0C3c1662cd23FADC8d2FD";
    
    const fetchFromNode = async (rpcUrl) => {
      try {
        const readProvider = new ethers.providers.JsonRpcProvider({ url: rpcUrl, timeout: 4000 });
        const readContract = new ethers.Contract(targetAddr, contractABI, readProvider);
        const data = await readContract.getAllTransaction();
        if (!data) throw new Error("No data");
        return data.map((tx) => ({
          election_id: (tx.election_id || tx.electionId || tx[3] || "").toString().trim(),
          candidate_id: (tx.candidate_id || tx.candidateId || tx[4] || "").toString().trim(),
          user_id: (tx.user_id || tx.userId || tx[2] || "").toString().trim(),
        }));
      } catch (e) {
        throw new Error(rpcUrl + " failed");
      }
    };

    try {
      // 🏆 RELIABILITY FIX: Use Promise.all with individual error handling 
      // This is more broadly supported and stable than Promise.race for some RPC providers
      const results = await Promise.allSettled(PUBLIC_NODES.map(fetchFromNode));
      const allFound = results.filter(r => r.status === "fulfilled").map(r => r.value).flat();
      
      const uniqueVotes = [];
      const voteTracker = new Set();
      allFound.forEach(v => {
        const key = `${v.user_id.toLowerCase()}-${v.election_id.toLowerCase()}`;
        if (!voteTracker.has(key)) {
          voteTracker.add(key);
          uniqueVotes.push(v);
        }
      });

      sessionStorage.setItem("blockchain_votes_cache", JSON.stringify(uniqueVotes));
      sessionStorage.setItem("blockchain_votes_time", now.toString());

      setTransactions(prev => {
        if (prev.length === uniqueVotes.length && JSON.stringify(prev) === JSON.stringify(uniqueVotes)) return prev;
        return uniqueVotes;
      });
      return uniqueVotes;
    } catch (err) {
      console.error("Blockchain error:", err);
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
      await transactionHash.wait();
      return { success: true };
    } catch (error) {
      console.error(error);
      return { success: false, message: error.message };
    }
  };

  useEffect(() => {
    async function init() {
      const { adminAddress: masterAdmin } = await import("../utils/Constant");
      setAdminAddress(masterAdmin.toLowerCase());
      if (sessionStorage.getItem("userProfile")) {
        setIsLoggedIn(true);
      }
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