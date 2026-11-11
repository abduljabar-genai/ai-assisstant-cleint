import api from './axios';

// Auth is handled by AuthContext; these cover the feature APIs.

// Profile
export const getProfile = () => api.get('/profile').then((r) => r.data.data);
export const updateProfile = (data) => api.patch('/profile', data).then((r) => r.data.data);

// Notes
export const listNotes = (params) => api.get('/notes', { params }).then((r) => r.data.data);
export const getNote = (id) => api.get(`/notes/${id}`).then((r) => r.data.data);
export const uploadNote = (formData) =>
  api.post('/notes', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data.data);
export const deleteNote = (id) => api.delete(`/notes/${id}`).then((r) => r.data);
export const summarizeNote = (id) => api.post(`/notes/${id}/summarize`).then((r) => r.data.data);
export const explainNote = (id, topic) => api.post(`/notes/${id}/explain`, { topic }).then((r) => r.data.data);
export const mindMapNote = (id) => api.post(`/notes/${id}/mindmap`).then((r) => r.data.data);
export const dailySummary = () => api.get('/notes/daily-summary').then((r) => r.data.data);

// Assistant
export const sendChat = (message) => api.post('/assistant/chat', { message }).then((r) => r.data.data);
export const chatHistory = () => api.get('/assistant/history').then((r) => r.data.data);
export const clearChat = () => api.delete('/assistant/history').then((r) => r.data);

// Quizzes
export const generateQuiz = (data) => api.post('/quizzes/generate', data).then((r) => r.data.data);
export const submitQuiz = (id, answers) => api.post(`/quizzes/${id}/submit`, { answers }).then((r) => r.data.data);
export const listQuizzes = () => api.get('/quizzes').then((r) => r.data.data);
export const getQuiz = (id) => api.get(`/quizzes/${id}`).then((r) => r.data.data);

// Questions
export const listQuestions = (params) => api.get('/questions', { params }).then((r) => r.data.data);
export const createQuestion = (data) => api.post('/questions', data).then((r) => r.data.data);
export const answerQuestion = (id, data) => api.post(`/questions/${id}/answer`, data).then((r) => r.data.data);
export const askAI = (id) => api.post(`/questions/${id}/ask-ai`).then((r) => r.data.data);
export const deleteQuestion = (id) => api.delete(`/questions/${id}`).then((r) => r.data);

// Study plans
export const listPlans = () => api.get('/plans').then((r) => r.data.data);
export const generatePlan = () => api.post('/plans/generate').then((r) => r.data.data);
export const revisionPlan = () => api.post('/plans/revision').then((r) => r.data.data);
export const createPlan = (data) => api.post('/plans', data).then((r) => r.data.data);
export const deletePlan = (id) => api.delete(`/plans/${id}`).then((r) => r.data);

// Diary
export const listDiary = (params) => api.get('/diary', { params }).then((r) => r.data.data);
export const saveDiary = (data) => api.post('/diary', data).then((r) => r.data.data);
export const deleteDiary = (id) => api.delete(`/diary/${id}`).then((r) => r.data);

// Grades
export const listGrades = (params) => api.get('/grades', { params }).then((r) => r.data.data);
export const createGrade = (data) => api.post('/grades', data).then((r) => r.data.data);
export const gradeSummary = () => api.get('/grades/summary').then((r) => r.data.data);
export const deleteGrade = (id) => api.delete(`/grades/${id}`).then((r) => r.data);

// Progress
export const getDashboard = () => api.get('/progress/dashboard').then((r) => r.data.data);
export const getProgressReport = () => api.get('/progress/report').then((r) => r.data.data);
export const getWeeklyReport = () => api.get('/progress/weekly-report').then((r) => r.data.data);
