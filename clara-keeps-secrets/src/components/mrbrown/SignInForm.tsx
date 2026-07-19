import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";

export function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    try {
      await login(email, password);
    } catch (err) {
      // toast is already fired in context
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5"
    >
      <input 
        className="dotted-line-input" 
        type="email" 
        placeholder="your email..." 
        value={email} 
        onChange={(e) => setEmail(e.target.value)} 
        disabled={isLoading}
        required
      />
      <input 
        className="dotted-line-input" 
        type="password" 
        placeholder="your secret..." 
        value={password} 
        onChange={(e) => setPassword(e.target.value)} 
        disabled={isLoading}
        required
      />
      <a href="#" className="self-end text-xs font-body text-dusty-rose hover:text-deep-red transition-colors">
        Forgot password?
      </a>
      <div className="mt-2 flex justify-center">
        <button type="submit" className="wax-seal" disabled={isLoading}>
          {isLoading ? "Entering..." : "Enter"}
        </button>
      </div>
    </form>
  );
}

