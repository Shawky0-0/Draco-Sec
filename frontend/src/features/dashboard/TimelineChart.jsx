
import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const TimelineChart = ({ data }) => {
    if (!data || data.length === 0) return null;

    // data is array of { time: '2023-10-27 10:00:00', count: 5 }
    const chartData = {
        labels: data.map(d => {
            const date = new Date(d.time);
            return `${date.getHours()}:00`;
        }),
        datasets: [
            {
                label: 'Alerts',
                data: data.map(d => d.count),
                backgroundColor: 'rgba(16, 185, 129, 0.6)', // Emerald
                borderColor: 'rgba(16, 185, 129, 1)',
                borderWidth: 1,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            title: {
                display: false,
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)',
                },
                ticks: { color: '#9ca3af' }
            },
            x: {
                grid: {
                    display: false
                },
                ticks: { color: '#9ca3af' }
            }
        },
    };

    return <Bar data={chartData} options={options} />;
};

export default TimelineChart;
