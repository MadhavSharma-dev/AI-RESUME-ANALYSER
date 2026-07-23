import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom"; 
import { GoogleOAuthProvider } from "@react-oauth/google";
import "./index.css";
import App from "./App";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "placeholder_google_client_id";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <BrowserRouter>  
        <App />
      </BrowserRouter>
    </GoogleOAuthProvider>
  </StrictMode>
);
//BrowserRouter uses the browser's history API to keep the URL in sync with what's rendered.