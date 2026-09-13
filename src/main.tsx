import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { applyTheme, resolveTheme } from "./theme";
import "./styles.css";
import { registerSW } from "virtual:pwa-register";

// The service worker (R3): the built app caches itself and updates quietly
// on the next open. Nothing about the wall's data goes through it.
registerSW({ immediate: true });

applyTheme(resolveTheme());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
