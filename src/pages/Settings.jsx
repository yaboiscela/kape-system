import { useState } from "react";

import AddonsItems from "../components/AddonsItems";
import { IoIosArrowDown } from "react-icons/io";

export default function Settings({addons, setAddons, categories, setCategories, sizes, setSizes}){

    const [addonMinimize, setAddonMinize] = useState(true)
    const [categoriesMinimize, setCategoriesMinize] = useState(true)
    const [sizesMinimize, setSizesMinize] = useState(true)

    const [addonName, setAddonName] = useState("");
    const [addonPrice, setAddonPrice] = useState("");

    // ----------------- Add-ons Logic -----------------
    const handleAddAddon = (e) => {
        e.preventDefault();
        if (!addonName.trim() || !addonPrice.trim()) return;

        setAddons((prev) => [
        ...prev,
        { id: addons + 1, name: addonName.trim(), price: parseFloat(addonPrice) },
        ]);

        setAddonName("");
        setAddonPrice(0);
    };

    return (
        <div>
            <h2 className="pl-10 text-3xl font-bold text-[#7f5539] mb-4">Settings</h2>

            {/* Categories */}
            <div
            className={`mb-4 rounded-lg transition-all duration-300 overflow-hidden ${
                categoriesMinimize ? "max-h-[55px] shadow-md" : "max-h-[1000px]"
            }`}
            >
                {/* Add Categories */}
                <div className="mb-4 bg-[#f8e7d6] rounded-lg shadow-md p-4">
                    <div className={`flex justify-between items-center transition-all ${categoriesMinimize ? "" : "mb-2"}`}>
                        <h4 className="font-semibold text-[#7f5539]">Categories</h4>
                        <button onClick={() => (setCategoriesMinize(prev => !prev))}> <IoIosArrowDown className={`transition-all ${categoriesMinimize ? "rotate-180" : ""}`} /> </button>
                    </div>
                    <div className={`flex gap-2 mb-2 transition-all duration-300 ${categoriesMinimize ? "opacity-0 overflow-hidden" : "opacity-100 h-auto"}`}>
                        <input
                        type="text"
                        value={addonName}
                        onChange={(e) => setAddonName(e.target.value)}
                        placeholder="Category Name"
                        className="border border-[#7f5539] bg-white rounded p-2 flex-1"
                        />
                        <button
                        type="button"
                        onClick={handleAddAddon}
                        className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                        >
                        Add
                        </button>
                    </div>
                </div>

                {/* Current Categories */}                
                <div className="max-h-120 rounded-lg px-2 overflow-y-auto relative">
                        <div className="flex justify-between top-0 text-center sticky bg-[#7f5539] shadow-md text-white text-lg font-semibold p-2 rounded-lg">
                            <h1 className="w-full">Name</h1>
                            <h1 className="w-full">Action</h1>
                        </div>
                    <ul className="space-y-2 py-2">
                        {categories.map((item) => (
                            <li className="flex justify-between items-center text-center p-2 rounded-lg bg-[#f8e7d6] shadow-md text-[#7f5539] text-lg">
                                <h1 className="w-full">{item}</h1>
                                <div className="w-full items-center gap-2 flex flex-col">
                                    <button className="cursor-pointer p-1 border rounded transition-colors bg-blue-100 text-blue-500 hover:text-white hover:bg-blue-500 w-20">edit</button>
                                    <button className="cursor-pointer p-1 border rounded transition-colors bg-red-100 text-red-500 hover:text-white hover:bg-red-500 w-20">delete</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Add-ons */}
            <div
            className={`rounded-lg mb-4 transition-all duration-300 overflow-hidden ${
                sizesMinimize ? "max-h-[55px] shadow-md" : "max-h-[1000px]"
            }`}
            >
                {/* Add Add-ons */}
                <div className="mb-4 bg-[#f8e7d6] rounded-lg shadow-md p-4">
                    <div className={`flex justify-between items-center transition-all ${sizesMinimize ? "" : "mb-2"}`}>
                        <h4 className="font-semibold text-[#7f5539]">Add-ons</h4>
                        <button onClick={() => (setSizesMinize(prev => !prev))}> <IoIosArrowDown className={`transition-all ${sizesMinimize ? "rotate-180" : ""}`} /> </button>
                    </div>
                    <div className={`flex gap-2 mb-2 transition-all duration-300 ${sizesMinimize ? "opacity-0 overflow-hidden" : "opacity-100 h-auto"}`}>
                        <input
                        type="text"
                        value={addonName}
                        onChange={(e) => setAddonName(e.target.value)}
                        placeholder="Addon Name"
                        className="border border-[#7f5539] bg-white rounded p-2 flex-1 w-1/6"
                        />
                        <select className="border border-[#7f5539] text-[#7f5539] bg-white rounded p-2 w-1/6" name="" id="">
                            {categories.map((category) => 
                                (<option value="">{category}</option>)
                            )}
                        </select>
                        <input
                        type="number"
                        value={addonPrice}
                        onChange={(e) => setAddonPrice(e.target.value)}
                        placeholder="Price"
                        className="border border-[#7f5539] bg-white rounded p-2 w-1/6"
                        />
                        <button
                        type="button"
                        onClick={handleAddAddon}
                        className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                        >
                        Add
                        </button>
                    </div>
                </div>

                {/* Current Add-ons */}
                <div className="max-h-120 rounded-lg px-2 overflow-y-auto relative">
                        <div className="flex justify-between top-0 text-center sticky bg-[#7f5539] shadow-md text-white text-lg font-semibold p-2 rounded-lg">
                            <h1 className="w-full">Name</h1>
                            <h1 className="w-full">Category</h1>
                            <h1 className="w-full">Price</h1>
                            <h1 className="w-full">Action</h1>
                        </div>
                    <ul className="space-y-2 py-2">
                        {addons.map((item) => (
                            <AddonsItems name={item.name} category={item.category} price={item.price} />
                        ))}
                    </ul>
                </div>
            </div>

            {/* Sizes */}
            <div
            className={`rounded-lg transition-all duration-300 overflow-hidden ${
                addonMinimize ? "max-h-[55px] shadow-md" : "max-h-[1000px]"
            }`}
            >
                {/* Add Sizes */}
                <div className="mb-4 bg-[#f8e7d6] rounded-lg shadow-md p-4">
                    <div className={`flex justify-between items-center transition-all ${addonMinimize ? "" : "mb-2"}`}>
                        <h4 className="font-semibold text-[#7f5539]">Sizes</h4>
                        <button onClick={() => (setAddonMinize(prev => !prev))}> <IoIosArrowDown className={`transition-all ${addonMinimize ? "rotate-180" : ""}`} /> </button>
                    </div>
                    <div className={`flex gap-2 mb-2 transition-all duration-300 ${addonMinimize ? "opacity-0 overflow-hidden" : "opacity-100 h-auto"}`}>
                        <input
                        type="text"
                        value={addonName}
                        onChange={(e) => setAddonName(e.target.value)}
                        placeholder="Size Name"
                        className="border border-[#7f5539] bg-white rounded p-2 flex-1"
                        />
                        <select className="border border-[#7f5539] text-[#7f5539] bg-white rounded p-2 w-50" name="" id="">
                            {categories.map((category) => 
                                (<option value="">{category}</option>)
                            )}
                        </select>
                        <input
                        type="number"
                        value={addonPrice}
                        onChange={(e) => setAddonPrice(e.target.value)}
                        placeholder="Price"
                        className="border border-[#7f5539] bg-white rounded p-2 w-28"
                        />
                        <button
                        type="button"
                        onClick={handleAddAddon}
                        className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                        >
                        Add
                        </button>
                    </div>
                </div>
                
                {/* Current Sizes */}
                <div className="max-h-120 rounded-lg px-2 overflow-y-auto relative">
                        <div className="flex justify-between top-0 text-center sticky bg-[#7f5539] shadow-md text-white text-lg font-semibold p-2 rounded-lg">
                            <h1 className="w-full">Name</h1>
                            <h1 className="w-full">Category</h1>
                            <h1 className="w-full">Price</h1>
                            <h1 className="w-full">Action</h1>
                        </div>
                    <ul className="space-y-2 py-2">
                        {sizes.map((item) => (
                            <AddonsItems name={item.name} category={item.category} price={item.price} />
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    )
}