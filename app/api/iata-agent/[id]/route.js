import { vendorRoleItemRoutes } from "@lib/vendorRoutes";

export const { GET, PUT, DELETE } = vendorRoleItemRoutes("iATAAgent", {
  label: "IATA agent",
});
