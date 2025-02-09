import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useQuery, useQueryClient } from 'react-query';
import DeleteConfirmation from '../components/DeleteConfirmation';
import { PencilSimple, Trash } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';


export interface FetchedArticle {
    id: number;
    title: string;
    slug: string;
    coverimage: string;
    author: string;
    createdat: string;
    updatedat: string;
    blocks: any[];
}

const fetchArticles = async (): Promise<FetchedArticle[]> => {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/get-all-articles`);
    if (!response.ok) {
        throw new Error("Chyba při načítání článků");
    }
    const json = await response.json();
    return json.data.map((fetchedArticle: FetchedArticle) => ({
        id: fetchedArticle.id,
        title: fetchedArticle.title,
        slug: fetchedArticle.slug,
        coverimage: fetchedArticle.coverimage,
        author: fetchedArticle.author,
        createdat: fetchedArticle.createdat,
        updatedat: fetchedArticle.updatedat,
        blocks: fetchedArticle.blocks,
    }));
};

const formatDate = (dateStr: string): string => {
    const normalized = dateStr.replace(" ", "T");
    const date = new Date(normalized);
    return date.toLocaleString("cs-CZ");
};

const AdminClankyScreen: React.FC = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
    const [selectedArticleId, setSelectedArticleId] = useState<string>('');

    const { data: articles, error, isLoading } = useQuery<FetchedArticle[]>(
        "articles",
        fetchArticles,
        { staleTime: 5 * 60 * 1000 }
    );

    const confirmDeleteArticle = (id: string) => {
        setSelectedArticleId(id);
        setShowDeleteConfirm(true);
    };

    const onDeleteArticle = async () => {
        try {
            const response = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/delete-article/${selectedArticleId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );
            if (!response.ok) {
                toast.error(`Chyba při mazání článku ${response.status}`);
                return;
            }
            toast.success('Článek byl úspěšně smazán');
            queryClient.invalidateQueries("articles");
        } catch (error) {
            console.error('Chyba při mazání článku:', error);
            toast.error('Chyba při mazání článku');
        } finally {
            setShowDeleteConfirm(false);
            setSelectedArticleId('');
        }
    };

    return (
        <div className="mt-22 md:mt-16 lg:mt-12 xl:mt-6 p-4">
            <h2 className="text-5xl font-bold mb-4">Články</h2>
            {isLoading ? (
                <p>Načítání článků...</p>
            ) : error ? (
                <p>Chyba při načítání článků.</p>
            ) : (
                <div className="space-y-2">
                    {articles &&
                        articles.map((article) => (
                            <div
                                key={article.id}
                                className="bg-gray-100 p-4 rounded-md flex flex-row items-start sm:items-center justify-between"
                            >
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold">{article.title}</h3>
                                    <p className="text-gray-500">
                                        {article.createdat ? formatDate(article.createdat) : 'N/A'}
                                    </p>
                                </div>
                                <div className="mt-2 sm:mt-0 flex space-x-2">
                                    <button
                                        onClick={() => navigate("/edit-article/" + article.id, { state: { article: article } })}
                                        className=" px-2 py-1 rounded cursor-pointer"
                                    >
                                        <PencilSimple size={24} />
                                    </button>
                                    <button
                                        onClick={() => confirmDeleteArticle(article.id.toString())}
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
                    onDelete={onDeleteArticle}
                />
            )}
        </div>
    );
};

export default AdminClankyScreen;
