// utils/updateConsignment.js
import axiosInstance from "@utils/axiosConfig";

// Sends only the changed fields; the API merges them into the consignment,
// keeps the status from moving backwards and re-posts the ledger entries.
const UpdateConsignment = async (consignmentId, updatedFields, status) => {
  try {
    const { data } = await axiosInstance.put(`/consignment/${consignmentId}`, {
      ...updatedFields,
      ...(status && { status }),
    });
    return data;
  } catch (error) {
    console.error("Error updating consignment:", error);
    throw error;
  }
};

export default UpdateConsignment;
