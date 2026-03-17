import { useState } from "react";
import { supabase } from "./lib/supabase";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleSignUp() {
    setMessage("Creating account...");

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Account created. Check your email if confirmation is required.");
  }

  async function handleSignIn() {
    setMessage("Signing in...");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Signed in successfully.");
  }

  return (
    <div style={{ maxWidth: 400, margin: "40px auto", padding: 20 }}>
      <h2>Planner Login</h2>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        style={{ display: "block", width: "100%", marginBottom: 12, padding: 8 }}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        style={{ display: "block", width: "100%", marginBottom: 12, padding: 8 }}
      />

      <button onClick={handleSignUp} style={{ marginRight: 10 }}>
        Sign Up
      </button>

      <button onClick={handleSignIn}>Sign In</button>

      <p style={{ marginTop: 16 }}>{message}</p>
    </div>
  );
}