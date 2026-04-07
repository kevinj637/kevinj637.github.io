import { useEffect, useRef, useState } from "react";

export function useFlyIn(threshold = 0.2, runOnce = false) {
  const flyInRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = flyInRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (runOnce) {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(element);
          }
        }
        else {
          setIsVisible(entry.isIntersecting)
        }
      },
      { threshold }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold]);

  return {flyInRef, isVisible};
}

export const useFadeIn = useFlyIn;