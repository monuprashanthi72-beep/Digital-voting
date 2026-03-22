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

      return { valid: true, mess: "Vote Casted Successfully" };
    } catch (error) {
      console.error(error);
      return { valid: false, mess: "Transaction Failed" };
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
        transactions,
        isLoggedIn,
        setIsLoggedIn,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};