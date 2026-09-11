import { useContext } from "react";
import { ClientAuthContext } from "../contexts/ClientAuthContext";

export const useClientAuth = () => {
  const context = useContext(ClientAuthContext);
  if (!context) {
    throw new Error("useClientAuth must be used within ClientAuthProvider");
  }
  return context;
};
