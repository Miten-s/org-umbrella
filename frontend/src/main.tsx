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
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";


ReactDOM.createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <ThemeProvider>
      <ToastProvider>
        <I18nextProvider i18n={i18n}>

        <GlobalContextProvider>
          <App />
        </GlobalContextProvider>
        </I18nextProvider>
      </ToastProvider>
    </ThemeProvider>
  </Provider>
);
