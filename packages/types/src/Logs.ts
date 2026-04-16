import { z } from "zod";

export const LogEntrySchema = z.object({
  timestamp: z.date(),
  message: z.string(),
  type: z.enum(["info", "warning", "success", "error"]),
});
export type LogEntry = z.infer<typeof LogEntrySchema>;
