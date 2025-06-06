"use client"

import { supabase } from '../lib/supabase'
import { useState, useEffect } from 'react'
import Link from 'next/link';
import { FiMenu, FiSearch, FiBell, FiChevronDown, FiCalendar } from "react-icons/fi";
import {
  FaBoxOpen,
  FaChartBar,
  FaClipboardList,
  FaShoppingCart,
  FaTruck,
  FaUser
} from "react-icons/fa";
import { MdOutlineInventory2 } from "react-icons/md";


export default function AccountManagementPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null);

  //Dummy
  const [sidebarOpen, setSidebarOpen] = useState(true);


  // Fetch inventory items
  useEffect(() => {
    fetchItems()
  }, [])

  async function fetchItems() {

    try {
      setError(null);
      setLoading(true);
      const { data, error: supabaseError } = await supabase
        .from('users')
        .select('*');
    
      if (supabaseError) throw supabaseError;
      setItems(data);
    } catch (err) {
      setError(err.message);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
    }


    // Dummy 
    const menuItems = [
      { icon: <FaChartBar size={24} />, label: "Dashboard", href:"/dashboard" },
      { icon: <MdOutlineInventory2 size={24} />, label: "In Stocks", href:"/instock"},
      { icon: <FaBoxOpen size={24} />, label: "Products", href:"/product" },
      { icon: <FaClipboardList size={24} />, label: "Orders", href:"/order"  },
      { icon: <FaTruck size={24} />, label: "Suppliers", href:"/supplier" },
      { icon: <FaUser size={24} />, label: "Account Management", href:"/accountmanagement", active: true },
      ];

  // Add new item
  async function addItem(newItem) {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([newItem])
        .select()
      
      if (error) throw error
      setItems([...items, ...data])
    } catch (error) {
      console.error('Error adding item:', error)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-[#F5F6FA] text-black font-[Poppins]">
      {/* Top Navbar */}
      <div className="flex justify-between items-center px-6 py-4 bg-white border-b">
        <div className="flex items-center gap-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}>
            <FiMenu size={24} className="text-black" />
          </button>
          <h1 className="text-xl font-semibold text-black">
            <span className="text-black">E-</span>Inventoria
          </h1>
        </div>

        <div className="flex items-center gap-6">
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
                  <span className="mt-1 text-[10px] text-white text-center">{item.label}</span>
                </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col bg-white"> 

          {/* Content */}
          <div className="p-6">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-2xl font-semibold text-black">Accounts</h2>
              <button className="bg-[#1E88E5] text-white px-4 py-2 rounded-lg font-medium text-[16px]">
                + Add Account
              </button>
            </div>

            <div className="border-b mb-4"></div>

            {/* Search & Filter */}
            <div className="flex justify-between items-center mb-6">
              <div className="relative w-[264px]">
                <input
                  type="text"
                  placeholder="Quick search"
                  className="pl-10 pr-4 py-2 border rounded-md w-full h-[44px] text-black"
                />
                <FiSearch className="absolute left-3 top-2.5 text-gray-400" size={20} />
              </div>

              <div className="flex items-center gap-4">
                <button className="flex items-center justify-center w-[44px] h-[44px] border rounded-md text-black">
                  <FiCalendar size={20} />
                </button>
                <button className="flex items-center gap-2 px-4 h-[44px] border rounded-md text-black">
                  Role
                  <FiChevronDown size={20} />
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg overflow-hidden mt-6">
              <table className="w-full border-[2px] border-gray-300 font-[Poppins]">
                <thead>
                  <tr className="border-b-[2px] text-[16px] font-normal text-center">
                    <th className="p-4 text-left">Username</th>
                    <th className="p-4 text-left">Email</th>
                    <th className="p-4 text-left">Role</th>
                    <th className="p-4 text-left">Created At</th>
                    <th className="p-4 text-left">Action</th>
                    <th className="p-4 text-left"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.user_id} className="border-b-[2px] hover:bg-gray-50 text-[16px] text-center">
                      <td className="p-4">{item.user_name}</td>
                      <td className="p-4">{item.user_email}</td>
                      <td className="p-4">{item.user_role}</td>
                      <td className="p-4">{item.created_at}</td>
                      <td className="p-4">
                      <button className="bg-[#1E88E5] text-white w-[150px] h-[32px] rounded-full text-[14px] font-normal">
                         Details
                      </button>

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