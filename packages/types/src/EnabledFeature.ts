import z from "zod";

const EnabledFeatureSchemaBase = z.object({
  id: z.string(),
  type: z.string(),
  isActive: z.boolean(),
});
export type EnabledFeatureBase = z.infer<typeof EnabledFeatureSchemaBase>;

export const EnabledFeatureDeauthSchema = EnabledFeatureSchemaBase.extend({
  type: z.literal("deauth"),
  options: z.object({
    accessPoint: z.string().optional(),
    station: z.string().optional(),
    channel: z.number().nonnegative(),
  }),
});
export type EnabledFeatureDeauthType = z.infer<typeof EnabledFeatureDeauthSchema>;

export const EnabledFeatureScanSchema = EnabledFeatureSchemaBase.extend({
  type: z.literal("scan"),
  options: z.object({
    channels: z.array(z.number().nonnegative()).optional(),
    intervalMs: z.number().nonnegative().optional(),
  }).optional(),
});
export type EnabledFeatureScanType = z.infer<typeof EnabledFeatureScanSchema>;

// export const EnabledFeatureFakeApSchema = EnabledFeatureSchemaBase.extend({
//   type: z.literal("fake-ap"),
//   options: z.object({
//     essid: z.string(),
//     channel: z.number().nonnegative(),
//   }),
// });

export const EnabledFeatureSchema = z.discriminatedUnion("type", [
  EnabledFeatureDeauthSchema,
  EnabledFeatureScanSchema,
  // EnabledFeatureFakeApSchema,
]);
export type EnabledFeature = z.infer<typeof EnabledFeatureSchema>;
