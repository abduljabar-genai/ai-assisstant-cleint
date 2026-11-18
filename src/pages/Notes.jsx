import { useEffect, useState, useCallback } from 'react';
import {
  Upload,
  FileText,
  Video,
  Type,
  Trash2,
  Sparkles,
  Map,
  HelpCircle,
  X,
  Paperclip,
} from 'lucide-react';
import {
  listNotes,
  uploadNote,
  deleteNote,
  summarizeNote,
  explainNote,
  mindMapNote,
  getNote,
} from '../api/endpoints';
import { useAuth } from '../context/useAuth';
import { Card, Button, Input, Select, Textarea, Field, Badge, Spinner, EmptyState, ErrorBox, PageHeader } from '../components/ui';

const NOTE_TYPES = [
  { value: 'text', label: 'Written notes', icon: Type },
  { value: 'file', label: 'Document / code file', icon: FileText },
  { value: 'video', label: 'Class video / Zoom link', icon: Video },
];

function MindMapView({ map }) {
  if (!map?.branches?.length) return null;
  return (
    <div className="border border-stone-200 rounded-lg p-4 bg-stone-50">
      <p className="text-center font-semibold text-stone-800 bg-amber-100 rounded-md py-1.5 mb-4">
        {map.center}
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        {map.branches.map((b, i) => (
          <div key={i} className="bg-white border border-stone-200 rounded-lg p-3">
            <p className="text-sm font-medium text-amber-800 mb-1">{b.label}</p>
            <ul className="text-xs text-stone-600 space-y-0.5 list-disc list-inside">
              {(b.children || []).map((c, j) => (
                <li key={j}>{c}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Notes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [aiLoading, setAiLoading] = useState('');
  const [error, setError] = useState('');

  const [form, setForm] = useState({ title: '', subject: '', type: 'text', content: '', videoUrl: '' });
  const [files, setFiles] = useState([]);
  const [saving, setSaving] = useState(false);

  const subjects = user?.subjects?.length ? user.subjects : ['General',"Nodejs","MERN","DBMS"];

  const load = useCallback(() => {
    listNotes()
      .then(setNotes)
      .catch((e) => setError(e.response?.data?.message || 'Failed to load notes'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openDetail = async (note) => {
    setSelected(note);
    setDetail(null);
    try {
      setDetail(await getNote(note._id));
    } catch {
      setDetail(note);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('subject', form.subject);
      fd.append('type', form.type);
      fd.append('content', form.content);
      fd.append('videoUrl', form.videoUrl);
      files.forEach((f) => fd.append('files', f));
      await uploadNote(fd);
      setForm({ title: '', subject: subjects[0] || '', type: 'text', content: '', videoUrl: '' });
      setFiles([]);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setSaving(false);
    }
  };

  const runAI = async (kind) => {
    if (!detail) return;
    setAiLoading(kind);
    setError('');
    try {
      let result;
      if (kind === 'summarize') result = await summarizeNote(detail._id);
      if (kind === 'mindmap') result = await mindMapNote(detail._id);
      if (kind === 'explain') {
        const topic = window.prompt('Which topic should I explain simply?', detail.keyTopics?.[0] || detail.title);
        if (!topic) return setAiLoading('');
        result = await explainNote(detail._id, topic);
        setDetail({ ...detail, explanation: result.answer, explanationTopic: result.topic });
        setAiLoading('');
        return;
      }
      setDetail((prev) => ({ ...prev, ...(result.summary !== undefined ? result : { mindMap: result }) }));
    } catch (err) {
      setError(err.response?.data?.message || 'AI request failed');
    } finally {
      setAiLoading('');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this note?')) return;
    try {
      await deleteNote(id);
      if (selected?._id === id) {
        setSelected(null);
        setDetail(null);
      }
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div>
      <PageHeader
        title="Notes"
        subtitle="Upload class notes, code files and recordings — AI helps you understand them."
        action={
          <Button onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Close' : 'Upload notes'}
          </Button>
        }
      />

      <ErrorBox message={error} />

      {showForm && (
        <Card className="mb-6">
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-4">
              <Field label="Title">
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Thermodynamics — lecture 4"
                  required
                />
              </Field>
              <Field label="Subject">
                <Select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}>
                  {subjects.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Type">
                <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {NOTE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </Select>
              </Field>
            </div>

            {form.type !== 'video' && (
              <Field label={form.type === 'file' ? 'Notes / description (optional)' : 'Notes'}>
                <Textarea
                  rows={5}
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder={
                    form.type === 'text'
                      ? 'Paste or type your class notes here…'
                      : 'Add any context about the attached files…'
                  }
                />
              </Field>
            )}

            {form.type === 'video' && (
              <>
                <Field label="Or paste a recording link (Zoom cloud, YouTube, Drive…)">
                  <Input
                    value={form.videoUrl}
                    onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                    placeholder="https://… (optional if uploading a file)"
                  />
                </Field>
                <Field label="Or upload the recording file (mp4, etc. — up to 200MB)">
                  <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-stone-300 rounded-lg cursor-pointer text-sm text-stone-500 hover:bg-stone-50">
                    <Video size={15} />
                    {files.length ? `${files.length} file(s) selected` : 'Choose video file'}
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(e) => setFiles(Array.from(e.target.files))}
                    />
                  </label>
                </Field>
              </>
            )}

            {form.type !== 'video' && (
              <Field label="Attach files (PDF, code, images — up to 10)">
                <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-stone-300 rounded-lg cursor-pointer text-sm text-stone-500 hover:bg-stone-50">
                  <Paperclip size={15} />
                  {files.length ? `${files.length} file(s) selected` : 'Choose files'}
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => setFiles(Array.from(e.target.files))}
                  />
                </label>
              </Field>
            )}

            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>
                <Upload size={15} /> {saving ? 'Saving…' : 'Save note'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid lg:grid-cols-5 gap-4">
        {/* List */}
        <div className="lg:col-span-2 space-y-2">
          {loading ? (
            <Spinner />
          ) : notes.length === 0 ? (
            <Card>
              <EmptyState icon={FileText} title="No notes yet" hint="Upload your first class notes" />
            </Card>
          ) : (
            notes.map((n) => (
              <button
                key={n._id}
                onClick={() => openDetail(n)}
                className={`w-full text-left bg-white border rounded-xl p-4 hover:border-amber-400 transition-colors ${
                  selected?._id === n._id ? 'border-amber-600' : 'border-stone-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-sm text-stone-900 truncate">{n.title}</p>
                  <Badge tone="amber">{n.subject}</Badge>
                </div>
                <p className="text-xs text-stone-400 mt-1">
                  {new Date(n.createdAt).toLocaleDateString()} ·{' '}
                  {NOTE_TYPES.find((t) => t.value === n.type)?.label || n.type}
                  {n.files?.length > 0 && ` · ${n.files.length} file(s)`}
                </p>
              </button>
            ))
          )}
        </div>

        {/* Detail */}
        <div className="lg:col-span-3">
          {!detail ? (
            <Card className="h-full flex items-center justify-center">
              <EmptyState icon={FileText} title="Select a note" hint="Click a note to view summary, mind map and explanations" />
            </Card>
          ) : (
            <Card>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h2 className="font-bold text-stone-900">{detail.title}</h2>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {detail.subject} · {new Date(detail.createdAt).toLocaleString()}
                  </p>
                </div>
                <button onClick={() => handleDelete(detail._id)} className="text-stone-400 hover:text-red-600">
                  <Trash2 size={17} />
                </button>
              </div>

              {/* AI actions */}
              <div className="flex flex-wrap gap-2 mb-4">
                <Button variant="secondary" onClick={() => runAI('summarize')} disabled={!!aiLoading}>
                  <Sparkles size={14} /> {aiLoading === 'summarize' ? 'Summarizing…' : 'Summarize'}
                </Button>
                <Button variant="secondary" onClick={() => runAI('mindmap')} disabled={!!aiLoading}>
                  <Map size={14} /> {aiLoading === 'mindmap' ? 'Mapping…' : 'Mind map'}
                </Button>
                <Button variant="secondary" onClick={() => runAI('explain')} disabled={!!aiLoading}>
                  <HelpCircle size={14} /> {aiLoading === 'explain' ? 'Explaining…' : 'Explain simply'}
                </Button>
              </div>

              {detail.summary && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-stone-800 mb-1">Summary</h3>
                  <p className="text-sm text-stone-600 whitespace-pre-wrap">{detail.summary}</p>
                  {detail.keyTopics?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {detail.keyTopics.map((t) => (
                        <Badge key={t} tone="blue">{t}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {detail.mindMap && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-stone-800 mb-2">Mind map</h3>
                  <MindMapView map={detail.mindMap} />
                </div>
              )}

              {detail.explanation && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <h3 className="text-sm font-semibold text-amber-800 mb-1">
                    Simple explanation{detail.explanationTopic ? ` — ${detail.explanationTopic}` : ''}
                  </h3>
                  <p className="text-sm text-stone-700 whitespace-pre-wrap">{detail.explanation}</p>
                  <button
                    className="text-xs text-amber-700 mt-1 flex items-center gap-1"
                    onClick={() => setDetail({ ...detail, explanation: null })}
                  >
                    <X size={11} /> dismiss
                  </button>
                </div>
              )}

              {detail.content && (
                <div>
                  <h3 className="text-sm font-semibold text-stone-800 mb-1">Content</h3>
                  <p className="text-sm text-stone-600 whitespace-pre-wrap max-h-64 overflow-y-auto">{detail.content}</p>
                </div>
              )}

              {detail.videoUrl && (
                <div className="mt-4">
                  <a
                    href={detail.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-amber-700 hover:underline flex items-center gap-1"
                  >
                    <Video size={14} /> Open recording
                  </a>
                </div>
              )}

              {detail.files?.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-stone-800 mb-1">Files</h3>
                  <ul className="text-sm space-y-2">
                    {detail.files.map((f, i) => (
                      <li key={i}>
                        {f.mimeType?.startsWith('video/') ? (
                          <video controls className="w-full max-h-72 rounded-lg bg-black" src={`http://localhost:3000${f.url}`} />
                        ) : (
                          <a href={`http://localhost:3000${f.url}`} target="_blank" rel="noreferrer" className="text-amber-700 hover:underline">
                            {f.name}
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
