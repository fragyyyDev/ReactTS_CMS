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
import { DotsSixVertical, Trash } from '@phosphor-icons/react';

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
  isUpdating?: boolean;
}

// Funkce pro generování slugu z názvu článku
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // odstranění diakritiky
    .trim()
    .replace(/\s+/g, '-');
};

interface SortableItemProps {
  block: Block;
  deleteBlock: (id: string) => void;
}

// Komponenta pro každý blok, aby bylo možné s ním hýbat
const SortableItem: React.FC<SortableItemProps> = ({ block, deleteBlock }) => {
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
      className="p-2 border border-gray-200 bg-white rounded-lg flex flex-row justify-between gap-2"
    >
      <div className="flex flex-col">
        <div>
          <strong>{block.type}:</strong>
        </div>
        <div>
          {block.type === 'image'
            ? `URL: ${block.data.url}, Popisek: ${block.data.caption}`
            : block.type === 'paragraph'
              ? <ReactMarkdown>{block.data.text || ''}</ReactMarkdown>
              : block.data.text}
        </div>
      </div>
      <div className="flex gap-2 mt-2">
        <button
          type="button"
          onClick={() => deleteBlock(block.id)}
          className="text-red-500 px-2 py-1 rounded cursor-pointer"
        >
          <Trash size={24} />
        </button>
        {/* Tlačítko pro drag-n-drop */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="text-gray-500 px-2 py-1 rounded cursor-grab"
        >
          <DotsSixVertical size={32} />
        </button>
      </div>
    </li>

  );
};

const ArticleEditor: React.FC<ArticleEditorProps> = ({
  initialTitle = '',
  initialCoverImage = '',
  initialAuthor = '',
  initialBlocks = [],
  onSubmit,
  isUpdating = false,
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
      // Pro jednoduchost používáme index jako ID, v reálné praxi je vhodné generovat unikátní ID (např. pomocí uuid).
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
      <form onSubmit={handleSubmit} className="flex-1 space-y-6 rounded">
        <h1 className="text-5xl font-bold mb-6">{isUpdating ? "Editace článku": "Tvorba článku"}</h1>
        <div className="grid grid-cols-1 gap-4 bg-[#F1F1FA] p-4 rounded-lg">
          <h3 className="font-semibold">Metadata</h3>
          <div>
            <label className="block w-full mb-1 font-medium">Název článku:</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Název článku"
              className="w-full p-2 border border-gray-300 rounded bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1/2">
              <label className="block w-full mb-1 font-medium">URL Fotky článku</label>
              <input
                type="text"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://example.com/cover.jpg"
                className="w-full p-2 border border-gray-300 rounded bg-white"
              />
            </div>
            <div className="w-1/2">
              <label className="block w-full mb-1 font-medium">Autor:</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Jméno autora"
                className="w-full p-2 border border-gray-300 rounded bg-white"
              />
            </div>
          </div>
        </div>

        <div className="my-6" />

        <div className="bg-[#F1F1FA] p-4 rounded-lg">
          <h2 className="text-xl font-semibold">Obsah</h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block mb-1">Typ bloku:</label>
              <select
                value={blockType}
                onChange={(e) => setBlockType(e.target.value as BlockType)}
                className="w-full p-2 border border-gray-300 rounded bg-white"
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
                  <label className="block mb-1">URL obrázku:</label>
                  <input
                    type="text"
                    value={blockDataUrl}
                    onChange={(e) => setBlockDataUrl(e.target.value)}
                    placeholder="https://example.com/obrazek.jpg"
                    className="w-full p-2 border border-gray-300 rounded bg-white"
                  />
                </div>
                <div>
                  <label className="block mb-1">Popisek obrázku:</label>
                  <input
                    type="text"
                    value={blockDataCaption}
                    onChange={(e) => setBlockDataCaption(e.target.value)}
                    placeholder="Popisek obrázku"
                    className="w-full p-2 border border-gray-300 rounded bg-white"
                  />
                </div>
              </>
            ) : (
              <div>
                <label className="block mb-1">Text:</label>
                <input
                  type="text"
                  value={blockDataText}
                  onChange={(e) => setBlockDataText(e.target.value)}
                  placeholder="Text obsahu bloku"
                  className="w-full p-2 border border-gray-300 rounded bg-white"
                />
              </div>
            )}

            <button
              type="button"
              onClick={addBlock}
              className="bg-[#8165FF] text-white px-4 py-2 rounded-xl cursor-pointer"
            >
              Přidat blok
            </button>
          </div>
        </div>

        <div className="bg-[#F1F1FA] p-4 rounded-lg">
          {blocks.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Bloky</h3>
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
        </div>

        <div className="my-6" />

        <button
          type="submit"
          className="bg-[#8165FF] w-full text-white px-4 py-2 rounded-xl cursor-pointer"
        >
          {isUpdating ? "Uložit změny" : "Zveřejnit článek"}
        </button>
      </form>

      {/* Live Preview */}
      <div className="flex-1 p-4 rounded border-l border-black/15">
        <div className="bg-green-100 mb-4 gap-x-2 rounded-full text-green-600 w-fit px-2 py-1 text-sm flex items-center">
          <div className="w-4 h-4 bg-green-600 rounded-full"></div>
          <h2 className="font-bold">Živý náhled</h2>
        </div>
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
