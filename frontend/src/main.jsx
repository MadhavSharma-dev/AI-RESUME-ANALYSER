import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom"; 
import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>  
      <App />
    </BrowserRouter>
  </StrictMode>
);
//BrowserRouter uses the browser's history API to keep the URL in sync with what's rendered.