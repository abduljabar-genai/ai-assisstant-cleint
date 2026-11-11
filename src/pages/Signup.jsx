import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import api from '../api/axios';
import { ErrorBox } from '../components/ui';

export default function Signup() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirm_password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    'w-full px-4 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-600/30 focus:border-amber-600';
  const labelCls = 'block text-sm font-medium text-stone-700 mb-1';

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-stone-200 p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-stone-900">Create account</h1>
          <p className="mt-1 text-sm text-stone-500">Start your study journey</p>
        </div>

        <ErrorBox message={error} />

        <form className="space-y-4 mt-4" onSubmit={handleSubmit}>
          <div>
            <label className={labelCls}>Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required className={inputCls} placeholder="Your name" />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required className={inputCls} placeholder="you@example.com" />
          </div>
          <div>
            <label className={labelCls}>Password</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} required className={inputCls} placeholder="At least 6 characters" />
          </div>
          <div>
            <label className={labelCls}>Confirm password</label>
            <input type="password" name="confirm_password" value={formData.confirm_password} onChange={handleChange} required className={inputCls} placeholder="Repeat password" />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 mt-2 text-white bg-amber-700 rounded-lg text-sm font-semibold hover:bg-amber-800 disabled:opacity-50"
          >
            {loading ? 'Creating account…' : 'Sign up'}
          </button>
        </form>

        <p className="text-sm text-center text-stone-500 mt-5">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-amber-700 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
