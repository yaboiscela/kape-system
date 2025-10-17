import React, { useState, useEffect, Suspense } from "react";
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
  const [roles, setRoles] = useState([]);

  const API_URL = import.meta.env.VITE_API_URL || "";

  useEffect(() => {
        const fetchAllData = async () => {
            try {
            const [catRes, addonRes, sizeRes, roleRes] = await Promise.all([
                fetch(`${API_URL}/api/categories`),
                fetch(`${API_URL}/api/addons`),
                fetch(`${API_URL}/api/sizes`),
                fetch(`${API_URL}/api/roles`),
            ]);

            if (!catRes.ok || !addonRes.ok || !sizeRes.ok || !roleRes.ok) {
                throw new Error("Failed to fetch one or more tables");
            }

            const [cats, addons, sizes, roles] = await Promise.all([
                catRes.json(),
                addonRes.json(),
                sizeRes.json(),
                roleRes.json(),
            ]);

            setCategories(cats || []);
            console.log("Fetched categories: %o", cats);
            setAddons(addons || []);
            setSizes(sizes || []);

            setRoles(roles || []);
            console.log("Fetched roles: %o", roles);
            } catch (err) {
            console.error("Fetch tables failed:", err);
            alert("Failed to load data. Check console for details.");
            }
        };

        fetchAllData();
    }, []);

  const [products, setProducts] = useState([]);
  const [addons, setAddons] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [orders, setOrders] = useState([]);
  const [currentUser, setCurrentUser] = useState(() => {
    // Try restoring from localStorage
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);


  // ✅ Verify JWT on mount or refresh
  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_URL}/api/me`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          // Token expired or invalid → clear session
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setCurrentUser(null);
        } else {
          const data = await res.json();
          setCurrentUser(data.user);
          localStorage.setItem("user", JSON.stringify(data.user));
        }
      } catch (err) {
        console.error("Token verification failed:", err);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [API_URL]);

  // 🌀 Show loading spinner while checking token
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // 🚪 If not logged in, show Login page
  if (!currentUser) {
    return (
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        }
      >
        <Login setCurrentUser={setCurrentUser} />
      </Suspense>
    );
  }

  // 🧩 Access control by role
  const userRoleObj = roles.find((r) => r.name.toLowerCase === currentUser?.role.toLowerCase);
  const hasAccess = (page) =>
    !!userRoleObj && Array.isArray(userRoleObj.access) && userRoleObj.access.includes(page);

  return (
    <div className="flex font-sans text-black">
      {/* Sidebar Navigation */}
      <Navigation
        isMinimized={isMinimized}
        setIsMinimized={setIsMinimized}
        currentUser={currentUser}
        roles={roles}
        setCurrentUser={setCurrentUser}
      />

      {/* Main Content */}
      <div className="bg-[#FAF7F3] z-0 p-6 shadow-md relative h-screen overflow-y-auto w-full">
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          }
        >
          <Routes>
            {hasAccess("Dashboard") && (
              <Route path="/" element={<Dashboard isMinimized={isMinimized} />} />
            )}
            {hasAccess("Staff") && <Route path="/staff" element={<Staff roles={roles} />} />}
            {hasAccess("Products") && (
              <Route
                path="/products"
                element={
                  <Products
                    products={products}
                    setProducts={setProducts}
                    sizes={sizes}
                    categories={categories}
                    addons={addons}
                  />
                }
              />
            )}
            {hasAccess("Settings") && (
              <Route
                path="/settings"
                element={
                  <Settings
                    addons={addons}
                    setAddons={setAddons}
                    categories={categories}
                    setCategories={setCategories}
                    sizes={sizes}
                    setSizes={setSizes}
                    roles={roles}
                    setRoles={setRoles}
                  />
                }
              />
            )}
            {hasAccess("Orders") && (
              <Route path="/orders" element={<Orders orders={orders} setOrders={setOrders} />} />
            )}
            {hasAccess("Cashier") && (
              <Route
                path="/cashier"
                element={
                  <Cashier
                    categories={categories}
                    products={products}
                    orders={orders}
                    setOrders={setOrders}
                  />
                }
              />
            )}
          </Routes>
        </Suspense>
      </div>
    </div>
  );
}
