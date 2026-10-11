import { vendorRoleCollectionRoutes } from "@lib/vendorRoutes";

export const { GET, POST } = vendorRoleCollectionRoutes("consignee", {
  label: "Consignee",
  idKey: "consigneeId",
});
