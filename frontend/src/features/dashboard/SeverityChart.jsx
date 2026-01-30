
import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const SeverityChart = ({ data }) => {
    if (!data) return null;

    const chartData = {
        labels: ['Critical', 'High', 'Medium', 'Low'],
        datasets: [
            {
                data: [data.critical, data.high, data.medium, data.low],
                backgroundColor: [
                    'rgba(239, 68, 68, 0.8)', // Critical - Red
                    'rgba(249, 115, 22, 0.8)', // High - Orange
                    'rgba(234, 179, 8, 0.8)', // Medium - Yellow
                    'rgba(59, 130, 246, 0.8)', // Low - Blue
                ],
                borderColor: [
                    'rgba(239, 68, 68, 1)',
                    'rgba(249, 115, 22, 1)',
                    'rgba(234, 179, 8, 1)',
                    'rgba(59, 130, 246, 1)',
                ],
                borderWidth: 1,
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'right',
                labels: { color: '#9ca3af' }
            },
            title: {
                display: false,
            }
        },
    };

    return <Doughnut data={chartData} options={options} />;
};

export default SeverityChart;
