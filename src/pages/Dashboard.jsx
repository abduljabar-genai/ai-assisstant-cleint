import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Flame, NotebookPen, HelpCircle, ArrowRight, Sparkles } from 'lucide-react';
import { getDashboard, dailySummary } from '../api/endpoints';
import { useAuth } from '../context/useAuth';
import { Card, Badge, Spinner, Button, EmptyState } from '../components/ui';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getDashboard(), dailySummary()])
      .then(([dash, sum]) => {
        setData(dash);
        setSummary(sum);
      })
      .catch((e) => setError(e.response?.data?.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner label="Loading your dashboard…" />;
  if (error) return <p className="text-sm text-red-600">{error}</p>;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">
          {greeting}, {user?.name?.split(' ')[0] || 'there'}
        </h1>
        <p className="text-sm text-stone-500 mt-1">Here's how today is going.</p>
      </div>

      {/* Today strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <p className="text-3xl font-bold text-amber-700">{summary?.classesCovered ?? 0}</p>
          <p className="text-xs text-stone-500 mt-1">classes covered today</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-amber-700 flex items-center justify-center gap-1">
            <Flame size={22} /> {data?.streak ?? 0}
          </p>
          <p className="text-xs text-stone-500 mt-1">day streak</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-amber-700">{data?.openQuestions ?? 0}</p>
          <p className="text-xs text-stone-500 mt-1">open doubts</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-amber-700">{data?.weekStudyMinutes ?? 0}</p>
          <p className="text-xs text-stone-500 mt-1">study minutes this week</p>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Topics covered today */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-stone-900 text-sm">Today's topics</h2>
            <Link to="/notes" className="text-xs text-amber-700 flex items-center gap-1 hover:underline">
              All notes <ArrowRight size={12} />
            </Link>
          </div>
          {summary?.notes?.length ? (
            <ul className="space-y-2">
              {summary.notes.map((n) => (
                <li key={n._id} className="flex items-center justify-between text-sm">
                  <span className="text-stone-700 truncate">{n.title}</span>
                  <Badge tone="amber">{n.subject}</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={NotebookPen} title="No classes covered yet today" hint="Upload your first notes to get started" />
          )}
          {summary?.topics?.length > 0 && (
            <div className="mt-3 pt-3 border-t border-stone-100">
              <p className="text-xs text-stone-400 mb-1">Key topics detected</p>
              <div className="flex flex-wrap gap-1">
                {summary.topics.slice(0, 8).map((t) => (
                  <Badge key={t}>{t}</Badge>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Badges + recent scores */}
        <div className="space-y-4">
          <Card>
            <h2 className="font-semibold text-stone-900 text-sm mb-3">Badges</h2>
            {data?.badges?.length ? (
              <div className="flex flex-wrap gap-2">
                {data.badges.map((b) => (
                  <Badge key={b.key} tone="amber" >
                    <Sparkles size={11} className="mr-1" /> {b.name}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-stone-400">Complete activities to earn badges.</p>
            )}
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-stone-900 text-sm">Recent quiz scores</h2>
              <Link to="/quiz" className="text-xs text-amber-700 flex items-center gap-1 hover:underline">
                Quiz <ArrowRight size={12} />
              </Link>
            </div>
            {data?.recentQuizScores?.length ? (
              <ul className="space-y-2">
                {data.recentQuizScores.map((q) => (
                  <li key={q._id} className="flex items-center justify-between text-sm">
                    <span className="text-stone-700">{q.subject}</span>
                    <Badge tone={q.score >= 60 ? 'green' : 'red'}>{q.score}%</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={HelpCircle} title="No quizzes yet" hint="Generate a quiz from your notes" />
            )}
          </Card>
        </div>
      </div>

      <Card className="flex items-center justify-between">
        <div>
          <p className="font-medium text-stone-900 text-sm">Not sure about something?</p>
          <p className="text-xs text-stone-500">Ask your assistant or save it as a doubt to revisit later.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/assistant"><Button variant="secondary">Ask assistant</Button></Link>
          <Link to="/questions"><Button>Add doubt</Button></Link>
        </div>
      </Card>
    </div>
  );
}
