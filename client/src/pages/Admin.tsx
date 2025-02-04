import React, { useState } from 'react';
import { toast } from 'react-toastify';
import ReactMarkdown from 'react-markdown';
import { useQuery, useQueryClient } from 'react-query';
import DeleteConfirmation from '../components/DeleteConfirmation';

// Definice typů dle JSON struktury
type BlockType = 'heading' | 'paragraph' | 'image' | 'subheading';

interface BlockData {
  text?: string;
  url?: string;
  caption?: string;
}

export interface Block {
  id: string;
  type: BlockType;
  data: BlockData;
}

// Rozhraní pro článek, který tvoří formulář a live preview (při tvorbě článku)
interface Article {
  createdat?: string; // Volitelná, protože při vytváření nemusíme mít datum
  title: string;
  slug: string;
  coverImage: string;
  author: string;
  blocks: Block[];
}

// Rozhraní pro fetched článek (odpovídá struktuře z backendu)
export interface FetchedArticle {
  id: number;
  title: string;
  slug: string;
  coverimage: string;
  author: string;
  createdat: string; // poznámka: všechna písmena malá
  updatedat: string;
  blocks: any[];
}

// Funkce pro generování slugu z názvu článku
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, '-');
};

// Funkce pro načítání článků (vrací data dle rozhraní FetchedArticle)
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

// Funkce pro převod datumu na čitelný formát
const formatDate = (dateStr: string): string => {
  const normalized = dateStr.replace(" ", "T");
  const date = new Date(normalized);
  return date.toLocaleString("cs-CZ");
};

// Funkce pro editaci článku
const handleEdit = (slug: string) => {
  console.log("Edit article:", slug);
};

const Admin: React.FC = () => {
  const queryClient = useQueryClient();

  // Stavy pro tvorbu článku
  const [title, setTitle] = useState<string>('');
  const [coverImage, setCoverImage] = useState<string>('');
  const [author, setAuthor] = useState<string>('');
  const [blocks, setBlocks] = useState<Block[]>([]);

  const [blockType, setBlockType] = useState<BlockType>('heading');
  const [blockDataText, setBlockDataText] = useState<string>('');
  const [blockDataUrl, setBlockDataUrl] = useState<string>('');
  const [blockDataCaption, setBlockDataCaption] = useState<string>('');

  // Stavy pro potvrzení smazání článku
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [selectedArticleId, setSelectedArticleId] = useState<string>('');

  const { data: articles, error, isLoading } = useQuery<FetchedArticle[]>(
    "articles",
    fetchArticles,
    { staleTime: 5 * 60 * 1000 }
  );

  const addBlock = () => {
    const newBlock: Block = {
      id: (blocks.length + 1).toString(),
      type: blockType,
      data: {},
    };

    if (blockType === 'image') {
      newBlock.data = {
        url: blockDataUrl,
        caption: blockDataCaption,
      };
    } else {
      newBlock.data = { text: blockDataText };
    }

    setBlocks((prevBlocks) => [...prevBlocks, newBlock]);
  };

  const deleteBlock = (id: string) => {
    setBlocks((prevBlocks) => prevBlocks.filter((block) => block.id !== id));
  };

  const publishArticle = async () => {
    const article: Article = {
      title,
      slug: generateSlug(title),
      coverImage,
      author,
      blocks,
    };

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

  // Funkce, která otevře modal pro potvrzení smazání
  const confirmDeleteArticle = (id: string) => {
    setSelectedArticleId(id);
    setShowDeleteConfirm(true);
  };

  // Funkce, která provede mazání článku po potvrzení
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
      <div className="flex flex-col md:flex-row gap-8">
        {/* Formulář pro vytváření článku */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            publishArticle();
          }}
          className="flex-1 space-y-6 border p-4 rounded"
        >
          {/* Formulářové pole */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-gray-700 mb-1">Název článku:</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Název článku"
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Cover Image URL:</label>
              <input
                type="text"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://example.com/cover.jpg"
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Autor:</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Jméno autora"
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
          </div>

          <hr className="my-6" />

          <h2 className="text-xl font-semibold">Přidat blok</h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-gray-700 mb-1">Typ bloku:</label>
              <select
                value={blockType}
                onChange={(e) => setBlockType(e.target.value as BlockType)}
                className="w-full p-2 border border-gray-300 rounded"
              >
                <option value="heading">Nadpis</option>
                <option value="subheading">Podnadpis</option>
                <option value="paragraph">Odstavec</option>
                <option value="image">Obrázek</option>
              </select>
            </div>

            {blockType === 'image' ? (
              <>
                <div>
                  <label className="block text-gray-700 mb-1">URL obrázku:</label>
                  <input
                    type="text"
                    value={blockDataUrl}
                    onChange={(e) => setBlockDataUrl(e.target.value)}
                    placeholder="https://example.com/obrazek.jpg"
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-1">Popisek obrázku:</label>
                  <input
                    type="text"
                    value={blockDataCaption}
                    onChange={(e) => setBlockDataCaption(e.target.value)}
                    placeholder="Popisek obrázku"
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
              </>
            ) : (
              <div>
                <label className="block text-gray-700 mb-1">Text:</label>
                <input
                  type="text"
                  value={blockDataText}
                  onChange={(e) => setBlockDataText(e.target.value)}
                  placeholder="Text obsahu bloku. Pro odkaz použijte syntax: [odkazový text](https://example.com)"
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
            )}

            <button
              type="button"
              onClick={addBlock}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Přidat blok
            </button>
          </div>

          {blocks.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Seznam bloků:</h3>
              <ul className="space-y-2">
                {blocks.map((block) => (
                  <li
                    key={block.id}
                    className="flex justify-between items-center p-2 border border-gray-200 rounded"
                  >
                    <span>
                      <strong>{block.type}:</strong>{' '}
                      {block.type === 'image'
                        ? `URL: ${block.data.url}, Popisek: ${block.data.caption}`
                        : block.type === 'paragraph'
                          ? <ReactMarkdown>{block.data.text || ""}</ReactMarkdown>
                          : block.data.text}
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteBlock(block.id)}
                      className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                    >
                      Smazat
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <hr className="my-6" />

          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Zveřejnit
          </button>
        </form>

        {/* Live preview článku */}
        <div className="flex-1 border p-4 rounded shadow">
          <h2 className="text-2xl font-bold mb-4">Live Preview</h2>
          <div>
            <h1 className="text-3xl font-bold">{title || 'Název článku'}</h1>
            {coverImage && (
              <img
                src={coverImage}
                alt={title}
                className="w-full h-48 object-cover rounded mt-2"
              />
            )}
            <p className="mt-2 text-gray-600">
              Autor: {author || 'Jméno autora'}
            </p>
            {blocks.length > 0 && (
              <div className="mt-4 space-y-4">
                {blocks.map((block) => (
                  <div key={block.id}>
                    {block.type === 'heading' && (
                      <h2 className="text-2xl font-bold">
                        {block.data.text || 'Nadpis'}
                      </h2>
                    )}
                    {block.type === 'subheading' && (
                      <h3 className="text-xl font-semibold">
                        {block.data.text || 'Podnadpis'}
                      </h3>
                    )}
                    {block.type === 'paragraph' && (
                      <div className="prose">
                        <ReactMarkdown
                          components={{
                            a: ({ node, ...props }) => (
                              <a {...props} className="text-blue-500 underline" />
                            )
                          }}
                        >
                          {block.data.text || ""}
                        </ReactMarkdown>
                      </div>
                    )}
                    {block.type === 'image' && block.data.url && (
                      <img
                        src={block.data.url}
                        alt={block.data.caption || 'Obrázek'}
                        className="w-full h-48 object-cover rounded"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabulka se seznamem existujících článků */}
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
                      onClick={() => handleEdit(article.slug)}
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
