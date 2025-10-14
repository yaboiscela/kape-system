import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

export default function Products({ products, setProducts, categories, sizes, addons }) {
    // ----------------- States -----------------
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("All");
    
    const [selectedProduct, setSelectedProduct] = useState(null);
    const contextMenuRef = useRef(null);
    
    const [tempAddons, setTempAddons] = useState([]);
    
    // Regular vs Sizes
    const [isRegularSelected, setIsRegularSelected] = useState(false);
    const [selectedSizes, setSelectedSizes] = useState([]);
    
    // Selected category for new product
    const [selectedCategory, setSelectedCategory] = useState("");

    // ----------------- Add Product -----------------
    const handleAddProduct = async (e) => {
        e.preventDefault();

        const formData = new FormData(e.target);

        // Construct product data
        const newProduct = {
            id: products.length + 1,
            name: formData.get("productName"),
            category: selectedCategory,
            image: "",
            size: {},
            addons: tempAddons,
        };

        if (isRegularSelected) {
            const regularPrice = formData.get("regularPrice");
            if (regularPrice) newProduct.size["regular"] = parseFloat(regularPrice);
        } else {
            sizes.forEach((size) => {
            if (formData.getAll("sizes[]").includes(size.name)) {
                const customPrice = formData.get(`price_${size.name}`);
                newProduct.size[size.name.toLowerCase()] =
                customPrice ? parseFloat(customPrice) : size.price;
            }
            });
        }

        setProducts((prev) => [...prev, newProduct]);

        // ---------------- Save to Flask backend ----------------
        try {
            const token = localStorage.getItem("token");
            formData.append("addons", JSON.stringify(tempAddons));
            formData.append("size", JSON.stringify(newProduct.size));
            formData.append("category", selectedCategory);

            await axios.post(`${API_URL}/api/products`, formData, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "multipart/form-data",
            },
            });

            console.log("✅ Product added successfully");
        } catch (err) {
            console.error("❌ Error adding product:", err.response?.data || err.message);
            alert("Error adding product");
        }

        // Reset form
        setIsRegularSelected(false);
        setSelectedSizes([]);
        setSelectedCategory("");
        setTempAddons([]);
        e.target.reset();
        };

        // ----------------- Load Data -----------------
    const loadProducts = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");

            const res = await axios.get(`${API_URL}/api/products`, {
            headers: { Authorization: `Bearer ${token}` },
            });

            const data = res.data;
            setProducts(data.length > 0 ? data : defaultProducts);
            setError(null);
        } catch (err) {
            console.warn("Using default fallback products:", err.message);
            setError("Unable to load products from database.");
            setProducts(defaultProducts); // ✅ fallback to sample data
        } finally {
            setLoading(false);
        }
    };

    const loadSizeOptions = async () => {
        try {
        const res = await fetch("/db/getSizes.php");
        if (!res.ok) throw new Error("Failed to fetch sizes");

        const data = await res.json();
        setSizes(data.length > 0 ? data : defaultSizes);
        } catch (err) {
        console.warn("Using default sizes:", err.message);
        setSizes(defaultSizes);
        }
    };

    useEffect(() => {
        loadProducts();
        loadSizeOptions();
    }, []);

    // ----------------- Regular vs Sizes Logic -----------------
    const handleRegularToggle = (e) => {
        const checked = e.target.checked;
        setIsRegularSelected(checked);
        if (checked) {
        setSelectedSizes([]); // Clear sizes if Regular is selected
        }
    };

    const handleSizeToggle = (e, sizeName) => {
        const checked = e.target.checked;
        if (checked) {
        setSelectedSizes((prev) => [...prev, sizeName]);
        setIsRegularSelected(false); // Turn off Regular when a size is selected
        } else {
        setSelectedSizes((prev) => prev.filter((name) => name !== sizeName));
        }
    };


    // ----------------- Context Menu -----------------
    const handleContextMenu = (e, product) => {
        e.preventDefault();
        setSelectedProduct(product);

        if (contextMenuRef.current) {
        contextMenuRef.current.style.top = `${e.pageY}px`;
        contextMenuRef.current.style.left = `${e.pageX}px`;
        contextMenuRef.current.style.display = "block";
        }
    };

    const closeContextMenu = () => {
        if (contextMenuRef.current) {
        contextMenuRef.current.style.display = "none";
        }
    };

    useEffect(() => {
        document.addEventListener("click", closeContextMenu);
        return () => document.removeEventListener("click", closeContextMenu);
    }, []);

    // ----------------- Delete Product -----------------
    const handleDelete = async () => {
        if (!selectedProduct) return;
        if (!window.confirm(`Delete product: ${selectedProduct.name}?`)) return;

        const fd = new FormData();
        fd.append("productID", selectedProduct.id);

        try {
        const res = await fetch("/db/products_delete.php", {
            method: "POST",
            body: fd,
        });
        const result = await res.text();
        if (result === "success") {
            await loadProducts();
        } else {
            alert("Error: " + result);
        }
        } catch (err) {
        console.error("Error deleting product:", err);
        }
        closeContextMenu();
    };

    const handleEdit = () => {
        alert(`Edit product: ${selectedProduct?.name}`);
        closeContextMenu();
    };

    // ----------------- Filters -----------------
    const filteredProducts = products.filter((p) => {
        const matchesCategory =
        categoryFilter === "All" || p.category === categoryFilter;
        const matchesSearch = [
        p.name,
        p.category,
        ...Object.keys(p.size),
        ...(p.addons?.map((a) => a.name) || []),
        ]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());

        return matchesCategory && matchesSearch;
    });

    // Dynamic filtering of sizes and add-ons based on selected category
    const filteredSizes = sizes.filter((s) => s.category === selectedCategory);
    const filteredAddons = addons.filter((a) => a.category === selectedCategory);

    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null)

    const handleFileChange = (e) => {
        const selected = e.target.files[0]
        if (selected) {
            setFile(selected)
            setPreview(URL.createObjectURL(selected))
        }
    }

    // ----------------- UI -----------------
    return (
        <div className="w-full" >
            <h2 className="pl-10 text-3xl font-bold text-[#7f5539] mb-4">Products</h2>
                {/* Status Messages */}
                {loading && <p className="italic text-gray-500">Loading products...</p>}
                {error && <p className="text-red-500">{error}</p>}
            <div className="flex flex-col lg:flex-row gap-6 w-full">
                {/* Add Product Form */}
                <form
                    onSubmit={handleAddProduct}
                    className="lg:w-1/2 p-4 border rounded shadow-md "
                >

                        <div className="flex gap-4">
                            <div>
                                <h3 className="text-lg font-semibold mb-3">Add Product</h3>
                                <div>
                                    {/* Product Name */}
                                    <input
                                    type="text"
                                    name="productName"
                                    placeholder="Product Name"
                                    className="border rounded p-2 w-full mb-2"
                                    required
                                    />

                                    {/* Category Selection */}
                                    <select
                                    name="category"
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="border rounded p-2 w-full mb-4"
                                    required
                                    >
                                    <option value="">Select Category</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.name}>
                                        {cat.name}
                                        </option>
                                    ))}
                                    </select>
                                </div>
                            </div>
                            
                            {/* Product Image */}
                            <div>
                                <label className="block mb-1 font-semibold">Product Image:</label>
                                <div className="mb-4 relative">
                                    <div className="h-40 w-40 border overflow-hidden">
                                        {preview && (
                                                <img className="h-full" src={preview} alt="" />
                                            )}
                                    </div>
                                    <label className="absolute bg-[#b08968] text-white hover:bg-[#7f5539] p-1 rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2  w-30 cursor-pointer flex" htmlFor="imageFiles">Upload Image</label>
                                    <input id="imageFiles" className="hidden" onChange={handleFileChange} type="file" name="productImage" accept="image/*" />
                                </div>
                            </div>
                        </div>

                    <div className="flex w-full gap-4">
                    {/* Pricing Section */}
                    <div className="w-1/2">
                        <h4 className="font-semibold mb-2">Price</h4>

                        {/* Regular Pricing */}
                        <div className="mb-2">
                        <label className="flex items-center gap-2">
                            <input
                            type="checkbox"
                            checked={isRegularSelected}
                            onChange={handleRegularToggle}
                            disabled={selectedSizes.length > 0} // disable if any size is selected
                            />
                            Regular Pricing
                        </label>
                        <input
                            type="number"
                            name="regularPrice"
                            placeholder="Enter regular price"
                            className="border rounded p-1 w-40 mt-2"
                            disabled={!isRegularSelected}
                        />
                        </div>

                        <div className="mb-2 flex items-center">
                        <div className="h-[2px] w-full bg-black" />
                        <h1 className="px-2">or</h1>
                        <div className="h-[2px] w-full bg-black" />
                        </div>

                        {/* Varying Sizes */}
                        <div className="space-y-2 mb-4">
                        {filteredSizes.length > 0 ? (
                            filteredSizes.map((size) => (
                            <div
                                key={size.name}
                                className="flex items-center justify-between"
                            >
                                <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    name="sizes[]"
                                    value={size.name}
                                    checked={selectedSizes.includes(size.name)}
                                    disabled={isRegularSelected}
                                    onChange={(e) => handleSizeToggle(e, size.name)}
                                />
                                {size.name} (₱{size.price})
                                </label>
                                <input
                                type="number"
                                name={`price_${size.name}`}
                                placeholder="Custom Price (optional)"
                                className="border rounded p-1 w-50"
                                disabled={
                                    isRegularSelected || !selectedSizes.includes(size.name)
                                }
                                />
                            </div>
                            ))
                        ) : (
                            <p className="italic text-gray-400">No sizes for this category</p>
                        )}
                        </div>
                    </div>

                    {/* Add-ons Section */}
                    <div className="mb-4">
                        <h4 className="font-semibold mb-2">Add-ons</h4>
                        <div className="flex flex-col gap-2 mb-2">
                        {filteredAddons.length > 0 ? (
                            filteredAddons.map((addon, idx) => (
                            <label key={idx} className="flex items-center gap-2">
                                <input
                                type="checkbox"
                                value={addon.name}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                    setTempAddons((prev) => [...prev, addon]);
                                    } else {
                                    setTempAddons((prev) =>
                                        prev.filter((a) => a.name !== addon.name)
                                    );
                                    }
                                }}
                                />
                                {addon.name} (₱{addon.price})
                            </label>
                            ))
                        ) : (
                            <p className="italic text-gray-400">
                            No add-ons for this category
                            </p>
                        )}
                        </div>
                    </div>
                    </div>

                    <button
                    type="submit"
                    className="mt-4 bg-[#b08968] text-white px-4 py-2 rounded hover:bg-[#7f5539]"
                    >
                    Add Product
                    </button>
                </form>
                <div className="lg:w-1/2">
                    {/* Filters */}
                    <div className="flex gap-4 mb-4">
                        <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="border rounded p-2"
                        >
                        <option value="All">All Categories</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.name}>
                            {cat.name}
                            </option>
                        ))}
                        </select>

                        <input
                        type="text"
                        placeholder="Search products..."
                        className="border rounded p-2 flex-1"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {/* Product Table */}
                    <div className="overflow-x-auto bg-white rounded-2xl shadow-md border">
                        <table className="min-w-full">
                        <thead className="bg-[#b08968] text-white">
                            <tr>
                            <th className="px-4 py-2">ID</th>
                            <th className="px-4 py-2">Product Name</th>
                            <th className="px-4 py-2">Category</th>
                            <th className="px-4 py-2">Sizes</th>
                            <th className="px-4 py-2">Add-ons</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.length > 0 ? (
                            filteredProducts.map((p) => (
                                <tr
                                key={p.id}
                                onContextMenu={(e) => handleContextMenu(e, p)}
                                className="hover:bg-[#fbe8c8] cursor-pointer text-center odd:bg-[#f6f6f6]"
                                >
                                <td className="px-4 py-2">{p.id}</td>
                                <td className="px-4 py-2">{p.name}</td>
                                <td className="px-4 py-2">{p.category}</td>
                                <td className="px-4 py-2">
                                    {Object.entries(p.size).map(([key, value]) => (
                                    <div key={key}>
                                        {key.charAt(0).toUpperCase() + key.slice(1)}: ₱{value}
                                    </div>
                                    ))}
                                </td>
                                <td className="px-4 py-2">
                                    {p.addons?.length > 0 ? (
                                    p.addons.map((addon, idx) => (
                                        <div key={idx}>
                                        {addon.name} (₱{addon.price})
                                        </div>
                                    ))
                                    ) : (
                                    <span className="italic text-gray-400">None</span>
                                    )}
                                </td>
                                </tr>
                            ))
                            ) : (
                            <tr>
                                <td
                                colSpan="5"
                                className="text-center py-4 italic text-gray-500"
                                >
                                No products found
                                </td>
                            </tr>
                            )}
                        </tbody>
                        </table>
                    </div>

                    {/* Context Menu */}
                    <ul
                        ref={contextMenuRef}
                        className="absolute bg-white shadow-lg rounded border border-gray-400 w-32 text-sm hidden"
                        style={{ display: "none", position: "absolute", zIndex: 50 }}
                    >
                        <li
                        className="px-4 py-2 bg-blue-200 hover:bg-blue-400 text-blue-600 hover:text-white cursor-pointer"
                        onClick={handleEdit}
                        >
                        Edit
                        </li>
                        <li
                        className="px-4 py-2 bg-red-200 hover:bg-red-400 text-red-600 hover:text-white cursor-pointer"
                        onClick={handleDelete}
                        >
                        Delete
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
