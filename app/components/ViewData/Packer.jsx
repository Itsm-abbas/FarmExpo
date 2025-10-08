//components/ViewData/packer.jsx
import LinkButton from "@components/Button/LinkButton";
import ReusableTable from "@components/Table";
import { fetchPackers } from "@constants/consignmentAPI";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@utils/axiosConfig";
import { useRouter } from "next/navigation";
import { MdEdit, MdAdd, MdLocalShipping } from "react-icons/md";
import Swal from "sweetalert2";
import { motion } from "framer-motion";

const ViewPacker = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { isLoading, data } = useQuery({
    queryKey: ["packers"],
    queryFn: fetchPackers,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await axiosInstance.delete(`/packer/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["packers"]);
      Swal.fire({
        position: "top-center",
        icon: "success",
        title: "Deleted Successfully!",
        text: "Packer has been removed from the system.",
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
        text: error.message || "Failed to delete packer",
        icon: "error",
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
        confirmButtonColor: "rgb(var(--color-primary))",
      });
    },
  });

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Delete Packer?",
      text: "This will permanently remove the packing service provider and all associated data. This action cannot be undone.",
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
    router.push(`/consignment/packer/add-packer?id=${id}`);
  };

  const headers = [
    { key: "sno", label: "#" },
    { key: "name", label: "Packer Name", accessor: "vendor.name" },
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

  // Calculate packer statistics
  const packerStats = data?.reduce(
    (acc, item) => ({
      totalPackers: (acc.totalPackers || 0) + 1,
      totalBalance:
        (acc.totalBalance || 0) + (parseFloat(item.vendor?.balance) || 0),
      activePackers:
        (acc.activePackers || 0) + (item.vendor?.balance > 0 ? 1 : 0),
    }),
    {}
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Packer Statistics */}
      {data && data.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-primary/10 border border-primary/20 rounded-xl p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text/70 text-sm font-inter">Total Packers</p>
                <p className="text-2xl font-bold text-text font-poppins">
                  {packerStats?.totalPackers || 0}
                </p>
              </div>
              <div className="p-2 bg-primary/20 rounded-lg">
                <MdLocalShipping className="text-primary text-xl" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-accent/10 border border-accent/20 rounded-xl p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text/70 text-sm font-inter">
                  Active Packers
                </p>
                <p className="text-2xl font-bold text-text font-poppins">
                  {packerStats?.activePackers || 0}
                </p>
                <p className="text-xs text-text/60 mt-1">
                  with positive balance
                </p>
              </div>
              <div className="p-2 bg-accent/20 rounded-lg">
                <MdLocalShipping className="text-accent text-xl" />
              </div>
            </div>
          </motion.div>

          {/* <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-green-500/10 border border-green-500/20 rounded-xl p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text/70 text-sm font-inter">Total Balance</p>
                <p className="text-2xl font-bold text-text font-poppins">
                  {new Intl.NumberFormat(undefined, {}).format(
                    packerStats?.totalBalance || 0
                  )}
                </p>
              </div>
              <div className="p-2 bg-green-500/20 rounded-lg">
                <MdLocalShipping className="text-green-500 text-xl" />
              </div>
            </div>
          </motion.div> */}
        </div>
      )}

      <ReusableTable
        title="Packing Service Providers"
        headers={headers}
        data={data}
        isLoading={isLoading}
        onDelete={handleDelete}
        onEdit={handleEdit}
        noDataMessage="No packing service providers found. Add your first packer to get started."
        addButton={
          <div className="text-center">
            <LinkButton
              title="Add New Packer"
              href="/consignment/packer/add-packer"
              icon={MdAdd}
              desc="Click to register a new packing service provider"
            />
          </div>
        }
      />
    </motion.div>
  );
};

export default ViewPacker;
