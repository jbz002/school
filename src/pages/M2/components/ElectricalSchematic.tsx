import { useEffect, useState } from 'react';
import type { ElectricalComponent } from '../types';

interface ElectricalSchematicProps {
  components: ElectricalComponent[];
  onComponentClick: (componentId: string) => void;
  highlightedId: string | null;
}

function ElectricalSchematic({ components, onComponentClick, highlightedId }: ElectricalSchematicProps) {
  const [hotspots, setHotspots] = useState<Array<{ id: string; x: number; y: number; width: number; height: number }>>([]);

  useEffect(() => {
    // SVG 中元件的大致位置（基于占位 SVG 的坐标）
    const positions: Record<string, { x: number; y: number; width: number; height: number }> = {
      'QF1': { x: 150, y: 80, width: 60, height: 80 },
      'KM1': { x: 280, y: 80, width: 50, height: 80 },
      'M1': { x: 440, y: 80, width: 80, height: 80 },
      'SQ1': { x: 450, y: 230, width: 50, height: 40 },
      'QF2': { x: 100, y: 230, width: 40, height: 40 }
    };

    const hotspotList = components
      .filter(c => positions[c.id])
      .map(c => ({
        id: c.id,
        ...positions[c.id]
      }));

    setHotspots(hotspotList);
  }, [components]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'auto',
        background: '#f5f5f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {/* SVG 电气图 */}
      <img
        src="/electrical-schematic.svg"
        alt="电气原理图"
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain'
        }}
        useMap="#electrical-map"
      />

      {/* 热点区域覆盖层 */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '800px',
          height: '600px',
          pointerEvents: 'none'
        }}
      >
        {hotspots.map(hotspot => {
          const isHighlighted = highlightedId === hotspot.id;
          const component = components.find(c => c.id === hotspot.id);

          return (
            <div
              key={hotspot.id}
              onClick={() => onComponentClick(hotspot.id)}
              style={{
                position: 'absolute',
                left: hotspot.x,
                top: hotspot.y,
                width: hotspot.width,
                height: hotspot.height,
                cursor: 'pointer',
                pointerEvents: 'auto',
                border: isHighlighted ? '3px solid #ffff00' : '2px solid transparent',
                borderRadius: '4px',
                background: isHighlighted ? 'rgba(255, 255, 0, 0.2)' : 'transparent',
                transition: 'all 0.2s ease',
                boxSizing: 'border-box'
              }}
              title={component?.name}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(24, 144, 255, 0.2)';
                e.currentTarget.style.border = '2px solid #1890ff';
              }}
              onMouseLeave={(e) => {
                if (!isHighlighted) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.border = '2px solid transparent';
                }
              }}
            />
          );
        })}
      </div>

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
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>📋 电气原理图</div>
        <div>• 点击元件查看详情</div>
        <div>• 与 3D 场景联动</div>
      </div>

      {/* 图例 */}
      <div style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        background: 'rgba(255, 255, 255, 0.9)',
        padding: '12px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        fontSize: '12px'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>图例</div>
        {components.map(c => (
          <div key={c.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
            <div
              style={{
                width: '16px',
                height: '16px',
                background: c.color,
                borderRadius: '3px',
                marginRight: '8px',
                border: highlightedId === c.id ? '2px solid #ffff00' : '1px solid #ddd'
              }}
            />
            <span style={{ color: highlightedId === c.id ? '#1890ff' : '#666', fontWeight: highlightedId === c.id ? 'bold' : 'normal' }}>
              {c.id}: {c.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ElectricalSchematic;
