import { useEffect, useState } from "react"
import { useFadeIn } from "./flyIn"
import { useMediaItem } from "./loadPriority"

const SMALL_SCREEN_QUERY = "(max-width: 600px)";
const RESUME_PDF = "/resume/KevinJiang_ResumeSpring2026.pdf";

export default function Resume() {
    const {flyInRef, isVisible} = useFadeIn();
    // Résumé loads right after the background clouds. It registers with the
    // load coordinator using a stable URL (the bare PDF path, without the
    // view-dependent #zoom hash) so screen-size changes don't re-register it.
    // Not interruptible — it always loads straight through before projects.
    const { src, reportDone } = useMediaItem("resume", RESUME_PDF);
    const canLoad = !!src;
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
    // If the preview fails, there is nothing left to load for this item, so
    // release the queue immediately.
    useEffect(() => {
        if (previewFailed) reportDone();
    }, [previewFailed, reportDone]);
    const zoom = isSmallScreen ? "page-height" : "page-width";
    const pdfSrc = `${RESUME_PDF}#toolbar=1&navpanes=0&scrollbar=1&zoom=${zoom}`;
    return (
        <div ref={flyInRef} className={`resumeCloud resumeShow ${isVisible ? "show" : ""}`}>
          {previewFailed ? (
            <p className="resumePreviewUnavailable">
              Inline preview unavailable. Use the link below to open or download the résumé.
            </p>
          ) : (
            <iframe
              className="resumeFrame"
              src={canLoad ? pdfSrc : undefined}
              onLoad={() => { if (canLoad) reportDone(); }}
              onError={() => setPreviewFailed(true)}
            />
          )}
          <div className="resumeLink" style={{backgroundColor:"white"}}>
              <a href={RESUME_PDF}>📖 View Resume</a>
          </div>
        </div>
    )
}
