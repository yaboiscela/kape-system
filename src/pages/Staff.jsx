import { useState, useEffect } from "react";
import { FaEye, FaEyeSlash } from 'react-icons/fa';

export default function Staff({ roles }) {
    
    const [staff, setStaff] = useState([]);

    const API_URL = import.meta.env.VITE_API_URL || "";

    const [form, setForm] = useState({
        username: "",
        name: "",
        role: roles[0]?.name || "",
        active: true,
    });

    const generatePassword = (length = 8) => {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        return Array.from({ length }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join("");
    };

    const addStaffMember = async (e) => {
        e.preventDefault();
        if (!form.username.trim() || !form.name.trim() || !form.role) return;

        const password = generatePassword();

        const newStaff = {
            username: form.username,
            name: form.name,
            role: form.role,
            password,
            active: form.active,
        };

        try {
            const res = await fetch(`${API_URL}/api/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newStaff),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to add staff");

            // use the id returned by the server when available
            const created = { ...newStaff, id: data.id };
            setStaff((prev) => [...prev, created]);
            alert(`Staff added!\nUsername: ${form.username}\nPassword: ${password}`);
            setForm({ username: "", name: "", role: roles[0]?.name || "", active: true });
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    };

    // Load users from backend on mount
    useEffect(() => {
        let mounted = true;
        const fetchUsers = async () => {
            try {
                const res = await fetch(`${API_URL}/api/users`);
                if (!res.ok) return;
                const data = await res.json();
                if (mounted) setStaff(data);
            } catch (err) {
                console.error('Failed to fetch users', err);
            }
        }
        fetchUsers();
        return () => { mounted = false };
    }, []);

    // Toggle active state on backend and update UI
    const toggleActive = async (id, currentActive) => {
        try {
            const res = await fetch(`${API_URL}/api/users/${id}/active`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ active: !currentActive })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update');
            setStaff(prev => prev.map(s => s.id === id ? { ...s, active: data.active } : s));
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    }

    // password visibility state map
    const [visiblePasswords, setVisiblePasswords] = useState({});

    const resetPassword = async (id) => {
        try {
            const res = await fetch(`${API_URL}/api/users/${id}/reset-password`, { method: 'PATCH' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to reset');
            // update staff entry with returned password and show it
            setStaff(prev => prev.map(s => s.id === id ? { ...s, password: data.password } : s));
            setVisiblePasswords(prev => ({ ...prev, [id]: true }));
            alert(`Password reset for ${data.username}: ${data.password}`);
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    }

    return (
        <div>
            <h1 className="pl-10 text-3xl font-bold text-[#7f5539] mb-6">Staff</h1>
            <form className="border p-4 mb-6 rounded shadow-md" onSubmit={addStaffMember}>
                <h2 className="text-xl font-semibold mb-4">Add New Staff Member</h2>

                <div className="mb-4">
                    <label className="block text-gray-700 mb-2" htmlFor="username">Username</label>
                    <input
                        className="w-full border border-gray-300 p-2 rounded"
                        type="text"
                        id="username"
                        value={form.username}
                        onChange={(e) => setForm(f => ({ ...f, username: e.target.value }))}
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700 mb-2" htmlFor="name">Name</label>
                    <input
                        className="w-full border border-gray-300 p-2 rounded"
                        type="text"
                        id="name"
                        value={form.name}
                        onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700 mb-2" htmlFor="role">Role</label>
                    <select
                        className="block border border-gray-300 rounded p-2 w-full text-gray-700"
                        id="role"
                        value={form.role}
                        onChange={(e) => setForm(f => ({ ...f, role: e.target.value }))}
                    >
                        {roles.map((role) => (
                            <option key={role.id} value={role.name}>
                                {role.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center mb-4">
                    <input
                        id="active"
                        type="checkbox"
                        checked={form.active}
                        onChange={(e) => setForm(f => ({ ...f, active: e.target.checked }))}
                        className="mr-2"
                    />
                    <label htmlFor="active" className="text-gray-700">Active</label>
                </div>

                <button
                    type="submit"
                    className="bg-dark-coffee text-white px-4 py-2 mt-4 rounded hover:bg-coffee transition"
                >
                    Add Staff Member
                </button>
            </form>

            <div className="border border-dark-coffee rounded-2xl overflow-x-auto shadow-md">
                <table className="w-full border-collapse">
                    <thead className="bg-coffee text-white font-semibold">
                        <tr>
                            <th className="px-4 py-2">ID</th>
                            <th className="px-4 py-2">Username</th>
                            <th className="px-4 py-2">Name</th>
                            <th className="px-4 py-2">Role</th>
                            <th className="px-4 py-2">Action</th>
                        </tr>
                    </thead>
                    <tbody className="text-center">
                        {staff.map((member) => (
                            <tr key={member.id}>
                                <td className="px-4 py-2">{member.id}</td>
                                <td className="px-4 py-2">{member.username}</td>
                                <td className="px-4 py-2">{member.name}</td>
                                <td className="px-4 py-2">{member.role}</td>
                                <td className="py-2 flex items-center justify-center gap-2">
                                    <button onClick={() => toggleActive(member.id, member.active)} className={`px-3 py-1 rounded ${member.active ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                                        {member.active ? 'Deactivate' : 'Activate'}
                                    </button>
                                    <button onClick={() => resetPassword(member.id)} className="px-3 py-1 rounded bg-blue-500 text-white">
                                        Reset Password
                                    </button>
                                </td>

                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
