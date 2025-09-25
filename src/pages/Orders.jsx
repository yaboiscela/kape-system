import { useEffect, useState } from "react";

export default function Orders({ orders, setOrders }) {
    const [loading, setLoading] = useState(true);

    // ----------------- Load Orders -----------------
    useEffect(() => {
        if (orders.length > 0) {
            setLoading(false);
            return;
        }

        fetch("/db/orders_get.php")
            .then((res) => res.json())
            .then((data) => {
                const updatedData = data.map((order, index) => ({
                    ...order,
                    customerNumber: index + 1,
                    paymentMethod: order.paymentMethod || "Cash",
                }));
                setOrders(updatedData);
                setLoading(false);
            })
            .catch(() => {
                // Fallback sample data
                setOrders([
                    {
                        orderID: 1,
                        customerNumber: 1,
                        totalAmount: " 210.00",
                        paymentMethod: "Cash",
                        status: "Pending",
                        date: "2025-09-13T09:30:00",
                        items: [
                            {
                                productName: "Cappuccino",
                                qty: 2,
                                addons: [{ name: "Extra Shot", price: 10.0 }],
                                price: 100,
                            },
                            {
                                productName: "Blueberry Muffin",
                                qty: 1,
                                addons: [],
                                price: 50,
                            },
                        ],
                    },
                    {
                        orderID: 2,
                        customerNumber: 2,
                        totalAmount: "180.00",
                        paymentMethod: "GCash",
                        status: "Completed",
                        date: "2025-09-12T15:20:00",
                        items: [
                            {
                                productName: "Latte",
                                qty: 1,
                                addons: [{ name: "Whipped Cream", price: 10.0 }],
                                price: 180,
                            },
                        ],
                    },
                ]);
                setLoading(false);
            });
    }, [orders, setOrders]);

    // ----------------- Process Order -----------------
    const processOrder = (orderID) => {
        const updatedOrders = orders.map((order) =>
            order.orderID === orderID
                ? { ...order, status: "Completed", date: new Date().toISOString() }
                : order
        );
        setOrders(updatedOrders);

        fetch("/db/orders_update.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderID, status: "Completed" }),
        }).catch((err) => console.error("Error updating order:", err));
    };

    // ----------------- Cancel Order (with PIN) -----------------
    const cancelOrder = (orderID) => {
        const adminPin = "1234";
        const enteredPin = prompt("Enter Admin PIN to cancel this order:");

        if (!enteredPin) return;
        if (enteredPin !== adminPin) {
            alert("Invalid PIN. Order not cancelled.");
            return;
        }

        const updatedOrders = orders.filter((order) => order.orderID !== orderID);
        setOrders(updatedOrders);

        fetch("/db/orders_cancel.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderID }),
        })
            .then((res) => res.json())
            .then(() => {
                alert("Order cancelled successfully.");
            })
            .catch((err) => console.error("Error cancelling order:", err));
    };

    // ----------------- Helpers -----------------
    if (!Array.isArray(orders)) {
        return <div className="p-6 text-red-600">Error: Orders data is invalid.</div>;
    }

    const pendingOrders = orders.filter((order) => order.status === "Pending");
    const completedOrders = orders.filter((order) => order.status === "Completed");

    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        })}`;
    };

    if (loading) {
        return <div className="p-6 text-[#7f5539]">Loading orders...</div>;
    }

    return (
        <div className="space-y-10">
            <h1 className="pl-10 text-3xl font-bold text-[#7f5539] mb-6">Orders</h1>

            <div className="flex flex-col lg:flex-row gap-16">
                {/* Pending Orders Table */}
                <div>
                    <h2 className="text-2xl font-bold text-[#7f5539] mb-4">Pending Orders</h2>
                    <div className="overflow-x-auto rounded-2xl border border-[#b08968]">
                        <table className="min-w-full">
                            <thead className="bg-[#7f5539] text-white">
                                <tr>
                                    <th className="py-2 px-4">Order ID</th>
                                    <th className="py-2 px-4">Customer #</th>
                                    <th className="py-2 px-4">Payment Method</th>
                                    <th className="py-2 px-4">Date & Time</th>
                                    <th className="py-2 px-4">Items</th>
                                    <th className="py-2 px-4">Total Amount</th>
                                    <th className="py-2 px-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-[#f8e7d6] text-[#7f5539]">
                                {pendingOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="text-center py-4">
                                            No pending orders
                                        </td>
                                    </tr>
                                ) : (
                                    pendingOrders.map((order) => (
                                        <tr
                                            key={order.orderID}
                                            className="hover:bg-[#feebc0] cursor-pointer text-center odd:bg-[#fef6e4] transition"
                                        >
                                            <td className="py-2 px-4">{order.orderID}</td>
                                            <td className="py-2 px-4">{order.customerNumber}</td>
                                            <td className="py-2 px-4">
                                                {order.paymentMethod.charAt(0).toUpperCase() + order.paymentMethod.slice(1)}
                                            </td>
                                            <td className="py-2 px-4">{formatDateTime(order.date)}</td>
                                            <td className="py-2 px-4">
                                                <ul className="list-disc list-inside text-left">
                                                    {order.items.map((item, idx) => (
                                                        <li key={idx}>
                                                            {item.productName || item.name} x{item.qty || item.quantity}
                                                            {item.addons?.length > 0 && (
                                                                <span className="italic text-sm">
                                                                    {" "}
                                                                    +{" "}
                                                                    {item.addons.map(addon => addon.name).join(", ")}
                                                                </span>
                                                            )}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </td>
                                            <td className="py-2 px-4 font-bold">
                                                ₱{order.totalAmount}
                                            </td>
                                            <td className="py-2 px-4 space-y-2 flex flex-col">
                                                <button
                                                    onClick={() => processOrder(order.orderID)}
                                                    className="bg-green-600 hover:bg-green-300 hover:text-green-700 hover:scale-105 transition text-white px-4 py-2 rounded"
                                                >
                                                    Complete
                                                </button>
                                                <button
                                                    onClick={() => cancelOrder(order.orderID)}
                                                    className="bg-red-600 hover:bg-red-300 hover:text-red-700 hover:scale-105 transition text-white px-4 py-2 rounded"
                                                >
                                                    Cancel
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Completed Orders Table */}
                <div>
                    <h2 className="text-2xl font-bold text-[#7f5539] mb-4">Completed Orders</h2>
                    <div className="overflow-x-auto rounded-2xl border border-[#b08968]">
                        <table className="min-w-full text-center">
                            <thead className="bg-[#7f5539] text-white">
                                <tr>
                                    <th className="py-2 px-4">Order ID</th>
                                    <th className="py-2 px-4">Customer #</th>
                                    <th className="py-2 px-4">Payment Method</th>
                                    <th className="py-2 px-4">Date & Time</th>
                                    <th className="py-2 px-4">Items</th>
                                    <th className="py-2 px-4">Total Amount</th>
                                </tr>
                            </thead>
                            <tbody className="bg-[#f8e7d6] text-[#7f5539]">
                                {completedOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="text-center py-4">
                                            No completed orders
                                        </td>
                                    </tr>
                                ) : (
                                    completedOrders.map((order) => (
                                        <tr key={order.orderID} className="transition">
                                            <td className="py-2 px-4">{order.orderID}</td>
                                            <td className="py-2 px-4">{order.customerNumber}</td>
                                            <td className="py-2 px-4">{order.paymentMethod}</td>
                                            <td className="py-2 px-4">{formatDateTime(order.date)}</td>
                                            <td className="py-2 px-4">
                                                <ul className="list-disc list-inside text-left">
                                                    {order.items.map((item, idx) => (
                                                        <li key={idx}>
                                                            {item.productName || item.name} x{item.qty || item.quantity}
                                                            {item.addons?.length > 0 && (
                                                                <span className="italic text-sm">
                                                                    {" "}+ {item.addons.map(addon => addon.name).join(", ")}
                                                                </span>
                                                            )}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </td>
                                            <td className="py-2 px-4 font-bold">
                                                ₱{order.totalAmount}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
