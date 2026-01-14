import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Layout, Typography, Space, message } from 'antd';
import { ArrowLeftOutlined, BookOutlined } from '@ant-design/icons';
import WiringCanvas from './components/WiringCanvas';
import ConnectionValidator from './components/ConnectionValidator';
import componentData from './data/wiring-components.json';
import rulesData from './data/wiring-rules.json';
import type { WireConnection, WiringComponent, WiringRule } from './types';

const { Header, Content, Sider } = Layout;
const { Title, Paragraph } = Typography;

function M3Page() {
  const navigate = useNavigate();
  const [connections, setConnections] = useState<WireConnection[]>([]);

  const components = componentData.components as WiringComponent[];
  const rules = rulesData.rules as WiringRule[];

  const handleConnectionChange = (newConnections: WireConnection[]) => {
    setConnections(newConnections);
  };

  const handleReset = () => {
    setConnections([]);
    message.info('接线已重置');
  };

  const handleComplete = () => {
    message.success('接线完成！');
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Header style={{ background: '#001529', padding: '0 24px', display: 'flex', alignItems: 'center' }}>
        <Space direction="vertical" size={0}>
          <Title level={4} style={{ color: '#fff', margin: 0 }}>
            M3: 电路安装与检测实训
          </Title>
          <Paragraph style={{ color: '#fff', margin: 0, fontSize: 12, opacity: 0.8 }}>
            虚拟接线 · 安全规范 · 错误演示
          </Paragraph>
        </Space>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/')}
          style={{ marginLeft: 'auto', color: '#fff' }}
        >
          返回首页
        </Button>
      </Header>

      <Content style={{ padding: '24px' }}>
        <div style={{ marginBottom: 16 }}>
          <Button
            type="text"
            icon={<BookOutlined />}
            onClick={() => {
              message.info('接线规则：L1 → QF1 → KM1 → M1');
            }}
          >
            查看接线规则
          </Button>
        </div>

        <Layout style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
          <Content style={{ padding: '16px', height: 'calc(100vh - 200px)' }}>
            <WiringCanvas
              components={components}
              onConnectionChange={handleConnectionChange}
              onComplete={handleComplete}
              hitTestConfig={{
                clickThreshold: 25,
                hoverThreshold: 25,
                cellSize: 50
              }}
              wireStyle={{
                thickness: 3,
                showDeleteButton: true
              }}
            />
          </Content>

          <Sider width={350} style={{ background: '#fafafa', borderLeft: '1px solid #f0f0f0' }}>
            <div style={{ padding: '16px', height: '100%' }}>
              <ConnectionValidator
                connections={connections}
                rules={rules}
                onReset={handleReset}
                onSubmit={handleComplete}
              />
            </div>
          </Sider>
        </Layout>

        <Card style={{ marginTop: 16 }}>
          <Title level={5}>模块说明</Title>
          <Paragraph>
            本模块模拟直接控制电路的接线过程。请按照 L1 → QF1 → KM1 → M1 的顺序完成接线。
          </Paragraph>
          <Paragraph>
            <ul>
              <li>点击第一个端子开始接线，再点击目标端子完成连线</li>
              <li>悬停在连接线上可显示删除按钮（红色×），点击即可删除</li>
              <li>不同颜色的端子代表不同类型：红色=电源、蓝色=输入、绿色=输出</li>
              <li>完成所有连接后，右侧面板会显示验证结果</li>
            </ul>
          </Paragraph>
        </Card>
      </Content>
    </Layout>
  );
}

export default M3Page;
