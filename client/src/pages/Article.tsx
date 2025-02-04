import React from "react";
import { useLocation, useParams } from "react-router-dom";
import { Article } from "./Home"; // Ujistěte se, že cesta odpovídá vašemu projektu
import ReactMarkdown from "react-markdown";

const ArticleDetail = () => {
    const { slug } = useParams<{ slug: string }>();
    const location = useLocation();
    const article = location.state as Article | undefined;

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
                                a: ({node, ...props}) => (
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
