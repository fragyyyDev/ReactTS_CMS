// Admin.tsx
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useQuery, useQueryClient } from 'react-query';
import ArticleEditor, { Article } from '../components/ArticleEditor';
import DeleteConfirmation from '../components/DeleteConfirmation';

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

const Admin: React.FC = () => {
  const queryClient = useQueryClient();

  // Stavy pro potvrzení smazání článku
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [selectedArticleId, setSelectedArticleId] = useState<string>('');

  const { data: articles, error, isLoading } = useQuery<FetchedArticle[]>(
    "articles",
    fetchArticles,
    { staleTime: 5 * 60 * 1000 }
  );

  const publishArticle = async (article: Article) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/create-article`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(article),
        }
      );

      if (!response.ok) {
        if (response.status === 403) {
          const errorData = await response.json();
          toast.error(`Chyba: ${errorData.error}`);
          throw new Error(`Slug conflict: ${errorData.error}`);
        } else {
          toast.error(`Chyba při publikování článku ${response.status}`);
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
      }

      const data = await response.json();
      console.log('Článek byl úspěšně vytvořen:', data);
      toast.success('Článek byl úspěšně vytvořen');
      queryClient.invalidateQueries("articles");
    } catch (error) {
      console.error('Chyba při publikování článku:', error);
    }
  };

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
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Vítej zpět redaktore</h1>

      {/* Použití ArticleEditor pro vytváření článku */}
      <ArticleEditor onSubmit={publishArticle} />

      {/* Tabulka se seznamem článků */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Seznam existujících článků</h2>
        {isLoading ? (
          <p>Načítání článků...</p>
        ) : error ? (
          <p>Chyba při načítání článků.</p>
        ) : (
          <table className="min-w-full border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-4 py-2 text-left">Název článku</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Datum vytvoření</th>
                <th className="border border-gray-300 px-4 py-2 text-center">Akce</th>
              </tr>
            </thead>
            <tbody>
              {articles && articles.map((article, index) => (
                <tr key={index} className="border border-gray-300">
                  <td className="border border-gray-300 px-4 py-2">{article.title}</td>
                  <td className="border border-gray-300 px-4 py-2">
                    {article.createdat ? formatDate(article.createdat) : 'N/A'}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    <button
                      onClick={() => console.log("Edit article:", article.slug)}
                      className="bg-blue-500 text-white px-2 py-1 mr-2 rounded hover:bg-blue-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => confirmDeleteArticle(article.id.toString())}
                      className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                    >
                      Smazat
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal pro potvrzení smazání */}
      {showDeleteConfirm && (
        <DeleteConfirmation
          onClose={() => setShowDeleteConfirm(false)}
          onDelete={onDeleteArticle}
        />
      )}
    </div>
  );
};

export default Admin;
