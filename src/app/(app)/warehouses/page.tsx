
import WarehouseProductsTable from "./components/warehouses-table"; // Keeping filename same for now, or rename? User asked to change layout, maybe rename file too? Let's keep filename for now to act fast, but export updated component.
import { getWarehouseProducts } from "./actions";

export default async function WarehousesPage() {
    const products = await getWarehouseProducts();

    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Warehouse Inventory</h1>
            </div>
            <WarehouseProductsTable products={products} />
        </div>
    );
}
