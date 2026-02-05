import SalesLogsTable from "./components/sales-logs-table";

export default function SalesLogsPage() {
    return (
        <div className="flex flex-col gap-8 p-2">
            <div>
                <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent w-fit pb-1">
                    Sales Activity
                </h1>
                <p className="text-muted-foreground mt-1">
                    View all sales activities and history.
                </p>
            </div>
            <SalesLogsTable />
        </div>
    );
}
