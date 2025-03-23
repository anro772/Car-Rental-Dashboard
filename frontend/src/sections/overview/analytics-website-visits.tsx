import type { CardProps } from '@mui/material/Card';
import type { ChartOptions } from 'src/components/chart';

import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import { useTheme, alpha as hexAlpha } from '@mui/material/styles';

import { Chart, useChart } from 'src/components/chart';

// ----------------------------------------------------------------------

type Props = CardProps & {
  title?: string;
  subheader?: string;
  chart: {
    colors?: string[];
    categories?: string[];
    series: {
      name: string;
      data: number[];
    }[];
    options?: ChartOptions;
  };
  type?: 'currency' | 'visits' | 'number'; // Add type prop
};

export function AnalyticsWebsiteVisits({ title, subheader, chart, type = 'visits', ...other }: Props) {
  const theme = useTheme();

  const chartColors = chart.colors ?? [
    theme.palette.primary.dark,
    hexAlpha(theme.palette.primary.light, 0.64),
  ];

  // Create tooltip formatter based on type
  const getTooltipFormatter = (type: string) => {
    switch (type) {
      case 'currency':
        return (value: number) => `$${value.toFixed(2)}`;
      case 'visits':
        return (value: number) => `${value} visits`;
      case 'number':
      default:
        return (value: number) => `${value}`;
    }
  };

  // Create y-axis formatter based on type
  const getYAxisFormatter = (type: string) => {
    switch (type) {
      case 'currency':
        return (value: number) => `$${value.toLocaleString()}`;
      case 'visits':
      case 'number':
      default:
        return (value: number) => value.toString();
    }
  };

  const chartOptions = useChart({
    colors: chartColors,
    stroke: {
      width: 2,
      colors: ['transparent'],
    },
    xaxis: {
      categories: chart.categories,
    },
    yaxis: {
      labels: {
        formatter: getYAxisFormatter(type),
      },
    },
    legend: {
      show: true,
    },
    tooltip: {
      y: {
        formatter: getTooltipFormatter(type),
      },
    },
    ...chart.options,
  });

  return (
    <Card {...other}>
      <CardHeader title={title} subheader={subheader} />

      <Chart
        type="bar"
        series={chart.series}
        options={chartOptions}
        height={364}
        sx={{ py: 2.5, pl: 1, pr: 2.5 }}
      />
    </Card>
  );
}