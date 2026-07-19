import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { toast } from "sonner";

export function SignUpForm() {
  const [f, setF] = useState({ name: "", email: "", password: "", confirm: "" });
  const { register, isLoading } = useAuth();
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.name || !f.email || !f.password || !f.confirm) return;
    if (f.password !== f.confirm) {
      toast.error("Secrets (passwords) do not match!");
      return;
    }
    try {
      await register(f.name, f.email, f.password);
    } catch (err) {
      // Toast fired in context
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4"
    >
      <input 
        className="dotted-line-input" 
        placeholder="your name..." 
        value={f.name} 
        onChange={set("name")} 
        disabled={isLoading}
        required
      />
      <input 
        className="dotted-line-input" 
        type="email" 
        placeholder="your email..." 
        value={f.email} 
        onChange={set("email")} 
        disabled={isLoading}
        required
      />
      <input 
        className="dotted-line-input" 
        type="password" 
        placeholder="choose a secret..." 
        value={f.password} 
        onChange={set("password")} 
        disabled={isLoading}
        required
      />
      <input 
        className="dotted-line-input" 
        type="password" 
        placeholder="confirm your secret..." 
        value={f.confirm} 
        onChange={set("confirm")} 
        disabled={isLoading}
        required
      />
      <div className="mt-3 flex justify-center">
        <button type="submit" className="wax-seal" disabled={isLoading}>
          {isLoading ? "Starting Journal..." : "Begin My Journal"}
        </button>
      </div>
    </form>
  );
}

