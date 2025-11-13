'use client';

import { useState } from 'react';
import { Card, Select, Button, Space } from 'antd';
import { Line } from '@ant-design/charts';
import { DownloadOutlined } from '@ant-design/icons';
import { TimeSeriesData } from '@/lib/api';

interface ChartsProps {
  data: TimeSeriesData;
}

/**
 * Enhanced Charts component with interactive features
 * Includes zoom, pan, tooltips, and export functionality
 */
export default function Charts({ data }: ChartsProps) {
  const [selectedHours, setSelectedHours] = useState<number>(24);

  // Filter data based on selected hours
  const filterDataByHours = <T extends { timestamp: string }>(points: T[], hours: number): T[] => {
    if (hours >= 24) return points;
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return points.filter(p => new Date(p.timestamp) >= cutoff);
  };

  const filteredData = {
    building: {
      temperature: filterDataByHours(data.building.temperature, selectedHours),
      occupancy: filterDataByHours(data.building.occupancy, selectedHours),
      airQuality: filterDataByHours(data.building.airQuality, selectedHours),
      humidity: filterDataByHours(data.building.humidity, selectedHours),
    },
    energy: {
      powerConsumption: filterDataByHours(data.energy.powerConsumption, selectedHours),
      efficiency: filterDataByHours(data.energy.efficiency, selectedHours),
      cost: filterDataByHours(data.energy.cost, selectedHours),
      peakUsage: filterDataByHours(data.energy.peakUsage, selectedHours),
      renewablePercentage: filterDataByHours(data.energy.renewablePercentage, selectedHours),
    },
  };

  // Common chart configuration with interactivity
  const baseConfig = {
    smooth: true,
    animation: {
      appear: {
        animation: 'wave-in',
        duration: 1000,
      },
    },
    tooltip: {
      showCrosshairs: true,
      shared: true,
      customContent: (title: string, items: any[]) => {
        if (!items || items.length === 0) return '';
        const item = items[0];
        const date = new Date(title).toLocaleString();
        return `
          <div style="padding: 8px;">
            <div style="font-weight: bold; margin-bottom: 4px;">${date}</div>
            <div style="color: ${item.color}">
              ${item.name || 'Value'}: <strong>${item.value}</strong>
            </div>
          </div>
        `;
      },
    },
    slider: {
      start: 0,
      end: 1,
    },
    brush: {
      enabled: true,
      type: 'x-rect',
    },
  };

  const temperatureConfig = {
    ...baseConfig,
    data: filteredData.building.temperature,
    xField: 'timestamp',
    yField: 'value',
    point: {
      size: 4,
      shape: 'circle',
      style: {
        fill: '#1890ff',
        stroke: '#fff',
        lineWidth: 2,
      },
    },
    color: '#1890ff',
    xAxis: {
      type: 'time',
      label: {
        formatter: (text: string) => {
          const date = new Date(text);
          return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        },
      },
    },
    yAxis: {
      label: {
        formatter: (text: string) => `${text}°C`,
      },
    },
  };

  const occupancyConfig = {
    ...baseConfig,
    data: filteredData.building.occupancy,
    xField: 'timestamp',
    yField: 'value',
    point: {
      size: 4,
      shape: 'circle',
      style: {
        fill: '#52c41a',
        stroke: '#fff',
        lineWidth: 2,
      },
    },
    color: '#52c41a',
    xAxis: {
      type: 'time',
      label: {
        formatter: (text: string) => {
          const date = new Date(text);
          return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        },
      },
    },
    yAxis: {
      label: {
        formatter: (text: string) => `${text} people`,
      },
    },
  };

  const powerConfig = {
    ...baseConfig,
    data: filteredData.energy.powerConsumption,
    xField: 'timestamp',
    yField: 'value',
    point: {
      size: 4,
      shape: 'circle',
      style: {
        fill: '#faad14',
        stroke: '#fff',
        lineWidth: 2,
      },
    },
    color: '#faad14',
    xAxis: {
      type: 'time',
      label: {
        formatter: (text: string) => {
          const date = new Date(text);
          return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        },
      },
    },
    yAxis: {
      label: {
        formatter: (text: string) => `${text} kW`,
      },
    },
  };

  const efficiencyConfig = {
    ...baseConfig,
    data: filteredData.energy.efficiency,
    xField: 'timestamp',
    yField: 'value',
    point: {
      size: 4,
      shape: 'circle',
      style: {
        fill: '#722ed1',
        stroke: '#fff',
        lineWidth: 2,
      },
    },
    color: '#722ed1',
    xAxis: {
      type: 'time',
      label: {
        formatter: (text: string) => {
          const date = new Date(text);
          return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        },
      },
    },
    yAxis: {
      label: {
        formatter: (text: string) => `${text}%`,
      },
    },
  };

  const handleExport = () => {
    const csv = [
      ['Timestamp', 'Temperature', 'Occupancy', 'Power Consumption', 'Efficiency'].join(','),
      ...filteredData.building.temperature.map((t, i) => {
        const occ = filteredData.building.occupancy[i]?.value || '';
        const power = filteredData.energy.powerConsumption[i]?.value || '';
        const eff = filteredData.energy.efficiency[i]?.value || '';
        return [t.timestamp, t.value, occ, power, eff].join(',');
      }),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `iot-data-${selectedHours}h-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Historical Trends</h2>
        <Space>
          <Select
            value={selectedHours}
            onChange={setSelectedHours}
            style={{ width: 150 }}
            options={[
              { label: 'Last 6 hours', value: 6 },
              { label: 'Last 12 hours', value: 12 },
              { label: 'Last 24 hours', value: 24 },
              { label: 'Last 48 hours', value: 48 },
              { label: 'Last 7 days', value: 168 },
            ]}
          />
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            Export CSV
          </Button>
        </Space>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Temperature Trend">
          <Line {...temperatureConfig} height={300} />
        </Card>
        <Card title="Occupancy Trend">
          <Line {...occupancyConfig} height={300} />
        </Card>
        <Card title="Power Consumption Trend">
          <Line {...powerConfig} height={300} />
        </Card>
        <Card title="Energy Efficiency Trend">
          <Line {...efficiencyConfig} height={300} />
        </Card>
      </div>
      <div className="text-sm text-gray-500 mt-4">
        <p>💡 Tip: Use the slider and brush tools to zoom and pan through the data. Hover over data points for detailed information.</p>
      </div>
    </div>
  );
}

