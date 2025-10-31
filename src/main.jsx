import { LanguageProvider } from "./context/LanguageContext";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import TurnstileGate from "./components/turnstile/TurnstileGate.jsx";

createRoot(document.getElementById("root")).render(
  <LanguageProvider>
    <BrowserRouter>
      <TurnstileGate siteKey="0x4AAAAAAB8wURRUa25hmamv">
        <App />
      </TurnstileGate>
    </BrowserRouter>
  </LanguageProvider>
);
