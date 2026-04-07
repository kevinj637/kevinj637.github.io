import type { mapProps } from "@/interfaces/map";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { MapData } from "@/markdowns/map";

function PrettyPopup({position, popupText, imageLink}: mapProps) {
    return (
    <Marker position={position}>
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

    //https://en.wikipedia.org/wiki/Centre_of_Canada
    return (
        <div className="mapSettings">
        <MapContainer center={[54.40, -96.466667]} zoom={5}
        style={{ height: "100%", width: "100%" }}>
            <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">Open Street Map</a> contributors.....'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {Object.entries(MapData).map(([key, popupInfo])=> {
                return <PrettyPopup {...popupInfo}/>
            })}



        </MapContainer>
        </div>
    )
}