import { useEffect, useState } from "react";
import { useExpectBackgrounds, useMediaItem } from "./loadPriority";

import cloud1 from "@/assets/clouds/cloud1.webp";
import cloud2 from "@/assets/clouds/cloud2.webp";
import cloud3 from "@/assets/clouds/cloud3.webp";
import cloud4 from "@/assets/clouds/cloud4.webp";
import cloud5 from "@/assets/clouds/cloud5.webp";
import cloud6 from "@/assets/clouds/cloud6.webp";
import cloud7 from "@/assets/clouds/cloud7.webp";
import cloud8 from "@/assets/clouds/cloud8.webp";
import cloud9 from "@/assets/clouds/cloud9.webp";

// One entry per cloud that has a CSS layer (.bg-cloud1..9). URLs are known
// synchronously (static imports), so clouds register immediately — no async
// resolution and no mount race with content media.
const CLOUDS = [
  { n: 1, url: cloud1 },
  { n: 2, url: cloud2 },
  { n: 3, url: cloud3 },
  { n: 4, url: cloud4 },
  { n: 5, url: cloud5 },
  { n: 6, url: cloud6 },
  { n: 7, url: cloud7 },
  { n: 8, url: cloud8 },
  { n: 9, url: cloud9 },
];

/**
 * A single background cloud layer. Registers its webp URL with the load
 * coordinator; when the coordinator activates it (immediately on fast
 * connections, or in turn on slow ones), it preloads the bitmap and then adds
 * `.cloud-ready` so CSS paints this specific cloud. Reports done so the queue
 * advances to the next cloud / next group. Backgrounds are not interruptible.
 */
function CloudLayer({ n, url }: { n: number; url: string }) {
  const [painted, setPainted] = useState(false);
  const { src, reportDone } = useMediaItem("backgrounds", url);

  useEffect(() => {
    if (!src) return;
    let cancelled = false;
    const img = new Image();
    const finish = () => {
      if (cancelled) return;
      setPainted(true);
      reportDone();
    };
    img.onload = finish;
    img.onerror = finish; // a broken cloud must not stall the queue
    img.src = src;
    return () => {
      cancelled = true;
      img.onload = null;
      img.onerror = null;
    };
  }, [src, reportDone]);

  return <div className={`bg-cloud bg-cloud${n} ${painted ? "cloud-ready" : ""}`} />;
}

export default function BackgroundClouds() {
  // Declare the cloud count so the fast path reliably holds content media until
  // all clouds finish, independent of effect registration ordering.
  useExpectBackgrounds(CLOUDS.length);
  return (
    <div className="bg-cloud-container">
      {CLOUDS.map((c) => (
        <CloudLayer key={c.n} n={c.n} url={c.url} />
      ))}
    </div>
  );
}
