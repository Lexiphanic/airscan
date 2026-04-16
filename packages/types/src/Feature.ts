import { z } from "zod";

export const FeatureSchema = z.enum(["scan", "deauth" /*, "fake-ap" */]);
export type FeatureType = z.infer<typeof FeatureSchema>;
