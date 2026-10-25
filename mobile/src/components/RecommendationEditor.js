/** Structured editor used by instructors to modify (or write) a recommendation. */
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '../lib/i18n';
import { splitLines } from '../lib/format';
import { Button, Card, Chip, Field, Txt } from './ui';
import { colors, space } from '../theme';

export function contentToDraft(c = {}) {
  return {
    summary: c.summary || '',
    possibleCauses: (c.possibleCauses || []).map((x) => ({ ...x })),
    suggestedActions: (c.suggestedActions || []).map((x) => ({ ...x })),
    fertilizerAdvice: c.fertilizerAdvice || '',
    requiredMaterials: (c.requiredMaterials || []).join('\n'),
    preventionMethods: (c.preventionMethods || []).join('\n'),
    furtherChecks: (c.furtherChecks || []).join('\n'),
    additionalInfoNeeded: (c.additionalInfoNeeded || []).join('\n'),
    safetyPrecautions: (c.safetyPrecautions || []).join('\n'),
    urgency: c.urgency || 'medium',
    confidenceLevel: c.confidence?.level || 'medium',
    confidenceExplanation: c.confidence?.explanation || '',
    language: c.language || 'si',
  };
}

export function draftToContent(d) {
  return {
    summary: d.summary.trim(),
    possibleCauses: d.possibleCauses.filter((c) => c.name?.trim()).map((c) => ({ ...c, name: c.name.trim(), evidence: (c.evidence || '').trim() })),
    suggestedActions: d.suggestedActions.filter((a) => a.action?.trim()).map((a) => ({ ...a, action: a.action.trim() })),
    fertilizerAdvice: d.fertilizerAdvice.trim(),
    requiredMaterials: splitLines(d.requiredMaterials),
    preventionMethods: splitLines(d.preventionMethods),
    furtherChecks: splitLines(d.furtherChecks),
    additionalInfoNeeded: splitLines(d.additionalInfoNeeded),
    safetyPrecautions: splitLines(d.safetyPrecautions),
    urgency: d.urgency,
    confidence: { level: d.confidenceLevel, explanation: d.confidenceExplanation.trim() },
    language: d.language,
  };
}

function Choice({ options, value, onChange, prefix }) {
  const { t } = useI18n();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginBottom: space.md }}>
      {options.map((o) => (
        <Chip key={o} label={t(`${prefix}${o}`)} selected={value === o} onPress={() => onChange(o)} />
      ))}
    </View>
  );
}

function RemoveButton({ onPress }) {
  const { t } = useI18n();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={t('delete')} hitSlop={8} style={{ alignSelf: 'flex-end', padding: 4 }}>
      <Ionicons name="trash-outline" size={20} color={colors.danger} />
    </Pressable>
  );
}

export function RecommendationEditor({ draft, onChange }) {
  const { t } = useI18n();
  const set = (k) => (v) => onChange({ ...draft, [k]: v });
  const setItem = (k, i, patch) => onChange({ ...draft, [k]: draft[k].map((x, j) => (j === i ? { ...x, ...patch } : x)) });
  const removeItem = (k, i) => onChange({ ...draft, [k]: draft[k].filter((_, j) => j !== i) });

  return (
    <View>
      <Field label={t('summary')} value={draft.summary} onChangeText={set('summary')} multiline />

      <Txt variant="bodyLg" weight="bold" style={{ marginBottom: space.sm }}>
        {t('possibleCauses')}
      </Txt>
      {draft.possibleCauses.map((c, i) => (
        <Card key={i} style={{ marginBottom: space.md, backgroundColor: colors.bg }}>
          <RemoveButton onPress={() => removeItem('possibleCauses', i)} />
          <Field label={t('name')} value={c.name} onChangeText={(v) => setItem('possibleCauses', i, { name: v })} />
          <Choice
            options={['high', 'medium', 'low']}
            prefix="likelihood_"
            value={c.likelihood}
            onChange={(v) => setItem('possibleCauses', i, { likelihood: v })}
          />
          <Field
            label={t('evidence')}
            value={c.evidence}
            onChangeText={(v) => setItem('possibleCauses', i, { evidence: v })}
            multiline
            style={{ marginBottom: 0 }}
          />
        </Card>
      ))}
      <Button
        title={t('add')}
        icon="add"
        variant="ghost"
        compact
        onPress={() => onChange({ ...draft, possibleCauses: [...draft.possibleCauses, { name: '', type: 'disease', likelihood: 'medium', evidence: '' }] })}
        style={{ alignSelf: 'flex-start', marginBottom: space.lg }}
      />

      <Txt variant="bodyLg" weight="bold" style={{ marginBottom: space.sm }}>
        {t('suggestedActions')}
      </Txt>
      {draft.suggestedActions.map((a, i) => (
        <Card key={i} style={{ marginBottom: space.md, backgroundColor: colors.bg }}>
          <RemoveButton onPress={() => removeItem('suggestedActions', i)} />
          <Field value={a.action} onChangeText={(v) => setItem('suggestedActions', i, { action: v })} multiline style={{ marginBottom: space.sm }} />
          <Choice
            options={['immediate', 'soon', 'routine']}
            prefix="priority_"
            value={a.priority}
            onChange={(v) => setItem('suggestedActions', i, { priority: v })}
          />
        </Card>
      ))}
      <Button
        title={t('add')}
        icon="add"
        variant="ghost"
        compact
        onPress={() => onChange({ ...draft, suggestedActions: [...draft.suggestedActions, { action: '', priority: 'soon' }] })}
        style={{ alignSelf: 'flex-start', marginBottom: space.lg }}
      />

      <Field label={t('fertilizerAdvice')} value={draft.fertilizerAdvice} onChangeText={set('fertilizerAdvice')} multiline />
      <Field label={t('requiredMaterials')} hint={t('onePerLine')} value={draft.requiredMaterials} onChangeText={set('requiredMaterials')} multiline />
      <Field label={t('preventionMethods')} hint={t('onePerLine')} value={draft.preventionMethods} onChangeText={set('preventionMethods')} multiline />
      <Field label={t('furtherChecks')} hint={t('onePerLine')} value={draft.furtherChecks} onChangeText={set('furtherChecks')} multiline />
      <Field label={t('additionalInfoNeeded')} hint={t('onePerLine')} value={draft.additionalInfoNeeded} onChangeText={set('additionalInfoNeeded')} multiline />
      <Field label={t('safetyPrecautions')} hint={t('onePerLine')} value={draft.safetyPrecautions} onChangeText={set('safetyPrecautions')} multiline />

      <Txt weight="bold" style={{ marginBottom: space.sm }}>
        {t('urgency')}
      </Txt>
      <Choice options={['low', 'medium', 'high', 'critical']} prefix="urgency_" value={draft.urgency} onChange={set('urgency')} />
      <Txt weight="bold" style={{ marginBottom: space.sm }}>
        {t('confidence')}
      </Txt>
      <Choice options={['low', 'medium', 'high']} prefix="confidence_" value={draft.confidenceLevel} onChange={set('confidenceLevel')} />
      <Field value={draft.confidenceExplanation} onChangeText={set('confidenceExplanation')} multiline placeholder={t('evidence')} />
    </View>
  );
}
