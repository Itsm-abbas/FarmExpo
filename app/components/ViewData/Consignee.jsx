//components/ViewData/Consignee.jsx
import LinkButton from "@components/Button/LinkButton";
import ReusableTable from "@components/Table";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { MdEdit } from "react-icons/md";
import Swal from "sweetalert2";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { fetchConsignees } from "@constants/consignmentAPI";
import axiosInstance from "@utils/axiosConfig";
const ViewConsignee = () => {
  const queryClient = useQueryClient();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter();
  const [editLoader, setEditLoader] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["consignees"],
    queryFn: fetchConsignees,
  });
  const deleteConsignee = useMutation({
    mutationFn: async (id) => {
      await axios.delete(`/api/consignee/${id}`);
    },
    onSuccess: () => {},
  });
  const handleDelete = async (id) => {
    try {
      const result = await Swal.fire({
        title: "Are you sure?",
        text: "Do you really want to delete this consignee? This action cannot be undone.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Yes, delete it!",
      });

      if (result.isConfirmed) {
        const response = await axiosInstance.delete(`/consignee/${id}`);

        if (response.status === 200) {
          Swal.fire({
            position: "top-center",
            icon: "success",
            title: "Deleted Successfully",
            showConfirmButton: false,
            timer: 1500,
          });

          queryClient.invalidateQueries(["consignees"]);
        } else {
          throw new Error("Unexpected response status: " + response.status);
        }
      }
    } catch (error) {
      Swal.fire("Error!", error.message, "error");
    }
  };
  const handleEdit = async (id) => {
    setEditLoader(true);
    router.push(`/consignment/consignee/add-consignee?id=${id}`);
    setEditLoader(false);
  };
  const headers = [
    { label: "s.no" },
    { label: "name", accessor: "vendor.name" },
    { label: "ntn", accessor: "vendor.ntn" },
    { label: "address", accessor: "vendor.address" },
    { label: "station", accessor: "vendor.station" },
    { label: "country", accessor: "vendor.country" },
    { label: "balance", accessor: "vendor.balance" },
    { label: "currency", accessor: "vendor.currency" },
    { label: "Actions" }, // No accessor for actions column
  ];

  return (
    <>
      <ReusableTable
        title="Consignee"
        headers={headers}
        data={data}
        isLoading={isLoading}
        onDelete={handleDelete}
        onEdit={handleEdit}
        addButton={
          <LinkButton
            title="Add Consignee"
            href="/consignment/consignee/add-consignee"
            icon={MdEdit}
            desc="Click to add new consignee"
          />
        }
      />
    </>
  );
};

export default ViewConsignee;
