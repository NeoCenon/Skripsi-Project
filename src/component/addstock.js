"use client";

import { supabase } from '@/lib/supabase';
import { useState, useEffect, useCallback } from "react";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import RequireAuth from './protectedroute';

export default function AddinStock() {
  const [user, setUser] = useState(undefined);
  const [instockData, setInstockData] = useState({
    supplier: '',
    products: [{ productId: '', quantity: '', availableStock: null, overstockLimit: null }],
  });
  const [productOptions, setProductOptions] = useState([]);
  const [supplierOptions, setSupplierOptions] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!error && user) setUser(user);
      else router.replace("/unauthorized");
    };
    getUser();
  }, [router]);

  // fetchProducts and fetchSuppliers must be at top-level and use useCallback with dependencies
  const fetchProducts = useCallback(async () => {
    const { data } = await supabase.from("products").select();
    setProductOptions(data || []);
  }, []);

  const fetchSuppliers = useCallback(async () => {
    const { data } = await supabase.from("suppliers").select("supplier_id, supplier_name");
    setSupplierOptions(data || []);
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchSuppliers();
  }, [fetchProducts, fetchSuppliers]);

  if (user === undefined) return null;

  const handleProductChange = async (index, field, value) => {
    if (field === 'quantity' && value !== '' && parseInt(value) < 0) return;
    const updated = [...instockData.products];
    updated[index][field] = value;
    if (field === 'productId') {
      const { data } = await supabase
        .from('products')
        .select('product_quantity, product_overstock')
        .eq('product_id', value)
        .single();
      if (data) {
        updated[index].availableStock = data.product_quantity;
        updated[index].overstockLimit = data.product_overstock;
      }
    }
    setInstockData({ ...instockData, products: updated });
    setErrors({});
  };

  const addProductRow = () => {
    setInstockData({
      ...instockData,
      products: [...instockData.products, { productId: '', quantity: '', availableStock: null, overstockLimit: null }]
    });
  };

  const removeProductRow = (index) => {
    const updated = instockData.products.filter((_, i) => i !== index);
    setInstockData({ ...instockData, products: updated });
  };

  const validateForm = () => {
    const errs = {};
    if (!instockData.supplier) errs.supplier = "Supplier is required";
    instockData.products.forEach((p, idx) => {
      if (!p.productId) errs[`productId${idx}`] = "Product is required";
      if (!p.quantity) errs[`quantity${idx}`] = "Quantity is required";
      if (p.quantity && isNaN(+p.quantity)) errs[`quantity${idx}`] = "Must be a number";
      if (p.quantity && +p.quantity < 0) errs[`quantity${idx}`] = "Cannot be negative";
      if (p.productId && p.availableStock !== null && p.overstockLimit !== null) {
        const newTotal = +p.availableStock + +p.quantity;
        if (p.overstockLimit !== null && newTotal > p.overstockLimit) {
          errs[`quantity${idx}`] = `Total stock exceeds overstock limit (${p.overstockLimit})`;
        }
      }
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (submitting) return;
    if (!validateForm()) return;
    setSubmitting(true);

    const productIds = instockData.products.map(p => p.productId);
    if (new Set(productIds).size !== productIds.length) {
      alert("You cannot add the same product multiple times in one instock!");
      setSubmitting(false);
      return;
    }

    // Insert into instocks
    const { data: instockInsert, error: instockError } = await supabase
      .from("instocks")
      .insert([{ supplier_id: instockData.supplier, instock_status: "pending", user_id: user.id }])
      .select();

    if (instockError || !instockInsert) {
      alert("Failed to create instock!");
      setSubmitting(false);
      return;
    }

    const instockId = instockInsert[0].instock_id;
    const instockProducts = instockData.products.map(p => ({
      instock_id: instockId,
      product_id: p.productId,
      product_quantity: parseInt(p.quantity),
    }));

    const { error: productInsertError } = await supabase
      .from("instock_product")
      .insert(instockProducts);

    for (const p of instockData.products) {
      await supabase
        .from("products")
        .update({
          product_quantity: p.availableStock + parseInt(p.quantity),
        })
        .eq("product_id", p.productId);
    }

    if (productInsertError) {
      alert("Failed to link products!");
      setSubmitting(false);
      return;
    }
    alert("Instock created successfully!");
    setInstockData({
      supplier: '',
      products: [{ productId: '', quantity: '', availableStock: null, overstockLimit: null }]
    });
    setSubmitting(false);
    router.push("/instock");
  };

  return (
    <RequireAuth>
    <div className="flex justify-center items-center min-h-screen bg-[#F5F6FA]">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-lg p-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-[#1565C0]">Add Stock</h2>
          <Link href="/instock">
            <button className="text-2xl font-semibold text-[#9E9E9E] hover:text-[#1565C0] transition-colors">×</button>
          </Link>
        </div>
        <div className="mb-6 text-sm text-gray-500 font-medium">
          Required fields <span className="text-red-500">*</span>
        </div>
        <form
          className="space-y-8"
          onSubmit={e => {
            e.preventDefault();
            handleSubmit();
          }}
          autoComplete="off"
        >
          <div className="flex flex-col gap-1">
            <label className="text-base font-semibold text-gray-700 mb-1">
              Supplier <span className="text-red-500">*</span>
            </label>
            <select
              value={instockData.supplier}
              onChange={e => setInstockData({ ...instockData, supplier: e.target.value })}
              className={`border rounded-lg px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-[#5E35B1] transition ${
                errors.supplier ? "border-red-400 bg-red-50" : "border-gray-300 bg-gray-50"
              }`}
            >
              <option value="">Select Supplier</option>
              {supplierOptions.map(supplier => (
                <option key={supplier.supplier_id} value={supplier.supplier_id}>
                  {supplier.supplier_name}
                </option>
              ))}
            </select>
            {errors.supplier && (
              <span className="text-xs text-red-500 mt-1">{errors.supplier}</span>
            )}
          </div>

          {instockData.products.map((item, index) => (
            <div key={index} className="mb-2 space-y-4 border p-4 rounded-md shadow-sm">
              <div className="flex flex-col gap-1">
                <label className="text-base font-semibold text-gray-700 mb-1">
                  Product <span className="text-red-500">*</span>
                </label>
                <select
                  value={item.productId || ''}
                  onChange={e => handleProductChange(index, 'productId', e.target.value)}
                  className={`border rounded-lg px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-[#5E35B1] transition ${
                    errors[`productId${index}`] ? "border-red-400 bg-red-50" : "border-gray-300 bg-gray-50"
                  }`}
                >
                  <option value="">Select Product</option>
                  {productOptions.map(product => (
                    <option key={product.product_id} value={product.product_id}>
                      {product.product_name}
                    </option>
                  ))}
                </select>
                {errors[`productId${index}`] && (
                  <span className="text-xs text-red-500 mt-1">{errors[`productId${index}`]}</span>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-base font-semibold text-gray-700 mb-1">
                  Quantity <span className="text-red-500">*</span>
                </label>
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
                  onChange={e => {
                    const value = e.target.value;
                    if (value === "" || parseInt(value) >= 0) {
                      handleProductChange(index, 'quantity', value);
                    }
                  }}
                  className={`border rounded-lg px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-[#5E35B1] transition ${
                    errors[`quantity${index}`] ? "border-red-400 bg-red-50" : "border-gray-300 bg-gray-50"
                  }`}
                />
                {errors[`quantity${index}`] && (
                  <span className="text-xs text-red-500 mt-1">{errors[`quantity${index}`]}</span>
                )}
              </div>
              <div className="flex justify-end">
                {instockData.products.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeProductRow(index)}
                    className="text-red-500 text-sm underline mt-2 hover:text-[#FF9999]"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}

          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={addProductRow}
              className="text-blue-500 hover:text-[#0033FF] text-sm"
            >
              + Add another stock
            </button>
            <div className="flex gap-4">
              <Link href="/instock">
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
          </div>
        </form>
      </div>
    </div>
    </RequireAuth>
  );
}