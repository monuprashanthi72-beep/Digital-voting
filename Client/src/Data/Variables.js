const rawLink = process.env.REACT_APP_SERVER_URL || "https://major.onrender.com/api/auth";
export const serverLink = rawLink.endsWith("/") ? rawLink : rawLink + "/";
export const clientLink = process.env.REACT_APP_CLIENT_URL || "http://localhost:3000";
export const facesLink = (process.env.REACT_APP_SERVER_URL || "https://major.onrender.com").replace("/api/auth", "") + "/Faces/";
export const phases = ["init", "voting", "result"];
export const isFaceRecognitionEnable = true;
export const isRegistrationOpen = true; // Enforces Registration Window
