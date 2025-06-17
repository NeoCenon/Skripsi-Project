"use client";

import { supabase } from '@/lib/supabase';
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import RequireAuth from './protectedroute';

const fields = [
  { label: "Supplier Name", name: "supplierName", placeholder: "e.g. PT Sumber Makmur" },
  { label: "Address", name: "supplierAddress", placeholder: "e.g. Jl. Merdeka No. 123" },
  { label: "Phone Number", name: "supplierPhone", placeholder: "e.g. 08123456789" },
];

const initialForm = {
  supplierName: '',
  supplierAddress: '',
  supplierPhone: '',
};

export default function AddSupplier() {
  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [user, setUser] = useState(undefined);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!error && user) setUser(user);
      else router.replace("/unauthorized");
    };
    getUser();
  }, [router]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
  };

  const validateForm = () => {
    const { supplierName, supplierAddress, supplierPhone } = formData;
    const newErrors = {};
    if (!supplierName.trim()) newErrors.supplierName = "Supplier name is required";
    if (!supplierAddress.trim()) newErrors.supplierAddress = "Address is required";
    if (!supplierPhone.trim()) newErrors.supplierPhone = "Phone number is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    const { supplierName, supplierAddress, supplierPhone } = formData;
    try {
      const { data: existingSuppliers, error: checkError } = await supabase
        .from('suppliers')
        .select('supplier_name')
        .eq('supplier_name', supplierName.trim());

      if (checkError) {
        alert('Error checking for duplicate suppliers. Please try again.');
        return;
      }

      if (existingSuppliers && existingSuppliers.length > 0) {
        setErrors({ supplierName: `Supplier "${supplierName}" already exists!` });
        return;
      }

      const cleanData = {
        supplier_name: supplierName.trim(),
        supplier_address: supplierAddress.trim(),
        supplier_phone: supplierPhone.trim(),
        user_id: user.id,
      };

      const { error } = await supabase
        .from('suppliers')
        .insert([cleanData]);

      if (error) {
        alert(`Failed to save supplier: ${error.message || 'Unknown error'}`);
      } else {
        alert('Supplier added successfully!');
        setFormData(initialForm);
        setErrors({});
        router.push("/supplier");
      }
    } catch (err) {
      alert('An unexpected error occurred. Please try again.');
    }
  };

  if (user === undefined) return null;

  return (
    <RequireAuth>
    <div className="flex justify-center items-center min-h-screen bg-[#F5F6FA]">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-lg p-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-[#1565C0]">Add Supplier</h2>
          <Link href="/supplier">
            <button className="text-2xl font-semibold text-[#9E9E9E] hover:text-[#1565C0] transition-colors">×</button>
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
                className={`border rounded-lg px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-[#5E35B1] transition ${
                  errors[field.name]
                    ? "border-red-400 bg-red-50"
                    : "border-gray-300 bg-gray-50"
                }`}
              />
              {errors[field.name] && (
                <span className="text-xs text-red-500 mt-1">{errors[field.name]}</span>
              )}
            </div>
          ))}
          <div className="flex justify-end gap-4 pt-4">
            <Link href="/supplier">
              <button
                type="button"
                className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
            </Link>
            <button
              type="submit"
              className="px-8 py-2 rounded-lg bg-[#1565C0] text-white font-semibold hover:bg-[#1A237E] transition"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
    </RequireAuth>
  );
}