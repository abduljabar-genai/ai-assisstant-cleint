import { useEffect, useState, useCallback } from 'react';
import { HelpCircle, Sparkles, Check, Trash2, Plus } from 'lucide-react';
import {
  listQuestions,
  createQuestion,
  askAI,
  answerQuestion,
  deleteQuestion,
} from '../api/endpoints';
import { useAuth } from '../context/useAuth';
import { Card, Button, Input, Select, Textarea, Field, Badge, Spinner, EmptyState, ErrorBox, PageHeader } from '../components/ui';

const STATUS_TONE = { open: 'amber', answered: 'blue', resolved: 'green' };

export default function Questions() {
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('open');
  const [showForm, setShowForm] = useState(false);
  const [aiLoading, setAiLoading] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({ subject: user?.subjects?.[0] || 'General', topic: '', text: '' });
  const [manualAnswer, setManualAnswer] = useState({});

  const subjects = user?.subjects?.length ? user.subjects : ['General'];

  const load = useCallback(() => {
    listQuestions(filter ? { status: filter } : {})
      .then(setQuestions)
      .catch((e) => setError(e.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await createQuestion(form);
      setForm({ subject: subjects[0], topic: '', text: '' });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save question');
    }
  };

  const handleAskAI = async (id) => {
    setAiLoading(id);
    setError('');
    try {
      await askAI(id);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'AI request failed');
    } finally {
      setAiLoading('');
    }
  };

  const handleManualAnswer = async (id) => {
    const answer = manualAnswer[id]?.trim();
    if (!answer) return;
    try {
      await answerQuestion(id, { answer });
      load();
    } catch {
      setError('Could not save answer');
    }
  };

  const handleResolve = async (id) => {
    try {
      await answerQuestion(id, { markResolved: true });
      load();
    } catch {
      setError('Could not update');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      await deleteQuestion(id);
      load();
    } catch {
      setError('Could not delete');
    }
  };

  return (
    <div>
      <PageHeader
        title="Unclear topics"
        subtitle="Save doubts during class — get AI explanations or answer them yourself."
        action={
          <div className="flex items-center gap-2">
            <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-36">
              <option value="open">Open</option>
              <option value="answered">Answered</option>
              <option value="resolved">Resolved</option>
              <option value="">All</option>
            </Select>
            <Button onClick={() => setShowForm((v) => !v)}>
              <Plus size={15} /> {showForm ? 'Close' : 'Add doubt'}
            </Button>
          </div>
        }
      />

      <ErrorBox message={error} />

      {showForm && (
        <Card className="mb-5">
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid sm:grid-cols-3 gap-3">
              <Field label="Subject">
                <Select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}>
                  {subjects.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Topic (optional)">
                <Input
                  value={form.topic}
                  onChange={(e) => setForm({ ...form, topic: e.target.value })}
                  placeholder="e.g. entropy"
                />
              </Field>
            </div>
            <Field label="What didn't you understand?">
              <Textarea
                rows={3}
                value={form.text}
                onChange={(e) => setForm({ ...form, text: e.target.value })}
                placeholder="Write your doubt in your own words…"
                required
              />
            </Field>
            <div className="flex gap-2">
              <Button type="submit">Save doubt</Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <Spinner />
      ) : questions.length === 0 ? (
        <Card>
          <EmptyState icon={HelpCircle} title="No doubts here" hint="Anything unclear? Add it and get help." />
        </Card>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => (
            <Card key={q._id}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge tone="amber">{q.subject}</Badge>
                    {q.topic && <Badge>{q.topic}</Badge>}
                    <Badge tone={STATUS_TONE[q.status]}>{q.status}</Badge>
                  </div>
                  <p className="text-sm text-stone-800">{q.text}</p>
                  <p className="text-xs text-stone-400 mt-1">{new Date(q.createdAt).toLocaleString()}</p>

                  {q.answer && (
                    <div className="mt-3 p-3 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-700 whitespace-pre-wrap">
                      {q.answer}
                    </div>
                  )}

                  {q.status !== 'resolved' && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => handleAskAI(q._id)}
                        disabled={aiLoading === q._id}
                      >
                        <Sparkles size={14} /> {aiLoading === q._id ? 'Thinking…' : q.answer ? 'Ask AI again' : 'Explain with AI'}
                      </Button>
                      <div className="flex gap-2 flex-1 min-w-48">
                        <Input
                          placeholder="Or write your own answer…"
                          value={manualAnswer[q._id] || ''}
                          onChange={(e) => setManualAnswer({ ...manualAnswer, [q._id]: e.target.value })}
                        />
                        <Button variant="secondary" onClick={() => handleManualAnswer(q._id)}>
                          <Check size={14} />
                        </Button>
                      </div>
                      <Button variant="ghost" onClick={() => handleResolve(q._id)}>
                        Mark resolved
                      </Button>
                    </div>
                  )}
                </div>
                <button onClick={() => handleDelete(q._id)} className="text-stone-300 hover:text-red-600 shrink-0">
                  <Trash2 size={15} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
