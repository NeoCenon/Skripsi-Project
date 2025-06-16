"use client";

import Link from "next/link";
import RequireAuth from "./protectedroute";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import {
  FaBoxOpen,
  FaChartBar,
  FaClipboardList,
  FaUser,
  FaTruck,
  FaClipboardCheck,
  FaMoneyBillWave,
  FaWallet,
  FaPiggyBank,
  FaPercentage,
} from "react-icons/fa";
import { FiMenu, FiCalendar } from "react-icons/fi";
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { MdOutlineInventory2 } from "react-icons/md";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { useRouter } from "next/navigation";
import { format, parseISO, addDays } from "date-fns";

function toDateStringLocal(date) {
  return format(date, "yyyy-MM-dd");
}

const menuItems = [
  { icon: <FaChartBar size={24} />, label: "Dashboard", href: "/dashboard", active: true },
  { icon: <MdOutlineInventory2 size={24} />, label: "In Stocks", href: "/instock" },
  { icon: <FaBoxOpen size={24} />, label: "Products", href: "/product" },
  { icon: <FaClipboardList size={24} />, label: "Orders", href: "/order" },
  { icon: <FaTruck size={24} />, label: "Suppliers", href: "/supplier" },
  { icon: <FaClipboardCheck size={24} />, label: "Stock Opname", href: "/historyopname" },
];

export default function Dashboard() {
  const [revenue, setRevenue] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [income, setIncome] = useState(0);
  const [margin, setMargin] = useState(0);
  const [chartData, setChartData] = useState([]);
  const [stockAlerts, setStockAlerts] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [productFilter, setProductFilter] = useState("top");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;
  const router = useRouter();

  // Date range state for FiCalendar
  const [dateRange, setDateRange] = useState([
    { startDate: null, endDate: null, key: "selection" },
  ]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePickerRef = useRef();
  const dropdownRef = useRef();

  const startDate = dateRange[0].startDate;
  const endDate = dateRange[0].endDate;

  // Handle click outside for dropdown and datepicker
  useEffect(() => {
    function handleClickOutside(event) {
      if (showDropdown && dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (showDatePicker && datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setShowDatePicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDropdown, showDatePicker]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_role");
    router.push("/login");
  };

  const handleNextPage = () => setCurrentPage((prev) => prev + 1);
  const handlePreviousPage = () => setCurrentPage((prev) => Math.max(1, prev - 1));

  // Paginated alerts
  const paginatedAlerts = stockAlerts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!error) setUser(user);
      else router.replace("/unauthorized");
    };
    getUser();
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      let start, end;
      if (startDate && endDate) {
        start = toDateStringLocal(startDate);
        end = toDateStringLocal(addDays(endDate, 1));
      }

      // Revenue
      let orderQuery = supabase
        .from("order_product")
        .select("product_quantity, products(sale_price), orders!inner(order_date)");
      if (start && end) {
        orderQuery = orderQuery
          .gte("orders.order_date", start)
          .lt("orders.order_date", end);
      }
      const { data: revenueData } = await orderQuery;
      const totalRevenue =
        revenueData?.reduce(
          (acc, row) =>
            acc + row.product_quantity * (row.products?.sale_price || 0),
          0
        ) || 0;
      setRevenue(totalRevenue);

      // Expenses
      let instockQuery = supabase
        .from("instock_product")
        .select("product_quantity, products(purchase_price), instocks!inner(instock_date)");
      if (start && end) {
        instockQuery = instockQuery
          .gte("instocks.instock_date", start)
          .lt("instocks.instock_date", end);
      }
      const { data: expenseData } = await instockQuery;
      const totalExpenses =
        expenseData?.reduce(
          (acc, row) =>
            acc + row.product_quantity * (row.products?.purchase_price || 0),
          0
        ) || 0;
      setExpenses(totalExpenses);

      // Income & Margin
      const netIncome = totalRevenue - totalExpenses;
      const marginPercent =
        totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0;
      setIncome(netIncome);
      setMargin(marginPercent.toFixed(2));

      // Revenue Trend Chart
      let orderChartQuery = supabase
        .from("orders")
        .select("order_id, order_date, order_product(product_quantity, products(sale_price))")
        .order("order_date", { ascending: true });
      const { data: orderData } = await orderChartQuery;
      let filteredOrders = orderData;
      if (startDate && endDate) {
        filteredOrders = orderData?.filter((o) => {
          const orderDate = parseISO(o.order_date);
          return (
            orderDate >= startDate &&
            orderDate < addDays(endDate, 1)
          );
        });
      }

      const dailyMap = {};
      filteredOrders?.forEach((order) => {
        const date = format(parseISO(order.order_date), "yyyy-MM-dd");
        let orderTotal = 0;
        order.order_product?.forEach((item) => {
          orderTotal +=
            item.product_quantity * (item.products?.sale_price || 0);
        });
        if (!dailyMap[date]) dailyMap[date] = 0;
        dailyMap[date] += orderTotal;
      });
      const chartPoints = Object.entries(dailyMap).map(([date, total]) => ({
        date,
        revenue: total,
      }));
      setChartData(chartPoints);

      // Stock Alerts
      const { data: stockData } = await supabase
        .from("products")
        .select(
          "product_id, product_name, product_quantity, product_stockout, product_overstock, product_category, purchase_price, sale_price"
        );
      const alerts =
        (stockData || [])
          .filter((p) => {
            const qty = p.product_quantity ?? 0;
            const stockout = p.product_stockout ?? Infinity;
            const overstock = p.product_overstock ?? -Infinity;
            return qty < stockout || qty > overstock;
          })
          .map((p) => ({
            ...p,
            alert_status:
              p.product_quantity < (p.product_stockout ?? Infinity)
                ? "Understock"
                : "Overstock",
          })) || [];
      setStockAlerts(alerts);
      setCurrentPage(1);

      // Top/Bottom Selling Products
      let topQueryBuilder = supabase
        .from("order_product")
        .select(
          "product_id, product_quantity, products(product_name, product_category, product_quantity), orders!inner(order_date)"
        );
      if (start && end) {
        topQueryBuilder = topQueryBuilder
          .gte("orders.order_date", start)
          .lt("orders.order_date", end);
      }
      const { data: topData } = await topQueryBuilder;
      const salesMap = {};
      topData?.forEach((entry) => {
        const id = entry.product_id;
        if (!salesMap[id]) {
          salesMap[id] = {
            product_id: id,
            product_name: entry.products?.product_name || "",
            category: entry.products?.product_category || "",
            units_sold: 0,
            stock_remaining: entry.products?.product_quantity || 0,
          };
        }
        salesMap[id].units_sold += entry.product_quantity;
      });
      let result = Object.values(salesMap);
      result.sort((a, b) =>
        productFilter === "top"
          ? b.units_sold - a.units_sold
          : a.units_sold - b.units_sold
      );
      result = result.slice(0, 5);
      setTopProducts(result);
    };

    fetchDashboardData();
    // eslint-disable-next-line
  }, [startDate, endDate, productFilter]);

  const summaryCards = [
    { title: "Revenue", value: revenue, icon: <FaMoneyBillWave size={20} /> },
    { title: "Expenses", value: expenses, icon: <FaWallet size={20} /> },
    { title: "Income", value: income, icon: <FaPiggyBank size={20} /> },
    {
      title: "Margin",
      value: margin,
      icon: <FaPercentage size={20} />,
      isPercentage: true,
    },
  ];

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
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  Log Out
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-1 mt-16">
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
                      <span className="mt-1 text-[10px] text-white text-center">
                        {item.label}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className={`flex-1 p-6 bg-[#F5F6FA] min-h-screen ${sidebarOpen ? "ml-[80px]" : ""}`}>
            <div className="flex justify-between items-center w-full px-4 py-2">
              <h2 className="text-2xl font-semibold ">Dashboard</h2>
              <div className="relative flex items-center gap-2">
                <button
                  className="calendar-btn flex items-center gap-2 px-4 h-[44px] border rounded-md text-black bg-white pr-10"
                  onClick={() => setShowDatePicker((prev) => !prev)}
                >
                  <FiCalendar />
                  {startDate && endDate
                    ? `${format(startDate, "dd/MM/yyyy")} - ${format(endDate, "dd/MM/yyyy")}`
                    : "Select Date Range"}
                </button>
                {startDate && endDate && (
                  <button
                    onClick={() =>
                      setDateRange([{ startDate: null, endDate: null, key: "selection" }])
                    }
                    className="absolute right-2 text-sm text-gray-500 hover:text-red-500"
                    title="Clear Date Filter"
                    style={{ marginLeft: "-24px" }}
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
                      onChange={(item) => setDateRange([item.selection])}
                      moveRangeOnFirstSelection={false}
                      ranges={dateRange}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {summaryCards.map((card, index) => {
                  const isPositive =
                    typeof card.value === "number" ? card.value >= 0 : true;
                  const textColor =
                    card.title === "Expenses"
                      ? "text-red-600"
                      : card.isPercentage
                      ? "text-black"
                      : isPositive
                      ? "text-green-600"
                      : "text-red-600";

                  return (
                    <div
                      key={index}
                      className="bg-white p-4 shadow rounded flex flex-col items-start justify-center"
                    >
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        {card.icon}
                        <span>{card.title}</span>
                      </div>
                      <div className={`text-2xl font-bold ${textColor}`}>
                        {card.isPercentage
                          ? `${parseFloat(card.value).toFixed(2)}%`
                          : card.value.toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-white p-4 shadow rounded">
                <h2 className="text-lg font-semibold mb-2">Revenue Trend</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={chartData}
                    margin={{ top: 30, right: 30, left: 50, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#8884d8"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 shadow rounded">
                  <h2 className="text-lg font-semibold mb-2">Stock Alerts</h2>
                  <table className="w-full text-sm text-center border border-gray-200">
                    <thead className="bg-gray-100 border-b border-gray-300">
                      <tr>
                        <th className="p-4">Product</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Quantity</th>
                        <th className="p-4">Alert Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedAlerts.map((row) => (
                        <tr
                          key={row.product_id}
                          className="text-center hover:bg-gray-50"
                        >
                          <td className="p-2">{row.product_name}</td>
                          <td className="p-2">{row.product_category}</td>
                          <td className="p-2">{row.product_quantity}</td>
                          <td className="p-2">{row.alert_status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {/* Pagination */}
                  <div className="flex justify-between items-center mt-4">
                    <button
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                      className={`px-4 py-2 rounded ${
                        currentPage === 1
                          ? "bg-gray-200 text-gray-500"
                          : "bg-gray-300"
                      }`}
                    >
                      Previous
                    </button>
                    <span className="text-black font-medium">
                      Page {currentPage}
                    </span>
                    <button
                      onClick={handleNextPage}
                      disabled={currentPage * pageSize >= stockAlerts.length}
                      className={`px-4 py-2 rounded ${
                        currentPage * pageSize >= stockAlerts.length
                          ? "bg-gray-200 text-gray-500"
                          : "bg-gray-300"
                      }`}
                    >
                      Next
                    </button>
                  </div>
                </div>

                <div className="bg-white p-4 shadow rounded">
                  <div className="flex justify-between items-center w-full px-4 py-2">
                    <h2 className="text-xl font-semibold">
                      {productFilter === "top"
                        ? "Top Selling Products"
                        : "Bottom Selling Products"}
                    </h2>

                    <select
                      value={productFilter}
                      onChange={(e) => setProductFilter(e.target.value)}
                      className="p-2 border border-gray-300 rounded-md"
                    >
                      <option value="top">Top Selling</option>
                      <option value="bottom">Bottom Selling</option>
                    </select>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topProducts}>
                      <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
                      <XAxis dataKey="product_name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="units_sold" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}