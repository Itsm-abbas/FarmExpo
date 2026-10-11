"use client";

// One name per kind of data, so every page shares the same cached copy and a
// save refreshes exactly what changed.
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@utils/axiosConfig";

export const queryKeys = {
  consignments: ["consignments"],
  consignment: (id) => ["consignment", Number(id)],
  traders: ["traders"],
  consignees: ["consignees"],
  packers: ["packers"],
  iataAgents: ["iataAgents"],
  customAgents: ["customAgents"],
  commodities: ["commodities"],
  packaging: ["packaging"],
  financialInstruments: ["financialInstruments"],
  utilization: ["utilization"],
  vendors: ["vendors-list"],
  vendorTransactions: ["vendorTransactions"],
};

const get = (url) => async () => (await axiosInstance.get(url)).data;

// The lists the consignment forms choose from.
export const listQueries = {
  traders: { queryKey: queryKeys.traders, queryFn: get("/trader") },
  consignees: { queryKey: queryKeys.consignees, queryFn: get("/consignee") },
  packers: { queryKey: queryKeys.packers, queryFn: get("/packer") },
  iataAgents: { queryKey: queryKeys.iataAgents, queryFn: get("/iata-agent") },
  customAgents: { queryKey: queryKeys.customAgents, queryFn: get("/custom-agent") },
  commodities: { queryKey: queryKeys.commodities, queryFn: get("/commodity") },
  packaging: { queryKey: queryKeys.packaging, queryFn: get("/packaging") },
  financialInstruments: { queryKey: queryKeys.financialInstruments, queryFn: get("/financialinstrument") },
  utilization: { queryKey: queryKeys.utilization, queryFn: get("/utilization") },
};

export const consignmentQuery = (id) => ({
  queryKey: queryKeys.consignment(id),
  queryFn: get(`/consignment/${id}`),
});

// A consignment with everything linked to it. Opened from a list, it shows
// the list's copy straight away while the full record is fetched.
export function useConsignment(id) {
  const queryClient = useQueryClient();
  return useQuery({
    ...consignmentQuery(id),
    enabled: Boolean(id),
    initialData: () =>
      queryClient
        .getQueryData(queryKeys.consignments)
        ?.find((c) => c.id === Number(id)),
    // The list's copy counts as old, so it is always refreshed once.
    initialDataUpdatedAt: 0,
  });
}

// After a consignment changes: lists and ledgers are marked out of date and
// refresh the next time they are shown (not straight away). With an `id`, so
// is that consignment: the page that changed it keeps its copy, and the next
// page to open it (the invoice, say) fetches the saved version.
export function markConsignmentChanged(queryClient, id) {
  const keys = [queryKeys.consignments, queryKeys.vendors, queryKeys.vendorTransactions];
  if (id) keys.push(queryKeys.consignment(id));
  for (const queryKey of keys) {
    queryClient.invalidateQueries({ queryKey, refetchType: "none" });
  }
}
