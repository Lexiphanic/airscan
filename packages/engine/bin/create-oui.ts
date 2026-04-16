import { writeFileSync } from "node:fs";
import ouiData from "oui-data" with { type: "json" };

function getCleanedData() {
  const results: Record<string, string> = {};
  Object.entries(ouiData).forEach((entry) => {
    const firstLine = entry[1]
      .split("\n")[0]!
      .replace(/\s+/g, " ")
      .replace(/[ \.,]+/, "")
      .trim();
    if (firstLine) {
      const formatted = entry[0].toLowerCase() ?? entry[0];
      results[formatted] = firstLine;
    }
  });

  return results;
}

writeFileSync(
  import.meta.dirname + "/../src/data/oui.json",
  JSON.stringify(getCleanedData()),
);
