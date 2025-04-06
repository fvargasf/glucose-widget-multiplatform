'use client';

import { useState, useEffect, useRef } from 'react';
import { Chart, ScatterController, LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Filler } from 'chart.js';
import axios from 'axios';

// Registrar los componentes necesarios de Chart.js
Chart.register(
  ScatterController,
  LineController, 
  LineElement, 
  PointElement, 
  LinearScale, 
  CategoryScale, 
  Tooltip, 
  Filler
);

// Cargar el plugin de zoom solo en el cliente
if (typeof window !== 'undefined') {
  import('chartjs-plugin-zoom').then((ZoomPlugin) => {
    Chart.register(ZoomPlugin.default);
  });
}

interface GlucoseData {
  Timestamp: string;
  Value: number;
  isHigh: boolean;
  isLow: boolean;
  MeasurementColor: number;
}

interface TargetRange {
  targetLow: number;
  targetHigh: number;
}

interface AuthData {
  token: string;
  userId: string;
  accountId: string;
  duration: number;
}

export default function GlucoseGraph() {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [targetRange, setTargetRange] = useState<TargetRange | null>(null);
  const [graphData, setGraphData] = useState<GlucoseData[]>([]);
  const chartInstance = useRef<Chart | null>(null);

  const fetchData = async () => {
    try {
      const storedAuthData = localStorage.getItem('authData');

      if (!storedAuthData) {
        setError('No authentication data found');
        setLoading(false);
        return;
      }

      const authData: AuthData = JSON.parse(storedAuthData);

      const response = await axios.get('/api/glucose', {
        headers: {
          'Authorization': `Bearer ${authData.token}`
        },
        params: {
          userId: authData.userId,
          accountId: authData.accountId
        }
      });

      if (response.data && response.data.data) {
        const data = response.data.data;
        if (data.connection && data.graphData) {
          setTargetRange({
            targetLow: data.connection.targetLow,
            targetHigh: data.connection.targetHigh
          });
          setGraphData(data.graphData);
          setError(null);
        } else {
          throw new Error('Invalid data format');
        }
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      setError('Error fetching glucose data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    const interval = setInterval(() => {
      fetchData();
    }, 60000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!chartRef.current || !graphData.length || !targetRange) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    chartInstance.current = new Chart(ctx, {
      type: 'scatter',
      data: {
        datasets: [
          {
            label: 'Target Range',
            data: graphData.map((_, i) => ({
              x: i,
              y: targetRange.targetHigh
            })),
            backgroundColor: 'rgba(143, 188, 143, 0.3)',
            borderWidth: 0,
            fill: {
              target: {
                value: targetRange.targetLow
              }
            },
            pointRadius: 0,
            showLine: true,
            borderColor: 'rgba(0,0,0,0)'
          },
          {
            label: 'Glucose',
            data: graphData.map((item, index) => ({
              x: index,
              y: item.Value
            })),
            pointBackgroundColor: graphData.map(item => {
              if (item.Value < targetRange.targetLow) return '#ff0000';
              if (item.Value > targetRange.targetHigh) return '#0000ff';
              return '#ffffff';
            }),
            pointBorderColor: graphData.map(item => {
              if (item.Value < targetRange.targetLow) return '#ff0000';
              if (item.Value > targetRange.targetHigh) return '#0000ff';
              return '#ffffff';
            }),
            pointRadius: 4,
            pointHoverRadius: 6,
            showLine: true,
            borderColor: 'rgba(255, 255, 255, 0.5)',
            borderWidth: 1,
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: {
            top: 20
          }
        },
        scales: {
          x: {
            type: 'linear',
            grid: {
              display: false
            },
            ticks: {
              display: false
            }
          },
          y: {
            grid: {
              color: 'rgba(255, 255, 255, 0.1)',
              drawTicks: false
            },
            border: {
              display: false
            },
            ticks: {
              color: '#ffffff',
              font: {
                size: 10
              },
              padding: 10,
              stepSize: 50
            },
            min: Math.floor((Math.max(0, Math.min(...graphData.map(d => d.Value)) - 40) / 10)) * 10,
            max: Math.ceil((Math.max(...graphData.map(d => d.Value)) + 40) / 10) * 10
          }
        },
        plugins: {
          tooltip: {
            mode: 'nearest',
            intersect: true,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: 'rgba(255, 255, 255, 0.2)',
            borderWidth: 1,
            padding: 10,
            displayColors: false,
            callbacks: {
              title: function(tooltipItems) {
                const index = Math.round(tooltipItems[0].parsed.x);
                if (index >= 0 && index < graphData.length) {
                  const date = new Date(graphData[index].Timestamp);
                  return 'Time: ' + date.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  });
                }
                return '';
              },
              label: function(context) {
                if (context.datasetIndex === 1) {
                  return 'Glucose: ' + context.parsed.y;
                }
                return '';
              }
            }
          },
          legend: {
            display: false
          }
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [graphData, targetRange]);

  if (loading) return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100%',
      color: '#ffffff'
    }}>
      Loading...
    </div>
  );

  if (error) return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100%',
      color: '#ff4444'
    }}>
      Error: {error}
    </div>
  );

  return <canvas ref={chartRef} />;
} 