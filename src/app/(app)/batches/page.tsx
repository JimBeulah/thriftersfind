
import * as React from "react";
import BatchesTable from "./components/batches-table";
import { getBatches } from "./actions";

export const dynamic = 'force-dynamic';

export default async function BatchesPage() {
  const batches = await getBatches();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Batch Management</h1>
      </div>
      <BatchesTable
        batches={batches}
      />
    </div>
  );
}
