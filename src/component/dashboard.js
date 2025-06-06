"use client";

import Link from "next/link";
import { useState } from "react";
import { FiMenu, FiSearch, FiBell } from "react-icons/fi";
import {
  FaChartBar,
  FaBoxOpen,
  FaClipboardList,
  FaShoppingCart,
  FaMoneyBillWave,
  FaWallet,
  FaPiggyBank,
  FaPercentage,
} from "react-icons/fa";
import { MdOutlineInventory2 } from "react-icons/md";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { icon: <FaChartBar size={24} />, label: "Dashboard", href:"/dashboard", active: true },
        { icon: <MdOutlineInventory2 size={24} />, label: "In Stocks", href:"/instock" },
        { icon: <FaBoxOpen size={24} />, label: "Products", href:"/product" },
        { icon: <FaClipboardList size={24} />, label: "Orders", href:"/order" },
        { icon: <FaTruck size={24} />, label: "Suppliers", href:"/supplier" },
        { icon: <FaUser size={24} />, label: "Account Management", href:"/accountmanagement" },
  ];

  const summaryCards = [
    { title: "Revenue", value: "+ 30,000", icon: <FaMoneyBillWave size={20} />, color: "text-green-500" },
    { title: "Expenses", value: "- 30,000", icon: <FaWallet size={20} />, color: "text-red-500" },
    { title: "Income", value: "+ 30,000", icon: <FaPiggyBank size={20} />, color: "text-green-500" },
    { title: "Margin", value: "30%", icon: <FaPercentage size={20} />, color: "text-green-500" },
  ];

  const tableHeaders = ["order ID", "Date", "Quantity", "Alert amt.", "Status"];

  const barData = [
    { name: "Jan", stock: 4000, sales: 2400 },
    { name: "Feb", stock: 3000, sales: 1398 },
    { name: "Mar", stock: 2000, sales: 9800 },
    { name: "Apr", stock: 2780, sales: 3908 },
    { name: "May", stock: 1890, sales: 4800 },
  ];

  const pieData = [
    { name: "Product A", value: 400 },
    { name: "Product B", value: 300 },
    { name: "Product C", value: 300 },
    { name: "Product D", value: 200 },
  ];

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  return (
    <div className="flex flex-col h-screen bg-white text-black font-[Poppins]">
      {/* Top Navbar */}
      <div className="flex justify-between items-center px-6 py-4 bg-white border-b">
        <div className="flex items-center gap-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}>
            <FiMenu size={24} className="text-black" />
          </button>
          <h1 className="text-xl font-semibold text-black">E-Inventoria</h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="relative">
            <input
              type="text"
              className="pl-4 pr-10 py-2 bg-gray-100 rounded-full w-[592px] h-[40px] text-black"
              placeholder="Search..."
            />
            <FiSearch className="absolute right-3 top-2.5 text-gray-400" size={20} />
          </div>
          <FiBell size={20} className="text-black" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-300 rounded-full" />
            <span className="text-black">Admin ▾</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Sidebar */}
        {sidebarOpen && (
          <div className="bg-[#12232E] text-white w-[80px] flex flex-col items-center pt-6">
            <div className="flex flex-col items-center space-y-6 mt-6">
              {menuItems.map((item, index) => (
                <Link href={item.href} key={index}>
                <div
                  key={index}
                  className={`flex flex-col items-center text-xs cursor-pointer px-2 py-3 rounded-lg ${
                    item.active ? "bg-[#203340]" : "hover:bg-[#203340]"
                  }`}
                >
                  {item.icon}
                  <span className="mt-1 text-[10px] text-white text-center">{item.label}</span>
                </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 p-8 overflow-auto bg-[#F5F7FA]">
          <h2 className="text-2xl font-semibold mb-8">Dashboard</h2>

          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            {summaryCards.map((card, idx) => (
              <div key={idx} className="bg-white p-6 rounded-xl shadow flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{card.title}</span>
                  <span className={card.color}>{card.icon}</span>
                </div>
                <p className="text-2xl font-bold">{card.value}</p>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-2 gap-4 mb-8 h-[300px]">
            <div className="bg-white p-6 rounded-xl shadow">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="stock" fill="#FF8C42" />
                  <Bar dataKey="sales" fill="#4F46E5" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white p-6 rounded-xl shadow flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tables */}
          <div className="grid grid-cols-2 gap-4">
            {/* Stock Alert */}
            <div className="bg-white p-6 rounded-xl shadow">
              <h3 className="font-semibold mb-4">Stock Alert</h3>
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b">
                    {tableHeaders.map((h, i) => (
                      <th key={i} className="py-2">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3].map((row) => (
                    <tr key={row} className="border-b text-gray-600">
                      {tableHeaders.map((_, i) => (
                        <td key={i} className="py-2">Sample</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Top Selling */}
            <div className="bg-white p-6 rounded-xl shadow">
              <h3 className="font-semibold mb-4">Top Selling Products</h3>
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b">
                    {["order ID", "Quantity", "Alert amt."].map((h, i) => (
                      <th key={i} className="py-2">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3].map((row) => (
                    <tr key={row} className="border-b text-gray-600">
                      <td>Sample</td>
                      <td>Sample</td>
                      <td>Sample</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
