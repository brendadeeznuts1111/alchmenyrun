import { jsx as _jsx } from "react/jsx-runtime";
import { createRoot } from "react-dom/client";
import App from "./App";
// Hot Module Replacement
if (import.meta.hot) {
    import.meta.hot.accept();
}
const root = createRoot(document.getElementById("root"));
root.render(_jsx(App, {}));
