//components/ViewData/customagent.jsx
import LinkButton from "@components/Button/LinkButton";
import ReusableTable from "@components/Table";
import { fetchCustomAgents } from "@constants/consignmentAPI";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@utils/axiosConfig";
import { useRouter } from "next/navigation";
import { MdEdit } from "react-icons/md";
import Swal from "sweetalert2";
const ViewCustomAgent = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["customagents"],
    queryFn: fetchCustomAgents,
  });
  const handleDelete = async (id) => {
    try {
      const result = await Swal.fire({
        title: "Are you sure?",
        text: "Do you really want to delete this customagent? This action cannot be undone.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Yes, delete it!",
      });

      if (result.isConfirmed) {
        const response = await axiosInstance.delete(`/customagent/${id}`);
        if (response.status === 200) {
          Swal.fire({
            position: "top-center",
            icon: "success",
            title: "Deleted Successfully",
            showConfirmButton: false,
            timer: 1500,
          });

          queryClient.invalidateQueries(["customagents"]);
        } else {
          throw new Error("Unexpected response status: " + response.status);
        }
      }
    } catch (error) {
      Swal.fire("Error!", error.message, "error");
    }
  };
  const handleEdit = async (id) => {
    router.push(`/consignment/custom-agent/add-customAgent?id=${id}`);
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
            title="Add customagent"
            href="/consignment/custom-agent/add-customAgent"
            icon={MdEdit}
            desc="Click to add new IATA agent"
          />
        }
      />
    </>
  );
};

export default ViewCustomAgent;
