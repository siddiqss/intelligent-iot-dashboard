'use client';

import { Card, Statistic, Tag, Row, Col } from 'antd';
import { FireOutlined, UserOutlined, ThunderboltOutlined, CloudOutlined, DropboxOutlined } from '@ant-design/icons';

interface BuildingKPIsProps {
  data: {
    temperature: number;
    occupancy: number;
    hvacStatus: 'active' | 'idle' | 'maintenance';
    airQuality: number;
    humidity: number;
    timestamp: string;
  };
}

const getHVACColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'blue';
    case 'idle':
      return 'green';
    case 'maintenance':
      return 'orange';
    default:
      return 'default';
  }
};

const getAQIColor = (aqi: number) => {
  if (aqi <= 50) return 'green';
  if (aqi <= 100) return 'yellow';
  if (aqi <= 150) return 'orange';
  return 'red';
};

const getAQILabel = (aqi: number) => {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive';
  return 'Unhealthy';
};

export default function BuildingKPIs({ data }: BuildingKPIsProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Building KPIs</h2>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Temperature"
              value={data.temperature}
              suffix="°C"
              prefix={<FireOutlined />}
              valueStyle={{ color: data.temperature > 25 ? '#cf1322' : '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Occupancy"
              value={data.occupancy}
              suffix="people"
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500 mb-1">HVAC Status</div>
                <Tag color={getHVACColor(data.hvacStatus)} className="text-base">
                  {data.hvacStatus.toUpperCase()}
                </Tag>
              </div>
              <ThunderboltOutlined style={{ fontSize: 24, color: '#8c8c8c' }} />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Air Quality"
              value={data.airQuality}
              suffix={
                <Tag color={getAQIColor(data.airQuality)}>
                  {getAQILabel(data.airQuality)}
                </Tag>
              }
              prefix={<CloudOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Humidity"
              value={data.humidity}
              suffix="%"
              prefix={<DropboxOutlined />}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

