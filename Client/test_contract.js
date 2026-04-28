const { ethers } = require("ethers");

async function main() {
  const contractAddress = "0xC11F4f9C2bed9f07DbD0C3c1662cd23FADC8d2FD";
  const contractABI = [
    "function getAllTransaction() public view returns (tuple(address from, address receiver, string user_id, string election_id, string candidate_id, uint256 timestamp)[])"
  ];
  
  const provider = new ethers.providers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
  const contract = new ethers.Contract(contractAddress, contractABI, provider);
  
  try {
    const data = await contract.getAllTransaction();
    console.log("Found", data.length, "transactions");
    if (data.length > 0) {
      console.log("Sample tx:");
      console.log(data[0]);
      console.log("user_id:", data[0].user_id || data[0][2]);
      console.log("election_id:", data[0].election_id || data[0][3]);
      console.log("candidate_id:", data[0].candidate_id || data[0][4]);
    }
  } catch(e) {
    console.error(e);
  }
}

main();
