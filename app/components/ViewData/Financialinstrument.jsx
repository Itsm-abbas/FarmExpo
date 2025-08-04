//components/ViewData/Trader.jsx
import LinkButton from "@components/Button/LinkButton";
import ReusableTable from "@components/Table";
import { fetchFinancialInstrument } from "@constants/consignmentAPI";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@utils/axiosConfig";
import { useRouter } from "next/navigation";
import { MdEdit } from "react-icons/md";
import Swal from "sweetalert2";
const ViewFI = () => {
  const router = useRouter();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["financialinstrument"],
    queryFn: fetchFinancialInstrument,
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
        const response = await axiosInstance.delete(
          `/financialinstrument/${id}`
        );
        if (!response.ok) {
          throw new Error(`Error: ${response.status} - ${response.statusText}`);
        }
        Swal.fire({
          position: "top-center",
          icon: "success",
          title: "Deleted Successfully",
          showConfirmButton: false,
          timer: 1500,
        });
        refetch();
      }
    } catch (error) {
      Swal.fire("Error!", error.message, "error");
    }
  };
  const handleEdit = async (id) => {
    router.push(`/consignment/add-financialinstrument?id=${id}`);
  };

  const headers = [
    { label: "s.no" },
    { label: "number", accessor: "number" },
    { label: "trader", accessor: "trader.name" },
    { label: "consignee", accessor: "consignee.vendor.name" },
    { label: "amount", accessor: "amount" },
    { label: "balance", accessor: "balance" },
    { label: "Actions" },
  ];
  return (
    <>
      <ReusableTable
        title="Financial instruments"
        headers={headers}
        data={data}
        isLoading={isLoading}
        onDelete={handleDelete}
        onEdit={handleEdit}
        addButton={
          <LinkButton
            title="Add Financial instrument"
            href="/consignment/add-financialinstrument"
            icon={MdEdit}
            desc="Click to add new financial instrument"
          />
        }
      />
    </>
  );
};

export default ViewFI;
