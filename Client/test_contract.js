const { ethers } = require("ethers");
const fs = require("fs");

const contractAddress = "0x7071c18Ad53B1192D7a4FC692e0bed7109fd3f7d";
const abiFile = JSON.parse(fs.readFileSync("./src/utils/Transaction.json"));
const abi = abiFile.abi;

async function main() {
  const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:7545");
  const contract = new ethers.Contract(contractAddress, abi, provider);

  try {
    const code = await provider.getCode(contractAddress);
    console.log("Code at address:", code === "0x" ? "EMPTY! (Contract not deployed here)" : "EXISTS (" + code.substring(0, 10) + "...)");

    const data = await contract.getAllTransaction();
    console.log("Raw Data Length:", data.length);
    if(data.length > 0) {
      console.log("First Tx User ID:", data[0].user_id);
    }
  } catch(e) {
    console.error("Error message:", e.message);
  }
}

main();
