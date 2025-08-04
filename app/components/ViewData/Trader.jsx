//components/ViewData/Trader.jsx
import LinkButton from "@components/Button/LinkButton";
import ReusableTable from "@components/Table";
import { fetchTraders } from "@constants/consignmentAPI";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@utils/axiosConfig";
import { useRouter } from "next/navigation";
import { MdEdit } from "react-icons/md";
import Swal from "sweetalert2";
const ViewTrader = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { isLoading, data } = useQuery({
    queryKey: ["traders"],
    queryFn: fetchTraders,
  });

  const handleDelete = async (id) => {
    try {
      const result = await Swal.fire({
        title: "Are you sure?",
        text: "Do you really want to delete this trader? This action cannot be undone.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Yes, delete it!",
      });

      if (result.isConfirmed) {
        const response = await axiosInstance.delete(`/trader/${id}`);
        if (response.status === 200) {
          Swal.fire({
            position: "top-center",
            icon: "success",
            title: "Deleted Successfully",
            showConfirmButton: false,
            timer: 1500,
          });

          queryClient.invalidateQueries(["traders"]);
        } else {
          throw new Error("Unexpected response status: " + response.status);
        }
      }
    } catch (error) {
      Swal.fire("Error!", error.message, "error");
    }
  };
  const handleEdit = async (id) => {
    router.push(`/consignment/trader/add-trader?id=${id}`);
  };

  const headers = ["s.no", "ntn", "name", "address", "country", "edit/delete"];
  return (
    <>
      <ReusableTable
        title="Traders"
        headers={headers}
        data={data}
        isLoading={isLoading}
        onDelete={handleDelete}
        onEdit={handleEdit}
        addButton={
          <LinkButton
            title="Add Trader"
            href="/consignment/trader/add-trader"
            icon={MdEdit}
            desc="Click to add new trader"
          />
        }
      />
    </>
  );
};

export default ViewTrader;
