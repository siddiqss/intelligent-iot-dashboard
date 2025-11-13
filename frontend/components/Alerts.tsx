'use client';

import { Card, List, Alert, Spin, Badge, Empty } from 'antd';
import { BellOutlined, WarningOutlined, CloseCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { AlertsResponse } from '@/lib/api';

interface AlertsProps {
  data?: AlertsResponse;
  loading?: boolean;
}

/**
 * Alerts component displaying system alerts and anomalies
 * Shows warnings, critical alerts, and informational messages
 */
export default function Alerts({ data, loading }: AlertsProps) {
  if (loading && !data) {
    return (
      <Card title="Alerts" className="h-full">
        <div className="text-center py-8">
          <Spin size="large" />
          <p className="mt-4 text-gray-500">Loading alerts...</p>
        </div>
      </Card>
    );
  }

  if (!data || data.alerts.length === 0) {
    return (
      <Card
        title={
          <div className="flex items-center gap-2">
            <BellOutlined style={{ fontSize: 20 }} />
            <span>Alerts</span>
          </div>
        }
        className="h-full"
      >
        <Empty
          description="No alerts at this time"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    );
  }

  const criticalAlerts = data.alerts.filter(a => a.type === 'critical');
  const warnings = data.alerts.filter(a => a.type === 'warning');
  const info = data.alerts.filter(a => a.type === 'info');

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'warning':
        return <WarningOutlined style={{ color: '#faad14' }} />;
      case 'info':
        return <InfoCircleOutlined style={{ color: '#1890ff' }} />;
      default:
        return <BellOutlined />;
    }
  };

  const getAlertType = (type: string): 'error' | 'warning' | 'info' => {
    switch (type) {
      case 'critical':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'info';
    }
  };

  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <BellOutlined style={{ fontSize: 20 }} />
          <span>Alerts</span>
          <Badge count={data.count} showZero style={{ backgroundColor: '#ff4d4f' }} />
        </div>
      }
      className="h-full"
    >
      <div className="space-y-4">
        {criticalAlerts.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-2 text-red-600">
              Critical ({criticalAlerts.length})
            </h3>
            <List
              dataSource={criticalAlerts}
              renderItem={(alert) => (
                <List.Item>
                  <Alert
                    message={alert.message}
                    type="error"
                    icon={getAlertIcon(alert.type)}
                    showIcon
                    className="w-full"
                    description={`Detected: ${new Date(alert.timestamp).toLocaleString()}`}
                  />
                </List.Item>
              )}
            />
          </div>
        )}

        {warnings.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-2 text-orange-600">
              Warnings ({warnings.length})
            </h3>
            <List
              dataSource={warnings}
              renderItem={(alert) => (
                <List.Item>
                  <Alert
                    message={alert.message}
                    type="warning"
                    icon={getAlertIcon(alert.type)}
                    showIcon
                    className="w-full"
                    description={`Detected: ${new Date(alert.timestamp).toLocaleString()}`}
                  />
                </List.Item>
              )}
            />
          </div>
        )}

        {info.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-2 text-blue-600">
              Information ({info.length})
            </h3>
            <List
              dataSource={info}
              renderItem={(alert) => (
                <List.Item>
                  <Alert
                    message={alert.message}
                    type="info"
                    icon={getAlertIcon(alert.type)}
                    showIcon
                    className="w-full"
                    description={`Generated: ${new Date(alert.timestamp).toLocaleString()}`}
                  />
                </List.Item>
              )}
            />
          </div>
        )}

        <div className="text-xs text-gray-500 mt-4">
          Last updated: {new Date(data.generatedAt).toLocaleString()}
        </div>
      </div>
    </Card>
  );
}

