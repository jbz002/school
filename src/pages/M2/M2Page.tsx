import { useState, useRef, useEffect } from 'react';
import { Button, Drawer, Radio, Space, Typography, message } from 'antd';
import { ArrowLeftOutlined, EyeOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import componentData from './data/electrical-components.json';
import type { ElectricalComponent, PageMode, QuizState, QuizAttempt } from './types';
import ProductionLine3D from './components/ProductionLine3D';
import ElectricalSchematic from './components/ElectricalSchematic';
import ComponentInfoDrawer from './components/ComponentInfoDrawer';
import QuizMode from './components/QuizMode';

const { Title } = Typography;

function M2Page() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<PageMode>('explore');
  const [selectedComponent, setSelectedComponent] = useState<ElectricalComponent | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [quizState, setQuizState] = useState<QuizState>({
    current: 0,
    score: 0,
    attempts: [],
    isFinished: false,
    timeRemaining: 300
  });
  const [infoDrawerOpen, setInfoDrawerOpen] = useState(false);

  const components = componentData.components as ElectricalComponent[];
  const quiz = componentData.quiz;

  // 处理 3D 场景中元件点击
  const handleComponentClick = (component: ElectricalComponent) => {
    setSelectedComponent(component);
    setInfoDrawerOpen(true);
    setHighlightedId(component.id);
  };

  // 处理电气图中元件点击
  const handleSchematicClick = (componentId: string) => {
    const component = components.find(c => c.id === componentId);
    if (component) {
      setSelectedComponent(component);
      setInfoDrawerOpen(true);
      setHighlightedId(componentId);
    }
  };

  // 处理模式切换
  const handleModeChange = (newMode: PageMode) => {
    if (newMode === 'quiz' && mode !== 'quiz') {
      // 开始练习模式，重置状态
      setQuizState({
        current: 0,
        score: 0,
        attempts: [],
        isFinished: false,
        timeRemaining: 300
      });
      setSelectedComponent(null);
      setHighlightedId(null);
      setInfoDrawerOpen(false);
      message.info('进入练习模式');
    }
    setMode(newMode);
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#f0f2f5'
    }}>
      {/* 顶部导航栏 */}
      <div style={{
        background: '#fff',
        padding: '12px 24px',
        borderBottom: '1px solid #e8e8e8',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/')}
          >
            返回首页
          </Button>
          <Title level={3} style={{ margin: 0 }}>
            M2: 产线电气结构与识图
          </Title>
        </Space>

        <Radio.Group
          value={mode}
          onChange={(e) => handleModeChange(e.target.value)}
          buttonStyle="solid"
        >
          <Radio.Button value="explore">
            <EyeOutlined /> 探索模式
          </Radio.Button>
          <Radio.Button value="quiz">
            <EditOutlined /> 练习模式
          </Radio.Button>
        </Radio.Group>
      </div>

      {/* 主内容区 */}
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
        padding: '16px',
        gap: '16px'
      }}>
        {mode === 'explore' ? (
          <>
            {/* 3D 产线展示 */}
            <div style={{
              flex: 1,
              background: '#fff',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid #e8e8e8',
                fontWeight: 'bold'
              }}>
                3D 产线展示
              </div>
              <div style={{ flex: 1, position: 'relative' }}>
                <ProductionLine3D
                  components={components}
                  onComponentClick={handleComponentClick}
                  highlightedId={highlightedId}
                />
              </div>
            </div>

            {/* 电气原理图 */}
            <div style={{
              flex: 1,
              background: '#fff',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid #e8e8e8',
                fontWeight: 'bold'
              }}>
                电气原理图
              </div>
              <div style={{ flex: 1, position: 'relative' }}>
                <ElectricalSchematic
                  components={components}
                  onComponentClick={handleSchematicClick}
                  highlightedId={highlightedId}
                />
              </div>
            </div>
          </>
        ) : (
          // 练习模式
          <div style={{
            width: '100%',
            background: '#fff',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <QuizMode
              quiz={quiz}
              components={components}
              quizState={quizState}
              setQuizState={setQuizState}
              onComponentClick={handleComponentClick}
            />
          </div>
        )}
      </div>

      {/* 元件信息抽屉 */}
      <ComponentInfoDrawer
        open={infoDrawerOpen}
        component={selectedComponent}
        onClose={() => {
          setInfoDrawerOpen(false);
          setHighlightedId(null);
        }}
      />
    </div>
  );
}

export default M2Page;
