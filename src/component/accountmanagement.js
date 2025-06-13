"use client"

import RequireAuth from './protectedroute';
import Link from 'next/link';
import { supabase } from '../lib/supabase'
import { useState, useEffect } from 'react'
import { FiMenu, FiSearch, FiBell, FiChevronDown, FiCalendar, FiMoreVertical } from "react-icons/fi";
import {
  FaBoxOpen,
  FaChartBar,
  FaClipboardList,
  FaTruck,
  FaUser,
  FaClipboardCheck,
} from "react-icons/fa";
import { MdOutlineInventory2 } from "react-icons/md";
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css'; 
import 'react-date-range/dist/theme/default.css';
import { format } from 'date-fns';
import { useRef } from 'react';
import { useRouter } from 'next/navigation'

export default function AccountManagementPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const [searchTerm, setSearchTerm] = useState('');
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
  const [flattenedRows, setFlattenedRows] = useState([]);
  const paginatedRows = flattenedRows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const router = useRouter()

  useEffect(() => {
    const role = localStorage.getItem('user_role')
    if (role !== 'admin' && role !== 'owner') {
      router.push('/unauthorized')
    }
  }, [])


  useEffect(() => {
    function handleClickOutside(event) {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setShowDatePicker(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch inventory items
  useEffect(() => {
    fetchItems()
  }, [currentPage, searchTerm, statusFilter, dateRange])

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);
  
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [dateRange]);

  async function fetchItems() {

    try {
      setError(null);
      setLoading(true);

      let query = supabase
        .from('users')
        .select('*')
        .order('user_id', { ascending: true });

      if (statusFilter) {
        query = query.ilike('user_role', statusFilter.toLowerCase());
      }

      if (dateRange[0].startDate && dateRange[0].endDate) {
        const start = format(dateRange[0].startDate, 'yyyy-MM-dd');
        const end = format(dateRange[0].endDate, 'yyyy-MM-dd');
        query = query.gte('created_at', start).lte('created_at', end);
      }

      const { data, error: supabaseError } = await query;
      if (supabaseError) throw supabaseError;

      // Apply search filter on the client side
      const lowerSearch = searchTerm.toLowerCase();
      const filteredData = data.filter(user =>
        user.user_id.toString().includes(lowerSearch) ||
        user.user_name?.toLowerCase().includes(lowerSearch) ||
        user.user_email?.toLowerCase().includes(lowerSearch) ||
        user.user_password?.toLowerCase().includes(lowerSearch) ||
        user.user_role?.toLowerCase().includes(lowerSearch) ||
        user.created_at?.toISOString() 
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
      setCurrentPage(prevPage => prevPage + 1);
    };

    const handlePreviousPage = () => {
      if (currentPage > 1) {
        setCurrentPage(prevPage => prevPage - 1);
      }
    };

    // const totalDisplayedRows = items.reduce((acc, order) => acc + order.order_product.length, 0);

    const menuItems = [
      { icon: <FaChartBar size={24} />, label: "Dashboard", href:"/dashboard" },
      { icon: <MdOutlineInventory2 size={24} />, label: "In Stocks", href:"/instock" },
      { icon: <FaBoxOpen size={24} />, label: "Products", href:"/product"},
      { icon: <FaClipboardList size={24} />, label: "Orders", href:"/order" },
      { icon: <FaTruck size={24} />, label: "Suppliers", href:"/supplier" },
      { icon: <FaClipboardCheck size={24} />, label: "Stock Opname", href:"/historyopname" },
      { icon: <FaUser size={24} />, label: "Account Management", href:"/accountmanagement", active: true },
      ];

  // Add new item
  async function addItem(newItem) {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([newItem])
        .select()
      
      if (error) throw error
      setItems([...items, ...data])
    } catch (error) {
      console.error('Error adding item:', error)
    }
  }

  return (
    <RequireAuth>
    <div className="flex flex-col h-screen bg-[#F5F6FA] text-black font-[Poppins]">
      {/* Top Navbar */}
      <div className="flex justify-between items-center px-6 py-4 bg-white border-b">
        <div className="flex items-center gap-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}>
            <FiMenu size={24} className="text-black" />
          </button>
          <h1 className="text-xl font-semibold text-black">
            <span className="text-black">E-</span>Inventoria
          </h1>
        </div>

        <div className="flex items-center gap-6">
          <FiBell size={20} className="text-black" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
            <span className="text-black">Admin ▾</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Sidebar */}
        {sidebarOpen && (
          <div className="bg-[#12232E] text-white w-[80px] flex flex-col items-center pt-6">
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
          <div className="p-6">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-2xl font-semibold text-black">Accounts</h2>
              <Link href="/addaccount">
              <button className="bg-[#1E88E5] text-white px-4 py-2 rounded-lg font-medium text-[16px] hover:bg-sky-700">
                + Add Account
              </button>
              </Link>
             
            </div>

            <div className="border-b mb-4"></div>

            {/* Search & Filter */}
            <div className="flex justify-between items-center mb-6">
              <div className="relative w-[592px]">
                <input
                  type="text"
                  placeholder="Search by User ID, Name, or Email"
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
                    <option value="">Role</option>
                    <option value="owner">Owner</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg mt-6" style={{ overflow: 'visible' }}>
              <table className="w-full border-[2px] border-gray-300 font-[Poppins]">
                <thead>
                  <tr className="border-b-[2px] text-[16px] font-normal text-center">
                  <th className="p-4">User ID</th>
                  <th className="p-4">Username</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Created At</th>
                  <th className="p-4"></th>
                </tr>
                </thead>

                <tbody>
                  {paginatedRows.map((row, index) => (
                    <tr key={row.user_id} className="border-b-[2px] hover:bg-gray-50 text-[16px] text-center ">
                      <td className="p-4">{row.user_id}</td>
                      <td className="p-4">{row.user_name}</td>
                      <td className="p-4">{row.user_email}</td>
                      <td className="p-4">{row.user_role}</td>
                      <td className="p-4">{row.created_at}</td>
                      <td className="p-4 relative">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === row.user_id ? null : row.user_id)}
                          className="menu-button p-2 rounded-full hover:bg-blue-600 hover:text-white transition duration-150 ease-in-out"
                        >
                          <FiMoreVertical size={20} />
                        </button>

                        {openMenuId === row.user_id && (
                          <div
                            className="menu-popup absolute right-0 top-full mt-2 w-28 bg-white border border-gray-200 rounded shadow-lg z-50"
                            onClick={(e) => e.stopPropagation()} 
                          >
                            <Link
                              href={{
                                pathname: '/editaccount',
                                query: {
                                  user_id: row.user_id,
                                  user_name: row.user_name,
                                  user_email: row.user_email,
                                  user_password: row.user_password,
                                  user_role: row.user_role,
                                }
                              }}
                              passHref
                            >
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                                className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-700 cursor-pointer"
                              >
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
    </RequireAuth>
  );
}
