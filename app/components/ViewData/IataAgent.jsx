//components/ViewData/iataagent.jsx
import LinkButton from "@components/Button/LinkButton";
import ReusableTable from "@components/Table";
import { fetchIata } from "@constants/consignmentAPI";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@utils/axiosConfig";
import { useRouter } from "next/navigation";
import { MdEdit, MdAdd, MdFlight } from "react-icons/md";
import Swal from "sweetalert2";
import { motion } from "framer-motion";

const ViewIataAgent = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { isLoading, data } = useQuery({
    queryKey: ["iataagents"],
    queryFn: fetchIata,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await axiosInstance.delete(`/iata-agent/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["iataagents"]);
      Swal.fire({
        position: "top-center",
        icon: "success",
        title: "Deleted Successfully!",
        text: "IATA agent has been removed from the system.",
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
        text: error.message || "Failed to delete IATA agent",
        icon: "error",
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
        confirmButtonColor: "rgb(var(--color-primary))",
      });
    },
  });

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Delete IATA Agent?",
      text: "This will permanently remove the IATA certified agent and all associated data. This action cannot be undone.",
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
    router.push(`/consignment/iata-agent/add-iataAgent?id=${id}`);
  };

  const headers = [
    { key: "sno", label: "#" },
    { key: "name", label: "Agent Name", accessor: "vendor.name" },
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
        title="IATA Agents"
        headers={headers}
        data={data}
        isLoading={isLoading}
        onDelete={handleDelete}
        onEdit={handleEdit}
        noDataMessage="No IATA agents found. Add your first IATA certified agent to get started."
        addButton={
          <div className="text-center">
            <LinkButton
              title="Add New IATA Agent"
              href="/consignment/iata-agent/add-iataAgent"
              icon={MdAdd}
              desc="Click to register a new IATA certified agent for air cargo operations"
            />
          </div>
        }
      />
    </motion.div>
  );
};

export default ViewIataAgent;
