"use client";
import React, { useState, useMemo } from "react";
import {
  MdDelete,
  MdEdit,
  MdSearch,
  MdExpandMore,
  MdExpandLess,
} from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";
import Input from "@components/Input";

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
  showSearch = true,
  showPagination = true,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState(null);

  const getNestedValue = (obj, path) => {
    return path.split(".").reduce((acc, part) => acc?.[part], obj);
  };

  const filteredData = useMemo(() => {
    if (!data) return [];

    return data.filter((item) =>
      headers.some((header) => {
        if (typeof header === "string") return false;
        const val = header.accessor
          ? getNestedValue(item, header.accessor)
          : item[header.key];
        return val?.toString().toLowerCase().includes(searchTerm.toLowerCase());
      })
    );
  }, [searchTerm, data, headers]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData?.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil((filteredData?.length || 0) / itemsPerPage);

  const toggleRow = (index) => {
    setExpandedRow(expandedRow === index ? null : index);
  };

  const formatValue = (value, format) => {
    if (value === null || value === undefined) return "N/A";

    switch (format) {
      case "date":
        return new Date(value).toLocaleDateString();
      case "currency":
        return new Intl.NumberFormat(undefined, {}).format(value);
      case "number":
        return new Intl.NumberFormat().format(value);
      default:
        return value?.toString() || "N/A";
    }
  };

  return (
    <div className="space-y-6 w-full">
      <div className="bg-background rounded-2xl border border-primary/20 shadow-lg overflow-hidden">
        {/* Header Section */}
        <div className="p-6 border-b border-primary/10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold font-poppins text-text capitalize">
                {title}
              </h2>
              <p className="text-text/70 font-inter mt-1">
                {filteredData.length} items found
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {showSearch && (
                <div className="relative">
                  {/* <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text/50 text-lg" /> */}
                  <Input
                    type="text"
                    icon={MdSearch}
                    placeholder="Search..."
                    classes="w-64 sm:w-80 "
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6">
          {/* Mobile Card View */}
          <div className="space-y-4 md:hidden">
            <AnimatePresence>
              {isLoading
                ? Array.from({ length: 3 }).map((_, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="border border-primary/20 rounded-xl p-4 animate-pulse"
                    >
                      <div className="h-4 bg-primary/20 rounded w-1/2 mb-3"></div>
                      <div className="space-y-2">
                        <div className="h-3 bg-primary/20 rounded w-full"></div>
                        <div className="h-3 bg-primary/20 rounded w-3/4"></div>
                      </div>
                    </motion.div>
                  ))
                : paginatedData?.length > 0
                ? paginatedData.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="border border-primary/20 rounded-xl p-4 bg-background hover:bg-primary/5 transition-colors duration-200"
                    >
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleRow(index)}
                      >
                        <div className="flex-1">
                          <h3 className="font-semibold text-text font-poppins">
                            {headers[1]?.accessor
                              ? getNestedValue(item, headers[1].accessor)
                              : item[headers[1]?.key]}
                          </h3>
                          <p className="text-text/70 text-sm font-inter">
                            {headers[2]?.accessor
                              ? getNestedValue(item, headers[2].accessor)
                              : item[headers[2]?.key]}
                          </p>
                        </div>
                        <button className="text-primary">
                          {expandedRow === index ? (
                            <MdExpandLess size={20} />
                          ) : (
                            <MdExpandMore size={20} />
                          )}
                        </button>
                      </div>

                      <AnimatePresence>
                        {expandedRow === index && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 space-y-2 border-t border-primary/10 pt-4"
                          >
                            {headers.slice(2, -1).map((field, idx) => (
                              <div
                                key={idx}
                                className="flex justify-between text-sm"
                              >
                                <span className="font-medium text-text/70">
                                  {field.label}:
                                </span>
                                <span className="text-text font-inter">
                                  {formatValue(
                                    field.accessor
                                      ? getNestedValue(item, field.accessor)
                                      : item[field.key],
                                    field.format
                                  )}
                                </span>
                              </div>
                            ))}
                            <div className="flex gap-2 pt-2">
                              <motion.button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEdit(item.id);
                                }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="flex items-center gap-1 px-3 py-1.5 bg-accent text-white rounded-lg text-sm font-medium transition-colors hover:bg-accent/90"
                              >
                                <MdEdit size={14} />
                                Edit
                              </motion.button>
                              <motion.button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDelete(item.id);
                                }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm font-medium transition-colors hover:bg-red-600"
                              >
                                <MdDelete size={14} />
                                Delete
                              </motion.button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))
                : !isLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-8"
                    >
                      <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-3">
                        <MdSearch className="text-2xl text-primary" />
                      </div>
                      <p className="text-text/70 font-inter">{noDataMessage}</p>
                    </motion.div>
                  )}
            </AnimatePresence>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block">
            <div className="overflow-x-auto rounded-lg border border-primary/20">
              <table className="w-full">
                <thead>
                  <tr className="bg-primary text-white font-poppins">
                    {headers.map((header, index) => (
                      <th
                        key={index}
                        className="px-4 py-3 text-left font-semibold text-sm uppercase tracking-wider"
                      >
                        {header.label || header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/10">
                  <AnimatePresence>
                    {isLoading ? (
                      Array.from({ length: itemsPerPage }).map((_, index) => (
                        <motion.tr
                          key={index}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          {headers.map((_, idx) => (
                            <td key={idx} className="px-4 py-3 animate-pulse">
                              <div className="h-4 bg-primary/20 rounded"></div>
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
                          exit={{ opacity: 0, y: -10 }}
                          className="hover:bg-primary/5 transition-colors duration-200 group"
                        >
                          <td className="px-4 py-3 font-inter text-text font-medium">
                            {(currentPage - 1) * itemsPerPage + index + 1}
                          </td>
                          {headers.slice(1, -1).map((field, idx) => (
                            <td
                              key={idx}
                              className="px-4 py-3 font-inter text-text"
                            >
                              {formatValue(
                                field.accessor
                                  ? getNestedValue(item, field.accessor)
                                  : item[field.key],
                                field.format
                              )}
                            </td>
                          ))}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <motion.button
                                onClick={() => onEdit(item.id)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="p-2 rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors duration-200"
                                title="Edit"
                              >
                                <MdEdit size={16} />
                              </motion.button>
                              <motion.button
                                onClick={() => onDelete(item.id)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors duration-200"
                                title="Delete"
                              >
                                <MdDelete size={16} />
                              </motion.button>
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={headers.length}
                          className="px-4 py-8 text-center"
                        >
                          <div className="flex flex-col items-center space-y-3">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                              <MdSearch className="text-2xl text-primary" />
                            </div>
                            <p className="text-text/70 font-inter">
                              {noDataMessage}
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {showPagination && totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-primary/10">
              <p className="text-text/70 font-inter text-sm">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, filteredData.length)} of{" "}
                {filteredData.length} entries
              </p>

              <div className="flex items-center gap-2">
                <motion.button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 border border-primary/20 rounded-xl text-text font-inter disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/5 transition-colors duration-200"
                >
                  Previous
                </motion.button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page =
                      currentPage <= 3
                        ? i + 1
                        : currentPage >= totalPages - 2
                        ? totalPages - 4 + i
                        : currentPage - 2 + i;

                    if (page < 1 || page > totalPages) return null;

                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 rounded-xl font-inter transition-colors duration-200 ${
                          currentPage === page
                            ? "bg-primary text-white"
                            : "text-text hover:bg-primary/10"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>

                <motion.button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 border border-primary/20 rounded-xl text-text font-inter disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/5 transition-colors duration-200"
                >
                  Next
                </motion.button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Button */}
      {addButton && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {addButton}
        </motion.div>
      )}
    </div>
  );
};

export default ReusableTable;
