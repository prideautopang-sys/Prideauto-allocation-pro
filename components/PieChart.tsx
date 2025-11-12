import React, { useEffect, useRef } from 'react';

// Chart.js is loaded from CDN, so we can use it globally.
declare var Chart: any;

interface PieChartProps {
    chartData: {
        labels: string[];
        datasets: {
            label: string;
            data: number[];
            backgroundColor?: string[];
            borderColor?: string[];
            borderWidth?: number;
        }[];
    };
}

const PieChart: React.FC<PieChartProps> = ({ chartData }) => {
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
                const textColor = isDarkMode ? 'rgb(209, 213, 219)' : 'rgb(107, 114, 128)';
                
                chartInstanceRef.current = new Chart(ctx, {
                    type: 'pie',
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
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context: any) {
                                        let label = context.label || '';
                                        if (label) {
                                            label += ': ';
                                        }
                                        if (context.parsed !== null) {
                                            label += `${context.raw} units`;
                                        }
                                        return label;
                                    }
                                }
                            }
                        },
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

export default PieChart;
