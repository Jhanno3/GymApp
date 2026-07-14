import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/theme';

type Props = {
  ready: boolean;
};

export function AppSplashScreen({ ready }: Props) {
  return (
    <View style={styles.container}>
      <Image
        source={ready ? require('@/assets/images/Cat02.png') : require('@/assets/images/Cat01.png')}
        style={styles.logo}
        contentFit="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  logo: {
    width: 220,
    height: 250,
  },
});
