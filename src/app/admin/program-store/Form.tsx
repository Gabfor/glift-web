// app/admin/program-store/Form.tsx
"use client";

import { useState, useEffect } from "react";

type Program = {
  id?: number;
  title: string;
  level: string;
  duration: string;
  description: string;
  image_url: string;
};

export default function ProgramStoreForm({
  program,
  onSave,
  onCancel
}: {
  program: Program | null;
  onSave: (p: Partial<Program>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Program>({
    title: "",
    level: "",
    duration: "",
    description: "",
    image_url: ""
  });

  useEffect(() => {
    if (program) {
      setForm(program);
    } else {
      setForm({
        title: "",
        level: "",
        duration: "",
        description: "",
        image_url: ""
      });
    }
  }, [program]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="border p-4 rounded mb-4 bg-white shadow">
      <h2 className="text-lg font-semibold mb-2">{program ? "Éditer" : "Ajouter"} un programme</h2>

      <div className="space-y-2">
        <input
          type="text"
          name="title"
          placeholder="Titre"
          value={form.title}
          onChange={handleChange}
          className="border p-2 w-full rounded"
          required
        />
        <input
          type="text"
          name="level"
          placeholder="Niveau"
          value={form.level}
          onChange={handleChange}
          className="border p-2 w-full rounded"
          required
        />
        <input
          type="text"
          name="duration"
          placeholder="Durée"
          value={form.duration}
          onChange={handleChange}
          className="border p-2 w-full rounded"
          required
        />
        <textarea
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
          className="border p-2 w-full rounded"
          required
        />
        <input
          type="text"
          name="image_url"
          placeholder="URL de l'image"
          value={form.image_url}
          onChange={handleChange}
          className="border p-2 w-full rounded"
        />

        <div className="flex space-x-2 mt-2">
          <button
            type="submit"
            className="bg-[#7069FA] text-white px-3 py-1 rounded hover:bg-[#5A52D4] transition"
          >
            Enregistrer
          </button>
          {program && (
            <button
              type="button"
              onClick={onCancel}
              className="text-gray-500 underline"
            >
              Annuler
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
