/** Core UI building blocks. All text goes through <Txt> so the Sinhala font is always applied. */
import { useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius, shadow, space, type, themed, themedValue } from '../theme';
import { errorMessage, useI18n } from '../lib/i18n';

export function Txt({ variant = 'body', weight = 'regular', color = colors.ink, style, children, ...rest }) {
  return (
    <Text style={[type[variant], { fontFamily: fonts[weight], color }, style]} {...rest}>
      {children}
    </Text>
  );
}

export function Screen({ children, scroll = true, refreshing, onRefresh, padded = true, edges = [], style, contentStyle }) {
  const pad = padded ? { padding: space.lg, paddingBottom: space.xxl * 2 } : null;
  return (
    <SafeAreaView edges={edges} style={[styles.screen, style]}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[pad, contentStyle]}
          keyboardShouldPersistTaps="handled"
          refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} colors={[colors.primary]} /> : undefined}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, pad, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function Button({ title, onPress, variant = 'primary', icon, loading, disabled, style, compact }) {
  const v = buttonVariants()[variant];
  const off = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: off }}
      onPress={off ? undefined : onPress}
      style={({ pressed }) => [
        styles.button,
        compact && styles.buttonCompact,
        { backgroundColor: v.bg, borderColor: v.border },
        pressed && !off && { opacity: 0.85 },
        off && { opacity: 0.55 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={compact ? 18 : 20} color={v.fg} /> : null}
          <Txt variant={compact ? 'body' : 'bodyLg'} weight="semibold" color={v.fg} style={{ textAlign: 'center' }}>
            {title}
          </Txt>
        </>
      )}
    </Pressable>
  );
}

const buttonVariants = themedValue(() => ({
  primary: { bg: colors.primary, fg: colors.onPrimary, border: colors.primary },
  secondary: { bg: colors.surface, fg: colors.primary, border: colors.primary },
  soil: { bg: colors.soil, fg: colors.onSoil, border: colors.soil },
  ghost: { bg: 'transparent', fg: colors.primary, border: 'transparent' },
  danger: { bg: colors.surface, fg: colors.danger, border: colors.danger },
  dangerSolid: { bg: colors.danger, fg: colors.onDanger, border: colors.danger },
}));

export function Card({ children, style, onPress, padded = true }) {
  const content = <View style={[styles.card, padded && { padding: space.lg }, style]}>{children}</View>;
  if (!onPress) return content;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.9 }}>
      {content}
    </Pressable>
  );
}

export function Field({ label, hint, error, style, inputStyle, multiline, ...rest }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[{ marginBottom: space.lg }, style]}>
      {label ? (
        <Txt weight="medium" style={{ marginBottom: space.xs }}>
          {label}
        </Txt>
      ) : null}
      <TextInput
        placeholderTextColor={colors.muted}
        multiline={multiline}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          styles.input,
          multiline && { minHeight: 110, textAlignVertical: 'top', paddingTop: space.md },
          focused && { borderColor: colors.primary, borderWidth: 2 },
          error && { borderColor: colors.danger },
          inputStyle,
        ]}
        {...rest}
      />
      {error ? (
        <Txt variant="caption" color={colors.danger} style={{ marginTop: space.xs }}>
          {error}
        </Txt>
      ) : hint ? (
        <Txt variant="caption" color={colors.muted} style={{ marginTop: space.xs }}>
          {hint}
        </Txt>
      ) : null}
    </View>
  );
}

export function Chip({ label, selected, onPress, icon, tone = 'primary' }) {
  const fg = tone === 'soil' ? colors.soil : colors.primary;
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: !!selected }}
      onPress={onPress}
      style={[
        styles.chip,
        { borderColor: selected ? fg : colors.line, backgroundColor: selected ? (tone === 'soil' ? colors.soilSoft : colors.primarySoft) : colors.surface },
      ]}
    >
      {selected ? <Ionicons name="checkmark" size={16} color={fg} /> : icon ? <Ionicons name={icon} size={16} color={colors.inkSoft} /> : null}
      <Txt weight={selected ? 'semibold' : 'regular'} color={selected ? fg : colors.ink}>
        {label}
      </Txt>
    </Pressable>
  );
}

export function SectionTitle({ title, action, onAction, style }) {
  return (
    <View style={[styles.sectionTitle, style]}>
      <Txt variant="title" weight="bold" style={{ flex: 1 }}>
        {title}
      </Txt>
      {action ? (
        <Pressable onPress={onAction} hitSlop={10} accessibilityRole="button">
          <Txt weight="semibold" color={colors.primary}>
            {action}
          </Txt>
        </Pressable>
      ) : null}
    </View>
  );
}

export function InfoRow({ icon, label, value, children, last }) {
  return (
    <View style={[styles.infoRow, !last && styles.infoRowLine]}>
      {icon ? (
        <View style={styles.infoIcon}>
          <Ionicons name={icon} size={20} color={colors.primary} />
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        {value != null || children ? (
          <Txt variant="caption" color={colors.muted}>
            {label}
          </Txt>
        ) : (
          <Txt weight="medium">{label}</Txt>
        )}
        {value != null && value !== '' ? <Txt>{value}</Txt> : null}
        {children}
      </View>
    </View>
  );
}

const toneMap = themedValue(() => ({
  info: { bg: colors.infoSoft, fg: colors.info, icon: 'information-circle' },
  warn: { bg: colors.pendingSoft, fg: colors.pending, icon: 'alert-circle' },
  danger: { bg: colors.dangerSoft, fg: colors.danger, icon: 'close-circle' },
  success: { bg: colors.verifiedSoft, fg: colors.verified, icon: 'checkmark-circle' },
  soil: { bg: colors.soilSoft, fg: colors.soil, icon: 'leaf' },
}));

export function Banner({ tone = 'info', title, text, icon, style, children }) {
  const m = toneMap()[tone];
  return (
    <View style={[styles.banner, { backgroundColor: m.bg }, style]} accessibilityRole="summary">
      <Ionicons name={icon || m.icon} size={22} color={m.fg} style={{ marginTop: 2 }} />
      <View style={{ flex: 1 }}>
        {title ? (
          <Txt weight="bold" color={m.fg}>
            {title}
          </Txt>
        ) : null}
        {text ? <Txt color={colors.ink}>{text}</Txt> : null}
        {children}
      </View>
    </View>
  );
}

export function Loading({ label }) {
  const { t } = useI18n();
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Txt color={colors.inkSoft} style={{ marginTop: space.md, textAlign: 'center' }}>
        {label || t('loading')}
      </Txt>
    </View>
  );
}

export function ErrorView({ error, onRetry }) {
  const { t } = useI18n();
  return (
    <View style={styles.center}>
      <Ionicons name="cloud-offline-outline" size={48} color={colors.muted} />
      <Txt style={{ textAlign: 'center', marginVertical: space.md }}>{errorMessage(error, t)}</Txt>
      {onRetry ? <Button title={t('retry')} onPress={onRetry} variant="secondary" icon="refresh" /> : null}
    </View>
  );
}

export function Empty({ icon = 'leaf-outline', text, actionTitle, onAction }) {
  return (
    <View style={[styles.center, { paddingVertical: space.xxl }]}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={36} color={colors.primary} />
      </View>
      <Txt color={colors.inkSoft} style={{ textAlign: 'center', marginVertical: space.lg, maxWidth: 320 }}>
        {text}
      </Txt>
      {actionTitle ? <Button title={actionTitle} onPress={onAction} icon="add" /> : null}
    </View>
  );
}

/** Simple, large-target picker in a bottom sheet. options: [{ value, label, sublabel }] */
export function Select({ label, value, options, onChange, placeholder, style, emptyText }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  return (
    <View style={[{ marginBottom: space.lg }, style]}>
      {label ? (
        <Txt weight="medium" style={{ marginBottom: space.xs }}>
          {label}
        </Txt>
      ) : null}
      <Pressable accessibilityRole="button" onPress={() => setOpen(true)} style={[styles.input, styles.selectBox]}>
        <Txt color={selected ? colors.ink : colors.muted} style={{ flex: 1 }} numberOfLines={1}>
          {selected ? selected.label : placeholder}
        </Txt>
        <Ionicons name="chevron-down" size={20} color={colors.inkSoft} />
      </Pressable>
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setOpen(false)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Txt variant="title" weight="bold" style={{ marginBottom: space.md }}>
            {label || placeholder}
          </Txt>
          <FlatList
            data={options}
            keyExtractor={(o) => String(o.value)}
            ListEmptyComponent={
              <Txt color={colors.inkSoft} style={{ paddingVertical: space.lg }}>
                {emptyText || '—'}
              </Txt>
            }
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  onChange(item.value);
                  setOpen(false);
                }}
                style={styles.sheetItem}
              >
                <View style={{ flex: 1 }}>
                  <Txt weight={item.value === value ? 'bold' : 'regular'}>{item.label}</Txt>
                  {item.sublabel ? (
                    <Txt variant="caption" color={colors.muted}>
                      {item.sublabel}
                    </Txt>
                  ) : null}
                </View>
                {item.value === value ? <Ionicons name="checkmark-circle" size={22} color={colors.primary} /> : null}
              </Pressable>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

export function Toggle({ label, value, onChange, hint }) {
  return (
    <Pressable accessibilityRole="switch" accessibilityState={{ checked: !!value }} onPress={() => onChange(!value)} style={styles.toggleRow}>
      <View style={{ flex: 1 }}>
        <Txt>{label}</Txt>
        {hint ? (
          <Txt variant="caption" color={colors.muted}>
            {hint}
          </Txt>
        ) : null}
      </View>
      <View style={[styles.toggleTrack, value && { backgroundColor: colors.primary }]}>
        <View style={[styles.toggleThumb, value && { transform: [{ translateX: 20 }] }]} />
      </View>
    </Pressable>
  );
}

export function Stat({ value, label, tone = 'primary', icon, onPress }) {
  const fg = { primary: colors.primary, warn: colors.pending, danger: colors.danger, soil: colors.soil }[tone];
  // The sizing must sit on the outermost element (the Pressable when tappable) so the grid stays even.
  const layout = { flexGrow: 1, flexBasis: '45%', minWidth: 140 };
  const body = (
    <Card style={{ flexGrow: 1 }}>
      {icon ? <Ionicons name={icon} size={22} color={fg} /> : null}
      <Txt variant="heading" weight="bold" color={fg}>
        {value ?? '–'}
      </Txt>
      <Txt variant="caption" color={colors.inkSoft}>
        {label}
      </Txt>
    </Card>
  );
  if (!onPress) return <View style={layout}>{body}</View>;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [layout, pressed && { opacity: 0.9 }]}>
      {body}
    </Pressable>
  );
}

export function Bullets({ items, icon = 'ellipse', color = colors.primary }) {
  if (!items?.length) return null;
  return (
    <View style={{ gap: space.sm }}>
      {items.map((it, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: space.sm }}>
          <Ionicons name={icon} size={icon === 'ellipse' ? 8 : 18} color={color} style={{ marginTop: icon === 'ellipse' ? 9 : 3 }} />
          <Txt style={{ flex: 1 }}>{it}</Txt>
        </View>
      ))}
    </View>
  );
}

export const styles = themed(() => ({
  screen: { flex: 1, backgroundColor: colors.bg },
  button: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1.5,
    paddingHorizontal: space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  buttonCompact: { minHeight: 42, paddingHorizontal: space.md },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, ...shadow },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: space.md,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.ink,
    outlineStyle: 'none', // web: focus ring is drawn by the component (thicker green border)
  },
  selectBox: { flexDirection: 'row', alignItems: 'center' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    minHeight: 40,
  },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', marginTop: space.xl, marginBottom: space.md },
  infoRow: { flexDirection: 'row', gap: space.md, paddingVertical: space.md },
  infoRowLine: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  banner: { flexDirection: 'row', gap: space.md, padding: space.lg, borderRadius: radius.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetBackdrop: { flex: 1, backgroundColor: colors.backdrop },
  sheet: {
    maxHeight: '75%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: space.lg,
    paddingBottom: space.xxl,
  },
  sheetHandle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: colors.line, marginBottom: space.md },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 54,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  toggleRow: { flexDirection: 'row', alignItems: 'center', minHeight: 56, gap: space.md },
  toggleTrack: { width: 48, height: 28, borderRadius: 14, backgroundColor: colors.line, padding: 4 },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.white },
}));
