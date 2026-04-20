"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { BorrowerForm } from "@/components/forms";
import { Screen } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useAddBorrowerMutation } from "@/features/borrowers/borrower-api";
import type { BorrowerFormValues } from "@/validation";

export default function AddBorrowerPage() {
  const router = useRouter();
  const [addBorrower] = useAddBorrowerMutation();
  const [tempPasswordInfo, setTempPasswordInfo] = useState<{
    borrowerUuid: string;
    name: string;
    mobile: string;
    password: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const onSubmit = async (values: BorrowerFormValues) => {
    const borrower = await addBorrower(values).unwrap();
    if (borrower.temporary_password) {
      setTempPasswordInfo({
        borrowerUuid: borrower.uuid,
        name: (values as { name?: string }).name ?? "Borrower",
        mobile: (values as { mobile_number?: string }).mobile_number ?? "",
        password: borrower.temporary_password,
      });
    } else {
      router.push(`/borrowers/${borrower.uuid}`);
    }
  };

  const handleCopy = () => {
    if (tempPasswordInfo) {
      navigator.clipboard.writeText(tempPasswordInfo.password).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleContinue = () => {
    if (tempPasswordInfo) {
      router.push(`/borrowers/${tempPasswordInfo.borrowerUuid}`);
    }
  };

  return (
    <Screen title="Add Borrower" backHref="/borrowers">
      <BorrowerForm onSubmit={onSubmit} submitLabel="Create Borrower" showPasswordField requirePassword />
      <p className="mt-3 text-xs text-muted">
        Borrower login is created from mobile number automatically using the login password you set above.
      </p>

      <Modal
        open={Boolean(tempPasswordInfo)}
        onClose={handleContinue}
        title="Borrower Account Created"
        size="sm"
        footer={
          <Button onClick={handleContinue} fullWidth>
            Continue to Borrower
          </Button>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-muted">
            A login account has been created for{" "}
            <span className="font-semibold text-text">{tempPasswordInfo?.name}</span>.
            Share these credentials with the borrower — they will be asked to reset their password on first login.
          </p>
          <div className="app-panel p-4 space-y-3 bg-surface2">
            <div>
              <p className="text-xs text-muted mb-1">Mobile Number</p>
              <p className="text-sm font-semibold text-text font-mono">{tempPasswordInfo?.mobile}</p>
            </div>
            <div>
              <p className="text-xs text-muted mb-1">Temporary Password</p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-text font-mono tracking-widest flex-1">
                  {tempPasswordInfo?.password}
                </p>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-xs text-primary-600 hover:underline font-medium flex-shrink-0"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          </div>
          <p className="text-xs text-danger-600 font-medium">
            Note: This password will not be shown again. Save it now.
          </p>
        </div>
      </Modal>
    </Screen>
  );
}
