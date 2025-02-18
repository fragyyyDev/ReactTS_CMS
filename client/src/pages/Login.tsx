import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const Login = () => {
  const navigate = useNavigate();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const login = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!emailRef.current || !passwordRef.current) {
      toast.error("Něco se pokazilo, zkontrolujte vstupy.");
      console.error("Input references not set");
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: emailRef.current.value,
            password: passwordRef.current.value,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        toast.error(`Chyba na serveru: ${errorText}`);
        console.error("Server error:", errorText);
        return;
      }

      const data = await response.json();
      toast.success("Přihlášení proběhlo úspěšně!");
      console.log("Login successful:", data);

      // Uložení tokenu do localStorage, pokud je k dispozici
      if (data.token) {
        localStorage.setItem("token", data.token);
        navigate("/admin");
      }
    } catch (error) {
      toast.error("Chyba při přihlašování");
      console.error("Login error:", error);
    }
  };

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-2xl font-bold tracking-tight text-gray-900">
          Login
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form onSubmit={login} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-900"
            >
              Email
            </label>
            <div className="mt-2">
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                ref={emailRef}
                className="block w-full rounded-md bg-white px-3 border-2 border-black py-1.5 text-base text-gray-900 placeholder:text-gray-400"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-900"
              >
                Heslo
              </label>
            </div>
            <div className="mt-2">
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                ref={passwordRef}
                className="block w-full rounded-md bg-white px-3 py-1.5 text-base border-2 border-black text-gray-900 placeholder:text-gray-400"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow hover:bg-indigo-500"
            >
              Přihlásit se
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
