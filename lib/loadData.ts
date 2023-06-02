import fs from "node:fs";
import csv from "csv-parser";
import { flatMap, head, omit } from "lodash";
import { extent } from "d3-array";

export type CoinMetricData = {
  time: string;
  price: string;
  "1k": string;
  "10k": string;
  "100k": string;
  "1M": string;
  "10M": string;
};

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
        const thresholds = Object.keys(
          omit(head(results), ["price", "time"])
        ) as Array<keyof CoinMetricData>;

        const meta = thresholds.reduce((prev, current) => {
          const values = results.map((r) => ({
            time: r["time"],
            value: parseFloat(r[current]),
          }));
          const [min, max] = extent(values, (d) => {
            return d.value;
          });
          return {
            ...prev,
            [current]: {
              values,
              min,
              max,
            },
          };
        }, {});

        const [minY, maxY] = extent(
          flatMap(meta, (d: { values: Array<{ value: string }> }) => d.values),
          (x) => parseFloat(x.value)
        );
        const [minX, maxX] = extent(
          flatMap(meta, (d: { values: Array<{ time: string }> }) => d.values),
          (x) => x.time
        );

        resolve({
          data: results,
          metadata: {
            thresholds,
            xScale: { min: minX, max: maxX },
            yScale: { min: minY, max: maxY },
          },
        });
      });
  });
};
