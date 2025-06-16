"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AddOpname() {
  const [user, setUser] = useState(undefined);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    productId: "",
    quantity: "",
    physicalQuantity: "",
    differentStock: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!error && user) setUser(user);
      else router.replace("/unauthorized");
    };
    getUser();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("product_id, product_name, product_quantity");
      if (!error) setProducts(data || []);
    };
    fetchProducts();
  }, []);

  // Calculate difference when physicalQuantity changes
  useEffect(() => {
    if (formData.physicalQuantity !== "" && formData.quantity !== "") {
      const diff = parseInt(formData.physicalQuantity || 0) - parseInt(formData.quantity || 0);
      setFormData((prev) => ({ ...prev, differentStock: diff }));
    } else {
      setFormData((prev) => ({ ...prev, differentStock: "" }));
    }
  }, [formData.physicalQuantity, formData.quantity]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    if (name === "physicalQuantity" && value && Number(value) < 0) return;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: undefined });
  };

  const handleProductChange = (e) => {
    const selectedId = e.target.value;
    const product = products.find((p) => p.product_id === parseInt(selectedId));
    setFormData({
      ...formData,
      productId: selectedId,
      quantity: product ? product.product_quantity : "",
      physicalQuantity: "",
      differentStock: "",
    });
    setErrors({});
  };

  const validateForm = () => {
    const { productId, physicalQuantity } = formData;
    const newErrors = {};
    if (!productId) newErrors.productId = "Product is required";
    if (physicalQuantity === "") newErrors.physicalQuantity = "Real stock is required";
    if (physicalQuantity && isNaN(+physicalQuantity)) newErrors.physicalQuantity = "Must be a number";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (submitting) return;
    if (!validateForm()) return;
    setSubmitting(true);

    const physicalQty = parseInt(formData.physicalQuantity || 0);
    const recordedQty = parseInt(formData.quantity || 0);
    const diff = physicalQty - recordedQty;

    try {
      const { data: opnameInsert, error: opnameError } = await supabase
        .from("opnames")
        .insert([{ user_id: user.id, opname_date: new Date().toISOString() }])
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

      if (opnameProductError) throw opnameProductError;

      alert("Opname data saved successfully.");
      setFormData({
        productId: "",
        quantity: "",
        physicalQuantity: "",
        differentStock: "",
      });
      setSubmitting(false);
      router.push("/historyopname");
    } catch (error) {
      alert("Failed to save opname data.");
      setSubmitting(false);
    }
  };

  // 🟢 FIX: Only return null after all hooks
  if (user === undefined) return null;

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#F5F6FA]">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-lg p-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-[#1565C0]">Add Stock Opname</h2>
          <Link href="/historyopname">
            <button className="text-2xl font-semibold text-[#263238] hover:text-[#ff6b6b] transition-colors">×</button>
          </Link>
        </div>
        <div className="mb-6 text-sm text-gray-500 font-medium">
          Required fields <span className="text-red-500">*</span>
        </div>
        <form
          className="space-y-6"
          onSubmit={e => {
            e.preventDefault();
            handleSubmit();
          }}
          autoComplete="off"
        >
          {/* Product */}
          <div className="flex flex-col gap-1">
            <label className="text-base font-semibold text-gray-700 mb-1">
              Product <span className="text-red-500">*</span>
            </label>
            <select
              name="productId"
              value={formData.productId}
              onChange={handleProductChange}
              className={`border rounded-lg px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-[#5E35B1] transition ${
                errors.productId ? "border-red-400 bg-red-50" : "border-gray-300 bg-gray-50"
              }`}
            >
              <option value="">Select Product</option>
              {products.map((product) => (
                <option key={product.product_id} value={product.product_id}>
                  {product.product_name}
                </option>
              ))}
            </select>
            {errors.productId && (
              <span className="text-xs text-red-500 mt-1">{errors.productId}</span>
            )}
          </div>
          {/* Quantity (read-only) */}
          <div className="flex flex-col gap-1">
            <label className="text-base font-semibold text-gray-700 mb-1">
              Quantity
            </label>
            <input
              type="text"
              name="quantity"
              value={formData.quantity}
              readOnly
              className="bg-[#f3f3f3] border rounded-lg px-4 py-2 text-black border-gray-300"
            />
          </div>
          {/* Physical Quantity */}
          <div className="flex flex-col gap-1">
            <label className="text-base font-semibold text-gray-700 mb-1">
              Real Stock <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="physicalQuantity"
              value={formData.physicalQuantity}
              onChange={handleChange}
              min={0}
              className={`border rounded-lg px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-[#5E35B1] transition ${
                errors.physicalQuantity ? "border-red-400 bg-red-50" : "border-gray-300 bg-gray-50"
              }`}
            />
            {errors.physicalQuantity && (
              <span className="text-xs text-red-500 mt-1">{errors.physicalQuantity}</span>
            )}
          </div>
          {/* Different Stock (read-only) */}
          <div className="flex flex-col gap-1">
            <label className="text-base font-semibold text-gray-700 mb-1">
              Different Stock
            </label>
            <input
              type="text"
              name="differentStock"
              value={formData.differentStock}
              readOnly
              className="bg-[#f3f3f3] border rounded-lg px-4 py-2 text-black border-gray-300"
            />
          </div>
          <div className="flex justify-end gap-4 pt-4">
            <Link href="/historyopname">
              <button
                type="button"
                className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-2 rounded-lg bg-[#1565C0] text-white font-semibold hover:bg-[#1A237E] transition"
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}