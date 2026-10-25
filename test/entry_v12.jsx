import React from "react";
import { createRoot } from "react-dom/client";
import App from "./v12.jsx";

// Speicher: im veröffentlichten Artefakt gibt es kein window.storage, daher localStorage mit Reserve im Speicher.
if (!window.storage) {
  const mem = {};
  window.storage = {
    get: async (k) => {
      try { const v = window.localStorage.getItem(k); if (v != null) return { value: v }; } catch (e) {}
      return k in mem ? { value: mem[k] } : null;
    },
    set: async (k, v) => {
      try { window.localStorage.setItem(k, v); } catch (e) { mem[k] = v; }
      return { value: v };
    },
  };
}
createRoot(document.getElementById("root")).render(<App />);
