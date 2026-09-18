import { useEffect, useState } from "react"
import { useFadeIn } from "./flyIn"

const SMALL_SCREEN_QUERY = "(max-width: 600px)";

export default function Resume() {
    const {flyInRef, isVisible} = useFadeIn();
    const [isSmallScreen, setIsSmallScreen] = useState(
        () => typeof window !== "undefined" && window.matchMedia(SMALL_SCREEN_QUERY).matches
    );
    const [previewFailed, setPreviewFailed] = useState(false);
    useEffect(() => {
        const mql = window.matchMedia(SMALL_SCREEN_QUERY);
        const onChange = (e: MediaQueryListEvent) => setIsSmallScreen(e.matches);
        mql.addEventListener("change", onChange);
        return () => mql.removeEventListener("change", onChange);
    }, []);
    const zoom = isSmallScreen ? "page-height" : "page-width";
    const pdfSrc = `/public/resume/KevinJiang_ResumeSpring2026.pdf#toolbar=1&navpanes=0&scrollbar=1&zoom=${zoom}`;
    return (
        <div ref={flyInRef} className={`resumeCloud resumeShow ${isVisible ? "show" : ""}`}>
          {previewFailed ? (
            <p className="resumePreviewUnavailable">
              Inline preview unavailable. Use the link below to open or download the résumé.
            </p>
          ) : (
            <iframe
              className="resumeFrame"
              src={pdfSrc}
              onError={() => setPreviewFailed(true)}
            />
          )}
          <div className="resumeLink" style={{backgroundColor:"white"}}>
              <a href="/public/resume/KevinJiang_ResumeSpring2026.pdf">📖 View Resume</a>
          </div>
        </div>
    )
}
