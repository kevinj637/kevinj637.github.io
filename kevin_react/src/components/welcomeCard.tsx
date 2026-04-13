import { useState, useEffect } from "react";

function useScrollY() {
  const [scrollY, setScrollY] = useState(0);
  let lastY: number = 0;

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
        if (Math.abs(window.scrollY - lastY) > 10) {
            lastY = scrollY;
            setScrollY(window.scrollY);
            if (scrollY > 200) {
            }
        }
        ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return scrollY;
}

export default function WelcomeCard() {
    const scrollY = useScrollY();
    const [isVisible, setIsVisible] = useState(true);
    const [locked, setLocked] = useState(false);

    useEffect(() => {
    if (scrollY > 199 && !locked) {
        setIsVisible(false);
        setLocked(true);
    }
    }, [scrollY, locked]);

    return (
    <div className={`welcomeCard ${isVisible ? "show" : ""}`}>
        <p> Hello! My name is <b>Kevin Jiang</b> and I am currently a <b>software engineering student</b> at the University of Waterloo!</p>
        <p> Scroll down to see more about me!</p>
      </div>
    )
}