import { useEffect, useState, useCallback } from 'react';
import { GraduationCap, Plus, Trash2 } from 'lucide-react';
import { listGrades, createGrade, deleteGrade, gradeSummary } from '../api/endpoints';
import { useAuth } from '../context/useAuth';
import { Card, Button, Input, Select, Field, Badge, Spinner, EmptyState, ErrorBox, PageHeader } from '../components/ui';

const ASSESSMENTS = [
  { value: 'quiz', label: 'Quiz', weight: 1 },
  { value: 'assignment', label: 'Assignment', weight: 1 },
  { value: 'midterm', label: 'Midterm', weight: 2 },
  { value: 'final', label: 'Final exam', weight: 3 },
  { value: 'other', label: 'Other', weight: 1 },
];

export default function Grades() {
  const { user } = useAuth();
  const [grades, setGrades] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ subject: user?.subjects?.[0] || 'General', title: '', score: '', maxScore: '', kind: 'quiz', date: '' });

  const subjects = user?.subjects?.length ? user.subjects : ['General'];

  const load = useCallback(() => {
    Promise.all([listGrades(), gradeSummary()])
      .then(([g, s]) => {
        setGrades(g);
        setSummary(s);
      })
      .catch((e) => setError(e.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    const kind = ASSESSMENTS.find((a) => a.value === form.kind);
    try {
      await createGrade({
        subject: form.subject,
        title: form.title || kind.label,
        score: Number(form.score),
        maxScore: Number(form.maxScore),
        weight: kind.weight,
        date: form.date || undefined,
      });
      setForm({ subject: subjects[0], title: '', score: '', maxScore: '', kind: 'quiz', date: '' });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this entry?')) return;
    try {
      await deleteGrade(id);
      load();
    } catch {
      setError('Delete failed');
    }
  };

  return (
    <div>
      <PageHeader
        title="Grades"
        subtitle="Track marks from tests and exams — see weighted averages per subject."
        action={<Button onClick={() => setShowForm((v) => !v)}><Plus size={15} /> {showForm ? 'Close' : 'Add marks'}</Button>}
      />

      <ErrorBox message={error} />

      {/* Summary */}
      {summary?.overall != null && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="text-center md:col-span-1">
            <p className="text-3xl font-bold text-amber-700">{summary.overall}%</p>
            <p className="text-xs text-stone-500 mt-1">overall average</p>
          </Card>
          {summary.subjects.map((s) => (
            <Card key={s.subject} className="text-center">
              <p className="text-xl font-bold text-stone-800">{s.percentage}%</p>
              <p className="text-xs text-stone-500 mt-1">{s.subject}</p>
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <Card className="mb-5">
          <form onSubmit={handleCreate} className="grid sm:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
            <Field label="Subject">
              <Select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}>
                {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </Field>
            <Field label="Type">
              <Select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
                {ASSESSMENTS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
              </Select>
            </Field>
            <Field label="Title">
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Unit test 2" />
            </Field>
            <Field label="Score">
              <Input type="number" required value={form.score} onChange={(e) => setForm({ ...form, score: e.target.value })} placeholder="18" />
            </Field>
            <Field label="Out of">
              <Input type="number" required value={form.maxScore} onChange={(e) => setForm({ ...form, maxScore: e.target.value })} placeholder="20" />
            </Field>
            <Field label="Date">
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </Field>
            <div className="sm:col-span-3 lg:col-span-6">
              <Button type="submit">Save marks</Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <Spinner />
      ) : grades.length === 0 ? (
        <Card>
          <EmptyState icon={GraduationCap} title="No grades yet" hint="Add test scores and exam marks to see averages" />
        </Card>
      ) : (
        <Card className="!p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-left text-xs text-stone-400">
                <th className="px-4 py-3 font-medium">Assessment</th>
                <th className="px-4 py-3 font-medium">Subject</th>
                <th className="px-4 py-3 font-medium">Score</th>
                <th className="px-4 py-3 font-medium">%</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {grades.map((g) => {
                const pct = Math.round((g.score / g.maxScore) * 100);
                return (
                  <tr key={g._id} className="border-b border-stone-100 last:border-0">
                    <td className="px-4 py-3 text-stone-800">{g.title}</td>
                    <td className="px-4 py-3"><Badge tone="amber">{g.subject}</Badge></td>
                    <td className="px-4 py-3 text-stone-600">{g.score} / {g.maxScore}</td>
                    <td className="px-4 py-3">
                      <Badge tone={pct >= 60 ? 'green' : 'red'}>{pct}%</Badge>
                    </td>
                    <td className="px-4 py-3 text-stone-400">{new Date(g.date).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleDelete(g._id)} className="text-stone-300 hover:text-red-600">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
