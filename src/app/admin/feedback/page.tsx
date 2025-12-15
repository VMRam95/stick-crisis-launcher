"use client";

import { useEffect, useState, useCallback } from "react";
import {
  PixelButton,
  PixelCard,
  LoadingSpinner,
  Modal,
  ConfirmModal,
  useToast,
} from "@/components/ui";
import { formatDate, formatDateTime, truncate } from "@/lib/utils";
import type { Feedback, FeedbackType, FeedbackStatus } from "@/types";

const FEEDBACK_TYPES: FeedbackType[] = ["bug", "feature", "crash", "suggestion", "question", "other"];
const FEEDBACK_STATUSES: FeedbackStatus[] = ["new", "reviewed", "in_progress", "resolved", "closed"];

function getTypeColor(type: FeedbackType): string {
  const colors: Record<FeedbackType, string> = {
    bug: "text-pixel-accent-red border-pixel-accent-red bg-pixel-accent-red/20",
    feature: "text-pixel-accent-green border-pixel-accent-green bg-pixel-accent-green/20",
    crash: "text-pixel-accent-pink border-pixel-accent-pink bg-pixel-accent-pink/20",
    suggestion: "text-pixel-accent-yellow border-pixel-accent-yellow bg-pixel-accent-yellow/20",
    question: "text-pixel-accent-cyan border-pixel-accent-cyan bg-pixel-accent-cyan/20",
    other: "text-pixel-text-secondary border-pixel-text-secondary bg-pixel-text-secondary/20",
  };
  return colors[type] || "text-pixel-text-secondary border-pixel-text-secondary bg-pixel-text-secondary/20";
}

function getStatusColor(status: FeedbackStatus): string {
  const colors: Record<FeedbackStatus, string> = {
    new: "text-pixel-accent-cyan border-pixel-accent-cyan bg-pixel-accent-cyan/20",
    reviewed: "text-pixel-accent-yellow border-pixel-accent-yellow bg-pixel-accent-yellow/20",
    in_progress: "text-pixel-accent-green border-pixel-accent-green bg-pixel-accent-green/20",
    resolved: "text-pixel-accent-green border-pixel-accent-green bg-pixel-accent-green/30",
    closed: "text-pixel-text-muted border-pixel-text-muted bg-pixel-text-muted/20",
  };
  return colors[status] || "text-pixel-text-secondary border-pixel-text-secondary bg-pixel-text-secondary/20";
}

function formatStatusLabel(status: FeedbackStatus): string {
  return status.replace("_", " ");
}

export default function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  // Filter state
  const [filterType, setFilterType] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterPlatform, setFilterPlatform] = useState<string>("");
  const [filterFrom, setFilterFrom] = useState<string>("");
  const [filterTo, setFilterTo] = useState<string>("");

  // Edit state for modal
  const [editStatus, setEditStatus] = useState<FeedbackStatus>("new");

  // Stats
  const totalFeedback = feedback.length;
  const newFeedback = feedback.filter((f) => f.status === "new").length;
  const resolvedFeedback = feedback.filter((f) => f.status === "resolved" || f.status === "closed").length;

  // Get unique platforms from feedback device_metadata
  const uniquePlatforms = Array.from(
    new Set(
      feedback
        .map((f) => f.device_metadata?.platform)
        .filter(Boolean)
    )
  ) as string[];

  const fetchFeedback = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterType) params.append("feedback_type", filterType);
      if (filterStatus) params.append("status", filterStatus);
      if (filterPlatform) params.append("platform", filterPlatform);
      if (filterFrom) params.append("from", filterFrom);
      if (filterTo) params.append("to", filterTo);

      const queryString = params.toString();
      const url = `/api/admin/feedback${queryString ? `?${queryString}` : ""}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setFeedback(data.data || []);
    } catch (error) {
      showToast("Failed to load feedback", "error");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [filterType, filterStatus, filterPlatform, filterFrom, filterTo, showToast]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  function openFeedbackModal(item: Feedback) {
    setSelectedFeedback(item);
    setEditStatus(item.status);
  }

  function closeFeedbackModal() {
    setSelectedFeedback(null);
    setEditStatus("new");
  }

  async function handleSave() {
    if (!selectedFeedback) return;

    setSaving(true);
    try {
      const response = await fetch("/api/admin/feedback", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedFeedback.id,
          status: editStatus,
        }),
      });

      if (!response.ok) throw new Error("Failed to update");

      showToast("Feedback updated successfully", "success");
      closeFeedbackModal();
      fetchFeedback();
    } catch (error) {
      showToast("Failed to update feedback", "error");
      console.error(error);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const response = await fetch(`/api/admin/feedback?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete");

      showToast("Feedback deleted", "success");
      setConfirmDelete(null);
      closeFeedbackModal();
      fetchFeedback();
    } catch (error) {
      showToast("Failed to delete feedback", "error");
      console.error(error);
    }
  }

  function clearFilters() {
    setFilterType("");
    setFilterStatus("");
    setFilterPlatform("");
    setFilterFrom("");
    setFilterTo("");
  }

  const hasFilters = filterType || filterStatus || filterPlatform || filterFrom || filterTo;

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      {/* Header with stats */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="font-pixel text-pixel-sm text-pixel-text-primary uppercase">
            Feedback
          </h1>
          <p className="font-mono text-pixel-text-muted text-sm mt-1">
            {totalFeedback} total / {newFeedback} new / {resolvedFeedback} resolved
          </p>
        </div>
      </div>

      {/* Filters */}
      <PixelCard className="mb-6">
        <div className="flex flex-wrap items-end gap-4">
          {/* Type filter */}
          <div className="flex-1 min-w-[140px]">
            <label className="block font-pixel text-pixel-xs text-pixel-text-secondary uppercase mb-2">
              Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full bg-pixel-bg-primary border-2 border-pixel-text-muted text-pixel-text-primary font-mono px-3 py-2 focus:border-pixel-accent-green focus:outline-none"
            >
              <option value="">All Types</option>
              {FEEDBACK_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div className="flex-1 min-w-[140px]">
            <label className="block font-pixel text-pixel-xs text-pixel-text-secondary uppercase mb-2">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-pixel-bg-primary border-2 border-pixel-text-muted text-pixel-text-primary font-mono px-3 py-2 focus:border-pixel-accent-green focus:outline-none"
            >
              <option value="">All Statuses</option>
              {FEEDBACK_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {formatStatusLabel(status).charAt(0).toUpperCase() + formatStatusLabel(status).slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Platform filter */}
          <div className="flex-1 min-w-[140px]">
            <label className="block font-pixel text-pixel-xs text-pixel-text-secondary uppercase mb-2">
              Platform
            </label>
            <select
              value={filterPlatform}
              onChange={(e) => setFilterPlatform(e.target.value)}
              className="w-full bg-pixel-bg-primary border-2 border-pixel-text-muted text-pixel-text-primary font-mono px-3 py-2 focus:border-pixel-accent-green focus:outline-none"
            >
              <option value="">All Platforms</option>
              {uniquePlatforms.map((platform) => (
                <option key={platform} value={platform}>
                  {platform}
                </option>
              ))}
            </select>
          </div>

          {/* Date range */}
          <div className="flex-1 min-w-[140px]">
            <label className="block font-pixel text-pixel-xs text-pixel-text-secondary uppercase mb-2">
              From
            </label>
            <input
              type="date"
              value={filterFrom}
              onChange={(e) => setFilterFrom(e.target.value)}
              className="w-full bg-pixel-bg-primary border-2 border-pixel-text-muted text-pixel-text-primary font-mono px-3 py-2 focus:border-pixel-accent-green focus:outline-none"
            />
          </div>

          <div className="flex-1 min-w-[140px]">
            <label className="block font-pixel text-pixel-xs text-pixel-text-secondary uppercase mb-2">
              To
            </label>
            <input
              type="date"
              value={filterTo}
              onChange={(e) => setFilterTo(e.target.value)}
              className="w-full bg-pixel-bg-primary border-2 border-pixel-text-muted text-pixel-text-primary font-mono px-3 py-2 focus:border-pixel-accent-green focus:outline-none"
            />
          </div>

          {/* Clear filters */}
          {hasFilters && (
            <PixelButton variant="ghost" size="sm" onClick={clearFilters}>
              Clear
            </PixelButton>
          )}
        </div>
      </PixelCard>

      {/* Feedback List */}
      <div className="space-y-2">
        {feedback.length === 0 ? (
          <PixelCard className="text-center py-8">
            <p className="text-pixel-text-muted font-mono">
              {hasFilters ? "No feedback matches the filters." : "No feedback received yet."}
            </p>
          </PixelCard>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-pixel-text-muted">
                  <th className="font-pixel text-pixel-xs text-pixel-text-secondary uppercase text-left py-3 px-4">
                    Type
                  </th>
                  <th className="font-pixel text-pixel-xs text-pixel-text-secondary uppercase text-left py-3 px-4">
                    Description
                  </th>
                  <th className="font-pixel text-pixel-xs text-pixel-text-secondary uppercase text-left py-3 px-4">
                    Status
                  </th>
                  <th className="font-pixel text-pixel-xs text-pixel-text-secondary uppercase text-left py-3 px-4">
                    Platform
                  </th>
                  <th className="font-pixel text-pixel-xs text-pixel-text-secondary uppercase text-left py-3 px-4">
                    Date
                  </th>
                  <th className="font-pixel text-pixel-xs text-pixel-text-secondary uppercase text-right py-3 px-4">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {feedback.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-pixel-bg-card hover:bg-pixel-bg-card transition-colors cursor-pointer"
                    onClick={() => openFeedbackModal(item)}
                  >
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center font-pixel text-pixel-xs uppercase px-2 py-1 border ${getTypeColor(item.feedback_type)}`}
                      >
                        {item.feedback_type}
                      </span>
                    </td>
                    <td className="font-mono text-pixel-text-primary py-3 px-4 max-w-[300px]">
                      {truncate(item.description, 60)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center font-pixel text-pixel-xs uppercase px-2 py-1 border ${getStatusColor(item.status)}`}
                      >
                        {formatStatusLabel(item.status)}
                      </span>
                    </td>
                    <td className="font-mono text-pixel-text-muted text-sm py-3 px-4">
                      {item.device_metadata?.platform || "-"}
                    </td>
                    <td className="font-mono text-pixel-text-muted text-sm py-3 px-4">
                      {formatDate(item.submitted_at)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <PixelButton
                          size="sm"
                          variant="ghost"
                          onClick={() => openFeedbackModal(item)}
                        >
                          View
                        </PixelButton>
                        <PixelButton
                          size="sm"
                          variant="danger"
                          onClick={() => setConfirmDelete(item.id)}
                        >
                          Delete
                        </PixelButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Feedback Detail Modal */}
      <Modal
        isOpen={!!selectedFeedback}
        onClose={closeFeedbackModal}
        title="Feedback Details"
      >
        {selectedFeedback && (
          <div className="space-y-6">
            {/* Type and Status badges */}
            <div className="flex gap-3">
              <span
                className={`inline-flex items-center font-pixel text-pixel-xs uppercase px-2 py-1 border ${getTypeColor(selectedFeedback.feedback_type)}`}
              >
                {selectedFeedback.feedback_type}
              </span>
              <span
                className={`inline-flex items-center font-pixel text-pixel-xs uppercase px-2 py-1 border ${getStatusColor(selectedFeedback.status)}`}
              >
                {formatStatusLabel(selectedFeedback.status)}
              </span>
            </div>

            {/* Description */}
            <div>
              <label className="block font-pixel text-pixel-xs text-pixel-text-secondary uppercase mb-2">
                Description
              </label>
              <div className="bg-pixel-bg-primary border-2 border-pixel-text-muted p-3">
                <p className="font-mono text-pixel-text-primary whitespace-pre-wrap">
                  {selectedFeedback.description}
                </p>
              </div>
            </div>

            {/* Status selector */}
            <div>
              <label className="block font-pixel text-pixel-xs text-pixel-text-secondary uppercase mb-2">
                Update Status
              </label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as FeedbackStatus)}
                className="w-full bg-pixel-bg-primary border-2 border-pixel-text-muted text-pixel-text-primary font-mono px-3 py-2 focus:border-pixel-accent-green focus:outline-none"
              >
                {FEEDBACK_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {formatStatusLabel(status).charAt(0).toUpperCase() + formatStatusLabel(status).slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Device Metadata */}
            <div>
              <label className="block font-pixel text-pixel-xs text-pixel-text-secondary uppercase mb-2">
                Device Info
              </label>
              <div className="bg-pixel-bg-primary border-2 border-pixel-text-muted p-3 space-y-2">
                <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                  <div>
                    <span className="text-pixel-text-muted">Platform:</span>{" "}
                    <span className="text-pixel-text-primary">{selectedFeedback.device_metadata?.platform || "-"}</span>
                  </div>
                  <div>
                    <span className="text-pixel-text-muted">Game Version:</span>{" "}
                    <span className="text-pixel-text-primary">{selectedFeedback.device_metadata?.game_version || "-"}</span>
                  </div>
                  <div>
                    <span className="text-pixel-text-muted">Unity:</span>{" "}
                    <span className="text-pixel-text-primary">{selectedFeedback.device_metadata?.unity_version || "-"}</span>
                  </div>
                  <div>
                    <span className="text-pixel-text-muted">Resolution:</span>{" "}
                    <span className="text-pixel-text-primary">{selectedFeedback.device_metadata?.screen_resolution || "-"}</span>
                  </div>
                  <div>
                    <span className="text-pixel-text-muted">OS:</span>{" "}
                    <span className="text-pixel-text-primary">{selectedFeedback.device_metadata?.os || "-"}</span>
                  </div>
                  <div>
                    <span className="text-pixel-text-muted">Language:</span>{" "}
                    <span className="text-pixel-text-primary">{selectedFeedback.device_metadata?.system_language || "-"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Timestamps */}
            <div className="text-sm font-mono text-pixel-text-muted space-y-1">
              <p>Submitted: {formatDateTime(selectedFeedback.submitted_at)}</p>
              <p>Updated: {formatDateTime(selectedFeedback.updated_at)}</p>
            </div>

            {/* Action buttons */}
            <div className="flex justify-between gap-4 pt-4 border-t border-pixel-text-muted">
              <PixelButton
                variant="danger"
                onClick={() => setConfirmDelete(selectedFeedback.id)}
              >
                Delete
              </PixelButton>
              <div className="flex gap-3">
                <PixelButton variant="secondary" onClick={closeFeedbackModal}>
                  Cancel
                </PixelButton>
                <PixelButton onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </PixelButton>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
        title="Delete Feedback"
        message="Are you sure you want to delete this feedback? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
