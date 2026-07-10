import { MaterialTailwindControllerProvider } from "@/context";
import { ThemeProvider } from "@material-tailwind/react";
import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import React from "react";
import ReactDOM from "react-dom/client";
import { initReactI18next } from "react-i18next";
import { BrowserRouter } from "react-router-dom";
import "../public/css/tailwind.css";
import App from "./App";
import { AuthProvider } from "./authContext";
import { amTranslations, enTranslations } from "./lang";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      am: { translation: amTranslations },
    },
    fallbackLng: "am",
    interpolation: {
      escapeValue: false,
    },
  });

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* <BrowserRouter> */}
    <AuthProvider>
      <ThemeProvider>
        <MaterialTailwindControllerProvider>
          <App />
        </MaterialTailwindControllerProvider>
      </ThemeProvider>
    </AuthProvider>
    {/* </BrowserRouter> */}
  </React.StrictMode>
);
