import React, { useRef, useEffect, useMemo, useCallback, memo } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  InteractionManager,
} from 'react-native';

const { width, height } = Dimensions.get('window');

// Performance optimizations with enhanced configs
const ANIMATION_CONFIG = {
  useNativeDriver: true,
  isInteraction: false,
  bounciness: 0,
};

const SPRING_CONFIG = {
  tension: 100,
  friction: 8,
  useNativeDriver: true,
  isInteraction: false,
  overshootClamping: true,
  restDisplacementThreshold: 0.001,
  restSpeedThreshold: 0.001,
};

const FAST_TIMING_CONFIG = {
  useNativeDriver: true,
  isInteraction: false,
  duration: 150,
};

// Animation pool for memory optimization
const animationPool = {
  values: new Map(),
  timers: new Map(),
  
  getValue: (key, initialValue = 0) => {
    if (!animationPool.values.has(key)) {
      animationPool.values.set(key, new Animated.Value(initialValue));
    }
    return animationPool.values.get(key);
  },
  
  clearTimer: (key) => {
    const timer = animationPool.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      animationPool.timers.delete(key);
    }
  },
  
  setTimer: (key, timer) => {
    animationPool.clearTimer(key);
    animationPool.timers.set(key, timer);
  },
  
  cleanup: () => {
    animationPool.timers.forEach(timer => clearTimeout(timer));
    animationPool.timers.clear();
    // Note: We don't clear values as they might be reused
  }
};

// Enhanced interpolation configs
const INTERPOLATION_CONFIGS = {
  fade: {
    inputRange: [0, 1],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  },
  scale: {
    inputRange: [0, 1],
    outputRange: [0.8, 1],
    extrapolate: 'clamp',
  },
  slide: {
    inputRange: [0, 1],
    outputRange: [50, 0],
    extrapolate: 'clamp',
  },
};

export const FadeTransition = memo(({
  children,
  duration = 200,
  delay = 0,
  style,
  ...props
}) => {
  const componentKey = useMemo(() => `fade_${Date.now()}_${Math.random()}`, []);
  const fadeAnim = useMemo(() => animationPool.getValue(componentKey, 0), [componentKey]);

  const startAnimation = useCallback(() => {
    InteractionManager.runAfterInteractions(() => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration,
        ...FAST_TIMING_CONFIG,
      }).start();
    });
  }, [fadeAnim, duration]);

  useEffect(() => {
    if (delay > 0) {
      const timer = setTimeout(startAnimation, delay);
      animationPool.setTimer(componentKey, timer);
    } else {
      startAnimation();
    }

    return () => {
      animationPool.clearTimer(componentKey);
    };
  }, [delay, startAnimation, componentKey]);

  const animatedStyle = useMemo(() => ({
    opacity: fadeAnim.interpolate(INTERPOLATION_CONFIGS.fade),
  }), [fadeAnim]);

  return (
    <Animated.View
      style={[style, animatedStyle]}
      {...props}
    >
      {children}
    </Animated.View>
  );
});

/**
 * Componente de transición animada que desliza y desvanece su contenido desde una dirección específica.
 *
 * @param {Object} props - Propiedades del componente.
 * @param {React.ReactNode} props.children - Elementos hijos a renderizar dentro de la transición.
 * @param {'bottom'|'top'|'left'|'right'} [props.direction='bottom'] - Dirección desde la cual el contenido aparecerá.
 * @param {number} [props.duration=300] - Duración de la animación en milisegundos.
 * @param {number} [props.delay=0] - Retardo antes de iniciar la animación en milisegundos.
 * @param {number} [props.distance=50] - Distancia desde la cual el contenido se desliza.
 * @param {Object} [props.style] - Estilo adicional para el componente animado.
 * @returns {JSX.Element} Componente animado que envuelve a los hijos.
 */
export const SlideInTransition = memo(({
  children,
  direction = 'bottom', // 'bottom', 'top', 'left', 'right'
  duration = 300,
  delay = 0,
  distance = 50,
  style,
  ...props
}) => {
  const componentKey = useMemo(() => `slide_${direction}_${Date.now()}_${Math.random()}`, [direction]);
  const slideAnim = useMemo(() => animationPool.getValue(`${componentKey}_slide`, distance), [componentKey, distance]);
  const fadeAnim = useMemo(() => animationPool.getValue(`${componentKey}_fade`, 0), [componentKey]);

  const getTransform = useMemo(() => {
    const transforms = {
      top: [{ translateY: slideAnim.interpolate({
        inputRange: [0, distance],
        outputRange: [0, -distance],
        extrapolate: 'clamp',
      }) }],
      bottom: [{ translateY: slideAnim }],
      left: [{ translateX: slideAnim.interpolate({
        inputRange: [0, distance],
        outputRange: [0, -distance],
        extrapolate: 'clamp',
      }) }],
      right: [{ translateX: slideAnim }],
    };
    return transforms[direction] || transforms.bottom;
  }, [slideAnim, direction, distance]);

  const startAnimation = useCallback(() => {
    InteractionManager.runAfterInteractions(() => {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration,
          ...ANIMATION_CONFIG,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration,
          ...ANIMATION_CONFIG,
        }),
      ]).start();
    });
  }, [slideAnim, fadeAnim, duration]);

  useEffect(() => {
    if (delay > 0) {
      const timer = setTimeout(startAnimation, delay);
      animationPool.setTimer(componentKey, timer);
    } else {
      startAnimation();
    }

    return () => {
      animationPool.clearTimer(componentKey);
    };
  }, [delay, startAnimation, componentKey]);

  const animatedStyle = useMemo(() => ({
    opacity: fadeAnim,
    transform: getTransform,
  }), [fadeAnim, getTransform]);

  return (
    <Animated.View
      style={[style, animatedStyle]}
      {...props}
    >
      {children}
    </Animated.View>
  );
});

export const ScaleTransition = ({ 
  children, 
  duration = 300, 
  delay = 0,
  startScale = 0.8,
  endScale = 1,
  style,
  ...props 
}) => {
  const scaleAnim = useRef(new Animated.Value(startScale)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: endScale,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [scaleAnim, fadeAnim, duration, delay, startScale, endScale]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
      {...props}
    >
      {children}
    </Animated.View>
  );
};

export const StaggeredTransition = ({ 
  children, 
  staggerDelay = 100,
  baseDelay = 0,
  animationType = 'slide', // 'slide', 'fade', 'scale'
  style,
  ...props 
}) => {
  const childrenArray = React.Children.toArray(children);

  return (
    <View style={style} {...props}>
      {childrenArray.map((child, index) => {
        const delay = baseDelay + (index * staggerDelay);
        
        switch (animationType) {
          case 'fade':
            return (
              <FadeTransition key={index} delay={delay}>
                {child}
              </FadeTransition>
            );
          case 'scale':
            return (
              <ScaleTransition key={index} delay={delay}>
                {child}
              </ScaleTransition>
            );
          case 'slide':
          default:
            return (
              <SlideInTransition key={index} delay={delay}>
                {child}
              </SlideInTransition>
            );
        }
      })}
    </View>
  );
};

export const PulseTransition = memo(({
  children,
  duration = 1000,
  minOpacity = 0.5,
  maxOpacity = 1,
  style,
  ...props
}) => {
  const componentKey = useMemo(() => `pulse_${Date.now()}_${Math.random()}`, []);
  const pulseAnim = useMemo(() => animationPool.getValue(componentKey, minOpacity), [componentKey, minOpacity]);
  const animationRef = useRef(null);

  const pulse = useCallback(() => {
    if (animationRef.current) {
      animationRef.current.stop();
    }
    
    animationRef.current = Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: maxOpacity,
        duration: duration / 2,
        ...ANIMATION_CONFIG,
      }),
      Animated.timing(pulseAnim, {
        toValue: minOpacity,
        duration: duration / 2,
        ...ANIMATION_CONFIG,
      }),
    ]);
    
    animationRef.current.start(({ finished }) => {
      if (finished) {
        pulse();
      }
    });
  }, [pulseAnim, duration, minOpacity, maxOpacity]);

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      pulse();
    });

    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, [pulse]);

  const animatedStyle = useMemo(() => ({
    opacity: pulseAnim,
  }), [pulseAnim]);

  return (
    <Animated.View
      style={[style, animatedStyle]}
      {...props}
    >
      {children}
    </Animated.View>
  );
});

export const FlipTransition = ({ 
  children, 
  duration = 600, 
  delay = 0,
  style,
  ...props 
}) => {
  const flipAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(flipAnim, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      }).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [flipAnim, duration, delay]);

  const rotateY = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['90deg', '0deg', '0deg'],
  });

  const opacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  return (
    <Animated.View
      style={[
        style,
        {
          opacity,
          transform: [{ rotateY }],
        },
      ]}
      {...props}
    >
      {children}
    </Animated.View>
  );
};

export const SlideUpPanel = ({ 
  visible, 
  children, 
  onClose,
  height = height * 0.8,
  style,
  ...props 
}) => {
  const slideAnim = useRef(new Animated.Value(height)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: height,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, opacityAnim, height]);

  if (!visible && opacityAnim._value === 0) {
    return null;
  }

  return (
    <View style={styles.overlay}>
      <Animated.View
        style={[
          styles.backdrop,
          { opacity: opacityAnim },
        ]}
        onTouchEnd={onClose}
      />
      <Animated.View
        style={[
          styles.panel,
          style,
          {
            height,
            transform: [{ translateY: slideAnim }],
          },
        ]}
        {...props}
      >
        {children}
      </Animated.View>
    </View>
  );
};

export const ProgressTransition = ({ 
  progress, // 0 to 1
  children, 
  style,
  ...props 
}) => {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress, widthAnim]);

  const width = widthAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.progressContainer, style]} {...props}>
      <Animated.View style={[styles.progressBar, { width }]} />
      {children}
    </View>
  );
};

export const BounceTransition = ({ 
  children, 
  duration = 500, 
  delay = 0,
  style,
  ...props 
}) => {
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.spring(bounceAnim, {
        toValue: 1,
        tension: 100,
        friction: 3,
        useNativeDriver: true,
      }).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [bounceAnim, delay]);

  const scale = bounceAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 1.2, 1],
  });

  return (
    <Animated.View
      style={[
        style,
        {
          transform: [{ scale }],
        },
      ]}
      {...props}
    >
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  panel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#f1f5f9',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#667eea',
    borderRadius: 2,
  },
});

export default {
  FadeTransition,
  SlideInTransition,
  ScaleTransition,
  StaggeredTransition,
  PulseTransition,
  FlipTransition,
  SlideUpPanel,
  ProgressTransition,
  BounceTransition,
};
