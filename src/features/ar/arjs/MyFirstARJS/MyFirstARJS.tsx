'use client';

import * as THREE from 'three';
import { THREEx } from '@ar-js-org/ar.js-threejs';
import { useEffect, useRef, useState } from 'react';
import Stats from 'three/addons/libs/stats.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

interface MarkerModel {
  patternPath: string;
  data3dPath: string;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
  text:string;
}

export const MyFirstARJS = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isFound, setIsFound] = useState(false);
  const mixers: THREE.AnimationMixer[] = [];

  useEffect(() => {
    if (!canvasRef.current) return;

    const clock = new THREE.Clock();
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      canvas: canvasRef.current,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.01,
      20
    );
    camera.position.set(0,0,0);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    scene.add(camera);

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(2.4, 2, 5);
    scene.add(light);

    const loader = new GLTFLoader();
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.update();

    
    const markerModels: MarkerModel[] = [
      {
        patternPath: 'marker.patt',
        data3dPath: '/assets/asset.glb',
        text: 'これはマーカー1の説明です。',
        position: new THREE.Vector3(-2.2, 1, -1.5),
        rotation: new THREE.Euler(-Math.PI / 2, 0, 0),
        scale: new THREE.Vector3(0.25, 0.25, 0.25),
      },
      {
        patternPath: 'marker2.patt',
        data3dPath: '/assets/asset2.glb',
        text: 'これはマーカー2の説明です。',
        position: new THREE.Vector3(-2.2, 1, -1.5),
        rotation: new THREE.Euler(-Math.PI / 2, -Math.PI / 2, 0),
        scale: new THREE.Vector3(0.25, 0.25, 0.25),
      },
      {
        patternPath: 'marker_pen.patt',
        data3dPath: '/assets/asset_pen.glb',
        text: 'これはペンのマーカーの説明です。',
        position: new THREE.Vector3(-2.2, 1, -1.5),
        rotation: new THREE.Euler(-Math.PI / 2, -Math.PI / 2, 0),
        scale: new THREE.Vector3(0.25, 0.25, 0.25),
      },
      {
        patternPath: 'marker_apple.patt',
        data3dPath: '/assets/asset_apple.glb',
        text: 'これはリンゴのマーカーの説明です。',
        position: new THREE.Vector3(-2.2, 1, -1.5),
        rotation: new THREE.Euler(-Math.PI / 2, -Math.PI / 2, 0),
        scale: new THREE.Vector3(0.25, 0.25, 0.25),
      },
      {
        patternPath: 'marker_applePen.patt',
        data3dPath: '/assets/asset_applePen.glb',
        text: 'これはリンゴペンのマーカーの説明です。',
        position: new THREE.Vector3(-2.2, 1, -1.5),
        rotation: new THREE.Euler(-Math.PI / 2, -Math.PI / 2, 0),
        scale: new THREE.Vector3(0.25, 0.25, 0.25),
      },
    ]

    const arToolkitContext = new THREEx.ArToolkitContext({
      cameraParametersUrl: '/camera_para.dat',
      detectionMode: 'mono',
    });

    arToolkitContext.init(() => {
      camera.projectionMatrix.copy(arToolkitContext.getProjectionMatrix());
    });

    const arToolkitSource = new THREEx.ArToolkitSource({
      sourceType: 'webcam',
      sourceWidth: window.innerWidth,
      sourceHeight: window.innerHeight,
    });

    arToolkitSource.init(() => {
      document.body.appendChild(arToolkitSource.domElement);
      setTimeout(() => {
        arToolkitSource.onResizeElement();
        arToolkitSource.copyElementSizeTo(renderer.domElement);
      }, 2000);
    });

    markerModels.forEach((markerModel) => {
      const markerRoot = new THREE.Group();
      scene.add(markerRoot);

      const arMarkerControls = new THREEx.ArMarkerControls(
        arToolkitContext,
        markerRoot,
        {
          type: 'pattern',
          patternUrl: markerModel.patternPath,
        }
      );

      loader.load(markerModel.data3dPath, (gltf) => {
        const model = gltf.scene;
        model.position.copy(markerModel.position);
        model.rotation.copy(markerModel.rotation);
        model.scale.copy(markerModel.scale);
        markerRoot.add(model);

        if (gltf.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(model);
          mixers.push(mixer);
          mixer.clipAction(gltf.animations[0]).play();
        }
      });

      arMarkerControls.addEventListener('markerFound', () => {
        setIsFound(true);
      });
    });

    const animate = () => {
      requestAnimationFrame(animate);

      const delta = clock.getDelta();
      mixers.forEach((mixer) => mixer.update(delta));

      if (arToolkitSource.ready) {
        arToolkitContext.update(arToolkitSource.domElement);
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      renderer.setAnimationLoop(null);
    };
  }, [canvasRef]);

  return (
    <div className='h-screen w-screen'>
      <canvas ref={canvasRef}></canvas>
      {!isFound && (
        <div className='absolute left-0 top-0 h-full w-full bg-black opacity-50'>
          <p className='text-center text-white'>マーカーを探しています...</p>
        </div>
      )}
    </div>
  );
};
