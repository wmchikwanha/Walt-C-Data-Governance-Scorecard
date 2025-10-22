import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../data';
import { User, UserRole, AssessmentTemplate } from '../../types';
import { useNotification } from '../../contexts/NotificationContext';
import { PencilIcon, CheckIcon, XMarkIcon, PlusIcon } from '@heroicons/react/24/solid';
import Modal from '../shared/Modal';
import { comparePeriods } from '../../lib/scoring';

interface EditableUser extends User {
    originalName?: string;
    originalEmail?: string;
}

const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const { addNotification } = useNotification();
    
    // State for editing a user inline
    const [editingUser, setEditingUser] = useState<EditableUser | null>(null);

    // State for creating a new user
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newUser, setNewUser] = useState<Partial<User> & { departmentName?: string }>({ 
        name: '', 
        email: '', 
        role: UserRole.DEPARTMENT_HEAD, 
        departmentName: '' 
    });
    const [templates, setTemplates] = useState<AssessmentTemplate[]>([]);
    const [initialAssessment, setInitialAssessment] = useState({ templateId: '', period: '' });
    const [isCreating, setIsCreating] = useState(false);

    const fetchUsersAndTemplates = useCallback(async () => {
        setLoading(true);
        try {
            const [userList, templateList, allAssessments] = await Promise.all([
                api.getUsers(), 
                api.getTemplates(),
                api.getAllAssessments()
            ]);
            setUsers(userList);
            setTemplates(templateList);
            if (templateList.length > 0) {
                setInitialAssessment(prev => ({ ...prev, templateId: templateList[0].id }));
            }
             const latestPeriod = allAssessments
                .map(a => a.period)
                .sort(comparePeriods)
                .pop() || 'Q1 2024';
            setInitialAssessment(prev => ({ ...prev, period: latestPeriod }));
        } catch (error) {
            addNotification({ message: 'Failed to load user management data.', type: 'error' });
        } finally {
            setLoading(false);
        }
    }, [addNotification]);

    useEffect(() => {
        fetchUsersAndTemplates();
    }, [fetchUsersAndTemplates]);

    const handleEdit = (user: User) => {
        setEditingUser({ ...user, originalName: user.name, originalEmail: user.email });
    };

    const handleCancel = useCallback(() => {
        setEditingUser(null);
    }, []);

    const handleSave = useCallback(async () => {
        if (!editingUser) return;

        if (!editingUser.name || editingUser.name.trim() === '') {
            addNotification({ message: 'Name cannot be empty.', type: 'error' });
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(editingUser.email)) {
            addNotification({ message: 'Please enter a valid email address.', type: 'error' });
            return;
        }

        try {
            await api.updateUser(editingUser.id, { name: editingUser.name, email: editingUser.email });
            addNotification({ message: 'User updated successfully.', type: 'success' });
            setUsers(currentUsers => currentUsers.map(u => 
                u.id === editingUser.id ? { ...u, name: editingUser.name, email: editingUser.email } : u
            ));
            setEditingUser(null);
        } catch (error) {
            addNotification({ message: 'Failed to update user.', type: 'error' });
        }
    }, [editingUser, addNotification]);
    
    const handleEditingUserInputChange = (field: 'name' | 'email', value: string) => {
        setEditingUser(current => current ? { ...current, [field]: value } : null);
    };

    const handleCloseModal = useCallback(() => {
        setIsModalOpen(false);
        setNewUser({ name: '', email: '', role: UserRole.DEPARTMENT_HEAD, departmentName: '' });
    }, []);

    const handleNewUserInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewUser(prev => ({ ...prev, [name]: value }));
    };

    const handleAssessmentInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setInitialAssessment(prev => ({ ...prev, [name]: value }));
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const { role, departmentName, name, email } = newUser;
        
        if (!name || name.trim() === '') {
            addNotification({ message: 'Name cannot be empty.', type: 'error' });
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            addNotification({ message: 'Please enter a valid email address.', type: 'error' });
            return;
        }

        setIsCreating(true);

        const userToCreate: Omit<User, 'id'> = {
            name: name!,
            email: email!,
            role: role!,
            departmentName: role === UserRole.DEPARTMENT_HEAD ? departmentName : undefined,
        };

        try {
            const createdUser = await api.createUser(userToCreate);
            
            // Send welcome notification
            await api.createNotification({
                userId: createdUser.id,
                senderName: 'System',
                subject: 'Welcome to the Data Governance Scorecard!',
                message: 'Your account has been created. You can now access your dashboard and begin your first assessment.'
            });

            if (createdUser.role === UserRole.DEPARTMENT_HEAD && createdUser.departmentName) {
                await api.createAssessmentForNewDepartment(
                    createdUser.departmentName,
                    initialAssessment.templateId,
                    initialAssessment.period
                );
            }
            addNotification({ message: 'User created successfully!', type: 'success' });
            handleCloseModal();
            fetchUsersAndTemplates();
        } catch (error) {
            addNotification({ message: 'Failed to create user.', type: 'error' });
        } finally {
            setIsCreating(false);
        }
    };

    if (loading) {
        return <div className="text-center p-10">Loading users...</div>;
    }

    const inputClass = "block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-brand-primary focus:border-brand-primary";
    const labelClass = "block text-sm font-medium text-gray-700";

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Manage Users</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center px-4 py-2 bg-brand-primary text-white font-semibold rounded-lg shadow-md hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
                >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Add User
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => {
                            const isEditing = editingUser?.id === user.id;
                            return (
                                <tr key={user.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {isEditing ? (
                                            <input type="text" value={editingUser.name} onChange={(e) => handleEditingUserInputChange('name', e.target.value)} className={inputClass} />
                                        ) : (
                                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {isEditing ? (
                                            <input type="email" value={editingUser.email} onChange={(e) => handleEditingUserInputChange('email', e.target.value)} className={inputClass} />
                                        ) : (
                                            <div className="text-sm text-gray-500">{user.email}</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.role}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.departmentName || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        {isEditing ? (
                                            <div className="flex items-center space-x-2">
                                                <button onClick={handleSave} className="text-green-600 hover:text-green-900" title="Save"><CheckIcon className="h-5 w-5" /></button>
                                                <button onClick={handleCancel} className="text-red-600 hover:text-red-900" title="Cancel"><XMarkIcon className="h-5 w-5" /></button>
                                            </div>
                                        ) : (
                                            <button onClick={() => handleEdit(user)} className="text-brand-primary hover:text-brand-secondary" title="Edit User"><PencilIcon className="h-5 w-5" /></button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title="Add New User">
                <form onSubmit={handleCreateUser} className="space-y-4">
                    <div>
                        <label htmlFor="name" className={labelClass}>Full Name</label>
                        <input type="text" name="name" id="name" required value={newUser.name} onChange={handleNewUserInputChange} className={inputClass} />
                    </div>
                    <div>
                        <label htmlFor="email" className={labelClass}>Email Address</label>
                        <input type="email" name="email" id="email" required value={newUser.email} onChange={handleNewUserInputChange} className={inputClass} />
                    </div>
                    <div>
                        <label htmlFor="role" className={labelClass}>Role</label>
                        <select name="role" id="role" required value={newUser.role} onChange={handleNewUserInputChange} className={inputClass}>
                            {Object.values(UserRole).map(role => <option key={role} value={role}>{role}</option>)}
                        </select>
                    </div>
                    {newUser.role === UserRole.DEPARTMENT_HEAD && (
                        <>
                            <div className="border-t pt-4 space-y-4 animate-fadeIn">
                                <div>
                                    <label htmlFor="departmentName" className={labelClass}>Department Name</label>
                                    <input type="text" name="departmentName" id="departmentName" required value={newUser.departmentName} onChange={handleNewUserInputChange} className={inputClass} placeholder="e.g., Urban Operations"/>
                                </div>
                                <h3 className="text-md font-medium text-gray-900 pt-2">Initial Assessment</h3>
                                <div>
                                    <label htmlFor="templateId" className={labelClass}>Assign Template</label>
                                    <select name="templateId" id="templateId" required value={initialAssessment.templateId} onChange={handleAssessmentInputChange} className={inputClass} disabled={templates.length === 0}>
                                        {templates.length > 0 ? templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>) : <option>No templates available</option>}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="period" className={labelClass}>Initial Period</label>
                                    <input type="text" name="period" id="period" required value={initialAssessment.period} onChange={handleAssessmentInputChange} className={inputClass} placeholder="e.g., Q1 2024"/>
                                </div>
                            </div>
                        </>
                    )}
                    <div className="flex justify-end space-x-3 pt-4">
                        <button type="button" onClick={handleCloseModal} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                        <button type="submit" disabled={isCreating} className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary disabled:bg-slate-400">
                            {isCreating ? 'Creating...' : 'Create User'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default UserManagement;