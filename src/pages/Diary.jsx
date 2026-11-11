import { useEffect, useState, useCallback } from 'react';
import { BookOpen, Trash2 } from 'lucide-react';
import { listDiary, saveDiary, deleteDiary } from '../api/endpoints';
import { useAuth } from '../context/useAuth';
import { Card, Button, Input, Select, Textarea, Field, Badge, Spinner, EmptyState, ErrorBox, PageHeader } from '../components/ui';

const MOODS = [
  { value: 'great', label: 'Great', emoji: '😊' },
  { value: 'good', label: 'Good', emoji: '🙂' },
  { value: 'okay', label: 'Okay', emoji: '😐' },
  { value: 'tired', label: 'Tired', emoji: '😴' },
  { value: 'stressed', label: 'Stressed', emoji: '😣' },
];

const today = () => new Date().toISOString().slice(0, 10);

export default function Diary() {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [month, setMonth] = useState(today().slice(0, 7));
  const [form, setForm] = useState({
    date: today(),
    mood: 'okay',
    studiedMinutes: '',
    subjectsCovered: '',
    whatLearned: '',
    difficultPart: '',
    tomorrowPlan: '',
  });

  const subjects = user?.subjects?.length ? user.subjects : [];

  const load = useCallback(() => {
    listDiary({ month })
      .then(setEntries)
      .catch((e) => setError(e.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [month]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    setSaved(false);
    try {
      await saveDiary({
        ...form,
        studiedMinutes: Number(form.studiedMinutes) || 0,
        subjectsCovered: form.subjectsCovered
          ? form.subjectsCovered.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      });
      setSaved(true);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save entry');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this entry?')) return;
    try {
      await deleteDiary(id);
      load();
    } catch {
      setError('Delete failed');
    }
  };

  const moodEmoji = (m) => MOODS.find((x) => x.value === m)?.emoji || '😐';

  return (
    <div>
      <PageHeader title="Study diary" subtitle="A daily journal of what you studied and how it felt." />

      <ErrorBox message={error} />
      {saved && <p className="text-sm text-green-700 mb-4">Entry saved.</p>}

      <div className="grid lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-2">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Date">
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </Field>
              <Field label="Mood">
                <Select value={form.mood} onChange={(e) => setForm({ ...form, mood: e.target.value })}>
                  {MOODS.map((m) => (
                    <option key={m.value} value={m.value}>{m.emoji} {m.label}</option>
                  ))}
                </Select>
              </Field>
            </div>

            <Field label="Minutes studied">
              <Input
                type="number"
                min="0"
                value={form.studiedMinutes}
                onChange={(e) => setForm({ ...form, studiedMinutes: e.target.value })}
                placeholder="e.g. 90"
              />
            </Field>

            <Field label="Subjects covered (comma separated)">
              <Input
                value={form.subjectsCovered}
                onChange={(e) => setForm({ ...form, subjectsCovered: e.target.value })}
                placeholder={subjects.length ? subjects.join(', ') : 'Physics, Maths…'}
              />
            </Field>

            <Field label="What did you learn today?">
              <Textarea rows={3} value={form.whatLearned} onChange={(e) => setForm({ ...form, whatLearned: e.target.value })} />
            </Field>
            <Field label="What was difficult?">
              <Textarea rows={2} value={form.difficultPart} onChange={(e) => setForm({ ...form, difficultPart: e.target.value })} />
            </Field>
            <Field label="Plan for tomorrow">
              <Textarea rows={2} value={form.tomorrowPlan} onChange={(e) => setForm({ ...form, tomorrowPlan: e.target.value })} />
            </Field>

            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save entry'}</Button>
          </form>
        </Card>

        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-stone-900 text-sm">Past entries</h2>
            <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-40" />
          </div>

          {loading ? (
            <Spinner />
          ) : entries.length === 0 ? (
            <Card>
              <EmptyState icon={BookOpen} title="No entries this month" />
            </Card>
          ) : (
            <div className="space-y-3">
              {entries.map((e) => (
                <Card key={e._id} className="relative">
                  <button onClick={() => handleDelete(e._id)} className="absolute top-3 right-3 text-stone-300 hover:text-red-600">
                    <Trash2 size={14} />
                  </button>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{moodEmoji(e.mood)}</span>
                    <p className="font-medium text-sm text-stone-900">{e.date}</p>
                    <span className="text-xs text-stone-400">{e.studiedMinutes} min</span>
                  </div>
                  {e.subjectsCovered?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {e.subjectsCovered.map((s) => (
                        <Badge key={s} tone="amber">{s}</Badge>
                      ))}
                    </div>
                  )}
                  {e.whatLearned && <p className="text-sm text-stone-600"><span className="text-stone-400">Learned: </span>{e.whatLearned}</p>}
                  {e.difficultPart && <p className="text-sm text-stone-600"><span className="text-stone-400">Difficult: </span>{e.difficultPart}</p>}
                  {e.tomorrowPlan && <p className="text-sm text-stone-600"><span className="text-stone-400">Tomorrow: </span>{e.tomorrowPlan}</p>}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
