import React from 'react';
import { FetchedUser } from './AdminUzivateleScreen';

export type AdminUserFormProps = {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isUpdating: boolean;
  onClose: () => void;
  selectedUser?: FetchedUser | null;
};

const AdminUserFormModal: React.FC<AdminUserFormProps> = ({
  onSubmit,
  isUpdating = false,
  onClose,
  selectedUser = null,
}) => {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-white/10 backdrop-blur-xs z-50"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 rounded shadow-lg max-w-md w-full"
        onClick={(e) => e.stopPropagation()} 
      >
        <h1 className="text-4xl font-bold text-center mb-4">
          {isUpdating ? "Upravit uživatele" : "Vytvořit Uživatele"}
        </h1>
        <form className="flex flex-col gap-4" onSubmit={onSubmit}>
          <div className="flex flex-col">
            <label className="mb-1 font-medium" htmlFor="email">
              Email
            </label>
            <input
              className="w-full border p-2 rounded focus:bg-[#F1F1FA] focus:outline-none"
              type="email"
              name="email"
              id="email"
              placeholder="Zadejte email"
              required
              defaultValue={isUpdating && selectedUser ? selectedUser.email : ''}
            />
          </div>
          <div className="flex flex-col">
            <label className="mb-1 font-medium" htmlFor="password">
              {isUpdating ? "Nové Heslo" : "Heslo"}
            </label>
            <input
              className="w-full border p-2 rounded focus:bg-[#F1F1FA] focus:outline-none"
              type="password"
              name="password"
              id="password"
              autoComplete="new-password"
              placeholder="Zadejte heslo"
              required
            />
          </div>
          <div className="flex justify-center">
            <button
              type="submit"
              className="bg-[#8165FF] text-white px-6 py-2 rounded-full cursor-pointer transition-colors focus:outline-none"
            >
              {isUpdating ? "Upravit uživatele" : "Vytvořit uživatele"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminUserFormModal;
