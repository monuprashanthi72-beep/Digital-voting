const { ethers } = require('ethers');
const a = '0xc1172D54D9DB437cfDD867A9B85a7eE4422CbC00'; 
const p = new ethers.providers.JsonRpcProvider('https://ethereum-sepolia-rpc.publicnode.com');
const abi = ['function getTransactionCount() public view returns (uint256)'];

async function run() {
    console.log('--- FINDING VOTES IN ALL YOUR SAFES ---');
    try {
        const nonce = await p.getTransactionCount(a);
        for (let i = 0; i < nonce; i++) {
            const addr = ethers.utils.getContractAddress({ from: a, nonce: i });
            const code = await p.getCode(addr);
            if (code !== '0x') {
                try {
                   const contract = new ethers.Contract(addr, abi, p);
                   const count = await contract.getTransactionCount();
                   console.log('✅ TRACE_VOTES:', count.toString(), 'at Safe:', addr, 'Nonce:', i);
                } catch(e) {}
            }
        }
    } catch(e) { console.error('TRACE_ERR:', e.message); }
    process.exit();
}
run();
