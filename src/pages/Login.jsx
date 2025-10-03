import React, { useState } from "react";

export default function Login({ users, setCurrentUser }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleLogin = (e) => {
        e.preventDefault();
        const foundUser = users.find(
        (u) => u.username === username && u.password === password
        );

        if (foundUser) {
        setCurrentUser(foundUser);
        } else {
        setError("Invalid credentials");
        }
    };

    return (
        <div className="flex h-screen justify-center items-center bg-[#FAF7F3]">
        <form onSubmit={handleLogin} className="p-6 shadow-lg bg-white rounded-md w-96">
            <h2 className="text-xl font-bold mb-4">Login</h2>
            
            <input
            type="text"
            placeholder="Username"
            className="w-full border p-2 mb-2"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            />
            
            <input
            type="password"
            placeholder="Password"
            className="w-full border p-2 mb-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            />
            
            {error && <p className="text-red-500 mb-2">{error}</p>}

            <button type="submit" className="w-full bg-black text-white p-2 rounded-md">
            Login
            </button>
        </form>
        </div>
    );
}
