/** Admin – manage users and Agricultural Instructor accounts. */
import { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { errorMessage, useI18n } from '../../lib/i18n';
import { useApi } from '../../lib/useApi';
import { confirmAction } from '../../lib/confirm';
import { Banner, Button, Card, Chip, Empty, ErrorView, Field, Loading, Screen, Select, Txt } from '../../components/ui';
import { DistrictSelect } from '../../components/forms';
import { colors, space } from '../../theme';

export default function Users() {
  const params = useLocalSearchParams();
  const { user: me } = useAuth();
  const { t } = useI18n();
  const [role, setRole] = useState(params.role || '');
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'instructor', district: '', organization: '' });
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const { data, error, loading, reload, refreshing } = useApi('/admin/users', { role: role || undefined, q: query || undefined, limit: 100 });

  const update = async (u, patch) => {
    setMsg(null);
    try {
      await api.patch(`/admin/users/${u._id}`, patch);
      reload();
    } catch (err) {
      setMsg({ tone: 'danger', text: errorMessage(err, t) });
    }
  };

  const create = async () => {
    setBusy(true);
    setMsg(null);
    try {
      await api.post('/admin/users', {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        district: form.district || undefined,
        instructorProfile: form.organization ? { organization: form.organization.trim() } : undefined,
      });
      setCreating(false);
      setForm({ name: '', email: '', password: '', role: 'instructor', district: '', organization: '' });
      setMsg({ tone: 'success', text: t('saved') });
      reload();
    } catch (err) {
      setMsg({ tone: 'danger', text: errorMessage(err, t) });
    } finally {
      setBusy(false);
    }
  };

  const roles = ['user', 'instructor', 'admin'];
  return (
    <Screen refreshing={refreshing} onRefresh={reload}>
      {msg ? <Banner tone={msg.tone} text={msg.text} style={{ marginBottom: space.md }} /> : null}

      {creating ? (
        <Card style={{ marginBottom: space.lg }}>
          <Txt variant="title" weight="bold" style={{ marginBottom: space.md }}>
            {t('addInstructor')}
          </Txt>
          <Field label={t('name')} value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />
          <Field
            label={t('email')}
            value={form.email}
            onChangeText={(v) => setForm({ ...form, email: v })}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Field label={t('password')} hint={t('passwordHint')} value={form.password} onChangeText={(v) => setForm({ ...form, password: v })} secureTextEntry />
          <Select
            label={t('role')}
            value={form.role}
            onChange={(v) => setForm({ ...form, role: v })}
            options={roles.map((r) => ({ value: r, label: t(`role_${r}`) }))}
          />
          <DistrictSelect value={form.district} onChange={(v) => setForm({ ...form, district: v })} />
          <Field label={`${t('organization')} ${t('optional')}`} value={form.organization} onChangeText={(v) => setForm({ ...form, organization: v })} />
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <Button title={t('cancel')} variant="secondary" onPress={() => setCreating(false)} style={{ flex: 1 }} />
            <Button title={t('save')} onPress={create} loading={busy} style={{ flex: 1 }} />
          </View>
        </Card>
      ) : (
        <Button title={t('addInstructor')} icon="person-add" onPress={() => setCreating(true)} style={{ marginBottom: space.lg }} />
      )}

      <Field placeholder={t('search')} value={q} onChangeText={setQ} onSubmitEditing={() => setQuery(q.trim())} returnKeyType="search" />
      <View style={{ flexDirection: 'row', gap: space.sm, flexWrap: 'wrap', marginBottom: space.lg }}>
        <Chip label={t('filterAll')} selected={!role} onPress={() => setRole('')} />
        {roles.map((r) => (
          <Chip key={r} label={t(`role_${r}`)} selected={role === r} onPress={() => setRole(r)} />
        ))}
      </View>

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorView error={error} onRetry={reload} />
      ) : !data.items.length ? (
        <Empty icon="people-outline" text={t('noResults')} />
      ) : (
        data.items.map((u) => {
          const self = u._id === me?._id;
          return (
            <Card key={u._id} style={{ marginBottom: space.md, opacity: u.isActive ? 1 : 0.7 }}>
              <Txt weight="bold">{u.name}</Txt>
              <Txt variant="caption" color={colors.inkSoft}>
                {u.email}
                {u.district ? ` · ${u.district}` : ''}
              </Txt>
              <Txt variant="caption" weight="semibold" color={u.isActive ? colors.primary : colors.danger}>
                {t(`role_${u.role}`)} · {u.isActive ? t('active') : t('inactive')}
              </Txt>
              {!self ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.md }}>
                  {roles
                    .filter((r) => r !== u.role)
                    .map((r) => (
                      <Button
                        key={r}
                        title={t('makeRole', { role: t(`role_${r}`) })}
                        variant="secondary"
                        compact
                        onPress={() =>
                          confirmAction({
                            title: t('makeRole', { role: t(`role_${r}`) }),
                            message: u.name,
                            confirmText: t('yes'),
                            cancelText: t('cancel'),
                            destructive: false,
                            onConfirm: () => update(u, { role: r }),
                          })
                        }
                      />
                    ))}
                  <Button
                    title={u.isActive ? t('deactivate') : t('activate')}
                    variant={u.isActive ? 'danger' : 'secondary'}
                    compact
                    onPress={() =>
                      confirmAction({
                        title: u.isActive ? t('deactivate') : t('activate'),
                        message: u.name,
                        confirmText: t('yes'),
                        cancelText: t('cancel'),
                        onConfirm: () => update(u, { isActive: !u.isActive }),
                      })
                    }
                  />
                </View>
              ) : null}
            </Card>
          );
        })
      )}
    </Screen>
  );
}
