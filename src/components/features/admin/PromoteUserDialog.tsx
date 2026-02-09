'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { promoteUser } from '@/actions/admin/promoteUser';
import { toast } from 'sonner';

interface PromoteUserDialogProps {
  userId: string;
  userName: string;
  currentRole: string;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

const ROLE_OPTIONS = [
  { value: 'USER', label: 'User' },
  { value: 'AUTHOR', label: 'Author' },
  { value: 'ADMIN', label: 'Admin' },
] as const;

export function PromoteUserDialog({
  userId,
  userName,
  currentRole,
  trigger,
  onSuccess,
}: PromoteUserDialogProps) {
  const [selectedRole, setSelectedRole] = useState(currentRole);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  const handleConfirm = async () => {
    if (selectedRole === currentRole) return;

    setIsSubmitting(true);
    try {
      const result = await promoteUser({
        userId,
        newRole: selectedRole,
      });

      if (result.success) {
        toast.success(`Role updated to ${result.data.newRole}`);
        setOpen(false);
        onSuccess?.();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error('Failed to update role');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {trigger ?? <Button variant="outline" size="sm">Change Role</Button>}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Change User Role</AlertDialogTitle>
          <AlertDialogDescription>
            Change role for <strong>{userName}</strong>. Current role: <strong>{currentRole}</strong>.
            This action will be logged.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-col gap-2 py-4">
          {ROLE_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors has-[:checked]:border-amber-500 has-[:checked]:bg-amber-50 dark:has-[:checked]:bg-amber-900/10"
            >
              <input
                type="radio"
                name="role"
                value={option.value}
                checked={selectedRole === option.value}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="accent-amber-600"
              />
              <span className="text-sm font-medium">{option.label}</span>
            </label>
          ))}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isSubmitting || selectedRole === currentRole}
          >
            {isSubmitting ? 'Updating...' : 'Confirm'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
