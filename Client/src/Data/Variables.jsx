// Server Base URL (Render)
export const serverLink = "https://e-voting-backend.onrender.com/api/v1/";

// Specific Data Links (Based on standard structure)
export const facesLink = serverLink + "uploads/faces/";
export const electionLink = serverLink + "uploads/elections/";
export const candidateLink = serverLink + "uploads/candidates/";

// Registration Fields Configuration
export const signupOptions = [
  { label: "Full Name", name: "fname", type: "text", required: true },
  { label: "Voter ID", name: "voterId", type: "text", required: true },
  { label: "Email Address", name: "email", type: "email", required: true },
  { label: "Mobile Number", name: "mobile", type: "tel", required: true },
  { label: "Password", name: "password", type: "password", required: true },
];

/**
 * Election Phases Configuration
 * 0 - Registration
 * 1 - Voting
 * 2 - Results
 */
export const phases = [
  { id: 0, label: "Registration", description: "Voters can register themselves." },
  { id: 1, label: "Voting", description: "The election is active and votes are being cast." },
  { id: 2, label: "Results", description: "The election is finished and results are available." }
];

// Admin Authorized Wallet (Sepolia Testnet)
export const adminAddress = "0x76B519871799d0db01039f3Ccf190cb1C6848889";
