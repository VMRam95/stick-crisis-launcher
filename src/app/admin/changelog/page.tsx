"use client";

import { useEffect, useState } from "react";
import {
  PixelButton,
  PixelInput,
  PixelCard,
  PixelBadge,
  LoadingSpinner,
  Modal,
  ConfirmModal,
  useToast,
} from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { CHANGELOG_CATEGORIES } from "@/lib/constants";
import type { Changelog } from "@/types";

interface ChangelogForm {
  id?: string;
  version: string;
  title: string;
  content: string;
  category: string;
  release_date: string;
  is_published: boolean;
}

const emptyForm: ChangelogForm = {
  version: "",
  title: "",
  content: "",
  category: "Feature",
  release_date: new Date().toISOString().split("T")[0],
  is_published: false,
};

export default function AdminChangelogPage() {
  const [changelogs, setChangelogs] = useState<Changelog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [form, setForm] = useState<ChangelogForm>(emptyForm);
  const { showToast } = useToast();

  useEffect(() => {
    fetchChangelogs();
  }, []);

  async function fetchChangelogs() {
    try {
      const response = await fetch("/api/admin/changelog");
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setChangelogs(data.data || []);
    } catch (error) {
      showToast("Failed to load changelogs", "error");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(changelog: Changelog) {
    setForm({
      id: changelog.id,
      version: changelog.version,
      title: changelog.title,
      content: changelog.content,
      category: changelog.category,
      release_date: changelog.release_date,
      is_published: changelog.is_published,
    });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.version || !form.title || !form.content) {
      showToast("Please fill in all required fields", "error");
      return;
    }

    setSaving(true);
    try {
      const method = form.id ? "PUT" : "POST";
      const response = await fetch("/api/admin/changelog", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) throw new Error("Failed to save");

      showToast(
        form.id ? "Changelog updated" : "Changelog created",
        "success"
      );
      setModalOpen(false);
      fetchChangelogs();
    } catch (error) {
      showToast("Failed to save changelog", "error");
      console.error(error);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const response = await fetch(`/api/admin/changelog?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete");

      showToast("Changelog deleted", "success");
      setConfirmDelete(null);
      fetchChangelogs();
    } catch (error) {
      showToast("Failed to delete changelog", "error");
      console.error(error);
    }
  }

  async function togglePublish(changelog: Changelog) {
    try {
      const response = await fetch("/api/admin/changelog", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: changelog.id,
          is_published: !changelog.is_published,
        }),
      });

      if (!response.ok) throw new Error("Failed to update");

      showToast(
        changelog.is_published ? "Changelog unpublished" : "Changelog published",
        "success"
      );
      fetchChangelogs();
    } catch (error) {
      showToast("Failed to update changelog", "error");
      console.error(error);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-pixel text-pixel-sm text-pixel-text-primary uppercase">
          Changelog
        </h1>
        <PixelButton onClick={openCreate}>+ Add Entry</PixelButton>
      </div>

      {/* Changelog List */}
      <div className="space-y-4">
        {changelogs.length === 0 ? (
          <PixelCard className="text-center">
            <p className="text-pixel-text-muted font-mono">
              No changelog entries yet.
            </p>
          </PixelCard>
        ) : (
          changelogs.map((changelog) => (
            <PixelCard key={changelog.id} variant="outlined">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-pixel text-pixel-xs text-pixel-accent-green">
                      v{changelog.version}
                    </span>
                    <PixelBadge category={changelog.category}>
                      {changelog.category}
                    </PixelBadge>
                    {!changelog.is_published && (
                      <span className="font-mono text-xs text-pixel-accent-yellow">
                        [Draft]
                      </span>
                    )}
                  </div>
                  <h3 className="font-pixel text-pixel-xs text-pixel-text-primary uppercase">
                    {changelog.title}
                  </h3>
                  <p className="font-mono text-pixel-text-muted text-sm mt-1">
                    {formatDate(changelog.release_date)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <PixelButton
                    size="sm"
                    variant="ghost"
                    onClick={() => togglePublish(changelog)}
                  >
                    {changelog.is_published ? "Unpublish" : "Publish"}
                  </PixelButton>
                  <PixelButton
                    size="sm"
                    variant="secondary"
                    onClick={() => openEdit(changelog)}
                  >
                    Edit
                  </PixelButton>
                  <PixelButton
                    size="sm"
                    variant="danger"
                    onClick={() => setConfirmDelete(changelog.id)}
                  >
                    Delete
                  </PixelButton>
                </div>
              </div>
            </PixelCard>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={form.id ? "Edit Changelog" : "New Changelog"}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <PixelInput
              label="Version"
              placeholder="1.0.0"
              value={form.version}
              onChange={(e) => setForm({ ...form, version: e.target.value })}
            />
            <div>
              <label className="block font-pixel text-pixel-xs text-pixel-text-secondary uppercase mb-2">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full bg-pixel-bg-primary border-2 border-pixel-text-muted text-pixel-text-primary font-mono px-3 py-2 focus:border-pixel-accent-green focus:outline-none"
              >
                {CHANGELOG_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <PixelInput
            label="Title"
            placeholder="What's new in this version?"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />

          <div>
            <label className="block font-pixel text-pixel-xs text-pixel-text-secondary uppercase mb-2">
              Content
            </label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Describe the changes..."
              rows={5}
              className="w-full bg-pixel-bg-primary border-2 border-pixel-text-muted text-pixel-text-primary font-mono px-3 py-2 focus:border-pixel-accent-green focus:outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <PixelInput
              type="date"
              label="Release Date"
              value={form.release_date}
              onChange={(e) =>
                setForm({ ...form, release_date: e.target.value })
              }
            />
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_published}
                  onChange={(e) =>
                    setForm({ ...form, is_published: e.target.checked })
                  }
                  className="w-4 h-4 accent-pixel-accent-green"
                />
                <span className="font-mono text-pixel-text-secondary">
                  Publish immediately
                </span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <PixelButton
              variant="secondary"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </PixelButton>
            <PixelButton onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </PixelButton>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
        title="Delete Changelog"
        message="Are you sure you want to delete this changelog entry? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
