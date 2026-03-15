import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Metrics, Order } from "../backend.d";
import { useActor } from "./useActor";

export function useMetrics() {
  const { actor, isFetching } = useActor();
  return useQuery<Metrics>({
    queryKey: ["metrics"],
    queryFn: async () => {
      if (!actor)
        return {
          totalOrders: 0n,
          bricksDispatched: 0n,
          orderClosed: 0n,
          totalPaidAmount: 0n,
          totalDueAmount: 0n,
        };
      return actor.getMetrics();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateMetrics() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (metrics: Metrics) => {
      if (!actor) throw new Error("No actor");
      return actor.updateMetrics(metrics);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["metrics"] });
    },
  });
}

export function useOrders() {
  const { actor, isFetching } = useActor();
  return useQuery<Order[]>({
    queryKey: ["orders"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listOrders();
    },
    enabled: !!actor && !isFetching,
  });
}
