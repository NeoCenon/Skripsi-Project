"use client"

import Link from 'next/link';
import { supabase } from '../lib/supabase'
import { useState, useEffect } from 'react'
import { FiMenu, FiSearch, FiBell, FiChevronDown, FiCalendar } from "react-icons/fi";
import {
  FaBoxOpen,
  FaChartBar,
  FaClipboardList,
  FaTruck,
  FaUser,
} from "react-icons/fa";
import { MdOutlineInventory2 } from "react-icons/md";
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css'; 
import 'react-date-range/dist/theme/default.css';
import { format } from 'date-fns';
import { useRef } from 'react';

export default function SupplierPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null);

  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const [searchTerm, setSearchTerm] = useState('');

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
  }, [currentPage, searchTerm, dateRange])

  async function fetchItems() {

    try {
      setError(null);
      setLoading(true);

      let { data, error: supabaseError } = await supabase
      .from('suppliers')
      .select('supplier_id, supplier_name, supplier_address, supplier_phone');

      if (supabaseError) throw supabaseError;

    

      // Apply search filter on the client side
    const lowerSearch = searchTerm.toLowerCase();
    const filteredData = data.filter(supplier =>
      supplier.supplier_id.toString().includes(lowerSearch) ||
      supplier.supplier_name?.toLowerCase().includes(lowerSearch) ||
      supplier.supplier_address?.toLowerCase().includes(lowerSearch) ||
      supplier.supplier_phone?.toLowerCase().includes(lowerSearch)
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

    const totalDisplayedRows = items.reduce((acc, order) => acc + order.order_product.length, 0);

    const menuItems = [
      { icon: <FaChartBar size={24} />, label: "Dashboard", href:"/dashboard" },
      { icon: <MdOutlineInventory2 size={24} />, label: "In Stocks", href:"/instock" },
      { icon: <FaBoxOpen size={24} />, label: "Products", href:"/product"},
      { icon: <FaClipboardList size={24} />, label: "Orders", href:"/order" },
      { icon: <FaTruck size={24} />, label: "Suppliers", href:"/supplier", active: true },
      { icon: <FaUser size={24} />, label: "Account Management", href:"/accountmanagement" },
      ];

  // Add new item
  async function addItem(newItem) {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .insert([newItem])
        .select()
      
      if (error) throw error
      setItems([...items, ...data])
    } catch (error) {
      console.error('Error adding item:', error)
    }
  }

  return (
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
              <h2 className="text-2xl font-semibold text-black">Suppliers</h2>
              <Link href="/addsupplier">
              <button className="bg-[#1E88E5] text-white px-4 py-2 rounded-lg font-medium text-[16px] hover:bg-sky-700">
                + Add Supplier
              </button>
              </Link>
             
            </div>

            <div className="border-b mb-4"></div>

            {/* Search & Filter */}
            <div className="flex justify-between items-center mb-6">
              <div className="relative w-[592px]">
                <input
                  type="text"
                  placeholder="Search by Supplier ID, Name, or Phone number"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-4 pr-10 py-2 bg-gray-100 rounded-full w-full h-[40px] text-black"
                />
                <FiSearch className="absolute right-3 top-2.5 text-gray-400" size={20} />
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg overflow-hidden mt-6">
              <table className="w-full border-[2px] border-gray-300 font-[Poppins]">
                <thead>
                  <tr className="border-b-[2px] text-[16px] font-normal text-center">
                  <th className="p-4">Supplier ID</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Address</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4"></th>
                </tr>
                </thead>

                <tbody>
                  {paginatedRows.map((row, index) => (
                    <tr key={row.supplier_id} className="border-b-[2px] hover:bg-gray-50 text-[16px] text-center">
                        <td className="p-4">{row.supplier_id}</td>
                        <td className="p-4">{row.supplier_name}</td>
                        <td className="p-4">{row.supplier_address}</td>
                        <td className="p-4">{row.supplier_phone}</td>
                        <td className="p-4"><button className="h-[32px]">:</button></td>
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
  );
}
