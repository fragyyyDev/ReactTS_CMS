import React, { useState } from 'react';
import { toast } from 'react-toastify';

// Definice typů dle JSON struktury
type BlockType = 'heading' | 'paragraph' | 'image' | 'subheading';

interface BlockData {
  text?: string;
  url?: string;
  caption?: string;
}

interface Block {
  id: string;
  type: BlockType;
  data: BlockData;
}

interface Article {
  title: string;
  slug: string;
  coverImage: string;
  author: string;
  blocks: Block[];
}

// Funkce pro generování slugu z názvu článku
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .normalize('NFD') // rozloží znaky s diakritikou
    .replace(/[\u0300-\u036f]/g, '') // odstraní diakritiku
    .trim()
    .replace(/\s+/g, '-'); // nahradí mezery pomlčkami
};

const Admin: React.FC = () => {
  // Stav pro základní pole článku
  const [title, setTitle] = useState<string>('');
  const [coverImage, setCoverImage] = useState<string>('');
  const [author, setAuthor] = useState<string>('');
  const [blocks, setBlocks] = useState<Block[]>([]);

  // Stav pro přidávání nového bloku
  const [blockType, setBlockType] = useState<BlockType>('heading');
  const [blockDataText, setBlockDataText] = useState<string>('');
  const [blockDataUrl, setBlockDataUrl] = useState<string>('');
  const [blockDataCaption, setBlockDataCaption] = useState<string>('');

  // Přidání bloku do seznamu bloků
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

  // Funkce k mazání bloku
  const deleteBlock = (id: string) => {
    setBlocks((prevBlocks) => prevBlocks.filter((block) => block.id !== id));
  };

  // Funkce, která se spustí po stisknutí tlačítka Zveřejnit
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
        toast.error(`Chyba při publikování článku ${response.status}`);
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Článek byl úspěšně vytvořen:', data);
      toast.success(`Článek byl úspěšně vytvořen`);

    } catch (error) {
      console.error('Chyba při publikování článku:', error);
      toast.error(`Chyba při publikování článku ${error}`);
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
                  placeholder="Text obsahu bloku"
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
                      <p>{block.data.text || 'Odstavec'}</p>
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
    </div>
  );
};

export default Admin;
