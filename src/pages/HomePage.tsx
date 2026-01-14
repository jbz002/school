import { useNavigate } from 'react-router-dom';
import { Card, Button, Typography } from 'antd';

const { Title, Paragraph } = Typography;

function HomePage() {
  const navigate = useNavigate();

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <Card style={{ maxWidth: 800, textAlign: 'center', borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <Title level={1}>新能源汽车电池包装配工段</Title>
        <Title level={2} type="secondary">电工技能实战教学系统</Title>
        <Paragraph style={{ fontSize: '16px', color: '#666', marginBottom: '30px' }}>
          BYD 联合标准版 · Demo 演示系统
        </Paragraph>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '20px' }}>
          <Card
            hoverable
            style={{ borderColor: '#1890ff' }}
            onClick={() => navigate('/m2')}
          >
            <Title level={4}>M2: 产线电气结构与识图</Title>
            <Paragraph type="secondary">
              3D 产线展示 · 元件认知 · 电气识图
            </Paragraph>
            <Button type="primary" block>进入模块</Button>
          </Card>

          <Card
            hoverable
            style={{ borderColor: '#52c41a' }}
            onClick={() => navigate('/m3')}
          >
            <Title level={4}>M3: 电路安装与检测实训</Title>
            <Paragraph type="secondary">虚拟接线 · 安全规范 · 错误演示</Paragraph>
            <Button type="primary" block>进入模块</Button>
          </Card>

          <Card hoverable style={{ opacity: 0.6, cursor: 'not-allowed' }}>
            <Title level={4}>M4: PLC 控制基础</Title>
            <Paragraph type="secondary">I/O 点位 · 启停控制 · 状态反馈</Paragraph>
            <Button block disabled>即将推出</Button>
          </Card>

          <Card hoverable style={{ opacity: 0.6, cursor: 'not-allowed' }}>
            <Title level={4}>M5: 故障模拟与排查</Title>
            <Paragraph type="secondary">故障生成 · 引导排查 · 评分反馈</Paragraph>
            <Button block disabled>即将推出</Button>
          </Card>
        </div>
      </Card>
    </div>
  );
}

export default HomePage;
