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
  { icon: <MdOutlineInventory2 size={24} />, label: "In Stocks", href: "/instock", active: true },
  { icon: <FaBoxOpen size={24} />, label: "Products", href: "/product" },
  { icon: <FaClipboardList size={24} />, label: "Orders", href: "/order" },
  { icon: <FaTruck size={24} />, label: "Suppliers", href: "/supplier" },
  { icon: <FaClipboardCheck size={24} />, label: "Stock Opname", href: "/historyopname" },
];

export default function StockPage() {
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
  const [statusFilter, setStatusFilter] = useState('');
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

  // Fetch products when user or filters change
  useEffect(() => {
    if (user) fetchItems();
    // eslint-disable-next-line
  }, [user, searchTerm, statusFilter, startDate, endDate]);

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

  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter, startDate, endDate]);

  async function fetchItems() {
    if (!user) return;
    try {
      setError(null);
      setLoading(true);

      const { data, error: supabaseError } = await supabase
        .from('instock_product')
        .select(`
          instock_product_id,
          product_quantity,
          instocks (
            instock_id,
            instock_date,
            instock_status,
            user_id,
            suppliers (
              supplier_id,
              supplier_name
            )
          ),
          products (
            product_id,
            product_name,
            product_category
          )
        `)
        .order('instock_product_id', { ascending: true });

      if (supabaseError) throw supabaseError;

      let filtered = (data || []).filter(item => item.instocks?.user_id === user.id);

      // Status filter
      if (statusFilter) {
        filtered = filtered.filter(item =>
          item.instocks?.instock_status?.toLowerCase() === statusFilter.toLowerCase()
        );
      }

      // Date filter
      if (startDate && endDate) {
        const start = new Date(format(startDate, "yyyy-MM-dd"));
        const end = addDays(new Date(format(endDate, "yyyy-MM-dd")), 1);
        filtered = filtered.filter(item => {
          const instockDate = item.instocks?.instock_date
            ? new Date(format(parseISO(item.instocks.instock_date), "yyyy-MM-dd"))
            : null;
          return instockDate && instockDate >= start && instockDate < end;
        });
      }

      // Search filter
      if (searchTerm.trim()) {
        const search = searchTerm.toLowerCase();
        filtered = filtered.filter(item =>
          item.instocks?.instock_id?.toString().includes(search) ||
          item.products?.product_name?.toLowerCase().includes(search) ||
          item.products?.product_category?.toLowerCase().includes(search)
        );
      }

      const flattened = filtered.map(item => ({
        instock_product_id: item.instock_product_id,
        instock_id: item.instocks?.instock_id,
        instock_date: item.instocks?.instock_date,
        supplier_name: item.instocks?.suppliers?.supplier_name,
        instock_status: item.instocks?.instock_status,
        product_quantity: item.product_quantity,
        product_name: item.products?.product_name,
        product_category: item.products?.product_category,
      }));

      setFlattenedRows(flattened.sort((a, b) => b.instock_id - a.instock_id));
    } catch (err) {
      setError('Failed to load instocks');
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
      "InStock ID": row.instock_id,
      "Created At": row.instock_date ? format(new Date(row.instock_date), 'dd/MM/yyyy') : "",
      "Category": row.product_category,
      "Item": row.product_name,
      "Supplier": row.supplier_name,
      "Quantity": row.product_quantity,
      "Status": row.instock_status,
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Instocks");
    XLSX.writeFile(workbook, "instocks.xlsx");
  };

  if (user === undefined) return null;

  return (
    <RequireAuth>
      <div className="flex flex-col h-screen bg-[#F5F6FA] text-black font-[Poppins]">
        {/* Fixed Top Navbar */}
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
          {/* Fixed Sidebar */}
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
              <h2 className="text-xl font-semibold">Instocks</h2>
              <div className="flex gap-2">
                <button
                  onClick={handleExport}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  Export
                </button>
                <Link href="/addstock">
                  <button className="bg-[#1E88E5] text-white px-4 py-2 rounded-lg hover:bg-sky-700">
                    + Add Instock
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
                  placeholder="Search by inStock ID, Item, or Category"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-4 pr-10 py-2 bg-gray-100 rounded-full w-full h-[40px] text-black"
                />
                <FiSearch className="absolute right-3 top-2.5 text-gray-400" size={20} />
              </div>

              {/* Right-side filters */}
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
                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="px-4 h-[44px] border rounded-md text-black"
                >
                  <option value="">Status</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                </select>
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
                      <th className="p-4">InStock ID</th>
                      <th className="p-4">Created At</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Item</th>
                      <th className="p-4">Supplier</th>
                      <th className="p-4">Quantity</th>
                      <th className="p-4">Status</th>
                      <th className="p-4"></th>
                    </tr>
                  </thead>
                  <tbody className="relative text-center overflow-visible">
                    {paginatedRows.map((row, index) => (
                      <tr key={index}>
                        <td className="p-4">{row.instock_id}</td>
                        <td className="p-4">{row.instock_date ? format(new Date(row.instock_date), 'dd/MM/yyyy') : ""}</td>
                        <td className="p-4">{row.product_category}</td>
                        <td className="p-4">{row.product_name}</td>
                        <td className="p-4">{row.supplier_name}</td>
                        <td className="p-4">{row.product_quantity}</td>
                        <td className="p-4">{row.instock_status}</td>
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
                                    `/editstock?instock_id=${row.instock_id}&instock_product_id=${row.instock_product_id}`
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