import { Drawer, Descriptions, Tag, Tabs, Steps, Collapse, Typography } from 'antd';
import type { ElectricalComponent } from '../types';

const { Text, Paragraph } = Typography;

interface ComponentInfoDrawerProps {
  open: boolean;
  component: ElectricalComponent | null;
  onClose: () => void;
}

// 电压等级颜色映射
const voltageColors: Record<string, string> = {
  '380V': 'red',
  '220V': 'orange',
  '24V': 'green',
  '12V': 'blue'
};

// 元件分类标签映射
const categoryLabels: Record<string, { text: string; color: string }> = {
  'power': { text: '主回路元件', color: '#e74c3c' },
  'control': { text: '控制回路元件', color: '#3498db' },
  'sensor': { text: '传感器与指示', color: '#2ecc71' }
};

function ComponentInfoDrawer({ open, component, onClose }: ComponentInfoDrawerProps) {
  if (!component) return null;

  const categoryInfo = categoryLabels[component.category] || { text: '其他', color: '#999' };

  return (
    <Drawer
      title={component.name}
      placement="right"
      width={500}
      open={open}
      onClose={onClose}
    >
      <Tabs
        defaultActiveKey="basic"
        items={[
          {
            key: 'basic',
            label: '基本信息',
            children: (
              <Descriptions column={1} bordered size="middle">
                <Descriptions.Item label="元件编号">
                  <Tag color="blue">{component.id}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="元件分类">
                  <Tag color={categoryInfo.color}>{categoryInfo.text}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="额定电压">
                  <Tag color={voltageColors[component.voltage] || 'default'}>
                    {component.voltage}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="额定电流">
                  {component.ratedCurrent}
                </Descriptions.Item>
                <Descriptions.Item label="型号规格">
                  {component.model}
                </Descriptions.Item>
                <Descriptions.Item label="功能描述">
                  {component.function}
                </Descriptions.Item>
                <Descriptions.Item label="安全风险">
                  <Tag color="warning" style={{ whiteSpace: 'normal' }}>
                    {component.risk}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="安装位置">
                  {component.installationPosition}
                </Descriptions.Item>
                <Descriptions.Item label="维护周期">
                  {component.maintenancePeriod}
                </Descriptions.Item>
              </Descriptions>
            )
          },
          {
            key: 'principle',
            label: '工作原理',
            children: (
              <div style={{ padding: '16px 0' }}>
                <Paragraph style={{ fontSize: '14px', lineHeight: '1.8' }}>
                  {component.workingPrinciple}
                </Paragraph>
                <Descriptions column={1} size="small" style={{ marginTop: 16 }}>
                  <Descriptions.Item label="几何类型">
                    <Tag>{component.geometry.type}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="位置坐标">
                    <Text code>
                      X: {component.position.x}, Y: {component.position.y}, Z: {component.position.z}
                    </Text>
                  </Descriptions.Item>
                </Descriptions>
              </div>
            )
          },
          {
            key: 'safety',
            label: '安全操作',
            children: (
              <div style={{ padding: '16px 0' }}>
                <Steps
                  direction="vertical"
                  current={-1}
                  items={component.safetySteps.map((step) => ({
                    title: (
                      <Text strong>
                        {step}
                      </Text>
                    ),
                    status: 'finish'
                  }))}
                />
              </div>
            )
          },
          {
            key: 'faults',
            label: '常见故障',
            children: (
              <Collapse
                ghost
                items={component.commonFaults.map((fault, index) => ({
                  key: index,
                  label: (
                    <Text strong style={{ color: '#ff4d4f' }}>
                      {fault.name}
                    </Text>
                  ),
                  children: (
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label="可能原因">
                        <Text type="secondary">{fault.cause}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="处理方法">
                        <Text type="success">{fault.solution}</Text>
                      </Descriptions.Item>
                    </Descriptions>
                  )
                }))}
              />
            )
          }
        ]}
      />
    </Drawer>
  );
}

export default ComponentInfoDrawer;
