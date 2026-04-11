import React, { createContext, useContext, useEffect, useState } from 'react';
import { useShareIntent } from 'expo-share-intent';

interface ShareIntentContextType {
  value: any;
  hasShareIntent: boolean;
  resetShareIntent: () => void;
  error: string | null;
}

const ShareIntentContext = createContext<ShareIntentContextType | undefined>(undefined);

export const ShareIntentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { hasShareIntent, shareIntent, resetShareIntent, error } = useShareIntent();
  const [activeIntent, setActiveIntent] = useState<any>(null);

  useEffect(() => {
    if (hasShareIntent && shareIntent) {
      // Log for debugging
      console.log('New Share Intent Received:', shareIntent);
      setActiveIntent(shareIntent);
    }
  }, [hasShareIntent, shareIntent]);

  const handleReset = () => {
    resetShareIntent();
    setActiveIntent(null);
  };

  return (
    <ShareIntentContext.Provider
      value={{
        value: activeIntent?.value || activeIntent?.text || '',
        hasShareIntent: !!activeIntent,
        resetShareIntent: handleReset,
        error,
      }}
    >
      {children}
    </ShareIntentContext.Provider>
  );
};

export const useShareIntentContext = () => {
  const context = useContext(ShareIntentContext);
  if (!context) throw new Error('useShareIntentContext must be used within ShareIntentProvider');
  return context;
};
