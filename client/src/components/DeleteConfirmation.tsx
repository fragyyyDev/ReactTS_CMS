import React from 'react';

export type DeleteConfirmProps = {
    onClose: () => void;
    onDelete: () => void;
};

const DeleteConfirmation: React.FC<DeleteConfirmProps> = ({ onClose, onDelete }) => {
    return (
        <div
            className="fixed inset-0 flex items-center justify-center bg-white/10 backdrop-blur-xs z-50"
            onClick={onClose}
        >
            <div
                className="bg-white p-6 rounded shadow-lg max-w-sm w-full"
                onClick={(e) => e.stopPropagation()}  // zabráníme propagaci kliknutí a zavření modalu
            >
                <p className="mb-4 text-center font-semibold">
                    Opravdu chcete smazat tento článek?<br />
                    Tato akce je nevratná.
                </p>
                <div className="flex justify-end">
                    <button
                        onClick={onClose}
                        className="mr-4 bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                    >
                        Zrušit
                    </button>
                    <button
                        onClick={onDelete}
                        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                    >
                        Smazat
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmation;
