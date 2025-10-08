// utils/updateConsignment.js
import { getCookie } from "cookies-next";
const UpdateConsignment = async (consignmentId, updatedFields, status) => {
  const token = getCookie("token");
  try {
    // Fetch the existing consignment details
    const existingResponse = await fetch(`/api/consignment/${consignmentId}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (!existingResponse.ok) {
      throw new Error("Failed to fetch existing consignment.");
    }

    const existingConsignment = await existingResponse.json();

    // Merge the existing consignment data with the updated fields
    const updatedConsignment = {
      ...existingConsignment,
      ...updatedFields,
      ...(status && { status }),
    };
    const response = await fetch(`/api/consignment/${consignmentId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updatedConsignment),
    });
    if (!response.ok) {
      throw new Error("Failed to update consignment.");
    }
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error updating consignment:", error);
    throw error;
  }
};

export default UpdateConsignment;
