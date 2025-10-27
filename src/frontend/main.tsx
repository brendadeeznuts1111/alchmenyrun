import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

// Hot Module Replacement
if ((import.meta as any).hot) {
  (import.meta as any).hot.accept();
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
