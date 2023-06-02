import Head from "next/head";
import Layout from "../components/layout";
import { GetStaticProps } from "next";

import ParentSize from "@visx/responsive/lib/components/ParentSize";

import fs from "node:fs";
import csv from "csv-parser";
import { flatMap, head, omit } from "lodash";

import React, { useMemo, useCallback } from "react";
import { AreaClosed, Line, Bar } from "@visx/shape";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { curveMonotoneX } from "@visx/curve";
import { GridRows, GridColumns } from "@visx/grid";
import { scaleTime, scaleLinear, scaleOrdinal } from "@visx/scale";
import {
  withTooltip,
  Tooltip,
  TooltipWithBounds,
  defaultStyles,
} from "@visx/tooltip";
import { WithTooltipProvidedProps } from "@visx/tooltip/lib/enhancers/withTooltip";
import { localPoint } from "@visx/event";
import { LinearGradient } from "@visx/gradient";
import { bisector, extent } from "d3-array";
import { LegendOrdinal, LegendItem, LegendLabel } from "@visx/legend";
import { timeFormat } from "d3-time-format";
import useSWR from "swr";
import { loadData } from "../lib/loadData";

export const background = "#fff";
export const background2 = "#fff";
export const accentColor = "#000";
export const accentColorDark = "#000";
const tooltipStyles = {
  ...defaultStyles,
  background,
  border: "1px solid black",
  color: "black",
};

// util
const formatDate = timeFormat("%b %d, '%y");

type CoinMarketAddressCounts = {
  time: string;
  price: string;
  "1k": string;
  "10k": string;
  "100k": string;
  "1M": string;
  "10M": string;
};

type TimeSeries = { time: string; value: number };
type Thresholds = "1k" | "10k" | "100k" | "1M" | "10M";

type ApiResponse = {
  data: Array<CoinMarketAddressCounts>;
  metadata: {
    thresholds: Array<Thresholds>;
    xScale: { min: number; max: number };
    yScale: { min: number; max: number };
  };
  meta: Record<
    "1k" | "10k" | "100k" | "1M" | "10M",
    { values: Array<TimeSeries> }
  >;
};

// accessors
const getDate = (d?: CoinMarketAddressCounts) => new Date(d?.time ?? "");
const getAddressThresholdCount = (
  d?: CoinMarketAddressCounts,
  threshold: Thresholds = "1k"
) => {
  return d ? parseInt(d[threshold]) : 0;
};
const bisectDate = bisector<CoinMarketAddressCounts, Date>(
  (d) => new Date(d.time)
).left;

export type AreaProps = {
  width: number;
  height: number;
  margin?: { top: number; right: number; bottom: number; left: number };
};

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("An error occurred while fetching the data.");
  }
  return response.json();
};

const thresholdColorMap: Record<Thresholds, string> = {
  "1k": "blue",
  "10k": "orange",
  "100k": "red",
  "1M": "purple",
  "10M": "pink",
};
const thresholdColors = Object.values(thresholdColorMap);

const Chart = withTooltip<
  AreaProps & { data: ApiResponse },
  { data?: CoinMarketAddressCounts; closestThreshold: Thresholds }
>(
  ({
    data,
    width,
    height,
    margin = { top: 0, right: 0, bottom: 0, left: 0 },
    showTooltip,
    hideTooltip,
    tooltipData,
    tooltipTop = 0,
    tooltipLeft = 0,
  }: AreaProps & { data: ApiResponse } & WithTooltipProvidedProps<{
      data?: CoinMarketAddressCounts;
      closestThreshold: Thresholds;
    }>) => {
    if (width < 10) return null;

    // bounds
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // const { data, error, isLoading } = useSWR<ApiResponse>(
    //   "/api/btc-addresses",
    //   fetcher
    // );
    // scales
    const dateScale = useMemo(
      () =>
        scaleTime({
          range: [margin.left, innerWidth + margin.left],
          domain: [
            new Date(data?.metadata.xScale.min ?? ""),
            new Date(data?.metadata.xScale.max ?? ""),
          ],
        }),
      [innerWidth, margin.left, data]
    );

    const yScale = useMemo(
      () =>
        scaleLinear({
          range: [innerHeight + margin.top, margin.top],
          domain: [0, data?.metadata.yScale.max ?? 0],
          nice: true,
        }),
      [margin.top, innerHeight, data]
    );

    // tooltip handler
    const handleTooltip = useCallback(
      (
        event:
          | React.TouchEvent<SVGRectElement | SVGPathElement>
          | React.MouseEvent<SVGRectElement | SVGPathElement>
      ) => {
        const { x, y } = localPoint(event) || { x: 0 };

        const x0 = dateScale.invert(x);
        const index = bisectDate(data?.data ?? [], x0, 1);
        const d0 = data?.data[index - 1];
        const d1 = data?.data[index];
        let d = d0;
        if (d1 && getDate(d1)) {
          d =
            x0.valueOf() - getDate(d0).valueOf() >
            getDate(d1).valueOf() - x0.valueOf()
              ? d1
              : d0;
        }

        const xVals =
          data?.metadata.thresholds.map((key) =>
            yScale(getAddressThresholdCount(d, key))
          ) ?? [];

        function findClosestNeighbor(
          array: Array<number>,
          target: number = 0,
          maxDistance: number
        ) {
          // Sort the array in ascending order
          const sortedArray = array.slice().sort((a, b) => a - b);

          let closestIndex = -1;
          let closestDiff = Infinity;

          // Iterate through the sorted array
          for (let i = 0; i < sortedArray.length; i++) {
            const currentDiff = Math.abs(sortedArray[i] - target);

            // Check if the current difference is within the maximum distance
            if (currentDiff <= maxDistance && currentDiff < closestDiff) {
              closestIndex = i;
              closestDiff = currentDiff;
            }
          }

          // If a closest neighbor was found, return the value at the index; otherwise, return null
          return closestIndex !== -1 ? sortedArray[closestIndex] : null;
        }

        const neighbor = findClosestNeighbor(xVals, y, 100);
        const closestThreshold =
          data?.metadata.thresholds[
            xVals.findIndex((element) => element === neighbor)
          ];

        showTooltip({
          tooltipData: { data: d, closestThreshold },
          tooltipLeft: x,
          tooltipTop: yScale(getAddressThresholdCount(d, closestThreshold)),
        });
      },
      [showTooltip, yScale, dateScale, data]
    );
    const legendGlyphSize = 15;
    const ordinalColorScale = scaleOrdinal({
      domain: data.metadata.thresholds.map((threshold) => `>$${threshold}`),
      range: thresholdColors,
    });

    return (
      <div>
        <div className="flex justify-center items-center text-sm py-2">
          <LegendOrdinal
            scale={ordinalColorScale}
            labelFormat={(label) => `${label.toUpperCase()}`}
          >
            {(labels) => (
              <div style={{ display: "flex", flexDirection: "row" }}>
                {labels.map((label, i) => (
                  <LegendItem key={`legend-quantile-${i}`} margin="0 5px">
                    <svg width={legendGlyphSize} height={legendGlyphSize}>
                      <rect
                        fill={label.value}
                        width={legendGlyphSize}
                        height={legendGlyphSize}
                      />
                    </svg>
                    <LegendLabel align="left" margin="0 0 0 4px">
                      {label.text}
                    </LegendLabel>
                  </LegendItem>
                ))}
              </div>
            )}
          </LegendOrdinal>
        </div>

        <svg width={width} height={height}>
          <rect
            x={0}
            y={0}
            width={width}
            height={height}
            fill="url(#area-background-gradient)"
            rx={14}
          />
          <LinearGradient
            id="area-background-gradient"
            from={background}
            to={background2}
          />
          <LinearGradient
            id="area-gradient"
            from={accentColor}
            to={accentColor}
            toOpacity={1}
          />
          <GridRows
            left={margin.left}
            scale={yScale}
            width={innerWidth}
            strokeDasharray="1,3"
            stroke={accentColor}
            strokeOpacity={0.3}
            pointerEvents="none"
          />
          <GridColumns
            top={margin.top}
            scale={dateScale}
            height={innerHeight}
            strokeDasharray="1,3"
            stroke={accentColor}
            strokeOpacity={0}
            pointerEvents="none"
          />
          {data &&
            data.data &&
            data.metadata.thresholds.map((key, index) => (
              <AreaClosed<CoinMarketAddressCounts>
                key={key}
                data={data?.data ?? []}
                x={(d) => dateScale(getDate(d)) ?? 0}
                y={(d) => yScale(getAddressThresholdCount(d, key))}
                y0={(d) => yScale(getAddressThresholdCount(d, key))}
                yScale={yScale}
                strokeWidth={2}
                stroke={thresholdColorMap[key]}
                fill="transparent"
                curve={curveMonotoneX}
              />
            ))}
          <AxisBottom scale={dateScale} top={innerHeight + margin.top} />
          <AxisLeft
            scale={yScale}
            left={margin.left}
            tickFormat={(v) => formatCurrency(v.toString())}
          />
          <Bar
            x={margin.left}
            y={margin.top}
            width={innerWidth}
            height={innerHeight}
            fill="transparent"
            rx={14}
            onTouchStart={handleTooltip}
            onTouchMove={handleTooltip}
            onMouseMove={handleTooltip}
            onMouseLeave={() => hideTooltip()}
          />

          {tooltipData && (
            <g>
              <Line
                from={{ x: tooltipLeft, y: margin.top }}
                to={{ x: tooltipLeft, y: innerHeight + margin.top }}
                stroke={accentColorDark}
                strokeWidth={2}
                pointerEvents="none"
                strokeDasharray="5,2"
              />
              <circle
                cx={tooltipLeft}
                cy={tooltipTop + 1}
                r={4}
                fill="black"
                fillOpacity={0.1}
                stroke="black"
                strokeOpacity={0.1}
                strokeWidth={2}
                pointerEvents="none"
              />
              <circle
                cx={tooltipLeft}
                cy={tooltipTop}
                r={4}
                fill={accentColorDark}
                stroke="white"
                strokeWidth={2}
                pointerEvents="none"
              />
            </g>
          )}
        </svg>
        {tooltipData && (
          <div>
            <TooltipWithBounds
              key={Math.random()}
              top={tooltipTop - 12}
              left={tooltipLeft + 12}
              style={tooltipStyles}
            >
              {`>$${
                tooltipData.closestThreshold || "1k"
              } ${getAddressThresholdCount(
                tooltipData.data,
                tooltipData.closestThreshold || "1k"
              )}`}
            </TooltipWithBounds>
            <Tooltip
              top={innerHeight + margin.top + 48}
              left={tooltipLeft}
              style={{
                ...defaultStyles,
                minWidth: 72,
                textAlign: "center",
                transform: "translateX(-50%)",
              }}
            >
              {formatDate(getDate(tooltipData.data))}
            </Tooltip>
          </div>
        )}
      </div>
    );
  }
);

type HomeProps = {
  data: ApiResponse;
};

const formatCurrency = (value: string) => {
  // Format the currency value to abbreviated format in USD
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    compactDisplay: "short",
  });

  return formatter.format(value);
};

const Home: React.FC<HomeProps> = ({ data }) => {
  return (
    <Layout home>
      <Head>
        <title>BTC Address Balances over Time</title>
      </Head>
      <section>
        <div className="max-w-6xl mx-auto p-8 text-center h-[60vh]">
          <ParentSize>
            {({ width, height }) => (
              <Chart
                width={width}
                height={height}
                data={data}
                margin={{ left: 48, top: 96, right: 10, bottom: 96 }}
              />
            )}
          </ParentSize>
        </div>
      </section>
    </Layout>
  );
};

export default Home;

const csvFilePath = "data/coinmetrics-address-count-05-31-2023.csv";

export const getStaticProps: GetStaticProps = async () => {
  try {
    // const response = await fetch("http://localhost:3000/api/btc-addresses");
    // const data = await response.json();
    const data = await loadData(csvFilePath);
    return {
      props: {
        data,
      },
    };
  } catch (error) {
    console.error(error);
    return {
      props: {},
    };
  }
};
