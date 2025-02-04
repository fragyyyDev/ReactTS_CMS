// ArticleEditor.tsx
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  DndContext,
  closestCenter,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DotsSixVertical } from '@phosphor-icons/react';

export type BlockType = 'heading' | 'paragraph' | 'image' | 'subheading';

export interface BlockData {
  text?: string;
  url?: string;
  caption?: string;
}

export interface Block {
  id: string;
  type: BlockType;
  data: BlockData;
}

export interface Article {
  createdat?: string;
  title: string;
  slug: string;
  coverImage: string;
  author: string;
  blocks: Block[];
}

interface ArticleEditorProps {
  initialTitle?: string;
  initialCoverImage?: string;
  initialAuthor?: string;
  initialBlocks?: Block[];
  onSubmit: (article: Article) => void;
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

interface SortableItemProps {
  block: Block;
  deleteBlock: (id: string) => void;
}

const SortableItem: React.FC<SortableItemProps> = ({ block, deleteBlock }) => {
  // Používáme hook useSortable pro každý prvek seznamu
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: block.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex justify-between items-center p-2 border border-gray-200 rounded"
    >
      <span>
        <strong>{block.type}:</strong>{' '}
        {block.type === 'image'
          ? `URL: ${block.data.url}, Popisek: ${block.data.caption}`
          : block.type === 'paragraph'
            ? <ReactMarkdown>{block.data.text || ''}</ReactMarkdown>
            : block.data.text}
      </span>
      <button
        type="button"
        onClick={() => deleteBlock(block.id)}
        className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
      >
        Smazat
      </button>
      {/* Tlačítko, které aktivuje drag – na něj připojujeme atributy a event listenery */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="text-gray-500 px-2 py-1 rounded cursor-grab"
      >
        <DotsSixVertical size={32} />
      </button>
    </li>
  );
};

const ArticleEditor: React.FC<ArticleEditorProps> = ({
  initialTitle = '',
  initialCoverImage = '',
  initialAuthor = '',
  initialBlocks = [],
  onSubmit,
}) => {
  const [title, setTitle] = useState<string>(initialTitle);
  const [coverImage, setCoverImage] = useState<string>(initialCoverImage);
  const [author, setAuthor] = useState<string>(initialAuthor);
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);

  const [blockType, setBlockType] = useState<BlockType>('heading');
  const [blockDataText, setBlockDataText] = useState<string>('');
  const [blockDataUrl, setBlockDataUrl] = useState<string>('');
  const [blockDataCaption, setBlockDataCaption] = useState<string>('');

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

    setBlocks((prev) => [...prev, newBlock]);
  };

  const deleteBlock = (id: string) => {
    setBlocks((prev) => prev.filter((block) => block.id !== id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex((block) => block.id === active.id);
      const newIndex = blocks.findIndex((block) => block.id === over.id);
      setBlocks((items) => arrayMove(items, oldIndex, newIndex));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const article: Article = {
      title,
      slug: generateSlug(title),
      coverImage,
      author,
      blocks,
    };
    onSubmit(article);
  };

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Formulářová část */}
      <form onSubmit={handleSubmit} className="flex-1 space-y-6 border p-4 rounded">
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
            <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext
                items={blocks.map((b) => b.id)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="space-y-2">
                  {blocks.map((block) => (
                    <SortableItem key={block.id} block={block} deleteBlock={deleteBlock} />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          </div>
        )}

        <hr className="my-6" />

        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Odeslat
        </button>
      </form>

      {/* Live Preview */}
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
          <p className="mt-2 text-gray-600">Autor: {author || 'Jméno autora'}</p>
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
                          ),
                        }}
                      >
                        {block.data.text || ''}
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
  );
};

export default ArticleEditor;
