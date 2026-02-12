import React, {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { DeviceEventEmitter } from "react-native";

export const RateLimitContext = createContext({
  isRateLimited: false,
  retryAfter: null,
  setRateLimit: () => {},
  clearRateLimit: () => {},
});

export const useRateLimit = () => React.useContext(RateLimitContext);

export const RateLimitProvider = ({ children }) => {
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [retryAfter, setRetryAfter] = useState(null);
  const timeoutRef = useRef(null);

  const setRateLimit = useCallback((seconds) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsRateLimited(true);
    setRetryAfter(seconds);

    timeoutRef.current = setTimeout(() => {
      setIsRateLimited(false);
      setRetryAfter(null);
      timeoutRef.current = null;
    }, seconds * 1000);
  }, []);

  const clearRateLimit = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsRateLimited(false);
    setRetryAfter(null);
  }, []);

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      "api-rate-limit",
      (payload) => {
        const seconds = Number(payload?.retryAfter) || 60;
        setRateLimit(seconds);
      },
    );

    return () => {
      subscription.remove();
    };
  }, [setRateLimit]);

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
