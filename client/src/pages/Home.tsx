import { Link } from "react-router-dom";
import { useQuery } from "react-query";
import { useNavigate } from "react-router-dom";

export interface Article {
  id: number;
  title: string;
  slug: string;
  coverimage: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  blocks: any[];
}

const fetchArticles = async (): Promise<Article[]> => {
  const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/get-all-articles`);
  if (!response.ok) {
    throw new Error("Chyba při načítání článků");
  }
  const json = await response.json();
  // Očekáváme, že struktura je { message: string, data: Article[] }
  return json.data;
};

const Home = () => {
  const navigate = useNavigate();
  const { data: articles, error, isLoading } = useQuery<Article[]>("articles", fetchArticles, {
    staleTime: 5 * 60 * 1000, // data se budou považovat za čerstvá 5 minut
  });

  if (isLoading) {
    return <div className="text-center mt-10">Načítám články...</div>;
  }

  if (error) {
    return <div className="text-center mt-10 text-red-500">Chyba při načítání článků</div>;
  }

  return (
    <div className="text-center flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-5xl mb-4">Vítej na blog stránce</h1>
      <Link to="/admin" className="text-lg underline mb-8">
        Přihlásit se k adminovi
      </Link>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {articles && articles.map((article: Article) => (
          <div key={article.id} className="border p-4 rounded shadow hover:shadow-lg transition">
            <h2 className="text-xl font-bold mb-2">{article.title}</h2>
            {article.coverimage && (
              <img
                src={article.coverimage}
                alt={article.title}
                className="w-full h-48 object-cover rounded"
              />
            )}
            <button
              className="bg-black text-white p-4 rounded-full mt-4"
              onClick={() => {
                navigate(`/article/${article.slug}`, { state: article });
              }}
            >
              Zjistit více
            </button>

          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
