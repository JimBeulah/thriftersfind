
import WarehouseProductsTable from "./components/warehouses-table"; // Keeping filename same for now, or rename? User asked to change layout, maybe rename file too? Let's keep filename for now to act fast, but export updated component.
import { getWarehouseProducts } from "./actions";

export default async function WarehousesPage() {
    const products = await getWarehouseProducts();

    return (
        <div className="flex flex-col gap-8 p-2">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent w-fit pb-1">
                        Warehouse Inventory
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your warehouse stock and inventory
                    </p>
                </div>
            </div>
            <WarehouseProductsTable products={products} />
        </div>
    );
}
