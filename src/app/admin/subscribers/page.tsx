"use client";

import { useEffect, useState } from "react";
import {
  PixelButton,
  PixelCard,
  LoadingSpinner,
  Modal,
  ConfirmModal,
  useToast,
  PixelInput,
} from "@/components/ui";
import { formatDate } from "@/lib/utils";
import type { Subscriber } from "@/types";

export default function AdminSubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [sendEmailModal, setSendEmailModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailContent, setEmailContent] = useState("");
  const [sending, setSending] = useState(false);
  const { showToast } = useToast();

  const activeSubscribers = subscribers.filter((s) => s.is_active);

  useEffect(() => {
    fetchSubscribers();
  }, []);

  async function fetchSubscribers() {
    try {
      const response = await fetch("/api/admin/subscribers");
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setSubscribers(data.data || []);
    } catch (error) {
      showToast("Failed to load subscribers", "error");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleStatus(subscriber: Subscriber) {
    try {
      const response = await fetch("/api/admin/subscribers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: subscriber.id,
          is_active: !subscriber.is_active,
        }),
      });

      if (!response.ok) throw new Error("Failed to update");

      showToast(
        subscriber.is_active ? "Subscriber deactivated" : "Subscriber activated",
        "success"
      );
      fetchSubscribers();
    } catch (error) {
      showToast("Failed to update subscriber", "error");
      console.error(error);
    }
  }

  async function handleDelete(id: string) {
    try {
      const response = await fetch(`/api/admin/subscribers?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete");

      showToast("Subscriber removed", "success");
      setConfirmDelete(null);
      fetchSubscribers();
    } catch (error) {
      showToast("Failed to delete subscriber", "error");
      console.error(error);
    }
  }

  async function handleSendEmail() {
    if (!emailSubject || !emailContent) {
      showToast("Please fill in subject and content", "error");
      return;
    }

    if (activeSubscribers.length === 0) {
      showToast("No active subscribers to send to", "error");
      return;
    }

    setSending(true);
    try {
      const response = await fetch("/api/newsletter/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: emailSubject,
          content: emailContent,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send emails");
      }

      showToast(`Email sent to ${data.sentCount} subscribers`, "success");
      setSendEmailModal(false);
      setEmailSubject("");
      setEmailContent("");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to send emails",
        "error"
      );
    } finally {
      setSending(false);
    }
  }

  function exportCSV() {
    const headers = ["Email", "Status", "Subscribed At"];
    const rows = subscribers.map((s) => [
      s.email,
      s.is_active ? "Active" : "Inactive",
      s.subscribed_at,
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `subscribers-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    showToast("CSV exported", "success");
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="font-pixel text-pixel-sm text-pixel-text-primary uppercase">
            Subscribers
          </h1>
          <p className="font-mono text-pixel-text-muted text-sm mt-1">
            {activeSubscribers.length} active / {subscribers.length} total
          </p>
        </div>
        <div className="flex gap-2">
          <PixelButton variant="secondary" onClick={exportCSV}>
            Export CSV
          </PixelButton>
          <PixelButton onClick={() => setSendEmailModal(true)}>
            Send Email
          </PixelButton>
        </div>
      </div>

      {/* Subscribers List */}
      <div className="space-y-2">
        {subscribers.length === 0 ? (
          <PixelCard className="text-center">
            <p className="text-pixel-text-muted font-mono">
              No subscribers yet.
            </p>
          </PixelCard>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-pixel-text-muted">
                  <th className="font-pixel text-pixel-xs text-pixel-text-secondary uppercase text-left py-3 px-4">
                    Email
                  </th>
                  <th className="font-pixel text-pixel-xs text-pixel-text-secondary uppercase text-left py-3 px-4">
                    Status
                  </th>
                  <th className="font-pixel text-pixel-xs text-pixel-text-secondary uppercase text-left py-3 px-4">
                    Subscribed
                  </th>
                  <th className="font-pixel text-pixel-xs text-pixel-text-secondary uppercase text-right py-3 px-4">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((subscriber) => (
                  <tr
                    key={subscriber.id}
                    className="border-b border-pixel-bg-card hover:bg-pixel-bg-card transition-colors"
                  >
                    <td className="font-mono text-pixel-text-primary py-3 px-4">
                      {subscriber.email}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-mono text-sm ${
                          subscriber.is_active
                            ? "text-pixel-accent-green"
                            : "text-pixel-accent-red"
                        }`}
                      >
                        {subscriber.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="font-mono text-pixel-text-muted text-sm py-3 px-4">
                      {formatDate(subscriber.subscribed_at)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <PixelButton
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleStatus(subscriber)}
                        >
                          {subscriber.is_active ? "Deactivate" : "Activate"}
                        </PixelButton>
                        <PixelButton
                          size="sm"
                          variant="danger"
                          onClick={() => setConfirmDelete(subscriber.id)}
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

      {/* Send Email Modal */}
      <Modal
        isOpen={sendEmailModal}
        onClose={() => setSendEmailModal(false)}
        title="Send Newsletter"
      >
        <div className="space-y-4">
          <p className="font-mono text-pixel-text-secondary text-sm">
            This will send an email to {activeSubscribers.length} active
            subscribers.
          </p>

          <PixelInput
            label="Subject"
            placeholder="Email subject..."
            value={emailSubject}
            onChange={(e) => setEmailSubject(e.target.value)}
          />

          <div>
            <label className="block font-pixel text-pixel-xs text-pixel-text-secondary uppercase mb-2">
              Content
            </label>
            <textarea
              value={emailContent}
              onChange={(e) => setEmailContent(e.target.value)}
              placeholder="Write your newsletter content..."
              rows={8}
              className="w-full bg-pixel-bg-primary border-2 border-pixel-text-muted text-pixel-text-primary font-mono px-3 py-2 focus:border-pixel-accent-green focus:outline-none resize-none"
            />
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <PixelButton
              variant="secondary"
              onClick={() => setSendEmailModal(false)}
            >
              Cancel
            </PixelButton>
            <PixelButton
              onClick={handleSendEmail}
              disabled={sending || activeSubscribers.length === 0}
            >
              {sending ? "Sending..." : `Send to ${activeSubscribers.length}`}
            </PixelButton>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
        title="Remove Subscriber"
        message="Are you sure you want to remove this subscriber? This action cannot be undone."
        confirmText="Remove"
        variant="danger"
      />
    </div>
  );
}
