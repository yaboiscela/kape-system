import { useState } from "react";
import ProductCard from "../components/ProductCard";
import { FaTrash, FaMinus, FaPlus } from "react-icons/fa";
import axios from "axios";

export default function Cashier({ orders, setOrders, products, categories }) {
    const [cart, setCart] = useState([]);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("all");

    const API_URL = import.meta.env.VITE_API_URL || "";

    // Modal states
    const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
    const [isConfirmed, setIsConfirmed] = useState(false);

    const [paymentMethod, setPaymentMethod] = useState("");

    // ----------------- Filtering -----------------
    const filteredProducts = products.filter((product) => {
        const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
        const matchesCategory =
            category === "all" || product.category.toLowerCase() === category.toLowerCase();
        return matchesSearch && matchesCategory;
    });

    // ----------------- Cart Controls -----------------
    const handleAddToCart = (newItem) => {
        setCart((prevCart) => {
            // Compare product name, size, and addons
            const existingItemIndex = prevCart.findIndex(
                (item) =>
                    item.name === newItem.name &&
                    item.size === newItem.size &&
                    JSON.stringify(item.addons || []) === JSON.stringify(newItem.addons || [])
            );

            if (existingItemIndex > -1) {
                // Merge quantities if exactly same
                const updatedCart = [...prevCart];
                updatedCart[existingItemIndex].quantity += 1;
                return updatedCart;
            } else {
                // Add as new unique product
                return [...prevCart, newItem];
            }
        });
    };

    const handleRemoveFromCart = (index) => {
        setCart((prevCart) => prevCart.filter((_, i) => i !== index));
    };

    const handleIncreaseQuantity = (index) => {
        setCart((prevCart) =>
            prevCart.map((item, i) =>
                i === index ? { ...item, quantity: item.quantity + 1 } : item
            )
        );
    };

    const handleDecreaseQuantity = (index) => {
        setCart((prevCart) =>
            prevCart.map((item, i) =>
                i === index && item.quantity > 1
                    ? { ...item, quantity: item.quantity - 1 }
                    : item
            )
        );
    };

    const [cartVisible, setCartVisible] = useState(true);``

    // ----------------- Modal Toggle -----------------
    const toggleConfirmationModal = () => {
        setIsConfirmationModalOpen(!isConfirmationModalOpen);
    };

    // ----------------- Place Order -----------------
    const handleOrder = async (e) => {
        e.preventDefault();

        // Validate payment method
        if (!paymentMethod.trim()) {
            alert("Please select a payment method.");
            return;
        }

        // Generate next order ID based on existing orders
        const nextOrderID = (orders?.length || 0) + 1;

        // Compute total amount including addons
        const totalAmount = cart
            .reduce((total, item) => {
                const itemTotal = (item.price + calcAddonTotal(item.addons)) * item.quantity;
                return total + itemTotal;
            }, 0)
            .toFixed(2);

        // Build order object
        const newOrder = {
            orderID: nextOrderID,
            customerNumber: nextOrderID,
            totalAmount,
            paymentMethod,
            status: "Pending",
            date: new Date().toISOString(),
            items: cart.map((item) => ({
                productName: item.name,
                size: item.size || "Regular",
                qty: item.quantity,
                addons: item.addons || [],
                price: item.price,
            })),
        };

        try {
            // Send order to Flask backend
            const res = await axios.post(`${API_URL}/api/orders`, newOrder);
            console.log("Order saved to backend:", res.data);

            // Update frontend state
            setOrders((prevOrders) => [...prevOrders, newOrder]);

            // Reset UI state
            setCart([]);
            setPaymentMethod("");
            toggleConfirmationModal();
            setIsConfirmed(true);

        } catch (error) {
            console.error("Error submitting order:", error);
            alert("Failed to submit order. Please try again.");
        }
    };


    // Calculate total price of addons for each item
    const calcAddonTotal = (addons = []) => {
        return addons.reduce((sum, addon) => sum + addon.price, 0);
    };

    return (
        <div className="rounded-2xl overflow-hidden">
            <h2 className="pl-10 text-3xl font-bold text-[#7f5539] mb-6">Cashier</h2>
            <div className="flex flex-col lg:flex-row gap-4 w-full bg-amber-50 relative h-225">
                {/* ----------------- Menu Section ----------------- */}
                <div className="bg-[#e0aa85] h-full lg:w-8/12 rounded-2xl lg:rounded-l-2xl flex flex-col gap-4">
                    {/* Top Bar */}
                    <div className="font-semibold sticky py-2 px-4 rounded-t-2xl lg:rounded-tl-2xl bg-[#7f5539] flex items-center justify-between">
                        <input
                            className="bg-white w-50 rounded-lg pl-2"
                            type="text"
                            value={search}
                            placeholder="Search product..."
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <h2 className="text-center text-3xl text-white">Menu</h2>
                        <fieldset>
                            <select
                                onChange={(e) => setCategory(e.target.value)}
                                value={category}
                                className="bg-white w-50 h-6 rounded-lg pl-2"
                            >
                                <option value="all">All</option>
                                {categories.map((category) => (
                                    <option key={category.id} value={category.name}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </fieldset>
                    </div>

                    {/* Product Grid */}
                    <div className="justify-items-center pb-10 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 overflow-y-auto h-205 px-4 gap-4">
                        {filteredProducts.length > 0 ? (
                            filteredProducts.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    handleAddToCart={handleAddToCart}
                                />
                            ))
                        ) : (
                            <div className="relative col-span-3 h-full flex items-center justify-center">
                                <p className="text-center text-white">No products found.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ----------------- Cart Section ----------------- */}
                <div className="bg-gray-600 flex flex-col lg:w-4/12 w-full h-full rounded-r-2xl">
                    <div className="flex justify-center items-center bg-gray-300 rounded-tr-2xl">
                        <h2 className="text-center text-3xl font-semibold sticky p-2 rounded-tr-2xl bg-gray-300 text-black">
                            Cart
                        </h2>
                    </div>
                    <div className="flex-grow p-4 overflow-y-auto">
                        {cart.length === 0 ? (
                            <p className="text-center text-gray-200">Your cart is empty.</p>
                        ) : (
                            <ul>
                                {cart.map((item, index) => (
                                    <li key={index} className="mb-4 flex bg-white rounded-lg">
                                        <div className="flex w-full justify-between items-center p-4">
                                            <div>
                                                <h3 className="text-2xl font-semibold">{item.name} <span className="text-xl text-gray-500">({item.size})</span></h3>

                                                {/* Display Add-ons */}
                                                {item.addons && item.addons.length > 0 && (
                                                    <ul className="ml-4 list-disc text-gray-600 font-medium">
                                                        {item.addons.map((addon, i) => (
                                                            <li key={i}>
                                                                {addon.name} - ₱{Number(addon.price).toFixed(2)}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}

                                                {/* Quantity Controls */}
                                                <div className="flex items-center mt-2 space-x-4">
                                                    <span className="text-gray-600">Quantity:</span>
                                                    <button
                                                        className="bg-gray-200 hover:bg-gray-400 hover:text-white transition-all hover:scale-110 flex items-center justify-center rounded-full w-9 h-9"
                                                        onClick={() => handleDecreaseQuantity(index)}
                                                    >
                                                        <FaMinus />
                                                    </button>
                                                    <span className="text-xl">{item.quantity}</span>
                                                    <button
                                                        className="bg-gray-200 hover:bg-gray-400 hover:text-white transition-all hover:scale-110 flex items-center justify-center rounded-full w-9 h-9"
                                                        onClick={() => handleIncreaseQuantity(index)}
                                                    >
                                                        <FaPlus />
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-lg font-bold">
                                                ₱{((item.price + calcAddonTotal(item.addons)) * item.quantity).toFixed(2)}
                                            </p>
                                        </div>

                                        {/* Remove Button */}
                                        <div>
                                            <button
                                                className="bg-red-400 rounded-r-lg h-full w-10 transition-all hover:w-20 hover:bg-red-200 text-white hover:text-red-600"
                                                onClick={() => handleRemoveFromCart(index)}
                                            >
                                                <FaTrash className="m-auto w-5 h-5" />
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Cart Footer */}
                    <div className="p-4 bg-gray-300 rounded-br-2xl">
                        <h3 className="text-xl font-semibold mb-2">
                            Total: ₱
                            {cart
                                .reduce((total, item) => total + (item.price + calcAddonTotal(item.addons)) * item.quantity, 0)
                                .toFixed(2)}
                        </h3>
                        <button
                            className="w-full bg-green-500 text-white py-2 text-xl font-semibold rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={cart.length === 0}
                            onClick={toggleConfirmationModal}
                        >
                            Checkout
                        </button>
                    </div>
                </div>
            </div>

            {/* ----------------- Modal Total Confirmation ----------------- */}
            <form
                className="bg-black/30 fixed w-full h-full inset-0 z-30 flex items-center justify-center"
                style={{ display: isConfirmationModalOpen ? "flex" : "none" }}
                onSubmit={handleOrder}
            >
                <div className="bg-white p-6 rounded-lg w-96 shadow-lg">
                    <h2 className="text-center text-3xl font-bold mb-4">Confirmation</h2>

                    {/* Customer Number + Payment Method */}
                    <div className="flex justify-between items-center gap-4 mb-4">
                        <div className="flex-1">
                            <h2 className="text-lg font-semibold mb-1">Customer #</h2>
                            <input
                                className="border w-full p-1 rounded-md bg-gray-200 cursor-not-allowed"
                                type="number"
                                value={(orders?.length || 0) + 1}
                                readOnly
                            />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-lg font-semibold mb-1">Payment Method</h2>
                            <select
                                className="border w-full p-1 rounded-md"
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                required
                            >
                                <option value="" disabled>
                                    Select method
                                </option>
                                <option value="cash">Cash</option>
                                <option value="gcash">GCash</option>
                                <option value="credit">Credit Card</option>
                            </select>
                        </div>
                    </div>

                    {/* Items Summary */}
                    <div>
                        <h2 className="text-2xl font-semibold mb-1">Items in Cart</h2>
                        <ul className="max-h-80 overflow-y-auto mb-4 border p-2 rounded-md">
                            {cart.map((item, index) => (
                                <li key={index} className="flex justify-between mb-2 text-lg">
                                    <span>
                                        {item.name} ({item.size}) x {item.quantity}
                                    </span>
                                    <span>
                                        ₱{((item.price + calcAddonTotal(item.addons)) * item.quantity).toFixed(2)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Divider */}
                    <div className="w-full h-[1px] bg-black mb-2"></div>

                    {/* Total */}
                    <div className="flex justify-between mb-6">
                        <h2 className="text-2xl">Total Amount</h2>
                        <h2 className="text-2xl font-semibold">
                            ₱
                            {cart
                                .reduce((total, item) => total + (item.price + calcAddonTotal(item.addons)) * item.quantity, 0)
                                .toFixed(2)}
                        </h2>
                    </div>

                    {/* Modal Actions */}
                    <div className="flex justify-between">
                        <button
                            type="button"
                            onClick={toggleConfirmationModal}
                            className="bg-orange-500 text-2xl text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="bg-green-500 text-2xl text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
                        >
                            Confirm
                        </button>
                    </div>
                </div>
            </form>

            {/* ----------------- Modal Order Confirmed ----------------- */}
            <div
                className="bg-black/30 fixed w-full h-full inset-0 z-30 flex items-center justify-center"
                style={{ display: isConfirmed ? "flex" : "none" }}
            >
                <div className="bg-white p-6 shadow-lg rounded-lg w-96">
                    <h2 className="text-center text-3xl font-bold">Order Confirmed!</h2>
                    <div className="flex justify-center">
                        <button
                            onClick={() => setIsConfirmed(false)}
                            className="mt-8 bg-green-500 hover:bg-green-200 text-2xl text-white hover:text-green-500 transition-all hover:scale-110 px-4 py-2 rounded-lg"
                        >
                            OK
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
