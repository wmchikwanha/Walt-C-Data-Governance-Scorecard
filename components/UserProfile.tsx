// FIX: Replaced placeholder content with the UserProfile component implementation.
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../data';
import { useNotification } from '../contexts/NotificationContext';

const UserProfile: React.FC = () => {
    const { user, updateUserContext } = useAuth();
    const { addNotification } = useNotification();
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [isSaving, setIsSaving] = useState(false);
    
    if (!user) {
        return <p>No user found.</p>;
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const updatedUser = await api.updateUser(user.id, { name, email });
            updateUserContext(updatedUser);
            addNotification({ message: 'Profile updated successfully.', type: 'success' });
        } catch (error) {
            addNotification({ message: 'Failed to update profile.', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };
    
    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-xl mx-auto bg-white rounded-lg shadow-xl p-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-6">Your Profile</h1>
                <form onSubmit={handleSave} className="space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-brand-primary focus:border-brand-primary"
                        />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-brand-primary focus:border-brand-primary"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Role</label>
                        <p className="mt-1 text-sm text-gray-500 bg-slate-100 p-2 rounded-md">{user.role}</p>
                    </div>
                    {user.departmentName && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Department</label>
                            <p className="mt-1 text-sm text-gray-500 bg-slate-100 p-2 rounded-md">{user.departmentName}</p>
                        </div>
                    )}
                    <div className="text-right">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-brand-primary hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-secondary disabled:bg-slate-400"
                        >
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserProfile;
