"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Swal from "sweetalert2";
import DataLoader from "@components/Loader/dataLoader";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Input from "@components/Input";
import { getCookie } from "cookies-next";
import {
  FaArrowRight,
  FaEdit,
  FaTrash,
  FaPlus,
  FaBox,
  FaWeight,
  FaMoneyBill,
  FaTag,
  FaSearch,
  FaFilter,
} from "react-icons/fa";
import { useQuery } from "@tanstack/react-query";
import {
  fetchConsignmentById,
  fetchConsignments,
} from "@constants/consignmentAPI";

export default function ItemSelectionPage() {
  const router = useRouter();
  const token = getCookie("token");
  const { id } = useParams();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState({});
  const [showDetailInput, setShowDetailInput] = useState(false);
  const [showDetailsView, setShowDetailsView] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [currentDetailIndex, setCurrentDetailIndex] = useState(null);
  const [itemDetail, setItemDetail] = useState({
    qty: "",
    weightPerUnit: "",
    commodityPerUnitCost: "",
    packagingPerUnitCost: "",
    packaging: null,
  });

  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSelected, setFilterSelected] = useState("all"); // "all", "selected", "unselected"

  const {
    data: items = [],
    isLoading: isLoadingCommodities,
    error: commoditiesError,
  } = useQuery({
    queryKey: ["commodities"],
    queryFn: async () => {
      const res = await fetch(`/api/commodity`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch commodities");
      return res.json();
    },
  });

  const {
    data: packagingOptions = [],
    isLoading: isLoadingPackaging,
    error: packagingError,
  } = useQuery({
    queryKey: ["packaging"],
    queryFn: async () => {
      const res = await fetch(`/api/packaging`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch packaging");
      return res.json();
    },
  });

  const {
    isLoading: isLoadingGoods,
    data: goods,
    refetch,
    error: consignmentError,
  } = useQuery({
    queryKey: ["consignments", id],
    queryFn: () => fetchConsignmentById(id),
    select: (data) => data?.goods || [],
  });

  useEffect(() => {
    if (!goods) return;
    const existingItems = goods.reduce((acc, good) => {
      if (!acc[good.commodityItem.id]) acc[good.commodityItem.id] = [];
      acc[good.commodityItem.id].push({
        id: good.id,
        quantity: good.quantity,
        weightPerUnit: good.weightPerUnit,
        commodityPerUnitCost: good.commodityPerUnitCost,
        packagingPerUnitCost: good.packagingPerUnitCost,
        packaging: good.packaging,
        damage: good.damage,
      });
      return acc;
    }, {});
    setSelectedItems(existingItems);
  }, [goods]);

  useEffect(() => {
    if (commoditiesError || packagingError || consignmentError) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          commoditiesError?.message ||
          packagingError?.message ||
          consignmentError?.message ||
          "Something went wrong",
      });
    }
  }, [commoditiesError, packagingError, consignmentError]);

  const isLoading =
    isLoadingCommodities || isLoadingPackaging || isLoadingGoods;

  // Filter items based on search and filter criteria
  const filteredItems = items.filter((item) => {
    // Search filter
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.number.toLowerCase().includes(searchTerm.toLowerCase());

    // Selection filter
    const isSelected = selectedItems[item.id]?.length > 0;

    if (filterSelected === "selected") {
      return matchesSearch && isSelected;
    } else if (filterSelected === "unselected") {
      return matchesSearch && !isSelected;
    }

    return matchesSearch; // "all" filter
  });

  // Get stats for the filter buttons
  const getFilterStats = () => {
    const totalItems = items.length;
    const selectedItemsCount = items.filter(
      (item) => selectedItems[item.id]?.length > 0
    ).length;
    const unselectedItemsCount = totalItems - selectedItemsCount;

    return { totalItems, selectedItemsCount, unselectedItemsCount };
  };

  const { totalItems, selectedItemsCount, unselectedItemsCount } =
    getFilterStats();

  const handleItemSelect = (item) => {
    setCurrentItem(item);
    if (selectedItems[item.id]?.length > 0) {
      setShowDetailsView(true);
    } else {
      setShowDetailInput(true);
      setItemDetail({
        qty: "",
        weightPerUnit: "",
        commodityPerUnitCost: "",
        packagingPerUnitCost: "",
        packaging: null,
      });
    }
  };

  const handleAddNewDetail = () => {
    setCurrentDetailIndex(null);
    setShowDetailInput(true);
    setShowDetailsView(false);
    setItemDetail({
      qty: "",
      weightPerUnit: "",
      commodityPerUnitCost: "",
      packagingPerUnitCost: "",
      packaging: null,
    });
  };

  const handleEditDetail = (index) => {
    setCurrentDetailIndex(index);
    setShowDetailInput(true);
    setShowDetailsView(false);
    setItemDetail({
      qty: selectedItems[currentItem.id][index].quantity,
      weightPerUnit: selectedItems[currentItem.id][index].weightPerUnit,
      commodityPerUnitCost:
        selectedItems[currentItem.id][index].commodityPerUnitCost,
      packagingPerUnitCost:
        selectedItems[currentItem.id][index].packagingPerUnitCost,
      packaging: selectedItems[currentItem.id][index].packaging,
    });
  };

  const handleDeleteDetail = async (detailId) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        const deleteResponse = await fetch(`/api/consignmentitem/${detailId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!deleteResponse.ok) throw new Error("Failed to delete item");

        const response = await fetch(`/api/consignment/${id}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok)
          throw new Error("Failed to fetch updated consignment");

        const updatedConsignment = await response.json();

        const existingItems = updatedConsignment.goods?.reduce((acc, good) => {
          if (!acc[good.commodityItem.id]) {
            acc[good.commodityItem.id] = [];
          }
          acc[good.commodityItem.id].push({
            id: good.id,
            quantity: good.quantity,
            weightPerUnit: good.weightPerUnit,
            commodityPerUnitCost: good.commodityPerUnitCost,
            packagingPerUnitCost: good.packagingPerUnitCost,
            packaging: good.packaging,
            damage: good.damage,
          });
          return acc;
        }, {});

        setSelectedItems(existingItems || {});

        Swal.fire({
          position: "top-center",
          icon: "success",
          title: "Detail removed!",
          showConfirmButton: false,
          timer: 1000,
        });
      } catch (error) {
        Swal.fire({ icon: "error", title: "Error", text: error.message });
      }
    }
  };

  const handleItemDetail = async () => {
    refetch();
    if (currentItem) {
      setSubmitLoading(true);
      try {
        const itemData = {
          commodityItem: { id: currentItem.id },
          consignmentId: id,
          quantity: parseFloat(itemDetail.qty) || 0,
          weightPerUnit: parseFloat(itemDetail.weightPerUnit) || 0,
          commodityPerUnitCost:
            parseFloat(itemDetail.commodityPerUnitCost) || 0,
          packagingPerUnitCost:
            parseFloat(itemDetail.packagingPerUnitCost) || 0,
          packaging: itemDetail.packaging,
          damage: 0,
        };

        const consignmentRes = await fetch(`/api/consignment/${id}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!consignmentRes.ok) throw new Error("Failed to fetch consignment");
        const consignmentData = await consignmentRes.json();

        let existingItemId = null;
        if (currentDetailIndex !== null) {
          existingItemId = selectedItems[currentItem.id][currentDetailIndex].id;
        }

        const method = existingItemId ? "PUT" : "POST";
        const url = existingItemId
          ? `/api/consignmentitem/${existingItemId}`
          : `/api/consignmentitem`;

        const itemResponse = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(itemData),
        });

        if (!itemResponse.ok) throw new Error("Failed to save item");
        const savedItem = await itemResponse.json();

        if (!savedItem?.commodityItem?.id || !savedItem?.packaging?.id) {
          throw new Error("Invalid item data returned from server");
        }

        const fetchConsignment = async () => {
          const response = await fetch(`/api/consignment/${id}`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            throw new Error("Failed to fetch consignment data.");
          }
          return await response.json();
        };

        const fetchData = async () => {
          try {
            const [consignmentData] = await Promise.all([fetchConsignment()]);
            const existingItems = consignmentData.goods?.reduce((acc, good) => {
              if (!acc[good.commodityItem.id]) {
                acc[good.commodityItem.id] = [];
              }
              acc[good.commodityItem.id].push({
                id: good.id,
                quantity: good.quantity,
                weightPerUnit: good.weightPerUnit,
                commodityPerUnitCost: good.commodityPerUnitCost,
                packagingPerUnitCost: good.packagingPerUnitCost,
                packaging: good.packaging,
                damage: good.damage,
              });
              return acc;
            }, {});

            setSelectedItems(existingItems || {});
          } catch (error) {
            Swal.fire({ icon: "error", title: "Error", text: error.message });
          }
        };

        fetchData();

        Swal.fire({
          position: "top-center",
          icon: "success",
          title: "Detail saved!",
          showConfirmButton: false,
          timer: 1000,
        });

        setShowDetailInput(false);
        setShowDetailsView(true);
      } catch (error) {
        Swal.fire({ icon: "error", title: "Error", text: error.message });
      } finally {
        setSubmitLoading(false);
      }
    }
  };

  const handleCancel = () => {
    setShowDetailInput(false);
    if (selectedItems[currentItem.id]?.length > 0) {
      setShowDetailsView(true);
    }
  };

  const handleSave = () => {
    router.push(`/startconsignment/${id}`);
  };

  return (
    <motion.div
      className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8 font-inter"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header Section */}
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-8"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-3xl lg:text-4xl font-poppins font-bold text-text mb-2">
            Select Items
          </h1>
          <p className="text-text/60 text-lg">
            Choose items for your consignment #{id}
          </p>
        </motion.div>

        {/* Main Content Card */}
        <motion.div
          className="bg-background border-2 border-primary/20 rounded-2xl shadow-xl p-6 space-y-6"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-poppins font-semibold text-text">
                Available Items
              </h2>
              <p className="text-text/60 text-sm mt-1">
                Click on an item to add details
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-text/40 text-sm">
                {filteredItems.length} of {items.length} items
              </span>
            </div>
          </div>

          {/* Search and Filter Section */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text/40 text-sm" />
                <input
                  type="text"
                  placeholder="Search items by name or number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-primary/20 rounded-xl bg-background text-text placeholder:text-text/40 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 outline-none"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text/40 hover:text-text/60 transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2 flex-col md:flex-row">
              <motion.button
                onClick={() => setFilterSelected("all")}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all duration-200 font-medium ${
                  filterSelected === "all"
                    ? "bg-primary text-white border-primary shadow-lg"
                    : "bg-background text-text border-primary/20 hover:border-primary/40"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FaFilter className="text-sm" />
                All ({totalItems})
              </motion.button>

              <motion.button
                onClick={() => setFilterSelected("selected")}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all duration-200 font-medium ${
                  filterSelected === "selected"
                    ? "bg-green-500 text-white border-green-500 shadow-lg"
                    : "bg-background text-text border-green-500/20 hover:border-green-500/40"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FaBox className="text-sm" />
                Selected ({selectedItemsCount})
              </motion.button>

              <motion.button
                onClick={() => setFilterSelected("unselected")}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all duration-200 font-medium ${
                  filterSelected === "unselected"
                    ? "bg-blue-500 text-white border-blue-500 shadow-lg"
                    : "bg-background text-text border-blue-500/20 hover:border-blue-500/40"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FaBox className="text-sm" />
                Available ({unselectedItemsCount})
              </motion.button>
            </div>
          </div>

          {/* Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 py-4">
            {isLoading ? (
              <div className="col-span-full flex justify-center py-12">
                <DataLoader />
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <div className="w-24 h-24 bg-text/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaSearch className="text-3xl text-text/40" />
                </div>
                <h3 className="text-xl font-semibold text-text mb-2">
                  {searchTerm ? "No items found" : "No items available"}
                </h3>
                <p className="text-text/60">
                  {searchTerm
                    ? `No items match "${searchTerm}". Try a different search term.`
                    : "There are no items available for selection."}
                </p>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-accent transition-colors"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              <AnimatePresence>
                {filteredItems?.map((item, index) => (
                  <motion.div
                    key={item.id}
                    className={`relative group cursor-pointer rounded-xl p-4 transition-all duration-300 border-2 backdrop-blur-sm ${
                      selectedItems[item.id]
                        ? "border-primary bg-primary/10 shadow-lg"
                        : "border-primary/20 bg-background hover:border-primary/40 hover:shadow-md"
                    }`}
                    onClick={() => handleItemSelect(item)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    whileHover={{
                      scale: 1.02,
                      y: -2,
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Item Badge */}
                    {selectedItems[item.id] && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-2 -right-2 bg-primary text-white text-xs font-semibold px-2 py-1 rounded-full shadow-lg"
                      >
                        {selectedItems[item.id].length}
                      </motion.div>
                    )}

                    {/* Item Icon */}
                    <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl mb-3 group-hover:bg-primary/20 transition-colors">
                      <FaBox className="text-primary text-lg" />
                    </div>

                    {/* Item Info */}
                    <h3 className="font-semibold text-text text-lg mb-1 line-clamp-1">
                      {item.name}
                    </h3>
                    <p className="text-text/60 text-sm">Item #{item.number}</p>

                    {/* Search Highlight */}
                    {searchTerm && (
                      <div className="mt-2">
                        <p className="text-xs text-text/40">
                          Matches:{" "}
                          {item.name
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase())
                            ? "Name"
                            : ""}
                          {item.number
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase())
                            ? " Number"
                            : ""}
                        </p>
                      </div>
                    )}

                    {/* Hover Effect */}
                    <div className="absolute inset-0 rounded-xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-primary/10">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                className="flex items-center gap-2 bg-secondary/10 text-text border-2 border-secondary/20 hover:bg-secondary/20 px-6 py-3 rounded-xl transition-all duration-200 font-medium"
                href={"/consignment/commodity/add-commodity"}
              >
                <FaPlus className="text-sm" />
                Add New Item
              </Link>
            </motion.div>

            <motion.button
              onClick={handleSave}
              className="flex items-center gap-3 bg-primary text-white hover:bg-accent px-8 py-3 rounded-xl transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              Continue to Consignment
              <FaArrowRight className="text-sm" />
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Details View Modal */}
      <AnimatePresence>
        {showDetailsView && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-background border-2 border-primary/20 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-primary/10">
                <div>
                  <h3 className="text-xl font-poppins font-semibold text-text">
                    {currentItem?.name} Details
                  </h3>
                  <p className="text-text/60 text-sm mt-1">
                    Manage item specifications and packaging
                  </p>
                </div>
                <button
                  onClick={() => setShowDetailsView(false)}
                  className="w-8 h-8 flex items-center justify-center bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-white transition-all duration-200"
                >
                  ✕
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Add New Button */}
                <motion.button
                  onClick={handleAddNewDetail}
                  className="flex items-center gap-2 bg-primary text-white hover:bg-accent px-4 py-2 rounded-lg transition-all duration-200 mb-6"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FaPlus className="text-sm" />
                  Add New Variation
                </motion.button>

                {/* Details Table */}
                <div className="overflow-hidden rounded-xl border border-primary/10">
                  <div className="overflow-x-auto">
                    <table className="w-full font-inter">
                      <thead>
                        <tr className="bg-primary/5 border-b border-primary/10">
                          <th className="px-4 py-3 text-left text-text font-semibold text-sm">
                            Quantity
                          </th>
                          <th className="px-4 py-3 text-left text-text font-semibold text-sm">
                            Weight/Unit
                          </th>
                          <th className="px-4 py-3 text-left text-text font-semibold text-sm">
                            Cost/Unit
                          </th>
                          <th className="px-4 py-3 text-left text-text font-semibold text-sm">
                            Packaging
                          </th>
                          <th className="px-4 py-3 text-left text-text font-semibold text-sm">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-primary/5">
                        {selectedItems[currentItem?.id]?.map(
                          (detail, index) => (
                            <motion.tr
                              key={detail.id || index}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: index * 0.1 }}
                              className="hover:bg-primary/5 transition-colors"
                            >
                              <td className="px-4 py-3 text-text font-medium">
                                {detail.quantity}
                              </td>
                              <td className="px-4 py-3 text-text">
                                {detail.weightPerUnit} kg
                              </td>
                              <td className="px-4 py-3 text-text">
                                ${detail.commodityPerUnitCost}
                              </td>
                              <td className="px-4 py-3 text-text">
                                {detail.packaging?.name || "N/A"}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <motion.button
                                    onClick={() => handleEditDetail(index)}
                                    className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-white transition-all duration-200"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    title="Edit"
                                  >
                                    <FaEdit className="text-sm" />
                                  </motion.button>
                                  <motion.button
                                    onClick={() =>
                                      handleDeleteDetail(detail.id)
                                    }
                                    className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all duration-200"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    title="Delete"
                                  >
                                    <FaTrash className="text-sm" />
                                  </motion.button>
                                </div>
                              </td>
                            </motion.tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end p-6 border-t border-primary/10">
                <button
                  onClick={() => setShowDetailsView(false)}
                  className="px-6 py-2 bg-text/10 text-text hover:bg-text/20 rounded-lg transition-all duration-200 font-medium"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Input Modal */}
      <AnimatePresence>
        {showDetailInput && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-background border-2 border-primary/20 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-primary/10">
                <div>
                  <h3 className="text-xl font-poppins font-semibold text-text">
                    {currentDetailIndex !== null ? "Edit" : "Add"} Details
                  </h3>
                  <p className="text-text/60 text-sm mt-1">
                    {currentItem?.name}
                  </p>
                </div>
                <button
                  onClick={handleCancel}
                  className="w-8 h-8 flex items-center justify-center bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-white transition-all duration-200"
                >
                  ✕
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Info Banner */}
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-primary text-sm">💡</span>
                    </div>
                    <div>
                      <p className="text-text font-medium text-sm">
                        Flexible Data Entry
                      </p>
                      <p className="text-text/60 text-xs mt-1">
                        Fill in what you have now; update remaining details
                        later!
                      </p>
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center gap-2 text-text text-sm font-medium mb-2">
                      <FaBox className="text-primary/60" />
                      Quantity
                    </label>
                    <Input
                      type="number"
                      value={itemDetail.qty}
                      onChange={(e) =>
                        setItemDetail((prev) => ({
                          ...prev,
                          qty: e.target.value,
                        }))
                      }
                      placeholder="Enter quantity"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-text text-sm font-medium mb-2">
                      <FaWeight className="text-primary/60" />
                      Weight Per Unit (kg)
                    </label>
                    <Input
                      type="number"
                      value={itemDetail.weightPerUnit}
                      onChange={(e) =>
                        setItemDetail((prev) => ({
                          ...prev,
                          weightPerUnit: e.target.value,
                        }))
                      }
                      placeholder="Enter weight per unit"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-text text-sm font-medium mb-2">
                      <FaMoneyBill className="text-primary/60" />
                      Cost Per Unit
                    </label>
                    <Input
                      type="number"
                      value={itemDetail.commodityPerUnitCost}
                      onChange={(e) =>
                        setItemDetail((prev) => ({
                          ...prev,
                          commodityPerUnitCost: e.target.value,
                        }))
                      }
                      placeholder="Enter cost per unit"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-text text-sm font-medium mb-2">
                      <FaTag className="text-primary/60" />
                      Packaging Cost
                    </label>
                    <Input
                      type="number"
                      value={itemDetail.packagingPerUnitCost}
                      onChange={(e) =>
                        setItemDetail((prev) => ({
                          ...prev,
                          packagingPerUnitCost: e.target.value,
                        }))
                      }
                      placeholder="Enter packaging cost"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-text text-sm font-medium mb-2">
                      <FaBox className="text-primary/60" />
                      Packaging Type
                    </label>
                    <select
                      value={itemDetail.packaging?.id || ""}
                      onChange={(e) => {
                        if (e.target.value === "add-new-packaging") {
                          router.push("/consignment/packaging/add-packaging");
                          return;
                        }
                        const selectedPackaging = packagingOptions.find(
                          (pkg) => pkg.id === parseInt(e.target.value)
                        );
                        setItemDetail((prev) => ({
                          ...prev,
                          packaging: selectedPackaging,
                        }));
                      }}
                      className="w-full p-3 border-2 border-primary/20 rounded-xl bg-background text-text focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 outline-none"
                    >
                      <option value="">Select Packaging</option>
                      {packagingOptions.map((pkg) => (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.name} ({pkg.packagingWeightPerUnit}kg)
                        </option>
                      ))}
                      <option
                        value="add-new-packaging"
                        className="text-primary font-semibold bg-primary/5"
                      >
                        + Add New Packaging
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end space-x-3 p-6 border-t border-primary/10">
                <button
                  onClick={handleCancel}
                  className="px-6 py-3 bg-text/10 text-text hover:bg-text/20 rounded-xl transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleItemDetail}
                  className="px-6 py-3 bg-primary text-white hover:bg-accent rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                  disabled={submitLoading}
                >
                  {submitLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </div>
                  ) : (
                    "Save Details"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
