import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { customFetch } from "@workspace/api-client-react";

interface FeatureFlag {
  id: string;
  key: string;
  isEnabled: boolean;
  description: string;
  updatedAt: string;
}

interface FeatureFlagsContextType {
  flags: FeatureFlag[];
  isLoading: boolean;
  isFeatureEnabled: (key: string) => boolean;
  refreshFlags: () => Promise<void>;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextType | undefined>(undefined);

export function FeatureFlagsProvider({ children }: { children: ReactNode }) {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshFlags = async () => {
    try {
      const data = await customFetch<FeatureFlag[]>("/api/flags");
      if (Array.isArray(data)) {
        // Map any DB snake_case to camelCase just in case, though the schema is camelCase
        const formattedFlags = data.map((f: any) => ({
          id: f.id,
          key: f.key,
          isEnabled: f.isEnabled !== undefined ? f.isEnabled : f.is_enabled,
          description: f.description,
          updatedAt: f.updatedAt || f.updated_at,
        }));
        setFlags(formattedFlags);
      }
    } catch (err) {
      console.warn("Failed to fetch feature flags from backend:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshFlags();
    const interval = setInterval(refreshFlags, 10000); // Poll database flags every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const isFeatureEnabled = (key: string): boolean => {
    const flag = flags.find((f) => f.key === key);
    return flag ? flag.isEnabled : true; // Default to true if not found to avoid lockouts
  };

  return (
    <FeatureFlagsContext.Provider value={{ flags, isLoading, isFeatureEnabled, refreshFlags }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export function useFeatureFlags() {
  const ctx = useContext(FeatureFlagsContext);
  if (!ctx) throw new Error("useFeatureFlags must be used within FeatureFlagsProvider");
  return ctx;
}
