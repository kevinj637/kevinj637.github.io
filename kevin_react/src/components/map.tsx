import type { mapProps } from "@/interfaces/map";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { MapData } from "@/markdowns/map";
import { useFadeIn } from "./flyIn";
import { useLoadGate } from "./loadPriority";
import { useEffect } from "react";
import L from 'leaflet'
//Remember to manually port leaflet css >;D
import 'leaflet/dist/leaflet.css'

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete (L.Icon.Default.prototype as any)._getIconUrl

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

function PrettyPopup({position, popupText, imageLink, indexOffset = 0, canLoad}: mapProps & {canLoad: boolean}) {
    return (
    <Marker position={position} zIndexOffset={indexOffset}>
        <Popup>
            {popupText}
            {imageLink && canLoad &&
            <img src={imageLink} alt={`${imageLink}`}
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
    // Maps are the lowest-priority group. Popup images are already lazy
    // (Leaflet builds a popup's DOM only when opened) and additionally carry
    // loading="lazy", but we still hold their src until every higher-priority
    // group (Projects, Résumé, Backgrounds) has finished loading.
    const { canLoad, reportLoaded } = useLoadGate("maps");
    useEffect(() => {
        if (canLoad) reportLoaded();
    }, [canLoad, reportLoaded]);

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
                return <PrettyPopup key={key} {...popupInfo} canLoad={canLoad}/>
            })}



        </MapContainer>
        </div>
    )
}