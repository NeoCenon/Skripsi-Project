"use client";

import { useState } from "react";
import {
  FaChartBar,
  FaBoxOpen,
  FaClipboardList,
  FaShoppingCart,
  FaUser,
} from "react-icons/fa";
import { MdOutlineInventory2 } from "react-icons/md";
import { FiMenu, FiSearch, FiBell } from "react-icons/fi";

export default function StockOpname() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { icon: <FaChartBar size={24} />, label: "Dashboard" },
    { icon: <FaBoxOpen size={24} />, label: "Products" },
    { icon: <MdOutlineInventory2 size={24} />, label: "In Stock" },
    { icon: <FaClipboardList size={24} />, label: "Orders" },
    { icon: <FaShoppingCart size={24} />, label: "Stock Opname", active: true },
    { icon: <FaUser size={24} />, label: "Account Management" },
  ];

  const [formData, setFormData] = useState({
    productId: "",
    items: "",
    quantity: "",
    physicalQuantity: "",
    differentStock: "",
  });

  const calculateDifference = () => {
    const diff =
      parseInt(formData.physicalQuantity || 0) -
      parseInt(formData.quantity || 0);
    setFormData({ ...formData, differentStock: diff });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="flex flex-col h-screen bg-white text-black font-[Poppins]">
      {/* Top Navbar */}
      <div className="flex justify-between items-center px-6 py-4 border-b bg-white">
        <div className="flex items-center gap-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}>
            <FiMenu size={24} className="text-black" />
          </button>
          <h1 className="text-xl font-semibold">E-Inventoria</h1>
        </div>

        <div className="flex items-center gap-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              className="pl-4 pr-10 py-2 bg-gray-100 rounded-full w-[592px] h-[40px] text-black"
            />
            <FiSearch className="absolute right-3 top-2.5 text-gray-400" size={20} />
          </div>
          <FiBell className="text-black" size={20} />
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
                <div
                  key={index}
                  className={`flex flex-col items-center text-xs cursor-pointer px-2 py-3 rounded-lg ${
                    item.active ? "bg-[#203340]" : "hover:bg-[#203340]"
                  }`}
                >
                  {item.icon}
                  <span className="mt-1 text-[10px] text-white text-center">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 bg-white p-12">
          <h2 className="text-2xl font-semibold mb-12">Stock Opname</h2>

          <div className="space-y-6">
            {[
              { label: "Product ID", name: "productId" },
              { label: "Items", name: "items" },
              { label: "Quantity", name: "quantity" },
              { label: "Physical Quantity", name: "physicalQuantity" },
            ].map((field, idx) => (
              <div key={idx} className="flex items-center gap-12">
                <label className="w-[150px] font-semibold text-black text-[24px]">
                  {field.label}
                </label>
                <input
                  type="text"
                  name={field.name}
                  value={formData[field.name]}
                  onChange={handleChange}
                  className="border-[2px] border-black rounded-[12px] h-[48px] px-6 text-black w-[400px] outline-none text-[24px]"
                />
              </div>
            ))}

            {/* Different Stock */}
            <div className="flex items-center gap-12">
              <label className="w-[150px] font-semibold text-black text-[24px]">
                Different Stock
              </label>
              <input
                type="text"
                name="differentStock"
                value={formData.differentStock}
                readOnly
                className="bg-[#f3f3f3] border-[2px] border-black rounded-[12px] h-[48px] px-6 text-black w-[400px] outline-none text-[24px]"
              />
            </div>

            {/* Calculate button inline */}
            <div className="flex items-center gap-12 mt-2">
              <label className="w-[150px]" />
              <button
                onClick={calculateDifference}
                className="bg-[#4AB98A] text-black font-semibold px-10 py-2 rounded-full"
              >
                Calculate
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
