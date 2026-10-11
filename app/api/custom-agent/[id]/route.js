import { vendorRoleItemRoutes } from "@lib/vendorRoutes";

export const { GET, PUT, DELETE } = vendorRoleItemRoutes("customAgent", {
  label: "Custom agent",
});
