import type { mapProps } from "@/interfaces/map";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { MapData } from "@/markdowns/map";
import { useFadeIn } from "./flyIn";

function PrettyPopup({position, popupText, imageLink, indexOffset = 0}: mapProps) {
    return (
    <Marker position={position} zIndexOffset={indexOffset}>
        <Popup>
            {popupText}
            {imageLink && 
            <img src={imageLink} alt={`${imageLink}`}
            className="mapImage"
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
        <MapContainer center={[48.40, -96.466667]} zoom={5}
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