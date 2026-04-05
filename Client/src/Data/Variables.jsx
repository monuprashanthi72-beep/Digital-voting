export const serverLink = process.env.REACT_APP_SERVER_URL || "https://e-voting-system-8due.onrender.com/api/auth/";
export const clientLink = process.env.REACT_APP_CLIENT_URL || "https://e-voting-system.vercel.app/";
export const facesLink = (process.env.REACT_APP_SERVER_URL || "https://e-voting-system-8due.onrender.com/api/auth/").replace("/api/auth/", "") + "/Faces/";
export const phases = ["init", "voting", "result"];
export const isFaceRecognitionEnable = true;
export const isRegistrationOpen = true; // Enforces Registration Window
