import { useFadeIn } from "./flyIn"

export default function Resume() {
    const {flyInRef, isVisible} = useFadeIn();
    return (
        <div ref={flyInRef} className={`resumeCloud resumeShow ${isVisible ? "show" : ""}`}>
          <iframe
              src={`/resume/KevinJiang_ResumeSpring2026.pdf#toolbar=1&navpanes=0&scrollbar=1&zoom=page-height`}
              width="90%"
              height="90%"
          />
          <div className="resumeLink" style={{backgroundColor:"white"}}>
              <a href="/resume/KevinJiang_ResumeSpring2026.pdf">📖 View Resume</a>
          </div>
        </div>
    )
}