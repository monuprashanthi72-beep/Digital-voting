const { ethers } = require("ethers");

const contractAddress = "0x7071c18Ad53B1192D7a4FC692e0bed7109fd3f7d";
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
            console.log(`TX ${i}:`);
            console.log(`  User ID: ${tx.user_id}`);
            console.log(`  Election ID: ${tx.election_id}`);
            console.log(`  Candidate ID: ${tx.candidate_id}`);
        });
    } catch (err) {
        console.error("ERROR:", err);
    }
}

check();
