import React, { useState, useEffect, Suspense, act } from "react";
import { Routes, Route } from "react-router-dom";
import Navigation from "./components/Navigation";

const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const Staff = React.lazy(() => import("./pages/Staff"));
const Products = React.lazy(() => import("./pages/Products"));
const Orders = React.lazy(() => import("./pages/Orders"));
const Cashier = React.lazy(() => import("./pages/Cashier"));
const Settings = React.lazy(() => import("./pages/Settings"));
const Login = React.lazy(() => import("./pages/Login"));

export default function App() {

  const [isMinimized, setIsMinimized] = useState(false);
  
  const [roles, setRoles] = useState([
      {
        id: 1,
        name: "Manager",
        access: ["Dashboard", "Staff", "Products", "Settings", "Orders", "Cashier"]
      },
      {
        id: 2,
        name: "Barista",
        access: ["Orders", "Cashier"]
      }
    ]
  );

  const defaultProducts = [];

  const [products, setProducts] = useState(defaultProducts);
  const [addons, setAddons] = useState([])
  const [categories, setCategories] = useState([])
  const [sizes, setSizes] = useState([])

  const [orders, setOrders] = useState([]);

  const [currentUser, setCurrentUser] = useState(null);

  // Persist user session
  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      // don't restore sessions for deactivated accounts
      if (parsed && parsed.active === false) {
        localStorage.removeItem("currentUser");
      } else {
        setCurrentUser(parsed);
      }
    }
  }, []);

  // Update localStorage when currentUser changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("currentUser", JSON.stringify(currentUser));
    } else {
      localStorage.removeItem("currentUser");
    }
  }, [currentUser]);

  // If no user is logged in or the account is inactive, show login page
  if (!currentUser || currentUser.active === false) {
    return (
      <Suspense fallback={
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      }>
        <Login setCurrentUser={setCurrentUser} />
      </Suspense>
    );
  }

  
  const userRoleObj = roles.find(r => r.name === currentUser?.role);
  const hasAccess = (page) => !!userRoleObj && Array.isArray(userRoleObj.access) && userRoleObj.access.includes(page);

  return (
    <div className="flex font-sans text-black">
      {/* Sidebar */}
      <Navigation 
        isMinimized={isMinimized}
        setIsMinimized={setIsMinimized}
        currentUser={currentUser}
        roles={roles}
        setCurrentUser={setCurrentUser} 
      />

      {/* Main Content */}
      <div className="bg-[#FAF7F3] z-0 p-6 shadow-md relative h-screen overflow-y-auto w-full">
        <Suspense fallback={
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        }>
          <Routes>
            {hasAccess("Dashboard") && <Route path="/" element={<Dashboard isMinimized={isMinimized} />} />}
            {hasAccess("Staff") && <Route path="/staff" element={<Staff roles={roles} />} />}
            {hasAccess("Products") && <Route path="/products" element={<Products products={products} setProducts={setProducts} sizes={sizes} categories={categories} addons={addons}/>} />}
            {hasAccess("Settings") && <Route path="/settings" element={<Settings addons={addons} setAddons={setAddons} categories={categories} setCategories={setCategories} sizes={sizes} setSizes={setSizes} roles={roles} setRoles={setRoles} />}/>} 
            {hasAccess("Orders") && <Route path="/orders" element={<Orders orders={orders} setOrders={setOrders} />} />}
            {hasAccess("Cashier") && <Route path="/cashier" element={<Cashier categories={categories} products={products} orders={orders} setOrders={setOrders} />} />}
          </Routes>
        </Suspense>
      </div>
    </div>
  );
}