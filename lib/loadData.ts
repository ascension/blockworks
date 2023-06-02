import fs from "node:fs";
import csv from "csv-parser";
import { CoinMetricData } from "./types";
import { metadata } from "./metadata";

export const loadData = (filePath: string) => {
  const results: Array<CoinMetricData> = [];

  return new Promise<{}>((resolve, reject) => {
    fs.createReadStream(filePath, { encoding: "utf16le" })
      .pipe(
        csv({
          separator: "\t",
          headers: ["time", "price", "1k", "10k", "100k", "1M", "10M"],
          skipLines: 1,
        })
      )
      .on("data", (data: CoinMetricData) => results.push(data))
      .on("end", () => {
        resolve({
          data: results,
          metadata: metadata(results),
        });
      });
  });
};
