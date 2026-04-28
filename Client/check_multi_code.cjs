const { ethers } = require("ethers");
const RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";
const addresses = [
    "0x7071c18Ad53B1192D7a4FC692e0bed7109fd3f7d",
    "0xC11F4f9C2bed9f07DbD0C3c1662cd23FADC8d2FD",
    "0x0b8a68b5e4c692e0bed7109fd3f7d" // Guessing based on some common patterns if it was mangled
];

async function check() {
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    for (const address of addresses) {
        try {
            const code = await provider.getCode(address);
            console.log(`ADDRESS: ${address} | CODE LENGTH: ${code.length}`);
        } catch (e) {
            console.log(`ADDRESS: ${address} | ERROR: ${e.message}`);
        }
    }
}
check();
