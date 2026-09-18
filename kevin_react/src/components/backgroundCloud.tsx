import { useEffect, useRef, useState } from "react";
import { useLoadGate } from "./loadPriority";

import cloud1 from "@/assets/clouds/cloud1.webp";
import cloud2 from "@/assets/clouds/cloud2.webp";
import cloud3 from "@/assets/clouds/cloud3.webp";
import cloud4 from "@/assets/clouds/cloud4.webp";
import cloud5 from "@/assets/clouds/cloud5.webp";
import cloud6 from "@/assets/clouds/cloud6.webp";
import cloud7 from "@/assets/clouds/cloud7.webp";
import cloud8 from "@/assets/clouds/cloud8.webp";
import cloud9 from "@/assets/clouds/cloud9.webp";

// Same order/URLs the CSS references so the browser reuses the cached fetch
// when `.clouds-ready` finally paints the backgrounds.
const CLOUD_SRCS = [cloud1, cloud2, cloud3, cloud4, cloud5, cloud6, cloud7, cloud8, cloud9];

export default function BackgroundClouds() {
    // Backgrounds are the 3rd-priority group: they wait for Projects and the
    // Résumé, then preload the cloud webp files before painting them (CSS
    // background-image can't use native lazy-loading, so we drive it in JS).
    const { canLoad, reportLoaded } = useLoadGate("backgrounds");
    const [ready, setReady] = useState(false);
    const startedRef = useRef(false);

    useEffect(() => {
        if (!canLoad || startedRef.current) return;
        startedRef.current = true;

        let remaining = CLOUD_SRCS.length;
        let settled = false;
        const finish = () => {
            if (settled) return;
            settled = true;
            setReady(true);      // adds `.clouds-ready` -> CSS paints backgrounds
            reportLoaded();      // release the queue for the Maps group
        };

        const onOne = () => {
            remaining -= 1;
            if (remaining <= 0) finish();
        };

        const images = CLOUD_SRCS.map((src) => {
            const img = new Image();
            img.onload = onOne;
            img.onerror = onOne; // a broken cloud must not stall the group
            img.src = src;
            return img;
        });

        return () => {
            images.forEach((img) => {
                img.onload = null;
                img.onerror = null;
            });
        };
    }, [canLoad, reportLoaded]);

    return (
        <div className={`bg-cloud-container ${ready ? "clouds-ready" : ""}`}>
        <div className="bg-cloud bg-cloud1"></div>
        <div className="bg-cloud bg-cloud2"></div>
        <div className="bg-cloud bg-cloud3"></div>
        <div className="bg-cloud bg-cloud4"></div>
        <div className="bg-cloud bg-cloud5"></div>
        <div className="bg-cloud bg-cloud6"></div>
        <div className="bg-cloud bg-cloud7"></div>
        <div className="bg-cloud bg-cloud8"></div>
        <div className="bg-cloud bg-cloud9"></div>
        </div>
    )
}
