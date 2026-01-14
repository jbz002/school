import { Card, Progress, Alert, Space, Button, List, Tag, Typography } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import type { WireConnection, WiringRule } from '../types';
import { useConnectionRules } from '../hooks/useConnectionRules';

const { Text } = Typography;

/**
 * 连接验证面板组件属性
 */
interface ConnectionValidatorProps {
  /** 当前连接列表 */
  connections: WireConnection[];
  /** 接线规则 */
  rules: WiringRule[];
  /** 重置回调 */
  onReset?: () => void;
  /** 提交回调 */
  onSubmit?: () => void;
}

/**
 * 连接验证面板组件
 *
 * 负责实时验证接线正确性并展示反馈，包括：
 * - 进度条显示完成度
 * - 错误/警告消息展示
 * - 规则列表（带完成状态标记）
 * - 提交和重置按钮
 *
 * 使用 useConnectionRules Hook 进行验证，消除重复逻辑。
 */
function ConnectionValidator({
  connections,
  rules,
  onReset,
  onSubmit
}: ConnectionValidatorProps) {
  // 使用 Hook 获取验证结果
  const {
    isValid,
    errors,
    warnings,
    completedRules,
    progress
  } = useConnectionRules(connections, rules);

  return (
    <Card title="连接验证" size="small" style={{ height: '100%' }}>
      {/* 进度条 */}
      <Progress
        percent={progress}
        status={isValid ? 'success' : 'active'}
        strokeColor={isValid ? '#52c41a' : '#1890ff'}
      />

      {/* 验证结果 */}
      <Space direction="vertical" style={{ width: '100%', marginTop: 16 }} size="small">
        {/* 错误消息 */}
        {errors.map((error, index) => (
          <Alert
            key={`error-${index}`}
            type="error"
            icon={<CloseCircleOutlined />}
            message={error.message}
            description={error.suggestion}
            closable
          />
        ))}

        {/* 警告消息 */}
        {warnings.map((warning, index) => (
          <Alert
            key={`warning-${index}`}
            type="warning"
            icon={<WarningOutlined />}
            message={warning.message}
            closable
          />
        ))}

        {/* 成功消息 */}
        {completedRules.length > 0 && errors.length === 0 && (
          <Alert
            type="success"
            icon={<CheckCircleOutlined />}
            message={`已完成 ${completedRules.length} / ${rules.length} 个规则`}
            description={
              completedRules.length === rules.length
                ? completedRules[0].feedback.success
                : completedRules[0].feedback.partial
            }
          />
        )}
      </Space>

      {/* 规则列表 */}
      <List
        size="small"
        header={<div style={{ fontWeight: 'bold' }}>接线规则</div>}
        dataSource={rules}
        renderItem={rule => {
          const isCompleted = completedRules.includes(rule);
          return (
            <List.Item>
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Space>
                  {isCompleted ? (
                    <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  ) : (
                    <CloseCircleOutlined style={{ color: '#d9d9d9' }} />
                  )}
                  <Tag color={isCompleted ? 'success' : 'default'}>
                    {rule.type}
                  </Tag>
                  <Text>{rule.description}</Text>
                </Space>
                {isCompleted && (
                  <Tag color="success">完成</Tag>
                )}
              </Space>
            </List.Item>
          );
        }}
        style={{ marginTop: 16, maxHeight: 200, overflow: 'auto' }}
      />

      {/* 完成按钮 */}
      {isValid && (
        <Button
          type="primary"
          size="large"
          block
          onClick={onSubmit}
          style={{ marginTop: 16 }}
          icon={<CheckCircleOutlined />}
        >
          提交接线
        </Button>
      )}

      {/* 重置按钮 */}
      {connections.length > 0 && (
        <Button
          size="large"
          block
          onClick={onReset}
          style={{ marginTop: 8 }}
          icon={<ReloadOutlined />}
        >
          重置接线
        </Button>
      )}
    </Card>
  );
}

export default ConnectionValidator;
