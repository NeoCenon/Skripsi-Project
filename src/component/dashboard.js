"use client";

import Link from "next/link";
import RequireAuth from './protectedroute';
import { useEffect, useState } from "react";
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
import { FiMenu, FiSearch, FiBell, FiMoreVertical } from "react-icons/fi";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
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
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_role");
    router.push("/login"); // Redirect to login page
  };

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

  useEffect(() => {
    fetchDashboardData();
  }, [startDate, endDate]);

  

  async function fetchDashboardData() {
    let orderQuery = supabase
      .from("order_product")
      .select("product_quantity, products(sale_price), orders!inner(order_date)");

    let instockQuery = supabase
      .from("instock_product")
      .select("product_quantity, products(purchase_price), instocks!inner(instock_date)");

    if (startDate && endDate) {
      const start = startDate.toISOString();
      const end = endDate.toISOString();

      orderQuery = orderQuery.gte("orders.order_date", start).lte("orders.order_date", end);
      instockQuery = instockQuery.gte("instocks.instock_date", start).lte("instocks.instock_date", end);
    }


    // Fetch Revenue
    const { data: revenueData } = await orderQuery;
    const totalRevenue = revenueData?.reduce((acc, row) => acc + row.product_quantity * (row.products?.sale_price || 0), 0) || 0;
    setRevenue(totalRevenue);

    // Fetch Expenses
    const { data: expenseData } = await instockQuery;
    const totalExpenses = expenseData?.reduce((acc, row) => acc + row.product_quantity * (row.products?.purchase_price || 0), 0) || 0;
    setExpenses(totalExpenses);

    // Income & Margin
    const netIncome = totalRevenue - totalExpenses;
    const marginPercent = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0;
    setIncome(netIncome);
    setMargin(marginPercent.toFixed(2));

    // Daily Revenue Chart
    const { data: orderData } = await supabase
      .from("orders")
      .select("order_id, order_date, order_product(product_quantity, products(sale_price))")
      .order("order_date", { ascending: true });

    const filteredOrders = startDate && endDate
    ? orderData?.filter(o => new Date(o.order_date) >= startDate && new Date(o.order_date) <= endDate)
    : orderData;

    const dailyMap = {};
    filteredOrders?.forEach((order) => {
      const date = new Date(order.order_date).toISOString().split("T")[0];
      let orderTotal = 0;
      order.order_product?.forEach((item) => {
        orderTotal += item.product_quantity * (item.products?.sale_price || 0);
      });
      if (!dailyMap[date]) dailyMap[date] = 0;
      dailyMap[date] += orderTotal;
    });

    const chartPoints = Object.entries(dailyMap).map(([date, total]) => ({ date, revenue: total }));
    setChartData(chartPoints);

    // Stock Alerts
    const { data: stockData } = await supabase
      .from("products")
      .select("product_id, product_name, product_quantity, product_stockout, product_overstock, product_category, purchase_price, sale_price");
    console.log("Stock data:", stockData);

    const alerts = (stockData || [])
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

    // Top Selling Products
    let topQuery = supabase
      .from("order_product")
      .select("product_id, product_quantity, products(product_name, product_category, product_quantity), orders!inner(order_date)");

    if (startDate && endDate) {
      const start = startDate.toISOString();
      const end = endDate.toISOString();
      topQuery = topQuery
        .gte("orders.order_date", start)
        .lte("orders.order_date", end);
    }

    const { data: topData } = await topQuery;

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

    const topSelling = Object.values(salesMap)
      .sort((a, b) => b.units_sold - a.units_sold)
      .slice(0, 5);

    setTopProducts(topSelling);
  }

  const menuItems = [
    { icon: <FaChartBar size={24} />, label: "Dashboard", href:"/dashboard", active: true },
        { icon: <MdOutlineInventory2 size={24} />, label: "In Stocks", href:"/instock" },
        { icon: <FaBoxOpen size={24} />, label: "Products", href:"/product" },
        { icon: <FaClipboardList size={24} />, label: "Orders", href:"/order" },
        { icon: <FaTruck size={24} />, label: "Suppliers", href:"/supplier" },
        { icon: <FaClipboardCheck size={24} />, label: "Stock Opname", href:"/historyopname" },
  ];

  const summaryCards = [
    { title: "Revenue", value: revenue, icon: <FaMoneyBillWave size={20} /> },
    { title: "Expenses", value: expenses, icon: <FaWallet size={20} /> },
    { title: "Income", value: income, icon: <FaPiggyBank size={20} /> },
    { title: "Margin", value: margin, icon: <FaPercentage size={20} />, isPercentage: true },
  ];

  return (
    <RequireAuth>
      <div className="flex flex-col h-screen bg-[#F5F6FA] text-black font-[Poppins]">
        <div className="fixed top-0 left-0 right-0 z-30 flex justify-between items-center px-6 py-4 bg-white border-b w-full">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)}>
              <FiMenu size={24} />
            </button>
            <h1 className="text-xl font-semibold"><span>E-</span>Inventoria</h1>
          </div>
          <div className="relative">
            <button onClick={() => setShowDropdown(!showDropdown)} className="flex items-center gap-2 px-3 py-1 bg-gray-200 rounded hover:bg-gray-300">
              <div className="w-6 h-6 bg-gray-400 rounded-full" />
              <span>{user?.email || "User"} ▾</span>
            </button>
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-32 bg-white border rounded shadow z-50">
                <button onClick={handleLogout} className="block w-full text-left px-4 py-2 hover:bg-gray-100">Log Out</button>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-1 mt-16">
          {sidebarOpen && (
            <div className="bg-[#12232E] text-white w-[80px] flex flex-col items-center pt-4 fixed top-0 bottom-0 z-20 mt-16">
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

          <div className={`flex-1 p-6 bg-[#F5F6FA] min-h-screen ${sidebarOpen ? "ml-[80px]" : ""}`}>
            <h2 className="text-2xl font-semibold mb-6">Dashboard</h2>

            <div className="mb-4 flex gap-4 items-center">
              <span className="text-sm font-medium">Select Date Range:</span>
              <DatePicker
                selectsRange
                startDate={startDate}
                endDate={endDate}
                onChange={(dates) => {
                  const [start, end] = dates;
                  setStartDate(start);
                  setEndDate(end);
                }}
                isClearable
                placeholderText="Select date range"
                className="border px-2 py-1 rounded"
              />
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {summaryCards.map((card, index) => {
                  const isPositive = typeof card.value === "number" ? card.value >= 0 : true;
                  const textColor = card.title === "Expenses"
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
                  <LineChart data={chartData}>
                    <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
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
                      {stockAlerts.map((row) => (
                        <tr key={row.product_id} className="text-center hover:bg-gray-50">
                          <td className="p-2">{row.product_name}</td>
                          <td className="p-2">{row.product_category}</td>
                          <td className="p-2">{row.product_quantity}</td>
                          <td className="p-2">{row.alert_status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-white p-4 shadow rounded">
                  <h2 className="text-lg font-semibold mb-2">Top Selling Products</h2>
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
