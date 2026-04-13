import { useEffect, useState } from "react";

export default function ScrollHeader() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setHidden(true);
      } else {
        setHidden(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-[2000px] bg-gray-100">
      {/* Top Card */}
      <div
        className={`fixed top-0 left-0 w-full bg-green-500 text-white text-center p-4 transition-transform duration-300 z-50 ${
          hidden ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        This is a top card 👋 — scroll down to hide me
      </div>

      {/* Content */}
      <div className="pt-24 p-6">
        <h1 className="text-2xl font-bold mb-4">Scroll down</h1>
        <p>Keep scrolling to see the card disappear.</p>
      </div>
    </div>
  );
}
