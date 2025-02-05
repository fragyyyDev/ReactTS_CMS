import React from 'react';
import ArticleEditor, { Article } from '../components/ArticleEditor';
import { useQueryClient } from 'react-query';
import { toast } from 'react-toastify';

const AdminScreen: React.FC = () => {
  const queryClient = useQueryClient();

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

  return (
    <div className="flex-1 p-4 overflow-y-auto mt-22 md:mt-8 lg:mt-6 xl:mt-6">

      {/* Editor pro vytváření článku */}
      <ArticleEditor onSubmit={publishArticle} />
    </div>
  );
};

export default AdminScreen;
