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
        <p className="projectCardDate" style={{color: titleColour}}><b>{date}</b></p>
        <div className="projectCard logo" style={{backgroundColor: backgroundColour}}>
            <a href={linkTo}>
                <div className="projectCardTitle" style={{backgroundColor: titleColour}}>
                    <div className="innerProjectCardTitle">
                        <h3>{title}</h3>
                    </div>
                </div>
            </a>
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
            <br />
            <p style={{ fontSize: "14px" }}><a href={linkTo}>🔗 {linkTo}</a></p>
        </div>
        </>
    )
}