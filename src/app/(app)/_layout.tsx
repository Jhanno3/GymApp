import { Ionicons } from '@expo/vector-icons';
import { Href, Slot, usePathname, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';

const MENU_ITEMS: {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: Href | null;
}[] = [
  { key: 'home', label: 'Inicio', icon: 'home-outline', href: '/home' },
  { key: 'routines', label: 'Rutinas', icon: 'barbell-outline', href: '/routine' },
  { key: 'classes', label: 'Clases', icon: 'calendar-outline', href: '/classes' },
  { key: 'profile', label: 'Perfil', icon: 'person-outline', href: '/profile' },
];

export default function AppLayout() {
  const router = useRouter();
  const pathname = usePathname();

  function handleMenuPress(href: Href | null) {
    if (href) {
      router.replace(href);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Slot />
      </View>

      <View style={styles.bottomBar}>
        <View style={styles.menuRow}>
          {MENU_ITEMS.slice(0, 2).map((item) => (
            <MenuItem
              key={item.key}
              label={item.label}
              icon={item.icon}
              active={pathname === item.href}
              onPress={() => handleMenuPress(item.href)}
            />
          ))}

          <View style={styles.qrSpacer} />

          {MENU_ITEMS.slice(2).map((item) => (
            <MenuItem
              key={item.key}
              label={item.label}
              icon={item.icon}
              active={pathname === item.href}
              onPress={() => handleMenuPress(item.href)}
            />
          ))}
        </View>

        <Pressable style={styles.qrButton} onPress={() => router.push('/scan')}>
          <Ionicons name="qr-code-outline" size={28} color="#FFFFFF" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function MenuItem({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
}) {
  const color = active ? Colors.primary : Colors.textMuted;

  return (
    <Pressable style={styles.menuItem} onPress={onPress}>
      <Ionicons name={icon} size={22} color={color} />
      <Text style={[styles.menuItemLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

const QR_BUTTON_SIZE = 60;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
  },
  bottomBar: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 10,
    paddingTop: 10,
  },
  menuItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  menuItemLabel: {
    fontSize: 11,
  },
  qrSpacer: {
    width: QR_BUTTON_SIZE + 16,
  },
  qrButton: {
    position: 'absolute',
    alignSelf: 'center',
    top: -QR_BUTTON_SIZE / 2,
    width: QR_BUTTON_SIZE,
    height: QR_BUTTON_SIZE,
    borderRadius: QR_BUTTON_SIZE / 2,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: Colors.background,
  },
});
