//components/ViewData/packer.jsx
import LinkButton from "@components/Button/LinkButton";
import ReusableTable from "@components/Table";
import { fetchPackers } from "@constants/consignmentAPI";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@utils/axiosConfig";
import { useRouter } from "next/navigation";
import { MdEdit } from "react-icons/md";
import Swal from "sweetalert2";
const ViewPacker = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { isLoading, data } = useQuery({
    queryKey: ["packers"],
    queryFn: fetchPackers,
  });

  const handleDelete = async (id) => {
    try {
      const result = await Swal.fire({
        title: "Are you sure?",
        text: "Do you really want to delete this packer? This action cannot be undone.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Yes, delete it!",
      });

      if (result.isConfirmed) {
        const response = await axiosInstance.delete(`/packer/${id}`);
        if (response.status === 200) {
          Swal.fire({
            position: "top-center",
            icon: "success",
            title: "Deleted Successfully",
            showConfirmButton: false,
            timer: 1500,
          });

          queryClient.invalidateQueries(["packers"]);
        } else {
          throw new Error("Unexpected response status: " + response.status);
        }
      }
    } catch (error) {
      Swal.fire("Error!", error.message, "error");
    }
  };
  const handleEdit = async (id) => {
    router.push(`/consignment/packer/add-packer?id=${id}`);
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
        title="Packers"
        headers={headers}
        data={data}
        isLoading={isLoading}
        onDelete={handleDelete}
        onEdit={handleEdit}
        addButton={
          <LinkButton
            title="Add Packer"
            href="/consignment/packer/add-packer"
            icon={MdEdit}
            desc="Click to add new packer"
          />
        }
      />
    </>
  );
};

export default ViewPacker;
