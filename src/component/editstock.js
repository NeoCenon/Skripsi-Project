"use client";

import Link from "next/link";
import RequireAuth from "./protectedroute";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const fields = [
  { label: "Product", name: "productName", readOnly: true },
  { label: "Supplier", name: "supplier" },
  { label: "Quantity", name: "quantity", type: "number" },
  { label: "Status", name: "status" },
];

export default function EditInstockPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const instock_id = searchParams.get("instock_id");
  const instock_product_id = searchParams.get("instock_product_id");

  const [formData, setFormData] = useState({
    productName: "",
    supplier: "",
    quantity: "",
    status: "",
  });
  const [suppliers, setSuppliers] = useState([]);
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
  }, [router]);

  // Fetch suppliers at top-level
  useEffect(() => {
    const fetchSuppliers = async () => {
      const { data, error } = await supabase.from("suppliers").select("supplier_id, supplier_name");
      if (!error) setSuppliers(data || []);
    };
    fetchSuppliers();
  }, []);

  // Fetch instock details at top-level
  useEffect(() => {
    const fetchInstockDetails = async () => {
      if (!instock_product_id) return;
      const { data, error } = await supabase
        .from("instock_product")
        .select(`
          instock_product_id,
          product_quantity,
          instocks (
            instock_id,
            instock_status,
            suppliers (
              supplier_id,
              supplier_name
            )
          ),
          products (
            product_id,
            product_name
          )
        `)
        .eq("instock_product_id", instock_product_id)
        .single();

      if (error || !data) {
        alert("Instock not found.");
        router.push("/instock");
        return;
      }

      setFormData({
        productName: data.products?.product_name || "",
        supplier: data.instocks?.suppliers?.supplier_name || "",
        quantity: data.product_quantity?.toString() || "",
        status: data.instocks?.instock_status || "",
      });
      setProductId(data.products?.product_id);
      setInitialQuantity(data.product_quantity);
      setLoading(false);
    };
    if (instock_product_id) fetchInstockDetails();
  }, [instock_product_id, router]);

  if (user === undefined) return null;

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    if (type === "number" && value && Number(value) < 0) return;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: undefined });
  };

  const validateForm = () => {
    const { supplier, status, quantity } = formData;
    const newErrors = {};
    if (!supplier) newErrors.supplier = "Supplier is required";
    if (!status) newErrors.status = "Status is required";
    if (!quantity) newErrors.quantity = "Quantity is required";
    if (quantity && isNaN(+quantity)) newErrors.quantity = "Must be a number";
    if (quantity && +quantity < 0) newErrors.quantity = "Cannot be negative";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = async () => {
    if (!validateForm()) return;
    const { supplier, status, quantity } = formData;
    const updatedQty = parseInt(quantity);

    if (!instock_id || !instock_product_id || !productId) {
      alert("Missing instock, product, or instock_product ID.");
      return;
    }

    // Get product overstock or quantity
    const { data: productData, error: productError } = await supabase
      .from("products")
      .select("product_quantity, product_overstock")
      .eq("product_id", productId)
      .single();

    if (productError || !productData) {
      alert("Failed to retrieve product info.");
      return;
    }

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
      alert("Failed to update product quantity.");
      return;
    }

    // Update instocks table
    const { error: instockError } = await supabase
      .from("instocks")
      .update({ instock_status: status })
      .eq("instock_id", instock_id);

    // Update instock_product quantity
    const { error: instockProductError } = await supabase
      .from("instock_product")
      .update({ product_quantity: updatedQty })
      .eq("instock_product_id", instock_product_id);

    if (instockError || instockProductError) {
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
      .select("product_quantity")
      .eq("product_id", productId)
      .single();

    if (productError || !productData) {
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
      alert("Failed to restore product quantity.");
      return;
    }

    // 3. Delete instock_product
    const { error: instockProductError } = await supabase
      .from("instock_product")
      .delete()
      .eq("instock_product_id", instock_product_id);

    // 4. Delete instocks row if no associated instock_product left
    const { data: remaining, error: remainingError } = await supabase
      .from("instock_product")
      .select("instock_product_id")
      .eq("instock_id", instock_id);

    if (!remainingError && remaining.length === 0) {
      await supabase
        .from("instocks")
        .delete()
        .eq("instock_id", instock_id);
    }

    alert("Instock deleted and product quantity restored.");
    router.push("/instock");
  };

  return (
    <RequireAuth>
      <div className="flex justify-center items-center min-h-screen bg-[#F5F6FA]">
        <div className="w-full max-w-xl bg-white rounded-2xl shadow-lg p-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-[#1565C0]">Edit Instock</h2>
            <Link href="/instock">
              <button className="text-2xl font-semibold text-[#263238] hover:text-[#ff6b6b] transition-colors">×</button>
            </Link>
          </div>
          <div className="mb-6 text-sm text-gray-500 font-medium">
            Instock ID: <span className="text-black font-medium">#{instock_id}</span>
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
              {/* Supplier */}
              <div className="flex flex-col gap-1">
                <label className="text-base font-semibold text-gray-700 mb-1">
                  Supplier <span className="text-red-500">*</span>
                </label>
                <select
                  name="supplier"
                  value={formData.supplier}
                  onChange={handleChange}
                  className={`border rounded-lg px-4 py-2 w-full text-black focus:outline-none focus:ring-2 focus:ring-[#5E35B1] transition ${
                    errors.supplier ? "border-red-400 bg-red-50" : "border-gray-300 bg-gray-50"
                  }`}
                >
                  <option value="">Select supplier</option>
                  {suppliers.map((s) => (
                    <option key={s.supplier_id} value={s.supplier_name}>
                      {s.supplier_name}
                    </option>
                  ))}
                </select>
                {errors.supplier && (
                  <span className="text-xs text-red-500 mt-1">{errors.supplier}</span>
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
    </RequireAuth>
  );
}