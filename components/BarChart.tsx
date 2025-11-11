import React, { useEffect, useRef } from 'react';

// Chart.js is loaded from CDN, so we can use it globally.
declare var Chart: any;

interface BarChartProps {
    chartData: {
        labels: string[];
        datasets: {
            label: string;
            data: number[];
            backgroundColor: string;
        }[];
    };
}

const BarChart: React.FC<BarChartProps> = ({ chartData }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const chartInstanceRef = useRef<any>(null);

    useEffect(() => {
        if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
        }

        if (canvasRef.current && typeof Chart !== 'undefined') {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
                const isDarkMode = document.documentElement.classList.contains('dark');
                const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
                const textColor = isDarkMode ? 'rgb(209, 213, 219)' : 'rgb(107, 114, 128)';
                
                chartInstanceRef.current = new Chart(ctx, {
                    type: 'bar',
                    data: chartData,
                    options: {
                        indexAxis: 'y', // Makes the bar chart horizontal
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false, // Hide legend for cleaner look
                            },
                            title: {
                                display: false,
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context: any) {
                                        return `${context.dataset.label}: ${context.raw}`;
                                    }
                                }
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    color: textColor,
                                },
                                grid: {
                                    display: false, // Hide y-axis grid lines
                                }
                            },
                            x: {
                                ticks: {
                                    color: textColor,
                                    precision: 0,
                                },
                                grid: {
                                    color: gridColor,
                                }
                            }
                        }
                    },
                });
            }
        }

        return () => {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
                chartInstanceRef.current = null;
            }
        };
    }, [chartData]);

    return <canvas ref={canvasRef}></canvas>;
};

export default BarChart;