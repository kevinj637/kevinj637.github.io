import type { ProjectCardProps } from "@/interfaces/projectCard";
import { useState, useEffect } from "react";
import "@/App.css"

export default function ProjectCard({title, description, date, linkTo, imageLinks, videoLink, attachDocument, backgroundColour, titleColour }: ProjectCardProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(1);
  const [isFading, setIsFading] = useState(false);

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
        <div className="projectCloud logo">
        <p className="projectCardDate" style={{color: titleColour}}><b>{date}</b></p>
        <div className="projectCard" style={{backgroundColor: backgroundColour}}>
            {linkTo && 
            <a href={linkTo}>
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
            <p>{description}</p>
            {imageLinks?.length && 
            <div>
                <div className="projectImageContainer" onClick={() => window.location.href = imageLinks[currentIndex]}>
                    <img src={imageLinks[currentIndex]} 
                    className="projectImage baseImage"
                    alt={imageLinks[nextIndex]}>
                    </img>
                    <img src={imageLinks[nextIndex]} 
                    className={`projectImage overlayImage ${isFading? "active" : ""}`}>
                    </img>
                </div>
            </div>}
            {videoLink && 
            <div className="baseVideo">
                <video src={videoLink} 
                onClick={() => window.location.href = videoLink}
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
            {linkTo && <p style={{ 
                fontSize: "14px", overflow: "hidden", 
                textOverflow: "ellipsis", whiteSpace: "nowrap",
                maxWidth: 200, marginLeft: "auto"}}><a href={linkTo}>🔗 {linkTo}</a></p>}
        </div>
        </div>
        </>
    )
}