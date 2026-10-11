import { vendorRoleCollectionRoutes } from "@lib/vendorRoutes";

export const { GET, POST } = vendorRoleCollectionRoutes("packer", {
  label: "Packer",
  idKey: "packerId",
});
