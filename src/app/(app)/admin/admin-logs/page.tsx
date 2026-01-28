import AdminLogsTable from "./components/admin-logs-table";

export default function AdminLogsPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">System Logs</h1>
            <AdminLogsTable />
        </div>
    );
}
