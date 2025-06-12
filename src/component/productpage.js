"use client";

import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { useState, useEffect, useRef } from 'react';
import { FiMenu, FiSearch, FiBell, FiMoreVertical } from "react-icons/fi";
import {
  FaBoxOpen,
  FaChartBar,
  FaClipboardList,
  FaUser,
  FaTruck,
  FaClipboardCheck,
} from "react-icons/fa";
import { MdOutlineInventory2 } from "react-icons/md";
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

export default function ProductPage() {
  const [items, setItems] = useState([]);
  const [flattenedRows, setFlattenedRows] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const pageSize = 5;

  const router = useRouter();
  const datePickerRef = useRef();

  const [dateRange, setDateRange] = useState([
    { startDate: null, endDate: null, key: 'selection' }
  ]);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const paginatedRows = flattenedRows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Fetch user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Failed to get user:", error.message);
        return;
      }
      setUser(user);
    };
    getUser();
  }, []);

  // Fetch products when user or filters change
  useEffect(() => {
    if (user) fetchItems();
  }, [user, searchTerm, currentPage, dateRange]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setShowDatePicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleClickOutsideMenu = (event) => {
      if (!event.target.closest('.menu-button') && !event.target.closest('.menu-popup')) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutsideMenu);
    return () => document.removeEventListener('mousedown', handleClickOutsideMenu);
  }, []);

  useEffect(() => {
    setCurrentPage(1); // Reset page when search changes
  }, [searchTerm]);

  // Fetch items from Supabase
  async function fetchItems() {
    if (!user) return;
    try {
      setError(null);
      setLoading(true);

      let query = supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .order('product_id', { ascending: true });

      // Optional: Date filter (if applicable)
      if (dateRange[0].startDate && dateRange[0].endDate) {
        const start = format(dateRange[0].startDate, 'yyyy-MM-dd');
        const end = format(dateRange[0].endDate, 'yyyy-MM-dd');
        query = query.gte('created_at', start).lte('created_at', end); // Adjust to correct column if needed
      }

      const { data, error: supabaseError } = await query;
      if (supabaseError) throw supabaseError;

      console.log('Data received from Supabase:', data);

      const lowerSearch = searchTerm.toLowerCase();
      const filteredData = data.filter(product =>
        product.product_id.toString().includes(lowerSearch) ||
        product.product_name?.toLowerCase().includes(lowerSearch) ||
        product.product_category?.toLowerCase().includes(lowerSearch)
      );

      setFlattenedRows(filteredData);
    } catch (err) {
      setError(err.message);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleNextPage = () => {
    setCurrentPage(prev => prev + 1);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const menuItems = [
    { icon: <FaChartBar size={24} />, label: "Dashboard", href: "/dashboard" },
    { icon: <MdOutlineInventory2 size={24} />, label: "In Stocks", href: "/instock" },
    { icon: <FaBoxOpen size={24} />, label: "Products", href: "/product", active: true },
    { icon: <FaClipboardList size={24} />, label: "Orders", href: "/order" },
    { icon: <FaTruck size={24} />, label: "Suppliers", href: "/supplier" },
    { icon: <FaClipboardCheck size={24} />, label: "Stock Opname", href: "/historyopname" },
    { icon: <FaUser size={24} />, label: "Account Management", href: "/accountmanagement" },
  ];

  return (
    <div className="flex flex-col h-screen bg-[#F5F6FA] text-black font-[Poppins]">
      {/* Top Navbar */}
      <div className="flex justify-between items-center px-6 py-4 bg-white border-b">
        <div className="flex items-center gap-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}>
            <FiMenu size={24} />
          </button>
          <h1 className="text-xl font-semibold"><span>E-</span>Inventoria</h1>
        </div>
        
        <div className="flex items-center gap-6">
          <FiBell size={20} />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-300 rounded-full" />
            <span>Admin ▾</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Sidebar */}
        {sidebarOpen && (
          <div className="bg-[#12232E] text-white w-[80px] flex flex-col items-center pt-4">
            <div className="flex flex-col items-center space-y-6 mt-6">
              {menuItems.map((item, index) => (
                <Link href={item.href} key={index}>
                  <div
                    className={`flex flex-col items-center text-xs cursor-pointer px-2 py-3 rounded-lg ${item.active ? "bg-[#203340]" : "hover:bg-[#203340]"}`}
                  >
                    {item.icon}
                    <span className="mt-1 text-[10px] text-white text-center">{item.label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col bg-white p-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-2xl font-semibold">Products</h2>
            <Link href="/addproduct">
              <button className="bg-[#1E88E5] text-white px-4 py-2 rounded-lg hover:bg-sky-700">
                + Add Product
              </button>
            </Link>
          </div>

          <div className="mb-4 border-b" />

          <div className="mb-6">
            <div className="relative w-[592px]">
              <input
                type="text"
                placeholder="Search by Product ID, Item, or Category"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-4 pr-10 py-2 bg-gray-100 rounded-full w-full text-black"
              />
              <FiSearch className="absolute right-3 top-2.5 text-gray-400" size={20} />
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div>Loading...</div>
          ) : error ? (
            <div className="text-red-500">{error}</div>
          ) : (
            <div className="bg-white rounded-lg overflow-visible">
              <table className="w-full border border-gray-300">
                <thead>
                  <tr className="border-b text-center text-sm font-medium">
                    <th className="p-4">Product ID</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Items</th>
                    <th className="p-4">Purchase Price</th>
                    <th className="p-4">Sale Price</th>
                    <th className="p-4">Quantity</th>
                    <th className="p-4">Stockout</th>
                    <th className="p-4">Overstock</th>
                    <th className="p-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.map(row => (
                    <tr key={row.product_id} className="text-center hover:bg-gray-50">
                      <td className="p-4">{row.product_id}</td>
                      <td className="p-4">{row.product_category}</td>
                      <td className="p-4">{row.product_name}</td>
                      <td className="p-4">{row.purchase_price}</td>
                      <td className="p-4">{row.sale_price}</td>
                      <td className="p-4">{row.product_quantity}</td>
                      <td className="p-4">{row.product_stockout}</td>
                      <td className="p-4">{row.product_overstock}</td>
                      <td className="p-4 relative">
                        <button
                          onClick={() =>
                            setOpenMenuId(openMenuId === row.product_id ? null : row.product_id)
                          }
                          className="menu-button p-2 rounded-full hover:bg-blue-600 hover:text-white"
                        >
                          <FiMoreVertical size={20} />
                        </button>
                        {openMenuId === row.product_id && (
                          <div className="menu-popup absolute right-0 top-full mt-2 w-28 bg-white border rounded shadow-lg z-50">
                            <Link
                              href={{
                                pathname: '/editproduct',
                                query: { ...row }
                              }}
                            >
                              <div className="px-4 py-2 hover:bg-gray-100 text-sm text-gray-700 cursor-pointer">
                                Edit
                              </div>
                            </Link>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded ${currentPage === 1 ? 'bg-gray-200 text-gray-500' : 'bg-gray-300'}`}
            >
              Previous
            </button>
            <span className="text-black font-medium">Page {currentPage}</span>
            <button
              onClick={handleNextPage}
              disabled={currentPage * pageSize >= flattenedRows.length}
              className={`px-4 py-2 rounded ${currentPage * pageSize >= flattenedRows.length ? 'bg-gray-200 text-gray-500' : 'bg-gray-300'}`}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
