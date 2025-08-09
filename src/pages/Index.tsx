import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { MultiSelectCombobox, SelectOption } from "@/components/ui/multi-select-combobox";
import { Code, Calendar as CalendarIcon, ListChecks } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import CampaignList from "@/components/CampaignList";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";

export interface Campaign {
  id: string;
  name: string;
  type: string;
  sources: string[];
  end_date: string | null;
  scan_frequency: number;
  scan_unit: string;
  status: string;
  created_at: string;
}

const Index = () => {
  // Create form state
  const [campaignName, setCampaignName] = useState("");
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [endDate, setEndDate] = useState<Date>();
  const [scanFrequency, setScanFrequency] = useState<number>(1);
  const [scanUnit, setScanUnit] = useState("day");
  const [isCreating, setIsCreating] = useState(false);

  // Data state
  const [facebookGroups, setFacebookGroups] = useState<SelectOption[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);

  // Edit dialog state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [updatedCampaignName, setUpdatedCampaignName] = useState("");
  const [updatedSelectedGroups, setUpdatedSelectedGroups] = useState<string[]>([]);
  const [updatedEndDate, setUpdatedEndDate] = useState<Date | undefined>();
  const [updatedScanFrequency, setUpdatedScanFrequency] = useState(1);
  const [updatedScanUnit, setUpdatedScanUnit] = useState("day");
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingCampaign, setDeletingCampaign] = useState<Campaign | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCampaigns = async () => {
    setLoadingCampaigns(true);
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      showError("Không thể tải danh sách chiến dịch.");
    } else {
      setCampaigns(data as Campaign[]);
    }
    setLoadingCampaigns(false);
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  useEffect(() => {
    const fetchGroups = async () => {
      const { data, error } = await supabase
        .from('list_nguon_facebook')
        .select('group_id, group_name');

      if (error) {
        showError("Không thể tải danh sách group Facebook.");
      } else if (data) {
        const options = data
          .filter(group => group.group_id && group.group_name)
          .map(group => ({
            value: group.group_id!,
            label: group.group_name!,
          }));
        setFacebookGroups(options);
      }
    };
    fetchGroups();
  }, []);

  const resetForm = () => {
    setCampaignName("");
    setSelectedGroups([]);
    setEndDate(undefined);
    setScanFrequency(1);
    setScanUnit("day");
  };

  const handleCreateCampaign = async () => {
    if (!campaignName.trim()) {
      showError("Vui lòng nhập tên chiến dịch.");
      return;
    }
    if (selectedGroups.length === 0) {
      showError("Vui lòng chọn ít nhất một group.");
      return;
    }
    setIsCreating(true);
    const toastId = showLoading("Đang tạo chiến dịch...");
    const { error } = await supabase
      .from('campaigns')
      .insert({
        name: campaignName,
        type: 'Facebook',
        sources: selectedGroups,
        end_date: endDate ? endDate.toISOString() : null,
        scan_frequency: scanFrequency,
        scan_unit: scanUnit,
      });
    dismissToast(toastId);
    if (error) {
      showError(`Tạo chiến dịch thất bại: ${error.message}`);
    } else {
      showSuccess("Chiến dịch đã được tạo thành công!");
      resetForm();
      fetchCampaigns();
    }
    setIsCreating(false);
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const toastId = showLoading("Đang cập nhật trạng thái...");
    const { error } = await supabase
      .from('campaigns')
      .update({ status: newStatus })
      .eq('id', id);
    dismissToast(toastId);
    if (error) {
      showError("Cập nhật thất bại.");
    } else {
      showSuccess("Cập nhật trạng thái thành công!");
      fetchCampaigns();
    }
  };

  const handleEditClick = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setUpdatedCampaignName(campaign.name);
    setUpdatedSelectedGroups(campaign.sources);
    setUpdatedEndDate(campaign.end_date ? new Date(campaign.end_date) : undefined);
    setUpdatedScanFrequency(campaign.scan_frequency);
    setUpdatedScanUnit(campaign.scan_unit);
    setIsEditDialogOpen(true);
  };

  const handleUpdateCampaign = async () => {
    if (!editingCampaign) return;
    if (!updatedCampaignName.trim()) {
      showError("Vui lòng nhập tên chiến dịch.");
      return;
    }
    if (updatedSelectedGroups.length === 0) {
      showError("Vui lòng chọn ít nhất một group.");
      return;
    }
    setIsUpdating(true);
    const toastId = showLoading("Đang cập nhật chiến dịch...");
    const { error } = await supabase
      .from('campaigns')
      .update({
        name: updatedCampaignName,
        sources: updatedSelectedGroups,
        end_date: updatedEndDate ? updatedEndDate.toISOString() : null,
        scan_frequency: updatedScanFrequency,
        scan_unit: updatedScanUnit,
      })
      .eq('id', editingCampaign.id);
    dismissToast(toastId);
    setIsUpdating(false);
    if (error) {
      showError(`Cập nhật thất bại: ${error.message}`);
    } else {
      showSuccess("Cập nhật chiến dịch thành công!");
      setIsEditDialogOpen(false);
      setEditingCampaign(null);
      fetchCampaigns();
    }
  };

  const handleDeleteClick = (campaign: Campaign) => {
    setDeletingCampaign(campaign);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingCampaign) return;
    setIsDeleting(true);
    const toastId = showLoading("Đang xóa chiến dịch...");
    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', deletingCampaign.id);
    dismissToast(toastId);
    setIsDeleting(false);
    if (error) {
      showError(`Xóa thất bại: ${error.message}`);
    } else {
      showSuccess("Xóa chiến dịch thành công!");
      setIsDeleteDialogOpen(false);
      setDeletingCampaign(null);
      fetchCampaigns();
    }
  };

  const facebookCampaigns = campaigns.filter(c => c.type === 'Facebook');
  const websiteCampaigns = campaigns.filter(c => c.type === 'Website');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Chiến dịch</h1>
        <p className="text-gray-500 mt-1">Tạo và quản lý các chiến dịch của bạn tại đây.</p>
      </div>

      <Tabs defaultValue="facebook" className="w-full">
        <TabsList className="inline-flex items-center justify-center rounded-lg border border-orange-200 p-1 bg-white">
          <TabsTrigger value="facebook" className="px-4 py-2 font-bold text-brand-orange data-[state=active]:bg-brand-orange-light data-[state=active]:text-gray-900 rounded-md">Facebook</TabsTrigger>
          <TabsTrigger value="website" className="px-4 py-2 font-bold text-brand-orange data-[state=active]:bg-brand-orange-light data-[state=active]:text-gray-900 rounded-md">Website</TabsTrigger>
          <TabsTrigger value="all" className="px-4 py-2 font-bold text-brand-orange data-[state=active]:bg-brand-orange-light data-[state=active]:text-gray-900 rounded-md">Tất cả</TabsTrigger>
        </TabsList>
        
        <TabsContent value="facebook" className="pt-6">
          <Card className="border-orange-200">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2"><Label>Tên chiến dịch</Label><Input placeholder="VD: Quét group đối thủ" value={campaignName} onChange={(e) => setCampaignName(e.target.value)} /></div>
                <div className="space-y-2"><Label>Loại chiến dịch</Label><Input value="Facebook" disabled /></div>
                <div className="space-y-2 col-span-1 md:col-span-2">
                  <div className="flex items-center space-x-2 mb-2"><Label>Chọn Group</Label>{selectedGroups.length > 0 && (<span className="bg-brand-orange-light text-gray-900 text-xs font-semibold px-2.5 py-0.5 rounded-full">{selectedGroups.length}</span>)}</div>
                  <MultiSelectCombobox options={facebookGroups} selected={selectedGroups} onChange={setSelectedGroups} placeholder="Chọn một hoặc nhiều group" searchPlaceholder="Tìm kiếm group..." emptyPlaceholder="Không tìm thấy group." />
                </div>
                <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                  <div className="space-y-2"><Label>Thời gian kết thúc</Label><Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{endDate ? format(endDate, "PPP") : <span>Chọn ngày</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus /></PopoverContent></Popover></div>
                  <div className="space-y-2"><Label>Tần suất quét</Label><div className="flex items-center space-x-2"><Input type="number" min="1" value={scanFrequency} onChange={(e) => setScanFrequency(parseInt(e.target.value, 10))} className="w-24" /><Select value={scanUnit} onValueChange={setScanUnit}><SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="minute">Phút</SelectItem><SelectItem value="hour">Giờ</SelectItem><SelectItem value="day">Ngày</SelectItem></SelectContent></Select></div></div>
                  <div className="flex justify-end"><Button className="bg-brand-orange hover:bg-brand-orange/90 text-white" onClick={handleCreateCampaign} disabled={isCreating}>{isCreating ? "Đang tạo..." : "Tạo chiến dịch"}</Button></div>
                </div>
              </div>
            </CardContent>
          </Card>
          <CampaignList campaigns={facebookCampaigns} loading={loadingCampaigns} onStatusChange={handleStatusChange} onEdit={handleEditClick} onDelete={handleDeleteClick} />
        </TabsContent>

        <TabsContent value="website" className="pt-6">
          <Card className="border-orange-200"><CardContent className="p-6 space-y-6"><div><Label className="text-sm font-medium mb-2 block">URL Website</Label><div className="flex items-center space-x-2"><Input placeholder="Nhập URL Website" /><Button variant="secondary" className="bg-gray-800 text-white hover:bg-gray-700 space-x-2"><Code className="h-4 w-4" /><span>Get Code</span></Button><Button className="bg-brand-orange hover:bg-brand-orange/90 text-white">Run</Button></div></div></CardContent></Card>
          <CampaignList campaigns={websiteCampaigns} loading={loadingCampaigns} onStatusChange={handleStatusChange} onEdit={handleEditClick} onDelete={handleDeleteClick} />
        </TabsContent>

        <TabsContent value="all" className="pt-6">
          <CampaignList campaigns={campaigns} loading={loadingCampaigns} onStatusChange={handleStatusChange} onEdit={handleEditClick} onDelete={handleDeleteClick} />
        </TabsContent>
      </Tabs>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl bg-gradient-to-br from-white via-brand-orange-light/50 to-white">
          <DialogHeader><DialogTitle>Sửa chiến dịch</DialogTitle><DialogDescription>Cập nhật thông tin cho chiến dịch "{editingCampaign?.name}".</DialogDescription></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            <div className="space-y-2"><Label>Tên chiến dịch</Label><Input value={updatedCampaignName} onChange={(e) => setUpdatedCampaignName(e.target.value)} /></div>
            <div className="space-y-2"><Label>Loại chiến dịch</Label><Input value={editingCampaign?.type || ''} disabled /></div>
            <div className="space-y-2 col-span-2">
              <div className="flex items-center space-x-2 mb-2"><Label>Chọn Group</Label>{updatedSelectedGroups.length > 0 && (<span className="bg-brand-orange-light text-gray-900 text-xs font-semibold px-2.5 py-0.5 rounded-full">{updatedSelectedGroups.length}</span>)}</div>
              <MultiSelectCombobox options={facebookGroups} selected={updatedSelectedGroups} onChange={setUpdatedSelectedGroups} placeholder="Chọn một hoặc nhiều group" searchPlaceholder="Tìm kiếm group..." emptyPlaceholder="Không tìm thấy group." />
            </div>
            <div className="space-y-2"><Label>Thời gian kết thúc</Label><Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !updatedEndDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{updatedEndDate ? format(updatedEndDate, "PPP") : <span>Chọn ngày</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={updatedEndDate} onSelect={setUpdatedEndDate} initialFocus /></PopoverContent></Popover></div>
            <div className="space-y-2"><Label>Tần suất quét</Label><div className="flex items-center space-x-2"><Input type="number" min="1" value={updatedScanFrequency} onChange={(e) => setUpdatedScanFrequency(parseInt(e.target.value, 10))} className="w-24" /><Select value={updatedScanUnit} onValueChange={setUpdatedScanUnit}><SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="minute">Phút</SelectItem><SelectItem value="hour">Giờ</SelectItem><SelectItem value="day">Ngày</SelectItem></SelectContent></Select></div></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Hủy</Button><Button onClick={handleUpdateCampaign} disabled={isUpdating} className="bg-brand-orange hover:bg-brand-orange/90 text-white">{isUpdating ? "Đang lưu..." : "Lưu thay đổi"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle><AlertDialogDescription>Hành động này không thể hoàn tác. Chiến dịch "{deletingCampaign?.name}" sẽ bị xóa vĩnh viễn.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction onClick={handleConfirmDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">{isDeleting ? "Đang xóa..." : "Xóa"}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Index;