"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

interface ForceResetPasswordModalProps {
  open: boolean;
  onResetNow: () => void;
  onCancel: () => void;
}

export function ForceResetPasswordModal({
  open,
  onResetNow,
  onCancel,
}: ForceResetPasswordModalProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title="Password reset required"
      description="Please reset your password before continuing."
      size="sm"
      footer={
        <>
          <Button
            variant="secondary"
            size="sm"
            type="button"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="button"
            onClick={onResetNow}
          >
            Yes, reset now
          </Button>
        </>
      }
    >
      <p className="text-sm text-muted">
        Your account was created by another user. You must set a new password to continue.
      </p>
    </Modal>
  );
}
