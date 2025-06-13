"use client";

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react'
import {
  FaChartBar,
  FaBoxOpen,
  FaClipboardList,
  FaTruck,
  FaClipboardCheck,
  FaUser,
} from "react-icons/fa";
import { MdOutlineInventory2 } from "react-icons/md";
import { FiMenu, FiSearch, FiBell } from "react-icons/fi";
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'

export default function OpnamePage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const [opnameData, setOpnameData] = useState({
    products: [{ 
      productId: '', 
      quantity: '', 
    }], // dynamic list of products
  });

  const [submitting, setSubmitting] = useState(false);

  const [productOptions, setProductOptions] = useState([]);

  const menuItems = [
    { icon: <FaChartBar size={24} />, label: "Dashboard", href:"/dashboard" },
    { icon: <MdOutlineInventory2 size={24} />, label: "In Stocks", href:"/instock" },
    { icon: <FaBoxOpen size={24} />, label: "Products", href:"/product" },
    { icon: <FaClipboardList size={24} />, label: "Orders", href:"/order" },
    { icon: <FaTruck size={24} />, label: "Suppliers", href:"/supplier" },
    { icon: <FaClipboardCheck size={24} />, label: "Stock Opname", href:"/historyopname", active: true },
    { icon: <FaUser size={24} />, label: "Account Management", href:"/accountmanagement" },
  ];

  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formData, setFormData] = useState({
    productId: "",
    items: "",
    quantity: "",
    physicalQuantity: "",
    differentStock: "",
  });
  
    useEffect(() => {
      const role = localStorage.getItem('user_role')
      if (role !== 'admin' && role !== 'owner') {
        router.push('/unauthorized')
      }
    }, [])

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("product_id, product_name, product_quantity");

      if (!error) setProducts(data);
    };

    fetchProducts();
  }, []);

  const handleProductChange = (e) => {
    const selectedId = parseInt(e.target.value);
    const product = products.find((p) => p.product_id === selectedId);

    setSelectedProduct(product);
    setFormData({
      ...formData,
      productId: selectedId,
      items: product.product_name,
      quantity: product.product_quantity,
      differentStock: "",
    });
  };

  const calculateDifference = async () => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    
    if (userError || !userId) {
      alert("User not authenticated. Please log in.");
      return;
    }

    const physicalQty = parseInt(formData.physicalQuantity || 0);
    const recordedQty = parseInt(formData.quantity || 0);
    const diff = physicalQty - recordedQty;

    setFormData({ ...formData, differentStock: diff });
  
    try {
      // 1. Insert into `opname`
      const { data: opnameInsert, error: opnameError } = await supabase
        .from("opnames")
        .insert([{ user_id: userId, opname_date: new Date().toISOString() }])
        .select()
        .single();

      if (opnameError) throw opnameError;

      const { error: opnameProductError } = await supabase
        .from("opname_product")
        .insert([{
          opname_id: opnameInsert.opname_id,
          product_id: formData.productId,
          real_stock: physicalQty,
          stock_difference: diff,
        }]);

      if (opnameProductError) {
        console.error("Error inserting opname_product:", opnameProductError);
        throw opnameProductError;
      }

      alert("Opname data saved successfully.");
      router.push("/historyopname");
    } catch (error) {
      console.error("Opname error:", error.message);
      alert("Failed to save opname data.");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white text-black font-[Poppins]">
      {/* Top Navbar */}
      <div className="flex justify-between items-center px-6 py-4 border-b bg-white">
        <div className="flex items-center gap-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}>
            <FiMenu size={24}/>
          </button>
          <h1 className="text-xl font-semibold">E-Inventoria</h1>
        </div>

        <div className="flex items-center gap-6">
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
                    <span className="mt-1 text-[10px] text-white text-center">{item.label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 bg-white p-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Stock Opname</h2>
            <Link href="/historyopname">
              <button className="text-2xl font-semibold hover:text-sky-700">×</button>
            </Link>
          </div>

          <div className="h-12" />

          <form
            className="space-y-8 w-[600px]"
            onSubmit={e => {
              e.preventDefault();
              calculateDifference();
            }}
          >
            {/* Product */}
            <div className="flex items-center gap-8">
              <label className="w-[150px] text-base font-semibold text-black mb-4">
                Items <span className="text-red-500">*</span>
              </label>
              <select
                name="items"
                value={formData.items}
                onChange={(e) => {
                  const selectedProduct = products.find(
                    (product) => product.product_name === e.target.value
                  );
                  if (selectedProduct) {
                    setSelectedProduct(selectedProduct);
                    setFormData({
                      ...formData,
                      productId: selectedProduct.product_id,
                      items: selectedProduct.product_name,
                      quantity: selectedProduct.product_quantity,
                      differentStock: "",
                    });
                  }
                }}
                className="border border-black rounded-[12px] h-[42px] px-4 text-black outline-none w-full"
                required
              >
                <option value="">Select Product</option>
                {products.map((product) => (
                  <option key={product.product_id} value={product.product_name}>
                    {product.product_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity (read-only) */}
            <div className="flex items-center gap-8">
              <label className="w-[150px] text-base font-semibold text-black mb-4">
                Quantity
              </label>
              <input
                type="text"
                name="quantity"
                value={formData.quantity}
                readOnly
                className="bg-[#f3f3f3] border border-black rounded-[12px] h-[42px] px-6 text-black w-full"
              />
            </div>

            {/* Physical Quantity (user input) */}
            <div className="flex items-center gap-8">
              <label className="w-[150px] text-base font-semibold text-black mb-4">
                Real Stock <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="physicalQuantity"
                value={formData.physicalQuantity}
                onChange={handleChange}
                className="border border-black rounded-[12px] h-[42px] px-6 text-black w-full"
                required
              />
            </div>

            {/* Different Stock (read-only) */}
            <div className="flex items-center gap-8">
              <label className="w-[150px] text-base font-semibold text-black mb-4">
                Different Stock
              </label>
              <input
                type="text"
                name="differentStock"
                value={formData.differentStock}
                readOnly
                className="bg-[#f3f3f3] border border-black rounded-[12px] h-[42px] px-6 text-black w-full"
              />
            </div>

            {/* Action Row */}
            <div className="flex justify-end space-x-6">
              <button
                type="submit"
                className="bg-[#4AB98A] text-black font-semibold px-10 py-2 rounded-full text-[18px]"
                disabled={!formData.productId || formData.physicalQuantity === ""}
              >
                Calculate
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
