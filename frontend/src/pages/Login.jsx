import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AuthContext } from "../context/AuthContext";
import Layout from "../components/Layout";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";

export default function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e?.preventDefault();
    setLoading(true);

    try {
      setError("");
      await login(email, password);
      navigate("/problems");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <section className="section-padding">
        <div className="mx-auto max-w-md">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <div className="mb-6 text-center">
              <h1 className="text-3xl font-bold gradient-text">Welcome Back</h1>
              <p className="mt-2 text-sm text-gray-400">Sign in to continue solving and reviewing problems.</p>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-red-500/45 bg-red-500/15 p-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <Card className="space-y-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <Input
                  label="Password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <Button type="submit" variant="primary" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>

              <div className="border-t border-gray-700/40 pt-3 text-center text-sm text-gray-400">
                Don't have an account?{" "}
                <Link to="/register" className="font-semibold text-accent-green hover:text-accent-cyan">
                  Create one
                </Link>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
