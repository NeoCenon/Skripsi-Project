"use client";

import Link from 'next/link';
import { supabase } from '@/lib/supabase'
import { useState } from "react";
import { FiMenu, FiSearch, FiBell } from "react-icons/fi";
import {
  FaChartBar,
  FaBoxOpen,
  FaClipboardList,
  FaUser,
  FaTruck,
  FaClipboardCheck,
} from "react-icons/fa";
import { MdOutlineInventory2 } from "react-icons/md";

export default function AddProduct() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [formData, setFormData] = useState({
    productName : '',
    category: '',
    purchasePrice: '',
    salePrice: '',
    totalItems: '',
    stockout: '',
    overstock: '',
  })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    const { productName, category, purchasePrice, salePrice, totalItems, stockout, overstock } = formData;

    // 2. Validation
    if (
      productName.trim() === '' ||
      category.trim() === '' ||
      purchasePrice.trim() === '' ||
      salePrice.trim() === '' ||
      totalItems.trim() === ''
    ) {
      alert('Please fill in all required fields!');
      return;
    }

    if (
      isNaN(parseFloat(purchasePrice)) ||
      isNaN(parseFloat(salePrice)) ||
      isNaN(parseInt(totalItems)) ||
      (stockout !== null && stockout !== '' && isNaN(parseInt(stockout))) ||
      (overstock !== null && overstock !== '' && isNaN(parseInt(overstock)))
    ) {
      alert('Ensure all number fields contain valid numeric values.');
      return;
    }

    if (parseInt(totalItems) < 0 || parseInt(stockout) < 0 || parseInt(overstock) < 0) {
    alert('Stock values cannot be negative.');
    return;
  }

  if (parseInt(overstock) < parseInt(stockout)) {
    alert('Overstock value cannot be less than Stockout value.');
    return;
  }

    try {
      const { data: existingProducts, error: checkError } = await supabase
        .from('products')
        .select('product_name')
        .eq('product_name', productName.trim());

      if (checkError) {
        console.error("Error checking for duplicates:", checkError);
        alert('Error checking for duplicate products. Please try again.');
        return;
      }

      if (existingProducts && existingProducts.length > 0) {
        alert(`Product "${productName}" already exists!`);
        return;
      }

    // 3. Send to Supabase
    const cleanData = {
      product_name: productName.trim(),
      product_category: category.trim(),
      purchase_price: parseFloat(purchasePrice),
      sale_price: parseFloat(salePrice),
      product_quantity: parseInt(totalItems),
      product_stockout: stockout !== '' ? parseInt(stockout) : null,
      product_overstock: overstock !== '' ? parseInt(overstock) : null,
    };

    const { data, error } = await supabase
    .from('products')
    .insert([cleanData])
    .select();

    if (error) {
      console.error("Supabase Insert Error:", error.message || error);
      alert(`Failed to save product: ${error.message || 'Unknown error'}`);
    } else {
      alert('Product added successfully!');
      setFormData({
        productName: '',
        category: '',
        purchasePrice: '',
        salePrice: '',
        totalItems: '',
        stockout: '',
        overstock: '',
      });
    }
    }catch (err) {
      console.error("Unexpected error:", err);
      alert('An unexpected error occurred. Please try again.');
    }
  };

  const menuItems = [
    { icon: <FaChartBar size={24} />, label: "Dashboard", href:"/dashboard" },
    { icon: <MdOutlineInventory2 size={24} />, label: "In Stocks", href:"/instock"},
    { icon: <FaBoxOpen size={24} />, label: "Products", href:"/product", active: true  },
    { icon: <FaClipboardList size={24} />, label: "Orders", href:"/order" },
    { icon: <FaTruck size={24} />, label: "Suppliers", href:"/supplier" },
    { icon: <FaClipboardCheck size={24} />, label: "Stock Opname", href:"/historyopname" },
    { icon: <FaUser size={24} />, label: "Account Management", href:"/accountmanagement" },
  ];

  const fields = [
    { label: "Items", name: "productName" },
    { label: "Category", name: "category" },
    { label: "Purchase Price", name: "purchasePrice" },
    { label: "Sale Price", name: "salePrice" },
    { label: "Quantity", name: "totalItems" },
    { label: "Stockout Limit", name: "stockout" },
    { label: "Overstock Limit", name: "overstock" },
  ];

  return (
    <div className="flex flex-col h-screen bg-white text-black font-[Poppins]">
      {/* Top Navbar */}
      <div className="flex justify-between items-center px-6 py-4 bg-white border-b">
        <div className="flex items-center gap-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}>
            <FiMenu size={24} />
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
          <div className="bg-[#12232E] text-white w-[80px] flex flex-col items-center pt-4">
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
            <h2 className="text-2xl font-semibold">Add Product</h2>
            <Link href="/product">
              <button className="text-2xl font-semibold hover:text-sky-700">×
              </button>
            </Link>
            
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
                />
              </div>
            ))}
          </div>

          <div className="mt-12 flex justify-end w-[600px]">
            <button
              onClick={handleSubmit}
              className="bg-[#89E0F8] text-black font-semibold px-10 py-2 rounded-full hover:text-white hover:bg-[#89E0F8]"
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}