"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useFormik } from "formik";
import * as Yup from "yup";

import { CustomerSearchSelect } from "@/components/jewellery/shared/CustomerSearchSelect";
import { Screen } from "@/components/layout/Screen";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { PlusIcon } from "@/components/ui/icons";
import { orderStatusVariant } from "@/constants/jewellery";
import { DatePicker } from "@/components/ui/DatePicker";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { SkeletonList } from "@/components/ui/Skeleton";
import { Textarea } from "@/components/ui/Textarea";
import { ROUTES } from "@/lib/routes";
import type {
  JwlKarigar,
  JwlCustomerOrder,
  JwlKarigarIssue,
  JwlKarigarReceipt,
  OrderStatus,
} from "@/store/jewellery-api";
import {
  useListKarigarsQuery,
  useGetKarigarQuery,
  useCreateKarigarMutation,
  useUpdateKarigarMutation,
  useListOrdersQuery,
  useCreateOrderMutation,
  useAdvanceOrderStatusMutation,
  useListKarigarIssuesQuery,
  useCreateKarigarIssueMutation,
  useListKarigarReceiptsQuery,
  useCreateKarigarReceiptMutation,
  useListMetalsQuery,
  useListPuritiesQuery,
} from "@/store/jewellery-api";

// ─── Types ────────────────────────────────────────────────────────────────────

type KarigarView = "karigars" | "orders" | "issues" | "receipts";

const ORDER_STATUSES: OrderStatus[] = [
  "BOOKED", "METAL_ISSUED", "WIP", "KARIGAR_RECEIVED",
  "QC", "HALLMARKED", "READY", "DELIVERED", "CLOSED", "CANCELLED",
];

// ─── Tab bar ──────────────────────────────────────────────────────────────────

const TABS: { key: KarigarView; label: string }[] = [
  { key: "karigars", label: "Karigars" },
  { key: "orders", label: "Orders" },
  { key: "issues", label: "Issues" },
  { key: "receipts", label: "Receipts" },
];

function TabBar({ activeView }: Readonly<{ activeView: KarigarView }>) {
  const router = useRouter();
  return (
    <div className="flex gap-1 border-b border-border mb-4 overflow-x-auto">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => router.push(`/jewellery/karigar?view=${tab.key}`)}
          className={[
            "px-4 py-2 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors -mb-px",
            activeView === tab.key
              ? "border-primary-500 text-primary-600"
              : "border-transparent text-muted hover:text-text",
          ].join(" ")}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ─── Karigar View ─────────────────────────────────────────────────────────────

const karigarSchema = Yup.object({
  name: Yup.string().required("Name is required"),
  mobile: Yup.string().required("Mobile is required").matches(/^(\\+91)?[0-9]{10}$/, "Enter a valid 10-digit mobile"),
  specialization: Yup.string(),
  default_labour_rate: Yup.string(),
  default_wastage_pct: Yup.string(),
  kyc_pan: Yup.string().test("pan", "Invalid PAN format", (value) => !value || /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(value)),
  kyc_aadhaar_masked: Yup.string(),
});

function KarigarRow({
  karigar,
  onEdit,
}: Readonly<{ karigar: JwlKarigar; onEdit: (id: string) => void }>) {
  return (
    <div className="app-panel p-4 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="font-semibold text-text">{karigar.name}</p>
        <p className="text-xs text-muted mt-0.5">
          {karigar.mobile}
          {karigar.specialization ? <><span className="mx-1.5">·</span>{karigar.specialization}</> : null}
        </p>
        {karigar.code ? <p className="text-xs text-muted mt-0.5">Code: {karigar.code}</p> : null}
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={karigar.is_active ? "success" : "warning"}>
          {karigar.is_active ? "Active" : "Inactive"}
        </Badge>
        <Button type="button" size="xs" variant="secondary" onClick={() => onEdit(karigar.id)}>
          Edit
        </Button>
      </div>
    </div>
  );
}

function KarigarsView() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string>("");
  const [editOpen, setEditOpen] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const { data, isFetching } = useListKarigarsQuery({});
  const { data: editingKarigar } = useGetKarigarQuery(editingId, { skip: !editingId });
  const [createKarigar, createState] = useCreateKarigarMutation();
  const [updateKarigar, updateState] = useUpdateKarigarMutation();

  const formik = useFormik({
    initialValues: {
      name: "",
      mobile: "",
      specialization: "",
      default_labour_rate: "",
      default_wastage_pct: "",
      kyc_pan: "",
      kyc_aadhaar_masked: "",
    },
    validationSchema: karigarSchema,
    onSubmit: async (values, helpers) => {
      const payload: Record<string, string> = {
        name: values.name,
        mobile: values.mobile,
        specialization: values.specialization,
        default_wastage_pct: values.default_wastage_pct || "0",
      };
      if (values.default_labour_rate.trim()) {
        payload.default_labour_rate = values.default_labour_rate;
      }
      if (values.kyc_pan.trim()) {
        payload.kyc_pan = values.kyc_pan.toUpperCase();
      }
      if (values.kyc_aadhaar_masked.trim()) {
        payload.kyc_aadhaar_masked = values.kyc_aadhaar_masked;
      }
      await createKarigar(payload).unwrap();
      helpers.resetForm();
      setShowForm(false);
    },
  });

  const karigars = data?.results ?? [];

  const editFormik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: editingKarigar?.name ?? "",
      mobile: editingKarigar?.mobile ?? "",
      specialization: editingKarigar?.specialization ?? "",
      default_labour_rate: editingKarigar?.default_labour_rate ?? "",
      default_wastage_pct: editingKarigar?.default_wastage_pct ?? "",
      kyc_pan: editingKarigar?.kyc_pan ?? "",
      kyc_aadhaar_masked: editingKarigar?.kyc_aadhaar_masked ?? "",
      is_active: editingKarigar?.is_active ?? true,
    },
    validationSchema: karigarSchema,
    onSubmit: async (values) => {
      if (!editingId) return;
      setEditError(null);
      try {
        const payload: Record<string, string | boolean | null> = {
          name: values.name,
          mobile: values.mobile,
          specialization: values.specialization,
          default_wastage_pct: values.default_wastage_pct || "0",
          is_active: values.is_active,
        };
        if (values.default_labour_rate.trim()) {
          payload.default_labour_rate = values.default_labour_rate;
        } else {
          payload.default_labour_rate = null;
        }
        if (values.kyc_pan.trim()) {
          payload.kyc_pan = values.kyc_pan.toUpperCase();
        } else {
          payload.kyc_pan = "";
        }
        if (values.kyc_aadhaar_masked.trim()) {
          payload.kyc_aadhaar_masked = values.kyc_aadhaar_masked;
        } else {
          payload.kyc_aadhaar_masked = "";
        }
        await updateKarigar({
          id: editingId,
          ...payload,
        }).unwrap();
        setEditOpen(false);
      } catch {
        setEditError("Could not update karigar. Please verify values and try again.");
      }
    },
  });

  return (
    <>
      <div className="flex items-center justify-between gap-2 mb-4">
        <p className="text-sm text-muted">{karigars.length} karigar{karigars.length !== 1 ? "s" : ""}</p>
        <Button size="sm" onClick={() => setShowForm((p) => !p)} leftIcon={showForm ? undefined : <PlusIcon />}>
          {showForm ? "Cancel" : "Add Karigar"}
        </Button>
      </div>

      {showForm && (
        <div className="app-panel p-4 mb-4">
          <h3 className="text-sm font-semibold text-text mb-3">New Karigar</h3>
          <form onSubmit={formik.handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Name"
                required
                {...formik.getFieldProps("name")}
                error={formik.touched.name ? formik.errors.name : undefined}
              />
              <Input
                label="Mobile"
                required
                {...formik.getFieldProps("mobile")}
                error={formik.touched.mobile ? formik.errors.mobile : undefined}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Specialization"
                placeholder="e.g. Gold bangles"
                {...formik.getFieldProps("specialization")}
              />
              <Input
                label="Default wastage %"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...formik.getFieldProps("default_wastage_pct")}
              />
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <Button type="button" variant="secondary" size="sm" onClick={() => { setShowForm(false); formik.resetForm(); }}>
                Cancel
              </Button>
              <Button type="submit" size="sm" loading={createState.isLoading}>
                Save Karigar
              </Button>
            </div>
          </form>
        </div>
      )}

      {isFetching && <SkeletonList count={4} />}

      {!isFetching && karigars.length === 0 ? (
        <EmptyState
          title="No karigars found"
          description="Add your first karigar to start tracking work assignments."
          action={{ label: "Add Karigar", onClick: () => setShowForm(true) }}
        />
      ) : null}

      <div className="space-y-3">
        {karigars.map((k) => (
          <KarigarRow
            key={k.id}
            karigar={k}
            onEdit={(id) => {
              setEditingId(id);
              setEditOpen(true);
              setEditError(null);
            }}
          />
        ))}
      </div>

      <Drawer
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setEditError(null);
        }}
        title={editingKarigar ? `Edit — ${editingKarigar.name}` : "Edit Karigar"}
        size="2xl"
        footer={(
          <>
            <Button type="button" size="sm" variant="secondary" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={() => void editFormik.submitForm()} loading={updateState.isLoading}>
              Save changes
            </Button>
          </>
        )}
      >
        {editError ? (
          <div className="rounded-xl border border-danger-200 bg-danger-50 text-danger-700 text-sm px-3 py-2 mb-3">
            {editError}
          </div>
        ) : null}
        <form className="space-y-3" onSubmit={editFormik.handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Name"
              required
              {...editFormik.getFieldProps("name")}
              error={editFormik.touched.name ? editFormik.errors.name : undefined}
            />
            <Input
              label="Mobile"
              required
              {...editFormik.getFieldProps("mobile")}
              error={editFormik.touched.mobile ? editFormik.errors.mobile : undefined}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Specialization" {...editFormik.getFieldProps("specialization")} />
            <Input
              label="Default wastage %"
              type="number"
              step="0.01"
              {...editFormik.getFieldProps("default_wastage_pct")}
              error={editFormik.touched.default_wastage_pct ? editFormik.errors.default_wastage_pct : undefined}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Default labour rate"
              type="number"
              step="0.01"
              {...editFormik.getFieldProps("default_labour_rate")}
            />
            <Input
              label="KYC PAN"
              {...editFormik.getFieldProps("kyc_pan")}
              onChange={(e) => editFormik.setFieldValue("kyc_pan", e.target.value.toUpperCase())}
              error={editFormik.touched.kyc_pan ? editFormik.errors.kyc_pan : undefined}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Code" value={editingKarigar?.code ?? ""} disabled />
            <Input
              label="Aadhaar last 4"
              {...editFormik.getFieldProps("kyc_aadhaar_masked")}
            />
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-text">
            <input
              type="checkbox"
              className="h-4 w-4 accent-primary"
              checked={Boolean(editFormik.values.is_active)}
              onChange={(e) => editFormik.setFieldValue("is_active", e.target.checked)}
            />
            Active (disable to stop new assignments)
          </label>
        </form>
      </Drawer>
    </>
  );
}

// ─── Orders View ──────────────────────────────────────────────────────────────

const orderSchema = Yup.object({
  customer: Yup.string().required("Customer is required"),
  karigar: Yup.string(),
  notes: Yup.string().required("Description is required"),
  expected_delivery: Yup.string(),
});

function OrderRow({
  order,
  onAdvance,
}: Readonly<{ order: JwlCustomerOrder; onAdvance: (order: JwlCustomerOrder) => void }>) {
  return (
    <div className="app-panel p-4 flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <p className="font-semibold text-text">{order.order_no}</p>
          <Badge variant={orderStatusVariant(order.status)}>{order.status.replaceAll("_", " ")}</Badge>
        </div>
        <p className="text-sm text-muted truncate">{order.customer_name}</p>
        {order.notes ? <p className="text-xs text-muted mt-1 line-clamp-1">{order.notes}</p> : null}
        <p className="text-xs text-muted mt-1">{order.order_date}</p>
      </div>
      <Button
        size="xs"
        variant="secondary"
        onClick={() => onAdvance(order)}
        disabled={order.status === "DELIVERED" || order.status === "CLOSED" || order.status === "CANCELLED"}
      >
        Advance
      </Button>
    </div>
  );
}

const advanceStatusSchema = Yup.object({
  status: Yup.string().required("Select a status"),
});

function OrdersView() {
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("");
  const [showCreate, setShowCreate] = useState(false);
  const [advanceOrder, setAdvanceOrder] = useState<JwlCustomerOrder | null>(null);

  const { data: ordersData, isFetching } = useListOrdersQuery({
    status: statusFilter || undefined,
  });
  const { data: karigarsData } = useListKarigarsQuery({ active_only: true });

  const [createOrder, createState] = useCreateOrderMutation();
  const [advanceStatus, advanceState] = useAdvanceOrderStatusMutation();

  const orders = ordersData?.results ?? [];
  const karigars = karigarsData?.results ?? [];

  const createFormik = useFormik({
    initialValues: { customer: "", karigar: "", notes: "", expected_delivery: "" },
    validationSchema: orderSchema,
    onSubmit: async (values, helpers) => {
      await createOrder({
        customer: values.customer,
        notes: values.notes,
        expected_delivery: values.expected_delivery || undefined,
      }).unwrap();
      helpers.resetForm();
      setShowCreate(false);
    },
  });

  const advanceFormik = useFormik({
    initialValues: { status: "" },
    validationSchema: advanceStatusSchema,
    onSubmit: async (values, helpers) => {
      if (!advanceOrder) return;
      await advanceStatus({ id: advanceOrder.id, status: values.status as OrderStatus }).unwrap();
      helpers.resetForm();
      setAdvanceOrder(null);
    },
  });

  const currentStatusIdx = advanceOrder ? ORDER_STATUSES.indexOf(advanceOrder.status) : -1;
  const nextStatuses = advanceOrder
    ? ORDER_STATUSES.slice(currentStatusIdx + 1)
    : [];

  return (
    <>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="flex-1 min-w-[160px]">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as OrderStatus | "")}
            placeholder="All statuses"
          >
            <option value="">All statuses</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>{s.replaceAll("_", " ")}</option>
            ))}
          </Select>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)} leftIcon={<PlusIcon />}>New Order</Button>
      </div>

      {isFetching && <SkeletonList count={4} />}

      {!isFetching && orders.length === 0 ? (
        <EmptyState
          title="No orders found"
          description={statusFilter ? "No orders match the selected status." : "Create your first customer order."}
          action={{ label: "New Order", onClick: () => setShowCreate(true) }}
        />
      ) : null}

      <div className="space-y-3">
        {orders.map((o) => (
          <OrderRow key={o.id} order={o} onAdvance={setAdvanceOrder} />
        ))}
      </div>

      {/* Create Order Modal */}
      <Modal open={showCreate} onClose={() => { setShowCreate(false); createFormik.resetForm(); }} title="New Customer Order" size="md">
        <form onSubmit={createFormik.handleSubmit} className="space-y-3">
          <CustomerSearchSelect
            value={createFormik.values.customer}
            onChange={(id) => createFormik.setFieldValue("customer", id)}
            label="Customer"
            error={createFormik.touched.customer ? createFormik.errors.customer : undefined}
          />

          <Select
            label="Karigar (optional)"
            value={createFormik.values.karigar}
            onChange={(e) => createFormik.setFieldValue("karigar", e.target.value)}
          >
            <option value="">No karigar assigned</option>
            {karigars.map((k) => (
              <option key={k.id} value={k.id}>{k.name}</option>
            ))}
          </Select>

          <Textarea
            label="Description"
            required
            rows={3}
            placeholder="Design and work details…"
            {...createFormik.getFieldProps("notes")}
            error={createFormik.touched.notes ? createFormik.errors.notes : undefined}
          />

          <DatePicker
            name="expected_delivery"
            label="Expected delivery"
            value={createFormik.values.expected_delivery}
            onChange={(e) => createFormik.setFieldValue("expected_delivery", e.target.value)}
          />

          <div className="flex gap-2 justify-end pt-1">
            <Button type="button" variant="secondary" size="sm" onClick={() => { setShowCreate(false); createFormik.resetForm(); }}>
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={createState.isLoading}>
              Create Order
            </Button>
          </div>
        </form>
      </Modal>

      {/* Advance Status Modal */}
      <Modal
        open={Boolean(advanceOrder)}
        onClose={() => { setAdvanceOrder(null); advanceFormik.resetForm(); }}
        title={`Advance Order — ${advanceOrder?.order_no ?? ""}`}
        size="sm"
      >
        <form onSubmit={advanceFormik.handleSubmit} className="space-y-4">
          <p className="text-sm text-muted">
            Current: <Badge variant={advanceOrder ? orderStatusVariant(advanceOrder.status) : "neutral"}>
              {advanceOrder?.status.replaceAll("_", " ")}
            </Badge>
          </p>

          <Select
            label="New status"
            required
            value={advanceFormik.values.status}
            onChange={(e) => advanceFormik.setFieldValue("status", e.target.value)}
            error={advanceFormik.touched.status ? advanceFormik.errors.status : undefined}
          >
            <option value="">Select new status…</option>
            {nextStatuses.map((s) => (
              <option key={s} value={s}>{s.replaceAll("_", " ")}</option>
            ))}
          </Select>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="secondary" size="sm" onClick={() => { setAdvanceOrder(null); advanceFormik.resetForm(); }}>
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={advanceState.isLoading}>
              Confirm
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

// ─── Issues View ──────────────────────────────────────────────────────────────

const issueSchema = Yup.object({
  karigar: Yup.string().required("Karigar is required"),
  order: Yup.string(),
  metal: Yup.string().required("Metal is required"),
  purity: Yup.string().required("Purity is required"),
  gross_wt_issued: Yup.string().required("Gross weight is required"),
  tunch_pct: Yup.string().required("Tunch % is required"),
  date: Yup.string().required("Date is required"),
  notes: Yup.string(),
});

function IssueRow({ issue }: Readonly<{ issue: JwlKarigarIssue }>) {
  return (
    <div className="app-panel p-4">
      <div className="flex items-start justify-between gap-3 mb-1">
        <p className="font-semibold text-text">{issue.voucher_no}</p>
        <Badge variant="warning">{issue.metal}</Badge>
      </div>
      <p className="text-sm text-muted">{issue.karigar_name}</p>
      <div className="flex gap-4 mt-2 text-xs text-muted">
        <span>Gross: <span className="font-medium text-text">{issue.gross_wt_issued}g</span></span>
        <span>Tunch: <span className="font-medium text-text">{issue.tunch_pct}%</span></span>
        <span>Pure: <span className="font-medium text-text">{issue.pure_gold_wt_issued}g</span></span>
      </div>
      <p className="text-xs text-muted mt-1">{issue.date}</p>
    </div>
  );
}

function IssuesView() {
  const [showCreate, setShowCreate] = useState(false);
  const today = new Date().toISOString().split("T")[0];

  const { data: issuesData, isFetching } = useListKarigarIssuesQuery({});
  const { data: karigarsData } = useListKarigarsQuery({ active_only: true });
  const { data: metalsData } = useListMetalsQuery();
  const [createIssue, createState] = useCreateKarigarIssueMutation();

  const issues = issuesData?.results ?? [];
  const karigars = karigarsData?.results ?? [];
  const metals = metalsData ?? [];

  const formik = useFormik({
    initialValues: {
      karigar: "",
      order: "",
      metal: "",
      purity: "",
      gross_wt_issued: "",
      tunch_pct: "",
      date: today,
      notes: "",
    },
    validationSchema: issueSchema,
    onSubmit: async (values, helpers) => {
      await createIssue({
        karigar: values.karigar,
        order: values.order || undefined,
        metal: values.metal,
        purity: values.purity,
        gross_wt_issued: values.gross_wt_issued,
        tunch_pct: values.tunch_pct,
        date: values.date,
        notes: values.notes,
      }).unwrap();
      helpers.resetForm();
      setShowCreate(false);
    },
  });

  const { data: puritiesData } = useListPuritiesQuery(
    { metal: formik.values.metal },
    { skip: !formik.values.metal },
  );
  const purities = puritiesData ?? [];

  const { data: karigarOrdersData } = useListOrdersQuery(
    { status: "METAL_ISSUED" },
    { skip: !formik.values.karigar },
  );
  const karigarOrders = karigarOrdersData?.results ?? [];

  return (
    <>
      <div className="flex items-center justify-between gap-2 mb-4">
        <p className="text-sm text-muted">{issues.length} issue voucher{issues.length !== 1 ? "s" : ""}</p>
        <Button size="sm" onClick={() => setShowCreate(true)} leftIcon={<PlusIcon />}>New Issue</Button>
      </div>

      {isFetching && <SkeletonList count={4} />}

      {!isFetching && issues.length === 0 ? (
        <EmptyState
          title="No issue vouchers found"
          description="Create a metal issue voucher to assign work to a karigar."
          action={{ label: "New Issue", onClick: () => setShowCreate(true) }}
        />
      ) : null}

      <div className="space-y-3">
        {issues.map((i) => <IssueRow key={i.id} issue={i} />)}
      </div>

      <Modal open={showCreate} onClose={() => { setShowCreate(false); formik.resetForm(); }} title="New Metal Issue Voucher" size="md">
        <form onSubmit={formik.handleSubmit} className="space-y-3">
          <Select
            label="Karigar"
            required
            value={formik.values.karigar}
            onChange={(e) => formik.setFieldValue("karigar", e.target.value)}
            error={formik.touched.karigar ? formik.errors.karigar : undefined}
          >
            <option value="">Select karigar…</option>
            {karigars.map((k) => (
              <option key={k.id} value={k.id}>{k.name}</option>
            ))}
          </Select>

          <Select
            label="Order (optional)"
            value={formik.values.order}
            onChange={(e) => formik.setFieldValue("order", e.target.value)}
          >
            <option value="">No order linked</option>
            {karigarOrders.map((o) => (
              <option key={o.id} value={o.id}>{o.order_no} — {o.customer_name}</option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Metal"
              required
              value={formik.values.metal}
              onChange={(e) => {
                formik.setFieldValue("metal", e.target.value);
                formik.setFieldValue("purity", "");
              }}
              error={formik.touched.metal ? formik.errors.metal : undefined}
            >
              <option value="">Select metal…</option>
              {metals.map((m) => (
                <option key={m.id} value={m.code}>{m.name}</option>
              ))}
            </Select>

            <Select
              label="Purity"
              required
              value={formik.values.purity}
              onChange={(e) => formik.setFieldValue("purity", e.target.value)}
              disabled={!formik.values.metal}
              error={formik.touched.purity ? formik.errors.purity : undefined}
            >
              <option value="">Select purity…</option>
              {purities.map((p) => (
                <option key={p.id} value={p.code}>{p.code} ({p.pct}%)</option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Gross weight (g)"
              required
              type="number"
              step="0.0001"
              placeholder="0.0000"
              {...formik.getFieldProps("gross_wt_issued")}
              error={formik.touched.gross_wt_issued ? formik.errors.gross_wt_issued : undefined}
            />
            <Input
              label="Tunch %"
              required
              type="number"
              step="0.01"
              min="0"
              max="100"
              placeholder="0.00"
              {...formik.getFieldProps("tunch_pct")}
              error={formik.touched.tunch_pct ? formik.errors.tunch_pct : undefined}
            />
          </div>

          <DatePicker
            name="date"
            label="Issue date"
            value={formik.values.date}
            onChange={(e) => formik.setFieldValue("date", e.target.value)}
          />

          <Textarea
            label="Notes"
            rows={2}
            {...formik.getFieldProps("notes")}
          />

          <div className="flex gap-2 justify-end pt-1">
            <Button type="button" variant="secondary" size="sm" onClick={() => { setShowCreate(false); formik.resetForm(); }}>
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={createState.isLoading}>
              Save Issue
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

// ─── Receipts View ────────────────────────────────────────────────────────────

const receiptSchema = Yup.object({
  karigar: Yup.string().required("Karigar is required"),
  issue: Yup.string().required("Issue is required"),
  gross_wt_received: Yup.string().required("Gross weight is required"),
  net_wt: Yup.string().required("Net weight is required"),
  final_purity_pct: Yup.string()
    .required("Tunch % is required")
    .test("range", "Must be 0–100", (v) => !v || (Number(v) >= 0 && Number(v) <= 100)),
  date: Yup.string().required("Date is required"),
});

function ReceiptRow({ receipt }: Readonly<{ receipt: JwlKarigarReceipt }>) {
  return (
    <div className="app-panel p-4">
      <div className="flex items-start justify-between gap-3 mb-1">
        <p className="font-semibold text-text">{receipt.voucher_no}</p>
        <Badge variant="success">{receipt.status}</Badge>
      </div>
      <p className="text-sm text-muted">{receipt.karigar_name}</p>
      <div className="flex gap-4 mt-2 text-xs text-muted">
        <span>Gross: <span className="font-medium text-text">{receipt.gross_wt_received}g</span></span>
        <span>Net: <span className="font-medium text-text">{receipt.net_wt}g</span></span>
        <span>Purity: <span className="font-medium text-text">{receipt.final_purity_pct}%</span></span>
      </div>
      <p className="text-xs text-muted mt-1">{receipt.date}</p>
    </div>
  );
}

function ReceiptsView() {
  const [showCreate, setShowCreate] = useState(false);
  const today = new Date().toISOString().split("T")[0];

  const { data: receiptsData, isFetching } = useListKarigarReceiptsQuery({});
  const { data: karigarsData } = useListKarigarsQuery({ active_only: true });
  const [createReceipt, createState] = useCreateKarigarReceiptMutation();

  const receipts = receiptsData?.results ?? [];
  const karigars = karigarsData?.results ?? [];

  const formik = useFormik({
    initialValues: {
      karigar: "",
      issue: "",
      gross_wt_received: "",
      net_wt: "",
      stone_wt: "",
      final_purity_pct: "",
      labour_amount: "",
      date: today,
    },
    validationSchema: receiptSchema,
    onSubmit: async (values, helpers) => {
      await createReceipt({
        karigar: values.karigar,
        issue: values.issue,
        gross_wt_received: values.gross_wt_received,
        net_wt: values.net_wt,
        stone_wt: values.stone_wt || "0",
        final_purity_pct: values.final_purity_pct,
        labour_amount: values.labour_amount || "0",
        date: values.date,
      }).unwrap();
      helpers.resetForm();
      setShowCreate(false);
    },
  });

  const { data: issuesData } = useListKarigarIssuesQuery(
    { karigar: formik.values.karigar },
    { skip: !formik.values.karigar },
  );
  const karigarIssues = issuesData?.results ?? [];

  return (
    <>
      <div className="flex items-center justify-between gap-2 mb-4">
        <p className="text-sm text-muted">{receipts.length} receipt{receipts.length !== 1 ? "s" : ""}</p>
        <Button size="sm" onClick={() => setShowCreate(true)} leftIcon={<PlusIcon />}>New Receipt</Button>
      </div>

      {isFetching && <SkeletonList count={4} />}

      {!isFetching && receipts.length === 0 ? (
        <EmptyState
          title="No receipts found"
          description="Create a karigar receipt to record finished goods returned."
          action={{ label: "New Receipt", onClick: () => setShowCreate(true) }}
        />
      ) : null}

      <div className="space-y-3">
        {receipts.map((r) => <ReceiptRow key={r.id} receipt={r} />)}
      </div>

      <Modal open={showCreate} onClose={() => { setShowCreate(false); formik.resetForm(); }} title="New Karigar Receipt" size="md">
        <form onSubmit={formik.handleSubmit} className="space-y-3">
          <Select
            label="Karigar"
            required
            value={formik.values.karigar}
            onChange={(e) => {
              formik.setFieldValue("karigar", e.target.value);
              formik.setFieldValue("issue", "");
            }}
            error={formik.touched.karigar ? formik.errors.karigar : undefined}
          >
            <option value="">Select karigar…</option>
            {karigars.map((k) => (
              <option key={k.id} value={k.id}>{k.name}</option>
            ))}
          </Select>

          <Select
            label="Issue voucher"
            required
            value={formik.values.issue}
            onChange={(e) => formik.setFieldValue("issue", e.target.value)}
            disabled={!formik.values.karigar}
            error={formik.touched.issue ? formik.errors.issue : undefined}
          >
            <option value="">Select issue voucher…</option>
            {karigarIssues.map((i) => (
              <option key={i.id} value={i.id}>{i.voucher_no} — {i.date} ({i.gross_wt_issued}g)</option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Gross wt received (g)"
              required
              type="number"
              step="0.0001"
              placeholder="0.0000"
              {...formik.getFieldProps("gross_wt_received")}
              error={formik.touched.gross_wt_received ? formik.errors.gross_wt_received : undefined}
            />
            <Input
              label="Net weight (g)"
              required
              type="number"
              step="0.0001"
              placeholder="0.0000"
              {...formik.getFieldProps("net_wt")}
              error={formik.touched.net_wt ? formik.errors.net_wt : undefined}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Stone weight (g)"
              type="number"
              step="0.0001"
              placeholder="0.0000"
              {...formik.getFieldProps("stone_wt")}
            />
            <Input
              label="Final purity % (tunch)"
              required
              type="number"
              step="0.01"
              min="0"
              max="100"
              placeholder="0.00"
              {...formik.getFieldProps("final_purity_pct")}
              error={formik.touched.final_purity_pct ? formik.errors.final_purity_pct : undefined}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Labour amount (₹)"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...formik.getFieldProps("labour_amount")}
            />
            <DatePicker
              name="date"
              label="Receipt date"
              value={formik.values.date}
              onChange={(e) => formik.setFieldValue("date", e.target.value)}
            />
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <Button type="button" variant="secondary" size="sm" onClick={() => { setShowCreate(false); formik.resetForm(); }}>
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={createState.isLoading}>
              Save Receipt
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

// ─── Page inner ───────────────────────────────────────────────────────────────

function KarigarPageInner() {
  const searchParams = useSearchParams();
  const rawView = searchParams.get("view") ?? "karigars";
  const validViews = new Set<KarigarView>(["karigars", "orders", "issues", "receipts"]);
  const view: KarigarView = validViews.has(rawView as KarigarView) ? (rawView as KarigarView) : "karigars";

  const subtitleMap: Record<KarigarView, string> = {
    karigars: "Manage karigar profiles and specializations",
    orders: "Create and track custom customer orders",
    issues: "Issue metal to karigars and track assigned work",
    receipts: "Record finished goods received from karigars",
  };

  return (
    <Screen
      title="Karigar Management"
      subtitle={subtitleMap[view]}
      backHref={ROUTES.app.jewellery.dashboard}
    >
      <TabBar activeView={view} />

      {view === "karigars" && <KarigarsView />}
      {view === "orders" && <OrdersView />}
      {view === "issues" && <IssuesView />}
      {view === "receipts" && <ReceiptsView />}
    </Screen>
  );
}

// ─── Page export ──────────────────────────────────────────────────────────────

export default function JewelleryKarigarPage() {
  return (
    <Suspense fallback={<Screen title="Karigar" subtitle="Loading...">{null}</Screen>}>
      <KarigarPageInner />
    </Suspense>
  );
}
