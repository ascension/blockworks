export type CoinMetricData = {
  time: string;
  price: string;
  "1k": string;
  "10k": string;
  "100k": string;
  "1M": string;
  "10M": string;
};

export type Thresholds = keyof Omit<CoinMetricData, "time" | "price">;
