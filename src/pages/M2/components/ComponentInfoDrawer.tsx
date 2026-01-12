import { Drawer, Descriptions, Tag, Empty } from 'antd';
import type { ElectricalComponent } from '../types';

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

function ComponentInfoDrawer({ open, component, onClose }: ComponentInfoDrawerProps) {
  return (
    <Drawer
      title={component?.name || '元件信息'}
      placement="right"
      width={400}
      open={open}
      onClose={onClose}
    >
      {component ? (
        <Descriptions column={1} bordered size="middle">
          <Descriptions.Item label="元件编号">
            <Tag color="blue">{component.id}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="额定电压">
            <Tag color={voltageColors[component.voltage] || 'default'}>
              {component.voltage}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="功能描述">
            {component.function}
          </Descriptions.Item>
          <Descriptions.Item label="安全风险">
            <Tag color="warning" style={{ whiteSpace: 'normal' }}>
              {component.risk}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="位置坐标">
            X: {component.position.x}, Y: {component.position.y}, Z: {component.position.z}
          </Descriptions.Item>
          <Descriptions.Item label="几何类型">
            {component.geometry.type}
          </Descriptions.Item>
        </Descriptions>
      ) : (
        <Empty description="未选择元件" />
      )}
    </Drawer>
  );
}

export default ComponentInfoDrawer;
