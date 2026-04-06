require('dotenv').config();
const HDWalletProvider = require('@truffle/hdwallet-provider');

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*", // Match any network id (Ganache local)
    },
    // 🔥 "Real Life" Sepolia Testnet Configuration
    sepolia: {
      provider: () => new HDWalletProvider(
        process.env.PRIVATE_KEY, // Your MetaMask Private Key
        process.env.RPC_URL      // Public Sepolia RPC URL
      ),
      network_id: 11155111,       // Sepolia's network ID
      gas: 5000000,               // Gas limit
      gasPrice: 8000000000,       // 8 Gwei (Lower price to fit your balance!)
      confirmations: 2,           // Wait for 2 confirmations
      timeoutBlocks: 200,         // Time out
      skipDryRun: true            // Skip dry run before migrations
    }
  },
  compilers: {
    solc: {
      version: "0.8.0",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
      },
    },
  },
};
