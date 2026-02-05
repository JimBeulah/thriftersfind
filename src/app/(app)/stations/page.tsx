
import StationsTable from "./components/stations-table";
import { getStations } from "./actions";

export default async function StationsPage() {
    const stations = await getStations();

    return (
        <div className="flex flex-col gap-8 p-2">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent w-fit pb-1">
                        Courier & Pickup Stations
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your delivery and pickup locations
                    </p>
                </div>
            </div>
            <StationsTable stations={stations} />
        </div>
    );
}
