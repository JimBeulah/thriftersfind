
import { getProducts } from "../../inventory/actions";
import { getBatches } from "../../batches/actions";
import PreOrderInventoryGrid from "../components/pre-order-inventory-grid";

export const metadata = {
    title: "Pre-order Inventory | ThriftersFind",
    description: "Manage pre-order inventory and stock levels.",
};

export default async function PreOrderInventoryPage() {
    const products = await getProducts();
    const batches = await getBatches();

    return (
        <div className="space-y-8 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                        Pre-order Inventory
                    </h2>
                    <p className="text-muted-foreground">
                        Track and manage inventory for upcoming pre-orders.
                    </p>
                </div>
            </div>

            <PreOrderInventoryGrid
                products={products}
                batches={batches}
            />
        </div>
    );
}
