
import { getOrders } from "../../orders/actions";
import { getCustomers } from "../../customers/actions";
import { getProducts } from "../../inventory/actions";
import { getStations } from "../../stations/actions";
import { getBatches } from "../../batches/actions";
import PreOrderTable from "../components/pre-order-table";

export const metadata = {
    title: "Pre-orders | ThriftersFind",
    description: "Manage your pre-orders efficiently.",
};

export default async function PreOrdersPage() {
    const orders = await getOrders();
    const customers = await getCustomers();
    const products = await getProducts();
    const stations = await getStations();
    const batches = await getBatches();

    // For now, render all orders. In a real scenario, we might would filter for checks like `status === 'Pre-order'`
    // but since we are just laying out the page, we pass all data.
    // Maybe user considers "Open" batches as pre-orders? 

    return (
        <div className="space-y-8 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent">Pre-orders</h2>
                    <p className="text-muted-foreground">
                        Manage and track your upcoming pre-orders.
                    </p>
                </div>
            </div>

            <PreOrderTable
                orders={orders}
                customers={customers}
                products={products}
                stations={stations}
                batches={batches}
            />
        </div>
    );
}
