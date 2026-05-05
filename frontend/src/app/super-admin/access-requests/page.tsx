"use client";

import { useState } from "react";
import { Screen } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { SkeletonList } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  FormErrorBanner,
  TextInput,
  formikFieldState,
} from "@/components/forms/system";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  useListModuleAccessRequestsQuery,
  useApproveModuleAccessRequestMutation,
  useRejectModuleAccessRequestMutation,
  type ModuleAccessRequest,
} from "@/features/module-access/module-access-api";

const STATUS_FILTERS = [
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "All", value: "" },
];

const MODULE_LABELS: Record<string, string> = {
  loans: "Loan Management",
  udhaar: "UdhaarBook",
  jewellery: "Jewellery ERP",
};

function statusBadge(s: string) {
  if (s === "pending") return <Badge variant="warning">Pending</Badge>;
  if (s === "approved") return <Badge variant="success">Approved</Badge>;
  return <Badge variant="danger">Rejected</Badge>;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const rejectSchema = Yup.object({
  reason: Yup.string().trim().min(5, "Reason must be at least 5 characters").required("Rejection reason is required"),
});

export default function AccessRequestsPage() {
  const [statusFilter, setStatusFilter] = useState("pending");
  const [rejectTarget, setRejectTarget] = useState<ModuleAccessRequest | null>(null);

  const { data: requests, isLoading } = useListModuleAccessRequestsQuery(
    statusFilter ? { status: statusFilter } : undefined,
  );
  const [approve, { isLoading: isApproving }] = useApproveModuleAccessRequestMutation();
  const [reject, { isLoading: isRejecting }] = useRejectModuleAccessRequestMutation();

  const handleApprove = async (req: ModuleAccessRequest) => {
    await approve(req.id).unwrap();
  };

  const rejectFormik = useFormik({
    initialValues: { reason: "" },
    validationSchema: rejectSchema,
    validateOnBlur: true,
    validateOnChange: true,
    onSubmit: async (values, helpers) => {
      if (!rejectTarget) return;
      helpers.setStatus(undefined);
      try {
        await reject({ id: rejectTarget.id, reason: values.reason.trim() }).unwrap();
        setRejectTarget(null);
        helpers.resetForm();
      } catch {
        helpers.setStatus({ formError: "Failed to reject. Please try again." });
      } finally {
        helpers.setSubmitting(false);
      }
    },
  });

  const reasonState = formikFieldState(rejectFormik, "reason");

  const openReject = (req: ModuleAccessRequest) => {
    setRejectTarget(req);
    rejectFormik.resetForm();
  };

  return (
    <Screen title="Module Access Requests" subtitle="Review and respond to tenant module access requests">
      {/* Status filter tabs */}
      <div className="flex gap-1 p-1 bg-surface rounded-xl border border-border mb-5 overflow-x-auto">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setStatusFilter(f.value)}
            className={`flex-1 min-w-max px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              statusFilter === f.value
                ? "bg-primary-600 text-white shadow-sm"
                : "text-muted hover:text-text"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading && <SkeletonList count={4} />}

      {!isLoading && (!requests || requests.length === 0) && (
        <EmptyState
          title="No requests found"
          description={statusFilter === "pending" ? "No pending access requests at the moment." : "No requests match this filter."}
        />
      )}

      <div className="space-y-3">
        {(requests ?? []).map((req) => (
          <div key={req.id} className="app-panel p-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-primary flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                {req.user.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-text text-sm">{req.user.full_name}</p>
                  {statusBadge(req.status)}
                </div>
                <p className="text-xs text-muted">{req.user.mobile_number}</p>
                {req.user.branch_name && (
                  <p className="text-xs text-muted">{req.user.branch_name}</p>
                )}
                <p className="text-xs text-muted mt-1">
                  Requested <span className="font-medium text-text">{MODULE_LABELS[req.module] ?? req.module}</span>
                  {" · "}
                  {formatDate(req.created_at)}
                </p>
                {req.status === "rejected" && req.rejection_reason && (
                  <div className="mt-2 rounded-lg bg-danger-50 border border-danger-200 px-3 py-2">
                    <p className="text-xs text-danger-700">
                      <span className="font-semibold">Rejection reason:</span> {req.rejection_reason}
                    </p>
                  </div>
                )}
                {req.reviewed_by && (
                  <p className="text-xs text-muted mt-1">
                    Reviewed by {req.reviewed_by.full_name}
                    {req.reviewed_at ? ` · ${formatDate(req.reviewed_at)}` : ""}
                  </p>
                )}
              </div>
            </div>

            {req.status === "pending" && (
              <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                <Button
                  size="xs"
                  variant="success"
                  fullWidth={false}
                  onClick={() => handleApprove(req)}
                  loading={isApproving}
                  disabled={isApproving || isRejecting}
                  type="button"
                >
                  Approve
                </Button>
                <Button
                  size="xs"
                  variant="danger"
                  fullWidth={false}
                  onClick={() => openReject(req)}
                  disabled={isApproving || isRejecting}
                  type="button"
                >
                  Reject
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Reject Modal */}
      <Modal
        open={rejectTarget !== null}
        onClose={() => setRejectTarget(null)}
        title="Reject Access Request"
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              fullWidth={false}
              onClick={() => setRejectTarget(null)}
              type="button"
              disabled={rejectFormik.isSubmitting || isRejecting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              fullWidth={false}
              type="submit"
              form="reject-form"
              loading={rejectFormik.isSubmitting || isRejecting}
              disabled={rejectFormik.isSubmitting || isRejecting}
            >
              Reject Request
            </Button>
          </>
        }
      >
        <form id="reject-form" className="space-y-4" onSubmit={rejectFormik.handleSubmit} noValidate>
          <p className="text-sm text-muted">
            Rejecting <strong>{rejectTarget?.user.full_name}</strong>&apos;s request for{" "}
            <strong>{MODULE_LABELS[rejectTarget?.module ?? ""] ?? rejectTarget?.module}</strong>.
            The user will be notified with your reason.
          </p>
          <FormErrorBanner message={(rejectFormik.status as { formError?: string } | undefined)?.formError} />
          <TextInput
            label="Rejection Reason"
            name="reason"
            value={rejectFormik.values.reason}
            onChange={rejectFormik.handleChange}
            onBlur={rejectFormik.handleBlur}
            touched={reasonState.touched}
            error={reasonState.error}
            placeholder="Explain why this request is being rejected…"
            required
          />
        </form>
      </Modal>
    </Screen>
  );
}
