import { vendorRoleCollectionRoutes } from "@lib/vendorRoutes";

export const { GET, POST } = vendorRoleCollectionRoutes("iATAAgent", {
  label: "IATA agent",
  idKey: "iataAgentId",
});
