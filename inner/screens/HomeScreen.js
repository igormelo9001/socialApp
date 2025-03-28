import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PinchGestureHandler, State, GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated';

const HomeScreen = () => {
  const [posts, setPosts] = useState([]);
  const [in3DMode, setIn3DMode] = useState(false);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0); // Nova variável para rotação
  const panX = useSharedValue(0);
  const panY = useSharedValue(0);
  const rotationX = useSharedValue(0); // Definindo a rotação no eixo X
  const rotationY = useSharedValue(0); // Definindo a rotação no eixo Y

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPosts(postsData);
    });

    return unsubscribe;
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.post}>
      <Text style={styles.user}>{item.user}</Text>
      {item.image && <Image source={{ uri: item.image }} style={styles.image} />}
      {item.text && <Text style={styles.text}>{item.text}</Text>}
    </View>
  );

  const handlePinchGesture = (event) => {
    if (event.nativeEvent.state === State.ACTIVE) {
      scale.value = withSpring(event.nativeEvent.scale);
    }
  };

  const handlePanGesture = (event) => {
    if (event.nativeEvent.state === State.ACTIVE) {
      panX.value = event.nativeEvent.translationX;
      panY.value = event.nativeEvent.translationY;
    }
  };

  // Definindo a rotação no eixo X, Y e Z
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { perspective: 1000 },
        { scale: scale.value },
        { rotateX: `${rotationX.value}rad` },
        { rotateY: `${rotationY.value}rad` },
        { rotate: `${rotation.value}rad` },
        { translateX: panX.value },
        { translateY: panY.value },
      ],
    };
  });

  const handleGlobePress = () => {
    setIn3DMode(!in3DMode);
  };

  const handleZoomIn = () => {
    scale.value = withSpring(scale.value * 1.2);
  };

  const handleZoomOut = () => {
    scale.value = withSpring(scale.value * 0.8);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* Ícone para alternar entre os modos */}
        <TouchableOpacity style={styles.globeButton} onPress={handleGlobePress}>
          <MaterialCommunityIcons name="brain" size={40} color="black" />
        </TouchableOpacity>

        {/* Controles de zoom */}
        {in3DMode && (
          <View style={styles.zoomControls}>
            <TouchableOpacity onPress={handleZoomIn} style={styles.zoomButton}>
              <Text style={styles.zoomText}>Zoom In</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleZoomOut} style={styles.zoomButton}>
              <Text style={styles.zoomText}>Zoom Out</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Condicional para alternar entre os modos */}
        {in3DMode ? (
          <PinchGestureHandler onGestureEvent={handlePinchGesture}>
            <Animated.View style={[styles.universeContainer, animatedStyle]}>
              <PanGestureHandler onGestureEvent={handlePanGesture}>
                <Animated.View style={[styles.universeContainer, animatedStyle]}>
                  {/* Renderizando posts em 3D com posições mais espaçadas */}
                  {posts.map((post, index) => (
                    <View
                      key={index}
                      style={[
                        styles.post3D,
                        {
                          left: Math.random() * 400, // Aumentando o espaçamento horizontal
                          top: Math.random() * 400, // Aumentando o espaçamento vertical
                        },
                      ]}>
                      <Text style={styles.user}>{post.user}</Text>
                      {post.image && <Image source={{ uri: post.image }} style={styles.image3D} />}
                      {post.text && <Text style={styles.text}>{post.text}</Text>}
                    </View>
                  ))}
                </Animated.View>
              </PanGestureHandler>
            </Animated.View>
          </PinchGestureHandler>
        ) : (
          <FlatList
            data={posts}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
          />
        )}
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'flex-start',
  },
  globeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
  },
  zoomControls: {
    position: 'absolute',
    top: 100,
    right: 20,
    zIndex: 1,
  },
  zoomButton: {
    backgroundColor: '#FFF',
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
    elevation: 5,
  },
  zoomText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  universeContainer: {
    flex: 1,
    position: 'relative',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  post3D: {
    backgroundColor: '#FFF',
    padding: 16,
    margin: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    position: 'absolute', // Manter os posts em 3D
  },
  user: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  image: {
    width: '100%',
    height: 200,
    marginBottom: 8,
    borderRadius: 8,
  },
  image3D: {
    width: 100,
    height: 100,
    marginBottom: 8,
    borderRadius: 8,
  },
  text: {
    fontSize: 16,
  },
});

export default HomeScreen;
