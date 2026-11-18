import { useEffect, useState } from 'react';
import { ClipboardList, CheckCircle2, XCircle, Trophy } from 'lucide-react';
import { generateQuiz, submitQuiz, listQuizzes, getQuiz } from '../api/endpoints';
import { useAuth } from '../context/useAuth';
import { Card, Button, Select, Field, Badge, Spinner, EmptyState, ErrorBox, PageHeader } from '../components/ui';

export default function Quiz() {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [active, setActive] = useState(null); // quiz being taken
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [subject, setSubject] = useState(user?.subjects?.[0] || 'General');
  const [error, setError] = useState('');

  const subjects = user?.subjects?.length ? user.subjects : ['General','Nodejs','MERN'];

  useEffect(() => {
    listQuizzes()
      .then(setQuizzes)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const load = () => {
    listQuizzes()
      .then(setQuizzes)
      .catch(() => {});
  };

  const handleGenerate = async () => {
    setError('');
    setGenerating(true);
    try {
      const quiz = await generateQuiz({ subject, count: 5 });
      setActive(quiz);
      setAnswers(new Array(quiz.questions.length).fill(null));
      setResult(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not generate quiz');
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async () => {
    if (answers.some((a) => a === null)) {
      setError('Please answer all questions first.');
      return;
    }
    setError('');
    try {
      const res = await submitQuiz(active._id, answers);
      setResult(res);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Submit failed');
    }
  };

  if (active && !result) {
    return (
      <div>
        <PageHeader title={active.title} subtitle={`${active.questions.length} questions · ${active.subject}`} />
        <ErrorBox message={error} />
        <div className="space-y-4">
          {active.questions.map((q, qi) => (
            <Card key={qi}>
              <p className="font-medium text-sm text-stone-900 mb-3">
                {qi + 1}. {q.text}
              </p>
              {q.options?.length > 0 ? (
                <div className="space-y-2">
                  {q.options.map((opt, oi) => (
                    <label
                      key={oi}
                      className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm cursor-pointer ${
                        answers[qi] === oi ? 'border-amber-600 bg-amber-50' : 'border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q${qi}`}
                        checked={answers[qi] === oi}
                        onChange={() => setAnswers((prev) => prev.map((a, i) => (i === qi ? oi : a)))}
                        className="accent-amber-700"
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-stone-400">Open-ended question — it won't be auto-graded.</p>
              )}
            </Card>
          ))}
          <div className="flex gap-2">
            <Button onClick={handleSubmit}>Submit quiz</Button>
            <Button variant="secondary" onClick={() => setActive(null)}>Cancel</Button>
          </div>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div>
        <PageHeader title="Quiz result" />
        <Card className="mb-4">
          <div className="flex items-center gap-3">
            <Trophy size={28} className={result.score >= 60 ? 'text-amber-600' : 'text-stone-400'} />
            <div>
              <p className="text-2xl font-bold text-stone-900">{result.score !== null ? `${result.score}%` : 'Submitted'}</p>
              <p className="text-sm text-stone-500">
                {result.correctCount} of {result.totalQuestions} correct
              </p>
            </div>
          </div>
        </Card>
        <div className="space-y-3">
          {result.answers.map((a, i) => (
            <Card key={i}>
              <p className="text-sm font-medium text-stone-900 mb-2">{a.question}</p>
              {a.options?.length > 0 && (
                <div className="space-y-1 text-sm">
                  {a.options.map((opt, oi) => {
                    const isCorrect = oi === a.correctIndex;
                    const isChosen = oi === a.chosenIndex;
                    return (
                      <p
                        key={oi}
                        className={`flex items-center gap-2 ${
                          isCorrect ? 'text-green-700' : isChosen ? 'text-red-600' : 'text-stone-500'
                        }`}
                      >
                        {isCorrect ? <CheckCircle2 size={14} /> : isChosen ? <XCircle size={14} /> : <span className="w-3.5" />}
                        {opt}
                      </p>
                    );
                  })}
                </div>
              )}
              {a.explanation && <p className="text-xs text-stone-500 mt-2">{a.explanation}</p>}
            </Card>
          ))}
        </div>
        <Button className="mt-4" onClick={() => { setActive(null); setResult(null); load(); }}>
          Back to quizzes
        </Button>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Quiz"
        subtitle="Weekly quizzes generated from your own notes — track if you're improving."
        action={
          <div className="flex items-end gap-2">
            <Field label="Subject">
              <Select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-40">
                {subjects.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
            </Field>
            <Button onClick={handleGenerate} disabled={generating}>
              <ClipboardList size={15} /> {generating ? 'Generating…' : 'New quiz'}
            </Button>
          </div>
        }
      />

      <ErrorBox message={error} />

      {loading ? (
        <Spinner />
      ) : quizzes.length === 0 ? (
        <Card>
          <EmptyState icon={ClipboardList} title="No quizzes yet" hint="Generate a quiz from your uploaded notes" />
        </Card>
      ) : (
        <div className="space-y-2">
          {quizzes.map((q) => (
            <Card key={q._id} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm text-stone-900">{q.title}</p>
                <p className="text-xs text-stone-400">
                  {new Date(q.createdAt).toLocaleDateString()} · {q.totalQuestions} questions
                </p>
              </div>
              {q.score !== null ? (
                <Badge tone={q.score >= 60 ? 'green' : 'red'}>{q.score}%</Badge>
              ) : (
                <Button
                  variant="secondary"
                  onClick={async () => {
                    try {
                      const quiz = await getQuiz(q._id);
                      // eslint-disable-next-line no-unused-vars
                      const clean = quiz.questions.map(({ correctIndex, explanation, ...rest }) => rest);
                      setActive({ ...quiz, questions: clean });
                      setAnswers(new Array(quiz.questions.length).fill(null));
                      setResult(null);
                    } catch {
                      setError('Could not load quiz');
                    }
                  }}
                >
                  Resume
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
