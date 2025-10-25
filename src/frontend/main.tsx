import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

// Hot Module Replacement
if (import.meta.hot) {
  import.meta.hot.accept();
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);

