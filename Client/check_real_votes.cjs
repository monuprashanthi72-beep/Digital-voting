const { ethers } = require("ethers");

const contractAddress = "0xC11F4f9C2bed9f07DbD0C3c1662cd23FADC8d2FD";
const contractABI = [
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
      "type": "function"
    }
];

const RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";

async function check() {
    try {
        const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
        const contract = new ethers.Contract(contractAddress, contractABI, provider);
        const txs = await contract.getAllTransaction();
        console.log("TOTAL TRANSACTIONS:", txs.length);
        txs.forEach((tx, i) => {
            console.log(`TX ${i}: Election: ${tx.election_id} | Candidate: ${tx.candidate_id}`);
        });
    } catch (err) {
        console.error("ERROR:", err.message);
    }
}

check();
