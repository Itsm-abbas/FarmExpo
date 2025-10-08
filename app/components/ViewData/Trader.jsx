//components/ViewData/Trader.jsx
import LinkButton from "@components/Button/LinkButton";
import ReusableTable from "@components/Table";
import { fetchTraders } from "@constants/consignmentAPI";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@utils/axiosConfig";
import { useRouter } from "next/navigation";
import { MdEdit, MdAdd, MdBusiness } from "react-icons/md";
import Swal from "sweetalert2";
import { motion } from "framer-motion";

const ViewTrader = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { isLoading, data } = useQuery({
    queryKey: ["traders"],
    queryFn: fetchTraders,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await axiosInstance.delete(`/trader/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["traders"]);
      Swal.fire({
        position: "top-center",
        icon: "success",
        title: "Deleted Successfully!",
        text: "Trader has been removed from the system.",
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
        text: error.message || "Failed to delete trader",
        icon: "error",
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
        confirmButtonColor: "rgb(var(--color-primary))",
      });
    },
  });

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Delete Trader?",
      text: "This will permanently remove the trading partner and all associated transaction data. This action cannot be undone.",
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
    router.push(`/consignment/trader/add-trader?id=${id}`);
  };

  const headers = [
    { key: "sno", label: "#" },
    { key: "ntn", label: "NTN", accessor: "ntn" },
    { key: "name", label: "Trader Name", accessor: "name" },
    { key: "address", label: "Business Address", accessor: "address" },
    { key: "country", label: "Country", accessor: "country" },
    { key: "actions", label: "Actions" },
  ];

  // Calculate trader statistics
  const traderStats = data?.reduce(
    (acc, item) => ({
      totalTraders: (acc.totalTraders || 0) + 1,
      internationalTraders:
        (acc.internationalTraders || 0) +
        (item.country && item.country.toLowerCase() !== "pakistan" ? 1 : 0),
      localTraders:
        (acc.localTraders || 0) +
        (item.country && item.country.toLowerCase() === "pakistan" ? 1 : 0),
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
      {/* Trader Statistics */}
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
                <p className="text-text/70 text-sm font-inter">Total Traders</p>
                <p className="text-2xl font-bold text-text font-poppins">
                  {traderStats?.totalTraders || 0}
                </p>
              </div>
              <div className="p-2 bg-primary/20 rounded-lg">
                <MdBusiness className="text-primary text-xl" />
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
                <p className="text-text/70 text-sm font-inter">Local Traders</p>
                <p className="text-2xl font-bold text-text font-poppins">
                  {traderStats?.localTraders || 0}
                </p>
                <p className="text-xs text-text/60 mt-1">based in Pakistan</p>
              </div>
              <div className="p-2 bg-accent/20 rounded-lg">
                <MdBusiness className="text-accent text-xl" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-green-500/10 border border-green-500/20 rounded-xl p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text/70 text-sm font-inter">
                  International Traders
                </p>
                <p className="text-2xl font-bold text-text font-poppins">
                  {traderStats?.internationalTraders || 0}
                </p>
                <p className="text-xs text-text/60 mt-1">outside Pakistan</p>
              </div>
              <div className="p-2 bg-green-500/20 rounded-lg">
                <MdBusiness className="text-green-500 text-xl" />
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <ReusableTable
        title="Trading Partners"
        headers={headers}
        data={data}
        isLoading={isLoading}
        onDelete={handleDelete}
        onEdit={handleEdit}
        noDataMessage="No trading partners found. Add your first trader to get started."
        addButton={
          <div className="text-center">
            <LinkButton
              title="Add New Trader"
              href="/consignment/trader/add-trader"
              icon={MdAdd}
              desc="Click to register a new trading partner for your business"
            />
          </div>
        }
      />

      {/* Trader Guidelines */}
      {data && data.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-primary/5 rounded-xl p-6 border border-primary/10"
        >
          <h3 className="font-semibold font-poppins text-text mb-3 flex items-center space-x-2">
            <MdBusiness className="text-primary" />
            <span>Trader Management Guidelines</span>
          </h3>
          <ul className="text-sm font-inter text-text/70 space-y-2">
            <li>
              • Ensure NTN numbers are accurate and up-to-date for tax
              compliance
            </li>
            <li>
              • Use complete business addresses for official correspondence
            </li>
            <li>
              • Specify correct country for international trade documentation
            </li>
            <li>
              • Keep trader information updated for smooth transaction
              processing
            </li>
            <li>• Verify trader credentials before adding to the system</li>
          </ul>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ViewTrader;
