import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, NotebookPen, ClipboardList, Clock, HelpCircle } from 'lucide-react';
import { getProgressReport, getWeeklyReport } from '../api/endpoints';
import { Card, Badge, Spinner, ErrorBox, PageHeader } from '../components/ui';

function TrendIcon({ improving }) {
  if (improving === true) return <TrendingUp size={16} className="text-green-600" />;
  if (improving === false) return <TrendingDown size={16} className="text-red-500" />;
  return <Minus size={16} className="text-stone-400" />;
}

export default function Progress() {
  const [report, setReport] = useState(null);
  const [weekly, setWeekly] = useState(null);
  const [loading, setLoading] = useState(true);
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getProgressReport()
      .then(setReport)
      .catch((e) => setError(e.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const loadWeekly = async () => {
    setWeeklyLoading(true);
    try {
      setWeekly(await getWeeklyReport());
    } catch {
      setError('Could not generate report');
    } finally {
      setWeeklyLoading(false);
    }
  };

  if (loading) return <Spinner label="Loading progress…" />;

  return (
    <div>
      <PageHeader
        title="Progress"
        subtitle="Last 30 days — are you covering more and improving?"
        action={
          <button
            onClick={loadWeekly}
            disabled={weeklyLoading}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-amber-700 text-white hover:bg-amber-800 disabled:opacity-50"
          >
            {weeklyLoading ? 'Writing…' : 'Weekly AI report'}
          </button>
        }
      />

      <ErrorBox message={error} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="text-center">
          <NotebookPen size={20} className="mx-auto text-amber-700 mb-1" />
          <p className="text-2xl font-bold text-stone-900">{report?.notesUploaded ?? 0}</p>
          <p className="text-xs text-stone-500">notes uploaded</p>
        </Card>
        <Card className="text-center">
          <ClipboardList size={20} className="mx-auto text-amber-700 mb-1" />
          <p className="text-2xl font-bold text-stone-900">{report?.quizzesCompleted ?? 0}</p>
          <p className="text-xs text-stone-500">quizzes completed</p>
        </Card>
        <Card className="text-center">
          <Clock size={20} className="mx-auto text-amber-700 mb-1" />
          <p className="text-2xl font-bold text-stone-900">{report?.totalStudyMinutes ?? 0}</p>
          <p className="text-xs text-stone-500">study minutes</p>
        </Card>
        <Card className="text-center">
          <HelpCircle size={20} className="mx-auto text-amber-700 mb-1" />
          <p className="text-2xl font-bold text-stone-900">{report?.openQuestions ?? 0}</p>
          <p className="text-xs text-stone-500">open doubts</p>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <h2 className="font-semibold text-stone-900 text-sm mb-3">Quiz trend — are you improving?</h2>
          {!report?.quizTrend?.length ? (
            <p className="text-sm text-stone-400">Complete some quizzes to see your trend.</p>
          ) : (
            <ul className="space-y-2">
              {report.quizTrend.map((t) => (
                <li key={t.subject} className="flex items-center justify-between text-sm">
                  <span className="text-stone-700">{t.subject}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-xs text-stone-400">{t.quizzes} quiz{t.quizzes > 1 ? 'zes' : ''}</span>
                    <TrendIcon improving={t.improving} />
                    <Badge tone={t.averageScore >= 60 ? 'green' : 'red'}>
                      {Math.round(t.averageScore)}%
                    </Badge>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="font-semibold text-stone-900 text-sm mb-3">Topics covered by subject</h2>
          {!report?.topicsBySubject || !Object.keys(report.topicsBySubject).length ? (
            <p className="text-sm text-stone-400">Upload notes and summarize them to see topics here.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(report.topicsBySubject).map(([subject, topics]) => (
                <div key={subject}>
                  <p className="text-xs font-medium text-stone-500 mb-1">
                    {subject} <span className="text-stone-300">({topics.length} topics)</span>
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {topics.slice(0, 10).map((t) => (
                      <Badge key={t}>{t}</Badge>
                    ))}
                    {topics.length > 10 && <Badge>+{topics.length - 10} more</Badge>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {weekly && (
        <Card className="mt-4">
          <h2 className="font-semibold text-stone-900 text-sm mb-2">Weekly report</h2>
          {weekly.report ? (
            <p className="text-sm text-stone-700 whitespace-pre-wrap">{weekly.report}</p>
          ) : (
            <p className="text-sm text-stone-400">AI report unavailable — check GROQ_API_KEY.</p>
          )}
        </Card>
      )}
    </div>
  );
}
