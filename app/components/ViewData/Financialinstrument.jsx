//components/ViewData/Trader.jsx
import { formatMoney } from "@utils/money";
import useSession from "@hooks/useSession";
import LinkButton from "@components/Button/LinkButton";
import ReusableTable from "@components/Table";
import { fetchFinancialInstrument } from "@constants/consignmentAPI";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@utils/axiosConfig";
import { useRouter } from "next/navigation";
import { MdEdit, MdAdd, MdReceipt } from "react-icons/md";
import Swal from "sweetalert2";
import { motion } from "framer-motion";

const ViewFI = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  // Only admins may delete records; staff see edit only.
  const { isAdmin } = useSession();

  const { data, isLoading } = useQuery({
    queryKey: ["financialInstruments"],
    queryFn: fetchFinancialInstrument,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await axiosInstance.delete(`/financialinstrument/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financialInstruments"] });
      Swal.fire({
        position: "top-center",
        icon: "success",
        title: "Deleted Successfully!",
        text: "Financial instrument has been removed from the system.",
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
        text: error.message || "Failed to delete financial instrument",
        icon: "error",
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
        confirmButtonColor: "rgb(var(--color-primary))",
      });
    },
  });

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Delete Financial Instrument?",
      text: "This will permanently remove the financial instrument and all associated transaction data. This action cannot be undone.",
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
    router.push(`/consignment/add-financialinstrument?id=${id}`);
  };

  // Calculate financial summary. Instruments can be in different currencies,
  // so totals are kept per currency rather than added together.
  const financialSummary = data?.reduce(
    (acc, item) => {
      const currency = item.currency || "";
      acc.totalAmount[currency] =
        (acc.totalAmount[currency] || 0) + (item.amount || 0);
      acc.totalBalance[currency] =
        (acc.totalBalance[currency] || 0) + (item.balance || 0);
      acc.activeInstruments += item.balance > 0 ? 1 : 0;
      return acc;
    },
    { totalAmount: {}, totalBalance: {}, activeInstruments: 0 }
  );
  const formatTotals = (totals = {}) =>
    Object.entries(totals)
      .map(([currency, amount]) => formatMoney(amount, currency))
      .join(" + ") || formatMoney(0);

  const headers = [
    { key: "sno", label: "#" },
    { key: "number", label: "Instrument No", accessor: "number" },
    { key: "trader", label: "Trader", accessor: "trader.name" },
    { key: "consignee", label: "Consignee", accessor: "consignee.vendor.name" },
    { key: "mode", label: "Mode", accessor: "mode" },
    { key: "currency", label: "Currency", accessor: "currency" },
    {
      key: "amount",
      label: "Amount",
      accessor: "amount",
      format: "currency",
      currencyAccessor: "currency",
    },
    {
      key: "balance",
      label: "Balance",
      accessor: "balance",
      format: "currency",
      currencyAccessor: "currency",
    },
    { key: "status", label: "Status", accessor: "status" },
    { key: "actions", label: "Actions" },
  ];

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Financial Summary Cards */}
      {/* {data && data.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-primary/10 border border-primary/20 rounded-xl p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text/70 text-sm font-inter">Total Amount</p>
                <p className="text-2xl font-bold text-text font-poppins">
                  {formatTotals(financialSummary?.totalAmount)}
                </p>
              </div>
              <div className="p-2 bg-primary/20 rounded-lg">
                <MdReceipt className="text-primary text-xl" />
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
                  Outstanding Balance
                </p>
                <p className="text-2xl font-bold text-text font-poppins">
                  {formatTotals(financialSummary?.totalBalance)}
                </p>
              </div>
              <div className="p-2 bg-accent/20 rounded-lg">
                <MdReceipt className="text-accent text-xl" />
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
                  Active Instruments
                </p>
                <p className="text-2xl font-bold text-text font-poppins">
                  {financialSummary?.activeInstruments || 0}
                </p>
                <p className="text-xs text-text/60 mt-1">
                  of {data.length} total
                </p>
              </div>
              <div className="p-2 bg-green-500/20 rounded-lg">
                <MdReceipt className="text-green-500 text-xl" />
              </div>
            </div>
          </motion.div>
        </div>
      )} */}

      <ReusableTable
        title="Financial Instruments"
        headers={headers}
        data={data}
        isLoading={isLoading}
        onDelete={isAdmin ? handleDelete : undefined}
        onEdit={handleEdit}
        noDataMessage="No financial instruments found. Add your first financial instrument to get started."
        addButton={
          <div className="text-center">
            <LinkButton
              title="Add New Financial Instrument"
              href="/consignment/add-financialinstrument"
              icon={MdAdd}
              desc="Click to create a new financial instrument for transactions"
            />
          </div>
        }
      />
    </motion.div>
  );
};

export default ViewFI;
