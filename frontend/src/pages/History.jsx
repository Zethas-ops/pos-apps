import React, { useEffect, useState } from "react";
import {
  Search,
  Printer,
  Calendar,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { format } from "date-fns";
import supabase from "../supabase";

function History() {
  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  // 🔥 FETCH FROM SUPABASE
  const fetchHistory = async () => {
    try {
      // ambil transaksi
      const { data: trx, error } = await supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: false });

      if (error) throw error;

      // ambil items
      const { data: items } = await supabase
        .from("transaction_items")
        .select("*");

      // join manual
      const grouped = trx.map((t) => ({
        ...t,
        items: items.filter((i) => i.transaction_id === t.transaction_id),
      }));

      setTransactions(grouped);
    } catch (err) {
      console.error("Fetch history error:", err);
    }
  };

  // 🔥 PRINT
  const handleReprint = (transaction) => {
    const receiptContent = `
      <html>
        <body style="font-family: monospace; width:300px; margin:auto;">
          <h2 style="text-align:center;">Coffee Shop</h2>
          <p>#${transaction.transaction_id}</p>
          <p>${format(new Date(transaction.date), "dd MMM yyyy HH:mm")}</p>
          <hr/>
          ${transaction.items
            .map(
              (item) => `
            <div>
              ${item.qty}x ${item.menu_name}
              <span style="float:right">Rp ${item.subtotal.toLocaleString()}</span>
            </div>
          `
            )
            .join("")}
          <hr/>
          <b>Total: Rp ${transaction.total_price.toLocaleString()}</b>
          <script>window.print();window.close();</script>
        </body>
      </html>
    `;

    const w = window.open("", "_blank");
    w.document.write(receiptContent);
    w.document.close();
  };

  // 🔥 FILTER
  const filteredTransactions = transactions.filter((t) => {
    const matchSearch =
      t.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      t.transaction_id.toString().includes(search);

    const matchDate = dateFilter
      ? t.date.startsWith(dateFilter)
      : true;

    return matchSearch && matchDate;
  });

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between">
        <h1 className="text-3xl font-bold">Transaction History</h1>

        <div className="flex gap-4">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="border px-3 py-2 rounded-xl"
          />

          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border px-3 py-2 rounded-xl"
          />
        </div>
      </div>

      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th>ID</th>
            <th>Date</th>
            <th>Customer</th>
            <th>Total</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {filteredTransactions.map((t) => (
            <React.Fragment key={t.transaction_id}>
              <tr
                onClick={() =>
                  setExpandedId(
                    expandedId === t.transaction_id
                      ? null
                      : t.transaction_id
                  )
                }
                className="cursor-pointer"
              >
                <td>#{t.transaction_id}</td>
                <td>{format(new Date(t.date), "dd MMM yyyy HH:mm")}</td>
                <td>{t.customer_name}</td>
                <td>Rp {t.total_price.toLocaleString()}</td>
                <td>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReprint(t);
                    }}
                  >
                    <Printer size={18} />
                  </button>
                </td>
              </tr>

              {expandedId === t.transaction_id && (
                <tr>
                  <td colSpan={5}>
                    <div className="p-4 bg-gray-50">
                      {t.items.map((item, i) => (
                        <div key={i} className="flex justify-between">
                          <span>
                            {item.qty}x {item.menu_name}
                          </span>
                          <span>
                            Rp {item.subtotal.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}

          {filteredTransactions.length === 0 && (
            <tr>
              <td colSpan={5} className="text-center p-6">
                No data
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default History;