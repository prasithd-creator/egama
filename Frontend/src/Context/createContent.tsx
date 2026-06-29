import React, { createContext } from "react";

interface AppContextType {
  BackendUrl: string;
  a: number;
}

export const AppContext = createContext<AppContextType | null>(null);

interface AppContextProviderProps {
  children: React.ReactNode;
}

export const AppContextProvider = ({
  children,
}: AppContextProviderProps) => {
  const BackendUrl = import.meta.env.VITE_BACKENDURL as string;
  const a = 100;

  console.log("BackendUrl:", BackendUrl);

  const contextValue: AppContextType = {
    BackendUrl,
    a,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};