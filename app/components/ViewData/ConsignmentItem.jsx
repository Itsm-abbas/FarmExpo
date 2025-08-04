//components/ViewData/ConsignmentItem.jsx
import LinkButton from "@components/Button/LinkButton";
import ReusableTable from "@components/Table";
import { fetchConsignmentItem } from "@constants/consignmentAPI";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@utils/axiosConfig";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { MdEdit } from "react-icons/md";
import Swal from "sweetalert2";
const ViewConsignmentItem = () => {
  const router = useRouter();
  const { data, isLoading } = useQuery({
    queryKey: ["consignmentitem"],
    queryFn: fetchConsignmentItem,
  });

  const handleDelete = async (id) => {
    try {
      const result = await Swal.fire({
        title: "Are you sure?",
        text: "Do you really want to delete this consignmentItem? This action cannot be undone.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Yes, delete it!",
      });

      if (result.isConfirmed) {
        const response = await axiosInstance.delete(`/consignmentitem/${id}`);
        if (!response.ok) {
          throw new Error("Failed to delete consignmentitem.");
        }
        Swal.fire({
          position: "top-center",
          icon: "success",
          title: "Deleted Successfully",
          showConfirmButton: false,
          timer: 1500,
        });
      }
    } catch (error) {
      Swal.fire("Error!", error.message, "error");
    }
  };
  const handleEdit = async (id) => {
    router.push(`/consignment/consignmentitem/add-consignmentitem?id=${id}`);
  };
  const headers = [
    { label: "ID", accessor: "id" },
    { label: "Item Name", accessor: "item.name" },
    { label: "Packaging", accessor: "packaging.name" },
    { label: "Weight Per Unit", accessor: "weightPerUnit" },
    { label: "Quantity", accessor: "quantity" },
    { label: "Damage", accessor: "damage" },
    { label: "Actions" }, // No accessor for actions column
  ];
  return (
    <>
      <ReusableTable
        title="Consignment Item"
        headers={headers}
        data={data}
        isLoading={isLoading}
        onDelete={handleDelete}
        onEdit={handleEdit}
        addButton={
          <LinkButton
            title="Add Consignment item"
            href="/consignment/consignmentitem/add-consignmentitem"
            icon={MdEdit}
            desc="Click to add new consignmentitem"
          />
        }
      />
    </>
  );
};

export default ViewConsignmentItem;
