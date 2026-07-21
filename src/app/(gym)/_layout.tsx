import { Ionicons } from '@expo/vector-icons';
import { Href, Slot, usePathname, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';

const MENU_ITEMS: {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: Href;
}[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'grid-outline', href: '/dashboard' },
  { key: 'routines', label: 'Rutinas', icon: 'barbell-outline', href: '/routines' },
  { key: 'profile', label: 'Perfil', icon: 'person-outline', href: '/gym-profile' },
];

export default function GymLayout() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Slot />
      </View>

      <View style={styles.bottomBar}>
        <View style={styles.menuRow}>
          {MENU_ITEMS.map((item) => (
            <MenuItem
              key={item.key}
              label={item.label}
              icon={item.icon}
              active={pathname === item.href}
              onPress={() => router.replace(item.href)}
            />
          ))}
        </View>
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
});
