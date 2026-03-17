import { useEffect, useState } from "react";
import { Search, Edit, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import supabase from "../supabase";

function OpenBills() {
  const [bills, setBills] = useState([]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchBills();
  }, []);

  // 🔥 FETCH FROM SUPABASE
  const fetchBills = async () => {
    try {
      // ambil bills
      const { data: billData, error } = await supabase
        .from("open_bills")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // ambil items
      const { data: items } = await supabase
        .from("open_bill_items")
        .select("*");

      // join manual
      const merged = billData.map((bill) => ({
        ...bill,
        items: items.filter((i) => i.bill_id === bill.bill_id),
      }));

      setBills(merged);
    } catch (err) {
      console.error("Fetch open bills error:", err);
    }
  };

  const handleEdit = (bill) => {
    navigate("/pos", { state: { bill, action: "edit" } });
  };

  const handleClose = (bill) => {
    navigate("/pos", { state: { bill, action: "close" } });
  };

  const filteredBills = bills.filter(
    (b) =>
      b.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      b.table_no?.toString().includes(search)
  );

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Open Bills</h1>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 rounded-xl border w-64"
          />
        </div>
      </div>

      {/* LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBills.map((bill) => {
          const total = bill.items.reduce(
            (sum, i) => sum + Number(i.subtotal || 0),
            0
          );

          return (
            <div
              key={bill.bill_id}
              className="bg-white rounded-2xl border p-4 flex flex-col"
            >
              {/* HEADER */}
              <div className="flex justify-between">
                <div>
                  <h3 className="font-bold">{bill.customer_name}</h3>
                  <p className="text-sm text-gray-500">
                    Table {bill.table_no}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs">
                    {new Date(bill.created_at).toLocaleTimeString()}
                  </p>
                  <p className="font-bold text-blue-600">
                    Rp {total.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* ITEMS */}
              <div className="mt-3 space-y-1 flex-1">
                {bill.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>
                      {item.qty}x {item.menu_name}
                    </span>
                    <span>Rp {item.subtotal}</span>
                  </div>
                ))}
              </div>

              {/* ACTION */}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleEdit(bill)}
                  className="border py-2 rounded-xl flex justify-center items-center gap-2"
                >
                  <Edit size={16} />
                  Edit
                </button>

                <button
                  onClick={() => handleClose(bill)}
                  className="bg-blue-600 text-white py-2 rounded-xl flex justify-center items-center gap-2"
                >
                  <CheckCircle size={16} />
                  Close
                </button>
              </div>
            </div>
          );
        })}

        {filteredBills.length === 0 && (
          <div className="col-span-full text-center p-8 text-gray-500">
            No open bills
          </div>
        )}
      </div>
    </div>
  );
}

export default OpenBills;