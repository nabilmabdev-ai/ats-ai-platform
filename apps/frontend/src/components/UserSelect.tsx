import { useState, useEffect, useRef } from 'react';

interface User {
    id: string;
    fullName: string | null;
    email: string;
    role: string;
}

interface UserSelectProps {
    value?: string;
    onChange: (userId: string) => void;
    role?: string; // Filter by role (e.g. 'INTERVIEWER')
    label?: string;
    placeholder?: string;
    className?: string;
}

export default function UserSelect({
    value,
    onChange,
    role,
    label,
    placeholder = 'Select user...',
    className = ''
}: UserSelectProps) {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');

    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('access_token');
                const roleQuery = role ? `?role=${role}` : '';
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users${roleQuery}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setUsers(data);
                }
            } catch (err) {
                console.error('Failed to fetch users', err);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [role]);

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredUsers = users.filter(u =>
    (u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()))
    );

    const selectedUser = users.find(u => u.id === value);

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {label && <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>}

            <div
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white cursor-pointer flex justify-between items-center hover:border-blue-500 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="truncate">
                    {selectedUser ? (
                        <span className="text-gray-900 font-medium">
                            {selectedUser.fullName || selectedUser.email}
                        </span>
                    ) : (
                        <span className="text-gray-400">{placeholder}</span>
                    )}
                </div>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </div>

            {isOpen && (
                <div className="absolute z-50 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                    <div className="sticky top-0 bg-white p-2 border-b border-gray-100">
                        <input
                            type="text"
                            className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                        />
                    </div>

                    {loading ? (
                        <div className="text-gray-400 p-2 text-center text-xs">Loading users...</div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="text-gray-400 p-2 text-center text-xs">No users found</div>
                    ) : (
                        filteredUsers.map((user) => (
                            <div
                                key={user.id}
                                className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-blue-50 transition-colors ${value === user.id ? 'bg-blue-50 text-blue-700' : 'text-gray-900'}`}
                                onClick={() => {
                                    onChange(user.id);
                                    setIsOpen(false);
                                    setSearch('');
                                }}
                            >
                                <div className="flex items-center">
                                    <span className={`block truncate ${value === user.id ? 'font-semibold' : 'font-normal'}`}>
                                        {user.fullName || 'Unknown'}
                                    </span>
                                    <span className="ml-2 truncate text-gray-400 text-xs">
                                        {user.email}
                                    </span>
                                </div>

                                {value === user.id ? (
                                    <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600">
                                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-6-6a1 1 0 011.414-1.414L9 10.586l3.293-3.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </span>
                                ) : null}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
