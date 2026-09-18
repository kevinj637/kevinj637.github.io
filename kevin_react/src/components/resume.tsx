import { useEffect, useState } from "react"
import { useFadeIn } from "./flyIn"
import { useMediaItem } from "./loadPriority"

const SMALL_SCREEN_QUERY = "(max-width: 600px)";
const RESUME_PDF = "public/resume/KevinJiang_ResumeSept2026.pdf";

export default function Resume() {
    const {flyInRef, isVisible} = useFadeIn();
    // Registers with the load coordinator (group "resume", after backgrounds).
    const { reportDone } = useMediaItem("resume", RESUME_PDF);
    const [isSmallScreen, setIsSmallScreen] = useState(
        () => typeof window !== "undefined" && window.matchMedia(SMALL_SCREEN_QUERY).matches
    );
    useEffect(() => {
        const mql = window.matchMedia(SMALL_SCREEN_QUERY);
        const onChange = (e: MediaQueryListEvent) => setIsSmallScreen(e.matches);
        mql.addEventListener("change", onChange);
        return () => mql.removeEventListener("change", onChange);
    }, []);
    // The PDF plugin fires no reliable load event, so release the queue on
    // mount rather than waiting on one. The embed fetches its src immediately,
    // so the résumé no longer blocks later groups while it downloads.
    useEffect(() => {
        reportDone();
    }, [reportDone]);
    const zoom = isSmallScreen ? "page-height" : "page-width";
    const pdfSrc = `${RESUME_PDF}#toolbar=1&navpanes=0&scrollbar=1&zoom=${zoom}`;
    return (
        <div ref={flyInRef} className={`resumeCloud resumeShow ${isVisible ? "show" : ""}`}>
          {/* <object> renders its children as fallback when the PDF plugin
              can't display the file, so the message shows automatically. */}
          <object className="resumeFrame" data={pdfSrc} type="application/pdf">
            <p className="resumePreviewUnavailable">
              Inline preview unavailable. Use the link below to open or download the résumé.
            </p>
          </object>
          <div className="resumeLink" style={{backgroundColor:"white"}}>
              <a href={RESUME_PDF}>📖 View Resume</a>
          </div>
        </div>
    )
}
