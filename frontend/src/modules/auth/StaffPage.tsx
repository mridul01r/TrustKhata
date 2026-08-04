import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiClient } from "@/lib/apiClient";

type UserRole = "OWNER" | "MANAGER" | "CASHIER" | "ACCOUNTANT" | "INVENTORY_MANAGER" | "ADMIN";

interface StaffMember {
  id: string;
  username: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

interface StaffRequest {
  username: string;
  password: string;
  role: UserRole;
}

interface StaffUpdateRequest {
  username: string;
  isActive: boolean;
}

async function listStaff(): Promise<StaffMember[]> {
  const res = await apiClient.get<StaffMember[]>("/staff");
  return res.data;
}

async function createStaff(data: StaffRequest): Promise<StaffMember> {
  const res = await apiClient.post<StaffMember>("/staff", data);
  return res.data;
}

async function updateStaff(id: string, data: StaffUpdateRequest): Promise<StaffMember> {
  const res = await apiClient.put<StaffMember>(`/staff/${id}`, data);
  return res.data;
}

async function resetStaffPassword(id: string, newPassword: string): Promise<void> {
  await apiClient.post(`/staff/${id}/reset-password`, { newPassword });
}

async function deleteStaff(id: string): Promise<void> {
  await apiClient.delete(`/staff/${id}`);
}

const STAFF_KEY = ["staff"];

function useStaff() {
  return useQuery({ queryKey: STAFF_KEY, queryFn: listStaff });
}

function useCreateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: StaffRequest) => createStaff(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STAFF_KEY });
    },
  });
}

function useUpdateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: StaffUpdateRequest }) => updateStaff(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STAFF_KEY });
    },
  });
}

function useResetStaffPassword() {
  return useMutation({
    mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) =>
      resetStaffPassword(id, newPassword),
  });
}

function useDeleteStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteStaff(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STAFF_KEY });
    },
  });
}

const emptyForm: StaffRequest = { username: "", password: "", role: "CASHIER" };

export default function StaffPage() {
  const { data: staff, isLoading } = useStaff();
  const createStaffMutation = useCreateStaff();
  const updateStaffMutation = useUpdateStaff();
  const resetPasswordMutation = useResetStaffPassword();
  const deleteStaffMutation = useDeleteStaff();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addForm, setAddForm] = useState<StaffRequest>(emptyForm);
  const [addError, setAddError] = useState<string | null>(null);

  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [editForm, setEditForm] = useState<StaffUpdateRequest>({ username: "", isActive: true });
  const [editError, setEditError] = useState<string | null>(null);

  const [resetTarget, setResetTarget] = useState<StaffMember | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<StaffMember | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function openAddDialog() {
    setAddForm(emptyForm);
    setAddError(null);
    setAddDialogOpen(true);
  }

  async function handleAddSubmit() {
    setAddError(null);
    try {
      await createStaffMutation.mutateAsync(addForm);
      setAddDialogOpen(false);
    } catch (err: any) {
      setAddError(err?.response?.data?.message ?? "Failed to create staff account.");
    }
  }

  function openEditDialog(member: StaffMember) {
    setEditingStaff(member);
    setEditForm({ username: member.username, isActive: member.isActive });
    setEditError(null);
  }

  async function handleEditSubmit() {
    if (!editingStaff) return;
    setEditError(null);
    try {
      await updateStaffMutation.mutateAsync({ id: editingStaff.id, data: editForm });
      setEditingStaff(null);
    } catch (err: any) {
      setEditError(err?.response?.data?.message ?? "Failed to update staff account.");
    }
  }

  function openResetDialog(member: StaffMember) {
    setResetTarget(member);
    setNewPassword("");
    setResetError(null);
    setResetSuccess(false);
  }

  async function handleResetSubmit() {
    if (!resetTarget) return;
    setResetError(null);
    try {
      await resetPasswordMutation.mutateAsync({ id: resetTarget.id, newPassword });
      setResetSuccess(true);
    } catch (err: any) {
      setResetError(err?.response?.data?.message ?? "Failed to reset password.");
    }
  }

  function openDeleteDialog(member: StaffMember) {
    setDeleteTarget(member);
    setDeleteError(null);
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleteError(null);
    try {
      await deleteStaffMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err: any) {
      setDeleteError(err?.response?.data?.message ?? "Failed to delete staff account.");
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Staff</h1>
        <Button onClick={openAddDialog}>Add Staff</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Username</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                Loading...
              </TableCell>
            </TableRow>
          )}
          {!isLoading && staff?.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No staff accounts yet.
              </TableCell>
            </TableRow>
          )}
          {staff?.map((member) => (
            <TableRow key={member.id}>
              <TableCell className="font-medium">{member.username}</TableCell>
              <TableCell>{member.role}</TableCell>
              <TableCell>
                <span
                  className={
                    member.isActive
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-muted-foreground"
                  }
                >
                  {member.isActive ? "Active" : "Inactive"}
                </span>
              </TableCell>
              <TableCell>{new Date(member.createdAt).toLocaleDateString()}</TableCell>
              <TableCell className="text-right space-x-1">
                <Button variant="ghost" size="sm" onClick={() => openEditDialog(member)}>
                  Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={() => openResetDialog(member)}>
                  Reset password
                </Button>
                {member.role !== "OWNER" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => openDeleteDialog(member)}
                  >
                    Delete
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Add staff dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Staff</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={addForm.username}
                onChange={(e) => setAddForm({ ...addForm, username: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={addForm.password}
                onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select
                value={addForm.role}
                onValueChange={(v) => setAddForm({ ...addForm, role: v as UserRole })}
              >
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASHIER">Cashier</SelectItem>
                  <SelectItem value="OWNER">Owner</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {addError && <p className="text-sm font-medium text-destructive">{addError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddSubmit}
              disabled={
                !addForm.username.trim() ||
                addForm.password.length < 6 ||
                createStaffMutation.isPending
              }
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit staff dialog */}
      <Dialog open={editingStaff !== null} onOpenChange={(open) => !open && setEditingStaff(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Staff</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <Label htmlFor="edit-username">Username</Label>
              <Input
                id="edit-username"
                value={editForm.username}
                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editForm.isActive}
                onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              Active (unchecking blocks this account from logging in)
            </label>
            {editError && <p className="text-sm font-medium text-destructive">{editError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingStaff(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleEditSubmit}
              disabled={!editForm.username.trim() || updateStaffMutation.isPending}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset password dialog */}
      <Dialog open={resetTarget !== null} onOpenChange={(open) => !open && setResetTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password{resetTarget ? ` — ${resetTarget.username}` : ""}</DialogTitle>
          </DialogHeader>
          {resetSuccess ? (
            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 pt-2">
              Password reset successfully.
            </p>
          ) : (
            <div className="space-y-3 pt-2">
              <div>
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              {resetError && <p className="text-sm font-medium text-destructive">{resetError}</p>}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetTarget(null)}>
              {resetSuccess ? "Close" : "Cancel"}
            </Button>
            {!resetSuccess && (
              <Button
                onClick={handleResetSubmit}
                disabled={newPassword.length < 6 || resetPasswordMutation.isPending}
              >
                Reset
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete staff confirmation dialog */}
      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Staff{deleteTarget ? ` — ${deleteTarget.username}` : ""}</DialogTitle>
          </DialogHeader>
          <div className="pt-2 space-y-3">
            <p className="text-sm text-muted-foreground">
              This will permanently remove this staff account. This cannot be undone.
            </p>
            {deleteError && <p className="text-sm font-medium text-destructive">{deleteError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteStaffMutation.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}