import React, { useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';

const { width, height } = Dimensions.get('window');

export const FadeTransition = ({ 
  children, 
  duration = 300, 
  delay = 0,
  style,
  ...props 
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      }).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [fadeAnim, duration, delay]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: fadeAnim,
        },
      ]}
      {...props}
    >
      {children}
    </Animated.View>
  );
};

export const SlideInTransition = ({ 
  children, 
  direction = 'bottom', // 'bottom', 'top', 'left', 'right'
  duration = 300, 
  delay = 0,
  distance = 50,
  style,
  ...props 
}) => {
  const slideAnim = useRef(new Animated.Value(distance)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration,
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
  }, [slideAnim, fadeAnim, duration, delay, distance]);

  const getTransform = () => {
    switch (direction) {
      case 'top':
        return [{ translateY: slideAnim.interpolate({
          inputRange: [0, distance],
          outputRange: [0, -distance],
        }) }];
      case 'bottom':
        return [{ translateY: slideAnim }];
      case 'left':
        return [{ translateX: slideAnim.interpolate({
          inputRange: [0, distance],
          outputRange: [0, -distance],
        }) }];
      case 'right':
        return [{ translateX: slideAnim }];
      default:
        return [{ translateY: slideAnim }];
    }
  };

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: fadeAnim,
          transform: getTransform(),
        },
      ]}
      {...props}
    >
      {children}
    </Animated.View>
  );
};

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

export const PulseTransition = ({ 
  children, 
  duration = 1000,
  minOpacity = 0.5,
  maxOpacity = 1,
  style,
  ...props 
}) => {
  const pulseAnim = useRef(new Animated.Value(minOpacity)).current;

  useEffect(() => {
    const pulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: maxOpacity,
          duration: duration / 2,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: minOpacity,
          duration: duration / 2,
          useNativeDriver: true,
        }),
      ]).start(() => pulse());
    };

    pulse();
  }, [pulseAnim, duration, minOpacity, maxOpacity]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: pulseAnim,
        },
      ]}
      {...props}
    >
      {children}
    </Animated.View>
  );
};

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
