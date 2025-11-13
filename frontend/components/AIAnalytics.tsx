'use client';

import { Card, List, Tag, Button, Spin, Alert } from 'antd';
import { RobotOutlined, RiseOutlined, WarningOutlined, BulbOutlined } from '@ant-design/icons';
import { AIAnalysis } from '@/lib/api';

interface AIAnalyticsProps {
  data?: AIAnalysis;
  loading?: boolean;
  onAnalyze: () => void;
}

export default function AIAnalytics({ data, loading, onAnalyze }: AIAnalyticsProps) {
  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <RobotOutlined style={{ fontSize: 20 }} />
          <span>AI Analytics</span>
        </div>
      }
      extra={
        <Button type="primary" onClick={onAnalyze} loading={loading}>
          Analyze Now
        </Button>
      }
    >
      {loading && !data ? (
        <div className="text-center py-8">
          <Spin size="large" />
          <p className="mt-4 text-gray-500">Analyzing data...</p>
        </div>
      ) : data ? (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <BulbOutlined style={{ fontSize: 18 }} />
              Key Insights
            </h3>
            <List
              dataSource={data.insights}
              renderItem={(item) => (
                <List.Item>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-500">•</span>
                    <span>{item}</span>
                  </div>
                </List.Item>
              )}
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <RiseOutlined style={{ fontSize: 18 }} />
              Trends
            </h3>
            <p className="text-gray-700">{data.trends}</p>
          </div>

          {data.anomalies && data.anomalies.length > 0 && (
            <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <WarningOutlined style={{ fontSize: 18, color: '#fa8c16' }} />
              Anomalies Detected
            </h3>
              <List
                dataSource={data.anomalies}
                renderItem={(item) => (
                  <List.Item>
                    <Alert
                      message={item}
                      type="warning"
                      showIcon
                      className="w-full"
                    />
                  </List.Item>
                )}
              />
            </div>
          )}

          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <BulbOutlined style={{ fontSize: 18 }} />
              Recommendations
            </h3>
            <List
              dataSource={data.recommendations}
              renderItem={(item) => (
                <List.Item>
                  <Tag color="green" className="text-sm py-1 px-2">
                    {item}
                  </Tag>
                </List.Item>
              )}
            />
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p>Click "Analyze Now" to get AI-powered insights</p>
        </div>
      )}
    </Card>
  );
}

