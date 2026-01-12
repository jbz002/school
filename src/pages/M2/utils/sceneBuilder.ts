import * as THREE from 'three';
import type { ElectricalComponent } from '../types';

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

  // 创建材质
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    roughness: 0.7,
    metalness: 0.3
  });

  // 创建网格
  const mesh = new THREE.Mesh(geom, material);
  mesh.position.set(component.position.x, component.position.y, component.position.z);

  // 存储元数据用于交互
  mesh.userData = {
    componentId: id,
    originalColor: color,
    originalEmissive: 0x000000,
    originalEmissiveIntensity: 0
  };

  return mesh;
}

/**
 * 设置场景基础环境
 * 包括环境光、主光源、辅助网格等
 */
export function setupScene(scene: THREE.Scene): void {
  // 环境光 - 提供整体照明
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  // 主光源 - 模拟太阳光/顶灯
  const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
  mainLight.position.set(10, 20, 10);
  mainLight.castShadow = true;
  scene.add(mainLight);

  // 补光 - 减少阴影过深
  const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
  fillLight.position.set(-10, 10, -10);
  scene.add(fillLight);

  // 地面网格 - 帮助理解空间关系
  const gridHelper = new THREE.GridHelper(20, 20, 0x888888, 0xcccccc);
  gridHelper.position.y = -0.01; // 略微下沉避免 z-fighting
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
      material.emissive = new THREE.Color(0xffff00);  // 黄色发光
      material.emissiveIntensity = 0.5;
    } else {
      // 恢复原始状态
      material.emissive = new THREE.Color(userData.originalEmissive);
      material.emissiveIntensity = userData.originalEmissiveIntensity;
    }
  });
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
