import React, { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Navigation from "./components/Navigation";

import Dashboard from "./pages/Dashboard";
import Staff from "./pages/Staff";
import Products from "./pages/Products";
import Orders from "./pages/Orders";
import Cashier from "./pages/Cashier";
import Settings from "./pages/Settings";
import Login from "./pages/Login";

export default function App() {

  const defaultUsers = [
  { username: "manager", password: "1234", role: "Manager" },
  { username: "barista", password: "1234", role: "Barista" },
];

  const [isMinimized, setIsMinimized] = useState(false);
  
  const [roles, setRoles] = useState(["Manager", "Barista", "Cashier"]);

  const defaultProducts = [
    {
      id: 1,
      name: "Espresso",
      category: "Coffee",
      image: "",
      size: { small: 80, medium: 100, large: 120 },
      addons: [
        { name: "Extra Shot", price: 20 },
        { name: "Whipped Cream", price: 15 },
      ],
    },
    {
      id: 2,
      name: "Cappuccino",
      category: "Coffee",
      image: "",
      size: { small: 90, medium: 110, large: 130 },
      addons: [
        { name: "Caramel Syrup", price: 15 },
        { name: "Vanilla Syrup", price: 15 },
      ],
    },
    {
      id: 3,
      name: "Cake Slice",
      category: "Dessert",
      image: "",
      size: { regular: 120 },
      addons: [
        { name: "Chocolate Drizzle", price: 10 },
        { name: "Extra Frosting", price: 15 },
      ],
    },
    {
      id: 4,
      name: "Latte",
      category: "Coffee",
      image: "",
      size: { small: 85, medium: 105, large: 125 },
      addons: [
        { name: "Soy Milk", price: 20 },
        { name: "Oat Milk", price: 25 },
      ],
    },
    {
      id: 5,
      name: "Cheesecake",
      category: "Dessert",
      image: "",
      size: { slice: 150 },
      addons: [
        { name: "Berry Sauce", price: 20 },
        { name: "Whipped Cream", price: 15 },
      ],
    },
    {
      id: 1,
      name: "Espresso",
      category: "Coffee",
      image: "",
      size: { small: 80, medium: 100, large: 120 },
      addons: [
        { name: "Extra Shot", price: 20 },
        { name: "Whipped Cream", price: 15 },
      ],
    },
    {
      id: 2,
      name: "Cappuccino",
      category: "Coffee",
      image: "",
      size: { small: 90, medium: 110, large: 130 },
      addons: [
        { name: "Caramel Syrup", price: 15 },
        { name: "Vanilla Syrup", price: 15 },
      ],
    },
    {
      id: 3,
      name: "Cake Slice",
      category: "Dessert",
      image: "",
      size: { regular: 120 },
      addons: [
        { name: "Chocolate Drizzle", price: 10 },
        { name: "Extra Frosting", price: 15 },
      ],
    },
    {
      id: 4,
      name: "Latte",
      category: "Coffee",
      image: "",
      size: { small: 85, medium: 105, large: 125 },
      addons: [
        { name: "Soy Milk", price: 20 },
        { name: "Oat Milk", price: 25 },
      ],
    },
    {
      id: 5,
      name: "Cheesecake",
      category: "Dessert",
      image: "",
      size: { slice: 150 },
      addons: [
        { name: "Berry Sauce", price: 20 },
        { name: "Whipped Cream", price: 15 },
      ],
    },
  ];

  const [products, setProducts] = useState(defaultProducts);
  const [addons, setAddons] = useState([
    {name: "milk", category: "Coffee", price: 15.00},
    {name: "milk", category: "Coffee", price: 15.00},
    {name: "milk", category: "Coffee", price: 15.00},
    {name: "milk", category: "Coffee", price: 15.00},
    {name: "milk", category: "Coffee", price: 15.00}
  ])
  const [categories, setCategories] = useState([ "Coffee", "Water-based", "Dessert"])
  const [sizes, setSizes] = useState([
    {name: "16oz", category: "Coffee" ,price: 80.00},
    {name: "22oz", category: "Coffee" ,price: 100.00},
    {name: "Slice", category: "Dessert" ,price: 100.00},
  ])

  const [orders, setOrders] = useState([]);

  const [users] = useState(defaultUsers);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("currentUser", JSON.stringify(currentUser));
    } else {
      localStorage.removeItem("currentUser");
    }
  }, [currentUser]);

  if (!currentUser) {
    return <Login users={users} setCurrentUser={setCurrentUser} />;
  }

  return (
    <div className="flex font-sans text-black">
      {/* Sidebar */}
      <Navigation 
        isMinimized={isMinimized}
        setIsMinimized={setIsMinimized}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser} 
      />

      {/* Main Content */}
      <div className="bg-[#FAF7F3] z-0 p-6 shadow-md relative h-screen overflow-y-auto w-full">
        <Routes>

          {/* Example: Manager-only page */}
          {currentUser.role === "Manager" && (
            <>
              <Route path="/" element={<Dashboard isMinimized={isMinimized} />} />
              <Route path="/staff" element={<Staff roles={roles} />} />
              <Route path="/products" element={<Products products={products} setProducts={setProducts} sizes={sizes} categories={categories} addons={addons}/>} />
              <Route path="/settings" element={<Settings addons={addons} setAddons={setAddons} categories={categories} setCategories={setCategories} sizes={sizes} setSizes={setSizes} roles={roles} setRoles={setRoles} />}/>
            </>
          )}
          <Route path="/orders" element={<Orders orders={orders} setOrders={setOrders} />} />
          <Route path="/cashier" element={<Cashier categories={categories} products={products} orders={orders} setOrders={setOrders} />} />
        </Routes>
      </div>
    </div>
  );
}