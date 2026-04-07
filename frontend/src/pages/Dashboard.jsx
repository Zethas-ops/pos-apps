import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { DollarSign, Calendar, Download, Clock, TrendingUp, ShoppingBag } from "lucide-react";
import moment from "moment-timezone";
import { supabase } from "../lib/supabase";

const TIMEZONE = 'Asia/Jakarta';

function Dashboard() {
  const [metrics, setMetrics] = useState({});
  const [charts, setCharts] = useState({ salesChart: [], hourlyTraffic: [], paymentMethods: [], topSelling: [] });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("last7days");
  const timeRangeLabel = {
  today: "Today",
  yesterday: "Yesterday",
  last7days: "Last 7 Days",
  last30days: "Last 30 Days",
  thisMonth: "This Month",
  lastMonth: "Last Month",
  custom: "Custom Range",
};
  
  // Initialize with UTC+7 dates
  const initZonedNow = moment().tz(TIMEZONE);
  const [startDate, setStartDate] = useState(initZonedNow.clone().subtract(6, 'days').format("YYYY-MM-DD"));
  const [endDate, setEndDate] = useState(initZonedNow.format("YYYY-MM-DD"));
  const [paymentMethod, setPaymentMethod] = useState("");
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const isAdmin = user?.role === "ADMIN";
  
  const fetchDashboard = async () => {
    try {
      setLoading(true);
      
      const now = moment().tz(TIMEZONE);
      
      const todayStart = now.clone().startOf('day').toISOString();
      const todayEnd = now.clone().endOf('day').toISOString();
      const weekStart = now.clone().startOf('isoWeek').toISOString();
      const weekEnd = now.clone().endOf('isoWeek').toISOString();
      const monthStart = now.clone().startOf('month').toISOString();
      const monthEnd = now.clone().endOf('month').toISOString();

      const start = moment.tz(`${startDate}T00:00:00.000`, TIMEZONE).toISOString();
      const end = moment.tz(`${endDate}T23:59:59.999`, TIMEZONE).toISOString();

      // 1. Filtered Transactions (for charts and filtered metrics)
      let filteredQuery = supabase
        .from('transactions')
        .select('*, transaction_items(*)')
        .gte('date', start)
        .lte('date', end);
      
      if (paymentMethod && paymentMethod !== "All") {
        filteredQuery = filteredQuery.eq('payment_method', paymentMethod);
      }
      
      const { data: filteredTxns, error: filteredErr } = await filteredQuery;
      if (filteredErr) throw filteredErr;

      // 2. Month Transactions (for today, week, month metrics)
      const earliestStart = new Date(Math.min(new Date(monthStart).getTime(), new Date(weekStart).getTime())).toISOString();
      
      let metricQuery = supabase
        .from('transactions')
        .select('*')
        .gte('date', earliestStart)
        .lte('date', monthEnd);
        
      if (paymentMethod && paymentMethod !== "All") {
        metricQuery = metricQuery.eq('payment_method', paymentMethod);
      }
      
      const { data: metricTxns, error: metricErr } = await metricQuery;
      if (metricErr) throw metricErr;

      // Calculate Metrics
      const filteredSales = filteredTxns.reduce((sum, t) => sum + Number(t.total_price), 0);
      const filteredOrders = filteredTxns.length;

      const todayTxns = metricTxns.filter(t => t.date >= todayStart && t.date <= todayEnd);
      const weekTxns = metricTxns.filter(t => t.date >= weekStart && t.date <= weekEnd);
      const monthTxnsOnly = metricTxns.filter(t => t.date >= monthStart && t.date <= monthEnd);

      const todaySales = todayTxns.reduce((sum, t) => sum + Number(t.total_price), 0);
      const weekSales = weekTxns.reduce((sum, t) => sum + Number(t.total_price), 0);
      const monthSales = monthTxnsOnly.reduce((sum, t) => sum + Number(t.total_price), 0);
      const todayOrders = todayTxns.length;

      setMetrics({
        filteredSales,
        filteredOrders,
        todaySales,
        weekSales,
        monthSales,
        todayOrders
      });

      // Calculate Charts
      const salesByDay = {};
      filteredTxns.forEach(t => {
        // Convert UTC date to UTC+7 to group by day correctly
        const day = moment.utc(t.date).tz(TIMEZONE).format("MM-DD");
        if (!salesByDay[day]) salesByDay[day] = 0;
        salesByDay[day] += Number(t.total_price);
      });
      const salesChart = Object.keys(salesByDay).sort().map(date => ({
        label: date,
        revenue: salesByDay[date]
      }));

      const trafficByHour = {};
      todayTxns.forEach(t => {
        // Convert UTC date to UTC+7 to group by hour correctly
        const hour = moment.utc(t.date).tz(TIMEZONE).format("HH:00");
        if (!trafficByHour[hour]) trafficByHour[hour] = { orders: 0, revenue: 0 };
        trafficByHour[hour].orders += 1;
        trafficByHour[hour].revenue += Number(t.total_price);
      });
      const hourlyTraffic = Object.keys(trafficByHour).sort().map(hour => ({
        label: hour,
        orders: trafficByHour[hour].orders,
        revenue: trafficByHour[hour].revenue
      }));

      const pmCount = {};
      filteredTxns.forEach(t => {
        const pm = t.payment_method;
        if (!pmCount[pm]) pmCount[pm] = 0;
        pmCount[pm] += 1;
      });
      const paymentMethods = Object.keys(pmCount).map(pm => ({
        name: pm,
        value: pmCount[pm]
      }));

      const itemSales = {};
      filteredTxns.forEach(t => {
        if (t.transaction_items) {
          t.transaction_items.forEach(item => {
            const name = item.menu_name;
            if (!itemSales[name]) itemSales[name] = { sold: 0, revenue: 0 };
            itemSales[name].sold += Number(item.qty);
            itemSales[name].revenue += Number(item.subtotal);
          });
        }
      });
      const topSelling = Object.keys(itemSales)
        .map(name => ({
          name,
          sold: itemSales[name].sold,
          revenue: itemSales[name].revenue
        }))
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 5);

      setCharts({
        salesChart,
        hourlyTraffic,
        paymentMethods,
        topSelling
      });

    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
    } finally {
      setLoading(false);
    }
  };
  const handleTimeRangeChange = (e) => {
    const range = e.target.value;
    setTimeRange(range);
    const today = moment().tz(TIMEZONE);
    let start = today.clone();
    let end = today.clone();
    switch (range) {
      case "today":
        start = today.clone();
        break;
      case "yesterday":
        start = today.clone().subtract(1, 'days');
        end = today.clone().subtract(1, 'days');
        break;
      case "last7days":
        start = today.clone().subtract(6, 'days');
        break;
      case "last30days":
        start = today.clone().subtract(29, 'days');
        break;
      case "thisMonth":
        start = today.clone().startOf('month');
        break;
      case "lastMonth":
        start = today.clone().subtract(1, 'month').startOf('month');
        end = today.clone().subtract(1, 'month').endOf('month');
        break;
      case "custom":
        return;
    }
    setStartDate(start.format("YYYY-MM-DD"));
    setEndDate(end.format("YYYY-MM-DD"));
  };
  useEffect(() => {
    if (timeRange !== "custom") {
      fetchDashboard();
    }
  }, [startDate, endDate, paymentMethod, timeRange]);
  const handleApplyFilter = () => {
    fetchDashboard();
  };
  const handleExportCSV = async () => {
    try {
      const start = moment.tz(`${startDate}T00:00:00.000`, TIMEZONE).toISOString();
      const end = moment.tz(`${endDate}T23:59:59.999`, TIMEZONE).toISOString();
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*, transaction_items(*)')
        .gte('date', start)
        .lte('date', end);

      if (error) throw error;
      if (!data || data.length === 0) {
        alert("No data found for the selected date range");
        return;
      }

      // Flatten the data for CSV
      const csvData = [];
      data.forEach(t => {
        const localDate = moment.utc(t.date).tz(TIMEZONE).format("YYYY-MM-DD HH:mm:ss");
        if (t.transaction_items && t.transaction_items.length > 0) {
          t.transaction_items.forEach(item => {
            let parsedAddons = [];
            if (typeof item.addons === 'string') {
              try {
                parsedAddons = JSON.parse(item.addons);
              } catch (e) {
                console.error("Error parsing addons:", e);
              }
            } else {
              parsedAddons = item.addons || [];
            }
            
            const addonsString = Array.isArray(parsedAddons) ? parsedAddons.map(a => a.name).join(', ') : '';

            csvData.push({
              transaction_id: t.transaction_id,
              date: localDate,
              table_no: t.table_no || '',
              customer_name: t.customer_name || '',
              payment_method: t.payment_method,
              total_price: t.total_price,
              menu_name: item.menu_name,
              addons: addonsString,
              qty: item.qty,
              price: item.price,
              subtotal: item.subtotal
            });
          });
        } else {
          csvData.push({
            transaction_id: t.transaction_id,
            date: localDate,
            table_no: t.table_no || '',
            customer_name: t.customer_name || '',
            payment_method: t.payment_method,
            total_price: t.total_price,
            menu_name: '',
            addons: '',
            qty: '',
            price: '',
            subtotal: ''
          });
        }
      });

      const headers = Object.keys(csvData[0]).join(",");
      const csv = csvData.map((row) => Object.values(row).map((val) => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");
      
      const blob = new Blob([`${headers}\n${csv}`], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `transactions-${startDate}-to-${endDate}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
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
            <p className="text-2xl font-bold text-gray-900">Rp {metrics.todaySales?.toLocaleString("id-ID") || 0}</p>
            <p className="text-xs text-gray-500 mt-1">{metrics.todayOrders || 0} orders</p>
          </div>
          <div className="absolute top-6 right-6 p-2 bg-blue-50 text-blue-500 rounded-full">
            <DollarSign size={20} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col justify-between relative">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">This Week</p>
            <p className="text-2xl font-bold text-gray-900">Rp {metrics.weekSales?.toLocaleString("id-ID") || 0}</p>
          </div>
          <div className="absolute top-6 right-6 p-2 bg-blue-50 text-blue-500 rounded-full">
            <Calendar size={20} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col justify-between relative">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">This Month</p>
            <p className="text-2xl font-bold text-gray-900">Rp {metrics.monthSales?.toLocaleString("id-ID") || 0}</p>
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
            <h2 className="text-lg font-bold text-gray-800">
              Sales {timeRangeLabel[timeRange]}
            </h2>
            {isAdmin && <button
    onClick={handleExportCSV}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl flex items-center space-x-2 transition-colors shadow-md shadow-blue-200 whitespace-nowrap"
  >
                <Download size={16} />
                <span>Export CSV</span>
              </button>}
          </div>
          <div className="flex flex-wrap items-center gap-3 bg-gray-50 p-2 rounded-xl border border-gray-200">
            <select
    value={paymentMethod}
    onChange={(e) => setPaymentMethod(e.target.value)}
    className="bg-transparent text-sm font-medium text-gray-700 outline-none px-2 py-1 cursor-pointer"
  >
              <option value="">All Payments</option>
              <option value="Cash">Cash</option>
              <option value="QRIS">QRIS</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Debit / Credit Card">Debit / Credit Card</option>
            </select>
            
            <div className="hidden sm:block w-px h-6 bg-gray-300"></div>

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
                <div className="hidden sm:block w-px h-6 bg-gray-300"></div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-medium">From</span>
                  <input
    type="date"
    value={startDate}
    onChange={(e) => setStartDate(e.target.value)}
    className="bg-transparent text-sm outline-none"
  />
                </div>
                <div className="hidden sm:block w-px h-6 bg-gray-300"></div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-medium">To</span>
                  <input
    type="date"
    value={endDate}
    onChange={(e) => setEndDate(e.target.value)}
    className="bg-transparent text-sm outline-none"
  />
                </div>
                <button
    onClick={handleApplyFilter}
    className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-1.5 px-4 rounded-lg transition-colors ml-1"
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
              <Tooltip cursor={{ fill: "#f9fafb" }} contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                formatter={(value) => `Rp ${value.toLocaleString("id-ID")}`}
              />
              <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={60} />
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
              Peak: <span className="font-bold">{peakHour.label}</span> - {peakHour.orders} orders - Rp {peakHour.revenue.toLocaleString("id-ID")}
            </div>}
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={charts.hourlyTraffic} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#888" }} dy={10} />
              <YAxis yAxisId="left" orientation="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#888" }} />
              <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#888" }} tickFormatter={(val) => `${val / 1e3}k`} />
              <Tooltip formatter={(value, name) => {
                if (name === "Revenue") {
                  return `Rp ${value.toLocaleString("id-ID")}`;
                }
                  return value; // orders tetap angka biasa
                }}
              />
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
                  Rp {item.revenue.toLocaleString("id-ID")}
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
