import AdminLogsTable from "./components/admin-logs-table";

export default function AdminLogsPage() {
    return (
        <div className="flex flex-col gap-8 p-2">
            <div>
                <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent w-fit pb-1">
                    System Logs
                </h1>
                <p className="text-muted-foreground mt-1">
                    View all system activities and changes.
                </p>
            </div>
            <AdminLogsTable />
        </div>
    );
}
