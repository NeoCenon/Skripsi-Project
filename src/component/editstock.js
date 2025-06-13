"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
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

export default function EditInstockPage() {
      const router = useRouter();
      const searchParams = useSearchParams();
      const instock_id = searchParams.get("instock_id");
      const instock_product_id = searchParams.get("instock_product_id");

      const [products, setProducts] = useState([]);
      const [statuses] = useState(["Pending", "Completed"]); 
      const [productId, setProductId] = useState(null); // store current product id
      const [initialQuantity, setInitialQuantity] = useState(0);
      const [instockProductId, setInstockProductId] = useState(null);

      const [sidebarOpen, setSidebarOpen] = useState(true);
      const [formData, setFormData] = useState({
            productName: "",
            category: "",
            supplier: "",
            quantity: "",
            status: "",
      });

      const [suppliers, setSuppliers] = useState([]);

      useEffect(() => {
      const fetchSuppliers = async () => {
      const { data, error } = await supabase.from("suppliers").select("supplier_id, supplier_name");
      if (!error) setSuppliers(data);
      };
      fetchSuppliers();
      }, []);

      // Fetch existing data
      useEffect(() => {
      const fetchInstockDetails = async () => {
            if (!instock_product_id) {
                  console.error("Missing instock_product_id in URL");
                  return;
            }

            const { data, error } = await supabase
                  .from("instock_product")
                  .select(`
                  instock_product_id,
                  product_quantity,
                  instocks (
                        instock_id,
                        instock_date,
                        instock_status,
                        user_id,
                        suppliers (
                        supplier_id,
                        supplier_name
                        )
                  ),
                  products (
                        product_id,
                        product_name,
                        product_category
                  )
                  `)
                  .eq("instock_product_id", instock_product_id)
                  .single();

            if (error || !data) {
                  console.error("Fetch error:", error);
                  return;
            }

            const instock = data.instocks;
            const product = data.products;

            if (!instock || !product) {
                  console.warn("Missing instock or product details");
                  return;
                  
            }

            setFormData({
                  productName: product.product_name || "",
                  supplier: instock.suppliers?.supplier_name || "",
                  quantity: data.product_quantity?.toString() || "",
                  status: instock.instock_status || "",
            });
            setProductId(product.product_id);
            setInitialQuantity(data.product_quantity);
            setInstockProductId(data.instock_product_id);
      };

      if (instock_product_id) {
            fetchInstockDetails();
      }
      }, [instock_product_id]);
      
      useEffect(() => {      
      const fetchProducts = async () => {
      const { data, error } = await supabase
      .from("products")
      .select("product_id, product_name");
      if (!error) setProducts(data);
      };

      fetchProducts();
      }, []);

      const handleChange = (e) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
      };

      const handleUpdate = async () => {
      const { supplier, status, quantity } = formData;
      const updatedQty = parseInt(quantity);

      if (!instock_id || !instock_product_id || !productId) {
      alert("Missing instock, product, or instock_product ID.");
      return;
      }

      if (isNaN(updatedQty) || !supplier || !status) {
      alert("Please fill all fields correctly.");
      return;
      } 

      // / Get product overstock or quantity
      const { data: productData, error: productError } = await supabase
      .from("products")
      .select("product_quantity, product_overstock")
      .eq("product_id", productId)
      .single();

      if (productError || !productData) {
      alert("Failed to retrieve product info.");
      return;
      }

      // const quantityDelta = updatedQty - initialQuantity;
      const newProductQuantity = productData.product_quantity - initialQuantity + updatedQty;
      const maxAllowedQty = productData.product_overstock ?? Infinity;

      if (newProductQuantity > maxAllowedQty) {
            alert(`Resulting product quantity exceeds overstock limit (${maxAllowedQty}).`);
            return;
      }

      if (newProductQuantity < 0) {
            alert("Resulting product quantity cannot be negative.");
            return;
      }

      // Update product quantity
      const { error: updateProductError } = await supabase
      .from("products")
      .update({ product_quantity: newProductQuantity })
      .eq("product_id", productId);

      if (updateProductError) {
            console.error("Failed to update product quantity:", updateProductError);
            return;
      }

      // Update instocks table
      const { error: instockError } = await supabase
            .from("instocks")
            .update({
            instock_status: status,
            })
            .eq("instock_id", instock_id);

      if (instockError) {
            console.error("instock update failed:", instockError);
      }

      // Update instock_product quantity
      const { error: instockProductError } = await supabase
            .from("instock_product")
            .update({product_quantity: updatedQty})
            .eq("instock_product_id", instock_product_id);

      if (instockError || instockProductError) {
            console.error(instockError || instockProductError);
            alert("Failed to update instock!");
      } else {
            alert("Instock updated successfully!");
            router.push("/instock");
      }
      };

      const handleDelete = async () => {
      if (!confirm("Are you sure you want to delete this instock?")) return;

      if (!productId || !instock_product_id || !initialQuantity) {
            alert("Missing required data for deletion.");
            return;
      }

      // 1. Fetch current product quantity
      const { data: productData, error: productError } = await supabase
      .from("products")
      .select("product_quantity, product_overstock")
      .eq("product_id", productId)
      .single();

      if (productError || !productData) {
      console.error("Failed to fetch product quantity before delete:", productError);
      alert("Failed to retrieve product info.");
      return;
      }

      // 2. Subtract the instock quantity that was added
      const restoredQty = productData.product_quantity - initialQuantity;

      const { error: productUpdateError } = await supabase
      .from("products")
      .update({ product_quantity: restoredQty })
      .eq("product_id", productId);

      if (productUpdateError) {
      console.error("Failed to restore product quantity:", productUpdateError);
      alert("Failed to delete instock.");
      return;
      }

      // 3. Delete instock_product
      const { error: instockProductError } = await supabase
      .from("instock_product")
      .delete()
      .eq("instock_product_id", instock_product_id);

      // Step 3: Check if any instock_product rows remain with this instock_id
      const { data: remaining, error: remainingError } = await supabase
      .from("instock_product")
      .select("instock_product_id")
      .eq("instock_id", instock_id);

      if (!remainingError && remaining.length === 0) {
      // Delete the instocks row if no associated instock_product left
      const { error: instockDeleteError } = await supabase
            .from("instocks")
            .delete()
            .eq("instock_id", instock_id);

      if (instockDeleteError) {
            console.error("Failed to delete instocks:", instockDeleteError);
      }
      }

      alert("Instock deleted and product quantity restored.");
      router.push("/instock");
      };

      
      // const { error: instockError } = await supabase
      //       .from("instocks")
      //       .delete()
      //       .eq("instock_id", instock_id);

      //  if (instockError || instockProductError) {
      //       console.error(instockError || instockProductError);
      //       alert("Failed to delete instock.");
      // } else {
      //       alert("Instock deleted and product quantity restored.");
      //       router.push("/instock");
      // }
      // };

      const fields = [
            { label: "Items", name: "productName", readOnly: true },
            { label: "Category", name: "category", readOnly: true },
            { label: "Supplier", name: "supplier" },
            { label: "Quantity", name: "quantity" },
            { label: "Status", name: "status" },
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
                        <div className="bg-[#12232E] text-white w-[80px] flex flex-col items-center pt-4">
                              <div className="flex flex-col items-center space-y-6 mt-6">
                              {[
                                    { icon: <FaChartBar size={24} />, label: "Dashboard", href: "/dashboard" },
                                    { icon: <MdOutlineInventory2 size={24} />, label: "In Stocks", href: "/instock", active: true },
                                    { icon: <FaBoxOpen size={24} />, label: "Products", href: "/product" },
                                    { icon: <FaClipboardList size={24} />, label: "Orders", href: "/order" },
                                    { icon: <FaTruck size={24} />, label: "Suppliers", href: "/supplier" },
                                    { icon: <FaClipboardCheck size={24} />, label: "Stock Opname", href:"/historyopname" },
                                    { icon: <FaUser size={24} />, label: "Account Management", href: "/accountmanagement" },
                              ].map((item, index) => (
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
                              <h2 className="text-2xl font-semibold">Edit Instock</h2>
                              <Link href="/instock">
                                    <button className="text-2xl font-semibold hover:text-sky-700">×</button>
                              </Link>
                        </div>

                        <div className="text-lg mb-8 font-semibold text-black">
                              Instock ID{" "}
                              <span className="text-gray-800 font-medium flex items-center gap-12">
                                    #{instock_id}
                              </span>
                        </div>

                        <div className="space-y-6">
                              {/* {fields.map((field, idx) => ( */}
                              <div className="flex items-center gap-12">
                                    <label className="w-[150px] text-base font-semibold text-black">Product</label>
                                          <input
                                          type="text"
                                          name="productName"
                                          value={formData.productName}
                                          readOnly
                                          className="bg-gray-100 border border-black rounded-[12px] h-[42px] px-6 w-[400px] text-gray-500 cursor-not-allowed"
                                    />
                              </div>

                              <div className="flex items-center gap-12">
                                    <label className="w-[150px] text-base font-semibold text-black">Supplier</label>
                                    <select
                                          name="supplier"
                                          value={formData.supplier}
                                          onChange={handleChange}
                                          className="border border-black rounded-[12px] h-[42px] px-6 w-[400px]"
                                          >
                                          <option value="">Select supplier</option>
                                          {suppliers.map((s) => (
                                          <option key={s.supplier_id} value={s.supplier_name}>
                                                {s.supplier_name}
                                          </option>
                                          ))}
                                    </select>
                              </div>

                              <div className="flex items-center gap-12">
                                    <label className="w-[150px] text-base font-semibold text-black">Quantity</label>
                                    <input
                                          type="number"
                                          name="quantity"
                                          value={formData.quantity}
                                          onChange={handleChange}
                                          placeholder="Enter quantity"
                                          min="1"
                                          className="border border-black rounded-[12px] h-[42px] px-6 w-[400px]"
                                          required
                                    />
                              </div>

                              <div className="flex items-center gap-12">
                                    <label className="w-[150px] text-base font-semibold text-black">Status</label>
                                    <select
                                          name="status"
                                          value={formData.status}
                                          onChange={handleChange}
                                          className="border border-black rounded-[12px] h-[42px] px-6 w-[400px]"
                                    >
                                    {statuses.map((status, i) => (
                                          <option key={i} value={status}>{status}</option>
                                    ))}
                                    </select>
                              </div>
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