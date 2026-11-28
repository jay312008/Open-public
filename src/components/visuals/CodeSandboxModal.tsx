import React, { useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { useTheme } from '@/theme/ThemeContext';

export interface CodeSandboxProps {
  visible: boolean;
  onClose: () => void;
  initialTitle?: string;
  initialCode?: string;
  explanation?: string;
}

export const DEFAULT_PROJECTILE_CODE = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  body { margin: 0; font-family: system-ui, sans-serif; background: #F8FBFF; color: #1E293B; padding: 12px; }
  canvas { width: 100%; max-width: 460px; height: 220px; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; display: block; margin: 0 auto; }
  .ctrl { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; margin-top: 10px; font-size: 13px; font-weight: 700; }
  label { display: flex; align-items: center; gap: 6px; }
  .stats { text-align: center; margin-top: 8px; font-size: 12.5px; color: #7C3AED; font-weight: 700; }
</style>
</head>
<body>
  <canvas id="c" width="460" height="220"></canvas>
  <div class="ctrl">
    <label>Velocity v₀: <input id="v" type="range" min="15" max="50" value="32" /> <span id="vv">32</span> m/s</label>
    <label>Angle θ: <input id="a" type="range" min="15" max="80" value="45" /> <span id="av">45</span>°</label>
  </div>
  <div class="stats" id="stats"></div>
  <script>
    const canvas = document.getElementById('c');
    const ctx = canvas.getContext('2d');
    const vIn = document.getElementById('v');
    const aIn = document.getElementById('a');
    const vv = document.getElementById('vv');
    const av = document.getElementById('av');
    const stats = document.getElementById('stats');
    const g = 9.81;
    let t = 0;

    function draw() {
      const v0 = Number(vIn.value);
      const deg = Number(aIn.value);
      vv.textContent = v0;
      av.textContent = deg;
      const rad = deg * Math.PI / 180;
      const vx = v0 * Math.cos(rad);
      const vy = v0 * Math.sin(rad);
      const tFlight = (2 * vy) / g;
      const range = vx * tFlight;
      const maxH = (vy * vy) / (2 * g);
      stats.textContent = 'Range R = ' + range.toFixed(1) + ' m  ·  Max Height H = ' + maxH.toFixed(1) + ' m  ·  Flight Time = ' + tFlight.toFixed(2) + ' s';

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const ox = 30, oy = 192, scale = 1.45;
      // Ground & axes
      ctx.strokeStyle = '#94A3B8'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(ox, 16); ctx.lineTo(ox, oy); ctx.lineTo(440, oy); ctx.stroke();

      // Trajectory path
      ctx.strokeStyle = '#7C3AED'; ctx.lineWidth = 2.4; ctx.setLineDash([5, 4]);
      ctx.beginPath();
      for (let i = 0; i <= 80; i++) {
        const ti = (i / 80) * tFlight;
        const x = ox + vx * ti * scale;
        const y = oy - (vy * ti - 0.5 * g * ti * ti) * scale;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Animated projectile ball
      t += 0.04;
      if (t > tFlight) t = 0;
      const bx = ox + vx * t * scale;
      const by = oy - (vy * t - 0.5 * g * t * t) * scale;
      ctx.fillStyle = '#FF6B4A';
      ctx.beginPath(); ctx.arc(bx, by, 7, 0, Math.PI * 2); ctx.fill();
      requestAnimationFrame(draw);
    }
    draw();
  </script>
</body>
</html>`;

export function CodeSandboxModal({
  visible,
  onClose,
  initialTitle = 'Interactive Code Visualization Sandbox',
  initialCode = DEFAULT_PROJECTILE_CODE,
  explanation = 'Edit parameters or code below and tap Run. Execution is strictly isolated inside a sandboxed iframe with zero access to app credentials or storage.',
}: CodeSandboxProps) {
  const { colors, isDark } = useTheme();
  const [tab, setTab] = useState<'preview' | 'code' | 'explain'>('preview');
  const [code, setCode] = useState(initialCode);
  const [runCode, setRunCode] = useState(initialCode);
  const [runKey, setRunKey] = useState(1);

  const lineCount = useMemo(() => code.split('\n').length, [code]);

  const handleRun = () => {
    setRunCode(code);
    setRunKey((k) => k + 1);
    setTab('preview');
  };

  const handleReset = () => {
    setCode(initialCode);
    setRunCode(initialCode);
    setRunKey((k) => k + 1);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <AnimatedPressable onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={colors.text} />
          </AnimatedPressable>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
              {initialTitle}
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 11.5, fontWeight: '600' }}>
              Isolated Sandbox · {lineCount} lines
            </Text>
          </View>
          <AnimatedPressable onPress={handleReset} style={[styles.actionPill, { backgroundColor: colors.surfaceMuted }]}>
            <Ionicons name="refresh" size={14} color={colors.text} />
          </AnimatedPressable>
          <AnimatedPressable onPress={handleRun} style={[styles.actionPill, { backgroundColor: colors.coral }]}>
            <Ionicons name="play" size={14} color="#FFFFFF" />
            <Text style={{ color: '#FFFFFF', fontSize: 12.5, fontWeight: '800' }}>Run</Text>
          </AnimatedPressable>
        </View>

        {/* Sub-tabs: Live Preview | Code Editor | Explanation */}
        <View style={[styles.tabsRow, { borderBottomColor: colors.border }]}>
          {[
            { id: 'preview' as const, label: 'Live Preview', icon: 'eye-outline' as const },
            { id: 'code' as const, label: 'Code Editor', icon: 'code-slash-outline' as const },
            { id: 'explain' as const, label: 'Explanation', icon: 'book-outline' as const },
          ].map((t) => {
            const active = tab === t.id;
            return (
              <AnimatedPressable
                key={t.id}
                onPress={() => setTab(t.id)}
                style={[styles.tabBtn, active && { borderBottomColor: colors.coral, borderBottomWidth: 2.5 }]}
              >
                <Ionicons name={t.icon} size={15} color={active ? colors.coral : colors.textMuted} />
                <Text style={{ color: active ? colors.text : colors.textMuted, fontWeight: active ? '800' : '600', fontSize: 13 }}>
                  {t.label}
                </Text>
              </AnimatedPressable>
            );
          })}
        </View>

        {tab === 'preview' && (
          <View style={{ flex: 1, padding: 14 }}>
            {Platform.OS === 'web' ? (
              <View style={[styles.iframeBox, { borderColor: colors.border }]}>
                {/* Strictly sandboxed iframe: allow-scripts ONLY (no allow-same-origin, no cookies, no parent DOM access!) */}
                {React.createElement('iframe', {
                  key: runKey,
                  title: initialTitle,
                  sandbox: 'allow-scripts',
                  srcDoc: runCode,
                  style: {
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    borderRadius: 14,
                    backgroundColor: '#FFFFFF',
                  },
                })}
              </View>
            ) : (
              <View style={[styles.nativeNotice, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="shield-checkmark-outline" size={28} color={colors.purple} />
                <Text style={{ color: colors.text, fontWeight: '800', fontSize: 15, textAlign: 'center' }}>
                  Sandboxed HTML/Canvas Execution
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 13.5, textAlign: 'center', lineHeight: 20 }}>
                  Live HTML5 Canvas code execution runs inside the isolated browser sandbox on web. Switch to the Code Editor tab to inspect and edit the full simulation code.
                </Text>
              </View>
            )}
          </View>
        )}

        {tab === 'code' && (
          <ScrollView style={{ flex: 1, padding: 12 }}>
            <TextInput
              value={code}
              onChangeText={setCode}
              multiline
              autoCapitalize="none"
              autoCorrect={false}
              style={[
                styles.codeInput,
                {
                  backgroundColor: isDark ? '#0F1714' : '#1E293B',
                  color: '#E2E8F0',
                  borderColor: colors.border,
                },
              ]}
            />
          </ScrollView>
        )}

        {tab === 'explain' && (
          <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
            <View style={[styles.explainCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '900' }}>
                How This Simulation Works
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 14.5, lineHeight: 22 }}>
                {explanation}
              </Text>
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  closeBtn: { padding: 4 },
  headerTitle: { fontSize: 15, fontWeight: '800' },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
  },
  iframeBox: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
    minHeight: 340,
  },
  nativeNotice: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 10,
  },
  codeInput: {
    minHeight: 420,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12.5,
    lineHeight: 19,
    textAlignVertical: 'top',
  },
  explainCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
});
