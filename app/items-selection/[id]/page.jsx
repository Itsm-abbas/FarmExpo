"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Swal from "sweetalert2";
import font from "@utils/fonts";
import DataLoader from "@components/Loader/dataLoader";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Input from "@components/Input";
import { getCookie } from "cookies-next";
import { FaArrowRight, FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import { useQuery } from "@tanstack/react-query";
import {
  fetchConsignmentById,
  fetchConsignments,
} from "@constants/consignmentAPI";
import { LoaderIcon } from "react-hot-toast";

export default function ItemSelectionPage() {
  const router = useRouter();
  const token = getCookie("token");
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const { id } = useParams();
  const [items, setItems] = useState([]);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState({});
  const [isLoading, setIsLoading] = useState(true);
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
  const [packagingOptions, setPackagingOptions] = useState([]);

  const {
    isLoadingGoods,
    data: goods,
    refetch,
  } = useQuery({
    queryKey: ["consignments", id],
    queryFn: () => fetchConsignmentById(id),
    select: (data) => data?.goods || [],
  });

  // Fetch packaging data
  useEffect(() => {
    const fetchPackaging = async () => {
      try {
        const response = await fetch(`/api/packaging`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch packaging data.");
        }

        const data = await response.json();
        setPackagingOptions(data);
      } catch (error) {
        console.error("Error fetching packaging data:", error);
      }
    };

    fetchPackaging();
  }, [token, apiUrl]);

  // Fetch commodities and consignment data
  useEffect(() => {
    const fetchCommodities = async () => {
      const response = await fetch(`/api/commodity`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch commodities.");
      }

      return await response.json();
    };

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
      setIsLoading(true);
      try {
        const [commodityData, consignmentData] = await Promise.all([
          fetchCommodities(),
          fetchConsignment(),
        ]);

        // Map existing items with all details
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

        setItems(commodityData);
        setSelectedItems(existingItems || {});
      } catch (error) {
        Swal.fire({ icon: "error", title: "Error", text: error.message });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, token, apiUrl]);

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
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        // ✅ 1. Delete the item from /consignmentitem first
        const deleteResponse = await fetch(`/api/consignmentitem/${detailId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!deleteResponse.ok) throw new Error("Failed to delete item");

        // ✅ 2. Refetch the updated consignment
        const response = await fetch(`/api/consignment/${id}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok)
          throw new Error("Failed to fetch updated consignment");

        const updatedConsignment = await response.json();

        // ✅ 3. Sync updated state in the UI
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
        console.log("Saved Item:", savedItem);
        if (!savedItem?.commodityItem?.id || !savedItem?.packaging?.id) {
          throw new Error("Invalid item data returned from server");
        }

        // Update the consignment's goods array
        let updatedGoods = [...(consignmentData.goods || [])];

        if (existingItemId) {
          updatedGoods = updatedGoods.map((g) =>
            g.id === existingItemId ? { ...g, ...savedItem } : g
          );
        } else {
          updatedGoods.push(savedItem);
        }

        const updatedConsignment = {
          ...consignmentData,
          goods: updatedGoods,
        };

        const consignmentUpdateRes = await fetch(`/api/consignment/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updatedConsignment),
        });

        if (!consignmentUpdateRes.ok)
          throw new Error("Failed to update consignment");

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
          setIsLoading(true);
          try {
            const [consignmentData] = await Promise.all([fetchConsignment()]);

            // Map existing items with all details
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
          } finally {
            setIsLoading(false);
          }
        };

        fetchData();
        // Update local state
        // setSelectedItems((prev) => {
        //   const updatedItems = { ...prev };
        //   if (!updatedItems[currentItem.id]) {
        //     updatedItems[currentItem.id] = [];
        //   }

        //   if (currentDetailIndex !== null) {
        //     updatedItems[currentItem.id][currentDetailIndex] = savedItem;
        //   } else {
        //     updatedItems[currentItem.id].push(savedItem);
        //   }

        //   return updatedItems;
        // });

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
      className={`${font.poppins.className} min-h-screen py-8 dark:bg-gray-800 text-LightPText dark:text-DarkPText`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.h1
        className="text-3xl font-bold text-center mb-8"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        Select Items
      </motion.h1>

      <motion.div
        className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 space-y-4 capitalize"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-xl font-semibold mb-4">Available Items</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-8">
          {isLoading ? (
            <div className="col-span-3">
              <DataLoader />
            </div>
          ) : (
            <AnimatePresence>
              {items?.map((item) => (
                <motion.div
                  key={item.id}
                  className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                    selectedItems[item.id]
                      ? "border-green-600 bg-green-100 dark:bg-DarkSBg"
                      : "border-gray-300 dark:border-gray-700"
                  }`}
                  onClick={() => handleItemSelect(item)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <h3 className="text-lg font-semibold">{item.name}</h3>
                  <p className="text-sm text-LightPText dark:text-DarkPText">
                    Item Number: {item.number}
                  </p>
                  {selectedItems[item.id] && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                      {selectedItems[item.id].length}
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Detail View Modal */}
        {showDetailsView && (
          <motion.div
            className="fixed inset-0 h-full bg-black bg-opacity-50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white dark:bg-gray-800 w-full md:w-2/3 p-6 rounded-lg shadow-lg flex flex-col max-h-[90vh]"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  Details for {currentItem?.name}
                </h3>
                <button
                  onClick={() => setShowDetailsView(false)}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2">
                <div className="mb-4">
                  <button
                    onClick={handleAddNewDetail}
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-md flex items-center gap-1 text-sm"
                  >
                    <FaPlus /> Add New Detail
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-2 text-left">Quantity</th>
                        <th className="px-4 py-2 text-left">Weight/Unit</th>
                        <th className="px-4 py-2 text-left">Cost/Unit</th>
                        <th className="px-4 py-2 text-left">Packaging</th>
                        <th className="px-4 py-2 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                      {isLoadingGoods && <LoaderIcon />}
                      {!isLoadingGoods &&
                        selectedItems[currentItem.id]?.map((detail, index) => (
                          <tr key={detail.id || index}>
                            <td className="px-4 py-2">{detail.quantity}</td>
                            <td className="px-4 py-2">
                              {detail.weightPerUnit} kg
                            </td>
                            <td className="px-4 py-2">
                              {detail.commodityPerUnitCost}
                            </td>
                            <td className="px-4 py-2">
                              {detail.packaging?.name || "N/A"}
                            </td>
                            <td className="px-4 py-2 flex gap-2">
                              <button
                                onClick={() => handleEditDetail(index)}
                                className="text-blue-500 hover:text-blue-700"
                                title="Edit"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => handleDeleteDetail(detail.id)}
                                className="text-red-500 hover:text-red-700"
                                title="Delete"
                              >
                                <FaTrash />
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end mt-4 pt-4 border-t dark:border-gray-700">
                <button
                  onClick={() => setShowDetailsView(false)}
                  className="bg-gray-300 dark:bg-gray-700 text-black dark:text-white px-4 py-2 rounded-md"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Detail Input Modal */}
        {showDetailInput && (
          <motion.div
            className="fixed inset-0 h-full bg-black bg-opacity-50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white dark:bg-gray-800 w-full md:w-2/5 p-6 rounded-lg shadow-lg flex flex-col max-h-[90vh]"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  {currentDetailIndex !== null ? "Edit" : "Add"} Detail for{" "}
                  {currentItem?.name}
                </h3>
                <button
                  onClick={handleCancel}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2">
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-200">
                  <p className="font-medium">✏️ Flexible Data Entry</p>
                  <p>Fill in what you have now; update the remaining later!</p>
                </div>
                <Input
                  type="number"
                  value={itemDetail.qty}
                  onChange={(e) =>
                    setItemDetail((prev) => ({ ...prev, qty: e.target.value }))
                  }
                  placeholder="Quantity"
                />
                <Input
                  classes="mt-5"
                  type="number"
                  value={itemDetail.weightPerUnit}
                  onChange={(e) =>
                    setItemDetail((prev) => ({
                      ...prev,
                      weightPerUnit: e.target.value,
                    }))
                  }
                  placeholder="Weight Per Unit"
                />
                <Input
                  classes="mt-5"
                  type="number"
                  value={itemDetail.commodityPerUnitCost}
                  onChange={(e) =>
                    setItemDetail((prev) => ({
                      ...prev,
                      commodityPerUnitCost: e.target.value,
                    }))
                  }
                  placeholder="Per Unit Cost"
                />
                <Input
                  classes="mt-5"
                  type="number"
                  value={itemDetail.packagingPerUnitCost}
                  onChange={(e) =>
                    setItemDetail((prev) => ({
                      ...prev,
                      packagingPerUnitCost: e.target.value,
                    }))
                  }
                  placeholder="Packaging Per Unit Cost"
                />

                {/* Packaging Dropdown */}
                <div className="mt-5">
                  <select
                    value={itemDetail.packaging?.id || ""}
                    onChange={(e) => {
                      if (e.target.value === "add-new-packaging") {
                        router.push("/consignment/packaging/add-packaging");
                      }
                      const selectedPackaging = packagingOptions.find(
                        (pkg) => pkg.id === parseInt(e.target.value)
                      );
                      setItemDetail((prev) => ({
                        ...prev,
                        packaging: selectedPackaging,
                      }));
                    }}
                    className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 outline-none"
                  >
                    <option value="">Select Packaging</option>
                    {packagingOptions.map((pkg) => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.name} {pkg.packagingWeightPerUnit}
                      </option>
                    ))}
                    <option
                      value="add-new-packaging"
                      className="text-green-600 capitalize font-semibold cursor-pointer"
                    >
                      + Add New Packaging
                    </option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-4 pt-4 border-t dark:border-gray-700">
                <button
                  onClick={handleCancel}
                  className="bg-CancelButton hover:bg-CancelButtonHover text-white px-4 py-2 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleItemDetail}
                  className="bg-PrimaryButton hover:bg-PrimaryButtonHover transition text-white px-4 py-2 rounded-md"
                  disabled={submitLoading}
                >
                  {submitLoading ? "Saving..." : "Save"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        <div className="flex justify-between capitalize">
          {!isLoading && (
            <Link
              className="bg-SecondaryButton hover:bg-SecondaryButtonHover transition-all duration-150 text-white px-4 py-2 rounded-md"
              href={"/consignment/commodity/add-commodity"}
            >
              Add New Item
            </Link>
          )}
          <div className="flex gap-4">
            <motion.button
              onClick={handleSave}
              className="bg-PrimaryButton flex items-center gap-2 hover:bg-PrimaryButtonHover transition-all text-white px-4 sm:px-6 py-2 rounded-md"
            >
              Continue <FaArrowRight />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
