// server/utils/ContractInfo.js
// This file is a server-safe version of Constant.js and Transaction.json
// It avoids the "import type: json" error in Modern Node.js

export const contractAddress = "0x7071c18Ad53B1192D7a4FC692e0bed7109fd3f7d";
export const adminAddress = "0xc1172d54d9db437cfdd867a9b85a7ee4422cbc00";

export const contractABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": false, "internalType": "address", "name": "from", "type": "address" },
      { "indexed": false, "internalType": "address", "name": "receiver", "type": "address" },
      { "indexed": false, "internalType": "string", "name": "user_id", "type": "string" },
      { "indexed": false, "internalType": "string", "name": "election_id", "type": "string" },
      { "indexed": false, "internalType": "string", "name": "candidate_id", "type": "string" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "Transfer",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "admin",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function",
    "constant": true
  },
  {
    "inputs": [],
    "name": "endTime",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function",
    "constant": true
  },
  {
    "inputs": [],
    "name": "startTime",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function",
    "constant": true
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_startTime", "type": "uint256" },
      { "internalType": "uint256", "name": "_endTime", "type": "uint256" }
    ],
    "name": "setElectionPeriod",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address payable", "name": "receiver", "type": "address" },
      { "internalType": "string", "name": "user_id", "type": "string" },
      { "internalType": "string", "name": "election_id", "type": "string" },
      { "internalType": "string", "name": "candidate_id", "type": "string" }
    ],
    "name": "addToBlockchain",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllTransaction",
    "outputs": [
      {
        "components": [
          { "internalType": "address", "name": "from", "type": "address" },
          { "internalType": "address", "name": "receiver", "type": "address" },
          { "internalType": "string", "name": "user_id", "type": "string" },
          { "internalType": "string", "name": "election_id", "type": "string" },
          { "internalType": "string", "name": "candidate_id", "type": "string" },
          { "internalType": "uint256", "name": "timestamp", "type": "uint256" }
        ],
        "internalType": "struct Transaction.TransactionStruct[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function",
    "constant": true
  },
  {
    "inputs": [],
    "name": "getTransactionCount",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function",
    "constant": true
  }
];
