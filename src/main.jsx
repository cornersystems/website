import React from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App.jsx";
import "./styles.css";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  console.warn(
    "VITE_CLERK_PUBLISHABLE_KEY is not set; rendering without Clerk. /crm sign-in is disabled.",
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {PUBLISHABLE_KEY ? (
      <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
        <App />
      </ClerkProvider>
    ) : (
      <App />
    )}
  </React.StrictMode>,
);
