"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const fields = [
  { label: "Items", name: "productName", type: "text", placeholder: "e.g. Laptop" },
  { label: "Category", name: "category", type: "text", placeholder: "e.g. Electronics" },
  { label: "Purchase Price", name: "purchasePrice", type: "number", placeholder: "e.g. 1000000" },
  { label: "Sale Price", name: "salePrice", type: "number", placeholder: "e.g. 1200000" },
  { label: "Quantity", name: "totalItems", type: "number", placeholder: "e.g. 10" },
  { label: "Stockout Limit", name: "stockout", type: "number", placeholder: "e.g. 2" },
  { label: "Overstock Limit", name: "overstock", type: "number", placeholder: "e.g. 100" },
];

export default function EditProduct() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const product_id = searchParams.get("product_id");

  const [formData, setFormData] = useState({
    productName: "",
    category: "",
    purchasePrice: "",
    salePrice: "",
    totalItems: "",
    stockout: "",
    overstock: "",
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
  }, []);

  useEffect(() => {
    if (!user || !product_id) return;
    const fetchProduct = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("product_id", product_id)
        .single();

      if (error || !data) {
        alert("Product not found.");
        router.push("/product");
        return;
      }

      setFormData({
        productName: data.product_name || "",
        category: data.product_category || "",
        purchasePrice: data.purchase_price?.toString() || "",
        salePrice: data.sale_price?.toString() || "",
        totalItems: data.product_quantity?.toString() || "",
        stockout: data.product_stockout?.toString() || "",
        overstock: data.product_overstock?.toString() || "",
      });

      setLoading(false);
    };
    fetchProduct();
  }, [user, product_id]);

  if (user === undefined) return null;

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
    if (stockout && +stockout < 0) newErrors.stockout = "Cannot be negative";
    if (overstock && +overstock < 0) newErrors.overstock = "Cannot be negative";
    if (overstock && stockout && +overstock < +stockout) newErrors.overstock = "Overstock must exceed stockout";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = async () => {
    if (!validateForm()) return;
    const { productName, category, purchasePrice, salePrice, totalItems, stockout, overstock } = formData;
    const { error } = await supabase
      .from("products")
      .update({
        product_name: productName.trim(),
        product_category: category.trim(),
        purchase_price: +purchasePrice,
        sale_price: +salePrice,
        product_quantity: +totalItems,
        product_stockout: stockout ? +stockout : null,
        product_overstock: overstock ? +overstock : null,
      })
      .eq("product_id", product_id);

    if (error) {
      alert("Update failed: " + error.message);
    } else {
      alert("Product updated!");
      router.push("/product");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("product_id", product_id);
    if (error) {
      alert("Delete failed: " + error.message);
    } else {
      alert("Product deleted.");
      router.push("/product");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#F5F6FA]">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-lg p-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-[#1565C0]">Edit Product</h2>
          <Link href="/product">
            <button className="text-2xl font-semibold text-[#9E9E9E] hover:text-[#1565C0]">×</button>
          </Link>
        </div>
        <div className="mb-6 text-sm text-gray-500 font-medium">
          Product ID: <span className="text-black font-medium">#{product_id}</span>
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