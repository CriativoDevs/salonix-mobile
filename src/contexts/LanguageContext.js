import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import client from "../api/client";

const LanguageContext = createContext({
  language: "pt",
  setLanguage: (lang) => {},
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState("pt");
  const [loading, setLoading] = useState(true);

  // Carregar idioma salvo
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const saved = await AsyncStorage.getItem("app_language");
        if (saved) {
          setLanguageState(saved);
          updateClientHeader(saved);
        } else {
          // Default
          updateClientHeader("pt");
        }
      } catch (e) {
        console.error("Error loading language:", e);
      } finally {
        setLoading(false);
      }
    };
    loadLanguage();
  }, []);

  const updateClientHeader = (lang) => {
    // Ajusta para o formato que o backend Django espera (pt-PT ou en-US)
    // Mas 'pt' e 'en' costumam funcionar se o middleware for flexível.
    // O Django middleware LanguageNegotiationMiddleware aceita 'pt-PT' e 'en'.
    const headerVal = lang === "pt" ? "pt-PT" : "en-US";

    // Atualiza o header padrão do axios client
    client.defaults.headers.common["Accept-Language"] = headerVal;

    console.log(`[Language] Language set to ${lang} (Header: ${headerVal})`);
  };

  const setLanguage = async (lang) => {
    try {
      setLanguageState(lang);
      updateClientHeader(lang);
      await AsyncStorage.setItem("app_language", lang);
    } catch (e) {
      console.error("Error saving language:", e);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};
