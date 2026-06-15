import React, { useEffect, useState } from "react";
import { Search, Printer, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import moment from "moment-timezone";
import { supabase } from "../lib/supabase";
import { printViaBluetooth, formatReceiptText } from "../utils/printer";

const TIMEZONE = 'Asia/Jakarta';

function History() {
  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [storeProfile, setStoreProfile] = useState(null);

  useEffect(() => {
    fetchHistory();
    fetchStoreProfile();
  }, []);

  const fetchStoreProfile = async () => {
    try {
      const { data, error } = await supabase.from('store_profile').select('*').single();
      if (!error && data) {
        setStoreProfile(data);
      }
    } catch (err) {
      console.error("Error fetching store profile:", err);
    }
  };

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*, transaction_items(*)')
        .order('date', { ascending: false });
        
      if (error) throw error;
      
      // Map the data to match the expected format
      const formattedData = data.map(t => ({
        ...t,
        items: (t.transaction_items || []).map(item => {
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
          return {
            ...item,
            addons: parsedAddons
          };
        })
      }));
      
      setTransactions(formattedData);
    } catch (err) {
      console.error("Error fetching history:", err);
    }
  };
  const handleReprint = async (transaction) => {
    const txDataConfig = {
      invoice_no: transaction.invoice_no || transaction.transaction_id,
      date: moment.utc(transaction.date).tz(TIMEZONE).format("YYYY-MM-DD HH:mm:ss"),
      customer_name: transaction.customer_name,
      table_no: transaction.table_no,
      payment_method: transaction.payment_method,
      cash_amount: transaction.cash_amount,
      change_amount: transaction.change_amount
    };
    const totals = {
      subtotal: transaction.subtotal,
      tax: transaction.tax,
      discount: transaction.discount,
      total: transaction.total_price
    };
    
    const receiptText = formatReceiptText(storeProfile, txDataConfig, transaction.items, totals);
    
    try {
      await printViaBluetooth(receiptText);
    } catch (err) {
      console.error("Bluetooth print failed:", err);
      alert("Bluetooth print failed or was cancelled.");
    }
  };
  const transactionsWithInvoice = React.useMemo(() => {
    // Group all transactions by local date string
    const groups = {};
    const sorted = [...transactions].sort((a,b) => a.transaction_id - b.transaction_id);
    sorted.forEach(t => {
      const gDate = moment.utc(t.date).tz(TIMEZONE).format('YYYY-MM-DD');
      if (!groups[gDate]) groups[gDate] = [];
      groups[gDate].push(t);
    });
    
    // Map with calculated invoice number
    return transactions.map(t => {
      const gDate = moment.utc(t.date).tz(TIMEZONE).format('YYYY-MM-DD');
      const index = (groups[gDate] || []).findIndex(x => x.transaction_id === t.transaction_id);
      const datePart = moment.utc(t.date).tz(TIMEZONE).format('YYMMDD');
      const seqPart = String(Math.max(0, index) + 1).padStart(3, '0');
      return { ...t, invoice_no: `${datePart}${seqPart}` };
    });
  }, [transactions]);

  const filteredTransactions = transactionsWithInvoice.filter((t) => {
    const matchSearch = t.customer_name.toLowerCase().includes(search.toLowerCase()) || t.invoice_no.includes(search);
    const localDate = moment.utc(t.date).tz(TIMEZONE).format("YYYY-MM-DD");
    const matchDate = dateFilter ? localDate === dateFilter : true;
    return matchSearch && matchDate;
  });
  return <div className="p-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Transaction History</h1>
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 w-full md:w-auto">
          <div className="relative w-full sm:w-auto">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-400" size={20} />
            <input
    type="date"
    value={dateFilter}  
    onChange={(e) => setDateFilter(e.target.value)}
    className="w-full pl-10 pr-4 py-2 dark:text-gray-300 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
  />
          </div>
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
    type="text"
    placeholder="Search by name or ID..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    className="w-full pl-10 pr-4 py-2 dark:text-gray-300 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none sm:w-64"
  />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-200 dark:bg-gray-600 border-b border-gray-200 dark:border-gray-700">
              <th className="p-4 font-bold text-gray-600 dark:text-gray-300">ID</th>
              <th className="p-4 font-bold text-gray-600 dark:text-gray-300">Date</th>
              <th className="p-4 font-bold text-gray-600 dark:text-gray-300">Customer</th>
              <th className="p-4 font-bold text-gray-600 dark:text-gray-300">Table</th>
              <th className="p-4 font-bold text-gray-600 dark:text-gray-300">Total</th>
              <th className="p-4 font-bold text-gray-600 dark:text-gray-300">Payment</th>
              <th className="p-4 font-bold text-gray-600 dark:text-gray-300 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((t) => <React.Fragment key={t.transaction_id}>
                <tr className="border-b border-gray-100 hover:bg-gray-200 dark:hover:bg-gray-900 transition-colors cursor-pointer" onClick={() => setExpandedId(expandedId === t.transaction_id ? null : t.transaction_id)}>
                  <td className="p-4 font-medium text-gray-800 dark:text-gray-300">
                    <div className="flex items-center space-x-2">
                      {expandedId === t.transaction_id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                      <span>#{t.invoice_no}</span>
                    </div>
                  </td>
                  <td className="p-4 text-gray-600 dark:text-gray-300">{moment.utc(t.date).tz(TIMEZONE).format("YYYY-MM-DD HH:mm:ss")}</td>
                  <td className="p-4 font-medium text-gray-800 dark:text-gray-300">{t.customer_name}</td>
                  <td className="p-4 text-gray-600 dark:text-gray-300">{t.table_no}</td>
                  <td className="p-4 font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">Rp {Number(t.total_price || 0).toLocaleString("id-ID")}</td>
                  <td className="p-4 max-w-[200px]">
                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium inline-block break-words w-full">
                      {t.payment_method}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
    onClick={(e) => {
      e.stopPropagation();
      handleReprint(t);
    }}
    className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:bg-blue-900/30 rounded-lg transition-colors inline-flex items-center"
    title="Reprint Receipt"
  >
                      <Printer size={20} />
                    </button>
                  </td>
                </tr>
                {expandedId === t.transaction_id && <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100">
                    <td colSpan={7} className="p-6">
                      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                        <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-4 border-b pb-2">Order Details</h4>
                        <div className="space-y-3">
                          {t.items.map((item, idx) => <div key={idx} className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-gray-800 dark:text-gray-100">
                                  {item.qty}x {item.menu_name}
                                  {item.is_auto_free ? <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">FREE</span> : ""}
                                </p>
                                {(item.drink_type || item.sugar_level) && <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {item.drink_type && <span>{item.drink_type}</span>}
                                    {item.drink_type && item.sugar_level && <span> • </span>}
                                    {item.sugar_level && <span>{item.sugar_level} Sugar</span>}
                                  </p>}
                                {Array.isArray(item.addons) && item.addons.length > 0 && <p className="text-sm text-gray-500 dark:text-gray-400">
                                    + {item.addons.map((a) => a.name).join(", ")}
                                  </p>}
                              </div>
                              <p className="font-medium text-gray-800 dark:text-gray-100">Rp {Number(item.subtotal || 0).toLocaleString("id-ID")}</p>
                            </div>)}
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end space-x-8 text-sm">
                          <div className="text-right">
                            <p className="text-gray-500 dark:text-gray-400 mb-1">Subtotal</p>
                            <p className="font-medium text-gray-800 dark:text-gray-100">Rp {Number(t.subtotal || 0).toLocaleString("id-ID")}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-gray-500 dark:text-gray-400 mb-1">Tax</p>
                            <p className="font-medium text-gray-800 dark:text-gray-100">Rp {Number(t.tax || 0).toLocaleString("id-ID")}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-gray-500 dark:text-gray-400 mb-1">Discount</p>
                            <p className="font-medium text-red-600">-Rp {Number(t.discount || 0).toLocaleString("id-ID")}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-gray-500 dark:text-gray-400 mb-1">Total</p>
                            <p className="font-bold text-blue-600 dark:text-blue-400 text-lg">Rp {Number(t.total_price || 0).toLocaleString("id-ID")}</p>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>}
              </React.Fragment>)}
            {filteredTransactions.length === 0 && <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500 dark:text-gray-400">
                  No transactions found.
                </td>
              </tr>}
          </tbody>
        </table>
      </div>
    </div>;
}
export {
  History as default
};
