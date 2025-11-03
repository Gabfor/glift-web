declare module "recharts" {
  import * as React from "react";

  type RechartsProps = Record<string, unknown>;

  export const AreaChart: React.ComponentType<RechartsProps>;
  export const Area: React.ComponentType<RechartsProps>;
  export const XAxis: React.ComponentType<RechartsProps>;
  export const YAxis: React.ComponentType<RechartsProps>;
  export const Tooltip: React.ComponentType<RechartsProps>;
  export const ResponsiveContainer: React.ComponentType<RechartsProps>;
  export const CartesianGrid: React.ComponentType<RechartsProps>;
}

declare module "recharts/types/chart/generateCategoricalChart" {
  export interface CategoricalChartState {
    isTooltipActive?: boolean;
    activePayload?: Array<{ value?: number | string | null } | undefined>;
    activeCoordinate?: {
      x: number;
      y: number;
    };
    chartX?: number;
    chartY?: number;
    activeLabel?: string | number;
  }
}
