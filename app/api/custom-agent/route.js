import { vendorRoleCollectionRoutes } from "@lib/vendorRoutes";

export const { GET, POST } = vendorRoleCollectionRoutes("customAgent", {
  label: "Custom agent",
  idKey: "customAgentId",
});
