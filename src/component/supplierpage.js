"use client"

import RequireAuth from './protectedroute';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { useState, useEffect, useRef, useCallback } from 'react';
import { FiMenu, FiSearch, FiMoreVertical, FiLogOut } from "react-icons/fi";
import {
  FaBoxOpen,
  FaChartBar,
  FaClipboardList,
  FaTruck,
  FaUser,
  FaClipboardCheck,
} from "react-icons/fa";
import { MdOutlineInventory2 } from "react-icons/md";
import { useRouter } from 'next/navigation';
import * as XLSX from "xlsx";

const menuItems = [
  { icon: <FaChartBar size={24} />, label: "Dashboard", href: "/dashboard" },
  { icon: <MdOutlineInventory2 size={24} />, label: "In Stocks", href: "/instock" },
  { icon: <FaBoxOpen size={24} />, label: "Products", href: "/product" },
  { icon: <FaClipboardList size={24} />, label: "Orders", href: "/order" },
  { icon: <FaTruck size={24} />, label: "Suppliers", href: "/supplier", active: true },
  { icon: <FaClipboardCheck size={24} />, label: "Stock Opname", href: "/historyopname" },
];

export default function SupplierPage() {
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
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef();
  const menuRef = useRef();

  // fetchItems must be defined before useEffect and useCallback must have dependencies
  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('user_id', user.id)
        .order('supplier_id', { ascending: true });

      if (error) throw error;

      const lowerSearch = searchTerm.toLowerCase();
      const filtered = data.filter(supplier =>
        supplier.supplier_id.toString().includes(lowerSearch) ||
        supplier.supplier_name?.toLowerCase().includes(lowerSearch) ||
        supplier.supplier_address?.toLowerCase().includes(lowerSearch) ||
        supplier.supplier_phone?.toLowerCase().includes(lowerSearch)
      );
      setFlattenedRows(filtered);
      setCurrentPage(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, searchTerm]);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!error) setUser(user);
      else router.replace("/unauthorized");
    };
    getUser();
  }, [router]);

  useEffect(() => {
    if (user) fetchItems();
  }, [user, searchTerm, fetchItems]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (openMenuId && menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDropdown, openMenuId]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_role");
    router.push("/login");
  };

  const paginatedRows = flattenedRows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleExport = () => {
    if (!flattenedRows.length) {
      alert("No data to export!");
      return;
    }
    const exportData = flattenedRows.map(row => ({
      "Supplier ID": row.supplier_id,
      "Name": row.supplier_name,
      "Address": row.supplier_address,
      "Phone Number": row.supplier_phone,
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Suppliers");
    XLSX.writeFile(workbook, "suppliers.xlsx");
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
                {menuItems.map((item, idx) => (
                  <Link href={item.href} key={idx}>
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
              <h2 className="text-xl font-semibold">Suppliers</h2>
              <div className="flex gap-2">
                <button
                  onClick={handleExport}
                  className="bg-[#28A745] text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  Export
                </button>
                <Link href="/addsupplier">
                  <button className="bg-[#1E88E5] text-white px-4 py-2 rounded-lg hover:bg-sky-700">
                    + Add Supplier
                  </button>
                </Link>
              </div>
            </div>

            <div className="mb-4 border-b" />
            <div className="mb-6">
              <div className="relative w-[592px]">
                <input
                  type="text"
                  placeholder="Search by Supplier ID, Name, or Phone number"
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
                      <th className="p-4">Supplier ID</th>
                      <th className="p-4">Name</th>
                      <th className="p-4">Address</th>
                      <th className="p-4">Phone Number</th>
                      <th className="p-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRows.map(row => (
                      <tr key={row.supplier_id} className="text-center hover:bg-gray-50">
                        <td className="p-4">{row.supplier_id}</td>
                        <td className="p-4">{row.supplier_name}</td>
                        <td className="p-4">{row.supplier_address}</td>
                        <td className="p-4">{row.supplier_phone}</td>
                        <td className="p-4 relative">
                          <button
                            onClick={() =>
                              setOpenMenuId(openMenuId === row.supplier_id ? null : row.supplier_id)
                            }
                            className="menu-button p-2 rounded-full hover:bg-blue-600 hover:text-white"
                          >
                            <FiMoreVertical size={20} />
                          </button>
                          {openMenuId === row.supplier_id && (
                            <div
                              ref={menuRef}
                              className="menu-popup absolute right-0 top-full mt-2 w-28 bg-white border rounded shadow-lg z-50"
                            >
                              <Link
                                href={{
                                  pathname: '/editsupplier',
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
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded ${currentPage === 1 ? 'bg-gray-200 text-gray-500' : 'bg-gray-300'}`}
              >
                Previous
              </button>
              <span className="text-black font-medium">Page {currentPage}</span>
              <button
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={currentPage * pageSize >= flattenedRows.length}
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