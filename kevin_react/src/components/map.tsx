import type { mapProps } from "@/interfaces/map";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { MapData } from "@/markdowns/map";
import { useFadeIn } from "./flyIn";
import { useMediaItem, useRequestPriority } from "./loadPriority";
import { useEffect } from "react";
import L from 'leaflet'
//Remember to manually port leaflet css >;D
import 'leaflet/dist/leaflet.css'

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

function PrettyPopup({position, popupText, imageLink, indexOffset = 0}: mapProps) {
    // Each marker's image is a "maps" group item — the lowest priority, loaded
    // last and (on slow connections) one at a time. Maps ARE interruptible:
    // opening/hovering a marker bumps its image to the front of the queue.
    const { src, reportDone } = useMediaItem("maps", imageLink);
    const requestPriority = useRequestPriority();
    const boost = () => requestPriority(imageLink);

    // Preload OUTSIDE the popup. A Leaflet popup only mounts its DOM when
    // opened, so an <img> inside it wouldn't fetch (or fire onLoad) until then
    // — which would stall the sequential queue on every unopened marker. So we
    // fetch via new Image() as soon as the coordinator activates this item,
    // and report done regardless of whether the popup is ever opened.
    useEffect(() => {
        if (!src) return;
        let cancelled = false;
        const img = new Image();
        const done = () => { if (!cancelled) reportDone(); };
        img.onload = done;
        img.onerror = done;
        img.src = src;
        return () => {
            cancelled = true;
            img.onload = null;
            img.onerror = null;
        };
    }, [src, reportDone]);

    return (
    <Marker
        position={position}
        zIndexOffset={indexOffset}
        eventHandlers={{ click: boost, mouseover: boost, popupopen: boost }}
    >
        <Popup>
            {popupText}
            {imageLink &&
            <img src={src ?? imageLink} alt=""
            className="mapImage"
            loading="lazy"
            decoding="async"
            onClick={() => window.location.href = imageLink}
            ></img>}
        </Popup>
    </Marker>
    )
}

export default function Map() {
    const {flyInRef, isVisible} = useFadeIn();

    //https://en.wikipedia.org/wiki/Centre_of_Canada
    return (
        <div ref={flyInRef} className={`mapSettings mapShow ${isVisible ? "show" : ""}`}>
        <MapContainer center={[48.40, -96.466667]} zoom={4}
        style={{ height: "100%", width: "100%" }}>
            <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">Open Street Map</a> contributors.....'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {Object.entries(MapData).map(([key, popupInfo])=> {
                return <PrettyPopup key={key} {...popupInfo}/>
            })}



        </MapContainer>
        </div>
    )
}