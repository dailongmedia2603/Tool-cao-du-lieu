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
  const [newGroupId, setNewGroupId] = useState("");
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
    if (!newGroupId) {
      showError("Vui lòng nhập ID của group.");
      return;
    }
    setIsAdding(true);
    const toastId = showLoading("Đang thêm group...");

    const { error } = await supabase
      .from("list_nguon_facebook")
      .insert([{ group_url: newGroupUrl, group_id: newGroupId, origin: "Manual" }]);

    dismissToast(toastId);
    if (error) {
      showError(`Thêm thất bại: ${error.message}`);
    } else {
      showSuccess("Thêm group thành công!");
      setIsDialogOpen(false);
      setNewGroupUrl("");
      setNewGroupId("");
      fetchGroups(); // Refresh the list
    }
    setIsAdding(false);
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
                Nhập URL và ID của group Facebook bạn muốn theo dõi.
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
              <div className="grid gap-2">
                <Label htmlFor="group-id">Group ID</Label>
                <Input
                  id="group-id"
                  value={newGroupId}
                  onChange={(e) => setNewGroupId(e.target.value)}
                  placeholder="Nhập ID của group"
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
                {isAdding ? "Đang thêm..." : "Thêm"}
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