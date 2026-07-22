import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { buildYouTubeEmbedHtml } from '@/lib/youtube';

export function YouTubePlayerModal({
  videoId,
  onClose,
}: {
  videoId: string | null;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={!!videoId}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={onClose}>
      <View style={styles.fullscreenPlayer}>
        {videoId && (
          <WebView
            source={{ html: buildYouTubeEmbedHtml(videoId), baseUrl: 'https://gymapp.app' }}
            style={styles.player}
            allowsFullscreenVideo
            mediaPlaybackRequiresUserAction={false}
          />
        )}

        <Pressable style={[styles.closeFab, { top: insets.top + 12 }]} onPress={onClose}>
          <Ionicons name="close" size={22} color="#FFFFFF" />
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fullscreenPlayer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  player: {
    flex: 1,
    backgroundColor: '#000000',
  },
  closeFab: {
    position: 'absolute',
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
});
