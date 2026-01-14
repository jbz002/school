import { useState, useEffect } from 'react';
import { Button, Card, Radio, Space, Typography, Statistic, Row, Col, message, Progress, Tag } from 'antd';
import { ClockCircleOutlined, TrophyOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import type { Quiz, QuizState, ElectricalComponent } from '../types';

const { Title, Text } = Typography;

interface QuizModeProps {
  quiz: Quiz[];
  components: ElectricalComponent[];
  quizState: QuizState;
  setQuizState: React.Dispatch<React.SetStateAction<QuizState>>;
  onComponentClick: (component: ElectricalComponent) => void;
}

function QuizMode({ quiz, components, quizState, setQuizState, onComponentClick }: QuizModeProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const currentQuiz = quiz[quizState.current];

  // 倒计时
  useEffect(() => {
    if (quizState.isFinished || quizState.timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setQuizState(prev => {
        if (prev.timeRemaining <= 1) {
          return { ...prev, timeRemaining: 0, isFinished: true };
        }
        return { ...prev, timeRemaining: prev.timeRemaining - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quizState.isFinished, setQuizState]);

  const handleAnswerSubmit = () => {
    if (selectedAnswer === null) {
      message.warning('请选择答案');
      return;
    }

    const isCorrect = selectedAnswer === currentQuiz.correctAnswer;

    setQuizState(prev => ({
      ...prev,
      score: prev.score + (isCorrect ? currentQuiz.points : 0),
      attempts: [...prev.attempts, {
        quizId: currentQuiz.id,
        isCorrect,
        timeSpent: 0
      }]
    }));

    setShowResult(true);

    setTimeout(() => {
      handleNext();
    }, 1500);
  };

  const handleNext = () => {
    setSelectedAnswer(null);
    setShowResult(false);

    if (quizState.current < quiz.length - 1) {
      setQuizState(prev => ({ ...prev, current: prev.current + 1 }));
    } else {
      setQuizState(prev => ({ ...prev, isFinished: true }));
    }
  };

  const handleReset = () => {
    setQuizState({
      current: 0,
      score: 0,
      attempts: [],
      isFinished: false,
      timeRemaining: 300
    });
    setSelectedAnswer(null);
    setShowResult(false);
  };

  // 测试完成
  if (quizState.isFinished) {
    const totalPoints = quiz.reduce((sum, q) => sum + q.points, 0);
    const percentage = Math.round((quizState.score / totalPoints) * 100);
    const correctCount = quizState.attempts.filter(a => a.isCorrect).length;

    return (
      <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
        <Card style={{ textAlign: 'center', borderRadius: '12px' }}>
          <TrophyOutlined style={{ fontSize: '64px', color: '#ffd700', marginBottom: '24px' }} />
          <Title level={2}>练习完成！</Title>
          <Row gutter={16} style={{ margin: '24px 0' }}>
            <Col span={8}>
              <Statistic title="得分" value={quizState.score} suffix={`/ ${totalPoints}`} />
            </Col>
            <Col span={8}>
              <Statistic title="正确率" value={percentage} suffix="%" />
            </Col>
            <Col span={8}>
              <Statistic title="正确题数" value={correctCount} suffix={`/ ${quiz.length}`} />
            </Col>
          </Row>
          <div style={{ marginTop: '24px' }}>
            <Text type="secondary">
              {percentage >= 80 ? '🎉 优秀！您已掌握电气识图基础' :
               percentage >= 60 ? '👍 良好！继续努力' :
               '📚 需要加强练习'}
            </Text>
          </div>
          <Button type="primary" size="large" onClick={handleReset} style={{ marginTop: '24px' }}>
            重新练习
          </Button>
        </Card>
      </div>
    );
  }

  // 答题中
  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
      {/* 顶部状态栏 */}
      <Card size="small" style={{ marginBottom: '16px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space size="large">
              <Statistic
                title="题目"
                value={quizState.current + 1}
                suffix={`/ ${quiz.length}`}
                valueStyle={{ fontSize: '20px' }}
              />
              <Statistic
                title="得分"
                value={quizState.score}
                valueStyle={{ fontSize: '20px', color: '#52c41a' }}
              />
            </Space>
          </Col>
          <Col>
            <Statistic
              title="剩余时间"
              value={quizState.timeRemaining}
              suffix="秒"
              prefix={<ClockCircleOutlined />}
              valueStyle={{
                fontSize: '20px',
                color: quizState.timeRemaining < 60 ? '#ff4d4f' : '#1890ff'
              }}
            />
          </Col>
        </Row>
        <Progress
          percent={((quizState.current + 1) / quiz.length) * 100}
          showInfo={false}
          strokeColor="#1890ff"
          style={{ marginTop: '12px' }}
        />
      </Card>

      {/* 题目卡片 */}
      <Card>
        <Title level={3} style={{ marginBottom: '24px' }}>
          {currentQuiz.question}
        </Title>

        {currentQuiz.type === 'choice' && currentQuiz.options ? (
          <Radio.Group
            value={selectedAnswer}
            onChange={(e) => setSelectedAnswer(e.target.value)}
            disabled={showResult}
            style={{ width: '100%' }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {currentQuiz.options.map((option, index) => {
                let optionStyle: React.CSSProperties = {
                  width: '100%',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #d9d9d9',
                  background: '#fff'
                };

                if (showResult) {
                  if (index === currentQuiz.correctAnswer) {
                    optionStyle = { ...optionStyle, borderColor: '#52c41a', background: '#f6ffed' };
                  } else if (index === selectedAnswer && index !== currentQuiz.correctAnswer) {
                    optionStyle = { ...optionStyle, borderColor: '#ff4d4f', background: '#fff2f0' };
                  }
                }

                return (
                  <Radio
                    key={index}
                    value={index}
                    style={optionStyle}
                  >
                    <Text style={{ fontSize: '16px' }}>{option}</Text>
                    {showResult && index === currentQuiz.correctAnswer && (
                      <CheckCircleOutlined style={{ color: '#52c41a', marginLeft: '8px' }} />
                    )}
                    {showResult && index === selectedAnswer && index !== currentQuiz.correctAnswer && (
                      <CloseCircleOutlined style={{ color: '#ff4d4f', marginLeft: '8px' }} />
                    )}
                  </Radio>
                );
              })}
            </Space>
          </Radio.Group>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Text type="secondary" style={{ fontSize: '16px' }}>
              请在 3D 场景或电气图中点击对应的元件
            </Text>
            <div style={{ marginTop: '16px' }}>
              <Text strong>目标元件: </Text>
              <Tag color="blue" style={{ fontSize: '16px' }}>
                {components.find(c => c.id === currentQuiz.targetId)?.name}
              </Tag>
            </div>
          </div>
        )}

        <div style={{ marginTop: '32px', textAlign: 'center' }}>
          {!showResult ? (
            <Button
              type="primary"
              size="large"
              onClick={handleAnswerSubmit}
              disabled={selectedAnswer === null}
              style={{ minWidth: '120px' }}
            >
              提交答案
            </Button>
          ) : (
            <Space size="large">
              {selectedAnswer === currentQuiz.correctAnswer ? (
                <Text style={{ fontSize: '18px', color: '#52c41a' }}>
                  <CheckCircleOutlined /> 回答正确！+{currentQuiz.points}分
                </Text>
              ) : (
                <Text style={{ fontSize: '18px', color: '#ff4d4f' }}>
                  <CloseCircleOutlined /> 回答错误
                </Text>
              )}
            </Space>
          )}
        </div>

        {/* 分值提示 */}
        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <Text type="secondary">本题分值: {currentQuiz.points} 分</Text>
        </div>
      </Card>
    </div>
  );
}

export default QuizMode;
