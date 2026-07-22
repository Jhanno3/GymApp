import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleProp, StyleSheet, TextInput, TextInputProps, TextStyle, View } from 'react-native';

import { Colors } from '@/constants/theme';

type PasswordInputProps = Omit<TextInputProps, 'secureTextEntry'> & {
  inputStyle?: StyleProp<TextStyle>;
};

export function PasswordInput({ inputStyle, ...props }: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <View style={styles.wrapper}>
      <TextInput
        style={[inputStyle, styles.input]}
        placeholderTextColor={Colors.textMuted}
        secureTextEntry={!isVisible}
        {...props}
      />
      <Pressable
        style={styles.toggle}
        onPress={() => setIsVisible((visible) => !visible)}
        hitSlop={8}>
        <Ionicons
          name={isVisible ? 'eye-off-outline' : 'eye-outline'}
          size={20}
          color={Colors.textMuted}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    justifyContent: 'center',
  },
  input: {
    paddingRight: 44,
  },
  toggle: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
