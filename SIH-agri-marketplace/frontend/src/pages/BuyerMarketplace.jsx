import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function BuyerMarketplace() {
  const { user } = useAuth();
  const [cart, setCart] = useState([]);
  const [checkoutDone, setCheckoutDone] = useState(false);

  const catalog = [
    { id: 1, name: 'Fresh Farm Tomatoes (Desi)', farmer: 'Ramesh Patel (Guntur)', price: 28, unit: 'KG', minOrder: '5 KG', image: '🍅', freshRating: '98% Prime' },
    { id: 2, name: 'Guntur Sannam Red Chilli', farmer: 'Ramesh Patel (Guntur)', price: 195, unit: 'KG', minOrder: '2 KG', image: '🌶️', freshRating: '99% Grade A' },
    { id: 3, name: 'BPT 5204 Premium Sona Masuri', farmer: 'Kisan Hub (Godavari)', price: 54, unit: 'KG', minOrder: '25 KG', image: '🌾', freshRating: 'Single Origin' },
    { id: 4, name: 'Organic Cold-Pressed Groundnut Oil', farmer: 'Anantapur Co-op', price: 180, unit: 'Litre', minOrder: '5 Litres', image: '🥜', freshRating: 'Lab Tested' },
  ];

  function addToCart(item) {
    setCart([...cart, item]);
    setCheckoutDone(false);
  }

  const totalAmount = cart.reduce((sum, item) => sum + item.price * 5, 0);

  function handleCheckout() {
    setCart([]);
    setCheckoutDone(true);
  }

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-rose-950/60 via-slate-900 to-slate-900 border border-rose-500/30 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
              ROLE: CONSUMER / DIRECT BUYER
            </span>
            <span className="text-xs text-slate-400">
              Delivery to: {user?.profile?.delivery_address || 'Hyderabad, India'}
            </span>
          </div>
          <h1 className="text-2xl font-black text-white">Direct Farm-to-Fork Marketplace</h1>
          <p className="text-xs text-slate-400 mt-1">
            Purchase directly from verified farmers and cold-chain storage with zero middleman price gouging.
          </p>
        </div>

        <div className="px-4 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-right">
          <div className="text-[10px] text-slate-400 font-bold uppercase">Cart Items</div>
          <div className="text-lg font-black text-rose-400">{cart.length} Commodities</div>
        </div>
      </div>

      {checkoutDone && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
          <span>🎉 Order dispatched! Routed to nearest Transporter for direct delivery to: <strong>{user?.profile?.delivery_address || 'Your Address'}</strong></span>
          <button onClick={() => setCheckoutDone(false)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Grid: Produce Catalog + Cart summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Catalog */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-base font-bold text-white">Verified Farm Lots Available for Instant Order</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {catalog.map((item) => (
              <div key={item.id} className="p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-3xl">{item.image}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {item.freshRating}
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-sm">{item.name}</h3>
                  <div className="text-xs text-slate-400 mt-0.5">Farmer: {item.farmer}</div>
                  <div className="text-[11px] text-slate-500 mt-1">Min Order: {item.minOrder}</div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-lg font-black text-emerald-400">₹{item.price}</span>
                    <span className="text-xs text-slate-400">/{item.unit}</span>
                  </div>
                  <button
                    onClick={() => addToCart(item)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20 transition"
                  >
                    + Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Checkout Cart */}
        <div>
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl sticky top-24">
            <h3 className="text-sm font-bold text-white mb-1">Direct Farm Cart</h3>
            <p className="text-xs text-slate-400 mb-4">Direct dispatch from Guntur & Godavari Hubs</p>

            {cart.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                Cart is empty. Click "+ Add to Cart" on any fresh commodity lot.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="divide-y divide-slate-800 max-h-56 overflow-y-auto pr-1">
                  {cart.map((c, i) => (
                    <div key={i} className="py-2.5 flex justify-between items-center text-xs">
                      <div>
                        <div className="font-bold text-white">{c.name}</div>
                        <div className="text-[10px] text-slate-400">5 {c.unit} standard pack</div>
                      </div>
                      <div className="font-bold text-emerald-400">₹{c.price * 5}</div>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-800 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Produce Subtotal</span>
                    <span>₹{totalAmount}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Transporter Logistics (Zero Middleman)</span>
                    <span className="text-emerald-400 font-bold">₹150 Flat</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-slate-800">
                    <span>Total Payable</span>
                    <span className="text-emerald-400">₹{totalAmount + 150}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition"
                >
                  Confirm & Dispatch Order
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
