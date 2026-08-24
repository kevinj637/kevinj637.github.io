import { useEffect, useState } from "react"
import { useFadeIn } from "./flyIn"

// Small-screen breakpoint (matches the 600px used elsewhere in the styles).
const SMALL_SCREEN_QUERY = "(max-width: 600px)";

export default function Resume() {
    const {flyInRef, isVisible} = useFadeIn();

    // Track whether the viewport is "too small" for a 100% PDF zoom.
    // On small screens a page-width (100%) render is unreadable, so we
    // fall back to fitting the page by height instead.
    const [isSmallScreen, setIsSmallScreen] = useState(
        () => typeof window !== "undefined" && window.matchMedia(SMALL_SCREEN_QUERY).matches
    );

    useEffect(() => {
        const mql = window.matchMedia(SMALL_SCREEN_QUERY);
        const onChange = (e: MediaQueryListEvent) => setIsSmallScreen(e.matches);
        mql.addEventListener("change", onChange);
        return () => mql.removeEventListener("change", onChange);
    }, []);

    // Default zoom is 100% (page-width). Shrink to page-height when the
    // screen is too small so the document still fits comfortably.
    const zoom = isSmallScreen ? "page-height" : "page-width";
    const pdfSrc = `/public/resume/KevinJiang_ResumeSpring2026.pdf#toolbar=1&navpanes=0&scrollbar=1&zoom=${zoom}`;

    return (
        <div ref={flyInRef} className={`resumeCloud resumeShow ${isVisible ? "show" : ""}`}>
          <iframe
              className="resumeFrame"
              src={pdfSrc}
          />
          <div className="resumeLink" style={{backgroundColor:"white"}}>
              <a href="/public/resume/KevinJiang_ResumeSpring2026.pdf">📖 View Resume</a>
          </div>
        </div>
    )
}
