import React, { createContext, useCallback, useState } from "react";

export const RateLimitContext = createContext({
  isRateLimited: false,
  retryAfter: null,
  setRateLimit: () => {},
  clearRateLimit: () => {},
});

export const RateLimitProvider = ({ children }) => {
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [retryAfter, setRetryAfter] = useState(null);

  const setRateLimit = useCallback((seconds) => {
    setIsRateLimited(true);
    setRetryAfter(seconds);

    setTimeout(() => {
      setIsRateLimited(false);
      setRetryAfter(null);
    }, seconds * 1000);
  }, []);

  const clearRateLimit = useCallback(() => {
    setIsRateLimited(false);
    setRetryAfter(null);
  }, []);

  const value = {
    isRateLimited,
    retryAfter,
    setRateLimit,
    clearRateLimit,
  };

  return (
    <RateLimitContext.Provider value={value}>
      {children}
    </RateLimitContext.Provider>
  );
};
