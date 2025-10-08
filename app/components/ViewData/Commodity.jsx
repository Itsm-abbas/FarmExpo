//components/ViewData/Commodity.jsx
import LinkButton from "@components/Button/LinkButton";
import ReusableTable from "@components/Table";
import { fetchCommodity } from "@constants/consignmentAPI";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@utils/axiosConfig";
import { useRouter } from "next/navigation";
import React from "react";
import { MdEdit, MdAdd } from "react-icons/md";
import Swal from "sweetalert2";
import { motion } from "framer-motion";

const ViewCommodity = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { isLoading, data } = useQuery({
    queryKey: ["commodities"],
    queryFn: fetchCommodity,
  });

  const handleDelete = async (id) => {
    try {
      const result = await Swal.fire({
        title: "Delete Commodity?",
        text: "This action cannot be undone. All associated data will be removed.",
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
        await axiosInstance.delete(`/commodity/${id}`);

        Swal.fire({
          position: "top-center",
          icon: "success",
          title: "Deleted Successfully!",
          text: "Commodity has been removed from the system.",
          showConfirmButton: false,
          timer: 2000,
          background: "rgb(var(--color-background))",
          color: "rgb(var(--color-text))",
          iconColor: "rgb(var(--color-primary))",
        });

        queryClient.invalidateQueries(["commodities"]);
      }
    } catch (error) {
      Swal.fire({
        title: "Error!",
        text: error.message || "Failed to delete commodity",
        icon: "error",
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
        confirmButtonColor: "rgb(var(--color-primary))",
      });
    }
  };

  const handleEdit = async (id) => {
    router.push(`/consignment/commodity/add-commodity?id=${id}`);
  };

  const headers = [
    { key: "sno", label: "#" },
    { key: "number", label: "Commodity Number", accessor: "number" },
    { key: "name", label: "Commodity Name", accessor: "name" },
    { key: "actions", label: "Actions" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <ReusableTable
        title="Commodities"
        headers={headers}
        data={data}
        isLoading={isLoading}
        onDelete={handleDelete}
        onEdit={handleEdit}
        noDataMessage="No commodities found. Add your first commodity to get started."
        addButton={
          <div className="text-center">
            <LinkButton
              title="Add New Commodity"
              href="/consignment/commodity/add-commodity"
              icon={MdAdd}
              desc="Click to add a new commodity to your inventory"
            />
          </div>
        }
      />
    </motion.div>
  );
};

export default ViewCommodity;
