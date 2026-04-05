import abi from "./Transaction.json";

export const contractABI = abi.abi;

export const contractAddress = "0x143A995A0eC366e74e77fb6b84C318ceb1964c35"; // Updated contract address after migration.
export const adminAddress = "0x143A995A0eC366e74e77fb6b84C318ceb1964c35"; // Hardcoded Admin Wallet for Demo
// This variable stores the address of the deployed smart contract. If you have deployed your own contract, replace the empty string with the address of your contract.

// If you can't find the `contractAddress` in the compiled `Transaction.json` file,
// you can manually locate the address by finding the appropriate piece of code in the file.
// The address should bishae located under the `"networks"` object, which lists the deployed addresses for different networks.
// For example, if you are using the default Ganache network, the `"networks"` object will contain an entry for network ID `5777`.
// Find the `"address"` field under this entry, and copy the address value into the `contractAddress` variable.