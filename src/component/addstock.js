"use client";

import Link from 'next/link';
import { supabase } from '@/lib/supabase'
import { useState, useEffect } from "react";
import { FiMenu, FiSearch, FiBell } from "react-icons/fi";
import {
  FaChartBar,
  FaBoxOpen,
  FaClipboardList,
  FaUser,
  FaClipboardCheck,
  FaTruck,
} from "react-icons/fa";
import { MdOutlineInventory2 } from "react-icons/md";

export default function AddinStock() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const [instockData, setInstockData] = useState({
    supplier: '',
    products: [{ 
      productId: '', 
      quantity: '',
      availableStock: null,
      overstockLimit: null, 
    }], // dynamic list of products
  });

  const [submitting, setSubmitting] = useState(false);

  const [productOptions, setProductOptions] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase.from("products").select();
      if (!error) setProductOptions(data);
    };
    fetchProducts();
  }, []);

  const handleSubmit = async () => {
    if (submitting) return;
      setSubmitting(true);

    const isFormInvalid = !instockData.supplier || instockData.products.some(
      p => !p.productId || !p.quantity
    );

    if (isFormInvalid) {
      alert("Please fill all fields!");
      setSubmitting(false);
      return;
    }

    const productIds = instockData.products.map(p => p.productId);
    const hasDuplicateProducts = new Set(productIds).size !== productIds.length;

    if (hasDuplicateProducts) {
    alert("You cannot add the same product multiple times in one instock!");
    setSubmitting(false);
    return;
  }

  const hasInvalidStock = instockData.products.some(p => {
    const quantity = parseInt(p.quantity);
    const availableStock = p.availableStock;
    const overstockLimt = p.overstockLimit;

  if (isNaN(quantity)) return true;
    if (quantity <= 0) return true;

    if (availableStock === null) return true;
    if (p.overstockLimit !== null) {
      const newTotal = availableStock + quantity;
      if (newTotal > p.overstockLimit) return true;
    }

    return false;
  });

  if (hasInvalidStock) {
    alert("Please check the quantity limits for your products");
    setSubmitting(false);
    return;
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
    const userId = userData?.user?.id || null;
    console.log('User ID:', userId);
    if (userError) {
      console.error('User Fetch Error:', userError);
      alert("Failed to fetch user data!");
      setSubmitting(false);
      return;
    } 
  
    if (!userId) {
      alert("User not authenticated!");
      setSubmitting(false);
      return;
    }

  // Insert into instock table
  const { data: instockInsert, error: instockError } = await supabase
    .from("instocks")
    .insert([{ 
      supplier_id: instockData.supplier, 
      instock_status: "pending",
      user_id: userId,
    }])
    .select()

  if (instockError || !instockInsert) {
    alert("Failed to create instock!");
    console.error('Instock Insert Error:' + instockError);
    setSubmitting(false);
    return;
  }

  const instockId = instockInsert[0].instock_id;

  // Insert into instock_product table
  const instockProducts = instockData.products.map(p => ({
    instock_id: instockId,
    product_id: p.productId,
    product_quantity: parseInt(p.quantity),
  }));

  const { error: productInsertError } = await supabase
    .from("instock_product")
    .insert(instockProducts);

  for (const p of instockData.products) {
    const { error: updateError } = await supabase
      .from("products")
      .update({
        product_quantity: p.availableStock + parseInt(p.quantity),
      })
      .eq("product_id", p.productId);

    if (updateError) {
      console.error(`Failed to update stock for product ${p.productId}:`, updateError);
      alert("Stock update failed after instock creation.");
    }
  }


    if (productInsertError) {
      alert("Failed to link products!");
      console.error('Product Link Error:', productInsertError);
      setSubmitting(false);
      return;
    } 
    if (!productInsertError) {
        alert("Instock created successfully!");
        setInstockData({ 
          supplier: '', 
          products: [{ 
            productId: '', 
            quantity: '', 
            availableStock: null,
            overstockLimit: null,
          }]
        })
    };
    setSubmitting(false);
  };

  const [supplierOptions, setSupplierOptions] = useState([]);
  useEffect(() => {
    const fetchSuppliers = async () => {
      const { data, error } = await supabase
      .from("suppliers")
      .select("supplier_id, supplier_name");

      if (error) {
        console.error("Error fetching suppliers:", error);
      } else {
        setSupplierOptions(data);
      }
    };
    fetchSuppliers();
  }, []);

  const handleProductChange = async(index, field, value) => {
  // Prevent negative quantities
  if (field === 'quantity' && value !== '' && parseInt(value) < 0) {
    return;
  }
  
  const updated = [...instockData.products];
  updated[index][field] = value;
  
  // When productId is selected, fetch stock from Supabase
  if (field === 'productId') {
    const { data, error } = await supabase
      .from('products')
      .select('product_quantity, product_overstock')
      .eq('product_id', value)
      .single();

    if (!error && data) {
      updated[index].availableStock = data.product_quantity;
      updated[index].overstockLimit = data.product_overstock;
    } else {
      console.error('Error fetching product:', error);
    }
  }
   
  setInstockData({ ...instockData, products: updated });
  };

  const addProductRow = () => {
    setInstockData({
      ...instockData,
      products: [...instockData.products, { productId: '', quantity: '' }]
    });
  };

  const removeProductRow = (index) => {
    const updated = instockData.products.filter((_, i) => i !== index);
    setInstockData({ ...instockData, products: updated });
  };

  const menuItems = [
    { icon: <FaChartBar size={24} />, label: "Dashboard", href:"/dashboard" },
    { icon: <MdOutlineInventory2 size={24} />, label: "In Stocks", href:"/instock", active: true },
    { icon: <FaBoxOpen size={24} />, label: "Products", href:"/product" },
    { icon: <FaClipboardList size={24} />, label: "Orders", href:"/order" },
    { icon: <FaTruck size={24} />, label: "Suppliers", href:"/supplier" },
    { icon: <FaClipboardCheck size={24} />, label: "Stock Opname", href:"/historyopname" },
    { icon: <FaUser size={24} />, label: "Account Management", href:"/accountmanagement" },
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
            <h2 className="text-2xl font-semibold">Add Stock</h2>
            <Link href="/instock">
              <button className="text-2xl font-semibold hover:text-sky-700">×
              </button>
            </Link>
          </div>

          <div className="space-y-6">

              {instockData.products.map((item, index) => (
                <div key={index} className="mb-6 space-y-4 border p-4 rounded-md shadow-sm w-[600px]">
                  <div className="flex flex-col">
                    <label className="text-sm font-semibold text-black mb-1">Product</label>
                    <select
                      value={item.productId || ''}
                      onChange={(e) => handleProductChange(index, 'productId', e.target.value)}
                      className="border border-black rounded-[12px] h-[42px] px-4 text-black outline-none"
                    >
                      <option value="">Select Product</option>
                      {productOptions.map(product => (
                        <option key={product.product_id} value={product.product_id}>
                          {product.product_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm font-semibold text-black mb-1">Supplier</label>
                    <select
                      value={instockData.supplier}
                      onChange={(e) => setInstockData({ ...instockData, supplier: e.target.value })}
                      className="border border-black rounded-[12px] h-[42px] px-4 text-black outline-none"
                    >
                      <option value="">Select Supplier</option>
                      {supplierOptions.map((supplier) => (
                        <option key={supplier.supplier_id} value={supplier.supplier_id}>
                          {supplier.supplier_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm font-semibold text-black mb-1">Quantity</label>
                    <input
                      type="number"
                      min="0"
                      placeholder={
                        item.availableStock !== null
                          ? item.overstockLimit !== null
                            ? `Available: ${item.availableStock} (Max total: ${item.overstockLimit})`
                            : `Available: ${item.availableStock}`
                          : "Enter quantity"
                      }
                      value={item.quantity || ""}
                      onChange={(e) => {
                        const value = e.target.value;
                          // Only update if value is empty or a positive number
                          if (value === "" || parseInt(value) >= 0) {
                            handleProductChange(index, 'quantity', value);
                          }
                        }}
                      className="border border-black rounded-[12px] h-[42px] px-4 text-black outline-none"
                    />
                    {item.availableStock !== null && item.overstockLimit !== null && (
                      <p className="text-xs text-gray-500 mt-1">
                        Overstock protection: {item.overstockLimit} units must remain
                      </p>
                    )}
                  </div>  

                  <button
                    onClick={() => removeProductRow(index)}
                    className="text-red-500 text-sm underline mt-2 hover:text-[#FF9999]"
                  >
                    Remove
                  </button>
                </div>
              ))}
          </div>

          <div className="mt-6 space-x-6 w-[600px] flex justify-end">
            <button onClick={addProductRow} className="mt-2 text-blue-500 hover:text-[#0033FF]">
              + Add another stock
            </button>

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