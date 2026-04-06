import abi from "./Transaction.json";

export const contractABI = abi.abi;

export const contractAddress = "0xC11F4f9C2bed9f07DbD0C3c1662cd23FADC8d2FD"; // Restored Sepolia Address
export const adminAddress = "0xc1172d54d9db437cfdd867a9b85a7ee4422cbc00"; // Updated to match user's current wallet
// This variable stores the address of the deployed smart contract. If you have deployed your own contract, replace the empty string with the address of your contract.

// If you can't find the `contractAddress` in the compiled `Transaction.json` file,
// you can manually locate the address by finding the appropriate piece of code in the file.
// The address should bishae located under the `"networks"` object, which lists the deployed addresses for different networks.
// For example, if you are using the default Ganache network, the `"networks"` object will contain an entry for network ID `5777`.
// Find the `"address"` field under this entry, and copy the address value into the `contractAddress` variable.