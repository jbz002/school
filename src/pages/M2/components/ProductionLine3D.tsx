import { useRef } from 'react';
import type { ElectricalComponent } from '../types';
import { useThreeScene } from '../hooks/useThreeScene';
import { useRaycasterIntegration } from '../hooks/useRaycaster';

interface ProductionLine3DProps {
  components: ElectricalComponent[];
  onComponentClick: (component: ElectricalComponent) => void;
  highlightedId: string | null;
}

function ProductionLine3D({ components, onComponentClick, highlightedId }: ProductionLine3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // 使用 Three.js 场景管理 hook
  const { scene, camera, renderer, objects } = useThreeScene({
    containerRef,
    components,
    onComponentClick,
    highlightedId
  });

  // 集成 Raycaster 交互
  useRaycasterIntegration({
    camera,
    scene,
    renderer,
    objects,
    onComponentClick,
    components
  });

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative'
      }}
    >
      {/* Three.js canvas 将被渲染到这里 */}

      {/* 操作提示 */}
      <div style={{
        position: 'absolute',
        bottom: '16px',
        left: '16px',
        background: 'rgba(255, 255, 255, 0.9)',
        padding: '12px 16px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        fontSize: '13px',
        color: '#666',
        pointerEvents: 'none'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>🖱️ 操作说明</div>
        <div>• 点击元件查看详情</div>
        <div>• 拖拽旋转视角</div>
        <div>• 滚轮缩放</div>
      </div>

      {/* 元件数量指示 */}
      <div style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        background: 'rgba(255, 255, 255, 0.9)',
        padding: '8px 12px',
        borderRadius: '6px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        fontSize: '13px',
        color: '#666',
        pointerEvents: 'none'
      }}>
        元件: {components.length} 个
      </div>
    </div>
  );
}

export default ProductionLine3D;
