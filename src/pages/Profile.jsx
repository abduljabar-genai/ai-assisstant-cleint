import { useEffect, useState } from 'react';
import { User } from 'lucide-react';
import { getProfile, updateProfile } from '../api/endpoints';
import { Card, Button, Input, Select, Field, Spinner, ErrorBox, PageHeader } from '../components/ui';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: '',
    grade: '',
    subjects: '',
    learningStyle: 'mixed',
    dailyGoalMinutes: 120,
  });

  useEffect(() => {
    getProfile()
      .then((p) => {
        setProfile(p);
        setForm({
          name: p.name || '',
          grade: p.grade || '',
          subjects: (p.subjects || []).join(', '),
          learningStyle: p.learningStyle || 'mixed',
          dailyGoalMinutes: p.dailyGoalMinutes || 120,
        });
      })
      .catch((e) => setError(e.response?.data?.message || 'Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSaved(false);
    setSaving(true);
    try {
      const updated = await updateProfile({
        name: form.name,
        grade: form.grade,
        subjects: form.subjects,
        learningStyle: form.learningStyle,
        dailyGoalMinutes: Number(form.dailyGoalMinutes),
      });
      setProfile(updated);
      setSaved(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="max-w-xl">
      <PageHeader title="Profile" subtitle="Your details help the AI personalize explanations." />

      <Card>
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-stone-100">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center">
            <User size={22} />
          </div>
          <div>
            <p className="font-semibold text-stone-900">{profile?.name}</p>
            <p className="text-xs text-stone-400">{profile?.email}</p>
          </div>
        </div>

        <ErrorBox message={error} />
        {saved && <p className="text-sm text-green-700 mb-3">Profile updated.</p>}

        <form onSubmit={handleSave} className="space-y-4">
          <Field label="Name">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </Field>

          <Field label="Class / grade" hint="e.g. 10th, B.Tech CSE, Class 12">
            <Input value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} />
          </Field>

          <Field label="Subjects" hint="Comma separated — used for quizzes, timetable and revision plans">
            <Input
              value={form.subjects}
              onChange={(e) => setForm({ ...form, subjects: e.target.value })}
              placeholder="Physics, Chemistry, Maths"
            />
          </Field>

          <Field label="How do you learn best?">
            <Select value={form.learningStyle} onChange={(e) => setForm({ ...form, learningStyle: e.target.value })}>
              <option value="mixed">A mix of everything</option>
              <option value="visual">Visual — diagrams and examples</option>
              <option value="reading">Reading — detailed explanations</option>
              <option value="practice">Practice — examples and exercises</option>
            </Select>
          </Field>

          <Field label="Daily study goal (minutes)">
            <Input
              type="number"
              min="15"
              max="600"
              value={form.dailyGoalMinutes}
              onChange={(e) => setForm({ ...form, dailyGoalMinutes: e.target.value })}
            />
          </Field>

          <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
        </form>
      </Card>
    </div>
  );
}
