// main.tsx
import ReactDOM from "react-dom/client";
import App from "./App";
import { GlobalContextProvider } from "./context";
import "./index.css";
import { ThemeProvider } from "./context/ThemeContext";
import ToastProvider from "./lib/ToastProvider";
import './i18n';

ReactDOM.createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <ToastProvider>
      <GlobalContextProvider>
        <App />
      </GlobalContextProvider>
    </ToastProvider>
  </ThemeProvider>
);
