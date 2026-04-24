"use client";

import { useState } from "react";

import {
  type HotelGuide,
  createHotelGuide,
  deleteHotelGuide,
  updateHotelGuide,
} from "@/lib/backendApi";

interface Props {
  initialGuides: HotelGuide[];
}

export default function GuidesManager({ initialGuides }: Props) {
  const [guides, setGuides] = useState<HotelGuide[]>(initialGuides);
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [phone, setPhone] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setAdding(true);
    setError(null);
    try {
      const guide = await createHotelGuide({
        name: name.trim(),
        specialty: specialty.trim() || undefined,
        phone: phone.trim() || undefined,
      });
      setGuides((prev) => [...prev, guide]);
      setName("");
      setSpecialty("");
      setPhone("");
    } catch {
      setError("Failed to add guide. Please try again.");
    } finally {
      setAdding(false);
    }
  }

  async function handleToggle(guide: HotelGuide) {
    try {
      const updated = await updateHotelGuide(guide.id, { isAvailable: !guide.isAvailable });
      setGuides((prev) => prev.map((g) => (g.id === guide.id ? updated : g)));
    } catch {
      setError("Failed to update guide availability.");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteHotelGuide(id);
      setGuides((prev) => prev.filter((g) => g.id !== id));
    } catch {
      setError("Failed to delete guide.");
    }
  }

  return (
    <div className="space-y-6">
      {/* Add guide form */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-500">
          Add New Guide
        </h2>
        <form onSubmit={handleAdd} className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Guide name"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Specialty</label>
            <input
              type="text"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              placeholder="e.g. History, Diving"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+216 xx xxx xxx"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="sm:col-span-3">
            <button
              type="submit"
              disabled={adding || !name.trim()}
              className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {adding ? "Adding…" : "Add Guide"}
            </button>
          </div>
        </form>
        {error && <p className="mt-3 text-xs text-red-500">{error}</p>}
      </div>

      {/* Guides list */}
      <div className="rounded-2xl border border-slate-200 bg-white">
        {guides.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-slate-400">
            No guides yet. Add your first guide above.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {guides.map((guide) => (
              <li key={guide.id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="font-semibold text-slate-800">{guide.name}</p>
                  <div className="mt-0.5 flex gap-3 text-xs text-slate-400">
                    {guide.specialty && <span>{guide.specialty}</span>}
                    {guide.phone && <span>{guide.phone}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Availability toggle */}
                  <button
                    onClick={() => handleToggle(guide)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                      guide.isAvailable
                        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    {guide.isAvailable ? "Available" : "Unavailable"}
                  </button>
                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(guide.id)}
                    className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
