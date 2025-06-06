"use client";

import Link from 'next/link';
import { supabase } from '@/lib/supabase'
import { useState } from "react";
import bcrypt from 'bcryptjs'
import { FiMenu, FiSearch, FiBell } from "react-icons/fi";
import {
  FaChartBar,
  FaBoxOpen,
  FaClipboardList,
  FaTruck,
  FaUser,
} from "react-icons/fa";
import { MdOutlineInventory2 } from "react-icons/md";

export default function AddAccount() {
  const [sidebarOpen, setSidebarOpen] = useState(true);


  const [formData, setFormData] = useState({
    username : '',
    email: '',
    password: '',
    role: '',
  })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    const { username, email, password, role } = formData;

    // 2. Validation
    if (!username || !email || !password || !role) {
      alert('Please fill in all fields!');
      return;
    }

    
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Send to Supabase
    const { data, error } = await supabase.from('users').insert([
      {
        user_name: username,
        user_email: email,
        user_password: hashedPassword,
        user_role: role,
        // created_at: new Date().toISOString(),
      },
    ]).select();

    if (error) {
      console.error(error);
      alert('Failed to save user!' + error.message);
    } else {
      alert('User added successfully!');
      setFormData({
        username: '',
        email: '',
        password: '',
        role: '',
      });
    }
  };

  const menuItems = [
    { icon: <FaChartBar size={24} />, label: "Dashboard", href:"/dashboard" },
      { icon: <MdOutlineInventory2 size={24} />, label: "In Stocks", href:"/instock"},
      { icon: <FaBoxOpen size={24} />, label: "Products", href:"/product" },
      { icon: <FaClipboardList size={24} />, label: "Orders", href:"/order"  },
      { icon: <FaTruck size={24} />, label: "Suppliers", href:"/supplier" },
      { icon: <FaUser size={24} />, label: "Account Management", href:"/accountmanagement", active: true },
  ];

  const fields = [
    { label: "User Name", name: "username" },
    { label: "Email", name: "email" },
    { label: "password", name: "password" },
    { label: "role", name: "role" },
  ];

  return (
    <div className="flex flex-col h-screen bg-white text-black font-[Poppins]">
      {/* Top Navbar */}
      <div className="flex justify-between items-center px-6 py-4 bg-white border-b">
        <div className="flex items-center gap-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}>
            <FiMenu size={24} className="text-black" />
          </button>
          <h1 className="text-xl font-semibold text-[#1C2D5A]">E-Inventoria</h1>
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
                <Link href={item.href} key={index}>
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
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 bg-white p-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Add Account</h2>
            <button className="text-2xl font-semibold text-gray-400">×</button>
          </div>

          <div className="space-y-6">
            {fields.map((field, idx) => (
              <div key={idx} className="flex items-center gap-12">
                <label className="w-[150px] text-base font-semibold text-black">
                  {field.label}
                </label>
                {/* <input
                  type="text"
                  name={field.name}
                  value={formData[field.name]}
                  onChange={handleChange}
                  className="border border-black rounded-[12px] h-[42px] px-6 text-black w-[400px] outline-none"
                /> */}
                {field.name === "role" ? (
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="border border-black rounded-[12px] h-[42px] px-6 text-black w-[400px] outline-none"
                  >
                    <option value="">Select role</option>
                    <option value="owner">Owner</option>
                    <option value="admin">Admin</option>
                  </select>
                ) : (
                  <input
                    type={field.name === "password" ? "password" : "text"}
                    name={field.name}
                    value={formData[field.name]}
                    onChange={handleChange}
                    className="border border-black rounded-[12px] h-[42px] px-6 text-black w-[400px] outline-none"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="mt-12 flex justify-end w-[600px]">
            <button
              onClick={handleSubmit}
              className="bg-[#89E0F8] text-black font-semibold px-10 py-2 rounded-full"
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}