'use client';

import { Card, Statistic, Progress, Row, Col } from 'antd';
import { ThunderboltOutlined, RiseOutlined, DollarOutlined, LineChartOutlined, EnvironmentOutlined } from '@ant-design/icons';

interface EnergyKPIsProps {
  data: {
    powerConsumption: number;
    efficiency: number;
    cost: number;
    peakUsage: number;
    renewablePercentage: number;
    carbonFootprint: number;
    timestamp: string;
  };
}

export default function EnergyKPIs({ data }: EnergyKPIsProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Energy KPIs</h2>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Power Consumption"
              value={data.powerConsumption}
              suffix="kW"
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Efficiency</span>
                <RiseOutlined style={{ fontSize: 20, color: '#8c8c8c' }} />
              </div>
              <Progress
                percent={data.efficiency}
                status={data.efficiency >= 90 ? 'success' : data.efficiency >= 80 ? 'normal' : 'exception'}
                strokeColor={data.efficiency >= 90 ? '#52c41a' : data.efficiency >= 80 ? '#1890ff' : '#ff4d4f'}
              />
              <div className="text-2xl font-semibold mt-2">{data.efficiency}%</div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Cost"
              value={data.cost}
              prefix={<DollarOutlined />}
              suffix="/hr"
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Peak Usage"
              value={data.peakUsage}
              suffix="kW"
              prefix={<LineChartOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Renewable Energy</span>
                <EnvironmentOutlined style={{ fontSize: 20, color: '#52c41a' }} />
              </div>
              <Progress
                percent={data.renewablePercentage}
                strokeColor="#52c41a"
              />
              <div className="text-2xl font-semibold mt-2">{data.renewablePercentage}%</div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Carbon Footprint"
              value={data.carbonFootprint}
              suffix="kg CO₂"
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

