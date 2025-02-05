import React, { FormEvent, useState } from 'react';
import { toast } from 'react-toastify';
import { useQuery, useQueryClient } from 'react-query';
import DeleteConfirmation from './DeleteConfirmation';
import AdminUserFormModal from './AdminUserForm';
import { PencilSimple, Trash } from '@phosphor-icons/react';

export interface FetchedUser {
    id: number;
    email: string;
    createdat: string;
    updatedat: string;
}

const fetchUsers = async (): Promise<FetchedUser[]> => {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/get-all-users`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem("token")}`,
        },
    });
    if (!response.ok) {
        throw new Error("Chyba při načítání uživatelů");
    }
    const json = await response.json();
    return json.data.map((fetchedUser: FetchedUser) => ({
        id: fetchedUser.id,
        email: fetchedUser.email,
        createdat: fetchedUser.createdat,
        updatedat: fetchedUser.updatedat,
    }));
};

const formatDate = (dateStr: string): string => {
    const normalized = dateStr.replace(" ", "T");
    const date = new Date(normalized);
    return date.toLocaleString("cs-CZ");
};

const AdminUzivateleScreen: React.FC = () => {
    const queryClient = useQueryClient();

    // For Delete Confirmation Modal
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
    const [selectedUserId, setSelectedUserId] = useState<string>('');

    // For Create/Update Modal
    const [showUserModal, setShowUserModal] = useState<boolean>(false);
    const [isUpdatingUser, setIsUpdatingUser] = useState<boolean>(false);
    const [selectedUser, setSelectedUser] = useState<FetchedUser | null>(null);

    const { data: users, error, isLoading } = useQuery<FetchedUser[]>(
        "users",
        fetchUsers,
        { staleTime: 5 * 60 * 1000 }
    );

    // When the trash button is clicked
    const confirmDeleteUser = (id: string) => {
        setSelectedUserId(id);
        setShowDeleteConfirm(true);
    };

    const onDeleteUser = async () => {
        try {
            const response = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/delete-user/${selectedUserId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );
            if (!response.ok) {
                toast.error(`Chyba při mazání uživatele ${response.status}`);
                return;
            }
            toast.success('Uživatel byl úspěšně smazán');
            queryClient.invalidateQueries("users");
        } catch (error) {
            console.error('Chyba při mazání uživatele:', error);
            toast.error('Chyba při mazání uživatele');
        } finally {
            setShowDeleteConfirm(false);
            setSelectedUserId('');
        }
    };

    // Create new user handler
    const createUser = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const email = formData.get('email')?.toString() || '';
        const password = formData.get('password')?.toString() || '';

        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/create-user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({ email, password }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                toast.error(errorData.error || 'Chyba při vytváření uživatele');
                return;
            }
            await response.json();
            toast.success('Uživatel byl úspěšně vytvořen');
            queryClient.invalidateQueries("users");
            setShowUserModal(false);
        } catch (error) {
            console.error("Chyba při vytváření uživatele:", error);
            toast.error("Chyba při vytváření uživatele");
        }
    };

    // Update existing user handler
    const updateUser = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        if (!selectedUser) {
            toast.error("Nebyl vybrán uživatel k úpravě");
            return;
        }
        const formData = new FormData(e.currentTarget);
        const email = formData.get('email')?.toString() || '';
        const password = formData.get('password')?.toString() || '';

        try {
            const response = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/update-user/${selectedUser.id}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem("token")}`,
                    },
                    body: JSON.stringify({ email, password }),
                }
            );
            if (!response.ok) {
                const errorData = await response.json();
                toast.error(errorData.error || 'Chyba při aktualizaci uživatele');
                return;
            }
            await response.json();
            toast.success('Uživatel byl úspěšně aktualizován');
            queryClient.invalidateQueries("users");
            setShowUserModal(false);
            setSelectedUser(null);
        } catch (error) {
            console.error("Chyba při aktualizaci uživatele:", error);
            toast.error("Chyba při aktualizaci uživatele");
        }
    };

    // Handler for toggling the modal for creating a new user
    const handleAddUser = () => {
        setIsUpdatingUser(false);
        setSelectedUser(null);
        setShowUserModal(true);
    };

    // Handler for toggling the modal for editing an existing user
    const handleEditUser = (user: FetchedUser) => {
        setIsUpdatingUser(true);
        setSelectedUser(user);
        setShowUserModal(true);
    };

    return (
        <div className="mt-22 md:mt-16 lg:mt-12 xl:mt-6 p-4">
            <h2 className="text-5xl font-bold mb-4">Uživatelé</h2>
            {isLoading ? (
                <p>Načítání uživatelů...</p>
            ) : error ? (
                <p>Chyba při načítání uživatelů.</p>
            ) : (
                <div className="space-y-2">
                    <button
                        className="px-4 py-2 bg-[#8165FF] text-white rounded-full cursor-pointer"
                        onClick={handleAddUser}
                    >
                        Přidat uživatele
                    </button>
                    {users &&
                        users.map((user, index) => (
                            <div
                                key={index}
                                className="bg-gray-100 p-4 rounded-md flex flex-row items-start sm:items-center justify-between"
                            >
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold">{user.email}</h3>
                                    <p className="text-gray-500">ID : {user.id}</p>
                                </div>
                                <div className="flex-1">
                                    <p className="text-gray-700">Vytvořen : {formatDate(user.createdat)}</p>
                                    <p className="text-gray-700">Upraven: {formatDate(user.updatedat)}</p>
                                </div>
                                <div className="mt-2 sm:mt-0 flex space-x-2">
                                    <button
                                        onClick={() => handleEditUser(user)}
                                        className="px-2 py-1 rounded cursor-pointer"
                                    >
                                        <PencilSimple size={24} />
                                    </button>
                                    <button
                                        onClick={() => confirmDeleteUser(user.id.toString())}
                                        className="text-red-500 px-2 py-1 rounded cursor-pointer"
                                    >
                                        <Trash size={24} />
                                    </button>
                                </div>
                            </div>
                        ))}
                </div>
            )}

            {showDeleteConfirm && (
                <DeleteConfirmation
                    onClose={() => setShowDeleteConfirm(false)}
                    onDelete={onDeleteUser}
                />
            )}

            {showUserModal && (
                <AdminUserFormModal
                    onSubmit={isUpdatingUser ? updateUser : createUser}
                    isUpdating={isUpdatingUser}
                    onClose={() => {
                        setShowUserModal(false);
                        setSelectedUser(null);
                    }}
                    selectedUser={selectedUser}
                />
            )}
        </div>
    );
};

export default AdminUzivateleScreen;
