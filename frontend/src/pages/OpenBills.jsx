import { useEffect, useState } from "react";
import { Search, Edit, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

function OpenBills() {
  const [bills, setBills] = useState([]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  useEffect(() => {
    fetchBills();
  }, []);
  const fetchBills = async () => {
    try {
      const { data, error } = await supabase
        .from('open_bills')
        .select('*, open_bill_items(*)')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      const formattedData = data.map(bill => ({
        ...bill,
        items: bill.open_bill_items || []
      }));
      
      setBills(formattedData);
    } catch (err) {
      console.error("Error fetching open bills:", err);
    }
  };
  const handleEdit = (bill) => {
    navigate("/pos", { state: { bill, action: "edit" } });
  };
  const handleClose = (bill) => {
    navigate("/pos", { state: { bill, action: "close" } });
  };
  const filteredBills = bills.filter(
    (b) => b.customer_name.toLowerCase().includes(search.toLowerCase()) || b.table_no.toString().includes(search)
  );
  return <div className="p-8 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Open Bills</h1>
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
    type="text"
    placeholder="Search bills..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none sm:w-64"
  />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBills.map((bill) => {
    const total = bill.items.reduce((sum, i) => sum + i.subtotal, 0);
    return <div key={bill.bill_id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
              <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">{bill.customer_name}</h3>
                  <p className="text-sm text-gray-500 font-medium">Table {bill.table_no}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 font-medium">{new Date(bill.created_at).toLocaleTimeString()}</p>
                  <p className="font-black text-blue-600">Rp {total.toLocaleString()}</p>
                </div>
              </div>
              
              <div className="p-4 flex-1 overflow-y-auto max-h-48 space-y-2">
                {bill.items.map((item, idx) => <div key={idx} className="flex justify-between text-sm">
                    <span className="text-gray-700 font-medium">{item.qty}x {item.menu_name}</span>
                    <span className="text-gray-500">Rp {item.subtotal.toLocaleString()}</span>
                  </div>)}
              </div>

              <div className="p-4 border-t bg-gray-50 grid grid-cols-2 gap-3">
                <button
      onClick={() => handleEdit(bill)}
      className="flex items-center justify-center space-x-2 py-2 px-4 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
    >
                  <Edit size={18} />
                  <span>Edit</span>
                </button>
                <button
      onClick={() => handleClose(bill)}
      className="flex items-center justify-center space-x-2 py-2 px-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-200"
    >
                  <CheckCircle size={18} />
                  <span>Close Bill</span>
                </button>
              </div>
            </div>;
  })}
        {filteredBills.length === 0 && <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-2xl border border-dashed border-gray-300">
            No open bills found.
          </div>}
      </div>
    </div>;
}
export {
  OpenBills as default
};
