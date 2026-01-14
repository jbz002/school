import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import type { ElectricalComponent, AnimationType } from '../types';

/**
 * 创建元件几何体
 * 根据组件数据生成对应的 3D 几何体
 */
export function createComponentMesh(component: ElectricalComponent): THREE.Mesh {
  const { geometry, color, id } = component;

  // 根据类型创建几何体
  let geom: THREE.BufferGeometry;
  switch (geometry.type) {
    case 'box':
      geom = new THREE.BoxGeometry(
        geometry.width || 1,
        geometry.height || 1,
        geometry.depth || 1
      );
      break;
    case 'cylinder':
      geom = new THREE.CylinderGeometry(
        geometry.radius || 0.5,
        geometry.radius || 0.5,
        geometry.height || 1,
        32
      );
      break;
    case 'sphere':
      geom = new THREE.SphereGeometry(geometry.radius || 0.5, 32, 32);
      break;
    default:
      geom = new THREE.BoxGeometry(1, 1, 1);
  }

  // 创建优化的 PBR 材质
  const material = createOptimizedMaterial(color, component.animationConfig);

  // 创建网格
  const mesh = new THREE.Mesh(geom, material);
  mesh.position.set(component.position.x, component.position.y, component.position.z);

  // 存储元数据用于交互和动画
  mesh.userData = {
    componentId: id,
    originalColor: color,
    originalEmissive: material.emissive.getHex(),
    originalEmissiveIntensity: material.emissiveIntensity,
    animationType: component.animationConfig.animationType,
    isAnimating: false
  };

  return mesh;
}

/**
 * 创建优化的材质
 * 根据动画类型配置不同的材质属性
 */
function createOptimizedMaterial(
  color: string,
  animationConfig: { hasAnimation: boolean; animationType: AnimationType }
): THREE.MeshStandardMaterial {
  const baseMaterial = {
    color: new THREE.Color(color),
    roughness: 0.5,      // 降低粗糙度，更有质感
    metalness: 0.5,      // 增加金属感
    envMapIntensity: 1.0
  };

  // 指示灯发光材质
  if (animationConfig.animationType === 'glow') {
    return new THREE.MeshStandardMaterial({
      ...baseMaterial,
      emissive: new THREE.Color(color),
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.9
    });
  }

  // 标准 PBR 材质
  return new THREE.MeshStandardMaterial({
    ...baseMaterial
  });
}

/**
 * 设置场景基础环境（增强版）
 * 包括环境光、主光源、补光、点光源、聚光灯、半球光等
 */
export function setupScene(scene: THREE.Scene): void {
  // 环境光 - 提供整体照明
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  // 主光源 - 模拟太阳光/顶灯
  const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
  mainLight.position.set(10, 20, 10);
  mainLight.castShadow = true;
  mainLight.shadow.mapSize.width = 2048;
  mainLight.shadow.mapSize.height = 2048;
  scene.add(mainLight);

  // 补光 - 减少阴影过深
  const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
  fillLight.position.set(-10, 10, -10);
  scene.add(fillLight);

  // 点光源 - 工作照明
  const workingLight = new THREE.PointLight(0xffffff, 0.5, 10);
  workingLight.position.set(0, 5, 0);
  scene.add(workingLight);

  // 聚光灯 - 重点照明
  const spotLight = new THREE.SpotLight(0xffffff, 0.8);
  spotLight.position.set(5, 10, 5);
  spotLight.angle = Math.PI / 6;
  spotLight.penumbra = 0.3;
  spotLight.castShadow = true;
  scene.add(spotLight);

  // 半球光 - 环境补光
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.3);
  scene.add(hemiLight);

  // 地面网格 - 帮助理解空间关系
  const gridHelper = new THREE.GridHelper(20, 20, 0x888888, 0xcccccc);
  gridHelper.position.y = -0.01;
  scene.add(gridHelper);

  // 地面平面 - 接收阴影
  const planeGeometry = new THREE.PlaneGeometry(20, 20);
  const planeMaterial = new THREE.MeshStandardMaterial({
    color: 0xf0f0f0,
    roughness: 0.9,
    metalness: 0.1
  });
  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.rotation.x = -Math.PI / 2;
  plane.position.y = -0.02;
  plane.receiveShadow = true;
  scene.add(plane);
}

/**
 * 创建相机
 */
export function createCamera(aspect: number): THREE.PerspectiveCamera {
  const camera = new THREE.PerspectiveCamera(
    60,           // 视野角度
    aspect,       // 宽高比
    0.1,          // 近裁剪面
    1000          // 远裁剪面
  );
  camera.position.set(0, 5, 12);
  camera.lookAt(0, 0, 0);
  return camera;
}

/**
 * 创建渲染器
 */
export function createRenderer(container: HTMLElement): THREE.WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,    // 抗锯齿
    alpha: true         // 透明背景
  });

  const width = container.clientWidth;
  const height = container.clientHeight;

  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // 限制像素比优化性能
  renderer.shadowMap.enabled = true;                              // 启用阴影
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;               // 柔和阴影
  renderer.setClearColor(0x87ceeb, 1);                           // 天空蓝背景

  return renderer;
}

/**
 * 更新高亮效果
 * 通过修改材质的 emissive 属性实现发光效果
 */
export function updateHighlight(
  objects: Map<string, THREE.Mesh>,
  componentId: string | null
): void {
  objects.forEach((mesh, id) => {
    const material = mesh.material as THREE.MeshStandardMaterial;
    const userData = mesh.userData as {
      originalEmissive: number;
      originalEmissiveIntensity: number;
    };

    if (id === componentId) {
      // 高亮选中元件
      material.emissive = new THREE.Color(0xffff00);
      material.emissiveIntensity = 0.5;
    } else {
      // 恢复原始状态
      material.emissive = new THREE.Color(userData.originalEmissive);
      material.emissiveIntensity = userData.originalEmissiveIntensity;
    }
  });
}

/**
 * 动画管理器
 * 管理所有活动的动画效果
 */
export class AnimationManager {
  private animations: Map<string, TWEEN.Tween> = new Map();
  private rotatingMeshes: Set<string> = new Set();
  private glowingMeshes: Map<string, { mesh: THREE.Mesh; baseIntensity: number; phase: number }> = new Map();

  /**
   * 播放开关动画
   */
  playSwitchAnimation(mesh: THREE.Mesh, isOpen: boolean, duration: number = 300): void {
    const componentId = mesh.userData.componentId;

    // 停止现有动画
    this.stopAnimation(componentId);

    const startRotation = { x: mesh.rotation.x };
    const targetRotation = isOpen ? { x: Math.PI / 6 } : { x: 0 };

    const tween = new TWEEN.Tween(startRotation)
      .to(targetRotation, duration)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .onUpdate(() => {
        mesh.rotation.x = startRotation.x;
      })
      .start();

    this.animations.set(componentId, tween);
  }

  /**
   * 开始/停止旋转动画
   */
  toggleRotateAnimation(mesh: THREE.Mesh, isRunning: boolean): void {
    const componentId = mesh.userData.componentId;

    if (isRunning) {
      this.rotatingMeshes.add(componentId);
    } else {
      this.rotatingMeshes.delete(componentId);
    }
  }

  /**
   * 开始发光动画（呼吸效果）
   */
  startGlowAnimation(mesh: THREE.Mesh): void {
    const componentId = mesh.userData.componentId;
    const material = mesh.material as THREE.MeshStandardMaterial;

    this.glowingMeshes.set(componentId, {
      mesh,
      baseIntensity: material.emissiveIntensity,
      phase: 0
    });
  }

  /**
   * 停止发光动画
   */
  stopGlowAnimation(componentId: string): void {
    this.glowingMeshes.delete(componentId);
  }

  /**
   * 停止特定元件的动画
   */
  stopAnimation(componentId: string): void {
    const tween = this.animations.get(componentId);
    if (tween) {
      tween.stop();
      this.animations.delete(componentId);
    }
  }

  /**
   * 更新所有动画（在渲染循环中调用）
   */
  update(deltaTime: number): void {
    // 更新 TWEEN 动画
    TWEEN.update();

    // 更新旋转动画
    this.rotatingMeshes.forEach((id) => {
      const mesh = this.findMeshById(id);
      if (mesh && mesh.userData.animationType === 'rotate') {
        mesh.rotation.y += 0.02;
      }
    });

    // 更新发光动画（呼吸效果）
    this.glowingMeshes.forEach((data) => {
      data.phase += deltaTime * 2;
      const material = data.mesh.material as THREE.MeshStandardMaterial;
      const intensity = data.baseIntensity + Math.sin(data.phase) * 0.3;
      material.emissiveIntensity = Math.max(0, intensity);
    });
  }

  /**
   * 清理所有动画
   */
  dispose(): void {
    this.animations.forEach(tween => tween.stop());
    this.animations.clear();
    this.rotatingMeshes.clear();
    this.glowingMeshes.clear();
  }

  private findMeshById(_id: string): THREE.Mesh | null {
    // 这个方法需要从外部传入 mesh 获取函数，这里简化处理
    return null;
  }
}

/**
 * 全局动画管理器实例
 */
export const animationManager = new AnimationManager();

/**
 * 触发元件动画
 * 根据元件的动画配置触发相应的动画效果
 */
export function triggerComponentAnimation(
  mesh: THREE.Mesh,
  enabled: boolean
): void {
  const animationType = mesh.userData.animationType;

  switch (animationType) {
    case 'switch':
      animationManager.playSwitchAnimation(mesh, enabled);
      break;
    case 'rotate':
      animationManager.toggleRotateAnimation(mesh, enabled);
      break;
    case 'glow':
      if (enabled) {
        animationManager.startGlowAnimation(mesh);
      } else {
        animationManager.stopGlowAnimation(mesh.userData.componentId);
      }
      break;
    case 'none':
    default:
      // 无动画
      break;
  }
}

/**
 * 添加传送带（装饰性）
 */
export function createConveyorBelt(): THREE.Group {
  const group = new THREE.Group();

  // 传送带支架
  const legGeometry = new THREE.BoxGeometry(0.3, 1, 0.3);
  const legMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });

  for (let x = -4; x <= 4; x += 2) {
    const leg1 = new THREE.Mesh(legGeometry, legMaterial);
    leg1.position.set(x, -0.5, 1);
    group.add(leg1);

    const leg2 = new THREE.Mesh(legGeometry, legMaterial);
    leg2.position.set(x, -0.5, -1);
    group.add(leg2);
  }

  // 传送带主体
  const beltGeometry = new THREE.BoxGeometry(10, 0.2, 2);
  const beltMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const belt = new THREE.Mesh(beltGeometry, beltMaterial);
  belt.position.y = 0.4;
  group.add(belt);

  // 传送带表面（深色橡胶）
  const surfaceGeometry = new THREE.BoxGeometry(10, 0.05, 1.8);
  const surfaceMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
  const surface = new THREE.Mesh(surfaceGeometry, surfaceMaterial);
  surface.position.y = 0.52;
  group.add(surface);

  return group;
}

/**
 * 创建电流动画效果
 * 使用 TubeGeometry 创建流动的导线效果
 */
export function createFlowEffect(
  start: THREE.Vector3,
  end: THREE.Vector3,
  color: number = 0x00ffff
): THREE.Mesh {
  const curve = new THREE.LineCurve3(start, end);
  const tubeGeometry = new THREE.TubeGeometry(curve, 20, 0.05, 8, false);
  const tubeMaterial = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.6
  });
  return new THREE.Mesh(tubeGeometry, tubeMaterial);
}

/**
 * 创建粒子特效（火花效果）
 */
export function createSparkEffect(position: THREE.Vector3): THREE.Points {
  const particleCount = 50;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount * 3; i += 3) {
    positions[i] = position.x + (Math.random() - 0.5) * 0.5;
    positions[i + 1] = position.y + (Math.random() - 0.5) * 0.5;
    positions[i + 2] = position.z + (Math.random() - 0.5) * 0.5;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: 0xffff00,
    size: 0.05,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
  });

  return new THREE.Points(geometry, material);
}
