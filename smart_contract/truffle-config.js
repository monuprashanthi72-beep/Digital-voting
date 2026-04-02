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
        `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}` // Infura RPC URL
      ),
      network_id: 11155111,       // Sepolia's network ID
      gas: 5500000,               // Gas limit
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
          enabled: false,
          runs: 200,
        },
      },
    },
  },
};
