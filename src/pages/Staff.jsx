import { useState } from "react"

export default function Staff({roles}) {

    const [staff, setStaff] = useState([
        { id: 123890, user: "John", name: "John Doe", role: "Manager"},
    ])

    const addStaffMember = () => {
        
    }

    return (
        <div>
            <h1 className="pl-10 text-3xl font-bold text-[#7f5539] mb-6">Staff</h1>
            <form className="border p-4 mb-6 rounded shadow-md">
                <h2 className="text-xl font-semibold mb-4">Add New Staff Member</h2>
                <div className="mb-4">
                    <label className="block text-gray-700 mb-2" htmlFor="username">Username</label>
                    <input className="w-full border border-gray-300 p-2 rounded" type="text" id="username" name="username" />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700 mb-2" htmlFor="name">Name</label>
                    <input className="w-full border border-gray-300 p-2 rounded" type="text" id="name" name="name" />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700 mb-2" htmlFor="role">Role</label>
                    <select className="block border border-gray-300 rounded p-2 w-full text-gray-700" name="" id="">
                        {roles.map((role) => (
                            <option key={role} value={role}>{role}</option>
                        ))}
                    </select>
                </div>
                <button className="bg-dark-coffee text-white px-4 py-2 mt-4 rounded hover:bg-coffee transition">Add Staff Member</button>
            </form>

            <div className="border border-dark-coffee rounded-2xl overflow-x-auto shadow-md">
                <table className="w-full border-collapse">
                    <thead className="bg-coffee text-white font-semibold">
                        <tr>
                            <th className="px-4 py-2">ID</th>
                            <th className="px-4 py-2">Username</th>
                            <th className="px-4 py-2">Name</th>
                            <th className="px-4 py-2">Role</th>
                        </tr>
                    </thead>
                    <tbody className="text-center">
                        {staff.map((member) => (
                            <tr key={member.id}>
                                <td className="px-4 py-2">{member.id}</td>
                                <td className="px-4 py-2">{member.user}</td>
                                <td className="px-4 py-2">{member.name}</td>
                                <td className="px-4 py-2">{member.role}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}