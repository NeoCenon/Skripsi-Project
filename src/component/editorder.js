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
} from "react-icons/fa";
import { MdOutlineInventory2 } from "react-icons/md";

export default function EditOrderPage() {
      const router = useRouter();
      const searchParams = useSearchParams();
      const order_id = searchParams.get("order_id");

      const [products, setProducts] = useState([]);
      const [statuses, setStatuses] = useState(["Pending", "Completed"]); // you can fetch from DB if dynamic
      const [productId, setProductId] = useState(null); // store current product id
      const [initialQuantity, setInitialQuantity] = useState(0);

      const [sidebarOpen, setSidebarOpen] = useState(true);
      const [formData, setFormData] = useState({
      productName: "",
      category: "",
      destination: "",
      quantity: "",
      status: "",
      });

      const [orderProductId, setOrderProductId] = useState(null); // for updating order_product

      // Fetch existing data
      useEffect(() => {
      

      const fetchOrderDetails = async () => {
      const { data, error } = await supabase
            .from("orders")
            .select(
            `order_destination, order_status,
            order_product:order_product(order_product_id, product_quantity, product_id, 
            product:products(product_name, product_category))`
            )
            .eq("order_id", order_id)
            .single();

      if (error) {
            console.error("Fetch error:", error);
            return;
      }

      const orderProduct = Array.isArray(data.order_product)
            ? data.order_product[0]
            : data.order_product;

      if (!orderProduct || !orderProduct.product) {
            console.warn("Missing order product or product details");
            return;
      }

      setFormData({
            productName: orderProduct.product.product_name || "",
            destination: data.order_destination || "",
            quantity: orderProduct.product_quantity?.toString() || "",
            status: data.order_status || "",
      });
      setProductId(orderProduct.product_id); 
      setInitialQuantity(orderProduct.product_quantity);

      setOrderProductId(orderProduct.order_product_id);
      };
      if (order_id) fetchOrderDetails();
      }, [order_id]);
      
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
      const { destination, status, quantity } = formData;
      const updatedQty = parseInt(quantity);

      if (!order_id) {
            alert("Order ID is missing!");
            return;
      }

      if (!productId || isNaN(updatedQty) || !destination || !status) {
            alert("All fields must be filled correctly!");
            return;
      }  

      if (!orderProductId) {
            alert("Order product ID is missing!");
            return;
      }

      const quantityDelta = updatedQty - initialQuantity;

      // Update orders table
      const { error: orderError } = await supabase
            .from("orders")
            .update({
            order_destination: destination,
            order_status: status,
            })
            .eq("order_id", order_id);

      if (orderError) {
            console.error("orders update failed:", orderError);
      }

      // Update order_product quantity
      const { error: orderProductError } = await supabase
            .from("order_product")
            .update({product_quantity: updatedQty})
            .eq("order_product_id", orderProductId);

      if (orderProductError) {
            console.error("order_product update failed:", orderProductError);
      }

      if (orderError || orderProductError) {
            alert("Failed to update order!");
      } else {
            alert("Order updated successfully!");
            router.push("/order");
      }
      };

      const handleDelete = async () => {
      if (!confirm("Are you sure you want to delete this order?")) return;

      const { error: productError } = await supabase
            .from("order_product")
            .delete()
            .eq("order_id", order_id);

      const { error: orderError } = await supabase
            .from("orders")
            .delete()
            .eq("order_id", order_id);

      if (orderError || productError) {
            console.error(orderError || productError);
            alert("Failed to delete order!");
      } else {
            alert("Order deleted successfully!");
            router.push("/order");
      }
      };

      const fields = [
            { label: "Items", name: "productName", readOnly: true },
            { label: "Category", name: "category", readOnly: true },
            { label: "Destination", name: "destination" },
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
                        <div className="bg-[#12232E] text-white w-[80px] flex flex-col items-center pt-6">
                              <div className="flex flex-col items-center space-y-6 mt-6">
                              {[
                                    { icon: <FaChartBar size={24} />, label: "Dashboard", href: "/dashboard" },
                                    { icon: <MdOutlineInventory2 size={24} />, label: "In Stocks", href: "/instock" },
                                    { icon: <FaBoxOpen size={24} />, label: "Products", href: "/product" },
                                    { icon: <FaClipboardList size={24} />, label: "Orders", href: "/order", active: true },
                                    { icon: <FaTruck size={24} />, label: "Suppliers", href: "/supplier" },
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
                              <h2 className="text-2xl font-semibold">Edit Order</h2>
                              <Link href="/order">
                                    <button className="text-2xl font-semibold hover:text-sky-700">×</button>
                              </Link>
                        </div>

                        <div className="text-lg mb-8 font-semibold text-black">
                              Order ID{" "}
                              <span className="text-gray-800 font-medium flex items-center gap-12">
                                    #{order_id}
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
                                    <label className="w-[150px] text-base font-semibold text-black">Destination</label>
                                    <input
                                          type="text"
                                          name="destination"
                                          value={formData.destination}
                                          onChange={handleChange}
                                          placeholder="Enter destination"
                                          className="border border-black rounded-[12px] h-[42px] px-6 w-[400px]"
                                          required
                                    />
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