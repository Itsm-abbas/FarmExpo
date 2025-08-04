import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import DataLoader from "@components/Loader/dataLoader";
import { useState } from "react";
import Formatter from "@utils/dateFormat";
import fonts from "@utils/fonts";
import { MdDelete, MdEdit } from "react-icons/md";
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import { fetchConsignments } from "@constants/consignmentAPI";
import axiosInstance from "@utils/axiosConfig";
import * as XLSX from "xlsx";
import { FaPrint } from "react-icons/fa";

export default function AllConsignments() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: "",
    status: "",
    search: "",
    searchType: "consignee", // Default to search by consignee
  });

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

    // Date range filter
    const matchesDateRange =
      (!fromDate || itemDate >= fromDate) && (!toDate || itemDate <= toDate);

    // Status filter
    const matchesStatus = filters.status
      ? item.status === filters.status
      : true;

    // Search filter
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
        default: // consignee
          matchesSearch = item.consignee?.name
            ?.toLowerCase()
            .includes(searchTerm);
      }
    }

    return matchesDateRange && matchesStatus && matchesSearch;
  });

  // Excel export function
  const exportToExcel = () => {
    if (!filteredData || filteredData.length === 0) {
      Swal.fire("No Data", "There's no data to export", "info");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(
      filteredData.map((item) => ({
        Date: item?.goodsDeclaration?.date,
        "Invoice No": item?.goodsDeclaration?.commercialInvoiceNumber,
        Commodity:
          item?.goods.length > 1 ? "Mix Veg" : item?.goods[0]?.item.name,
        "AWB/BL NO": item?.airwayBill?.number,
        "Container NO": "",
        "Local Invoice PKR": "",
        Sale: item?.recoveryDone?.amount,
        Currency: item?.recoveryDone?.currency,
        "Exchange Rate": item?.recoveryDone?.exchangeRate,
        "Total Value": "",
        "P/L": "",
        Status: item?.status,
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Consignments");
    XLSX.writeFile(
      workbook,
      `Consignments_${new Date().toISOString().split("T")[0]}.xlsx`
    );
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
        title: "Deleted!",
        showConfirmButton: false,
        timer: 1000,
      });
    },
    onError: (error) => {
      Swal.fire("Error!", error.message, "error");
    },
  });

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you really want to delete this consignment? This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      deleteConsignmentMutation.mutate(id);
    }
  };

  return (
    <motion.div
      className={`py-6 ${fonts.lato.className}  w-full sm:w-auto sm:px-6 lg:px-8`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col gap-8">
        <h1 className="text-2xl sm:text-3xl font-bold">All Consignments</h1>

        {/* Enhanced Filter Section */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <input
                type="date"
                placeholder="From Date"
                value={filters.fromDate}
                onChange={(e) =>
                  setFilters({ ...filters, fromDate: e.target.value })
                }
                className="p-2 border rounded dark:bg-DarkSBg dark:border-DarkBorder focus-within:outline-none"
              />
              <input
                type="date"
                placeholder="To Date"
                value={filters.toDate}
                onChange={(e) =>
                  setFilters({ ...filters, toDate: e.target.value })
                }
                className="p-2 border rounded dark:bg-DarkSBg dark:border-DarkBorder focus-within:outline-none"
              />
            </div>

            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
              className="p-2 border rounded dark:bg-DarkSBg dark:border-DarkBorder focus-within:outline-none flex-1"
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Fulfilled">Fulfilled</option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <select
              value={filters.searchType}
              onChange={(e) =>
                setFilters({ ...filters, searchType: e.target.value })
              }
              className="p-2 border rounded dark:bg-DarkSBg dark:border-DarkBorder focus-within:outline-none"
            >
              <option value="consignee">Search by Consignee</option>
              <option value="gd">Search by GD Number</option>
              <option value="airwaybill">Search by Airway Bill</option>
            </select>

            <input
              type="text"
              placeholder={`Search by ${
                filters.searchType === "gd"
                  ? "GD Number"
                  : filters.searchType === "airwaybill"
                  ? "Airway Bill"
                  : "Consignee"
              }`}
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              className="p-2 border rounded dark:bg-DarkSBg dark:border-DarkBorder focus-within:outline-none flex-1"
            />
          </div>
        </div>

        {/* Export Button */}
        <div className="flex justify-end">
          <button
            onClick={exportToExcel}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
          >
            Export to Excel
          </button>
        </div>

        {/* Table Section */}
        {isLoading && <DataLoader />}
        {!isLoading && (
          <motion.div
            className="overflow-x-auto shadow-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <table className="w-full min-w-max text-xs sm:text-sm md:text-base border-collapse border border-LightBorder dark:border-DarkBorder capitalize rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-PrimaryButton text-white">
                  {[
                    "No",
                    "Date",
                    "Consignee",
                    "Destination",
                    "Status",
                    "Actions",
                  ].map((item, index) => (
                    <th
                      key={index}
                      className="px-3 sm:px-6 md:px-8 py-2 border border-LightBorder dark:border-DarkBorder text-center"
                    >
                      {item}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredData?.length > 0 ? (
                  filteredData.map((item, index) => (
                    <motion.tr
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.2 }}
                      className="hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                    >
                      <td className="border border-LightBorder dark:border-DarkBorder sm:px-4 py-1 sm:py-2 text-center">
                        {index + 1}
                      </td>
                      <td className="border border-LightBorder dark:border-DarkBorder sm:px-4 py-1 sm:py-2 text-center">
                        {item?.date.slice(0, 10)}
                      </td>
                      <td className="border border-LightBorder dark:border-DarkBorder sm:px-4 py-1 sm:py-2 text-center">
                        {item.consignee?.vendor.name}
                      </td>
                      <td className="border border-LightBorder dark:border-DarkBorder sm:px-4 py-1 sm:py-2 text-center">
                        {item?.consignee?.vendor.address}
                      </td>
                      <td className="border border-LightBorder dark:border-DarkBorder sm:px-4 py-1 sm:py-2 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            item?.status === "Pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : item?.status === "Fulfilled"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {item?.status || "N/A"}
                        </span>
                      </td>
                      <td className="border border-LightBorder dark:border-DarkBorder sm:px-4 py-1 sm:py-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => router.push(`/invoice/${item.id}`)}
                            className="p-1 sm:p-2 rounded-md bg-gray-500 text-white hover:bg-gray-600 transition text-base sm:text-lg"
                          >
                            <FaPrint />
                          </button>
                          <button
                            onClick={() =>
                              router.push(`/startconsignment/${item?.id}`)
                            }
                            className="p-1 sm:p-2 rounded-md bg-SecondaryButton text-white hover:bg-SecondaryButtonHover transition text-base sm:text-lg"
                          >
                            <MdEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1 sm:p-2 rounded-md bg-red-500 text-white hover:bg-red-600 transition text-base sm:text-lg"
                          >
                            <MdDelete />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr className="text-center">
                    <td colSpan="6" className="py-4 text-gray-500">
                      No consignments found matching your filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
