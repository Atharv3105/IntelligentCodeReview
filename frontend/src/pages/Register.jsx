import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../services/api";
import Layout from "../components/Layout";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const register = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      setError("");
      setSuccess("");

      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        setLoading(false);
        return;
      }

      const response = await api.post("/auth/register", {
        name: formData.name,
        email: formData.email,
        password: formData.password
      });

      setSuccess(response.data.message || "Account created. Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Email may already exist.");
      setLoading(false);
    }
  };

  return (
    <Layout>
      <section className="section-padding">
        <div className="mx-auto max-w-md">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <div className="mb-6 text-center">
              <h1 className="text-3xl font-bold gradient-text">Create Account</h1>
              <p className="mt-2 text-sm text-gray-400">Start your interview preparation with guided code reviews.</p>
            </div>

            {error && <div className="mb-4 rounded-lg border border-red-500/45 bg-red-500/15 p-3 text-sm text-red-300">{error}</div>}
            {success && <div className="mb-4 rounded-lg border border-green-500/45 bg-green-500/15 p-3 text-sm text-green-300">{success}</div>}

            <Card className="space-y-4">
              <form onSubmit={register} className="space-y-4">
                <Input label="Full Name" type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Jane Doe" required />
                <Input label="Email" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" required />
                <Input label="Password" type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Minimum 6 characters" required />
                <Input label="Confirm Password" type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Re-enter password" required />

                <Button type="submit" variant="primary" className="w-full" disabled={loading}>
                  {loading ? "Creating account..." : "Create Account"}
                </Button>
              </form>

              <div className="border-t border-gray-700/40 pt-3 text-center text-sm text-gray-400">
                Already have an account?{" "}
                <Link to="/login" className="font-semibold text-accent-green hover:text-accent-cyan">
                  Sign in
                </Link>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
