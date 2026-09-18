import type { ProjectCardProps } from "@/interfaces/projectCard";
import React, { useState, useEffect } from "react";
import { useFlyIn } from "./flyIn";
import { useLoadGate } from "./loadPriority";
import "@/App.css"


export default function ProjectCard({title, description, date, linkTo, imageLinks, videoLink, attachDocument, backgroundColour, titleColour }: ProjectCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(1);
  const [isFading, setIsFading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  // Projects are the highest-priority media group: they may start fetching
  // immediately, and once a card's first image settles we release the queue
  // so the résumé (next group) can begin loading.
  const { canLoad, reportLoaded } = useLoadGate("projects");
  // A card with no images can't gate the queue on an image load, so it
  // releases as soon as it is allowed to load.
  useEffect(() => {
    if (canLoad && !imageLinks?.length) reportLoaded();
  }, [canLoad, imageLinks?.length, reportLoaded]);
  // Touch / no-hover devices: hover can't drive the expand, so tap does.
  const isTouch = typeof window !== "undefined" &&
    window.matchMedia?.("(hover: none)").matches;
  const distanceX = (Math.random() * -180 - 90) * (Math.round(Math.random()) * -2 + 1);
  const distanceY = (Math.random() - 0.5) * 150;
  const hoverType = Math.floor(Math.random() * 3)

  const {flyInRef, isVisible} = useFlyIn();

  useEffect(() => {
    if (imageLinks?.length) {
        const interval = setInterval(() => {
        
        const upcoming = (currentIndex + 1) % imageLinks!.length;
        setNextIndex(upcoming);
        setIsFading(true);

        setTimeout(() => {
            setCurrentIndex(upcoming);
            setIsFading(false);
        }, 800);
        }, 3000);

        return () => clearInterval(interval);
    }
  }, [currentIndex, imageLinks?.length]);
    
    
    return (
        <>
        <div ref={flyInRef} className={`cloudFlyIn ${isVisible ? "show" : ""}`}
        style={{ "--distanceX": `${distanceX}px`,
                 "--distanceY": `${distanceY}px`} as React.CSSProperties}>
            <div className={`projectCloud logo 
                ${hoverType == 0 ? "projectCloudHover" : (hoverType == 1 ? "projectCloudHover2" : "projectCloudHover3")}`}>
            <p className="projectCardDate" style={{color: titleColour}}><b>{date}</b></p>
            <div className="projectCard" style={{backgroundColor: backgroundColour}}
                onMouseEnter={() => setIsCollapsed(false)}
                onMouseLeave={() => setIsCollapsed(true)}>
                {linkTo && 
                <a href={linkTo}
                    onClick={(e) => {
                        // On touch devices, the first tap expands the card
                        // instead of navigating; a second tap follows the link.
                        if (isTouch && isCollapsed) {
                            e.preventDefault();
                            setIsCollapsed(false);
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
                        <div className="projectImageContainer" onClick={() => window.location.href = imageLinks[currentIndex]}>
                            <img src={canLoad ? imageLinks[currentIndex] : undefined} 
                            className="projectImage baseImage"
                            alt={imageLinks[nextIndex]}
                            decoding="async"
                            onLoad={reportLoaded}
                            onError={reportLoaded}>
                            </img>
                            <img src={canLoad ? imageLinks[nextIndex] : undefined} 
                            className={`projectImage overlayImage ${isFading? "active" : ""}`}
                            decoding="async">
                            </img>
                        </div>
                    </div>}
                    {videoLink && 
                    <div className="baseVideo">
                        {canLoad &&
                        <video src={videoLink} 
                        onClick={() => window.location.href = videoLink}
                        preload="metadata"
                        autoPlay muted loop>
                        </video>}
                    </div>}
                    {attachDocument && 
                    <div style={{ position: "relative" }}>
                        {canLoad &&
                        <embed
                            src={`${attachDocument}#zoom=page-width`}
                            type="application/pdf"
                            className="projectDocument"
                        />}
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