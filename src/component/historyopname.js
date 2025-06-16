"use client"

import RequireAuth from './protectedroute';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { useState, useEffect, useRef } from 'react';
import { FiMenu, FiSearch, FiCalendar, FiMoreVertical, FiLogOut } from "react-icons/fi";
import {
  FaBoxOpen,
  FaChartBar,
  FaClipboardList,
  FaUser,
  FaTruck,
  FaClipboardCheck,
} from "react-icons/fa";
import { MdOutlineInventory2 } from "react-icons/md";
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { format, parseISO, addDays } from 'date-fns';
import { useRouter } from 'next/navigation';
import * as XLSX from "xlsx";

const menuItems = [
  { icon: <FaChartBar size={24} />, label: "Dashboard", href: "/dashboard" },
  { icon: <MdOutlineInventory2 size={24} />, label: "In Stocks", href: "/instock" },
  { icon: <FaBoxOpen size={24} />, label: "Products", href: "/product" },
  { icon: <FaClipboardList size={24} />, label: "Orders", href: "/order" },
  { icon: <FaTruck size={24} />, label: "Suppliers", href: "/supplier" },
  { icon: <FaClipboardCheck size={24} />, label: "Stock Opname", href: "/historyopname", active: true },
];

export default function HistoryOpnamePage() {
  const [flattenedRows, setFlattenedRows] = useState([]);
  const [user, setUser] = useState(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openMenuIndex, setOpenMenuIndex] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const pageSize = 5;
  const router = useRouter();
  const [dateRange, setDateRange] = useState([
    { startDate: null, endDate: null, key: 'selection' }
  ]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const datePickerRef = useRef();
  const dropdownRef = useRef();
  const menuRef = useRef();

  const paginatedRows = flattenedRows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const startDate = dateRange[0].startDate;
  const endDate = dateRange[0].endDate;

  // Fetch user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!error && user) setUser(user);
      else router.replace("/unauthorized");
    };
    getUser();
  }, []);

  // Fetch opnames when user or filters change
  useEffect(() => {
    if (user) fetchItems();
    // eslint-disable-next-line
  }, [user, searchTerm, startDate, endDate]);

  // Handle click outside for dropdown, datepicker, and edit menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (showDatePicker && datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setShowDatePicker(false);
      }
      if (openMenuIndex !== null && menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuIndex(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDropdown, showDatePicker, openMenuIndex]);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, startDate, endDate]);

  async function fetchItems() {
    if (!user) return;
    try {
      setError(null);
      setLoading(true);

      const { data, error: supabaseError } = await supabase
        .from('opname_product')
        .select(`
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
            product_category,
            product_quantity
          )
        `)
        .order('opname_product_id', { ascending: false });

      if (supabaseError) throw supabaseError;

      let filtered = (data || []).filter(item => item.opnames?.user_id === user.id);

      // Date filter
      if (startDate && endDate) {
        const start = new Date(format(startDate, "yyyy-MM-dd"));
        const end = addDays(new Date(format(endDate, "yyyy-MM-dd")), 1);
        filtered = filtered.filter(item => {
          const opnameDate = item.opnames?.opname_date
            ? new Date(format(parseISO(item.opnames.opname_date), "yyyy-MM-dd"))
            : null;
          return opnameDate && opnameDate >= start && opnameDate < end;
        });
      }

      // Search filter
      if (searchTerm.trim()) {
        const search = searchTerm.toLowerCase();
        filtered = filtered.filter(item =>
          item.opnames?.opname_id?.toString().includes(search) ||
          item.products?.product_name?.toLowerCase().includes(search) ||
          item.products?.product_category?.toLowerCase().includes(search)
        );
      }

      const flattened = filtered.map(item => ({
        opname_product_id: item.opname_product_id,
        opname_id: item.opnames?.opname_id,
        opname_date: item.opnames?.opname_date,
        product_quantity: item.products?.product_quantity,
        product_name: item.products?.product_name,
        product_category: item.products?.product_category,
        real_stock: item.real_stock,
        stock_difference: item.stock_difference,
      }));

      setFlattenedRows(flattened.sort((a, b) => b.opname_id - a.opname_id));
    } catch (err) {
      setError('Failed to load opnames');
    } finally {
      setLoading(false);
    }
  }

  const handleNextPage = () => setCurrentPage(prevPage => prevPage + 1);
  const handlePreviousPage = () => setCurrentPage(prevPage => Math.max(1, prevPage - 1));

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_role");
    router.push("/login");
  };

  // Export to Excel function
  const handleExport = () => {
    if (!flattenedRows.length) {
      alert("No data to export!");
      return;
    }
    const exportData = flattenedRows.map(row => ({
      "Opname ID": row.opname_id,
      "Created At": row.opname_date ? format(new Date(row.opname_date), 'dd/MM/yyyy') : "",
      "Category": row.product_category,
      "Items": row.product_name,
      "Available Stock": row.product_quantity,
      "Real Stock": row.real_stock,
      "Stock Difference": row.stock_difference,
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Opnames");
    XLSX.writeFile(workbook, "opnames.xlsx");
  };

  if (user === undefined) return null;

  return (
    <RequireAuth>
      <div className="flex flex-col h-screen bg-[#F5F6FA] text-black font-[Poppins]">
        {/* Top Navbar */}
        <div className="fixed top-0 left-0 right-0 z-30 flex justify-between items-center px-6 py-4 bg-white border-b w-full">
          <div className="flex items-center">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className='menu-button p-2 hover:bg-sky-700 rounded-full hover:text-white'>
              <FiMenu size={24} />
            </button>
            <div style={{ width: 32 }} />
            <h1 className="text-2xl font-semibold text-[#5E35B1]">E-Inventoria</h1>
          </div>
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 px-3 py-1 rounded hover:bg-gray-300"
            >
              <FaUser size={20} />
              <span>{user?.email || "User"} ▾</span>
            </button>
            {showDropdown && (
              <div
                className="absolute right-0 mt-2 w-32 bg-white border rounded shadow z-50"
              >
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-200 text-red-500 flex items-center gap-2"
                >
                  <FiLogOut size={18} />
                  Log Out
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-1">
          {/* Sidebar */}
          {sidebarOpen && (
            <div className="fixed top-16 left-0 z-20 bg-[#12232E] text-white w-[80px] flex flex-col items-center pt-4 h-[calc(100vh-4rem)]">
              <div className="flex flex-col items-center space-y-6 mt-6">
                {menuItems.map((item, index) => (
                  <Link href={item.href} key={index}>
                    <div
                      className={`flex flex-col items-center text-xs cursor-pointer px-2 py-3 rounded-lg ${
                        item.active ? "bg-[#203340]" : "hover:bg-[#203340]"
                      }`}
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
          <div className={`flex-1 flex flex-col bg-white p-6 ${sidebarOpen ? "ml-[80px]" : ""} mt-16`}>
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-semibold">Stock Opname</h2>
              <div className="flex gap-2">
                <button
                  onClick={handleExport}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  Export
                </button>
                <Link href="/addopname">
                  <button className="bg-[#1E88E5] text-white px-4 py-2 rounded-lg hover:bg-sky-700">
                    + Opname Stocks
                  </button>
                </Link>
              </div>
            </div>

            <div className="mb-4 border-b"></div>

            {/* Search & Filter */}
            <div className="flex justify-between items-center mb-6">
              <div className="relative w-[592px]">
                <input
                  type="text"
                  placeholder="Search by Opname ID, Item, or Category"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-4 pr-10 py-2 bg-gray-100 rounded-full w-full text-black"
                />
                <FiSearch className="absolute right-3 top-2.5 text-gray-400" size={20} />
              </div>

              <div className="flex gap-4 items-center">
                {/* Date Range Picker Button */}
                <div className="relative flex items-center gap-2">
                  <button
                    onClick={() => setShowDatePicker(!showDatePicker)}
                    className="flex items-center gap-2 px-4 h-[44px] border rounded-md text-black bg-white pr-10"
                  >
                    <FiCalendar />
                    {startDate && endDate
                      ? `${format(startDate, 'dd/MM/yyyy')} - ${format(endDate, 'dd/MM/yyyy')}`
                      : 'Select Date Range'}
                  </button>
                  {/* Clear Button */}
                  {startDate && endDate && (
                    <button
                      onClick={() =>
                        setDateRange([{ startDate: null, endDate: null, key: 'selection' }])
                      }
                      className="absolute right-2 text-sm text-gray-500 hover:text-red-500"
                      title="Clear Date Filter"
                      style={{ marginLeft: '-24px' }}
                    >
                      ✕
                    </button>
                  )}
                  {showDatePicker && (
                    <div
                      ref={datePickerRef}
                      className="fixed top-24 right-10 z-50 bg-white shadow-lg border rounded-md p-4"
                    >
                      <div className="flex justify-end">
                        <button
                          onClick={() => setShowDatePicker(false)}
                          className="text-gray-500 hover:text-red-500 text-sm font-bold"
                        >
                          ✕
                        </button>
                      </div>
                      <DateRange
                        editableDateInputs={true}
                        onChange={item => setDateRange([item.selection])}
                        moveRangeOnFirstSelection={false}
                        ranges={dateRange}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Table */}
            {loading ? (
              <div>Loading...</div>
            ) : error ? (
              <div className="text-red-500">{error}</div>
            ) : (
              <div className="bg-white rounded-lg overflow-visible mt-6 relative">
                <table className="w-full border border-gray-300">
                  <thead>
                    <tr className="border-b text-center text-sm font-medium">
                      <th className="p-4">Opname ID</th>
                      <th className="p-4">Created At</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Items</th>
                      <th className="p-4">Available Stock</th>
                      <th className="p-4">Real Stock</th>
                      <th className="p-4">Stock Difference</th>
                      <th className="p-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRows.map((row, index) => (
                      <tr key={index} className='text-center hover:bg-gray-100 cursor-pointer'>
                        <td className="p-4">{row.opname_id}</td>
                        <td className="px-4 py-2">{row.opname_date ? format(new Date(row.opname_date), 'dd/MM/yyyy') : ""}</td>
                        <td className="p-4">{row.product_category}</td>
                        <td className="p-4">{row.product_name}</td>
                        <td className="p-4">{row.product_quantity}</td>
                        <td className="p-4">{row.real_stock}</td>
                        <td className="p-4">{row.stock_difference}</td>
                        <td className="p-4 relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuIndex(openMenuIndex === index ? null : index);
                            }}
                            className="menu-button p-2 rounded-full hover:bg-blue-600 hover:text-white"
                          >
                            <FiMoreVertical size={20} />
                          </button>
                          {openMenuIndex === index && (
                            <div
                              ref={menuRef}
                              className="menu-popup absolute right-0 top-full mt-2 w-28 bg-white border rounded shadow-lg z-50"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(
                                    `/editopname?opname_id=${row.opname_id}&opname_product_id=${row.opname_product_id}`
                                  );
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-700"
                              >
                                Edit
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
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
                disabled={currentPage >= Math.ceil(flattenedRows.length / pageSize)}
                className={`px-4 py-2 rounded ${currentPage * pageSize >= flattenedRows.length ? 'bg-gray-200 text-gray-500' : 'bg-gray-300'}`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}