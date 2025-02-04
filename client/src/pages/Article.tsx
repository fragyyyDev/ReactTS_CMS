import React, { useState, useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Article } from "./Home"; // Ujistěte se, že cesta odpovídá vašemu projektu

const ArticleDetail = () => {
    // Získáme slug z URL
    const { slug } = useParams<{ slug: string }>();
    // Pokud jsme při navigaci poslali article v location.state, použijeme jej
    const location = useLocation();
    const locationArticle = location.state as Article | undefined;

    // Stav pro článek, načítání a případnou chybu
    const [article, setArticle] = useState<Article | undefined>(locationArticle);
    const [loading, setLoading] = useState<boolean>(!locationArticle);
    const [error, setError] = useState<string>("");

    useEffect(() => {
        // Pokud článek není předán přes state a máme slug, provedeme fetch z API
        if (!article && slug) {
            const fetchArticle = async () => {
                try {
                    const response = await fetch(
                        `${import.meta.env.VITE_BACKEND_URL}/get-article-data/${slug}`
                    );
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const data = await response.json();
                    // Předpokládáme strukturu { article: ... }
                    setArticle(data.article);
                } catch (err) {
                    console.error(err);
                    setError("Chyba při načítání článku.");
                } finally {
                    setLoading(false);
                }
            };
            fetchArticle();
        }
    }, [article, slug]);

    if (loading) {
        return <div>Načítání článku...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    if (!article) {
        return <div>Článek nenalezen. Data nejsou k dispozici.</div>;
    }

    return (
        <div className="p-4">
            <h1 className="text-4xl font-bold mb-4">{article.title}</h1>
            {article.coverimage && (
                <img
                    src={article.coverimage}
                    alt={article.title}
                    className="max-h-96 object-cover mb-4"
                />
            )}
            <div>
                {article.blocks.map((block, index) => (
                    <div key={index} className="mb-2">
                        {block.type === "heading" && (
                            <h2 className="text-3xl font-bold">{block.data.text}</h2>
                        )}
                        {block.type === "subheading" && (
                            <h3 className="text-2xl font-semibold">{block.data.text}</h3>
                        )}
                        {block.type === "paragraph" && (
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
                        {block.type === "image" && (
                            <img src={block.data.url} alt={block.data.caption} />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ArticleDetail;
