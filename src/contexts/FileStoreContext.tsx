import { createContext, useContext, useState, ReactNode } from "react";

interface UploadedFile {
  name: string;
  content: string;
  category: "revenue" | "expense" | "other";
  type: string;
}

interface FileStoreContextType {
  dashboardFiles: UploadedFile[];
  setDashboardFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>;
  analyticsFiles: { name: string; content: string; type: string }[];
  setAnalyticsFiles: React.Dispatch<React.SetStateAction<{ name: string; content: string; type: string }[]>>;
}

const FileStoreContext = createContext<FileStoreContextType | null>(null);

export const FileStoreProvider = ({ children }: { children: ReactNode }) => {
  const [dashboardFiles, setDashboardFiles] = useState<UploadedFile[]>([]);
  const [analyticsFiles, setAnalyticsFiles] = useState<{ name: string; content: string; type: string }[]>([]);

  return (
    <FileStoreContext.Provider value={{ dashboardFiles, setDashboardFiles, analyticsFiles, setAnalyticsFiles }}>
      {children}
    </FileStoreContext.Provider>
  );
};

export const useFileStore = () => {
  const ctx = useContext(FileStoreContext);
  if (!ctx) throw new Error("useFileStore must be used within FileStoreProvider");
  return ctx;
};
