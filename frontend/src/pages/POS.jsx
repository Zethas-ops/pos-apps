import { useState, useEffect } from "react";
import { Plus, Minus, Trash2, Search, X, Check, ShoppingBag } from "lucide-react";
import { clsx } from "clsx";
import { useLocation } from "react-router-dom";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { supabase } from "../lib/supabase";

const TIMEZONE = 'Asia/Jakarta';

function POS() {
  const location = useLocation();
  const [menu, setMenu] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [storeProfile, setStoreProfile] = useState(null);
  const [promos, setPromos] = useState([]);
  const [cart, setCart] = useState([]);
  const [tableNo, setTableNo] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [openBillId, setOpenBillId] = useState(null);
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  const [qty, setQty] = useState(1);
  const [drinkType, setDrinkType] = useState("Ice");
  const [sugarLevel, setSugarLevel] = useState("Normal");
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [cashAmount, setCashAmount] = useState("");
  const [qrisData, setQrisData] = useState(null);
  useEffect(() => {
    fetchData();
  }, []);
  useEffect(() => {
    if (location.state?.bill) {
      const bill = location.state.bill;
      setTableNo(bill.table_no);
      setCustomerName(bill.customer_name);
      setOpenBillId(bill.bill_id);
      const parsedItems = bill.items.map((item) => {
        let parsedAddons = [];
        if (typeof item.addons === "string") {
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
      });
      setCart(parsedItems);
      if (location.state.action === "close") {
        setShowPayment(true);
      }
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);
  const isPromoValid = (promo) => {
    if (!promo.is_active) return false;
    const now = /* @__PURE__ */ new Date();
    if (promo.start_date && promo.end_date) {
      const [startYear, startMonth, startDay] = promo.start_date.split('T')[0].split('-');
      const start = new Date(startYear, startMonth - 1, startDay);
      start.setHours(0, 0, 0, 0);
      const [endYear, endMonth, endDay] = promo.end_date.split('T')[0].split('-');
      const end = new Date(endYear, endMonth - 1, endDay);
      end.setHours(23, 59, 59, 999);
      if (now < start || now > end) return false;
    }
    if (promo.day_filter && promo.day_filter !== "All Days") {
      const day = now.getDay();
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const currentDayName = dayNames[day];
      if (promo.day_filter === "Weekdays" && (day === 0 || day === 6)) return false;
      if (promo.day_filter === "Weekends" && (day > 0 && day < 6)) return false;
      if (["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].includes(promo.day_filter)) {
        if (promo.day_filter !== currentDayName) return false;
      }
    }
    if (promo.time_filter && promo.time_filter !== "All Day") {
      const hour = now.getHours();
      const minute = now.getMinutes();
      const currentMinutes = hour * 60 + minute;
      if (promo.time_filter === "Morning (06:00 - 12:00)") {
        if (currentMinutes < 6 * 60 || currentMinutes > 12 * 60) return false;
      } else if (promo.time_filter === "Afternoon (12:00 - 18:00)") {
        if (currentMinutes < 12 * 60 || currentMinutes > 18 * 60) return false;
      } else if (promo.time_filter === "Evening (18:00 - 24:00)") {
        if (currentMinutes < 18 * 60 || currentMinutes > 24 * 60) return false;
      } else if (promo.time_filter.startsWith("Custom Time")) {
        const match = promo.time_filter.match(/Custom Time \((\d{2}):(\d{2}) - (\d{2}):(\d{2})\)/);
        if (match) {
          const startMinutes = parseInt(match[1]) * 60 + parseInt(match[2]);
          const endMinutes = parseInt(match[3]) * 60 + parseInt(match[4]);
          if (currentMinutes < startMinutes || currentMinutes > endMinutes) return false;
        }
      }
    }
    return true;
  };
  useEffect(() => {
    if (menu.length === 0 || promos.length === 0) return;
    const activePromos = promos.filter(isPromoValid);
    const requiredFreeItems = {};
    const nonFreeCart = cart.filter((item) => !item.is_auto_free);
    const subtotal = nonFreeCart.reduce((sum, item) => sum + item.subtotal, 0);
    activePromos.forEach((promo) => {
      if (promo.type === "MIN_BUY_FREE") {
        const buyItems = nonFreeCart.filter((item) => item.menu_id === Number(promo.min_buy_menu_id));
        const totalBuyQty = buyItems.reduce((sum, item) => sum + item.qty, 0);
        const minBuyQty = Number(promo.min_buy_qty);
        if (minBuyQty > 0 && totalBuyQty >= minBuyQty) {
          const timesApplied = Math.floor(totalBuyQty / minBuyQty);
          const freeQty = timesApplied * Number(promo.free_qty);
          if (freeQty > 0) {
            requiredFreeItems[promo.free_menu_id] = (requiredFreeItems[promo.free_menu_id] || 0) + freeQty;
          }
        }
      } else if (promo.type === "MIN_NOMINAL_FREE" && promo.free_menu_id) {
        if (subtotal >= Number(promo.min_nominal)) {
          requiredFreeItems[promo.free_menu_id] = (requiredFreeItems[promo.free_menu_id] || 0) + 1;
        }
      }
    });
    const currentAutoFreeItems = cart.filter((item) => item.is_auto_free);
    const currentAutoMap = {};
    currentAutoFreeItems.forEach((item) => {
      currentAutoMap[item.menu_id] = (currentAutoMap[item.menu_id] || 0) + item.qty;
    });
    let isDifferent = false;
    if (Object.keys(requiredFreeItems).length !== Object.keys(currentAutoMap).length) {
      isDifferent = true;
    } else {
      for (const key in requiredFreeItems) {
        if (requiredFreeItems[key] !== currentAutoMap[key]) {
          isDifferent = true;
          break;
        }
      }
    }
    if (isDifferent) {
      const newCart = [...nonFreeCart];
      Object.keys(requiredFreeItems).forEach((menuIdStr) => {
        const menuId = parseInt(menuIdStr);
        const qty2 = requiredFreeItems[menuId];
        const menuItem = menu.find((m) => m.menu_id === menuId);
        if (menuItem) {
          newCart.push({
            menu_id: menuItem.menu_id,
            menu_name: menuItem.name + " (FREE)",
            price: 0,
            qty: qty2,
            drink_type: null,
            sugar_level: null,
            addons: [],
            subtotal: 0,
            is_auto_free: true
          });
        }
      });
      setCart(newCart);
    }
  }, [cart, promos, menu]);
  const fetchData = async () => {
    try {
      const [menuRes, profileRes, promoRes, recipesRes, ingredientsRes, addonsRes] = await Promise.all([
        supabase.from('menu').select('*'),
        supabase.from('store_profile').select('*').single(),
        supabase.from('promotions').select('*'),
        supabase.from('recipes').select('*'),
        supabase.from('ingredients').select('*'),
        supabase.from('menu_addons').select('*')
      ]);

      if (menuRes.error) throw menuRes.error;
      
      const ingredientsMap = {};
      if (ingredientsRes.data) {
        ingredientsRes.data.forEach(ing => {
          ingredientsMap[ing.ingredient_id] = ing.current_stock;
        });
      }

      const menuData = menuRes.data.map(item => {
        let image = item.image;
        let addon_target = item.addon_target;
        if (addon_target && addon_target.includes('|||')) {
          const parts = addon_target.split('|||');
          addon_target = parts[0] || null;
          image = parts[1];
        }

        const itemRecipes = recipesRes.data?.filter(r => r.menu_id === item.menu_id) || [];
        const recipesWithStock = itemRecipes.map(r => ({
          ...r,
          current_stock: ingredientsMap[r.ingredient_id] || 0
        }));
        
        let maxQty = Infinity;
        if (recipesWithStock.length > 0) {
          for (const r of recipesWithStock) {
            const possible = Math.floor(r.current_stock / r.usage_amount);
            if (possible < maxQty) maxQty = possible;
          }
        } else {
          maxQty = 999; // If no recipes, assume unlimited
        }

        return {
          ...item,
          image,
          addon_target,
          recipes: recipesWithStock,
          maxQty: maxQty
        };
      });

      const menuDataWithAddons = menuData.map(item => {
        const addonIds = addonsRes.data?.filter(a => a.menu_id === item.menu_id).map(a => a.addon_menu_id) || [];
        const itemAddons = menuData.filter(m => addonIds.includes(m.menu_id));
        return {
          ...item,
          addons: itemAddons
        };
      });

      setMenu(menuDataWithAddons);
      const cats = Array.from(new Set(menuDataWithAddons.map((item) => item.category)));
      setCategories(["All", ...cats]);
      
      if (!profileRes.error && profileRes.data) {
        setStoreProfile(profileRes.data);
      }
      if (!promoRes.error && promoRes.data) {
        setPromos(promoRes.data);
      }
    } catch (err) {
      console.error("Error fetching data", err);
    }
  };
  const handleMenuClick = (item) => {
    setSelectedMenu(item);
    setQty(1);
    setDrinkType("Ice");
    setSugarLevel("Normal");
    setSelectedAddons([]);
    setShowOptions(true);
  };
  const getCartIngredientUsage = () => {
    const usage = {};
    for (const item of cart) {
      const menuItem = menu.find(m => m.menu_id === item.menu_id);
      if (menuItem && menuItem.recipes) {
        for (const r of menuItem.recipes) {
          usage[r.ingredient_id] = (usage[r.ingredient_id] || 0) + (r.usage_amount * item.qty);
        }
      }
      if (item.addons) {
        for (const addon of item.addons) {
          const addonMenu = menu.find(m => m.menu_id === addon.menu_id);
          if (addonMenu && addonMenu.recipes) {
            for (const r of addonMenu.recipes) {
              usage[r.ingredient_id] = (usage[r.ingredient_id] || 0) + (r.usage_amount * item.qty);
            }
          }
        }
      }
    }
    return usage;
  };

  const getMaxAllowedQty = () => {
    if (!selectedMenu) return 1;
    const cartUsage = getCartIngredientUsage();
    let minQty = Infinity;
    const ingredientUsage = {};
    if (selectedMenu.recipes) {
      for (const r of selectedMenu.recipes) {
        ingredientUsage[r.ingredient_id] = {
          stock: r.current_stock - (cartUsage[r.ingredient_id] || 0),
          usagePerItem: r.usage_amount
        };
      }
    }
    for (const addon of selectedAddons) {
      if (addon.recipes) {
        for (const r of addon.recipes) {
          if (!ingredientUsage[r.ingredient_id]) {
            ingredientUsage[r.ingredient_id] = {
              stock: r.current_stock - (cartUsage[r.ingredient_id] || 0),
              usagePerItem: 0
            };
          }
          ingredientUsage[r.ingredient_id].usagePerItem += r.usage_amount;
        }
      }
    }
    for (const id in ingredientUsage) {
      const { stock, usagePerItem } = ingredientUsage[id];
      if (usagePerItem > 0) {
        const possible = Math.floor(stock / usagePerItem);
        if (possible < minQty) minQty = possible;
      }
    }
    if (minQty === Infinity) minQty = 999;
    return Math.max(0, minQty);
  };
  const isAddonOutOfStock = (addon) => {
    if (!selectedMenu) return true;
    const cartUsage = getCartIngredientUsage();
    const ingredientUsage = {};
    if (selectedMenu.recipes) {
      for (const r of selectedMenu.recipes) {
        ingredientUsage[r.ingredient_id] = {
          stock: r.current_stock - (cartUsage[r.ingredient_id] || 0),
          usagePerItem: r.usage_amount
        };
      }
    }
    for (const a of selectedAddons) {
      if (a.menu_id === addon.menu_id) continue;
      if (a.recipes) {
        for (const r of a.recipes) {
          if (!ingredientUsage[r.ingredient_id]) {
            ingredientUsage[r.ingredient_id] = {
              stock: r.current_stock - (cartUsage[r.ingredient_id] || 0),
              usagePerItem: 0
            };
          }
          ingredientUsage[r.ingredient_id].usagePerItem += r.usage_amount;
        }
      }
    }
    if (addon.recipes) {
      for (const r of addon.recipes) {
        if (!ingredientUsage[r.ingredient_id]) {
          ingredientUsage[r.ingredient_id] = {
            stock: r.current_stock - (cartUsage[r.ingredient_id] || 0),
            usagePerItem: 0
          };
        }
        ingredientUsage[r.ingredient_id].usagePerItem += r.usage_amount;
      }
    }
    for (const id in ingredientUsage) {
      const { stock, usagePerItem } = ingredientUsage[id];
      if (usagePerItem > 0) {
        const possible = Math.floor(stock / usagePerItem);
        if (possible < qty) return true;
      }
    }
    return false;
  };
  const handleAddToCart = () => {
    if (!selectedMenu) return;
    const price = selectedMenu.price;
    const addonsPrice = selectedAddons.reduce((sum, a) => sum + a.price, 0);
    const subtotal = (price + addonsPrice) * qty;
    const newItem = {
      menu_id: selectedMenu.menu_id,
      menu_name: selectedMenu.name,
      price,
      qty,
      drink_type: selectedMenu.category === "Coffee" || selectedMenu.category === "Non Coffee" ? drinkType : null,
      sugar_level: selectedMenu.category === "Coffee" || selectedMenu.category === "Non Coffee" ? sugarLevel : null,
      addons: selectedAddons,
      subtotal,
      maxQty: getMaxAllowedQty()
    };
    const existingIndex = cart.findIndex(
      (item) => item.menu_id === newItem.menu_id && item.drink_type === newItem.drink_type && item.sugar_level === newItem.sugar_level && JSON.stringify(item.addons) === JSON.stringify(newItem.addons)
    );
    if (existingIndex >= 0) {
      const newCart = [...cart];
      if (newCart[existingIndex].qty + qty > (newCart[existingIndex].maxQty || Infinity)) {
        alert("Cannot exceed available stock");
        return;
      }
      newCart[existingIndex].qty += qty;
      newCart[existingIndex].subtotal = (newCart[existingIndex].price + addonsPrice) * newCart[existingIndex].qty;
      setCart(newCart);
    } else {
      setCart([...cart, newItem]);
    }
    setShowOptions(false);
  };
  const updateCartQty = (index, delta) => {
    const newCart = [...cart];
    const newQty = newCart[index].qty + delta;
    if (newQty > (newCart[index].maxQty || Infinity)) {
      alert("Cannot exceed available stock");
      return;
    }
    newCart[index].qty = newQty;
    if (newCart[index].qty <= 0) {
      newCart.splice(index, 1);
    } else {
      const addonsPrice = newCart[index].addons.reduce((sum, a) => sum + a.price, 0);
      newCart[index].subtotal = (newCart[index].price + addonsPrice) * newCart[index].qty;
    }
    setCart(newCart);
  };
  const calculateTotals = () => {
    let subtotal = cart.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
    let discount = 0;
    const activePromos = promos.filter(isPromoValid);
    let maxDiscount = 0;
    activePromos.forEach((promo) => {
      let currentDiscount = 0;
      if (promo.type === "DISCOUNT") {
        currentDiscount = subtotal * (Number(promo.discount_percent) / 100);
      } else if (promo.type === "MIN_BUY_DISCOUNT") {
        const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
        if (totalQty >= Number(promo.min_buy_qty)) {
          currentDiscount = Number(promo.discount_amount);
        }
      } else if (promo.type === "MIN_NOMINAL_FREE") {
        if (subtotal >= Number(promo.min_nominal)) {
          if (promo.discount_amount) {
            currentDiscount = Number(promo.discount_amount);
          } else if (promo.discount_percent) {
            currentDiscount = subtotal * (Number(promo.discount_percent) / 100);
          }
        }
      } else if (promo.type === "MIN_BUY_FREE") {
      }
      if (currentDiscount > maxDiscount) {
        maxDiscount = currentDiscount;
      }
    });
    discount = maxDiscount;
    const tax = Math.round((subtotal - discount) * 0.11);
    const total = subtotal - discount + tax;
    return { subtotal, discount, tax, total };
  };
  const totals = calculateTotals();
  const totalCart = totals.total;
  const handleCheckout = async () => {
    if (!tableNo || !customerName) {
      alert("Please enter Table No and Customer Name");
      return;
    }
    if (cart.length === 0) {
      alert("Cart is empty");
      return;
    }
    setShowPayment(true);
  };
  const processPayment = async () => {
    try {
      // 1. Create transaction record
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert([{
          table_no: tableNo,
          customer_name: customerName,
          payment_method: paymentMethod,
          subtotal: totals.subtotal,
          tax: totals.tax,
          discount: totals.discount,
          cash_amount: paymentMethod === "Cash" ? Number(cashAmount) : totals.total,
          change_amount: paymentMethod === "Cash" ? Number(cashAmount) - totals.total : 0,
          total_price: totals.total,
          date: new Date().toISOString()
        }])
        .select()
        .single();

      if (txError) throw txError;

      // 2. Create transaction items
      const txItems = cart.map(item => ({
        transaction_id: transaction.transaction_id,
        menu_id: item.menu_id,
        menu_name: item.menu_name,
        qty: item.qty,
        price: item.price,
        subtotal: item.subtotal,
        addons: item.addons,
        is_auto_free: item.is_auto_free || false
      }));

      const { error: itemsError } = await supabase
        .from('transaction_items')
        .insert(txItems);

      if (itemsError) throw itemsError;

      // 3. Update inventory stock
      for (const item of cart) {
        const menuItem = menu.find(m => m.menu_id === item.menu_id);
        if (menuItem && menuItem.recipes) {
          for (const recipe of menuItem.recipes) {
            const usage = recipe.usage_amount * item.qty;
            // Get current stock
            const { data: ing, error: ingError } = await supabase
              .from('ingredients')
              .select('current_stock')
              .eq('ingredient_id', recipe.ingredient_id)
              .single();
              
            if (!ingError && ing) {
              await supabase
                .from('ingredients')
                .update({ current_stock: ing.current_stock - usage })
                .eq('ingredient_id', recipe.ingredient_id);
            }
          }
        }
        
        // Deduct addon stock
        if (item.addons) {
          for (const addon of item.addons) {
            const addonMenu = menu.find(m => m.menu_id === addon.menu_id);
            if (addonMenu && addonMenu.recipes) {
              for (const recipe of addonMenu.recipes) {
                const usage = recipe.usage_amount * item.qty;
                const { data: ing, error: ingError } = await supabase
                  .from('ingredients')
                  .select('current_stock')
                  .eq('ingredient_id', recipe.ingredient_id)
                  .single();
                  
                if (!ingError && ing) {
                  await supabase
                    .from('ingredients')
                    .update({ current_stock: ing.current_stock - usage })
                    .eq('ingredient_id', recipe.ingredient_id);
                }
              }
            }
          }
        }
      }

      // 4. If this was an open bill, update its status
      if (openBillId) {
        await supabase.from('open_bill_items').delete().eq('bill_id', openBillId);
        await supabase
          .from('open_bills')
          .delete()
          .eq('bill_id', openBillId);
      }

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
              <h1>${storeProfile?.store_name || "Coffee Shop"}</h1>
              <p>${storeProfile?.address || "Address"}</p>
              <p>${storeProfile?.phone || "Phone"}</p>
              <div class="divider"></div>
              <p>Receipt #${transaction.transaction_id}</p>
              <p>${format(toZonedTime(new Date(), TIMEZONE), "dd MMM yyyy, HH:mm")}</p>
              <p>Customer: ${customerName} | Table: ${tableNo}</p>
            </div>
            <div class="divider"></div>
            ${cart.map((item) => `
              <div class="item">
                <div class="item-name">
                  ${item.menu_name} ${item.drink_type ? `(${item.drink_type})` : ""}
                  ${item.addons && item.addons.length > 0 ? `<br><small>+ ${item.addons.map((a) => a.name).join(", ")}</small>` : ""}
                </div>
                <div class="item-qty">x${item.qty}</div>
                <div class="item-price">Rp ${Number(item.subtotal || 0).toLocaleString()}</div>
              </div>
            `).join("")}
            <div class="divider"></div>
            <div class="item">
              <span>Subtotal</span>
              <span>Rp ${Number(totals.subtotal || 0).toLocaleString()}</span>
            </div>
            ${totals.discount > 0 ? `
            <div class="item">
              <span>Discount</span>
              <span>-Rp ${Number(totals.discount || 0).toLocaleString()}</span>
            </div>
            ` : ""}
            <div class="item">
              <span>PPN 11%</span>
              <span>Rp ${Number(totals.tax || 0).toLocaleString()}</span>
            </div>
            <div class="item total">
              <span>Total Payment</span>
              <span>Rp ${Number(totals.total || 0).toLocaleString()}</span>
            </div>
            <div class="divider"></div>
            ${paymentMethod === "Cash" ? `
            <div class="item">
              <span>Amount Cash</span>
              <span>Rp ${Number(cashAmount).toLocaleString()}</span>
            </div>
            <div class="item">
              <span>Change</span>
              <span>Rp ${(Number(cashAmount) - totals.total).toLocaleString()}</span>
            </div>
            ` : ""}
            <div class="item">
              <span>Payment Method</span>
              <span>${paymentMethod}</span>
            </div>
            <div class="footer">
              <p>*** THANK YOU ***</p>
            </div>
          </body>
        </html>
      `;
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      iframe.contentWindow.document.open();
      iframe.contentWindow.document.write(receiptContent);
      iframe.contentWindow.document.close();
      
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
      alert("Payment successful and receipt printed!");
      setCart([]);
      setTableNo("");
      setCustomerName("");
      setShowPayment(false);
      setCashAmount("");
      setQrisData(null);
      fetchData(); // Refresh stock
    } catch (err) {
      alert(err.message || "Checkout failed");
    }
  };
  const generateQris = async () => {
    // Mock QRIS generation since we don't have a backend
    setQrisData({
      qrString: "00020101021126570011ID.CO.QRIS.WWW01189360091530000000000214123456789012340303UMI51440014ID.CO.QRIS.WWW0215ID10200210000000303UMI5204581253033605405100005802ID5911COFFEE SHOP6007JAKARTA61051234562070703A016304A1B2",
      amount: totals.total
    });
  };
  const saveOpenBill = async () => {
    if (!tableNo || !customerName) {
      alert("Please enter Table No and Customer Name");
      return;
    }
    if (cart.length === 0) {
      alert("Cart is empty");
      return;
    }
    
    try {
      let billId = openBillId;
      
      if (openBillId) {
        // Update existing open bill
        const { error: updateError } = await supabase
          .from('open_bills')
          .update({
            table_no: tableNo,
            customer_name: customerName,
            subtotal: totals.subtotal,
            tax: totals.tax,
            discount: totals.discount,
            total_price: totals.total
          })
          .eq('bill_id', openBillId);
          
        if (updateError) throw updateError;
        
        // Delete old items
        await supabase.from('open_bill_items').delete().eq('bill_id', openBillId);
      } else {
        // Create new open bill
        const { data: newBill, error: insertError } = await supabase
          .from('open_bills')
          .insert([{
            table_no: tableNo,
            customer_name: customerName,
            subtotal: totals.subtotal,
            tax: totals.tax,
            discount: totals.discount,
            total_price: totals.total,
            created_at: new Date().toISOString()
          }])
          .select()
          .single();
          
        if (insertError) throw insertError;
        billId = newBill.bill_id;
      }
      
      // Insert items
      const billItems = cart.map(item => ({
        bill_id: billId,
        menu_id: item.menu_id,
        menu_name: item.menu_name,
        qty: item.qty,
        price: item.price,
        subtotal: item.subtotal,
        addons: item.addons,
        is_auto_free: item.is_auto_free || false
      }));
      
      const { error: itemsError } = await supabase
        .from('open_bill_items')
        .insert(billItems);
        
      if (itemsError) throw itemsError;

      alert("Open bill saved!");
      setCart([]);
      setTableNo("");
      setCustomerName("");
      setOpenBillId(null);
    } catch (err) {
      alert(err.message || "Failed to save open bill");
    }
  };
  const getMenuMaxQty = (menuItem) => {
    const cartUsage = getCartIngredientUsage();
    let minQty = Infinity;
    if (menuItem.recipes && menuItem.recipes.length > 0) {
      for (const r of menuItem.recipes) {
        const stock = r.current_stock - (cartUsage[r.ingredient_id] || 0);
        const possible = Math.floor(stock / r.usage_amount);
        if (possible < minQty) minQty = possible;
      }
    } else {
      minQty = 999;
    }
    return Math.max(0, minQty);
  };

  const filteredMenu = menu.filter((item) => {
    if (activeCategory !== "All" && item.category !== activeCategory) return false;
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  return <div className="flex h-screen bg-gray-50 overflow-hidden">
      {
    /* Left Side - Menu */
  }
      <div className="flex-1 flex flex-col h-full border-r border-gray-200">
        {
    /* Header */
  }
        <div className="p-4 bg-white border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex space-x-2 overflow-x-auto pb-2 w-full sm:w-auto">
            {categories.map((cat) => <button
    key={cat}
    onClick={() => setActiveCategory(cat)}
    className={clsx(
      "px-4 py-2 rounded-full whitespace-nowrap font-medium transition-colors",
      activeCategory === cat ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
    )}
  >
                {cat}
              </button>)}
          </div>
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
    type="text"
    placeholder="Search menu..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none sm:w-64"
  />
          </div>
        </div>

        {
    /* Menu Grid */
  }
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredMenu.map((item) => {
    const currentMaxQty = getMenuMaxQty(item);
    const outOfStock = currentMaxQty <= 0;
    return <div
      key={item.menu_id}
      onClick={() => !outOfStock && handleMenuClick(item)}
      className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col ${outOfStock ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:shadow-md transition-shadow"}`}
    >
                <div className="h-40 bg-gray-200 relative">
                  {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>}
                  <div className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded-lg text-xs font-bold text-gray-800">
                    {item.category}
                  </div>
                  {outOfStock && <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white font-bold px-3 py-1 bg-red-500 rounded-full text-sm">Out of Stock</span>
                    </div>}
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <h3 className="font-semibold text-gray-800 leading-tight mb-2">{item.name}</h3>
                  <p className="text-blue-600 font-bold">Rp {Number(item.price || 0).toLocaleString()}</p>
                </div>
              </div>;
  })}
          </div>
        </div>
      </div>

      {
    /* Right Side - Cart */
  }
      <div className="w-96 bg-white flex flex-col h-full shadow-xl z-10">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Current Order</h2>
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold">
            {cart.length} items
          </span>
        </div>

        {
    /* Cart Items */
  }
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <ShoppingBag size={48} className="mb-4 opacity-50" />
              <p>Cart is empty</p>
            </div> : cart.map((item, index) => <div key={index} className="flex flex-col p-3 border border-gray-100 rounded-xl bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800">{item.menu_name}</h4>
                    <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                      {item.drink_type && <p>{item.drink_type} • {item.sugar_level} Sugar</p>}
                      {item.addons.map((a, i) => <p key={i}>+ {a.name} (Rp {a.price})</p>)}
                    </div>
                  </div>
                  <p className="font-bold text-blue-600">Rp {Number(item.subtotal || 0).toLocaleString()}</p>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200">
                  <div className="flex items-center space-x-3 bg-white rounded-lg border border-gray-200 p-1">
                    <button onClick={() => updateCartQty(index, -1)} disabled={item.is_auto_free} className="p-1 hover:bg-gray-100 rounded text-gray-600 disabled:opacity-50">
                      <Minus size={16} />
                    </button>
                    <span className="font-bold w-6 text-center">{item.qty}</span>
                    <button onClick={() => updateCartQty(index, 1)} disabled={item.is_auto_free} className="p-1 hover:bg-gray-100 rounded text-gray-600 disabled:opacity-50">
                      <Plus size={16} />
                    </button>
                  </div>
                  <button onClick={() => updateCartQty(index, -item.qty)} disabled={item.is_auto_free} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors disabled:opacity-50">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>)}
        </div>

        {
    /* Checkout Section */
  }
        <div className="p-4 border-t bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="space-y-3 mb-4">
            <div className="flex space-x-3">
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Table No *</label>
                <select
    value={tableNo}
    onChange={(e) => setTableNo(e.target.value)}
    className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
  >
                  <option value="">Select Table</option>
                  {[...Array(10)].map((_, i) => <option key={i + 1} value={i + 1}>Table {i + 1}</option>)}
                  <option value="Takeaway">Takeaway</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Customer *</label>
                <input
    type="text"
    value={customerName}
    onChange={(e) => setCustomerName(e.target.value)}
    placeholder="Name"
    className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
  />
              </div>
            </div>
            
            <div className="flex justify-between items-center py-1">
              <span className="text-gray-500 text-sm">Subtotal</span>
              <span className="font-medium text-gray-800">Rp {Number(totals.subtotal || 0).toLocaleString()}</span>
            </div>
            {totals.discount > 0 && <div className="flex justify-between items-center py-1">
                <span className="text-green-500 text-sm">Discount</span>
                <span className="font-medium text-green-600">-Rp {Number(totals.discount || 0).toLocaleString()}</span>
              </div>}
            <div className="flex justify-between items-center py-1">
              <span className="text-gray-500 text-sm">PPN 11%</span>
              <span className="font-medium text-gray-800">Rp {Number(totals.tax || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-t border-gray-100 mt-2">
              <span className="text-gray-500 font-bold">Total</span>
              <span className="text-2xl font-black text-gray-800">Rp {Number(totals.total || 0).toLocaleString()}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
    onClick={saveOpenBill}
    className="py-3 px-4 bg-orange-100 text-orange-700 font-bold rounded-xl hover:bg-orange-200 transition-colors"
  >
              Save Bill
            </button>
            <button
    onClick={handleCheckout}
    className="py-3 px-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-200"
  >
              Pay Now
            </button>
          </div>
        </div>
      </div>

      {
    /* Options Modal */
  }
      {showOptions && selectedMenu && <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold text-gray-800">{selectedMenu.name}</h3>
              <button onClick={() => setShowOptions(false)} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {
    /* Quantity */
  }
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">Quantity</label>
                <div className="flex items-center space-x-4">
                  <button
    onClick={() => setQty(Math.max(1, qty - 1))}
    className="w-12 h-12 rounded-full border-2 border-gray-200 flex items-center justify-center hover:border-blue-500 hover:text-blue-500 transition-colors"
  >
                    <Minus size={20} />
                  </button>
                  <span className="text-2xl font-bold w-12 text-center">{qty}</span>
                  <button
    onClick={() => setQty(Math.min(getMaxAllowedQty(), qty + 1))}
    disabled={qty >= getMaxAllowedQty()}
    className="w-12 h-12 rounded-full border-2 border-gray-200 flex items-center justify-center hover:border-blue-500 hover:text-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>

              {
    /* Drink Options */
  }
              {(selectedMenu.category === "Coffee" || selectedMenu.category === "Non Coffee") && <>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">Type</label>
                    <div className="grid grid-cols-2 gap-3">
                      {["Hot", "Ice"].map((type) => <button
    key={type}
    onClick={() => setDrinkType(type)}
    className={clsx(
      "py-3 rounded-xl font-medium border-2 transition-all",
      drinkType === type ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:border-gray-300"
    )}
  >
                          {type}
                        </button>)}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">Sugar Level</label>
                    <div className="grid grid-cols-2 gap-3">
                      {["No Sugar", "Less", "Normal", "Extra"].map((level) => <button
    key={level}
    onClick={() => setSugarLevel(level)}
    className={clsx(
      "py-3 rounded-xl font-medium border-2 transition-all",
      sugarLevel === level ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:border-gray-300"
    )}
  >
                          {level}
                        </button>)}
                    </div>
                  </div>
                </>}

              {
    /* Addons */
  }
              {selectedMenu.addons && selectedMenu.addons.length > 0 && <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">Add-ons</label>
                  <div className="space-y-2">
                    {selectedMenu.addons.map((addon) => {
    const isSelected = selectedAddons.find((a) => a.menu_id === addon.menu_id);
    const outOfStock = isAddonOutOfStock(addon);
    return <button
      key={addon.menu_id}
      disabled={outOfStock}
      onClick={() => {
        if (isSelected) {
          setSelectedAddons(selectedAddons.filter((a) => a.menu_id !== addon.menu_id));
        } else {
          setSelectedAddons([...selectedAddons, addon]);
        }
      }}
      className={clsx(
        "w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all",
        isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300",
        outOfStock && "opacity-50 cursor-not-allowed"
      )}
    >
                          <div className="flex items-center space-x-3">
                            <div className={clsx(
      "w-6 h-6 rounded border flex items-center justify-center",
      isSelected ? "bg-blue-500 border-blue-500 text-white" : "border-gray-300"
    )}>
                              {isSelected && <Check size={16} />}
                            </div>
                            <span className="font-medium text-gray-800">{addon.name} {outOfStock && <span className="text-xs text-red-500 ml-2">(Out of Stock)</span>}</span>
                          </div>
                          <span className="text-gray-500">+ Rp {Number(addon.price || 0).toLocaleString()}</span>
                        </button>;
  })}
                  </div>
                </div>}
            </div>

            <div className="p-4 border-t bg-gray-50">
              <button
    onClick={handleAddToCart}
    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-blue-200"
  >
                Add to Order - Rp {Number(((selectedMenu.price + selectedAddons.reduce((s, a) => s + a.price, 0)) * qty) || 0).toLocaleString()}
              </button>
            </div>
          </div>
        </div>}

      {
    /* Payment Modal */
  }
      {showPayment && <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold text-gray-800">Payment</h3>
              <button onClick={() => setShowPayment(false)} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="text-center">
                <p className="text-gray-500 font-medium mb-1">Total Amount</p>
                <p className="text-4xl font-black text-gray-800">Rp {Number(totalCart || 0).toLocaleString()}</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">Payment Method</label>
                <div className="grid grid-cols-2 gap-3">
                  {["Cash", "QRIS", "Bank Transfer", "Debit / Credit Card"].map((method) => <button
    key={method}
    onClick={() => {
      setPaymentMethod(method);
      setQrisData(null);
    }}
    className={clsx(
      "py-3 px-4 rounded-xl font-medium border-2 transition-all text-left",
      paymentMethod === method ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:border-gray-300"
    )}
  >
                      {method}
                    </button>)}
                </div>
              </div>

              {paymentMethod === "Cash" && <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Cash Received</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">Rp</span>
                      <input
    type="number"
    value={cashAmount}
    onChange={(e) => setCashAmount(e.target.value)}
    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-lg font-bold"
    placeholder="0"
  />
                    </div>
                  </div>
                  {parseFloat(cashAmount) >= totalCart && <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
                      <span className="text-green-800 font-medium">Change</span>
                      <span className="text-xl font-bold text-green-700">Rp {Number((parseFloat(cashAmount) - totalCart) || 0).toLocaleString()}</span>
                    </div>}
                </div>}

              {paymentMethod === "QRIS" && <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
                  {!qrisData ? <button
    onClick={generateQris}
    className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors"
  >
                      Generate QRIS
                    </button> : <div className="text-center">
                      <div className="w-48 h-48 bg-white border-4 border-blue-500 rounded-xl mx-auto mb-4 flex items-center justify-center">
                        <span className="text-gray-400 font-bold">QR CODE PLACEHOLDER</span>
                      </div>
                      <p className="text-sm text-gray-500 font-mono break-all max-w-xs mx-auto mb-4">{qrisData.qr_string}</p>
                      <div className="inline-flex items-center space-x-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full font-bold text-sm">
                        <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                        <span>Waiting for payment...</span>
                      </div>
                    </div>}
                </div>}
            </div>

            <div className="p-4 border-t bg-gray-50">
              <button
    onClick={processPayment}
    disabled={paymentMethod === "Cash" && (!cashAmount || parseFloat(cashAmount) < totalCart)}
    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-green-200"
  >
                Complete Payment
              </button>
            </div>
          </div>
        </div>}
    </div>;
}
export {
  POS as default
};
