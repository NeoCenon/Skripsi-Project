"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { FiMenu, FiBell } from "react-icons/fi";
import {
  FaChartBar,
  FaBoxOpen,
  FaClipboardList,
  FaUser,
  FaTruck,
  FaClipboardCheck,
} from "react-icons/fa";
import { MdOutlineInventory2 } from "react-icons/md";

export default function EditOpnamePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const opname_id = searchParams.get("opname_id");
  const opname_product_id = searchParams.get("opname_product_id");

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    productId: "",
    items: "",
    quantity: "",
    physicalQuantity: "",
    differentStock: "",
  });

  // Fetch products for dropdown
  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("product_id, product_name, product_quantity");
      if (!error) setProducts(data);
    };
    fetchProducts();
  }, []);

  // Fetch existing opname data
  useEffect(() => {
    if (!opname_product_id) return;
    const fetchOpname = async () => {
      const { data, error } = await supabase
        .from("opname_product")
        .select(
          `
          opname_product_id,
          real_stock,
          stock_difference,
          opnames (
            opname_id,
            opname_date,
            user_id
          ),
          products (
            product_id,
            product_name,
            product_quantity
          )
        `
        )
        .eq("opname_product_id", opname_product_id)
        .single();

      if (error || !data) {
        alert("Opname data not found.");
        router.push("/historyopname");
        return;
      }

      setFormData({
        productId: data.products?.product_id,
        items: data.products?.product_name,
        quantity: data.products?.product_quantity,
        physicalQuantity: data.real_stock,
        differentStock: data.stock_difference,
      });
      setSelectedProduct(data.products);
      setLoading(false);
    };
    fetchOpname();
  }, [opname_product_id, router]);

  // Handle input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle product selection
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
      physicalQuantity: "",
    });
  };

  // Calculate difference
//   const calculateDifference = () => {
//     const physicalQty = parseInt(formData.physicalQuantity || 0);
//     const recordedQty = parseInt(formData.quantity || 0);
//     const diff = physicalQty - recordedQty;
//     setFormData({ ...formData, differentStock: diff });
//   };

  // Handle update
  const handleUpdate = async () => {
      if (!formData.productId || formData.physicalQuantity === "") {
            alert("Please fill in all required fields.");
            return;
      }

      const physicalQty = parseInt(formData.physicalQuantity || 0);
      const recordedQty = parseInt(formData.quantity || 0);
      const diff = physicalQty - recordedQty;

      setLoading(true);

      // Update opname_product
      const { error: updateError } = await supabase
      .from("opname_product")
      .update({
            product_id: formData.productId,
            real_stock: physicalQty,
            stock_difference: diff,
      })
      .eq("opname_product_id", opname_product_id);

      if (updateError) {
      alert("Update failed: " + updateError.message);
      setLoading(false);
      return;
      }

      alert("Opname updated!");
      router.push("/historyopname");
  };

  // Handle delete
  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this opname?")) return;

    setLoading(true);

    // Delete only this opname_product row
    const { error } = await supabase
      .from("opname_product")
      .delete()
      .eq("opname_product_id", opname_product_id);

    if (error) {
      alert("Delete failed: " + error.message);
      setLoading(false);
      return;
    }

    alert("Opname deleted.");
    router.push("/historyopname");
  };

  const menuItems = [
    { icon: <FaChartBar size={24} />, label: "Dashboard", href: "/dashboard" },
    { icon: <MdOutlineInventory2 size={24} />, label: "In Stocks", href: "/instock" },
    { icon: <FaBoxOpen size={24} />, label: "Products", href: "/product" },
    { icon: <FaClipboardList size={24} />, label: "Orders", href: "/order" },
    { icon: <FaTruck size={24} />, label: "Suppliers", href: "/supplier" },
    { icon: <FaClipboardCheck size={24} />, label: "Stock Opname", href: "/historyopname", active: true },
    { icon: <FaUser size={24} />, label: "Account Management", href: "/accountmanagement" },
  ];

  return (
    <div className="flex flex-col h-screen bg-white text-black font-[Poppins]">
      {/* Top Navbar */}
      <div className="flex justify-between items-center px-6 py-4 border-b bg-white">
        <div className="flex items-center gap-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}>
            <FiMenu size={24} />
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
            <h2 className="text-2xl font-semibold">Edit Stock Opname</h2>
            <Link href="/historyopname">
                  <button className="text-2xl font-semibold hover:text-sky-700">×</button>
            </Link>
            </div>

            {loading ? (
            <div className="text-center text-gray-500">Loading...</div>
            ) : (
            <form
                  className="space-y-8 w-[600px]"
                  onSubmit={e => {
                  e.preventDefault();
                  handleUpdate();
                  }}
            >

            <div className="h-6" />
                  {/* Product */}
                  <div className="flex items-center gap-8">
                  <label className="w-[150px] text-base font-semibold text-black mb-4">
                  Items
                  </label>
                  <input
                        type="text"
                        name="items"
                        value={formData.items}
                        readOnly
                        className="bg-[#f3f3f3] border border-black rounded-[12px] h-[42px] px-4 text-black w-full"
                  />
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
                  <div className="flex items-center gap-80 mt-8">
                  <div className="w-[150px]">
                  <button
                  type="button"
                  onClick={handleDelete}
                  className="bg-[#F76B6B] text-white font-semibold px-10 py-2 rounded-full hover:bg-red-600"
                  disabled={loading}
                  >
                  Delete
                  </button>
                  </div>
                  <button
                  type="submit"
                  className="bg-[#89E0F8] text-black font-semibold px-10 py-2 rounded-full hover:text-white hover:bg-[#5dcaf1]"
                  disabled={loading}
                  >
                  Update
                  </button>
                  </div>
            </form>
            )}
            </div>
      </div>
    </div>
  );
}