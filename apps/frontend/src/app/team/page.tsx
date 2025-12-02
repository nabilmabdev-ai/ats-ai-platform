'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';

interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function TeamPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('RECRUITER');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Failed to fetch users', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password, role }),
      });

      if (res.ok) {
        setShowModal(false);
        setFullName('');
        setEmail('');
        setPassword('');
        setRole('RECRUITER');
        fetchUsers();
        alert('User created successfully!');
      } else {
        alert('Failed to create user.');
      }
    } catch (error) {
      console.error(error);
      alert('Network error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading Team...</div>;

  return (
    <div className="min-h-screen bg-[var(--color-soft-grey)] p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Team Management</h1>
            <p className="text-gray-500 mt-1">Manage users and their roles.</p>
          </div>
          {currentUser?.role === 'ADMIN' && (
            <button onClick={() => setShowModal(true)} className="btn-primary">
              + Add User
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl border border-[var(--color-border-subtle)] overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-[var(--color-border-subtle)]">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-subtle)]">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{user.fullName}</td>
                  <td className="px-6 py-4 text-gray-600">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'MANAGER' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                      }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Create User Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-fade-in">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Add New User</h2>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="label-base">Full Name</label>
                  <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} className="input-base w-full" />
                </div>
                <div>
                  <label className="label-base">Email</label>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="input-base w-full" />
                </div>
                <div>
                  <label className="label-base">Password</label>
                  <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="input-base w-full" placeholder="Initial password" />
                </div>
                <div>
                  <label className="label-base">Role</label>
                  <select value={role} onChange={e => setRole(e.target.value)} className="input-base w-full">
                    <option value="RECRUITER">Recruiter</option>
                    <option value="MANAGER">Manager</option>
                    <option value="INTERVIEWER">Interviewer</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="btn-primary">
                    {isSubmitting ? 'Creating...' : 'Create User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}