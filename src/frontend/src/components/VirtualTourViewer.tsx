import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { IconButton, Text, Button } from 'react-native-paper';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { WebView } from 'react-native-webview';

interface VirtualTourViewerProps {
  visible: boolean;
  tourUrl: string;
  onClose: () => void;
  title?: string;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const VirtualTourViewer: React.FC<VirtualTourViewerProps> = ({
  visible,
  tourUrl,
  onClose,
  title = 'Virtual Tour',
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<Video>(null);

  const isVideoUrl = (url: string) => {
    return /\.(mp4|webm|ogg|mov)$/i.test(url);
  };

  const is360Url = (url: string) => {
    return url.includes('youtube.com') || url.includes('youtu.be') || 
           url.includes('vimeo.com') || url.includes('kuula.co') ||
           url.includes('matterport.com') || url.includes('panoraven.com');
  };

  const handlePlayPause = async () => {
    if (videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVideoStatus = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setIsPlaying(status.isPlaying);
      setIsLoading(false);
    }
  };

  const renderVideoPlayer = () => (
    <View style={styles.videoContainer}>
      <Video
        ref={videoRef}
        source={{ uri: tourUrl }}
        style={styles.video}
        resizeMode={ResizeMode.CONTAIN}
        useNativeControls
        onPlaybackStatusUpdate={handleVideoStatus}
        onLoad={() => setIsLoading(false)}
        onError={(err) => {
          console.error('Video error:', err);
          setError('Failed to load video');
          setIsLoading(false);
        }}
      />
      
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading virtual tour...</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorText}>{error}</Text>
          <Button mode="contained" onPress={onClose}>
            Close
          </Button>
        </View>
      )}
    </View>
  );

  const render360Viewer = () => (
    <View style={styles.webViewContainer}>
      <WebView
        source={{ uri: tourUrl }}
        style={styles.webView}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView error:', nativeEvent);
          setError('Failed to load 360° tour');
          setIsLoading(false);
        }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsFullscreenVideo={true}
        mediaPlaybackRequiresUserAction={false}
      />
      
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading 360° tour...</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorText}>{error}</Text>
          <Button mode="contained" onPress={onClose}>
            Close
          </Button>
        </View>
      )}
    </View>
  );

  const renderContent = () => {
    if (!tourUrl) {
      return (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorText}>No tour URL provided</Text>
          <Button mode="contained" onPress={onClose}>
            Close
          </Button>
        </View>
      );
    }

    if (isVideoUrl(tourUrl)) {
      return renderVideoPlayer();
    } else if (is360Url(tourUrl)) {
      return render360Viewer();
    } else {
      // Fallback to WebView for other URLs
      return render360Viewer();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <IconButton
            icon="close"
            size={24}
            onPress={onClose}
            iconColor="#fff"
          />
        </View>

        {/* Content */}
        {renderContent()}

        {/* Controls */}
        <View style={styles.controls}>
          <Text style={styles.controlsText}>
            {isVideoUrl(tourUrl) 
              ? 'Use player controls to navigate the video'
              : 'Swipe or drag to explore the 360° view'}
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
  },
  webViewContainer: {
    flex: 1,
  },
  webView: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    padding: 20,
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  controls: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  controlsText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default VirtualTourViewer;

