const { ethers } = require("ethers");
const RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";
const address = "0x7071c18Ad53B1192D7a4FC692e0bed7109fd3f7d";

async function check() {
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const code = await provider.getCode(address);
    console.log("ADDRESS:", address);
    console.log("CODE LENGTH:", code.length);
    if (code === "0x") {
        console.log("STATUS: NO CONTRACT FOUND AT THIS ADDRESS ON SEPOLIA");
    } else {
        console.log("STATUS: CONTRACT FOUND");
    }
}
check();
