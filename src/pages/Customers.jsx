import React, { useEffect, useState, useRef } from "react";

export default function Customers() {
    const [customers, setCustomers] = useState([
        // Default sample data for development
        {
        customerID: "1",
        name: "Juan Dela Cruz",
        streetNumber: "123",
        address: "Mango Street",
        barangay: "Barangay Uno",
        city: "Manila",
        region: "NCR",
        zip: "1000",
        contactNumber: "09123456789",
        },
        {
        customerID: "2",
        name: "Maria Santos",
        streetNumber: "456",
        address: "Banana Avenue",
        barangay: "Barangay Dos",
        city: "Quezon City",
        region: "NCR",
        zip: "1100",
        contactNumber: "09987654321",
        },
    ]);

    const [search, setSearch] = useState(""); // Live search
    const [loading, setLoading] = useState(true); // Loading state
    const [error, setError] = useState(null); // Error state
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    const contextMenuRef = useRef(null);

    // ----------------- Fetch Customers From Database -----------------
    const loadCustomers = async () => {
        try {
        setLoading(true);
        const res = await fetch("/db/customers_get.php"); // Future DB endpoint
        if (!res.ok) throw new Error("Failed to fetch customers");

        const data = await res.json();

        // Use data from DB, but fallback to defaults if empty
        setCustomers(data.length ? data : customers);
        setError(null);
        } catch (err) {
        console.warn("Using default data:", err.message);
        setError("Unable to load database. Showing default sample data.");
        } finally {
        setLoading(false);
        }
    };

    useEffect(() => {
        loadCustomers();
    }, []);

    // ----------------- Context Menu -----------------
    const handleContextMenu = (e, customer) => {
        e.preventDefault();
        setSelectedCustomer(customer);

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

    // ----------------- Future Features (Edit/Delete) -----------------
    const handleEdit = () => {
        alert(`Edit customer: ${selectedCustomer?.name}`);
        closeContextMenu();
    };

    const handleDelete = () => {
        if (!selectedCustomer) return;
        if (window.confirm(`Delete customer ${selectedCustomer.name}?`)) {
        alert("Delete feature coming soon!");
        }
        closeContextMenu();
    };

  // ----------------- Search Filter -----------------
    const filteredCustomers = customers.filter((customer) =>
        Object.values(customer).some((value) =>
        value?.toString().toLowerCase().includes(search.toLowerCase())
        )
    );

    return (
        <div className="">
        <h2 className="text-3xl pl-10 font-bold text-[#7f5539] mb-4">Customers</h2>

        {/* Status Messages */}
        {loading && (
            <p className="text-gray-500 italic mb-4">Loading customers...</p>
        )}
        {error && <p className="text-red-500 mb-4">{error}</p>}

        {/* Search Bar */}
        <input
            type="text"
            placeholder="Search customer..."
            className="border rounded p-2 mb-4 w-full max-w-md"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
        />

        {/* Customer Table */}
        <div className="overflow-x-auto h- bg-white shadow-md rounded-2xl border">
            <table className="min-w-full text-center">
            <thead className="bg-[#b08968] text-white border-b">
                <tr>
                <th className="px-4 py-2">ID</th>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2 hidden md:table-cell">
                    Street #
                </th>
                <th className="px-4 py-2 hidden md:table-cell">Address</th>
                <th className="px-4 py-2 hidden lg:table-cell">Barangay</th>
                <th className="px-4 py-2">City</th>
                <th className="px-4 py-2 hidden lg:table-cell">Region</th>
                <th className="px-4 py-2">Zip</th>
                <th className="px-4 py-2">Contact</th>
                </tr>
            </thead>
            <tbody>
                {filteredCustomers.length > 0 ? (
                filteredCustomers.map((c) => (
                    <tr
                    key={c.customerID}
                    onContextMenu={(e) => handleContextMenu(e, c)}
                    className="hover:bg-[#feebc0] cursor-pointer odd:bg-[#fef6e4]"
                    >
                    <td className="px-4 py-2">{c.customerID}</td>
                    <td className="px-4 py-2">{c.name}</td>
                    <td className="px-4 py-2 hidden md:table-cell">
                        {c.streetNumber || ""}
                    </td>
                    <td className="px-4 py-2 hidden md:table-cell">
                        {c.address || ""}
                    </td>
                    <td className="px-4 py-2 hidden lg:table-cell">
                        {c.barangay || ""}
                    </td>
                    <td className="px-4 py-2">{c.city || ""}</td>
                    <td className="px-4 py-2 hidden lg:table-cell">
                        {c.region || ""}
                    </td>
                    <td className="px-4 py-2">{c.zip || ""}</td>
                    <td className="px-4 py-2">{c.contactNumber || ""}</td>
                    </tr>
                ))
                ) : (
                <tr>
                    <td
                    colSpan="9"
                    className="text-center text-gray-500 py-4 italic"
                    >
                    No customers found
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
    );
}
