import React from 'react';
import { useTranslation } from 'react-i18next';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Typography, Box } from '@mui/material';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const TipChart = ({ pools }) => {
  const { t } = useTranslation();

  // Prepare data for the chart
  const chartData = pools
    .sort((a, b) => new Date(a.start_date) - new Date(b.start_date)) // Sort by date for chronological order
    .map(pool => ({
      date: new Date(pool.start_date).toLocaleDateString(), // X-axis label
      amount: parseFloat(pool.total_amount), // Y-axis value
    }));

  if (!pools || pools.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Typography variant="h6">{t('poolHistory.noChartData')}</Typography>
      </Box>
    );
  }

  const data = {
    labels: chartData.map(data => data.date),
    datasets: [
      {
        label: t('poolHistory.totalAmount'),
        data: chartData.map(data => data.amount),
        borderColor: '#ad9407ff',
        backgroundColor: 'rgba(173, 148, 7, 0.5)',
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false, // Allow chart to fill parent container
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#333333', // Legend text color
        },
      },
      title: {
        display: false,
        text: t('dashboard.overview.tipEvolution'), // Chart title
        color: '#333333',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#333333', // X-axis ticks color
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)', // X-axis grid lines
        },
      },
      y: {
        ticks: {
          color: '#333333', // Y-axis ticks color
          callback: function(value) {
            return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)', // Y-axis grid lines
        },
      },
    },
  };

  return (
    <Box sx={{ height: 300, width: '100%' }}> {/* Set a fixed height for the chart container */}
      <Line options={options} data={data} />
    </Box>
  );
};

export default TipChart;
