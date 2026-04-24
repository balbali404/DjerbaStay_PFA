"use client";

import { useCallback, useEffect, useState } from "react";
import Icon from "@/components/Icon";
import { fetchHotelPendingReservations, type HotelReservation } from "@/lib/backendApi";

const PAGE_SIZE = 10;

export default function PendingApprovalsPage() {
  const [reservations, setReservations] = useState<HotelReservation[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [notes, setNotes] = useState("");

  const load = useCallback(
    async (p: number) => {
      try {
        setLoading(true);
        setError(null);
        const result = await fetchHotelPendingReservations({ limit: PAGE_SIZE, page: p });
        setReservations(result.data);
        setTotal(result.total);
        setPage(result.page);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load pending reservations");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    load(1);
  }, [load]);

  function handlePageChange(newPage: number) {
    load(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleApprove(requestId: string) {
    try {
      setApproving(true);
      const response = await fetch(`/api/hotel-reservations/${requestId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });

      if (!response.ok) throw new Error("Failed to approve reservation");
      
      setReservations(reservations.filter((r) => r.id !== requestId));
      setSelectedId(null);
      setNotes("");
      setTotal(total - 1);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error approving reservation");
    } finally {
      setApproving(false);
    }
  }

  async function handleReject(requestId: string) {
    try {
      setRejecting(true);
      const response = await fetch(`/api/hotel-reservations/${requestId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: notes }),
      });

      if (!response.ok) throw new Error("Failed to reject reservation");
      
      setReservations(reservations.filter((r) => r.id !== requestId));
      setSelectedId(null);
      setNotes("");
      setTotal(total - 1);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error rejecting reservation");
    } finally {
      setRejecting(false);
    }
  }

  const selected = reservations.find((r) => r.id === selectedId);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Pending Approvals</h1>
          <p className="mt-1 text-sm text-slate-500">
            {total > 0 ? `${total} reservation${total !== 1 ? "s" : ""} awaiting approval` : "No pending reservations"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reservations List */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
              <p className="font-semibold text-red-700">{error}</p>
              <button
                onClick={() => load(page)}
                className="mt-3 text-sm font-semibold text-red-600 underline"
              >
                Retry
              </button>
            </div>
          ) : reservations.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-12 text-center">
              <Icon name="check_circle" className="size-8 text-primary mx-auto mb-3" />
              <p className="font-semibold text-slate-700">All caught up!</p>
              <p className="text-sm text-slate-500 mt-1">No pending reservations to review</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {reservations.map((reservation) => (
                  <button
                    key={reservation.id}
                    onClick={() => setSelectedId(reservation.id)}
                    className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
                      selectedId === reservation.id
                        ? "border-primary bg-primary/5"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{reservation.user?.fullName}</p>
                        <p className="text-sm text-slate-500">{reservation.user?.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-700">{reservation.days} days</p>
                        <p className="text-xs text-slate-500">{reservation.persons} persons</p>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-slate-600 line-clamp-1">
                      {reservation.interests || "No interests specified"}
                    </p>
                  </button>
                ))}
              </div>

              {/* Pagination */}
              {Math.ceil(total / PAGE_SIZE) > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ← Previous
                  </button>
                  <p className="text-sm text-slate-600">
                    Page {page} of {Math.ceil(total / PAGE_SIZE)}
                  </p>
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= Math.ceil(total / PAGE_SIZE)}
                    className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Details Panel */}
        <div className="lg:col-span-1">
          {selected ? (
            <div className="sticky top-32 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Guest Details</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-slate-500">Name</p>
                    <p className="font-semibold text-slate-900">{selected.user?.fullName}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Email</p>
                    <p className="font-semibold text-slate-900 break-all">{selected.user?.email}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Trip Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Duration</span>
                    <span className="font-semibold">{selected.days} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Group Size</span>
                    <span className="font-semibold">{selected.persons} persons</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Budget Level</span>
                    <span className="font-semibold">
                      {selected.budgetLevel === 1 ? "Budget ($)" : selected.budgetLevel === 2 ? "Standard ($$)" : "Premium ($$$)"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Transport</span>
                    <span className="font-semibold capitalize">{selected.transport}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Notes {selected.approvalStatus === "APPROVED" && "(Approval Notes)"}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={
                    selected.approvalStatus === "PENDING"
                      ? "Add approval notes or rejection reason..."
                      : selected.approvalStatus === "APPROVED"
                      ? "Approval notes..."
                      : "Rejection reason..."
                  }
                  className="w-full h-24 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none resize-none"
                  disabled={selected.approvalStatus !== "PENDING"}
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleApprove(selected.id)}
                  disabled={approving || selected.approvalStatus !== "PENDING"}
                  className="flex-1 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Icon name="check" className="size-4" />
                  {approving ? "Approving..." : "Approve"}
                </button>
                <button
                  onClick={() => handleReject(selected.id)}
                  disabled={rejecting || selected.approvalStatus !== "PENDING"}
                  className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Icon name="close" className="size-4" />
                  {rejecting ? "Rejecting..." : "Reject"}
                </button>
              </div>

              {selected.approvalStatus !== "PENDING" && (
                <div className={`rounded-lg p-3 text-sm font-semibold text-center ${
                  selected.approvalStatus === "APPROVED"
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}>
                  {selected.approvalStatus === "APPROVED" ? "✓ Approved" : "✗ Rejected"}
                </div>
              )}

              <button
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = `/api/hotel-reservations/${selected.id}/invoice`;
                  link.download = `DjerbaStay-Facture-${selected.id}.pdf`;
                  link.click();
                }}
                className="w-full px-4 py-2 rounded-lg border border-primary bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                <Icon name="file_download" className="size-4" />
                Download Invoice
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
              <Icon name="info" className="size-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-600">Select a reservation to view details and approve/reject</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
