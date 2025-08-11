import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import ReportWidget from "@/components/ReportWidget";
import { showError, showLoading, showSuccess, dismissToast } from "@/utils/toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Users, UserCheck, UserX, Search, Plus, MoreHorizontal, Trash2, Ban, CheckCircle, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Role {
  id: string;
  name: string;
}

interface AdminUser extends User {
  banned_until?: string;
  roles: string[];
}

const rolePermissions: Record<string, { description: string; permissions: { category: string; items: { text: string; allowed: boolean }[] }[] }> = {
  'Super Admin': {
    description: 'Quyền cao nhất, toàn quyền kiểm soát hệ thống.',
    permissions: [
      { category: 'Quản lý Người dùng', items: [ { text: 'Toàn quyền truy cập, quản lý và phân quyền cho tất cả người dùng', allowed: true } ] },
      { category: 'Quản lý Dữ liệu', items: [ { text: 'Toàn quyền Xem, Sửa, Xóa trên dữ liệu của tất cả người dùng (Chiến dịch, Nguồn, Báo cáo)', allowed: true } ] }
    ]
  },
  'Admin': {
    description: 'Quản lý nội dung chính nhưng không quản lý người dùng.',
    permissions: [
      { category: 'Quản lý Người dùng', items: [ { text: 'Không thể truy cập trang "Tài khoản"', allowed: false } ] },
      { category: 'Quản lý Dữ liệu', items: [ { text: 'Toàn quyền Xem, Sửa, Xóa trên dữ liệu của tất cả người dùng', allowed: true } ] }
    ]
  },
  'User': {
    description: 'Quyền cơ bản, chỉ thao tác trên dữ liệu của chính mình.',
    permissions: [
      { category: 'Quản lý Người dùng', items: [ { text: 'Không thể truy cập trang "Tài khoản"', allowed: false } ] },
      { category: 'Quản lý Dữ liệu', items: [
          { text: 'Chỉ có thể Xem, Sửa, Xóa trên dữ liệu do chính mình tạo', allowed: true },
          { text: 'Không thể xem dữ liệu của người dùng khác', allowed: false }
      ]}
    ]
  }
};

const Account = () => {
  const { roles } = useAuth();
  const isSuperAdmin = roles.includes('Super Admin');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRolesDialogOpen, setIsRolesDialogOpen] = useState(false);

  // Form states
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  
  // Action states
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
  const [userToEditRoles, setUserToEditRoles] = useState<AdminUser | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);

  const fetchUsersAndRoles = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("admin-get-users-with-roles");
    if (error) {
      showError("Không thể tải danh sách người dùng và quyền.");
    } else {
      setUsers(data.users);
      setAllRoles(data.allRoles);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsersAndRoles();
  }, []);

  const handleAddUser = async () => {
    if (!newUserEmail || !newUserPassword) return showError("Vui lòng nhập email và mật khẩu.");
    setIsSubmitting(true);
    const toastId = showLoading("Đang tạo tài khoản...");
    const { error } = await supabase.functions.invoke("admin-create-user", { body: { email: newUserEmail, password: newUserPassword } });
    dismissToast(toastId);
    if (error) {
      showError(`Tạo tài khoản thất bại: ${error.message}`);
    } else {
      showSuccess("Tạo tài khoản thành công!");
      setIsAddDialogOpen(false);
      setNewUserEmail("");
      setNewUserPassword("");
      fetchUsersAndRoles();
    }
    setIsSubmitting(false);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsSubmitting(true);
    const toastId = showLoading("Đang xóa tài khoản...");
    const { error } = await supabase.functions.invoke("admin-delete-user", { body: { user_id: userToDelete.id } });
    dismissToast(toastId);
    if (error) {
      showError(`Xóa thất bại: ${error.message}`);
    } else {
      showSuccess("Xóa tài khoản thành công!");
      fetchUsersAndRoles();
    }
    setIsDeleteDialogOpen(false);
    setUserToDelete(null);
    setIsSubmitting(false);
  };

  const handleToggleBanUser = async (user: AdminUser) => {
    const isBanned = user.banned_until && new Date(user.banned_until) > new Date();
    const action = isBanned ? "Mở khóa" : "Khóa";
    const updates = { ban_duration: isBanned ? "none" : "inf" };
    setIsSubmitting(true);
    const toastId = showLoading(`Đang ${action.toLowerCase()} tài khoản...`);
    const { error } = await supabase.functions.invoke("admin-update-user", { body: { user_id: user.id, updates } });
    dismissToast(toastId);
    if (error) {
      showError(`${action} thất bại: ${error.message}`);
    } else {
      showSuccess(`${action} tài khoản thành công!`);
      fetchUsersAndRoles();
    }
    setIsSubmitting(false);
  };

  const handleEditRolesClick = (user: AdminUser) => {
    setUserToEditRoles(user);
    const currentUserRoleIds = allRoles.filter(role => user.roles.includes(role.name)).map(role => role.id);
    setSelectedRoleIds(currentUserRoleIds);
    setIsRolesDialogOpen(true);
  };

  const handleUpdateRoles = async () => {
    if (!userToEditRoles) return;
    setIsSubmitting(true);
    const toastId = showLoading("Đang cập nhật quyền...");
    const { error } = await supabase.functions.invoke("admin-set-user-roles", { body: { user_id: userToEditRoles.id, role_ids: selectedRoleIds } });
    dismissToast(toastId);
    if (error) {
      showError(`Cập nhật quyền thất bại: ${error.message}`);
    } else {
      showSuccess("Cập nhật quyền thành công!");
      fetchUsersAndRoles();
    }
    setIsRolesDialogOpen(false);
    setUserToEditRoles(null);
    setIsSubmitting(false);
  };

  const getInitials = (email: string) => (email ? email.charAt(0).toUpperCase() : "P");
  const filteredUsers = useMemo(() => users.filter((user) => user.email?.toLowerCase().includes(searchTerm.toLowerCase())), [users, searchTerm]);
  const stats = useMemo(() => {
    const active = users.filter(u => !u.banned_until || new Date(u.banned_until) < new Date()).length;
    return { total: users.length, active, inactive: users.length - active };
  }, [users]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Quản lý Tài khoản</h1>
        <p className="text-gray-500 mt-1">Thêm, xóa, phân quyền và quản lý các tài khoản người dùng.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <ReportWidget icon={<Users className="h-5 w-5" />} title="Tổng tài khoản" value={stats.total.toString()} />
        <ReportWidget icon={<UserCheck className="h-5 w-5" />} title="Đang hoạt động" value={stats.active.toString()} />
        <ReportWidget icon={<UserX className="h-5 w-5" />} title="Ngưng hoạt động" value={stats.inactive.toString()} />
      </div>

      <div className="flex items-center justify-between space-x-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Tìm kiếm bằng email" className="pl-10 border-orange-200" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        {isSuperAdmin && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild><Button className="bg-brand-orange hover:bg-brand-orange/90 text-white flex items-center space-x-2"><Plus className="h-4 w-4" /><span>Thêm tài khoản</span></Button></DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-gradient-to-br from-white via-brand-orange-light/50 to-white">
              <DialogHeader><DialogTitle>Thêm tài khoản mới</DialogTitle><DialogDescription>Tài khoản sẽ được tự động xác thực.</DialogDescription></DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2"><Label htmlFor="new-email">Email</Label><Input id="new-email" type="email" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} placeholder="email@example.com" /></div>
                <div className="grid gap-2"><Label htmlFor="new-password">Mật khẩu</Label><Input id="new-password" type="password" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} placeholder="••••••••" /></div>
              </div>
              <DialogFooter><Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Hủy</Button><Button onClick={handleAddUser} disabled={isSubmitting} className="bg-brand-orange hover:bg-brand-orange/90 text-white">{isSubmitting ? "Đang thêm..." : "Thêm"}</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="border border-orange-200 rounded-lg bg-white">
        <Table>
          <TableHeader><TableRow className="bg-gray-50 hover:bg-gray-50"><TableHead>Tài khoản</TableHead><TableHead>Vai trò</TableHead><TableHead>Ngày tạo</TableHead><TableHead>Trạng thái</TableHead><TableHead className="text-right">Hành động</TableHead></TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={5} className="text-center py-8">Đang tải dữ liệu...</TableCell></TableRow> : filteredUsers.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8">Không tìm thấy tài khoản nào.</TableCell></TableRow> : (
              filteredUsers.map((user) => {
                const isBanned = user.banned_until && new Date(user.banned_until) > new Date();
                return (
                  <TableRow key={user.id}>
                    <TableCell><div className="flex items-center space-x-3"><Avatar><AvatarImage src={user.user_metadata.avatar_url} /><AvatarFallback className="bg-brand-orange-light text-brand-orange">{getInitials(user.email || "")}</AvatarFallback></Avatar><span className="font-medium">{user.email}</span></div></TableCell>
                    <TableCell><div className="flex flex-wrap gap-1">{user.roles.length > 0 ? user.roles.map(role => <Badge key={role} variant="secondary">{role}</Badge>) : <span className="text-gray-400 text-xs">Chưa có</span>}</div></TableCell>
                    <TableCell>{format(new Date(user.created_at), "dd/MM/yyyy")}</TableCell>
                    <TableCell><Badge className={cn("text-white capitalize", isBanned ? "bg-gray-500" : "bg-green-500")}>{isBanned ? "Ngưng hoạt động" : "Hoạt động"}</Badge></TableCell>
                    <TableCell className="text-right">
                      {isSuperAdmin && (
                        <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditRolesClick(user)}><ShieldCheck className="mr-2 h-4 w-4" /><span>Phân quyền</span></DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleBanUser(user)} disabled={isSubmitting}>{isBanned ? <CheckCircle className="mr-2 h-4 w-4" /> : <Ban className="mr-2 h-4 w-4" />}<span>{isBanned ? "Mở khóa" : "Khóa"}</span></DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => { setUserToDelete(user); setIsDeleteDialogOpen(true); }} disabled={isSubmitting}><Trash2 className="mr-2 h-4 w-4" /><span>Xóa</span></DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle><AlertDialogDescription>Hành động này không thể hoàn tác. Tài khoản của <span className="font-bold">{userToDelete?.email}</span> sẽ bị xóa vĩnh viễn.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction onClick={handleDeleteUser} disabled={isSubmitting} className="bg-red-600 hover:bg-red-700">{isSubmitting ? "Đang xóa..." : "Xóa"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>

      <Dialog open={isRolesDialogOpen} onOpenChange={setIsRolesDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-gradient-to-br from-white via-brand-orange-light/50 to-white">
          <DialogHeader><DialogTitle>Phân quyền cho tài khoản</DialogTitle><DialogDescription>Chọn các quyền bạn muốn gán cho <span className="font-bold">{userToEditRoles?.email}</span>.</DialogDescription></DialogHeader>
          <Accordion type="single" collapsible className="w-full py-4">
            {allRoles.map(role => (
              <AccordionItem value={role.id} key={role.id} className="border-b">
                <AccordionTrigger className="flex w-full items-center space-x-3 p-2 rounded-md hover:bg-orange-50 hover:no-underline">
                  <Checkbox
                    id={`role-${role.id}`}
                    checked={selectedRoleIds.includes(role.id)}
                    onCheckedChange={(checked) => {
                      setSelectedRoleIds(prev => checked ? [...prev, role.id] : prev.filter(id => id !== role.id));
                    }}
                    onClick={(e) => e.stopPropagation()} // Prevent accordion from toggling when clicking checkbox
                  />
                  <Label htmlFor={`role-${role.id}`} className="font-medium text-base cursor-pointer flex-1 text-left">{role.name}</Label>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-4 pl-12 pr-4 text-sm">
                  <p className="italic text-gray-600 mb-3">{rolePermissions[role.name].description}</p>
                  {rolePermissions[role.name].permissions.map((cat, catIndex) => (
                    <div key={catIndex} className="mt-2">
                      <h4 className="font-semibold text-gray-800">{cat.category}:</h4>
                      <ul className="list-none p-0 mt-1 space-y-1">
                        {cat.items.map((item, itemIndex) => (
                          <li key={itemIndex} className="flex items-start">
                            <span className="mr-2 mt-1 text-xs">{item.allowed ? '✅' : '❌'}</span>
                            <span className="text-gray-700">{item.text}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <DialogFooter><Button variant="outline" onClick={() => setIsRolesDialogOpen(false)}>Hủy</Button><Button onClick={handleUpdateRoles} disabled={isSubmitting} className="bg-brand-orange hover:bg-brand-orange/90 text-white">{isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Account;