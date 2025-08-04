//components/ViewData/packaging.jsx
import LinkButton from "@components/Button/LinkButton";
import ReusableTable from "@components/Table";
import { fetchPackaging } from "@constants/consignmentAPI";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@utils/axiosConfig";
import { useRouter } from "next/navigation";
import { MdEdit } from "react-icons/md";
import Swal from "sweetalert2";
const ViewPackaging = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { isLoading, data } = useQuery({
    queryKey: ["packaging"],
    queryFn: fetchPackaging,
  });
  console.log(data);
  const handleDelete = async (id) => {
    try {
      const result = await Swal.fire({
        title: "Are you sure?",
        text: "Do you really want to delete this packaging? This action cannot be undone.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Yes, delete it!",
      });

      if (result.isConfirmed) {
        const response = await axiosInstance.delete(`/api/packaging/${id}`);
        if (response.status === 200) {
          Swal.fire({
            position: "top-center",
            icon: "success",
            title: "Deleted Successfully",
            showConfirmButton: false,
            timer: 1500,
          });

          queryClient.invalidateQueries(["packaging"]);
        } else {
          throw new Error("Unexpected response status: " + response.status);
        }
      }
    } catch (error) {
      Swal.fire("Error!", error.message, "error");
    }
  };
  const handleEdit = async (id) => {
    router.push(`/consignment/packaging/add-packaging?id=${id}`);
  };

  const headers = ["s.no", "name", "packagingWeightPerUnit", "edit/delete"];
  return (
    <>
      <ReusableTable
        title="packagings"
        headers={headers}
        data={data}
        isLoading={isLoading}
        onDelete={handleDelete}
        onEdit={handleEdit}
        addButton={
          <LinkButton
            title="Add packaging"
            href="/consignment/packaging/add-packaging"
            icon={MdEdit}
            desc="Click to add new packaging"
          />
        }
      />
    </>
  );
};

export default ViewPackaging;
