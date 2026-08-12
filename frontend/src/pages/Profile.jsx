import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";

export default function Profile() {
  const { user } = useContext(AuthContext);
  const [profileData, setProfileData] = useState({
    targetRole: "Software Engineer",
    experienceLevel: "1-3 years",
    preferredLanguage: "python",
    institution: "Tech University",
    bio: "Passionate engineer practicing DSA, SQL, and System Design.",
  });
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await api.get("/auth/profile");
        if (res.data.user?.profile) {
          setProfileData((prev) => ({ ...prev, ...res.data.user.profile }));
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      }
    }
    fetchProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSavedMessage("");
    try {
      await api.put("/auth/profile", profileData);
      setSavedMessage("Profile updated successfully.");
      setTimeout(() => setSavedMessage(""), 3000);
    } catch (err) {
      console.error("Failed to update profile:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">Candidate Profile</h1>
        <p className="text-xs text-slate-500 mt-1">Manage your target role, experience, and preparation goals.</p>
      </div>

      {savedMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
          {savedMessage}
        </div>
      )}

      <Card className="p-6">
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Target Role</label>
            <input
              type="text"
              value={profileData.targetRole || ""}
              onChange={(e) => setProfileData({ ...profileData, targetRole: e.target.value })}
              className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 text-slate-900 dark:text-slate-100 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Experience Level</label>
            <select
              value={profileData.experienceLevel || "1-3 years"}
              onChange={(e) => setProfileData({ ...profileData, experienceLevel: e.target.value })}
              className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 text-slate-900 dark:text-slate-100 focus:outline-none"
            >
              <option value="Fresher / Student">Fresher / Student</option>
              <option value="1-3 years">1-3 years</option>
              <option value="3-5 years">3-5 years</option>
              <option value="Senior (5+ years)">Senior (5+ years)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Preferred Programming Language</label>
            <select
              value={profileData.preferredLanguage || "python"}
              onChange={(e) => setProfileData({ ...profileData, preferredLanguage: e.target.value })}
              className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 text-slate-900 dark:text-slate-100 focus:outline-none"
            >
              <option value="python">Python 3</option>
              <option value="javascript">JavaScript</option>
              <option value="cpp">C++</option>
              <option value="java">Java</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Bio / Preparation Goal</label>
            <textarea
              value={profileData.bio || ""}
              onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
              rows={3}
              className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 text-slate-900 dark:text-slate-100 focus:outline-none"
            />
          </div>

          <Button type="submit" loading={saving} variant="primary" className="w-full">
            Save Profile Changes
          </Button>
        </form>
      </Card>
    </div>
  );
}
