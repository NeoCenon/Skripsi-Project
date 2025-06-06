"use client";

import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from "react";
import { supabase } from '@/lib/supabase';
import { FiMenu, FiBell } from "react-icons/fi";
import {
  FaChartBar,
  FaBoxOpen,
  FaClipboardList,
  FaUser,
  FaTruck,
} from "react-icons/fa";
import { MdOutlineInventory2 } from "react-icons/md";

export default function EditSupplierPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [formData, setFormData] = useState({
    supplierName: '',
    address : '',
    phoneNumber : '',
  });

  const supplier_id = searchParams.get('supplier_id');

  useEffect(() => {
    setFormData({
      supplierName: searchParams.get('supplier_name') || '',
      address: searchParams.get('supplier_address') || '',
      phoneNumber: searchParams.get('supplier_phone') || '',
    });
  }, [searchParams]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async () => {
    const { supplierName, address, phoneNumber } = formData;

    if (!supplierName || !address || !phoneNumber) {
      alert("Please fill in all fields!");
      return;
    }

    const { error } = await supabase
      .from("suppliers")
      .update({
        supplier_name: supplierName,
        supplier_address : address,
        supplier_phone: phoneNumber,
      })
      .eq("supplier_id", supplier_id);

    if (error) {
      console.error(error);
      alert("Failed to update supplier data!");
    } else {
      alert("Supplier updated successfully!");
      router.push("/supplier");
    }
  };

  const handleDelete = async () => {
    const confirmDelete = confirm("Are you sure you want to delete this supplier?");
    if (!confirmDelete) return;

    const { error } = await supabase
      .from("suppliers")
      .delete()
      .eq("supplier_id", supplier_id);

    if (error) {
      console.error(error);
      alert("Failed to delete supplier!");
    } else {
      alert("Supplier deleted successfully!");
      router.push("/supplier");
    }
  };

  const menuItems = [
    { icon: <FaChartBar size={24} />, label: "Dashboard", href: "/dashboard" },
    { icon: <MdOutlineInventory2 size={24} />, label: "In Stocks", href: "/instock" },
    { icon: <FaBoxOpen size={24} />, label: "Products", href: "/product" },
    { icon: <FaClipboardList size={24} />, label: "Orders", href: "/order" },
    { icon: <FaTruck size={24} />, label: "Suppliers", href: "/supplier", active: true },
    { icon: <FaUser size={24} />, label: "Account Management", href: "/accountmanagement" },
  ];

  const fields = [
    { label: "Supplier", name: "supplierName" },
    { label: "Address", name: "address" },
    { label: "Phone Number", name: "phoneNumber" },
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
                    className={`flex flex-col items-center text-xs cursor-pointer px-2 py-3 rounded-lg ${item.active ? "bg-[#203340]" : "hover:bg-[#203340]"}`}
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
            <h2 className="text-2xl font-semibold">Change Supplier Detail</h2>
            <Link href="/product">
              <button className="text-2xl font-semibold hover:text-sky-700">×</button>
            </Link>
          </div>

          <div className="text-lg mb-8 font-semibold text-black">
            Supplier ID <span className="text-gray-800 font-medium flex items-center gap-12">#{supplier_id}</span>
          </div>

          <div className="space-y-6">
            {fields.map((field, idx) => (
              <div key={idx} className="flex items-center gap-12">
                <label className="w-[150px] text-base font-semibold text-black">
                  {field.label}
                </label>
                <input
                  type="text"
                  name={field.name}
                  value={formData[field.name]}
                  onChange={handleChange}
                  className="border border-black rounded-[12px] h-[42px] px-6 text-black w-[400px] outline-none"
                  placeholder={field.label}
                />
              </div>
            ))}
          </div>

          <div className="mt-12 flex justify-between w-[600px]">
            <button
              onClick={handleDelete}
              className="bg-[#F76B6B] text-white font-semibold px-10 py-2 rounded-full hover:bg-red-600"
            >
              Delete
            </button>
            <button
              onClick={handleUpdate}
              className="bg-[#89E0F8] text-black font-semibold px-10 py-2 rounded-full hover:text-white hover:bg-[#5dcaf1]"
            >
              Update
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}