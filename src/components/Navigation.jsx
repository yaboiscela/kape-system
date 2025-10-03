import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
IoHomeOutline,
IoPeopleOutline,
IoColorFillOutline,
IoReaderOutline,
IoCashOutline,
IoSettingsOutline,
IoLogOutOutline,
IoMenuOutline,
} from "react-icons/io5";

import { SiBuymeacoffee } from "react-icons/si";
import logo from "../assets/logo.png";

export default function Navigation({isMinimized, setIsMinimized, currentUser, setCurrentUser}) {

    // Dynamic style for NavLink
    const activeStyle = ({ isActive }) =>
        `flex items-center py-2 text-xl font-semibold transition-all duration-300 ${
        isActive
            ? "bg-white text-[#b08968] shadow-md rounded-l-full pl-4.5"
            : `text-[#7f5539] hover:bg-[#b08968] hover:text-white ${isMinimized ? "hover:scale-130" : "hover:scale-107" }  rounded-full pl-[7px] ml-1 mr-3`
        }`;

    const spanStyle = `pl-10 transition-opacity ${isMinimized ? "opacity-0" : ""}`;

    return (
        <div
        className={`relative h-screen bg-[#f8e7d6] transition-all ease-in-out duration-300 ${isMinimized ? "w-17" : "w-80"}`}
        >
        {/* Toggle Button */}
        <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="absolute z-1 -right-14 top-5 opacity-50 bg-[#b08968] text-white p-2 rounded-full shadow-md shadow-black/40 hover:bg-[#7f5539] hover:opacity-100 transition-colors"
        >
            <IoMenuOutline size={30} />
        </button>

        {/* Sidebar Content */}
            <div className="flex flex-col justify-between h-full">
                <ul className={`space-y-4 pl-2 ${isMinimized? "pt-8" : "pt-6"}`}>
                    {/* Logo */}
                    <li
                    className={`flex items-center ${isMinimized ? "mb-10 mt-2" : ""} text-black transition-all duration-300 `}
                    >
                    <SiBuymeacoffee size={50} className={`absolute duration-300 ease-in transition-all  ${isMinimized ? "rotate-360 opacity-100" : " opacity-0"}`} />
                    <img className={`text-2xl pl-2 w-full pr-6 font-bold whitespace-nowrap transition-opacity ease-in duration-300
                            ${isMinimized ? "opacity-0" : ""}`} src={logo} alt="Kape Timplado's"/>
                    </li>
                    {currentUser.role === "Manager" && (
                        <>
                        {/* Dashboard */}
                            <li>
                                <NavLink to="/" className={activeStyle}>
                                    <IoHomeOutline size={30} className="absolute" />
                                    <span className={spanStyle}>Dashboard</span>
                                </NavLink>
                            </li>
                            {/* Staff */}
                            <li>
                                <NavLink to="/staff" className={activeStyle}>
                                    <IoPeopleOutline size={30} className="absolute" />
                                    <span className={spanStyle}>Staff</span>
                                </NavLink>
                            </li>
                            {/* Products */}
                            <li>
                                <NavLink to="/products" className={activeStyle}>
                                    <SiBuymeacoffee size={30} className="absolute" />
                                    <span className={spanStyle}>Products</span>
                                </NavLink>
                            </li>
                        </>
                    )}

                    {/* Orders */}
                    <li>
                    <NavLink to="/orders" className={activeStyle}>
                        <IoReaderOutline size={30} className="absolute" />
                        <span className={spanStyle}>Orders</span>
                    </NavLink>
                    </li>

                    {/* Cashier */}
                    <li>
                    <NavLink to="/cashier" className={activeStyle}>
                        <IoCashOutline size={30} className="absolute" />
                        <span className={spanStyle}>Cashier</span>
                    </NavLink>
                    </li>

                    {currentUser.role === "Manager" && (
                        <> 
                            {/* Settings */}
                                <li>
                                    <NavLink to="/settings" className={activeStyle}>
                                        <IoSettingsOutline size={30} className="absolute" />
                                        <span className={spanStyle}>Settings</span>
                                    </NavLink>
                                </li>
                        </>
                    )}
                </ul>
                <div className="p-3 w-full">
                    {/* Logout */}
                    <button
                        onClick={() => setCurrentUser(null)}
                        className={`flex w-full items-center pl-2.5 py-5.5 rounded-full text-xl font-semibold text-red-600 hover:bg-red-400 hover:text-white transition-all duration-300 `}
                    >
                        <IoLogOutOutline size={30} className="absolute" />
                        <span className={`${spanStyle} fixed`}>Sign Out</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
