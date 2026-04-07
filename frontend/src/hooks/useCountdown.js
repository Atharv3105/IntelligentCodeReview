import { useState, useEffect, useRef } from "react";

/**
 * useCountdown — counts down from initialSeconds to 0
 * @param {number} initialSeconds
 * @param {Function} onExpire - called when timer hits 0
 * @returns {{ timeLeft: number, formattedTime: string, isExpired: boolean }}
 */
export default function useCountdown(initialSeconds, onExpire) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    if (initialSeconds <= 0) {
      onExpireRef.current?.();
      return;
    }

    setTimeLeft(initialSeconds);

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onExpireRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [initialSeconds]);

  const hours   = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  const formattedTime = hours > 0
    ? `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    : `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return { timeLeft, formattedTime, isExpired: timeLeft === 0 };
}
