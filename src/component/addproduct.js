"use client";

import { supabase } from '@/lib/supabase';
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const fields = [
  { label: "Items", name: "productName", type: "text", placeholder: "e.g. Laptop" },
  { label: "Category", name: "category", type: "text", placeholder: "e.g. Electronics" },
  { label: "Purchase Price", name: "purchasePrice", type: "number", placeholder: "e.g. 1000000" },
  { label: "Sale Price", name: "salePrice", type: "number", placeholder: "e.g. 1200000" },
  { label: "Quantity", name: "totalItems", type: "number", placeholder: "e.g. 10" },
  { label: "Stockout Limit", name: "stockout", type: "number", placeholder: "e.g. 2" },
  { label: "Overstock Limit", name: "overstock", type: "number", placeholder: "e.g. 100" },
];

const initialForm = {
  productName: '',
  category: '',
  purchasePrice: '',
  salePrice: '',
  totalItems: '',
  stockout: '',
  overstock: '',
};

export default function AddProduct() {
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
  }, []);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    if (type === "number" && value && Number(value) < 0) return;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: undefined });
  };

  const validateForm = () => {
    const { productName, category, purchasePrice, salePrice, totalItems, stockout, overstock } = formData;
    const newErrors = {};
    if (!productName.trim()) newErrors.productName = "Item name is required";
    if (!category.trim()) newErrors.category = "Category is required";
    if (!purchasePrice) newErrors.purchasePrice = "Purchase price is required";
    if (!salePrice) newErrors.salePrice = "Sale price is required";
    if (!totalItems) newErrors.totalItems = "Quantity is required";
    if (purchasePrice && isNaN(+purchasePrice)) newErrors.purchasePrice = "Must be a number";
    if (salePrice && isNaN(+salePrice)) newErrors.salePrice = "Must be a number";
    if (totalItems && isNaN(+totalItems)) newErrors.totalItems = "Must be a number";
    if (stockout && isNaN(+stockout)) newErrors.stockout = "Must be a number";
    if (overstock && isNaN(+overstock)) newErrors.overstock = "Must be a number";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    const { productName, category, purchasePrice, salePrice, totalItems, stockout, overstock } = formData;
    try {
      const { data: existingProducts, error: checkError } = await supabase
        .from('products')
        .select('product_name');

      if (checkError) {
        alert('Error checking for duplicate products. Please try again.');
        return;
      }

      const inputName = productName.trim().toLowerCase();
      const isDuplicate = existingProducts?.some(
        p => p.product_name && p.product_name.trim().toLowerCase() === inputName
      );

      if (isDuplicate) {
        setErrors({ productName: `Product "${productName}" already exists!` });
        return;
      }

      const cleanData = {
        product_name: productName.trim(),
        product_category: category.trim(),
        purchase_price: +purchasePrice,
        sale_price: +salePrice,
        product_quantity: +totalItems,
        product_stockout: stockout ? +stockout : null,
        product_overstock: overstock ? +overstock : null,
        user_id: user.id,
      };

      const { error } = await supabase.from('products').insert([cleanData]);
      if (error) {
        alert(`Failed to save product: ${error.message || 'Unknown error'}`);
      } else {
        alert('Product added successfully!');
        setFormData(initialForm);
        setErrors({});
        router.push("/product");
      }
    } catch (err) {
      alert('An unexpected error occurred. Please try again.');
    }
  };

  if (user === undefined) return null;

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#F5F6FA]">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-lg p-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-[#1565C0]">Add Product</h2>
          <Link href="/product">
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
                {(field.name === "productName" ||
                  field.name === "category" ||
                  field.name === "purchasePrice" ||
                  field.name === "salePrice" ||
                  field.name === "totalItems") && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </label>
              <input
                type={field.type}
                name={field.name}
                value={formData[field.name]}
                onChange={handleChange}
                placeholder={field.placeholder}
                min={field.type === "number" ? 0 : undefined}
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
            <Link href="/product">
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
  );
}