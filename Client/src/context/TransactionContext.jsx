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

  const getAllTransactions = useCallback(async () => {
    const PUBLIC_NODES = [
      "http://127.0.0.1:7545", 
      "https://ethereum-sepolia-rpc.publicnode.com",
      "https://rpc.ankr.com/eth_sepolia",
      "https://1rpc.io/sepolia",
      "https://eth-sepolia.public.blastapi.io"
    ];

    const POSSIBLE_ADDRESSES = [
        "0x143A995A0eC366e74e77fb6b84C318ceb1964c35",
        "0x7071c18Ad53B1192D7a4FC692e0bed7109fd3f7d",
        contractAddress
    ];

    
    const results = await Promise.all(
      [...new Set(POSSIBLE_ADDRESSES.filter(Boolean))].map(async (currentAddr) => {
        // Try nodes in parallel, but pick the first one that successfully returns data
        for (let rpcUrl of PUBLIC_NODES) {
          try {
            // Set a very short timeout for local Ganache to prevent lag
            const timeout = rpcUrl.includes("127.0.0.1") ? 500 : 3000;
            const readProvider = new ethers.providers.JsonRpcProvider({ url: rpcUrl, timeout });
            const readContract = new ethers.Contract(currentAddr, contractABI, readProvider);
            const data = await readContract.getAllTransaction();

            if (!data) return [];

            return data.map((tx) => ({
              election_id: (tx.election_id || tx.electionId || tx[3] || "").toString().trim(),
              candidate_id: (tx.candidate_id || tx.candidateId || tx[4] || "").toString().trim(),
              user_id: (tx.user_id || tx.userId || tx[2] || "").toString().trim(),
            }));
          } catch (err) {
            continue; 
          }
        }
        return [];
      })
    );

    const allCollected = results.flat();
    
    // 🏆 DE-DUPLICATE VOTES: Ensure we don't double count if data is in multiple contracts
    const uniqueVotes = [];
    const voteTracker = new Set();

    allCollected.forEach(v => {
      // Robust key: lowercase and trimmed
      const key = `${v.user_id.toLowerCase()}-${v.election_id.toLowerCase()}`;
      if (!voteTracker.has(key)) {
        voteTracker.add(key);
        uniqueVotes.push(v);
      }
    });

    setTransactions(uniqueVotes);
    return uniqueVotes;
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