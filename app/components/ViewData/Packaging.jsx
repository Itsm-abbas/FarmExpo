//components/ViewData/packaging.jsx
import LinkButton from "@components/Button/LinkButton";
import ReusableTable from "@components/Table";
import { fetchPackaging } from "@constants/consignmentAPI";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@utils/axiosConfig";
import { useRouter } from "next/navigation";
import { MdEdit, MdAdd, MdInventory } from "react-icons/md";
import Swal from "sweetalert2";
import { motion } from "framer-motion";

const ViewPackaging = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { isLoading, data } = useQuery({
    queryKey: ["packaging"],
    queryFn: fetchPackaging,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await axiosInstance.delete(`/packaging/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["packaging"]);
      Swal.fire({
        position: "top-center",
        icon: "success",
        title: "Deleted Successfully!",
        text: "Packaging type has been removed from the system.",
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
        text: error.message || "Failed to delete packaging",
        icon: "error",
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
        confirmButtonColor: "rgb(var(--color-primary))",
      });
    },
  });

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Delete Packaging Type?",
      text: "This will permanently remove the packaging type. This action cannot be undone.",
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
    router.push(`/consignment/packaging/add-packaging?id=${id}`);
  };

  const headers = [
    { key: "sno", label: "#" },
    { key: "name", label: "Packaging Name", accessor: "name" },
    {
      key: "weight",
      label: "Weight Per Unit (kg)",
      accessor: "packagingWeightPerUnit",
      format: "number",
    },
    { key: "actions", label: "Actions" },
  ];

  // Calculate packaging statistics
  const packagingStats = data?.reduce(
    (acc, item) => ({
      totalTypes: (acc.totalTypes || 0) + 1,
      averageWeight:
        ((acc.averageWeight || 0) +
          (parseFloat(item.packagingWeightPerUnit) || 0)) /
        (acc.totalTypes + 1),
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
      {/* Packaging Statistics */}
      {data && data.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-primary/10 border border-primary/20 rounded-xl p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text/70 text-sm font-inter">
                  Total Packaging Types
                </p>
                <p className="text-2xl font-bold text-text font-poppins">
                  {packagingStats?.totalTypes || 0}
                </p>
              </div>
              <div className="p-2 bg-primary/20 rounded-lg">
                <MdInventory className="text-primary text-xl" />
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
                  Average Weight
                </p>
                <p className="text-2xl font-bold text-text font-poppins">
                  {packagingStats?.averageWeight?.toFixed(2) || 0} kg
                </p>
                <p className="text-xs text-text/60 mt-1">per unit</p>
              </div>
              <div className="p-2 bg-accent/20 rounded-lg">
                <MdInventory className="text-accent text-xl" />
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <ReusableTable
        title="Packaging Types"
        headers={headers}
        data={data}
        isLoading={isLoading}
        onDelete={handleDelete}
        onEdit={handleEdit}
        noDataMessage="No packaging types found. Add your first packaging type to get started."
        addButton={
          <div className="text-center">
            <LinkButton
              title="Add New Packaging Type"
              href="/consignment/packaging/add-packaging"
              icon={MdAdd}
              desc="Click to add a new packaging type with weight specifications"
            />
          </div>
        }
      />

      {/* Packaging Guidelines */}
      {data && data.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-primary/5 rounded-xl p-6 border border-primary/10"
        >
          <h3 className="font-semibold font-poppins text-text mb-3 flex items-center space-x-2">
            <MdInventory className="text-primary" />
            <span>Packaging Guidelines</span>
          </h3>
          <ul className="text-sm font-inter text-text/70 space-y-2">
            <li>
              • Use descriptive names for easy identification (e.g., "Large
              Wooden Crate")
            </li>
            <li>
              • Weight should be in kilograms for accurate shipping calculations
            </li>
            <li>
              • Include the weight of empty packaging for total weight
              calculations
            </li>
            <li>• Update weights if packaging specifications change</li>
            <li>
              • Consistent naming helps in inventory management and reporting
            </li>
          </ul>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ViewPackaging;
