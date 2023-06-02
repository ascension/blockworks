import { NextApiRequest, NextApiResponse } from "next";
import { loadData } from "../../lib/loadData";

export default async (_: NextApiRequest, res: NextApiResponse) => {
  const data = await loadData("data/coinmetrics-address-count-05-31-2023.csv");
  return res.status(200).json(data);
};
