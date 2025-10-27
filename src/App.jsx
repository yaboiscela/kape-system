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
  const [staff, setStaff] = useState([]);
  const [products, setProducts] = useState([]);
  const [addons, setAddons] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [orders, setOrders] = useState([]);
  const [roles, setRoles] = useState([]);
  const [currentUser, setCurrentUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL || "";

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const token = localStorage.getItem("token"); // or sessionStorage, depending on your auth setup
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const [catRes, addonRes, sizeRes, roleRes, prodRes, userRes, orderRes] = await Promise.all([
          fetch(`${API_URL}/api/categories`, { headers }),
          fetch(`${API_URL}/api/addons`, { headers }),
          fetch(`${API_URL}/api/sizes`, { headers }),
          fetch(`${API_URL}/api/roles`, { headers }),
          fetch(`${API_URL}/api/products`, { headers }),
          fetch(`${API_URL}/api/users`, { headers }),
          fetch(`${API_URL}/api/orders`, { headers }),
        ]);

        if (![catRes, addonRes, sizeRes, roleRes, prodRes, userRes, orderRes].every(r => r.ok)) {
          throw new Error("Failed to fetch one or more tables");
        }

        const [cats, addons, sizes, roles, products, staffs, orders] = await Promise.all([
          catRes.json(),
          addonRes.json(),
          sizeRes.json(),
          roleRes.json(),
          prodRes.json(),
          userRes.json(),
          orderRes.json(),
        ]);

        setCategories(cats || []);
        setAddons(addons || []);
        setSizes(sizes || []);
        setProducts(products || []);
        setRoles(roles || []);
        setStaff(staffs || []);
        setOrders(orders || []);

        console.log("Fetched data:", { cats, addons, sizes, roles, products });

      } catch (err) {
        console.error("Fetch tables failed:", err);
        alert("Failed to load data. Check console for details.");
      }
    };
    
    if (currentUser) {
      fetchAllData();
    }

  }, [currentUser, API_URL]);

  

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
              <Route path="/" element={<Dashboard isMinimized={isMinimized} staff={staff} products={products} orders={orders} />} />
            )}
            {hasAccess("Staff") && <Route path="/staff" element={<Staff roles={roles} staff={staff} setStaff={setStaff} />} />}
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
