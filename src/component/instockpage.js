"use client"

import Link from 'next/link';
import { supabase } from '../lib/supabase'
import { useState, useEffect } from 'react'
import { FiMenu, FiSearch, FiBell, FiCalendar, FiMoreVertical } from "react-icons/fi";
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
import { format } from 'date-fns';
import { useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function StockPage() {
  const [items, setItems] = useState([])
  const [flattenedRows, setFlattenedRows] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null);
  const [openMenuIndex, setOpenMenuIndex] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const pageSize = 5;
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('');
  const [dateRange, setDateRange] = useState([
    {
      startDate: null,
      endDate: null,
      key: 'selection'
    }
  ]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePickerRef = useRef();

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
  console.log('Fetched user:', user);

  // Fetch products when user or filters change
  useEffect(() => {
    if (user) fetchItems();
  }, [user, searchTerm, statusFilter, currentPage, dateRange]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setShowDatePicker(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
      const handleClickOutsideMenu = (event) => {
        if (!event.target.closest('.menu-button') && !event.target.closest('.menu-popup')) {
          setOpenMenuIndex(null);
        }
      };
      document.addEventListener('mousedown', handleClickOutsideMenu);
      return () => document.removeEventListener('mousedown', handleClickOutsideMenu);
  }, []);

  useEffect(() => { setCurrentPage(1); }, [searchTerm]);
  useEffect(() => { setCurrentPage(1); }, [statusFilter]);
  useEffect(() => { setCurrentPage(1); }, [dateRange]);

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
      console.log(data, error);

      if (supabaseError){
          console.error("Supabase fetch error:", supabaseError);
          throw supabaseError;
        } 

      const filteredData = (data || []).filter(item => item.instocks?.user_id === user.id);

      // let filteredRows = filteredData;
      const userInstocks = (data || []).filter(item => item.instocks?.user_id === user.id);
      let filtered = userInstocks;
      console.log("Filtered instocks after all filters:", filtered);

      // Status filter
      if (statusFilter) {
        filtered = filtered.filter(item =>
          item.instocks?.instock_status?.toLowerCase() === statusFilter.toLowerCase()
        );
      }

      // Apply date filter
      if (dateRange[0].startDate && dateRange[0].endDate) {
        const start = new Date(dateRange[0].startDate);
        const end = new Date(dateRange[0].endDate);
        filtered = filtered.filter(item => {
          const instockDate = new Date(item.instocks?.instock_date);
          return instockDate >= start && instockDate <= end;
        });
      }

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

      const sorted = flattened.sort((a, b) => b.instock_id - a.instock_id);
      
      setFlattenedRows(sorted);
      setItems(filtered);

      } catch (err) {
        console.error('Error fetching instocks:', err.message);
        setError('Failed to load instocks');
      } finally {
        setLoading(false);
      }
    }

    const handleNextPage = () => {
      setCurrentPage(prevPage => prevPage + 1);
    };

    const handlePreviousPage = () => {
      if (currentPage > 1) {
        setCurrentPage(prevPage => prevPage - 1);
      }
    };

    const totalDisplayedRows = flattenedRows.length;

    const menuItems = [
      { icon: <FaChartBar size={24} />, label: "Dashboard", href:"/dashboard" },
      { icon: <MdOutlineInventory2 size={24} />, label: "In Stocks", href:"/instock", active : true },
      { icon: <FaBoxOpen size={24} />, label: "Products", href:"/product"},
      { icon: <FaClipboardList size={24} />, label: "Orders", href:"/order" },
      { icon: <FaTruck size={24} />, label: "Suppliers", href:"/supplier" },
      { icon: <FaClipboardCheck size={24} />, label: "Stock Opname", href:"/historyopname" },
      { icon: <FaUser size={24} />, label: "Account Management", href:"/accountmanagement" },
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
            <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
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
                  key={index}
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
        <div className="flex-1 flex flex-col bg-white"> 

          {/* Content */}
          <div className="flex-1 flex flex-col bg-white p-6">
            <div className="flex justify-between items-center mb-2">
            <h2 className="text-2xl font-semibold">Instocks</h2>
              <Link href="/addstock">
              <button className="bg-[#1E88E5] text-white px-4 py-2 rounded-lg hover:bg-sky-700">
                + Add Instock
              </button>
              </Link>
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
                  {dateRange[0].startDate && dateRange[0].endDate
                    ? `${format(dateRange[0].startDate, 'dd/MM/yyyy')} - ${format(dateRange[0].endDate, 'dd/MM/yyyy')}`
                    : 'Select Date Range'}
                </button>

                {/* Clear Button - positioned absolutely */}
                {dateRange[0].startDate && dateRange[0].endDate && (
                  <button
                    onClick={() =>
                      setDateRange([{
                        startDate: null,
                        endDate: null,
                        key: 'selection'
                      }])
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
                        <td className="p-4">{format(new Date(row.instock_date), 'dd/MM/yyyy')}</td>
                        <td className="p-4">{row.product_category}</td>
                        <td className="p-4">{row.product_name}</td>
                        <td className="p-4">{row.supplier_name}</td>
                        <td className="p-4">{row.product_quantity}</td>
                        <td className="p-4">{row.instock_status}</td>
                        <td className="p-4 relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent document click handler from firing
                              setOpenMenuIndex(openMenuIndex === index ? null : index);
                            }}
                            className="menu-button p-2 rounded-full hover:bg-blue-600 hover:text-white"
                          >
                            <FiMoreVertical size={20} />
                          </button>
  
                          {openMenuIndex === index && (
                            <div
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
    </div>
  );
}
