import { useEffect, useState, useCallback } from 'react';
import { CalendarDays, Sparkles, RefreshCw, Trash2, BookOpenCheck } from 'lucide-react';
import { listPlans, generatePlan, revisionPlan, deletePlan } from '../api/endpoints';
import { Card, Button, Badge, Spinner, EmptyState, ErrorBox, PageHeader } from '../components/ui';

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const DAY_LABEL = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' };
const KIND_TONE = { study: 'blue', revision: 'amber', quiz: 'green', practice: 'stone' };

export default function Timetable() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [revision, setRevision] = useState(null);
  const [revisionLoading, setRevisionLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    listPlans()
      .then(setPlans)
      .catch((e) => setError(e.response?.data?.message || 'Failed to load plans'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const current = plans[0]; // sorted newest first

  const handleGenerate = async () => {
    setError('');
    setGenerating(true);
    try {
      await generatePlan();
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not generate plan');
    } finally {
      setGenerating(false);
    }
  };

  const handleRevision = async () => {
    setError('');
    setRevisionLoading(true);
    try {
      setRevision(await revisionPlan());
    } catch (err) {
      setError(err.response?.data?.message || 'Could not build revision plan');
    } finally {
      setRevisionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this plan?')) return;
    try {
      await deletePlan(id);
      load();
    } catch {
      setError('Delete failed');
    }
  };

  return (
    <div>
      <PageHeader
        title="Timetable"
        subtitle="A weekly plan across all your subjects, plus a monthly revision schedule."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleRevision} disabled={revisionLoading}>
              <RefreshCw size={15} /> {revisionLoading ? 'Building…' : 'Monthly revision'}
            </Button>
            <Button onClick={handleGenerate} disabled={generating}>
              <Sparkles size={15} /> {generating ? 'Planning…' : 'Generate week plan'}
            </Button>
          </div>
        }
      />

      <ErrorBox message={error} />

      {loading ? (
        <Spinner />
      ) : !current ? (
        <Card>
          <EmptyState
            icon={CalendarDays}
            title="No study plan yet"
            hint="Generate a weekly timetable — the AI spreads your subjects across the week."
          />
        </Card>
      ) : (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-stone-900">{current.title}</h2>
              <p className="text-xs text-stone-400">
                Week of {new Date(current.weekStart).toLocaleDateString()} ·{' '}
                {current.generatedByAI ? 'AI generated' : 'manual'}
              </p>
            </div>
            <button onClick={() => handleDelete(current._id)} className="text-stone-300 hover:text-red-600">
              <Trash2 size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {DAYS.map((day) => {
              const slots = (current.slots || []).filter((s) => s.day === day);
              return (
                <div key={day} className="border border-stone-200 rounded-lg p-3 bg-stone-50/50">
                  <p className="text-xs font-semibold text-stone-500 uppercase mb-2">{DAY_LABEL[day]}</p>
                  {slots.length === 0 ? (
                    <p className="text-xs text-stone-300">—</p>
                  ) : (
                    <ul className="space-y-2">
                      {slots
                        .sort((a, b) => a.startTime.localeCompare(b.startTime))
                        .map((s, i) => (
                          <li key={i} className="bg-white border border-stone-200 rounded-md p-2">
                            <p className="text-xs text-stone-400">
                              {s.startTime}–{s.endTime}
                            </p>
                            <p className="text-sm font-medium text-stone-800">{s.subject}</p>
                            {s.topic && <p className="text-xs text-stone-500">{s.topic}</p>}
                            <Badge tone={KIND_TONE[s.kind] || 'stone'}>{s.kind}</Badge>
                          </li>
                        ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {revision && (
        <Card className="mt-5">
          <div className="flex items-center gap-2 mb-4">
            <BookOpenCheck size={18} className="text-amber-700" />
            <h2 className="font-semibold text-stone-900">Monthly revision plan</h2>
          </div>

          {revision.weakSubjects?.length > 0 && (
            <p className="text-sm text-stone-600 mb-3">
              Extra attention on:{' '}
              {revision.weakSubjects.map((s) => (
                <Badge key={s} tone="red">{s}</Badge>
              ))}
            </p>
          )}

          <div className="space-y-3">
            {(revision.weeks || []).map((w) => (
              <div key={w.week} className="border border-stone-200 rounded-lg p-3">
                <p className="text-sm font-medium text-stone-900">
                  Week {w.week}: {w.focus}
                </p>
                <ul className="mt-1 text-sm text-stone-600 space-y-0.5 list-disc list-inside">
                  {(w.tasks || []).map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
