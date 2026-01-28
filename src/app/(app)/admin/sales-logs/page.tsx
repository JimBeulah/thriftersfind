import SalesLogsTable from "./components/sales-logs-table";

export default function SalesLogsPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Sales Activity</h1>
            <SalesLogsTable />
        </div>
    );
}
