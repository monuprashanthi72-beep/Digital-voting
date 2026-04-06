const { ethers } = require('ethers');
const a = '0xc1172D54D9DB437cfDD867A9B85a7eE4422CBC00'; 
const p = new ethers.providers.JsonRpcProvider('https://ethereum-sepolia-rpc.publicnode.com');

async function run() {
    try {
        console.log('SCANNING HISTORY FOR:', a);
        // Find transactions sent from this account
        // Wait, ethers doesn't allow easy history scanning without an indexer.
        // But we have the Private Key! We can try to find the transactions.
        
        // Let's try to get the transaction hashes from a public API if we could, 
        // but we can try to guess or use the getTransactionReceipt if we had the hash.
        
        // Better: I'll check a few recent transactions if I could.
        // Actually, since I can't browse Etherscan, I'll check if the 2 transactions 
        // were sent to either 0x143A or 0x7071.
        
        console.log('Searching for interactions with known contracts...');
        const contracts = ['0x143A995A0eC366e74e77fb6b84C318ceb1964c35', '0x7071c18Ad53B1192D7a4FC692e0bed7109fd3f7d'];
        for(let c of contracts) {
            const code = await p.getCode(c);
            console.log('Contract:', c, 'Code:', code === '0x' ? 'EMPTY' : 'DEPLOYED');
        }
        
    } catch(e) { console.error('SCAN_ERR:', e.message); }
    process.exit();
}
run();
