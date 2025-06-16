"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function EditOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const order_id = searchParams.get("order_id");
  const order_product_id = searchParams.get("order_product_id");

  const [formData, setFormData] = useState({
    productName: "",
    destination: "",
    quantity: "",
    status: "",
  });
  const [statuses] = useState(["Pending", "Completed"]);
  const [productId, setProductId] = useState(null);
  const [initialQuantity, setInitialQuantity] = useState(0);
  const [errors, setErrors] = useState({});
  const [user, setUser] = useState(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!error && user) setUser(user);
      else router.replace("/unauthorized");
    };
    getUser();
  }, []);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!order_product_id) return;
      const { data, error } = await supabase
        .from("order_product")
        .select(`
          order_product_id,
          product_quantity,
          orders (
            order_id,
            order_destination,
            order_status
          ),
          products (
            product_id,
            product_name
          )
        `)
        .eq("order_product_id", order_product_id)
        .single();

      if (error || !data) {
        alert("Order not found.");
        router.push("/order");
        return;
      }

      setFormData({
        productName: data.products?.product_name || "",
        destination: data.orders?.order_destination || "",
        quantity: data.product_quantity?.toString() || "",
        status: data.orders?.order_status || "",
      });
      setProductId(data.products?.product_id);
      setInitialQuantity(data.product_quantity);
      setLoading(false);
    };

    if (order_product_id) fetchOrderDetails();
  }, [order_product_id, router]);

  if (user === undefined) return null;

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    if (type === "number" && value && Number(value) < 0) return;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: undefined });
  };

  const validateForm = () => {
    const { destination, status, quantity } = formData;
    const newErrors = {};
    if (!destination) newErrors.destination = "Destination is required";
    if (!status) newErrors.status = "Status is required";
    if (!quantity) newErrors.quantity = "Quantity is required";
    if (quantity && isNaN(+quantity)) newErrors.quantity = "Must be a number";
    if (quantity && +quantity < 0) newErrors.quantity = "Cannot be negative";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = async () => {
    if (!validateForm()) return;
    const { destination, status, quantity } = formData;
    const updatedQty = parseInt(quantity);

    if (!order_id || !order_product_id || !productId) {
      alert("Missing order, product, or order_product ID.");
      return;
    }

    // Get product stockout or quantity
    const { data: productData, error: productError } = await supabase
      .from("products")
      .select("product_quantity, product_stockout")
      .eq("product_id", productId)
      .single();

    if (productError || !productData) {
      alert("Failed to retrieve product info.");
      return;
    }

    const stockout = productData.product_stockout ?? -Infinity;
    const newProductQty = productData.product_quantity + initialQuantity - updatedQty;

    if (newProductQty < stockout) {
      alert(`Stock would drop below the stockout threshold of ${stockout}.`);
      return;
    }

    const { error: updateProductError } = await supabase
      .from("products")
      .update({ product_quantity: newProductQty })
      .eq("product_id", productId);

    if (updateProductError) {
      alert("Failed to update product quantity.");
      return;
    }

    // Update orders table
    const { error: orderError } = await supabase
      .from("orders")
      .update({
        order_destination: destination,
        order_status: status,
      })
      .eq("order_id", order_id);

    // Update order_product quantity
    const { error: orderProductError } = await supabase
      .from("order_product")
      .update({ product_quantity: updatedQty })
      .eq("order_product_id", order_product_id);

    if (orderError || orderProductError) {
      alert("Failed to update order!");
    } else {
      alert("Order updated successfully!");
      router.push("/order");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this order?")) return;
    if (!productId || !order_product_id || !initialQuantity) {
      alert("Missing required data for deletion.");
      return;
    }

    // 1. Fetch current product quantity
    const { data: productData, error: productError } = await supabase
      .from("products")
      .select("product_quantity")
      .eq("product_id", productId)
      .single();

    if (productError || !productData) {
      alert("Failed to retrieve product info.");
      return;
    }

    // 2. Restore product quantity
    const restoredQty = productData.product_quantity + initialQuantity;

    const { error: productUpdateError } = await supabase
      .from("products")
      .update({ product_quantity: restoredQty })
      .eq("product_id", productId);

    if (productUpdateError) {
      alert("Failed to restore product quantity.");
      return;
    }

    // 3. Delete order_product
    const { error: orderProductError } = await supabase
      .from("order_product")
      .delete()
      .eq("order_product_id", order_product_id);

    // 4. Delete orders row if no associated order_product left
    const { data: remaining, error: remainingError } = await supabase
      .from("order_product")
      .select("order_product_id")
      .eq("order_id", order_id);

    if (!remainingError && remaining.length === 0) {
      await supabase
        .from("orders")
        .delete()
        .eq("order_id", order_id);
    }

    alert("Order deleted and product quantity restored.");
    router.push("/order");
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#F5F6FA]">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-lg p-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-[#1565C0]">Edit Order</h2>
          <Link href="/order">
            <button className="text-2xl font-semibold text-[#263238] hover:text-[#ff6b6b] transition-colors">×</button>
          </Link>
        </div>
        <div className="mb-6 text-sm text-gray-500 font-medium">
          Order ID: <span className="text-black font-medium">#{order_id}</span>
        </div>
        {loading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : (
          <form
            className="space-y-6"
            onSubmit={e => {
              e.preventDefault();
              handleUpdate();
            }}
            autoComplete="off"
          >
            {/* Product Name (read only) */}
            <div className="flex flex-col gap-1">
              <label className="text-base font-semibold text-gray-700 mb-1">
                Product
              </label>
              <input
                type="text"
                name="productName"
                value={formData.productName}
                readOnly
                className="bg-gray-100 border rounded-lg px-4 py-2 w-full text-gray-500 cursor-not-allowed border-gray-300"
              />
            </div>
            {/* Destination */}
            <div className="flex flex-col gap-1">
              <label className="text-base font-semibold text-gray-700 mb-1">
                Destination <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="destination"
                value={formData.destination}
                onChange={handleChange}
                placeholder="Enter destination"
                className={`border rounded-lg px-4 py-2 w-full text-black focus:outline-none focus:ring-2 focus:ring-[#5E35B1] transition ${
                  errors.destination ? "border-red-400 bg-red-50" : "border-gray-300 bg-gray-50"
                }`}
              />
              {errors.destination && (
                <span className="text-xs text-red-500 mt-1">{errors.destination}</span>
              )}
            </div>
            {/* Quantity */}
            <div className="flex flex-col gap-1">
              <label className="text-base font-semibold text-gray-700 mb-1">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                min={0}
                className={`border rounded-lg px-4 py-2 w-full text-black focus:outline-none focus:ring-2 focus:ring-[#5E35B1] transition ${
                  errors.quantity ? "border-red-400 bg-red-50" : "border-gray-300 bg-gray-50"
                }`}
              />
              {errors.quantity && (
                <span className="text-xs text-red-500 mt-1">{errors.quantity}</span>
              )}
            </div>
            {/* Status */}
            <div className="flex flex-col gap-1">
              <label className="text-base font-semibold text-gray-700 mb-1">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className={`border rounded-lg px-4 py-2 w-full text-black focus:outline-none focus:ring-2 focus:ring-[#5E35B1] transition ${
                  errors.status ? "border-red-400 bg-red-50" : "border-gray-300 bg-gray-50"
                }`}
              >
                {statuses.map((status, i) => (
                  <option key={i} value={status}>{status}</option>
                ))}
              </select>
              {errors.status && (
                <span className="text-xs text-red-500 mt-1">{errors.status}</span>
              )}
            </div>
            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={handleDelete}
                className="px-6 py-2 rounded-lg bg-[#F76B6B] text-white font-semibold hover:bg-red-600"
              >
                Delete
              </button>
              <button
                type="submit"
                className="px-8 py-2 rounded-lg bg-[#1565C0] text-white font-semibold hover:bg-[#1A237E] transition"
              >
                Update
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}