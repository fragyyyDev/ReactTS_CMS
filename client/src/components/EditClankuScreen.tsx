// EditClankuScreen.tsx
import React from 'react';
import ArticleEditor, { Article } from './ArticleEditor';
import { useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { useParams } from 'react-router-dom';

const EditClankuScreen: React.FC = () => {
  const queryClient = useQueryClient();
  const { id } = useParams();

  // Funkce pro aktualizaci článku na serveru
  const updateArticle = async (article: Article) => {
    try {
      if (!id) {
        toast.error('Chybí ID článku pro aktualizaci v URL');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/update-article/${id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(article),
        }
      );

      if (!response.ok) {
        // Zpracování případné chyby
        if (response.status === 403) {
          const errorData = await response.json();
          toast.error(`Chyba: ${errorData.error}`);
          throw new Error(`Slug conflict: ${errorData.error}`);
        } else if (response.status === 404) {
          const errorData = await response.json();
          toast.error(`Chyba: ${errorData.error}`);
          throw new Error(`Article not found: ${errorData.error}`);
        } else {
          toast.error(`Chyba při aktualizaci článku: ${response.status}`);
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
      }

      const data = await response.json();
      console.log('Článek byl úspěšně aktualizován:', data);
      toast.success('Článek byl úspěšně aktualizován');
      
      // Zneplatníme cache s články, aby se při příštím dotazu načetla aktuální data
      queryClient.invalidateQueries('articles');
    } catch (error) {
      console.error('Chyba při aktualizaci článku:', error);
    }
  };

  return (
    <div className="flex-1 p-4 overflow-y-auto mt-22 md:mt-8 lg:mt-6 xl:mt-6">
      {/* Komponenta ArticleEditor, která při submitu volá updateArticle */}
      <ArticleEditor onSubmit={updateArticle} isUpdating={true} />
    </div>
  );
};

export default EditClankuScreen;
