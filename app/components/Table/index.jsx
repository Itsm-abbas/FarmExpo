"use client";
import React, { useState, useMemo } from "react";
import { MdDelete, MdEdit } from "react-icons/md";
import { motion } from "framer-motion";
import fonts from "@utils/fonts";

const ReusableTable = ({
  title,
  headers,
  data,
  onDelete,
  onEdit,
  isLoading,
  addButton,
  noDataMessage = "No data found",
  itemsPerPage = 10,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const getNestedValue = (obj, path) => {
    return path.split(".").reduce((acc, part) => acc?.[part], obj);
  };

  const filteredData = useMemo(() => {
    return data?.filter((item) =>
      headers.some((header) => {
        const val = header.accessor
          ? getNestedValue(item, header.accessor)
          : item[header];
        return val?.toString().toLowerCase().includes(searchTerm.toLowerCase());
      })
    );
  }, [searchTerm, data, headers]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData?.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil((filteredData?.length || 0) / itemsPerPage);

  return (
    <div className="space-y-4 w-full">
      <div
        className={`${fonts.poppins.className} border-2 border-LightBorder dark:border-DarkBorder shadow-md rounded-md p-3 md:p-6 text-LightPText dark:text-DarkPText`}
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
          <h2 className="text-lg sm:text-xl font-semibold capitalize">
            {title}
          </h2>
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="border px-3 py-1 rounded-md text-sm w-full sm:w-64"
          />
        </div>

        {/* Card view for mobile and tablet */}
        <div className="space-y-3 md:hidden ">
          {isLoading
            ? Array.from({ length: itemsPerPage }).map((_, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="border border-LightBorder dark:border-DarkBorder rounded-md p-3 shadow animate-pulse"
                >
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full"></div>
                </motion.div>
              ))
            : paginatedData?.length > 0
            ? paginatedData.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="border border-LightBorder dark:border-DarkBorder rounded-md p-3 shadow"
                >
                  <div className="space-y-1">
                    {headers.slice(1, -1).map((field, idx) => (
                      <div key={idx}>
                        <strong>{field.label || field}:</strong>{" "}
                        {field.accessor
                          ? getNestedValue(item, field.accessor)
                          : item[field]}
                      </div>
                    ))}
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => onEdit(item.id)}
                        className="p-1 rounded bg-blue-500 text-white text-sm"
                      >
                        <MdEdit />
                      </button>
                      <button
                        onClick={() => onDelete(item.id)}
                        className="p-1 rounded bg-red-500 text-white text-sm"
                      >
                        <MdDelete />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            : !isLoading && (
                <div className="text-center text-sm font-medium">
                  {noDataMessage}
                </div>
              )}
        </div>

        {/* Table view for desktop */}
        <div className="hidden md:block">
          <table className="w-full min-w-max text-xs sm:text-sm md:text-base border-collapse border border-LightBorder dark:border-DarkBorder capitalize rounded-lg overflow-hidden shadow-lg">
            <thead>
              <tr className="bg-PrimaryButton text-white">
                {headers.map((header, index) => (
                  <th
                    key={index}
                    className="px-3 sm:px-4 py-2 border border-LightBorder dark:border-DarkBorder text-center"
                  >
                    {header.label || header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: itemsPerPage }).map((_, index) => (
                  <motion.tr
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                  >
                    {headers.map((_, idx) => (
                      <td
                        key={idx}
                        className="border px-3 py-2 text-center animate-pulse"
                      >
                        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded"></div>
                      </td>
                    ))}
                  </motion.tr>
                ))
              ) : paginatedData?.length > 0 ? (
                paginatedData.map((item, index) => (
                  <motion.tr
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    className="hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <td className="px-3 py-2 text-center">{index + 1}</td>
                    {headers.slice(1, -1).map((field, idx) => (
                      <td key={idx} className="px-3 py-2 text-center">
                        {field.accessor
                          ? getNestedValue(item, field.accessor)
                          : item[field]}
                      </td>
                    ))}
                    <td className="px-3 py-2 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => onEdit(item.id)}
                          className="p-1 bg-blue-500 text-white rounded"
                        >
                          <MdEdit />
                        </button>
                        <button
                          onClick={() => onDelete(item.id)}
                          className="p-1 bg-red-500 text-white rounded"
                        >
                          <MdDelete />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={headers.length} className="text-center py-3">
                    {noDataMessage}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 pt-4">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-2 py-1 border rounded disabled:opacity-50"
            >
              Prev
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-2 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {addButton}
    </div>
  );
};

export default ReusableTable;
