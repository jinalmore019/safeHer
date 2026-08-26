// SafeHer UI Components

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
  TouchableOpacityProps,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadows, Layout } from '../design/tokens';

// ─── Button ──────────────────────────────────────────────────────────────────
interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = true,
  style,
  disabled,
  ...props
}: ButtonProps) {
  const btnStyle = [
    styles.btn,
    styles[`btn_${variant}`],
    styles[`btn_size_${size}`],
    fullWidth && styles.btn_full,
    (disabled || loading) && styles.btn_disabled,
    style,
  ];

  const textStyle = [
    styles.btnText,
    styles[`btnText_${variant}`],
    styles[`btnText_size_${size}`],
  ];

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      disabled={disabled || loading}
      style={btnStyle}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'ghost' ? Colors.brand.primary : '#fff'}
          size="small"
        />
      ) : (
        <Text style={textStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

// ─── Input ───────────────────────────────────────────────────────────────────
interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  containerStyle,
  style,
  ...props
}: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.inputWrapper, containerStyle]}>
      {label ? <Text style={styles.inputLabel}>{label}</Text> : null}
      <View
        style={[
          styles.inputContainer,
          focused && styles.inputFocused,
          error ? styles.inputError : null,
        ]}
      >
        {leftIcon ? <View style={styles.inputIcon}>{leftIcon}</View> : null}
        <TextInput
          style={[styles.input, leftIcon ? styles.inputWithLeft : null, style]}
          placeholderTextColor={Colors.ui.placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        {rightIcon ? <View style={styles.inputIcon}>{rightIcon}</View> : null}
      </View>
      {error ? <Text style={styles.inputErrorText}>{error}</Text> : null}
    </View>
  );
}

// ─── Card ────────────────────────────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
}

export function Card({ children, style, elevated = false }: CardProps) {
  return (
    <View style={[styles.card, elevated && styles.cardElevated, style]}>
      {children}
    </View>
  );
}

// ─── Screen Container ─────────────────────────────────────────────────────────
interface ScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padded?: boolean;
}

export function Screen({ children, style, padded = true }: ScreenProps) {
  return (
    <View style={[styles.screen, padded && styles.screenPadded, style]}>
      {children}
    </View>
  );
}

// ─── Typography ───────────────────────────────────────────────────────────────
export function Heading({
  children,
  style,
  level = 1,
}: {
  children: React.ReactNode;
  style?: TextStyle;
  level?: 1 | 2 | 3;
}) {
  const sizes = {
    1: Typography.sizes.xxl,
    2: Typography.sizes.xl,
    3: Typography.sizes.lg,
  };
  return (
    <Text
      style={[
        styles.heading,
        { fontSize: sizes[level] },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function Body({
  children,
  style,
  muted = false,
}: {
  children: React.ReactNode;
  style?: TextStyle;
  muted?: boolean;
}) {
  return (
    <Text style={[styles.body, muted && styles.bodyMuted, style]}>
      {children}
    </Text>
  );
}

// ─── Divider ─────────────────────────────────────────────────────────────────
export function Divider({ style }: { style?: ViewStyle }) {
  return <View style={[styles.divider, style]} />;
}

// ─── Badge ───────────────────────────────────────────────────────────────────
export function Badge({
  label,
  color = Colors.status.safe,
}: {
  label: string;
  color?: string;
}) {
  return (
    <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color + '55' }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Buttons
  btn: {
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  btn_full: { width: '100%' },
  btn_primary: {
    backgroundColor: Colors.brand.primary,
    ...Shadows.lg,
  },
  btn_secondary: { backgroundColor: Colors.brand.secondary },
  btn_outline: {
    borderWidth: 1.5,
    borderColor: Colors.brand.primary,
    backgroundColor: 'transparent',
  },
  btn_ghost: { backgroundColor: 'transparent' },
  btn_danger: { backgroundColor: Colors.status.danger, ...Shadows.lg },
  btn_disabled: { opacity: 0.5 },
  btn_size_sm: { height: 38, paddingHorizontal: Spacing.md },
  btn_size_md: { height: Layout.buttonHeight, paddingHorizontal: Spacing.lg },
  btn_size_lg: { height: 58, paddingHorizontal: Spacing.xl },

  btnText: { fontWeight: Typography.weights.bold, letterSpacing: 0.3 },
  btnText_primary: { color: '#fff' },
  btnText_secondary: { color: '#fff' },
  btnText_outline: { color: Colors.brand.primary },
  btnText_ghost: { color: Colors.brand.primary },
  btnText_danger: { color: '#fff' },
  btnText_size_sm: { fontSize: Typography.sizes.sm },
  btnText_size_md: { fontSize: Typography.sizes.base },
  btnText_size_lg: { fontSize: Typography.sizes.md },

  // Inputs
  inputWrapper: { marginBottom: Spacing.md },
  inputLabel: {
    color: Colors.text.secondary,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    marginBottom: Spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.ui.inputBg,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.ui.border,
    height: Layout.inputHeight,
    paddingHorizontal: Spacing.base,
  },
  inputFocused: { borderColor: Colors.brand.primary },
  inputError: { borderColor: Colors.status.danger },
  input: {
    flex: 1,
    color: Colors.text.primary,
    fontSize: Typography.sizes.base,
    height: '100%',
  },
  inputWithLeft: { marginLeft: Spacing.sm },
  inputIcon: { marginHorizontal: Spacing.xs },
  inputErrorText: {
    color: Colors.status.danger,
    fontSize: Typography.sizes.xs,
    marginTop: Spacing.xs,
  },

  // Card
  card: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.ui.border,
  },
  cardElevated: { ...Shadows.md },

  // Screen
  screen: {
    flex: 1,
    backgroundColor: Colors.bg.primary,
  },
  screenPadded: {
    paddingHorizontal: Layout.screenPaddingH,
  },

  // Typography
  heading: {
    color: Colors.text.primary,
    fontWeight: Typography.weights.bold,
    letterSpacing: -0.5,
  },
  body: {
    color: Colors.text.primary,
    fontSize: Typography.sizes.base,
    lineHeight: Typography.sizes.base * 1.5,
  },
  bodyMuted: { color: Colors.text.secondary },

  // Divider
  divider: {
    height: 1,
    backgroundColor: Colors.ui.divider,
    marginVertical: Spacing.md,
  },

  // Badge
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
  },
});
