// main.tsx
import ReactDOM from "react-dom/client";
import App from "./App";
import { GlobalContextProvider } from "./context";
import "./index.css";
import { ThemeProvider } from "./context/ThemeContext";
import ToastProvider from "./lib/ToastProvider";
import './i18n';
import { store } from "./redux/store";
import { Provider } from "react-redux";


ReactDOM.createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <ThemeProvider>
      <ToastProvider>
        <GlobalContextProvider>
          <App />
        </GlobalContextProvider>
      </ToastProvider>
    </ThemeProvider>
  </Provider>
);
