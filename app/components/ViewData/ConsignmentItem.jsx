//components/ViewData/ConsignmentItem.jsx
import LinkButton from "@components/Button/LinkButton";
import ReusableTable from "@components/Table";
import { fetchConsignmentItem } from "@constants/consignmentAPI";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@utils/axiosConfig";
import { useRouter } from "next/navigation";
import React from "react";
import { MdEdit, MdAdd, MdInventory } from "react-icons/md";
import Swal from "sweetalert2";
import { motion } from "framer-motion";

const ViewConsignmentItem = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["consignmentitem"],
    queryFn: fetchConsignmentItem,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await axiosInstance.delete(`/consignmentitem/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["consignmentitem"]);
      Swal.fire({
        position: "top-center",
        icon: "success",
        title: "Deleted Successfully!",
        text: "Consignment item has been removed from the system.",
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
        text: error.message || "Failed to delete consignment item",
        icon: "error",
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
        confirmButtonColor: "rgb(var(--color-primary))",
      });
    },
  });

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Delete Consignment Item?",
      text: "This will permanently remove the consignment item. This action cannot be undone.",
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
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = async (id) => {
    router.push(`/consignment/consignmentitem/add-consignmentitem?id=${id}`);
  };

  const headers = [
    { key: "sno", label: "#" },
    { key: "id", label: "ID", accessor: "id" },
    { key: "item", label: "Item Name", accessor: "item.name" },
    { key: "packaging", label: "Packaging", accessor: "packaging.name" },
    {
      key: "weight",
      label: "Weight/Unit",
      accessor: "weightPerUnit",
      format: "number",
    },
    {
      key: "quantity",
      label: "Quantity",
      accessor: "quantity",
      format: "number",
    },
    {
      key: "damage",
      label: "Damage",
      accessor: "damage",
      format: "number",
    },
    {
      key: "commodityCost",
      label: "Commodity Cost",
      accessor: "commodityPerUnitCost",
      format: "currency",
    },
    {
      key: "packagingCost",
      label: "Packaging Cost",
      accessor: "packagingPerUnitCost",
      format: "currency",
    },
    { key: "actions", label: "Actions" },
  ];

  // Calculate totals for summary
  const totals = data?.reduce(
    (acc, item) => ({
      totalQuantity: (acc.totalQuantity || 0) + (item.quantity || 0),
      totalWeight:
        (acc.totalWeight || 0) +
        (item.weightPerUnit || 0) * (item.quantity || 0),
      totalDamage: (acc.totalDamage || 0) + (item.damage || 0),
    }),
    {}
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Summary Cards */}
      {data && data.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-primary/10 border border-primary/20 rounded-xl p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text/70 text-sm font-inter">
                  Total Quantity
                </p>
                <p className="text-2xl font-bold text-text font-poppins">
                  {totals?.totalQuantity?.toLocaleString() || 0}
                </p>
              </div>
              <div className="p-2 bg-primary/20 rounded-lg">
                <MdInventory className="text-primary text-xl" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-accent/10 border border-accent/20 rounded-xl p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text/70 text-sm font-inter">Total Weight</p>
                <p className="text-2xl font-bold text-text font-poppins">
                  {totals?.totalWeight?.toFixed(2) || 0} kg
                </p>
              </div>
              <div className="p-2 bg-accent/20 rounded-lg">
                <MdInventory className="text-accent text-xl" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-red-500/10 border border-red-500/20 rounded-xl p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text/70 text-sm font-inter">Total Damage</p>
                <p className="text-2xl font-bold text-text font-poppins">
                  {totals?.totalDamage?.toLocaleString() || 0}
                </p>
              </div>
              <div className="p-2 bg-red-500/20 rounded-lg">
                <MdInventory className="text-red-500 text-xl" />
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <ReusableTable
        title="Consignment Items"
        headers={headers}
        data={data}
        isLoading={isLoading}
        onDelete={handleDelete}
        onEdit={handleEdit}
        noDataMessage="No consignment items found. Add your first consignment item to get started."
        addButton={
          <div className="text-center">
            <LinkButton
              title="Add New Consignment Item"
              href="/consignment/consignmentitem/add-consignmentitem"
              icon={MdAdd}
              desc="Click to add a new consignment item to your inventory"
            />
          </div>
        }
      />
    </motion.div>
  );
};

export default ViewConsignmentItem;
