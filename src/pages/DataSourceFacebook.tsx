import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Search,
  Download,
  ChevronRight,
  Plus,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showError, showLoading, showSuccess, dismissToast } from "@/utils/toast";
import { format } from "date-fns";

interface FacebookGroup {
  id: string;
  group_url: string;
  group_name: string | null;
  group_id: string | null;
  created_at: string;
  origin: string | null;
}

const DataSourceFacebook = () => {
  const [groups, setGroups] = useState<FacebookGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newGroupUrl, setNewGroupUrl] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchGroups = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("list_nguon_facebook")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching groups:", error);
      showError("Không thể tải danh sách group.");
    } else {
      setGroups(data as FacebookGroup[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleAddGroup = async () => {
    if (!newGroupUrl) {
      showError("Vui lòng nhập URL của group.");
      return;
    }
    setIsAdding(true);
    let toastId = showLoading("Đang chuẩn bị...");

    try {
      // Step 1: Get Facebook API credentials
      dismissToast(toastId);
      toastId = showLoading("Đang lấy thông tin API Facebook...");
      const { data: apiData, error: apiError } = await supabase
        .from("luu_api_key")
        .select("facebook_api_url, facebook_api_token")
        .eq("id", 1)
        .single();

      if (apiError || !apiData?.facebook_api_url || !apiData?.facebook_api_token) {
        dismissToast(toastId);
        showError("Không tìm thấy API Facebook. Vui lòng thiết lập trong trang API Keys.");
        setIsAdding(false);
        return;
      }
      const { facebook_api_url: apiUrl, facebook_api_token: token } = apiData;

      // Step 2: Get Group ID from Edge Function using Graph API via proxy
      dismissToast(toastId);
      toastId = showLoading("Đang lấy Group ID qua API...");
      const { data: idData, error: idError } = await supabase.functions.invoke(
        "get-facebook-group-id",
        {
          body: { group_url: newGroupUrl, apiUrl, token },
        }
      );

      // Handle network errors or function invocation errors
      if (idError) {
        dismissToast(toastId);
        showError(`Lỗi khi gọi function: ${idError.message}`);
        setIsAdding(false);
        return;
      }

      // Handle application-level errors returned by the function
      if (!idData.success || !idData.groupId) {
        dismissToast(toastId);
        showError(idData.error || "Không thể lấy được Group ID. Vui lòng kiểm tra lại URL hoặc thử lại sau.");
        setIsAdding(false);
        return;
      }

      const groupId = idData.groupId;
      dismissToast(toastId);
      toastId = showLoading("Đã có ID, đang thêm group...");

      // Step 3: Insert into database
      const { error: insertError } = await supabase
        .from("list_nguon_facebook")
        .insert([{ group_url: newGroupUrl, group_id: groupId, origin: "Manual" }]);

      dismissToast(toastId);
      if (insertError) {
        showError(`Thêm thất bại: ${insertError.message}`);
      } else {
        showSuccess("Thêm group thành công!");
        setIsDialogOpen(false);
        setNewGroupUrl("");
        fetchGroups(); // Refresh the list
      }
    } catch (e: any) {
        dismissToast(toastId);
        showError(`Đã xảy ra lỗi: ${e.message}`);
    } finally {
        setIsAdding(false);
    }
  };

  const filteredGroups = groups.filter((group) =>
    group.group_url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nguồn Group Facebook</h1>
        <p className="text-gray-500 mt-1">
          Quản lý danh sách các group Facebook muốn theo dõi để lấy dữ liệu.
        </p>
      </div>

      <div className="flex items-center justify-between space-x-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Tìm kiếm bằng URL"
            className="pl-10 border-orange-200 focus-visible:ring-0 focus-visible:ring-offset-0"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-brand-orange hover:bg-brand-orange/90 text-white flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Thêm Group</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-gradient-to-br from-white via-brand-orange-light/50 to-white">
            <DialogHeader>
              <DialogTitle>Thêm nguồn Group Facebook mới</DialogTitle>
              <DialogDescription>
                Nhập URL của group Facebook bạn muốn theo dõi. Hệ thống sẽ tự động lấy ID.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="url">URL Group</Label>
                <Input
                  id="url"
                  value={newGroupUrl}
                  onChange={(e) => setNewGroupUrl(e.target.value)}
                  placeholder="https://www.facebook.com/groups/..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
              <Button 
                onClick={handleAddGroup} 
                disabled={isAdding}
                className="bg-brand-orange hover:bg-brand-orange/90 text-white"
              >
                {isAdding ? "Đang xử lý..." : "Thêm"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border border-orange-200 rounded-lg bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 hover:bg-gray-50">
              <TableHead className="w-[40px]"></TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Tên Group</TableHead>
              <TableHead>Group ID</TableHead>
              <TableHead>Ngày thêm</TableHead>
              <TableHead>Nguồn</TableHead>
              <TableHead className="text-right w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Đang tải dữ liệu...
                </TableCell>
              </TableRow>
            ) : filteredGroups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Không tìm thấy group nào phù hợp.
                </TableCell>
              </TableRow>
            ) : (
              filteredGroups.map((group) => (
                <TableRow key={group.id}>
                  <TableCell className="text-center">
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </TableCell>
                  <TableCell className="font-medium truncate max-w-sm">
                    {group.group_url}
                  </TableCell>
                  <TableCell>{group.group_name || "N/A"}</TableCell>
                  <TableCell className="font-mono text-gray-600">{group.group_id || "N/A"}</TableCell>
                  <TableCell>
                    {format(new Date(group.created_at), 'dd/MM/yy HH:mm')}
                  </TableCell>
                  <TableCell>{group.origin}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Download className="h-5 w-5 text-gray-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-4 text-sm font-medium">
        <Button variant="outline" size="sm" className="text-gray-600 border-orange-200" disabled>
          Trước
        </Button>
        <span className="text-gray-800">Trang 1</span>
        <Button variant="outline" size="sm" className="text-gray-600 border-orange-200">
          Sau
        </Button>
      </div>
    </div>
  );
};

export default DataSourceFacebook;