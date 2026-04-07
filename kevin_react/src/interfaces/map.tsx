import type { LatLngExpression } from "leaflet";
import type React from "react";

export interface mapProps {
    position: LatLngExpression,
    popupText: React.ReactNode,
    imageLink?: string,
}

export interface mapTextProps {
    location?: string,
    time?: string,
    teaser: string,
}

export function autoFormat({location, time, teaser}: mapTextProps): React.ReactNode {
    return(
        <>
        <p>Location: <strong>{location ?? "???"}</strong><br/>
        Time: <strong>{time ?? "???"}</strong><br/>
        <i>{teaser}</i></p>
        </>
    )
}