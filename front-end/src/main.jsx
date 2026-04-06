import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import { ClaimsProvider } from "./context/ClaimsContext.jsx";
import { WalletProvider } from "./context/WalletContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ClaimsProvider>
        <WalletProvider>
          <App />
        </WalletProvider>
      </ClaimsProvider>
    </BrowserRouter>
  </StrictMode>
);
