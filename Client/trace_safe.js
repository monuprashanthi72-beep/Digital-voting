const { ethers } = require('ethers');
const a = '0xc1172D54D9DB437cfDD867A9B85a7eE4422CbC00'; 
const p = new ethers.providers.JsonRpcProvider('https://ethereum-sepolia-rpc.publicnode.com');

async function run() {
    console.log('--- TRACING LATEST SAFE ---');
    try {
        const nonce = await p.getTransactionCount(a);
        // We'll scan for the most recent transaction TO a contract
        // Since I can't browse, I'll check some common nonces.
        
        // Let's see what Nonce 5 and 4 and 3 were!
        // We'll check if they were contract creations or calls.
        for (let i = nonce - 1; i >= 0; i--) {
            const addr = ethers.utils.getContractAddress({ from: a, nonce: i });
            const code = await p.getCode(addr);
            if (code !== '0x') {
                console.log('✅ TRACE_FOUND_SAFE:', addr, 'at NONCE:', i);
                // process.exit(); // Stop once we find the most recent one
            }
        }
    } catch(e) { console.error('TRACE_ERR:', e.message); }
    process.exit();
}
run();
