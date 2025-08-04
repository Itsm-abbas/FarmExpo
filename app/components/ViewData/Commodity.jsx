//components/ViewData/Commodity.jsx
import LinkButton from "@components/Button/LinkButton";
import ReusableTable from "@components/Table";
import { fetchCommodity } from "@constants/consignmentAPI";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@utils/axiosConfig";
import { useRouter } from "next/navigation";
import React from "react";
import { MdEdit } from "react-icons/md";
import Swal from "sweetalert2";
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
        title: "Are you sure?",
        text: "Do you really want to delete this commodity? This action cannot be undone.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Yes, delete it!",
      });

      if (result.isConfirmed) {
        const response = await axiosInstance.delete(`/commodity/${id}`);
        if (response.status === 200) {
          Swal.fire({
            position: "top-center",
            icon: "success",
            title: "Deleted Successfully",
            showConfirmButton: false,
            timer: 1500,
          });

          queryClient.invalidateQueries(["commodities"]);
        } else {
          throw new Error("Unexpected response status: " + response.status);
        }
      }
    } catch (error) {
      Swal.fire("Error!", error.message, "error");
    }
  };
  const handleEdit = async (id) => {
    router.push(`/consignment/commodity/add-commodity?id=${id}`);
  };

  const headers = ["s.no", "number", "name", "edit/delete"];
  return (
    <>
      <ReusableTable
        title="Commodity"
        headers={headers}
        data={data}
        isLoading={isLoading}
        onDelete={handleDelete}
        onEdit={handleEdit}
        addButton={
          <LinkButton
            title="Add Commodity"
            href="/consignment/commodity/add-commodity"
            icon={MdEdit}
            desc="Click to add new commodity"
          />
        }
      />
    </>
  );
};

export default ViewCommodity;
