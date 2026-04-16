import { z } from "zod";

const toArray = (value: unknown, ctx: z.RefinementCtx): string[] => {
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) return value;
  ctx.addIssue({
    code: "custom",
    message: `Expected array, null, or undefined, got ${typeof value}`,
    fatal: true,
  });
  return z.NEVER;
};

export const ClientSchema = z.object({
  mac: z.string(),
  rssi: z.number().nonnegative(),
  probes: z.any().transform(toArray).pipe(z.string().array()),
  bssid: z.any().transform(toArray).pipe(z.string().array()),
  packetCount: z.number().optional(),
});
export type Client = z.infer<typeof ClientSchema>;

export const ClientsMapSchema = z.record(z.string(), ClientSchema);
export type ClientsMap = z.infer<typeof ClientsMapSchema>;
