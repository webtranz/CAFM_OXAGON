"use client";

import { FormEvent, useState } from "react";
import { LogIn } from "lucide-react";

export default function LoginPage() {
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (response.ok) {
      window.location.href = "/";
    } else {
      setMessage(result.message ?? "Login failed");
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-6 text-ink">
      <form onSubmit={submit} className="w-full max-w-md rounded-lg border border-white bg-white p-6 shadow-lift">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-lg bg-lagoon text-white">
            <LogIn size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-black">BrightWorks CAFM</h1>
            <p className="text-sm text-slate-500">Admin login</p>
          </div>
        </div>
        <div className="mt-6 grid gap-3">
          <input name="email" type="email" defaultValue="admin@cafm.local" className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon" />
          <input name="password" type="password" defaultValue="Admin@12345" className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon" />
          <button className="h-11 rounded-lg bg-ink font-black text-white">Login</button>
          {message && <p className="text-sm font-bold text-coral">{message}</p>}
        </div>
      </form>
    </main>
  );
}
