import { FaPlus } from "react-icons/fa6";
import { useState } from "react";

export default function ProductCard({ product, handleAddToCart }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAddons, setSelectedAddons] = useState([]);

    const API_URL = import.meta.env.VITE_API_URL || "";

    const toggleModal = () => {
        setIsModalOpen(!isModalOpen);
        if (!isModalOpen) {
        setSelectedAddons([]); // reset when opening
        }
    };

    const handleAddonToggle = (addon) => {
        setSelectedAddons((prev) => {
        if (prev.includes(addon)) {
            return prev.filter((a) => a !== addon); // unselect if already selected
        }
        return [...prev, addon]; // add new
        });
    };

    const handleSizeSelect = (sizeKey) => {
        handleAddToCart({
        name: product.name,
        category: product.category,
        size: sizeKey,
        price: product.size[sizeKey],
        addons: selectedAddons, // ✅ include selected add-ons
        quantity: 1,
        });
        toggleModal();
    };

    return (
        <div>
        {/* Product Card */}
        <div className="relative bg-[#f8e7d6] shadow-lg p-2 md:scale-80 lg:scale-100 rounded-2xl w-70 h-min flex flex-col">
            <div className="h-44 w-full rounded-t-xl bg-amber-50 overflow-hidden">
            <img src={`${API_URL}/uploads/${product.image}`} alt="Product pic"/>
            </div>
            <div className="flex justify-between items-center p-4 text-[#7f5539]">
            <div>
                <h2 className="text-2xl font-semibold">{product.name}</h2>
                <p className="text-sm font-medium">{product.category}</p>
            </div>
            <FaPlus
                onClick={toggleModal}
                className="bg-white text-[#b08968] hover:bg-[#b08968] hover:text-white transition-colors shadow-md p-1 h-10 w-10 rounded-full cursor-pointer"
            />
            </div>
        </div>

        {/* Modal */}
        {isModalOpen && (
            <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-96">
                <h2 className="text-4 text-4xl font-bold mb-4">{product.name}</h2>

                {/* Add-ons Section */}
                <h2 className="text-xl font-semibold mb-2">Select Add-ons</h2>
                <div className="flex flex-col mb-4 text-xl">
                {product.addons.map((addon) => (
                    <label key={addon.name} className="flex items-center">
                    <input
                        className="mr-2"
                        type="checkbox"
                        checked={selectedAddons.includes(addon)}
                        onChange={() => handleAddonToggle(addon)}
                    />
                    {addon.name} - ₱{Number(addon.price).toFixed(2)}
                    </label>
                ))}
                </div>

                {/* Size Section */}
                <h2 className="text-xl font-semibold mb-4">Select Size</h2>
                <div className="flex flex-col space-y-4">
                {Object.keys(product.size).map((sizeKey) => (
                    <button
                    key={sizeKey}
                    onClick={() => handleSizeSelect(sizeKey)}
                    className="w-full p-3 text-2xl font-semibold rounded-lg shadow-md/20 bg-[#f8e7d6] text-[#7f5539] hover:bg-[#b08968] hover:text-white transition-colors"
                    >
                    {sizeKey.charAt(0).toUpperCase() + sizeKey.slice(1)} - ₱
                    {Number(product.size[sizeKey]).toFixed(2)}
                    </button>
                ))}
                </div>

                <button
                onClick={toggleModal}
                className="mt-6 bg-red-500 hover:bg-red-200 text-2xl text-white hover:text-red-500 px-4 py-2 rounded-lg"
                >
                Close
                </button>
            </div>
            </div>
        )}
        </div>
    );
}
