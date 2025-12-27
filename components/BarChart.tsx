
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
                
                const datalabelsPlugin = {
                    id: 'customDatalabels',
                    afterDatasetsDraw(chart: any) {
                        const { ctx } = chart;
                        const meta = chart.getDatasetMeta(0);

                        ctx.save();
                        ctx.font = '600 11px sans-serif';
                        
                        meta.data.forEach((element: any, index: number) => {
                            const dataValue = chart.data.datasets[0].data[index];
                            if (dataValue === 0) return;

                            const text = String(dataValue);
                            const textMetrics = ctx.measureText(text);
                            const textWidth = textMetrics.width;
                            
                            const barWidth = element.width;
                            const padding = 6;
                            
                            // If the label fits inside the bar, draw it inside
                            if (barWidth > textWidth + padding * 2) {
                                ctx.textAlign = 'right';
                                ctx.textBaseline = 'middle';
                                ctx.fillStyle = '#fff'; // White text for good contrast on a solid bar
                                ctx.fillText(text, element.x - padding, element.y);
                            } else {
                                // Otherwise, draw it outside the bar
                                ctx.textAlign = 'left';
                                ctx.textBaseline = 'middle';
                                ctx.fillStyle = textColor; // Use the standard axis text color
                                ctx.fillText(text, element.x + padding, element.y);
                            }
                        });

                        ctx.restore();
                    }
                };
                
                chartInstanceRef.current = new Chart(ctx, {
                    type: 'bar',
                    data: chartData,
                    plugins: [datalabelsPlugin], // Add custom plugin here
                    options: {
                        indexAxis: 'y',
                        responsive: true,
                        maintainAspectRatio: false,
                        layout: {
                            padding: {
                                left: 10,
                                right: 20
                            }
                        },
                        elements: {
                            bar: {
                                borderRadius: 4, // Rounded corners for bars
                            }
                        },
                        plugins: {
                            legend: {
                                display: false,
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
                                    autoSkip: false, // Ensure all labels are shown
                                    font: {
                                        size: 11 // Slightly smaller font to fit long names
                                    }
                                },
                                grid: {
                                    display: false,
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
