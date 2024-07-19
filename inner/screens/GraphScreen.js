import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { GLView } from 'expo-gl';
import * as THREE from 'three';
import ExpoTHREE from 'expo-three';

const GraphScreen = ({ route }) => {
  const { contacts } = route.params;
  const glRef = useRef(null);

  useEffect(() => {
    if (GLView.current) {
      const { drawingBufferWidth: width, drawingBufferHeight: height } = GLView.current;
      console.log('GLView context created');

      // Create a scene
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
      camera.position.z = 5;

      // Create a renderer
      const renderer = new ExpoTHREE.Renderer({ gl: GLView.current });
      renderer.setSize(width, height);
      renderer.setPixelRatio(window.devicePixelRatio);

      // Add spheres for contacts
      contacts.forEach(contact => {
        const geometry = new THREE.SphereGeometry(0.1, 32, 32);
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.set(Math.random() * 10 - 5, Math.random() * 10 - 5, Math.random() * 10 - 5);
        scene.add(sphere);
      });

      // Add a basic plane to see if rendering works
      const planeGeometry = new THREE.PlaneGeometry(5, 5);
      const planeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide });
      const plane = new THREE.Mesh(planeGeometry, planeMaterial);
      scene.add(plane);

      // Render loop
      const animate = () => {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
      };
      animate();

      // Handle cleanup
      return () => {
        renderer.dispose();
        scene.dispose();
      };
    } else {
      console.log('GLView context not created');
    }
  }, [contacts]);

  return (
    <View style={styles.container}>
      <GLView
        style={{ flex: 1 }}
        onContextCreate={gl => {
          console.log('GLView onContextCreate');
          GLView.current = gl;
        }}
      />
      {/* Optional: Add a text view for debugging */}
      <Text style={styles.debugText}>Graph Screen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  debugText: {
    position: 'absolute',
    top: 10,
    left: 10,
    color: 'black',
    fontSize: 16,
  },
});

export default GraphScreen;
