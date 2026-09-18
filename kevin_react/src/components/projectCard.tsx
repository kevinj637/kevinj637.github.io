import type { ProjectCardProps } from "@/interfaces/projectCard";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useFlyIn } from "./flyIn";
import { useMediaItem, useRequestPriority } from "./loadPriority";
import "@/App.css"

/**
 * Registers ONE project image URL with the load coordinator (group "projects",
 * which IS interruptible) and renders it as a hidden <img> so the browser
 * actually fetches it when the coordinator activates it. Reports back to the
 * card when the image has loaded (or errored) so the visible crossfade only
 * cycles images that are truly available. Kept separate from the displayed
 * <img>s so that EVERY image in a card is registered/queued up front, not just
 * the two currently on screen.
 */
function ProjectImageRegistrar({
  url,
  onReady,
}: {
  url: string;
  onReady: (url: string) => void;
}) {
  const { src, reportDone } = useMediaItem("projects", url);
  const settle = useCallback(() => {
    reportDone();     // advance the sequential queue
    onReady(url);     // tell the card this image is now available
  }, [reportDone, onReady, url]);
  const fail = useCallback(() => {
    reportDone();     // a broken image must not stall the queue
  }, [reportDone]);

  if (!src) return null;
  return (
    <img
      src={src}
      alt=""
      aria-hidden
      decoding="async"
      fetchPriority="high"
      style={{ display: "none" }}
      onLoad={settle}
      onError={fail}
    />
  );
}

export default function ProjectCard({title, description, date, linkTo, imageLinks, videoLink, attachDocument, backgroundColour, titleColour }: ProjectCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(1);
  const [isFading, setIsFading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const requestPriority = useRequestPriority();
  // Which image URLs have actually loaded (crossfade only cycles these).
  const [loaded, setLoaded] = useState<Set<string>>(() => new Set());
  const onReady = useCallback((url: string) => {
    setLoaded((prev) => (prev.has(url) ? prev : new Set(prev).add(url)));
  }, []);
  // Touch / no-hover devices: hover can't drive the expand, so tap does.
  const isTouch = typeof window !== "undefined" &&
    window.matchMedia?.("(hover: none)").matches;
  const distanceX = (Math.random() * -180 - 90) * (Math.round(Math.random()) * -2 + 1);
  const distanceY = (Math.random() - 0.5) * 150;
  const hoverType = Math.floor(Math.random() * 3)

  const {flyInRef, isVisible} = useFlyIn();

  // Indices of images that have loaded, for cycling the crossfade.
  const loadedIndices = useMemo(
    () => (imageLinks ?? []).map((u, i) => (loaded.has(u) ? i : -1)).filter((i) => i >= 0),
    [imageLinks, loaded]
  );

  // Make sure the visible image is one that has actually loaded. If the
  // current index hasn't arrived yet (common on slow connections where images
  // load out of order), snap to the first loaded image so the card shows
  // something as soon as anything is available.
  useEffect(() => {
    if (loadedIndices.length === 0) return;
    if (!loadedIndices.includes(currentIndex)) {
      setCurrentIndex(loadedIndices[0]);
      setNextIndex(loadedIndices[Math.min(1, loadedIndices.length - 1)]);
    }
  }, [loadedIndices, currentIndex]);

  // Crossfade only among images that have finished loading. On slow
  // connections this means the card simply shows whatever has arrived rather
  // than flashing empty frames for not-yet-loaded images.
  useEffect(() => {
    if (loadedIndices.length < 2) return;
    const interval = setInterval(() => {
      setCurrentIndex((cur) => {
        const pos = loadedIndices.indexOf(cur);
        const upcoming = loadedIndices[(pos + 1) % loadedIndices.length];
        setNextIndex(upcoming);
        setIsFading(true);
        setTimeout(() => {
          setCurrentIndex(upcoming);
          setIsFading(false);
        }, 800);
        return cur;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [loadedIndices]);

  // Interrupt: when the user engages a card, push its currently-shown image to
  // the front of the load queue (honored only on slow connections & for the
  // interruptible "projects" group).
  const boostCurrent = useCallback(() => {
    if (imageLinks?.length) requestPriority(imageLinks[currentIndex]);
  }, [imageLinks, currentIndex, requestPriority]);

  const engage = useCallback(() => {
    setIsCollapsed(false);
    boostCurrent();
  }, [boostCurrent]);

    return (
        <>
        <div ref={flyInRef} className={`cloudFlyIn ${isVisible ? "show" : ""}`}
        style={{ "--distanceX": `${distanceX}px`,
                 "--distanceY": `${distanceY}px`} as React.CSSProperties}>
            <div className={`projectCloud logo 
                ${hoverType == 0 ? "projectCloudHover" : (hoverType == 1 ? "projectCloudHover2" : "projectCloudHover3")}`}>
            <p className="projectCardDate" style={{color: titleColour}}><b>{date}</b></p>
            <div className="projectCard" style={{backgroundColor: backgroundColour}}
                onMouseEnter={engage}
                onMouseLeave={() => setIsCollapsed(true)}>
                {linkTo && 
                <a href={linkTo}
                    onClick={(e) => {
                        // On touch devices, the first tap expands the card
                        // instead of navigating; a second tap follows the link.
                        if (isTouch && isCollapsed) {
                            e.preventDefault();
                            engage();
                        }
                    }}>
                    <div className="projectCardTitle" style={{backgroundColor: titleColour}}>
                        <div className="innerProjectCardTitle">
                            <h3>{title}</h3>
                        </div>
                    </div>
                </a>}
                {!linkTo && 
                <div className="projectCardTitleNoLink" style={{backgroundColor: titleColour}}>
                    <div className="innerProjectCardTitle">
                        <h3>{title}</h3>
                    </div>
                </div>
                }
                <div className={`projectCardCollapse ${isCollapsed ? "collapsed" : ""}`}>
                <div className="projectCardBody">
                    <p>{description}</p>
                    {imageLinks?.length && 
                    <div>
                        {/* Registrars: queue EVERY image with the coordinator.
                            Hidden; they only exist to drive the fetch order. */}
                        {imageLinks.map((u) => (
                          <ProjectImageRegistrar key={u} url={u} onReady={onReady} />
                        ))}
                        <div className="projectImageContainer"
                        onMouseEnter={boostCurrent}
                        onClick={() => {
                            boostCurrent();
                            window.location.href = imageLinks[currentIndex];
                        }}>
                            {/* Visible crossfade — only shows loaded images
                                (served instantly from cache once registered). */}
                            <img
                              src={loaded.has(imageLinks[currentIndex]) ? imageLinks[currentIndex] : undefined}
                              className="projectImage baseImage"
                              alt=""
                              decoding="async"
                            />
                            <img
                              src={loaded.has(imageLinks[nextIndex]) ? imageLinks[nextIndex] : undefined}
                              className={`projectImage overlayImage ${isFading? "active" : ""}`}
                              alt=""
                              decoding="async"
                            />
                        </div>
                    </div>}
                    {videoLink && 
                    <div className="baseVideo">
                        <video src={videoLink} 
                        onClick={() => window.location.href = videoLink}
                        preload="metadata"
                        autoPlay muted loop>
                        </video>
                    </div>}
                    {attachDocument && 
                    <div style={{ position: "relative" }}>
                        <embed
                            src={`${attachDocument}#zoom=page-width`}
                            type="application/pdf"
                            className="projectDocument"
                        />
                        <div className="documentLinkPadding"
                        style={{backgroundColor: titleColour}}>
                            <a href={attachDocument}>📖 View Document</a>
                        </div>
                    </div>}
                    <br />
                    {linkTo && <p className="projectCardLink" style={{ 
                        fontSize: "1rem", overflow: "hidden", 
                        textOverflow: "ellipsis", whiteSpace: "nowrap",
                        maxWidth: 200}}><a href={linkTo}>🔗 {linkTo}</a></p>}
                </div>
                </div>
            </div>
            </div>
        </div>
        </>
    )
}
