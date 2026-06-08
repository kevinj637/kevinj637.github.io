import fs from "fs/promises";
import path from "path";
import gtfs from "gtfs-realtime-bindings";
const { transit_realtime } = gtfs;
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const VEHICLE_POSITIONS_URL =
  "https://webapps.regionofwaterloo.ca/api/grt-routes/api/vehiclepositions";

async function main() {
  const response = await fetch(VEHICLE_POSITIONS_URL);

  if (!response.ok) {
    throw new Error(`GRT request failed: ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const feed = transit_realtime.FeedMessage.decode(buffer);

  const vehicles = feed.entity
    .filter(entity => entity.vehicle)
    .map(entity => ({
      id: entity.id,
      tripId: entity.vehicle.trip?.tripId ?? null,
      routeId: entity.vehicle.trip?.routeId ?? null,
      lat: entity.vehicle.position?.latitude ?? null,
      lon: entity.vehicle.position?.longitude ?? null,
      bearing: entity.vehicle.position?.bearing ?? null,
      speed: entity.vehicle.position?.speed ?? null,
      timestamp: entity.vehicle.timestamp
        ? Number(entity.vehicle.timestamp)
        : null
    }));

  const outputDir = path.join(__dirname, "..", "public", "data");
  await fs.mkdir(outputDir, { recursive: true });

  await fs.writeFile(
    path.join(outputDir, "vehicles.json"),
    JSON.stringify(
      {
        fetchedAt: new Date().toISOString(),
        source: "GRT GTFS-realtime vehicle positions",
        vehicles
      },
      null,
      2
    )
  );

  console.log(`Wrote ${vehicles.length} vehicles`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});