"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import RequireAuth from "./protectedroute";

// Move useSearchParams to props for app router compatibility
export default function EditOpnamePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const opname_id = searchParams.get("opname_id");
  const opname_product_id = searchParams.get("opname_product_id");

  const [formData, setFormData] = useState({
    productId: "",
    items: "",
    quantity: "",
    physicalQuantity: "",
    differentStock: "",
  });
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

  // fetchOpname at top-level, no useCallback needed
  useEffect(() => {
    const fetchOpname = async () => {
      if (!user || !opname_product_id) return;
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
        physicalQuantity: data.real_stock?.toString() || "",
        differentStock: data.stock_difference?.toString() || "",
      });
      setLoading(false);
    };
    if (user && opname_product_id) fetchOpname();
  }, [user, opname_product_id, router]);

  if (user === undefined) return null;

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    if (name === "physicalQuantity" && value && Number(value) < 0) return;
    setFormData((prev) => {
      let updated = { ...prev, [name]: value };
      if (name === "physicalQuantity") {
        const diff =
          value !== "" && prev.quantity !== ""
            ? parseInt(value || 0) - parseInt(prev.quantity || 0)
            : "";
        updated.differentStock = diff;
      }
      return updated;
    });
    setErrors({ ...errors, [name]: undefined });
  };

  const validateForm = () => {
    const { physicalQuantity } = formData;
    const newErrors = {};
    if (physicalQuantity === "") newErrors.physicalQuantity = "Real stock is required";
    if (physicalQuantity && isNaN(+physicalQuantity)) newErrors.physicalQuantity = "Must be a number";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = async () => {
    if (!validateForm()) return;
    const physicalQty = parseInt(formData.physicalQuantity || 0);
    const recordedQty = parseInt(formData.quantity || 0);
    const diff = physicalQty - recordedQty;

    setLoading(true);

    const { error: updateError } = await supabase
      .from("opname_product")
      .update({
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

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this opname?")) return;
    setLoading(true);

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

  return (
    <RequireAuth>
      <div className="flex justify-center items-center min-h-screen bg-[#F5F6FA]">
        <div className="w-full max-w-xl bg-white rounded-2xl shadow-lg p-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-[#1565C0]">Edit Stock Opname</h2>
            <Link href="/historyopname">
              <button className="text-2xl font-semibold text-[#263238] hover:text-[#ff6b6b] transition-colors">×</button>
            </Link>
          </div>
          <div className="mb-6 text-sm text-gray-500 font-medium">
            Opname ID: <span className="text-black font-medium">#{opname_id}</span>
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
                  Items
                </label>
                <input
                  type="text"
                  name="items"
                  value={formData.items}
                  readOnly
                  className="bg-gray-100 border rounded-lg px-4 py-2 w-full text-gray-500 cursor-not-allowed border-gray-300"
                />
              </div>
              {/* Quantity (read only) */}
              <div className="flex flex-col gap-1">
                <label className="text-base font-semibold text-gray-700 mb-1">
                  Quantity
                </label>
                <input
                  type="text"
                  name="quantity"
                  value={formData.quantity}
                  readOnly
                  className="bg-gray-100 border rounded-lg px-4 py-2 w-full text-gray-500 cursor-not-allowed border-gray-300"
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
                  className={`border rounded-lg px-4 py-2 w-full text-black focus:outline-none focus:ring-2 focus:ring-[#5E35B1] transition ${
                    errors.physicalQuantity ? "border-red-400 bg-red-50" : "border-gray-300 bg-gray-50"
                  }`}
                />
                {errors.physicalQuantity && (
                  <span className="text-xs text-red-500 mt-1">{errors.physicalQuantity}</span>
                )}
              </div>
              {/* Different Stock (read only) */}
              <div className="flex flex-col gap-1">
                <label className="text-base font-semibold text-gray-700 mb-1">
                  Different Stock
                </label>
                <input
                  type="text"
                  name="differentStock"
                  value={formData.differentStock}
                  readOnly
                  className="bg-gray-100 border rounded-lg px-4 py-2 w-full text-gray-500 cursor-not-allowed border-gray-300"
                />
              </div>
              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-6 py-2 rounded-lg bg-[#F76B6B] text-white font-semibold hover:bg-red-600"
                  disabled={loading}
                >
                  Delete
                </button>
                <button
                  type="submit"
                  className="px-8 py-2 rounded-lg bg-[#1565C0] text-white font-semibold hover:bg-[#1A237E] transition"
                  disabled={loading}
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