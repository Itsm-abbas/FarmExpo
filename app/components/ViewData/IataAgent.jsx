//components/ViewData/iataagent.jsx
import LinkButton from "@components/Button/LinkButton";
import ReusableTable from "@components/Table";
import { fetchIata } from "@constants/consignmentAPI";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@utils/axiosConfig";
import { useRouter } from "next/navigation";
import { MdEdit } from "react-icons/md";
import Swal from "sweetalert2";
const ViewIataAgent = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { isLoading, data } = useQuery({
    queryKey: ["iataagents"],
    queryFn: fetchIata,
  });

  const handleDelete = async (id) => {
    try {
      const result = await Swal.fire({
        title: "Are you sure?",
        text: "Do you really want to delete this iataagent? This action cannot be undone.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Yes, delete it!",
      });

      if (result.isConfirmed) {
        const response = await axiosInstance.delete(`/iataagent/${id}`);
        if (response.status === 200) {
          Swal.fire({
            position: "top-center",
            icon: "success",
            title: "Deleted Successfully",
            showConfirmButton: false,
            timer: 1500,
          });

          queryClient.invalidateQueries(["iataagents"]);
        } else {
          throw new Error("Unexpected response status: " + response.status);
        }
      }
    } catch (error) {
      Swal.fire("Error!", error.message, "error");
    }
  };
  const handleEdit = async (id) => {
    router.push(`/consignment/iata-agent/add-iataAgent?id=${id}`);
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
        title="IATA Agents"
        headers={headers}
        data={data}
        isLoading={isLoading}
        onDelete={handleDelete}
        onEdit={handleEdit}
        addButton={
          <LinkButton
            title="Add iataagent"
            href="/consignment/iata-agent/add-iataAgent"
            icon={MdEdit}
            desc="Click to add new IATA agent"
          />
        }
      />
    </>
  );
};

export default ViewIataAgent;
