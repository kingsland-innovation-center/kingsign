"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface PublicAuthContextType {
  token: string | null;
  setToken: (token: string) => void;
  clearToken: () => void;
}

const PublicAuthContext = createContext<PublicAuthContextType | undefined>(undefined);

export function PublicAuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);

  const setToken = (newToken: string) => {
    setTokenState(newToken);
    // Store token in localStorage for persistence
    localStorage.setItem("public_auth_token", newToken);
  };

  const clearToken = () => {
    setTokenState(null);
    localStorage.removeItem("public_auth_token");
  };

  // Load token from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("public_auth_token");
    if (storedToken) {
      setTokenState(storedToken);
    }
  }, []);

  return (
    <PublicAuthContext.Provider value={{ token, setToken, clearToken }}>
      {children}
    </PublicAuthContext.Provider>
  );
}

export function usePublicAuth() {
  const context = useContext(PublicAuthContext);
  if (context === undefined) {
    throw new Error("usePublicAuth must be used within a PublicAuthProvider");
  }
  return context;
} 