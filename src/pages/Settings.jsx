import React, { useState, useEffect } from "react";
import AddonsItems from "../components/AddonsItems";
import { IoIosArrowDown } from "react-icons/io";


function Modal({ open, onClose, children, title }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-lg shadow-lg p-6 min-w-[300px] max-w-[90vw] relative">
            <button
            className="absolute top-2 right-3 text-gray-500 hover:text-black text-2xl"
            onClick={onClose}
            >
            &times;
            </button>
            {title && <h2 className="text-xl font-semibold text-[#7f5539] mb-3">{title}</h2>}
            {children}
        </div>
        </div>
    );
    }

    export default function Settings({
    addons,
    setAddons,
    categories,
    setCategories,
    sizes,
    setSizes,
    roles,
    setRoles,
    }) {
    // collapse states
    const [addonMinimize, setAddonMinimize] = useState(true);
    const [categoriesMinimize, setCategoriesMinimize] = useState(true);
    const [sizesMinimize, setSizesMinimize] = useState(true);
    const [roleMinimize, setRoleMinimize] = useState(true);

    // modal states
    const [editModal, setEditModal] = useState({ type: null, data: null }); // type: 'category'|'addon'|'size'|'role'
    const [deleteModal, setDeleteModal] = useState({ type: null, data: null }); // data = id or name

    // local form state for adds
    const [categoryName, setCategoryName] = useState("");
    const [addonName, setAddonName] = useState("");
    const [addonPrice, setAddonPrice] = useState("");
    const [addonCategory, setAddonCategory] = useState(categories[0] || "");
    const [sizeName, setSizeName] = useState("");
    const [sizePrice, setSizePrice] = useState("");
    const [sizeCategory, setSizeCategory] = useState(categories[0] || "");
    const [roleName, setRoleName] = useState("");
    const [accessPages, setAccessPages] = useState([]);

    const pages = ["Orders", "Cashier", "Products", "Staff", "Settings", "Dashboard"];

    // sync categories default when categories prop changes
    useEffect(() => {
        if (!categories.includes(addonCategory)) setAddonCategory(categories[0] || "");
        if (!categories.includes(sizeCategory)) setSizeCategory(categories[0] || "");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [categories]);

    // ----------------- Fetch helpers -----------------
    const handleFetchError = async (res) => {
        const content = await res.text().catch(() => "");
        throw new Error(`${res.status} ${res.statusText} ${content}`);
    };

    // ----------------- Categories CRUD -----------------
    const addCategory = async (e) => {
        e?.preventDefault?.();
        const name = (categoryName || "").trim();
        if (!name) return alert("Category name cannot be empty.");

        if (categories.some((c) => c.name.toLowerCase() === name.toLowerCase()))
        return alert("Category already exists!");

        // POST to backend
        try {
        const res = await fetch("/api/categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: name.toLowerCase() }),
        });
        if (!res.ok) await handleFetchError(res);
        const created = await res.json(); // expect { id, name } or name
        // update local state (backend authoritative)
        if (created?.name) setCategories((p) => [...p, {
            id: p.length+1,
            name:created.name}]);
            else setCategories((p) => [...p, name.toLowerCase()]);
            console.log(categories)
        setCategoryName("");
        } catch (err) {
        console.error("Add category:", err);
        alert("Failed to add category. See console.");
        }
    };

    const openEditCategory = (cat) => {
        setEditModal({ type: "category", data: { old: cat, value: cat } });
    };

    const saveEditCategory = async () => {
        const { old, value } = editModal.data;
        const newName = (value || "").trim();
        if (!newName) return alert("Category name cannot be empty.");
        if (categories.some((c) => c.name.toLowerCase() === newName.toLowerCase() && c !== old))
        return alert("Category already exists.");

        try {
        // our backend could accept either id-based or old-name-based update.
        // We'll send { oldName, newName }
        const res = await fetch(`/api/categories/${old}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ newName: newName.toLowerCase() }),
        });
        if (!res.ok) await handleFetchError(res);
        // on success, update local state and also update referencing addons & sizes
        setCategories((prev) => prev.map((c) => (c === old ? newName.toLowerCase() : c)));
        setAddons((prev) => prev.map((a) => (a.category === old ? { ...a, category: newName.toLowerCase() } : a)));
        setSizes((prev) => prev.map((s) => (s.category === old ? { ...s, category: newName.toLowerCase() } : s)));
        setEditModal({ type: null, data: null });
        } catch (err) {
        console.error("Edit category:", err);
        alert("Failed to edit category. See console.");
        }
    };

    const confirmDeleteCategory = (cat) => {
        // validation: prevent deletion if referenced
        const usedInAddons = addons.some((a) => a.category === cat);
        const usedInSizes = sizes.some((s) => s.category === cat);
        if (usedInAddons || usedInSizes) {
        return alert("Cannot delete: category is used by Addons or Sizes.");
        }
        if (!confirm(`Delete category "${capitalize(cat.name)}"?`)) return;
        deleteCategory(cat);
    };

    const deleteCategory = async (cat) => {
        try {
        const res = await fetch(`/api/categories/${cat.id}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: cat }),
        });
        if (!res.ok) await handleFetchError(res);
        setCategories((prev) => prev.filter((c) => c !== cat));
        } catch (err) {
        console.error("Delete category:", err);
        alert("Failed to delete category. See console.");
        }
    };

    // ----------------- Addons CRUD -----------------
    const addAddon = async (e) => {
        e?.preventDefault?.();
        const name = (addonName || "").trim();
        const price = parseFloat(addonPrice);
        const category = (addonCategory || "").trim().toLowerCase();

        if (!name) return alert("Addon name required");
        if (isNaN(price) || price < 0) return alert("Enter a valid price");
        if (!category) return alert("Select a category");

        if (addons.some((a) => a.name.toLowerCase() === name.toLowerCase()))
        return alert("Addon already exists");

        try {
        const res = await fetch("/api/addons", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: name.toLowerCase(), price, category }),
        });
        if (!res.ok) await handleFetchError(res);
        const created = await res.json(); // expect created addon with id
        setAddons((prev) => [...prev, created]);
        setAddonName("");
        setAddonPrice("");
        setAddonCategory(categories[0] || "");
        } catch (err) {
        console.error("Add addon:", err);
        alert("Failed to add addon. See console.");
        }
    };

    const openEditAddon = (addon) => {
        setEditModal({ type: "addon", data: { ...addon } });
    };

    const saveEditAddon = async () => {
        const a = editModal.data;
        if (!a.name || a.name.trim() === "") return alert("Name required");
        if (isNaN(parseFloat(a.price)) || parseFloat(a.price) < 0) return alert("Valid price required");
        try {
        const res = await fetch(`/api/addons/${a.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: a.name.toLowerCase(), price: parseFloat(a.price), category: a.category }),
        });
        if (!res.ok) await handleFetchError(res);
        const updated = await res.json();
        setAddons((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        setEditModal({ type: null, data: null });
        } catch (err) {
        console.error("Edit addon:", err);
        alert("Failed to edit addon. See console.");
        }
    };

    const confirmDeleteAddon = (id) => {
        if (!confirm("Delete this addon?")) return;
        deleteAddon(id);
    };

    const deleteAddon = async (id) => {
        try {
        const res = await fetch(`/api/addons/${id}`, { method: "DELETE" });
        if (!res.ok) await handleFetchError(res);
        setAddons((prev) => prev.filter((a) => a.id !== id));
        } catch (err) {
        console.error("Delete addon:", err);
        alert("Failed to delete addon. See console.");
        }
    };

    // ----------------- Sizes CRUD -----------------
    const addSize = async (e) => {
        e?.preventDefault?.();
        const name = (sizeName || "").trim();
        const price = parseFloat(sizePrice);
        const category = (sizeCategory || "").trim().toLowerCase();

        if (!name) return alert("Size name required");
        if (isNaN(price) || price < 0) return alert("Enter a valid price");
        if (!category) return alert("Select a category");
        if (sizes.some((s) => s.name.toLowerCase() === name.toLowerCase()))
        return alert("Size already exists");

        try {
        const res = await fetch("/api/sizes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: name.toLowerCase(), price, category }),
        });
        if (!res.ok) await handleFetchError(res);
        const created = await res.json();
        setSizes((prev) => [...prev, created]);
        setSizeName("");
        setSizePrice("");
        setSizeCategory(categories[0] || "");
        } catch (err) {
        console.error("Add size:", err);
        alert("Failed to add size. See console.");
        }
    };

    const openEditSize = (size) => {
        setEditModal({ type: "size", data: { ...size } });
    };

    const saveEditSize = async () => {
        const s = editModal.data;
        if (!s.name || s.name.trim() === "") return alert("Name required");
        if (isNaN(parseFloat(s.price)) || parseFloat(s.price) < 0) return alert("Valid price required");
        try {
        const res = await fetch(`/api/sizes/${s.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: s.name.toLowerCase(), price: parseFloat(s.price), category: s.category }),
        });
        if (!res.ok) await handleFetchError(res);
        const updated = await res.json();
        setSizes((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        setEditModal({ type: null, data: null });
        } catch (err) {
        console.error("Edit size:", err);
        alert("Failed to edit size. See console.");
        }
    };

    const confirmDeleteSize = (id) => {
        if (!confirm("Delete this size?")) return;
        deleteSize(id);
    };

    const deleteSize = async (id) => {
        try {
        const res = await fetch(`/api/sizes/${id}`, { method: "DELETE" });
        if (!res.ok) await handleFetchError(res);
        setSizes((prev) => prev.filter((s) => s.id !== id));
        } catch (err) {
        console.error("Delete size:", err);
        alert("Failed to delete size. See console.");
        }
    };

    // ----------------- Roles CRUD -----------------
    const addRole = async () => {
        const name = (roleName || "").trim();
        if (!name) return alert("Please enter a role name");
        if (roles.some((r) => r.name.toLowerCase() === name.toLowerCase()))
        return alert("Role already exists");
        try {
        const res = await fetch("/api/roles", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: name.toLowerCase(), access: accessPages }),
        });
        if (!res.ok) await handleFetchError(res);
        const created = await res.json();
        setRoles((prev) => [...prev, created]);
        setRoleName("");
        setAccessPages([]);
        } catch (err) {
        console.error("Add role:", err);
        alert("Failed to add role. See console.");
        }
    };

    const openEditRole = (role) => {
        // ensure `access` is an array
        setEditModal({ type: "role", data: { ...role, access: role.access || [] } });
    };

    const saveEditRole = async () => {
        const r = editModal.data;
        if (!r.name || r.name.trim() === "") return alert("Role name required");
        try {
        const res = await fetch(`/api/roles/${r.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: r.name.toLowerCase(), access: r.access }),
        });
        if (!res.ok) await handleFetchError(res);
        const updated = await res.json();
        setRoles((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        setEditModal({ type: null, data: null });
        } catch (err) {
        console.error("Edit role:", err);
        alert("Failed to edit role. See console.");
        }
    };

    const confirmDeleteRole = (id) => {
        if (!confirm("Delete this role?")) return;
        deleteRole(id);
    };

    const deleteRole = async (id) => {
        try {
        const res = await fetch(`/api/roles/${id}`, { method: "DELETE" });
        if (!res.ok) await handleFetchError(res);
        setRoles((prev) => prev.filter((r) => r.id !== id));
        } catch (err) {
        console.error("Delete role:", err);
        alert("Failed to delete role. See console.");
        }
    };

    // ----------------- Helpers -----------------
    const capitalize = (s) =>
        typeof s === "string" ? s.charAt(0).toUpperCase() + s.slice(1) : "";


    // ----------------- Render -----------------
    return (
        <div>
        <h2 className="pl-10 text-3xl font-bold text-[#7f5539] mb-4">Settings</h2>

        <h2 className="mb-2 text-lg font-semibold">Products Settings</h2>

        {/* Categories */}
        <section
            className={`mb-4 rounded-lg transition-all duration-300 overflow-hidden ${
            categoriesMinimize ? "max-h-[55px] shadow-md" : "max-h-[1000px]"
            }`}
        >
            <div className="mb-4 bg-[#f8e7d6] rounded-lg shadow-md p-4">
            <div className={`flex justify-between items-center transition-all ${categoriesMinimize ? "" : "mb-2"}`}>
                <h4 className="font-semibold text-[#7f5539]">Categories</h4>
                <button aria-label="Toggle categories" onClick={() => setCategoriesMinimize((p) => !p)}>
                <IoIosArrowDown className={`transition-all ${categoriesMinimize ? "rotate-180" : ""}`} />
                </button>
            </div>

            <form className={`flex gap-2 mb-2 transition-all duration-300 ${categoriesMinimize ? "opacity-0 overflow-hidden" : "opacity-100 h-auto"}`} onSubmit={addCategory}>
                <input
                type="text"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="Category Name"
                className="border border-[#7f5539] bg-white rounded p-2 flex-1"
                />
                <button type="submit" className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600">
                Add
                </button>
            </form>
            </div>

            <div className="max-h-120 rounded-lg px-2 overflow-y-auto relative">
            <div className="flex justify-between top-0 text-center sticky bg-[#7f5539] shadow-md text-white text-lg font-semibold p-2 rounded-lg">
                <h1 className="w-full">Name</h1>
                <h1 className="w-full">Action</h1>
            </div>

            <ul className="space-y-2 py-2">
                {categories.map((item) => (
                <li key={item.id} className="flex justify-between items-center text-center p-2 rounded-lg bg-[#f8e7d6] shadow-md text-[#7f5539] text-lg">
                    <h1 className="w-full">{capitalize(item.name)}</h1>
                    <div className="w-full items-center gap-2 flex flex-col">
                    <button onClick={() => openEditCategory(item.name)} className="cursor-pointer p-1 border rounded transition-colors bg-blue-100 text-blue-500 hover:text-white hover:bg-blue-500 w-20">edit</button>
                    <button onClick={() => confirmDeleteCategory(item)} className="cursor-pointer p-1 border rounded transition-colors bg-red-100 text-red-500 hover:text-white hover:bg-red-500 w-20">delete</button>
                    </div>
                </li>
                ))}
            </ul>
            </div>
        </section>

        {/* Add-ons */}
        <section className={`rounded-lg mb-4 transition-all duration-300 overflow-hidden ${addonMinimize ? "max-h-[55px] shadow-md" : "max-h-[1000px]"}`}>
            <div className="mb-4 bg-[#f8e7d6] rounded-lg shadow-md p-4">
            <div className={`flex justify-between items-center transition-all ${addonMinimize ? "" : "mb-2"}`}>
                <h4 className="font-semibold text-[#7f5539]">Add-ons</h4>
                <button aria-label="Toggle add-ons" onClick={() => setAddonMinimize((p) => !p)}>
                <IoIosArrowDown className={`transition-all ${addonMinimize ? "rotate-180" : ""}`} />
                </button>
            </div>

            <form className={`flex gap-2 mb-2 transition-all duration-300 ${addonMinimize ? "opacity-0 overflow-hidden" : "opacity-100 h-auto"}`} onSubmit={addAddon}>
                <input
                type="text"
                value={addonName}
                onChange={(e) => setAddonName(e.target.value)}
                placeholder="Addon Name"
                className="border border-[#7f5539] bg-white rounded p-2 flex-1 w-1/6"
                />

                <select value={addonCategory} onChange={(e) => setAddonCategory(e.target.value)} className="border border-[#7f5539] text-[#7f5539] bg-white rounded p-2 w-1/6">
                {categories.map((category) => (
                    <option key={category.id} value={category.name}>
                    {capitalize(category.name)}
                    </option>
                ))}
                </select>

                <input
                type="number"
                value={addonPrice}
                onChange={(e) => setAddonPrice(e.target.value)}
                placeholder="Price"
                className="border border-[#7f5539] bg-white rounded p-2 w-1/6"
                />

                <button type="submit" className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600">
                Add
                </button>
            </form>
            </div>

            <div className="max-h-120 rounded-lg px-2 overflow-y-auto relative">
            <div className="flex justify-between top-0 text-center sticky bg-[#7f5539] shadow-md text-white text-lg font-semibold p-2 rounded-lg">
                <h1 className="w-full">Name</h1>
                <h1 className="w-full">Category</h1>
                <h1 className="w-full">Price</h1>
                <h1 className="w-full">Action</h1>
            </div>

            <ul className="space-y-2 py-2">
                {addons.map((item) => (
                    <AddonsItems
                        key={item.id}
                        id={item.id}
                        name={capitalize(item.name)}
                        category={capitalize(item.category)}
                        price={Number(item.price)}
                        onEdit={() => openEditAddon(item)}
                        onDelete={() => confirmDeleteAddon(item.id)}
                    />
                ))}
            </ul>
            </div>
        </section>

        {/* Sizes */}
        <section className={`rounded-lg transition-all duration-300 overflow-hidden ${sizesMinimize ? "max-h-[55px] shadow-md" : "max-h-[1000px]"}`}>
            <div className="mb-4 bg-[#f8e7d6] rounded-lg shadow-md p-4">
            <div className={`flex justify-between items-center transition-all ${sizesMinimize ? "" : "mb-2"}`}>
                <h4 className="font-semibold text-[#7f5539]">Sizes</h4>
                <button aria-label="Toggle sizes" onClick={() => setSizesMinimize((p) => !p)}>
                <IoIosArrowDown className={`transition-all ${sizesMinimize ? "rotate-180" : ""}`} />
                </button>
            </div>

            <form className={`flex gap-2 mb-2 transition-all duration-300 ${sizesMinimize ? "opacity-0 overflow-hidden" : "opacity-100 h-auto"}`} onSubmit={addSize}>
                <input
                type="text"
                value={sizeName}
                onChange={(e) => setSizeName(e.target.value)}
                placeholder="Size Name"
                className="border border-[#7f5539] bg-white rounded p-2 flex-1"
                />

                <select value={sizeCategory} onChange={(e) => setSizeCategory(e.target.value)} className="border border-[#7f5539] text-[#7f5539] bg-white rounded p-2 w-50">
                {categories.map((category) => (
                    <option key={category.id} value={category.name}>
                    {capitalize(category.name)}
                    </option>
                ))}
                </select>

                <input
                type="number"
                value={sizePrice}
                onChange={(e) => setSizePrice(e.target.value)}
                placeholder="Price"
                className="border border-[#7f5539] bg-white rounded p-2 w-28"
                />

                <button type="submit" className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600">
                Add
                </button>
            </form>
            </div>

            <div className="max-h-120 rounded-lg px-2 overflow-y-auto relative">
            <div className="flex justify-between top-0 text-center sticky bg-[#7f5539] shadow-md text-white text-lg font-semibold p-2 rounded-lg">
                <h1 className="w-full">Name</h1>
                <h1 className="w-full">Category</h1>
                <h1 className="w-full">Price</h1>
                <h1 className="w-full">Action</h1>
            </div>

            <ul className="space-y-2 py-2">
                {sizes.map((item) => (
                <li key={item.id} className="flex justify-between items-center text-center p-2 rounded-lg bg-[#f8e7d6] shadow-md text-[#7f5539] text-lg">
                    <h1 className="w-full">{capitalize(item.name)}</h1>
                    <h1 className="w-full">{capitalize(item.category)}</h1>
                    <h1 className="w-full">{item.price}</h1>
                    <div className="w-full items-center gap-2 flex flex-col">
                    <button onClick={() => openEditSize(item)} className="cursor-pointer p-1 border rounded transition-colors bg-blue-100 text-blue-500 hover:text-white hover:bg-blue-500 w-20">edit</button>
                    <button onClick={() => confirmDeleteSize(item.id)} className="cursor-pointer p-1 border rounded transition-colors bg-red-100 text-red-500 hover:text-white hover:bg-red-500 w-20">delete</button>
                    </div>
                </li>
                ))}
            </ul>
            </div>
        </section>

        <h2 className="mb-2 mt-6 text-lg font-semibold">Staff Settings</h2>

        {/* Roles */}
        <section className={`rounded-lg mb-4 transition-all overflow-hidden ${roleMinimize ? "max-h-[55px] shadow-md" : "max-h-[1000px]"}`}>
            <div className="mb-4 bg-[#f8e7d6] rounded-lg shadow-md p-4">
            <div className={`flex justify-between items-center transition-all ${roleMinimize ? "" : "mb-2"}`}>
                <h4 className="font-semibold text-[#7f5539]">Roles</h4>
                <button aria-label="Toggle roles" onClick={() => setRoleMinimize((p) => !p)}>
                <IoIosArrowDown className={`transition-all ${roleMinimize ? "rotate-180" : ""}`} />
                </button>
            </div>

            <div className={`flex gap-2 mb-2 transition-all ${roleMinimize ? "opacity-0 overflow-hidden" : "opacity-100 h-auto"}`}>
                <input
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                type="text"
                placeholder="Role Name"
                className="border w-1/2 border-[#7f5539] bg-white rounded p-2 flex-1"
                />

                <div className="w-1/2 grid grid-cols-3 gap-2 max-h-32 p-2 overflow-auto">
                {pages.map((page) => (
                    <div key={page} className="flex items-center gap-2">
                    <input type="checkbox" name={page} id={page} checked={accessPages.includes(page)} onChange={() => setAccessPages((prev) => (prev.includes(page) ? prev.filter((p) => p !== page) : [...prev, page]))} />
                    <label htmlFor={page} className="capitalize">{page}</label>
                    </div>
                ))}
                </div>

                <button onClick={addRole} type="button" className="bg-green-500 text-white px-3 py-1 w-20 rounded hover:bg-green-600">
                Add
                </button>
            </div>
            </div>

            <div className="max-h-120 rounded-lg px-2 overflow-y-auto relative">
            <div className="flex justify-between top-0 text-center sticky bg-[#7f5539] shadow-md text-white text-lg font-semibold p-2 rounded-lg">
                <h1 className="w-full">Name</h1>
                <h1 className="w-full">Access</h1>
                <h1 className="w-full">Action</h1>
            </div>

            <ul className="space-y-2 py-2">
                {roles.map((item) => (
                <li key={item.id} className="flex justify-between items-center text-center p-2 rounded-lg bg-[#f8e7d6] shadow-md text-[#7f5539] text-lg">
                    <h1 className="w-full">{capitalize(item.name)}</h1>
                    <ul className="w-full space-y-1">
                    {item.access && item.access.length > 0 ? (
                        item.access.map((page, index) => <li key={index} className="text-sm">{page}</li>)
                    ) : (
                        <li className="text-sm italic text-gray-500">No Access</li>
                    )}
                    </ul>
                    <div className="w-full items-center gap-2 flex flex-col">
                    <button onClick={() => openEditRole(item)} className="cursor-pointer p-1 border rounded transition-colors bg-blue-100 text-blue-500 hover:text-white hover:bg-blue-500 w-20">edit</button>
                    <button onClick={() => confirmDeleteRole(item.id)} className="cursor-pointer p-1 border rounded transition-colors bg-red-100 text-red-500 hover:text-white hover:bg-red-500 w-20">delete</button>
                    </div>
                </li>
                ))}
            </ul>
            </div>
        </section>

        {/* -------------------- EDIT MODALS -------------------- */}

        {/* Category Edit Modal */}
        <Modal open={editModal.type === "category"} onClose={() => setEditModal({ type: null, data: null })} title="Edit Category">
            <input
            value={editModal.data?.value || ""}
            onChange={(e) => setEditModal((p) => ({ ...p, data: { ...p.data, value: e.target.value } }))}
            className="w-full border p-2 rounded mb-3"
            />
            <div className="flex justify-end gap-2">
            <button onClick={() => setEditModal({ type: null, data: null })} className="px-3 py-1 bg-gray-200 rounded">Cancel</button>
            <button onClick={saveEditCategory} className="px-3 py-1 bg-green-500 text-white rounded">Save</button>
            </div>
        </Modal>

        {/* Addon Edit Modal */}
        <Modal open={editModal.type === "addon"} onClose={() => setEditModal({ type: null, data: null })} title="Edit Addon">
            <input className="w-full border p-2 rounded mb-2" value={editModal.data?.name || ""} onChange={(e) => setEditModal((p) => ({ ...p, data: { ...p.data, name: e.target.value } }))} />
            <select className="w-full border p-2 rounded mb-2" value={editModal.data?.category || ""} onChange={(e) => setEditModal((p) => ({ ...p, data: { ...p.data, category: e.target.value } }))}>
            {categories.map((c) => <option key={c} value={c}>{capitalize(c)}</option>)}
            </select>
            <input className="w-full border p-2 rounded mb-3" type="number" value={editModal.data?.price ?? ""} onChange={(e) => setEditModal((p) => ({ ...p, data: { ...p.data, price: e.target.value } }))} />
            <div className="flex justify-end gap-2">
            <button onClick={() => setEditModal({ type: null, data: null })} className="px-3 py-1 bg-gray-200 rounded">Cancel</button>
            <button onClick={saveEditAddon} className="px-3 py-1 bg-green-500 text-white rounded">Save</button>
            </div>
        </Modal>

        {/* Size Edit Modal */}
        <Modal open={editModal.type === "size"} onClose={() => setEditModal({ type: null, data: null })} title="Edit Size">
            <input className="w-full border p-2 rounded mb-2" value={editModal.data?.name || ""} onChange={(e) => setEditModal((p) => ({ ...p, data: { ...p.data, name: e.target.value } }))} />
            <select className="w-full border p-2 rounded mb-2" value={editModal.data?.category || ""} onChange={(e) => setEditModal((p) => ({ ...p, data: { ...p.data, category: e.target.value } }))}>
            {categories.map((c) => <option key={c} value={c}>{capitalize(c)}</option>)}
            </select>
            <input className="w-full border p-2 rounded mb-3" type="number" value={editModal.data?.price ?? ""} onChange={(e) => setEditModal((p) => ({ ...p, data: { ...p.data, price: e.target.value } }))} />
            <div className="flex justify-end gap-2">
            <button onClick={() => setEditModal({ type: null, data: null })} className="px-3 py-1 bg-gray-200 rounded">Cancel</button>
            <button onClick={saveEditSize} className="px-3 py-1 bg-green-500 text-white rounded">Save</button>
            </div>
        </Modal>

        {/* Role Edit Modal */}
        <Modal open={editModal.type === "role"} onClose={() => setEditModal({ type: null, data: null })} title="Edit Role">
            <input className="w-full border p-2 rounded mb-2" value={editModal.data?.name || ""} onChange={(e) => setEditModal((p) => ({ ...p, data: { ...p.data, name: e.target.value } }))} />
            <div className="grid grid-cols-2 gap-2 max-h-44 overflow-auto">
            {pages.map((pg) => (
                <label key={pg} className="flex items-center gap-2">
                <input
                    type="checkbox"
                    checked={editModal.data?.access?.includes(pg) || false}
                    onChange={() =>
                    setEditModal((p) => {
                        const data = p.data || { access: [] };
                        const has = data.access?.includes(pg);
                        return {
                        ...p,
                        data: {
                            ...data,
                            access: has ? data.access.filter((x) => x !== pg) : [...(data.access || []), pg],
                        },
                        };
                    })
                    }
                />
                {pg}
                </label>
            ))}
            </div>

            <div className="flex justify-end gap-2 mt-3">
            <button onClick={() => setEditModal({ type: null, data: null })} className="px-3 py-1 bg-gray-200 rounded">Cancel</button>
            <button onClick={saveEditRole} className="px-3 py-1 bg-green-500 text-white rounded">Save</button>
            </div>
        </Modal>
        </div>
    );
}
