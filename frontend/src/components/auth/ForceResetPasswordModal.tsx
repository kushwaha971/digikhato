"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

interface ForceResetPasswordModalProps {
  open: boolean;
  onResetNow: () => void;
  onLogout: () => void | Promise<void>;
  isLoggingOut?: boolean;
}

export function ForceResetPasswordModal({
  open,
  onResetNow,
  onLogout,
  isLoggingOut = false,
}: ForceResetPasswordModalProps) {
  return (
    <Modal
      open={open}
      onClose={() => undefined}
      title="Password reset required"
      description="Please reset your password before continuing."
      size="sm"
      footer={
        <>
          <Button
            variant="secondary"
            size="sm"
            type="button"
            loading={isLoggingOut}
            disabled={isLoggingOut}
            onClick={onLogout}
          >
            Log out
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="button"
            disabled={isLoggingOut}
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
