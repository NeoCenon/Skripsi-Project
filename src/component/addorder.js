"use client";

import { supabase } from '@/lib/supabase';
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AddOrder() {
  const [user, setUser] = useState(undefined);
  const [productOptions, setProductOptions] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [orderData, setOrderData] = useState({
    destination: '',
    products: [{ productId: '', quantity: '', availableStock: null, stockoutThreshold: null }],
  });
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
      const { data } = await supabase.from("products").select();
      setProductOptions(data || []);
    };
    fetchProducts();
  }, []);

  if (user === undefined) return null;

  const handleProductChange = async (index, field, value) => {
    const updated = [...orderData.products];
    updated[index][field] = value;

    if (field === 'productId') {
      const { data } = await supabase
        .from('products')
        .select('product_quantity, product_stockout')
        .eq('product_id', value)
        .single();
      if (data) {
        updated[index].availableStock = data.product_quantity;
        updated[index].stockoutThreshold = data.product_stockout;
      }
    }

    setOrderData({ ...orderData, products: updated });
    setErrors({});
  };

  const addProductRow = () => {
    setOrderData({
      ...orderData,
      products: [...orderData.products, { productId: '', quantity: '', availableStock: null, stockoutThreshold: null }]
    });
  };

  const removeProductRow = (index) => {
    const updated = orderData.products.filter((_, i) => i !== index);
    setOrderData({ ...orderData, products: updated });
  };

  const validateForm = () => {
    const errs = {};
    if (!orderData.destination) errs.destination = "Destination is required";
    orderData.products.forEach((p, idx) => {
      if (!p.productId) errs[`productId${idx}`] = "Product is required";
      if (!p.quantity) errs[`quantity${idx}`] = "Quantity is required";
      if (p.quantity && isNaN(+p.quantity)) errs[`quantity${idx}`] = "Must be a number";
      if (p.quantity && +p.quantity <= 0) errs[`quantity${idx}`] = "Must be more than 0";
      if (p.availableStock !== null && +p.quantity > p.availableStock) {
        errs[`quantity${idx}`] = "Exceeds available stock";
      }
      if (p.stockoutThreshold !== null && p.availableStock !== null) {
        const remaining = p.availableStock - +p.quantity;
        if (remaining < p.stockoutThreshold) {
          errs[`quantity${idx}`] = `Minimum stockout limit: ${p.stockoutThreshold}`;
        }
      }
    });

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (submitting || !validateForm()) return;
    setSubmitting(true);

    const productIds = orderData.products.map(p => p.productId);
    if (new Set(productIds).size !== productIds.length) {
      alert("Duplicate products not allowed in one order!");
      setSubmitting(false);
      return;
    }

    const { data: orderInsert, error: orderError } = await supabase
      .from("orders")
      .insert([{
        order_destination: orderData.destination,
        order_status: "pending",
        user_id: user.id,
      }])
      .select();

    if (orderError || !orderInsert) {
      alert("Failed to create order!");
      setSubmitting(false);
      return;
    }

    const orderId = orderInsert[0].order_id;
    const orderProducts = orderData.products.map(p => ({
      order_id: orderId,
      product_id: p.productId,
      product_quantity: parseInt(p.quantity),
    }));

    const { error: productInsertError } = await supabase
      .from("order_product")
      .insert(orderProducts);

    if (productInsertError) {
      alert("Failed to link products!");
      setSubmitting(false);
      return;
    }

    alert("Order created!");
    setOrderData({
      destination: '',
      products: [{ productId: '', quantity: '', availableStock: null, stockoutThreshold: null }]
    });
    setSubmitting(false);
    router.push("/order");
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#F5F6FA]">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-lg p-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-[#1565C0]">Add Order</h2>
          <Link href="/order">
            <button className="text-2xl font-semibold text-[#9E9E9E] hover:text-[#1565C0]">×</button>
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
              Destination <span className="text-red-500">*</span>
            </label>
            <input
              value={orderData.destination}
              onChange={e => setOrderData({ ...orderData, destination: e.target.value })}
              className={`border rounded-lg px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-[#5E35B1] transition ${
                errors.destination ? "border-red-400 bg-red-50" : "border-gray-300 bg-gray-50"
              }`}
            />
            {errors.destination && (
              <span className="text-xs text-red-500 mt-1">{errors.destination}</span>
            )}
          </div>

          {orderData.products.map((item, index) => (
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
                      ? item.stockoutThreshold !== null
                        ? `Available: ${item.availableStock} (Max: ${item.availableStock - item.stockoutThreshold})`
                        : `Available: ${item.availableStock}`
                      : "Enter quantity"
                  }
                  value={item.quantity || ""}
                  onChange={e => handleProductChange(index, 'quantity', e.target.value)}
                  className={`border rounded-lg px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-[#5E35B1] transition ${
                    errors[`quantity${index}`] ? "border-red-400 bg-red-50" : "border-gray-300 bg-gray-50"
                  }`}
                />
                {errors[`quantity${index}`] && (
                  <span className="text-xs text-red-500 mt-1">{errors[`quantity${index}`]}</span>
                )}
              </div>

              <div className="flex justify-end">
                {orderData.products.length > 1 && (
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
              + Add another order
            </button>
            <div className="flex gap-4">
              <Link href="/order">
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
  );
}