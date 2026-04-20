"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

interface SessionTimeoutWarningProps {
  open: boolean;
  secondsUntilTimeout: number;
  onStaySignedIn: () => void | Promise<void>;
  onLogoutNow: () => void | Promise<void>;
  isLoading?: boolean;
}

export function SessionTimeoutWarning({
  open,
  secondsUntilTimeout,
  onStaySignedIn,
  onLogoutNow,
  isLoading = false,
}: SessionTimeoutWarningProps) {
  return (
    <Modal
      open={open}
      onClose={() => undefined}
      title="Session timeout warning"
      description="You are about to be logged out due to inactivity."
      size="sm"
      footer={
        <>
          <Button
            variant="secondary"
            size="sm"
            type="button"
            disabled={isLoading}
            onClick={onLogoutNow}
          >
            Log out now
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="button"
            loading={isLoading}
            disabled={isLoading}
            onClick={onStaySignedIn}
          >
            Stay signed in
          </Button>
        </>
      }
    >
      <p className="text-sm text-muted">
        You will be signed out in <span className="font-semibold text-text">{Math.max(secondsUntilTimeout, 0)}s</span>.
      </p>
    </Modal>
  );
}
