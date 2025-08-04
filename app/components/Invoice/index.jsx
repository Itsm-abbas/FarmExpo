"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useReactToPrint } from "react-to-print";
import { motion } from "framer-motion";
import fonts from "@utils/fonts";

export default function Invoice() {
  const { id } = useParams();
  const printRef = useRef();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/consignment/${id}`);
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
  });

  if (loading) return <p className="text-center mt-10">Loading Invoice...</p>;

  return (
    <div className={`${fonts.poppins.className} min-h-screen py-8 px-4 md:px-8 bg-gray-100 dark:bg-gray-800 text-LightPText dark:text-DarkPText`}> 
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white dark:bg-gray-900 shadow-lg rounded-lg p-6 w-full max-w-3xl mx-auto"
      >
        <div ref={printRef} className="p-6">
          <h1 className="text-3xl font-bold text-center mb-4">Invoice</h1>
          <p className="text-center text-sm text-gray-500">Consignment ID: {data.id}</p>
          
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div>
              <h2 className="font-semibold">Trader Information</h2>
              <p>{data.trader?.name}</p>
              <p>{data.trader?.address}</p>
              <p>{data.trader?.country}</p>
            </div>
            <div>
              <h2 className="font-semibold">Consignee Information</h2>
              <p>{data.consignee?.name}</p>
              <p>{data.consignee?.address}</p>
              <p>{data.consignee?.country}</p>
            </div>
          </div>

          <h2 className="font-semibold mt-6">Goods</h2>
          <table className="w-full border-collapse border mt-2 text-sm">
            <thead>
              <tr className="bg-gray-200 dark:bg-gray-700">
                <th className="border px-3 py-2">Item</th>
                <th className="border px-3 py-2">Quantity</th>
                <th className="border px-3 py-2">Weight</th>
                <th className="border px-3 py-2">Damage</th>
              </tr>
            </thead>
            <tbody>
              {data.goods.map((good) => (
                <tr key={good.id}>
                  <td className="border px-3 py-2">{good.item.name}</td>
                  <td className="border px-3 py-2">{good.quantity}</td>
                  <td className="border px-3 py-2">{good.weightPerUnit} kg</td>
                  <td className="border px-3 py-2">{good.damage}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end mt-6">
            <motion.button
              onClick={handlePrint}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-PrimaryButton hover:bg-PrimaryButtonHover text-white px-6 py-2 rounded-md"
            >
              Print Invoice
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
