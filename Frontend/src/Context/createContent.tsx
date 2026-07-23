import React, { createContext, useState } from "react";

interface AppContextType {
  BackendUrl: string;
  voiceModel: string;
  setVoiceModel: (value: string) => void;
}

export const AppContext = createContext<AppContextType | null>(null);

interface AppContextProviderProps {
  children: React.ReactNode;
}

export const AppContextProvider = ({
  children,
}: AppContextProviderProps) => {
  const BackendUrl = import.meta.env.VITE_BACKENDURL as string;
  const [voiceModel, setVoiceModel] = useState<string>("brandon");

  console.log("BackendUrl:", BackendUrl);

  const contextValue: AppContextType = {
    BackendUrl,
    voiceModel,
     setVoiceModel,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};