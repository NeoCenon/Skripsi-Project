//Instock
"use client";

import Link from 'next/link'; 
import { useState } from "react";
import { FiMenu, FiSearch, FiBell, FiChevronDown } from "react-icons/fi";
import {
  FaBoxOpen,
  FaChartBar,
  FaClipboardList,
  FaShoppingCart,
  FaPlus,
} from "react-icons/fa";
import { MdOutlineInventory2 } from "react-icons/md";

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const stockData = [
    { id: "#7676", product: "Inverter", category: "cat1", status: "Completed" },
    { id: "#7870", product: "Battery", category: "cat1", status: "Pending" },
    { id: "#7970", product: "Generator", category: "cat1", status: "Completed" },
    { id: "#8001", product: "Charger", category: "cat1", status: "Completed" },
    { id: "#8010", product: "Power", category: "cat1", status: "Completed" },
  ];

  const menuItems = [
    { icon: <FaChartBar size={24} />, label: "Dashboard" },
    { icon: <MdOutlineInventory2 size={24} />, label: "In Stock", active: true },
    { icon: <FaBoxOpen size={24} />, label: "Products" },
    { icon: <FaShoppingCart size={24} />, label: "Sales" },
    { icon: <FaClipboardList size={24} />, label: "Orders" },
  ];

  return (
    <div className="flex flex-col h-screen bg-[#F5F6FA] text-black font-[Poppins]">
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
            />
            <FiSearch className="absolute right-3 top-2.5 text-gray-400" size={20} />
          </div>
          <FiBell size={20} className="text-black" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
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
                <div
                  key={index}
                  className={`flex flex-col items-center text-xs cursor-pointer px-2 py-3 rounded-lg ${
                    item.active ? "bg-[#203340]" : "hover:bg-[#203340]"
                  }`}
                >
                  {item.icon}
                  <span className="mt-1 text-[10px] text-white text-center">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Tabs */}
          <div className="px-6 mt-4">
            <div className="inline-flex rounded-t-lg overflow-hidden border border-gray-300">
              <button className="px-6 py-2 text-gray-800 font-medium bg-[#FFE4B0] border-r border-gray-300 rounded-tl-lg">
                Category 1
              </button>
              <button className="px-6 py-2 text-gray-800 font-medium bg-[#FFDA6A] border-r border-[#FFBF00]">
                Category 2
              </button>
              <button className="px-6 py-2 text-gray-800 font-medium bg-[#FFDA6A] border-[#FFBF00] rounded-tr-lg">
                Category 3
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-2xl font-semibold text-black">In stock</h2>
              <button className="flex items-center bg-[#1E88E5] text-white px-4 py-2 rounded-lg text-[24px] font-[Poppins]">
                <FaPlus className="mr-2" />
                New Stock
              </button>
            </div>

            <div className="border-b-2 border-white mb-6"></div>

            {/* Search & Filter */}
            <div className="flex justify-between items-center mb-6">
              <div className="relative w-[264px]">
                <input
                  type="text"
                  placeholder="Quick Search"
                  className="pl-10 pr-4 py-2 border rounded-md w-full h-[44px] text-black"
                />
                <FiSearch className="absolute left-3 top-2.5 text-gray-400" size={20} />
              </div>

              <div className="flex gap-4 items-center">
                <div className="flex gap-2 items-center border px-4 h-[44px] rounded-md cursor-pointer">
                  <span className="text-black text-[24px]">📅</span>
                </div>

                <button className="flex items-center gap-2 px-4 h-[44px] border rounded-md text-black text-[24px] font-[Poppins]">
                  Status
                  <FiChevronDown size={24} />
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg overflow-hidden mt-6">
              <table className="w-full border-[2px] border-gray-300 font-[Poppins]">
                <thead>
                  <tr className="border-b-[2px]">
                    <th className="p-4 text-left">
                      <input type="checkbox" className="rounded" />
                    </th>
                    <th className="p-4 text-left text-gray-600 text-[20px] font-medium">Order ID</th>
                    <th className="p-4 text-left text-gray-600 text-[20px] font-medium">Product</th>
                    <th className="p-4 text-left text-gray-600 text-[20px] font-medium">Category</th>
                    <th className="p-4 text-left text-gray-600 text-[20px] font-medium">Sales channel</th>
                    <th className="p-4 text-left text-gray-600 text-[20px] font-medium">Instruction</th>
                    <th className="p-4 text-left text-gray-600 text-[20px] font-medium">Items</th>
                    <th className="p-4 text-left text-gray-600 text-[20px] font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stockData.map((item, index) => (
                    <tr key={index} className="border-b-[2px] hover:bg-gray-50 text-[16px]">
                      <td className="p-4">
                        <input type="checkbox" className="rounded" />
                      </td>
                      <td className="p-4 text-gray-800">{item.id}</td>
                      <td className="p-4 text-gray-800">{item.product}</td>
                      <td className="p-4 text-gray-800">{item.category}</td>
                      <td className="p-4 text-gray-800">Store name</td>
                      <td className="p-4 text-gray-800">
                        {(item.id !== "#7870" && item.id !== "#8010") ? "Stock adjustment" : ""}
                      </td>
                      <td className="p-4 text-gray-800">80/100</td>
                      <td className="p-4">
                        <span
                          className={`px-4 py-1 rounded-full text-sm font-medium ${
                            item.status === "Completed"
                              ? "bg-[#52B788] text-black"
                              : "bg-[#D1F2C7] text-green-800"
                          }`}
                          style={{ width: "167.71px", height: "30px", lineHeight: "30px" }}
                        >
                          {item.status}
                        </span>
                      </td>
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
