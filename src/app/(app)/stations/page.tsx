
import StationsTable from "./components/stations-table";
import { getStations } from "./actions";

export default async function StationsPage() {
    const stations = await getStations();

    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Courier & Pickup Stations</h1>
            </div>
            <StationsTable stations={stations} />
        </div>
    );
}
