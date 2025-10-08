import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import DataLoader from "@components/Loader/dataLoader";
import { useState } from "react";
import Formatter from "@utils/dateFormat";
import {
  MdDelete,
  MdEdit,
  MdSearch,
  MdFilterList,
  MdDownload,
  MdMoreVert,
} from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";
import { fetchConsignments } from "@constants/consignmentAPI";
import axiosInstance from "@utils/axiosConfig";
import * as XLSX from "xlsx";
import { FaPrint, FaEye, FaFileExport } from "react-icons/fa";

export default function AllConsignments() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: "",
    status: "",
    search: "",
    searchType: "consignee",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(null);

  const { isLoading, error, data } = useQuery({
    queryKey: ["consignments"],
    queryFn: fetchConsignments,
    staleTime: 1000 * 60 * 5,
  });

  if (error) return "An error has occurred: " + error.message;

  const filteredData = data?.filter((item) => {
    const itemDate = new Date(item.date);
    const fromDate = filters.fromDate ? new Date(filters.fromDate) : null;
    const toDate = filters.toDate ? new Date(filters.toDate) : null;

    const matchesDateRange =
      (!fromDate || itemDate >= fromDate) && (!toDate || itemDate <= toDate);

    const matchesStatus = filters.status
      ? item.status === filters.status
      : true;

    let matchesSearch = true;
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      switch (filters.searchType) {
        case "gd":
          matchesSearch = item.goodsDeclaration?.number
            ?.toLowerCase()
            .includes(searchTerm);
          break;
        case "airwaybill":
          matchesSearch = item.airwayBill?.number
            ?.toLowerCase()
            .includes(searchTerm);
          break;
        default:
          matchesSearch = item.consignee?.vendor.name
            ?.toLowerCase()
            .includes(searchTerm);
      }
    }

    return matchesDateRange && matchesStatus && matchesSearch;
  });

  const exportToExcel = () => {
    if (!filteredData || filteredData.length === 0) {
      Swal.fire({
        title: "No Data",
        text: "There's no data to export",
        icon: "info",
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
        confirmButtonColor: "rgb(var(--color-primary))",
      });
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(
      filteredData.map((item) => ({
        "Consignment ID": item.id,
        Date: Formatter.formatDate(item?.date),
        Consignee: item.consignee?.vendor.name,
        Destination: item.consignee?.vendor.address,
        "GD Number": item.goodsDeclaration?.number,
        "Airway Bill": item.airwayBill?.number,
        "Commercial Invoice": item.goodsDeclaration?.commercialInvoiceNumber,
        Commodity:
          item?.goods.length > 1
            ? "Multiple Items"
            : item?.goods[0]?.commodityItem.name,
        Status: item?.status,
        "Recovery Amount": item?.recoveryDone?.amount,
        Currency: item?.recoveryDone?.currency,
        "Exchange Rate": item?.recoveryDone?.exchangeRate,
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Consignments");
    XLSX.writeFile(
      workbook,
      `Consignments_Export_${new Date().toISOString().split("T")[0]}.xlsx`
    );

    Swal.fire({
      title: "Export Successful!",
      text: `${filteredData.length} consignments exported to Excel`,
      icon: "success",
      background: "rgb(var(--color-background))",
      color: "rgb(var(--color-text))",
      confirmButtonColor: "rgb(var(--color-primary))",
    });
  };

  const deleteConsignmentMutation = useMutation({
    mutationFn: async (id) => {
      await axiosInstance.delete(`/consignment/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["consignments"]);
      Swal.fire({
        position: "top-center",
        icon: "success",
        title: "Deleted Successfully!",
        text: "Consignment has been removed from the system.",
        showConfirmButton: false,
        timer: 2000,
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
        iconColor: "rgb(var(--color-primary))",
      });
    },
    onError: (error) => {
      Swal.fire({
        title: "Error!",
        text: error.message,
        icon: "error",
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
        confirmButtonColor: "rgb(var(--color-primary))",
      });
    },
  });

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This will permanently delete the consignment record. This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "rgb(var(--color-accent))",
      cancelButtonColor: "rgb(var(--color-primary))",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      background: "rgb(var(--color-background))",
      color: "rgb(var(--color-text))",
    });

    if (result.isConfirmed) {
      deleteConsignmentMutation.mutate(id);
    }
  };

  const clearFilters = () => {
    setFilters({
      fromDate: "",
      toDate: "",
      status: "",
      search: "",
      searchType: "consignee",
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-600 border-yellow-500/30";
      case "fulfilled":
        return "bg-green-500/20 text-green-600 border-green-500/30";
      case "in progress":
        return "bg-blue-500/20 text-blue-600 border-blue-500/30";
      case "cancelled":
        return "bg-red-500/20 text-red-600 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-600 border-gray-500/30";
    }
  };

  const toggleMobileMenu = (id) => {
    setMobileMenuOpen(mobileMenuOpen === id ? null : id);
  };

  return (
    <motion.div
      className="min-h-screen bg-background py-4 sm:py-8 px-3 sm:px-4 lg:px-8 w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 ">
        {/* Header Section */}
        <motion.div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <motion.button
              onClick={() => setShowFilters(!showFilters)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl border border-primary/20 bg-background text-text font-poppins font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-primary/5 text-sm sm:text-base"
            >
              <MdFilterList className="text-lg" />
              <span className="">Filters</span>
            </motion.button>

            <motion.button
              onClick={exportToExcel}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl bg-primary text-white font-poppins font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-primary/90 text-sm sm:text-base"
            >
              <FaFileExport className="text-lg" />
              <span className="">Export Excel</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Filters Section */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              className="bg-background rounded-xl sm:rounded-2xl border border-primary/20 shadow-lg p-4 sm:p-6 space-y-4"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-text font-poppins flex items-center gap-2 text-sm sm:text-base">
                  <MdFilterList className="text-primary" />
                  Filter Consignments
                </h3>
                <button
                  onClick={clearFilters}
                  className="text-xs sm:text-sm text-primary hover:text-primary/80 font-inter transition-colors"
                >
                  Clear All
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="space-y-1 sm:space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-text font-poppins">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={filters.fromDate}
                    onChange={(e) =>
                      setFilters({ ...filters, fromDate: e.target.value })
                    }
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-background border border-primary/20 rounded-lg sm:rounded-xl text-text placeholder-text/50 focus:ring-2 focus:ring-primary/50 outline-none focus:border-primary transition-all duration-200 font-inter text-sm"
                  />
                </div>

                <div className="space-y-1 sm:space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-text font-poppins">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={filters.toDate}
                    onChange={(e) =>
                      setFilters({ ...filters, toDate: e.target.value })
                    }
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-background border border-primary/20 rounded-lg sm:rounded-xl text-text placeholder-text/50 focus:ring-2 focus:ring-primary/50 outline-none focus:border-primary transition-all duration-200 font-inter text-sm"
                  />
                </div>

                <div className="space-y-1 sm:space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-text font-poppins">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) =>
                      setFilters({ ...filters, status: e.target.value })
                    }
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-background border border-primary/20 rounded-lg sm:rounded-xl text-text focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 font-inter text-sm"
                  >
                    <option value="">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Fulfilled">Fulfilled</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="space-y-1 sm:space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-text font-poppins">
                    Search Type
                  </label>
                  <select
                    value={filters.searchType}
                    onChange={(e) =>
                      setFilters({ ...filters, searchType: e.target.value })
                    }
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-background border border-primary/20 rounded-lg sm:rounded-xl text-text focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 font-inter text-sm"
                  >
                    <option value="consignee">By Consignee</option>
                    <option value="gd">By GD Number</option>
                    <option value="airwaybill">By Airway Bill</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1 sm:space-y-2">
                <label className="text-xs sm:text-sm font-medium text-text font-poppins">
                  Search
                </label>
                <div className="relative">
                  <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text/50 text-base sm:text-lg" />
                  <input
                    type="text"
                    placeholder={`Search by ${
                      filters.searchType === "gd"
                        ? "GD Number"
                        : filters.searchType === "airwaybill"
                        ? "Airway Bill"
                        : "Consignee Name"
                    }`}
                    value={filters.search}
                    onChange={(e) =>
                      setFilters({ ...filters, search: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-2 sm:py-2.5 bg-background border border-primary/20 rounded-lg sm:rounded-xl text-text placeholder-text/50 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 font-inter text-sm outline-none"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Summary */}
        <motion.div
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-text/70 font-inter text-sm sm:text-base">
            Showing{" "}
            <span className="font-semibold text-text">
              {filteredData?.length || 0}
            </span>{" "}
            consignments
          </p>
          {filters.search && (
            <p className="text-xs sm:text-sm text-text/60 font-inter">
              Filtered by: "{filters.search}"
            </p>
          )}
        </motion.div>

        {/* Desktop Table */}
        {!isLoading && (
          <div className="hidden lg:block">
            <motion.div
              className="bg-background rounded-2xl border border-primary/20 shadow-lg overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-primary text-white font-poppins">
                      {[
                        "#",
                        "Date",
                        "Consignee",
                        "Destination",
                        "Status",
                        "Actions",
                      ].map((header, index) => (
                        <th
                          key={index}
                          className="px-4 py-4 text-left font-semibold text-sm uppercase tracking-wider"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary/10">
                    <AnimatePresence>
                      {filteredData?.length > 0 ? (
                        filteredData.map((item, index) => (
                          <motion.tr
                            key={item.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className="hover:bg-primary/5 transition-colors duration-200 group"
                          >
                            <td className="px-4 py-4 font-inter text-text font-medium">
                              {index + 1}
                            </td>
                            <td className="px-4 py-4 font-inter text-text">
                              {Formatter.formatDate(item?.date)}
                            </td>
                            <td className="px-4 py-4 font-inter text-text font-medium">
                              {item.consignee?.vendor.name || "N/A"}
                            </td>
                            <td className="px-4 py-4 font-inter text-text/80">
                              {item.consignee?.vendor.address || "N/A"}
                            </td>
                            <td className="px-4 py-4">
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                                  item?.status
                                )}`}
                              >
                                {item?.status || "Unknown"}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <motion.button
                                  onClick={() =>
                                    router.push(`/invoice/${item.id}`)
                                  }
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  className="p-2 rounded-lg bg-gray-500 text-white hover:bg-gray-600 transition-colors duration-200 tooltip"
                                  title="Print Invoice"
                                >
                                  <FaPrint className="text-sm" />
                                </motion.button>

                                <motion.button
                                  onClick={() =>
                                    router.push(`/startconsignment/${item?.id}`)
                                  }
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  className="p-2 rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors duration-200 tooltip"
                                  title="Edit Consignment"
                                >
                                  <MdEdit className="text-sm" />
                                </motion.button>

                                <motion.button
                                  onClick={() => handleDelete(item.id)}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  className="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors duration-200 tooltip"
                                  title="Delete Consignment"
                                >
                                  <MdDelete className="text-sm" />
                                </motion.button>
                              </div>
                            </td>
                          </motion.tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="px-4 py-12 text-center">
                            <div className="flex flex-col items-center space-y-3">
                              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                                <MdSearch className="text-2xl text-primary" />
                              </div>
                              <p className="text-text/70 font-inter">
                                No consignments found matching your criteria
                              </p>
                              <button
                                onClick={clearFilters}
                                className="text-primary hover:text-primary/80 font-medium transition-colors"
                              >
                                Clear filters to see all consignments
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        )}

        {/* Mobile Cards */}
        {!isLoading && (
          <div className="lg:hidden space-y-3 ">
            <AnimatePresence>
              {filteredData?.length > 0 ? (
                filteredData.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="bg-background rounded-xl border border-primary/20 shadow-lg p-4 space-y-3"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-text text-sm">
                            #{item.id}
                          </h3>
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                              item?.status
                            )}`}
                          >
                            {item?.status || "Unknown"}
                          </span>
                        </div>
                        <p className="text-text/80 text-xs">
                          {Formatter.formatDate(item?.date)}
                        </p>
                      </div>

                      {/* Mobile Menu */}
                      <div className="relative">
                        <button
                          onClick={() => toggleMobileMenu(item.id)}
                          className="p-1 rounded-lg hover:bg-primary/10 transition-colors"
                        >
                          <MdMoreVert className="text-text/60" />
                        </button>

                        <AnimatePresence>
                          {mobileMenuOpen === item.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className="absolute right-0 top-8 bg-background border border-primary/20 rounded-lg shadow-lg z-10 min-w-[120px]"
                            >
                              <button
                                onClick={() => {
                                  router.push(`/invoice/${item.id}`);
                                  setMobileMenuOpen(null);
                                }}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text hover:bg-primary/5 transition-colors"
                              >
                                <FaPrint className="text-xs" />
                                Print
                              </button>
                              <button
                                onClick={() => {
                                  router.push(`/startconsignment/${item?.id}`);
                                  setMobileMenuOpen(null);
                                }}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text hover:bg-primary/5 transition-colors"
                              >
                                <MdEdit className="text-xs" />
                                Edit
                              </button>
                              <button
                                onClick={() => {
                                  handleDelete(item.id);
                                  setMobileMenuOpen(null);
                                }}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-500/5 transition-colors"
                              >
                                <MdDelete className="text-xs" />
                                Delete
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-text/60 font-medium">
                          Consignee
                        </p>
                        <p className="text-sm text-text font-medium">
                          {item.consignee?.vendor.name || "N/A"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-text/60 font-medium">
                          Destination
                        </p>
                        <p className="text-sm text-text/80">
                          {item.consignee?.vendor.address || "N/A"}
                        </p>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex items-center gap-2 pt-2 border-t border-primary/10">
                        <motion.button
                          onClick={() => router.push(`/invoice/${item.id}`)}
                          whileTap={{ scale: 0.95 }}
                          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-gray-500 text-white rounded-lg text-xs font-medium transition-colors"
                        >
                          <FaPrint className="text-xs" />
                          Invoice
                        </motion.button>

                        <motion.button
                          onClick={() =>
                            router.push(`/startconsignment/${item?.id}`)
                          }
                          whileTap={{ scale: 0.95 }}
                          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-accent text-white rounded-lg text-xs font-medium transition-colors"
                        >
                          <MdEdit className="text-xs" />
                          Edit
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-background rounded-xl border border-primary/20 shadow-lg p-6 text-center"
                >
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <MdSearch className="text-xl text-primary" />
                    </div>
                    <p className="text-text/70 font-inter text-sm">
                      No consignments found matching your criteria
                    </p>
                    <button
                      onClick={clearFilters}
                      className="text-primary hover:text-primary/80 font-medium transition-colors text-sm"
                    >
                      Clear filters to see all consignments
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-8">
            <DataLoader />
          </div>
        )}
      </div>
    </motion.div>
  );
}
