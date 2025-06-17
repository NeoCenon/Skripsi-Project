"use client";
export const dynamic = "force-dynamic";

import { useSearchParams, useRouter } from "next/navigation";
import Link from 'next/link';
import { useEffect, useState, useCallback } from "react";
import { supabase } from '@/lib/supabase';
import RequireAuth from './protectedroute';

const fields = [
  { label: "Supplier", name: "supplierName", placeholder: "e.g. PT Sumber Makmur" },
  { label: "Address", name: "address", placeholder: "e.g. Jl. Merdeka No. 123" },
  { label: "Phone Number", name: "phoneNumber", placeholder: "e.g. 08123456789" },
];

// Accept searchParams as props for Next.js app router compatibility
export default function EditSupplierPage() {
  const searchParams = useSearchParams();
  const supplier_id = searchParams.get("supplier_id");
  const router = useRouter();

  const [formData, setFormData] = useState({
    supplierName: '',
    address: '',
    phoneNumber: '',
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

  // fetchSupplier must be at top-level and use useCallback with dependencies
  const fetchSupplier = useCallback(async () => {
    if (!user || !supplier_id) return;
    const { data, error } = await supabase
      .from("suppliers")
      .select("*")
      .eq("supplier_id", supplier_id)
      .single();

    if (error || !data) {
      alert("Supplier not found.");
      router.push("/supplier");
      return;
    }

    setFormData({
      supplierName: data.supplier_name || "",
      address: data.supplier_address || "",
      phoneNumber: data.supplier_phone || "",
    });

    setLoading(false);
  }, [user, supplier_id, router]);

  useEffect(() => {
    fetchSupplier();
  }, [fetchSupplier]);

  if (user === undefined) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
  };

  const validateForm = () => {
    const { supplierName, address, phoneNumber } = formData;
    const newErrors = {};
    if (!supplierName.trim()) newErrors.supplierName = "Supplier name is required";
    if (!address.trim()) newErrors.address = "Address is required";
    if (!phoneNumber.trim()) newErrors.phoneNumber = "Phone number is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = async () => {
    if (!validateForm()) return;
    const { supplierName, address, phoneNumber } = formData;
    const { error } = await supabase
      .from("suppliers")
      .update({
        supplier_name: supplierName.trim(),
        supplier_address: address.trim(),
        supplier_phone: phoneNumber.trim(),
      })
      .eq("supplier_id", supplier_id);

    if (error) {
      alert("Update failed: " + error.message);
    } else {
      alert("Supplier updated!");
      router.push("/supplier");
    }
  };

  return (
    <RequireAuth>
      <div className="flex justify-center items-center min-h-screen bg-[#F5F6FA]">
        <div className="w-full max-w-xl bg-white rounded-2xl shadow-lg p-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-[#1565C0]">Edit Supplier</h2>
            <Link href="/supplier">
              <button className="text-2xl font-semibold text-[#263238] hover:text-[#ff6b6b] transition-colors">×</button>
            </Link>
          </div>
          <div className="mb-6 text-sm text-gray-500 font-medium">
            Supplier ID: <span className="text-black font-medium">#{supplier_id}</span>
          </div>

          {loading ? (
            <div className="text-center text-gray-500">Loading...</div>
          ) : (
            <form
              className="space-y-6"
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdate();
              }}
              autoComplete="off"
            >
              {fields.map((field, idx) => (
                <div key={idx} className="flex flex-col gap-1">
                  <label className="text-base font-semibold text-gray-700 mb-1">
                    {field.label}
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    name={field.name}
                    value={formData[field.name]}
                    onChange={handleChange}
                    placeholder={field.placeholder}
                    readOnly={field.name === "supplierName"}
                    className={`border rounded-lg px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-[#5E35B1] transition ${
                      errors[field.name]
                        ? "border-red-400 bg-red-50"
                        : "border-gray-300 bg-gray-50"
                    } ${field.name === "supplierName" ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""}`}
                  />
                  {errors[field.name] && (
                    <span className="text-xs text-red-500 mt-1">{errors[field.name]}</span>
                  )}
                </div>
              ))}
              <div className="flex justify-end pt-4">
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