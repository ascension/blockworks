import { extent } from "d3-array";
import { CoinMetricData, Thresholds } from "./types";
import { flatMap, head, omit } from "lodash";

export function metadata(data: Array<CoinMetricData>) {
  const thresholds = Object.keys(
    omit(head(data), ["price", "time"])
  ) as Array<Thresholds>;
  const meta = thresholds.reduce((prev, current) => {
    const values = data.map((r) => ({
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
  return {
    thresholds,
    xScale: { min: minX, max: maxX },
    yScale: { min: minY, max: maxY },
  };
}
