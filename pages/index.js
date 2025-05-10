import { useEffect, useState } from "react";

export default function Home() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/ebay')
      .then(res => res.json())
      .then(data => {
        setItems(data.items);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">eBay TAG 10 Sales Tracker</h1>

      {loading ? (
        <p className="text-center">Loading latest sold listings...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {items.map((item, idx) => (
            <div key={idx} className="bg-white p-4 rounded-xl shadow">
              <img src={item.img} alt={item.title} className="w-full h-48 object-contain mb-4 rounded" />
              <h2 className="text-lg font-semibold mb-2">{item.title}</h2>
              <p className="text-green-600 font-bold">{item.price}</p>
              <p className="text-sm text-gray-500 mt-1">{item.soldDate}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
