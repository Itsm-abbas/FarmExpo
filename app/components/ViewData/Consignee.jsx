//components/ViewData/Consignee.jsx
import LinkButton from "@components/Button/LinkButton";
import ReusableTable from "@components/Table";
import { useRouter } from "next/navigation";
import React from "react";
import { MdEdit, MdAdd, MdPerson } from "react-icons/md";
import Swal from "sweetalert2";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchConsignees } from "@constants/consignmentAPI";
import axiosInstance from "@utils/axiosConfig";
import { motion } from "framer-motion";

const ViewConsignee = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ["consignees"],
    queryFn: fetchConsignees,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await axiosInstance.delete(`/consignee/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["consignees"]);
      Swal.fire({
        position: "top-center",
        icon: "success",
        title: "Deleted Successfully!",
        text: "Consignee has been removed from the system.",
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
        text: error.message || "Failed to delete consignee",
        icon: "error",
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
        confirmButtonColor: "rgb(var(--color-primary))",
      });
    },
  });

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Delete Consignee?",
      text: "This will permanently remove the consignee and all associated data. This action cannot be undone.",
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
    router.push(`/consignment/consignee/add-consignee?id=${id}`);
  };

  const headers = [
    { key: "sno", label: "#" },
    { key: "name", label: "Name", accessor: "vendor.name" },
    { key: "ntn", label: "NTN", accessor: "vendor.ntn" },
    { key: "address", label: "Address", accessor: "vendor.address" },
    { key: "station", label: "Station", accessor: "vendor.station" },
    { key: "country", label: "Country", accessor: "vendor.country" },
    {
      key: "balance",
      label: "Balance",
      accessor: "vendor.balance",
      format: "currency",
    },
    { key: "currency", label: "Currency", accessor: "vendor.currency" },
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
        title="Consignees"
        headers={headers}
        data={data}
        isLoading={isLoading}
        onDelete={handleDelete}
        onEdit={handleEdit}
        noDataMessage="No consignees found. Add your first consignee to get started."
        addButton={
          <div className="text-center">
            <LinkButton
              title="Add New Consignee"
              href="/consignment/consignee/add-consignee"
              icon={MdAdd}
              desc="Click to add a new consignee to your system"
            />
          </div>
        }
      />
    </motion.div>
  );
};

export default ViewConsignee;
