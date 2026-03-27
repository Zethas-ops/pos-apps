import React, { useEffect, useState } from "react";
import { Search, Printer, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "../lib/supabase";

function History() {
  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  useEffect(() => {
    fetchHistory();
  }, []);
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
        items: t.transaction_items || []
      }));
      
      setTransactions(formattedData);
    } catch (err) {
      console.error("Error fetching history:", err);
    }
  };
  const handleReprint = (transaction) => {
    const receiptContent = `
      <html>
        <head>
          <title>Receipt #${transaction.transaction_id}</title>
          <style>
            body { font-family: monospace; width: 300px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .header h1 { margin: 0; font-size: 24px; }
            .header p { margin: 5px 0; font-size: 12px; }
            .divider { border-top: 1px dashed #000; margin: 10px 0; }
            .item { display: flex; justify-content: space-between; margin: 5px 0; font-size: 14px; }
            .item-name { flex: 1; }
            .item-qty { width: 30px; text-align: right; }
            .item-price { width: 80px; text-align: right; }
            .total { font-weight: bold; font-size: 16px; margin-top: 10px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; }
            @media print {
              body { width: 100%; margin: 0; padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Coffee Shop</h1>
            <p>Receipt #${transaction.transaction_id}</p>
            <p>${format(new Date(transaction.date), "dd MMM yyyy, HH:mm")}</p>
            <p>Customer: ${transaction.customer_name} | Table: ${transaction.table_no}</p>
          </div>
          <div class="divider"></div>
          ${transaction.items.map((item) => `
            <div class="item">
              <div class="item-name">
                ${item.menu_name}
                ${item.addons && item.addons.length > 0 ? `<br><small>+ ${item.addons.map((a) => a.name).join(", ")}</small>` : ""}
              </div>
              <div class="item-qty">x${item.qty}</div>
              <div class="item-price">Rp ${item.subtotal.toLocaleString()}</div>
            </div>
          `).join("")}
          <div class="divider"></div>
          <div class="item total">
            <span>Total</span>
            <span>Rp ${transaction.total_price.toLocaleString()}</span>
          </div>
          <div class="item">
            <span>Payment Method</span>
            <span>${transaction.payment_method}</span>
          </div>
          <div class="footer">
            <p>Thank you for your visit!</p>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          <\/script>
        </body>
      </html>
    `;
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(receiptContent);
      printWindow.document.close();
    } else {
      alert("Please allow popups to print receipts.");
    }
  };
  const filteredTransactions = transactions.filter((t) => {
    const matchSearch = t.customer_name.toLowerCase().includes(search.toLowerCase()) || t.transaction_id.toString().includes(search);
    const matchDate = dateFilter ? t.date.startsWith(dateFilter) : true;
    return matchSearch && matchDate;
  });
  return <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Transaction History</h1>
        <div className="flex space-x-4">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
    type="date"
    value={dateFilter}
    onChange={(e) => setDateFilter(e.target.value)}
    className="pl-10 pr-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
  />
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
    type="text"
    placeholder="Search by name or ID..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    className="pl-10 pr-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none w-64"
  />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="p-4 font-bold text-gray-600">ID</th>
              <th className="p-4 font-bold text-gray-600">Date</th>
              <th className="p-4 font-bold text-gray-600">Customer</th>
              <th className="p-4 font-bold text-gray-600">Table</th>
              <th className="p-4 font-bold text-gray-600">Total</th>
              <th className="p-4 font-bold text-gray-600">Payment</th>
              <th className="p-4 font-bold text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((t) => <React.Fragment key={t.transaction_id}>
                <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setExpandedId(expandedId === t.transaction_id ? null : t.transaction_id)}>
                  <td className="p-4 font-medium text-gray-800">
                    <div className="flex items-center space-x-2">
                      {expandedId === t.transaction_id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                      <span>#{t.transaction_id}</span>
                    </div>
                  </td>
                  <td className="p-4 text-gray-600">{format(new Date(t.date), "dd MMM yyyy, HH:mm")}</td>
                  <td className="p-4 font-medium text-gray-800">{t.customer_name}</td>
                  <td className="p-4 text-gray-600">{t.table_no}</td>
                  <td className="p-4 font-bold text-blue-600">Rp {t.total_price.toLocaleString()}</td>
                  <td className="p-4">
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                      {t.payment_method}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
    onClick={(e) => {
      e.stopPropagation();
      handleReprint(t);
    }}
    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-flex items-center"
    title="Reprint Receipt"
  >
                      <Printer size={20} />
                    </button>
                  </td>
                </tr>
                {expandedId === t.transaction_id && <tr className="bg-gray-50 border-b border-gray-100">
                    <td colSpan={7} className="p-6">
                      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                        <h4 className="font-semibold text-gray-800 mb-4 border-b pb-2">Order Details</h4>
                        <div className="space-y-3">
                          {t.items.map((item, idx) => <div key={idx} className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-gray-800">
                                  {item.qty}x {item.menu_name}
                                  {item.is_auto_free ? <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">FREE</span> : ""}
                                </p>
                                {(item.drink_type || item.sugar_level) && <p className="text-sm text-gray-500">
                                    {item.drink_type && <span>{item.drink_type}</span>}
                                    {item.drink_type && item.sugar_level && <span> • </span>}
                                    {item.sugar_level && <span>{item.sugar_level} Sugar</span>}
                                  </p>}
                                {item.addons && item.addons.length > 0 && <p className="text-sm text-gray-500">
                                    + {item.addons.map((a) => a.name).join(", ")}
                                  </p>}
                              </div>
                              <p className="font-medium text-gray-800">Rp {item.subtotal.toLocaleString()}</p>
                            </div>)}
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end space-x-8 text-sm">
                          <div className="text-right">
                            <p className="text-gray-500 mb-1">Subtotal</p>
                            <p className="font-medium text-gray-800">Rp {t.subtotal?.toLocaleString() || 0}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-gray-500 mb-1">Tax</p>
                            <p className="font-medium text-gray-800">Rp {t.tax?.toLocaleString() || 0}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-gray-500 mb-1">Discount</p>
                            <p className="font-medium text-red-600">-Rp {t.discount?.toLocaleString() || 0}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-gray-500 mb-1">Total</p>
                            <p className="font-bold text-blue-600 text-lg">Rp {t.total_price.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>}
              </React.Fragment>)}
            {filteredTransactions.length === 0 && <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">
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
