import { useState } from "react";
import { FaUser, FaLock } from "react-icons/fa";

export default function Login({setCurrentUser }) {
    const [form, setForm] = useState({ username: "", password: "" });
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        try {
            const res = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: form.username.trim(),
                    password: form.password.trim(),
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Login failed.");
                return;
            }
            setCurrentUser(data.user);
        } catch (err) {
            setError("Network error. Please try again.");
        }
    };

    return (
        <div className="flex items-center justify-center h-screen bg-[#FAF7F3]">
        <form
            onSubmit={handleLogin}
            className="bg-white rounded-2xl shadow-md p-10 w-full max-w-sm"
        >
            <h1 className="text-2xl font-semibold text-center mb-6 text-gray-800">
            Café System Login
            </h1>

            {error && (
            <div className="bg-red-100 text-red-600 text-sm p-2 rounded mb-3">
                {error}
            </div>
            )}

            <div className="mb-4">
            <label className="block text-gray-600 mb-1 text-sm">Username</label>
            <div className="flex items-center border rounded-lg px-3">
                <FaUser className="text-gray-500 mr-2" />
                <input
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                className="w-full p-2 outline-none text-gray-700"
                placeholder="Enter username"
                autoFocus
                />
            </div>
            </div>

            <div className="mb-6">
            <label className="block text-gray-600 mb-1 text-sm">Password</label>
            <div className="flex items-center border rounded-lg px-3">
                <FaLock className="text-gray-500 mr-2" />
                <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="w-full p-2 outline-none text-gray-700"
                placeholder="Enter password"
                />
            </div>
            </div>

            <button
            type="submit"
            className="w-full bg-[#503CEB] text-white py-2 rounded-lg hover:bg-[#3b2fd1] transition-all"
            >
            Login
            </button>
        </form>
        </div>
    );
}
