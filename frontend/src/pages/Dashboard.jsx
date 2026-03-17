import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { DollarSign, Calendar, Download, Clock, TrendingUp, ShoppingBag } from "lucide-react";
import { format, subDays } from "date-fns";
function Dashboard() {
  const [metrics, setMetrics] = useState({});
  const [charts, setCharts] = useState({ salesChart: [], hourlyTraffic: [], paymentMethods: [], topSelling: [] });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("last7days");
  const [startDate, setStartDate] = useState(format(subDays(/* @__PURE__ */ new Date(), 6), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(/* @__PURE__ */ new Date(), "yyyy-MM-dd"));
  const [paymentMethod, setPaymentMethod] = useState("");
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const isAdmin = user?.role === "ADMIN";
  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const queryParams = new URLSearchParams({
        startDate: `${startDate}T00:00:00.000Z`,
        endDate: `${endDate}T23:59:59.999Z`
      });
      if (paymentMethod) {
        queryParams.append("paymentMethod", paymentMethod);
      }
      const queryString = queryParams.toString();
      // 🔥 GET DATE RANGE
const startDate = start.toISOString();
const endDate = end.toISOString();

// 🔥 METRICS (TOTAL SALES, TRANSACTIONS, dll)
const { data: transactions, error: trxError } = await supabase
  .from("transactions")
  .select("*")
  .gte("created_at", startDate)
  .lte("created_at", endDate);

if (trxError) throw trxError;

// 🔥 HITUNG METRICS
const totalRevenue = transactions.reduce((sum, t) => sum + t.total_price, 0);
const totalTransactions = transactions.length;
const totalItems = transactions.reduce((sum, t) => sum + (t.total_items || 0), 0);

const metricsData = {
  total_revenue: totalRevenue,
  total_transactions: totalTransactions,
  total_items: totalItems
};

setMetrics(metricsData);

// 🔥 CHART DATA (GROUP PER HARI)
const chartMap = {};

transactions.forEach((trx) => {
  const date = new Date(trx.created_at).toLocaleDateString();

  if (!chartMap[date]) {
    chartMap[date] = 0;
  }

  chartMap[date] += trx.total_price;
});

const chartsData = Object.keys(chartMap).map((date) => ({
  date,
  total: chartMap[date]
}));

setCharts(chartsData);
    } catch (err) {
      console.error("Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  };
  const handleTimeRangeChange = (e) => {
    const range = e.target.value;
    setTimeRange(range);
    const today = /* @__PURE__ */ new Date();
    let start = today;
    let end = today;
    switch (range) {
      case "today":
        start = today;
        break;
      case "yesterday":
        start = subDays(today, 1);
        end = subDays(today, 1);
        break;
      case "last7days":
        start = subDays(today, 6);
        break;
      case "last30days":
        start = subDays(today, 29);
        break;
      case "thisMonth":
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case "lastMonth":
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case "custom":
        return;
    }
    setStartDate(format(start, "yyyy-MM-dd"));
    setEndDate(format(end, "yyyy-MM-dd"));
  };
  useEffect(() => {
    fetchDashboard();
  }, [startDate, endDate, paymentMethod]);
  const handleApplyFilter = () => {
    fetchDashboard();
  };
  const handleExportCSV = async () => {
    try {
      // 🔥 ambil data dari supabase
const { data, error } = await supabase
  .from("transactions")
  .select("*")
  .gte("created_at", startDate)
  .lte("created_at", endDate)
  .order("created_at", { ascending: true });

if (error) throw error;

// 🔥 convert ke CSV
const headers = [
  "ID",
  "Date",
  "Customer",
  "Table",
  "Payment",
  "Subtotal",
  "Tax",
  "Discount",
  "Total"
];

const rows = data.map((trx) => [
  trx.id,
  trx.created_at,
  trx.customer_name,
  trx.table_no,
  trx.payment_method,
  trx.subtotal,
  trx.tax,
  trx.discount,
  trx.total_price
]);

const csvContent =
  [headers, ...rows]
    .map((row) => row.join(","))
    .join("\n");

// 🔥 download CSV
const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `transactions-${startDate}-to-${endDate}.csv`;
      a.click();
    } catch (err) {
      alert("Failed to export CSV");
    }
  };
  const COLORS = ["#00C49F", "#0088FE", "#FFBB28", "#FF8042"];
  const getPeakHour = () => {
    if (!charts.hourlyTraffic || charts.hourlyTraffic.length === 0) return null;
    return charts.hourlyTraffic.reduce(
      (max, current) => current.orders > max.orders ? current : max,
      charts.hourlyTraffic[0]
    );
  };
  const peakHour = getPeakHour();
  if (loading && !metrics.todaySales) return <div className="p-8">Loading dashboard...</div>;
  return <div className="p-8 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
      </div>

      {
    /* Metrics Cards */
  }
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col justify-between relative">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Today's Revenue</p>
            <p className="text-2xl font-bold text-gray-900">Rp {metrics.todaySales?.toLocaleString() || 0}</p>
            <p className="text-xs text-gray-500 mt-1">{metrics.todayOrders || 0} orders</p>
          </div>
          <div className="absolute top-6 right-6 p-2 bg-blue-50 text-blue-500 rounded-full">
            <DollarSign size={20} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col justify-between relative">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">This Week</p>
            <p className="text-2xl font-bold text-gray-900">Rp {metrics.weekSales?.toLocaleString() || 0}</p>
          </div>
          <div className="absolute top-6 right-6 p-2 bg-blue-50 text-blue-500 rounded-full">
            <Calendar size={20} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col justify-between relative">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">This Month</p>
            <p className="text-2xl font-bold text-gray-900">Rp {metrics.monthSales?.toLocaleString() || 0}</p>
          </div>
          <div className="absolute top-6 right-6 p-2 bg-blue-50 text-blue-500 rounded-full">
            <TrendingUp size={20} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col justify-between relative">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Today's Orders</p>
            <p className="text-2xl font-bold text-gray-900">{metrics.todayOrders || 0}</p>
          </div>
          <div className="absolute top-6 right-6 p-2 bg-blue-50 text-blue-500 rounded-full">
            <ShoppingBag size={20} />
          </div>
        </div>
      </div>

      {
    /* Sales Last 7 Days */
  }
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-gray-800">Sales Last 7 Days</h2>
            {isAdmin && <button
    onClick={handleExportCSV}
    className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
  >
                <Download size={16} />
                <span>Export CSV</span>
              </button>}
          </div>
          <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-xl border border-gray-200">
            <select
    value={paymentMethod}
    onChange={(e) => setPaymentMethod(e.target.value)}
    className="bg-transparent text-sm font-medium text-gray-700 outline-none px-2 py-1 cursor-pointer border-r border-gray-300 pr-3"
  >
              <option value="">All Payments</option>
              <option value="Cash">Cash</option>
              <option value="QRIS">QRIS</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Debit / Credit Card">Debit / Credit Card</option>
            </select>
            <select
    value={timeRange}
    onChange={handleTimeRangeChange}
    className="bg-transparent text-sm font-medium text-gray-700 outline-none px-2 py-1 cursor-pointer"
  >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last7days">Last 7 Days</option>
              <option value="last30days">Last 30 Days</option>
              <option value="thisMonth">This Month</option>
              <option value="lastMonth">Last Month</option>
              <option value="custom">Custom Range</option>
            </select>
            
            {timeRange === "custom" && <>
                <span className="text-gray-300">|</span>
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500 uppercase font-bold px-1">From</span>
                  <input
    type="date"
    value={startDate}
    onChange={(e) => setStartDate(e.target.value)}
    className="bg-transparent text-sm outline-none px-1"
  />
                </div>
                <span className="text-gray-300">|</span>
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500 uppercase font-bold px-1">To</span>
                  <input
    type="date"
    value={endDate}
    onChange={(e) => setEndDate(e.target.value)}
    className="bg-transparent text-sm outline-none px-1"
  />
                </div>
                <button
    onClick={handleApplyFilter}
    className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-1.5 px-4 rounded-lg transition-colors"
  >
                  Apply
                </button>
              </>}
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={charts.salesChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#888" }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#888" }} tickFormatter={(val) => `${val / 1e3}k`} />
              <Tooltip cursor={{ fill: "#f9fafb" }} contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={60} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {
    /* Today's Hourly Traffic */
  }
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-gray-500" />
            <h2 className="text-lg font-bold text-gray-800">Today's Hourly Traffic</h2>
          </div>
          {peakHour && <div className="text-sm text-gray-600">
              Peak: <span className="font-bold">{peakHour.label}</span> - {peakHour.orders} orders - Rp {peakHour.revenue.toLocaleString()}
            </div>}
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={charts.hourlyTraffic} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#888" }} dy={10} />
              <YAxis yAxisId="left" orientation="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#888" }} />
              <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#888" }} tickFormatter={(val) => `${val / 1e3}k`} />
              <Tooltip cursor={{ fill: "#f9fafb" }} contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
              <Legend iconType="square" wrapperStyle={{ fontSize: "12px" }} />
              <Bar yAxisId="left" dataKey="orders" name="Orders" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar yAxisId="right" dataKey="revenue" name="Revenue" fill="#60a5fa" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {
    /* Bottom Row: Payment Methods & Top Selling */
  }
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {
    /* Payment Methods */
  }
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold text-gray-800 mb-6">Payment Methods</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
    data={charts.paymentMethods}
    cx="50%"
    cy="50%"
    innerRadius={60}
    outerRadius={80}
    paddingAngle={5}
    dataKey="value"
    nameKey="name"
  >
                  {charts.paymentMethods?.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                <Legend iconType="square" wrapperStyle={{ fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {
    /* Top Selling Items */
  }
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold text-gray-800 mb-6">Top Selling Items</h2>
          <div className="space-y-4">
            {charts.topSelling?.map((item, index) => <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-lg font-bold text-gray-900 w-4">{index + 1}</span>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.sold} sold</p>
                  </div>
                </div>
                <div className="text-sm font-bold text-gray-900">
                  Rp {item.revenue.toLocaleString()}
                </div>
              </div>)}
            {(!charts.topSelling || charts.topSelling.length === 0) && <div className="text-center text-gray-500 py-8">No sales data available</div>}
          </div>
        </div>
      </div>
    </div>;
}
export {
  Dashboard as default
};
