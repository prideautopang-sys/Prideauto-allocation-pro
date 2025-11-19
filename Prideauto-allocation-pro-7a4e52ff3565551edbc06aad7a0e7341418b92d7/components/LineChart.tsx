import React, { useEffect, useRef } from 'react';

// Chart.js is loaded from CDN, so we can use it globally.
// We declare it to satisfy TypeScript.
declare var Chart: any;

interface LineChartProps {
    chartData: {
        labels: string[];
        datasets: {
            label: string;
            data: number[];
            borderColor: string;
            backgroundColor: string;
            tension: number;
        }[];
    };
}

const LineChart: React.FC<LineChartProps> = ({ chartData }) => {
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
                    type: 'line',
                    data: chartData,
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'top' as const,
                                labels: {
                                    color: textColor,
                                }
                            },
                            title: {
                                display: false,
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    precision: 0, // Ensure y-axis has only whole numbers
                                    color: textColor,
                                },
                                grid: {
                                    color: gridColor,
                                }
                            },
                            x: {
                                ticks: {
                                    color: textColor,
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

export default LineChart;