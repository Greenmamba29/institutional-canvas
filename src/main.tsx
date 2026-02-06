import { createRoot } from "react-dom/client";

// Initialize skills registry on app start
import "@/skills/init";

import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);