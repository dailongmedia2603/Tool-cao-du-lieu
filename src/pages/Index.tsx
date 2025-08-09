import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelectCombobox, SelectOption } from "@/components/ui/multi-select-combobox";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import CampaignList from "@/components/CampaignList";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { DateTimePicker } from "@/components/ui/datetime-picker";

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
  // Common state
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [facebookGroups, setFacebookGroups] = useState<SelectOption[]>([]);
  const [websiteSources, setWebsiteSources] = useState<SelectOption[]>([]);

  // Facebook form state
  const [campaignName, setCampaignName] = useState("");
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [endDate, setEndDate] = useState<Date>();
  const [scanFrequency, setScanFrequency] = useState<number>(1);
  const [scanUnit, setScanUnit] = useState("day");
  const [isCreating, setIsCreating] = useState(false);

  // Website form state
  const [websiteCampaignName, setWebsiteCampaignName] = useState("");
  const [selectedWebsites, setSelectedWebsites] = useState<string[]>([]);
  const [websiteEndDate, setWebsiteEndDate] = useState<Date>();
  const [websiteScanFrequency, setWebsiteScanFrequency] = useState<number>(1);
  const [websiteScanUnit, setWebsiteScanUnit] = useState("day");
  const [isCreatingWebsite, setIsCreatingWebsite] = useState(false);

  // Combined form state
  const [combinedCampaignName, setCombinedCampaignName] = useState("");
  const [combinedSelectedGroups, setCombinedSelectedGroups] = useState<string[]>([]);
  const [combinedSelectedWebsites, setCombinedSelectedWebsites] = useState<string[]>([]);
  const [combinedEndDate, setCombinedEndDate] = useState<Date>();
  const [combinedScanFrequency, setCombinedScanFrequency] = useState<number>(1);
  const [combinedScanUnit, setCombinedScanUnit] = useState("day");
  const [isCreatingCombined, setIsCreatingCombined] = useState(false);

  // Edit dialog state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [updatedCampaignName, setUpdatedCampaignName] = useState("");
  const [updatedSelectedSources, setUpdatedSelectedSources] = useState<string[]>([]);
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

    const fetchGroups = async () => {
      const { data, error } = await supabase.from('list_nguon_facebook').select('group_id, group_name');
      if (error) {
        showError("Không thể tải danh sách group Facebook.");
      } else if (data) {
        setFacebookGroups(data.filter(g => g.group_id && g.group_name).map(g => ({ value: g.group_id!, label: g.group_name! })));
      }
    };

    const fetchWebsites = async () => {
      const { data, error } = await supabase.from('list_nguon_website').select('url');
      if (error) {
        showError("Không thể tải danh sách website.");
      } else if (data) {
        setWebsiteSources(data.filter(w => w.url).map(w => ({ value: w.url!, label: w.url! })));
      }
    };

    fetchGroups();
    fetchWebsites();
  }, []);

  const resetFacebookForm = () => {
    setCampaignName("");
    setSelectedGroups([]);
    setEndDate(undefined);
    setScanFrequency(1);
    setScanUnit("day");
  };

  const resetWebsiteForm = () => {
    setWebsiteCampaignName("");
    setSelectedWebsites([]);
    setWebsiteEndDate(undefined);
    setWebsiteScanFrequency(1);
    setWebsiteScanUnit("day");
  };

  const resetCombinedForm = () => {
    setCombinedCampaignName("");
    setCombinedSelectedGroups([]);
    setCombinedSelectedWebsites([]);
    setCombinedEndDate(undefined);
    setCombinedScanFrequency(1);
    setCombinedScanUnit("day");
  };

  const handleCreateCampaign = async (type: 'Facebook' | 'Website' | 'Tổng hợp') => {
    let name, sources, localEndDate, localScanFrequency, localScanUnit, setIsCreatingState, resetForm;

    if (type === 'Facebook') {
      if (!campaignName.trim()) return showError("Vui lòng nhập tên chiến dịch.");
      if (selectedGroups.length === 0) return showError("Vui lòng chọn ít nhất một group.");
      name = campaignName;
      sources = selectedGroups;
      localEndDate = endDate;
      localScanFrequency = scanFrequency;
      localScanUnit = scanUnit;
      setIsCreatingState = setIsCreating;
      resetForm = resetFacebookForm;
    } else if (type === 'Website') {
      if (!websiteCampaignName.trim()) return showError("Vui lòng nhập tên chiến dịch.");
      if (selectedWebsites.length === 0) return showError("Vui lòng chọn ít nhất một website.");
      name = websiteCampaignName;
      sources = selectedWebsites;
      localEndDate = websiteEndDate;
      localScanFrequency = websiteScanFrequency;
      localScanUnit = websiteScanUnit;
      setIsCreatingState = setIsCreatingWebsite;
      resetForm = resetWebsiteForm;
    } else { // Combined
      if (!combinedCampaignName.trim()) return showError("Vui lòng nhập tên chiến dịch.");
      if (combinedSelectedGroups.length === 0 && combinedSelectedWebsites.length === 0) return showError("Vui lòng chọn ít nhất một nguồn (Group hoặc Website).");
      name = combinedCampaignName;
      sources = [...combinedSelectedGroups, ...combinedSelectedWebsites];
      localEndDate = combinedEndDate;
      localScanFrequency = combinedScanFrequency;
      localScanUnit = combinedScanUnit;
      setIsCreatingState = setIsCreatingCombined;
      resetForm = resetCombinedForm;
    }

    setIsCreatingState(true);
    const toastId = showLoading("Đang tạo chiến dịch...");
    const { error } = await supabase.from('campaigns').insert({
      name, type, sources,
      end_date: localEndDate ? localEndDate.toISOString() : null,
      scan_frequency: localScanFrequency, scan_unit: localScanUnit,
    });
    dismissToast(toastId);
    if (error) {
      showError(`Tạo chiến dịch thất bại: ${error.message}`);
    } else {
      showSuccess("Chiến dịch đã được tạo thành công!");
      resetForm();
      fetchCampaigns();
    }
    setIsCreatingState(false);
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const toastId = showLoading("Đang cập nhật trạng thái...");
    const { error } = await supabase.from('campaigns').update({ status: newStatus }).eq('id', id);
    dismissToast(toastId);
    if (error) showError("Cập nhật thất bại.");
    else {
      showSuccess("Cập nhật trạng thái thành công!");
      fetchCampaigns();
    }
  };

  const handleEditClick = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setUpdatedCampaignName(campaign.name);
    setUpdatedSelectedSources(campaign.sources);
    setUpdatedEndDate(campaign.end_date ? new Date(campaign.end_date) : undefined);
    setUpdatedScanFrequency(campaign.scan_frequency);
    setUpdatedScanUnit(campaign.scan_unit);
    setIsEditDialogOpen(true);
  };

  const handleUpdateCampaign = async () => {
    if (!editingCampaign) return;
    if (!updatedCampaignName.trim()) return showError("Vui lòng nhập tên chiến dịch.");
    if (updatedSelectedSources.length === 0) return showError("Vui lòng chọn ít nhất một nguồn.");
    
    setIsUpdating(true);
    const toastId = showLoading("Đang cập nhật chiến dịch...");
    const { error } = await supabase.from('campaigns').update({
      name: updatedCampaignName, sources: updatedSelectedSources,
      end_date: updatedEndDate ? updatedEndDate.toISOString() : null,
      scan_frequency: updatedScanFrequency, scan_unit: updatedScanUnit,
    }).eq('id', editingCampaign.id);
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
    const { error } = await supabase.from('campaigns').delete().eq('id', deletingCampaign.id);
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
  const combinedCampaigns = campaigns.filter(c => c.type === 'Tổng hợp');

  const getSourcesForEdit = (campaign: Campaign | null) => {
    if (!campaign) return { groups: [], websites: [] };
    const allGroupIds = facebookGroups.map(g => g.value);
    const allWebsiteUrls = websiteSources.map(w => w.value);
    
    const groups = campaign.sources.filter(s => allGroupIds.includes(s));
    const websites = campaign.sources.filter(s => allWebsiteUrls.includes(s));
    
    return { groups, websites };
  };

  const editSources = getSourcesForEdit(editingCampaign);

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
                  <div className="space-y-2"><Label>Thời gian kết thúc</Label><DateTimePicker date={endDate} setDate={setEndDate} /></div>
                  <div className="space-y-2"><Label>Tần suất quét</Label><div className="flex items-center space-x-2"><Input type="number" min="1" value={scanFrequency} onChange={(e) => setScanFrequency(parseInt(e.target.value, 10))} className="w-24" /><Select value={scanUnit} onValueChange={setScanUnit}><SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="minute">Phút</SelectItem><SelectItem value="hour">Giờ</SelectItem><SelectItem value="day">Ngày</SelectItem></SelectContent></Select></div></div>
                  <div className="flex justify-end"><Button className="bg-brand-orange hover:bg-brand-orange/90 text-white" onClick={() => handleCreateCampaign('Facebook')} disabled={isCreating}>{isCreating ? "Đang tạo..." : "Tạo chiến dịch"}</Button></div>
                </div>
              </div>
            </CardContent>
          </Card>
          <CampaignList campaigns={facebookCampaigns} loading={loadingCampaigns} onStatusChange={handleStatusChange} onEdit={handleEditClick} onDelete={handleDeleteClick} />
        </TabsContent>

        <TabsContent value="website" className="pt-6">
          <Card className="border-orange-200">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2"><Label>Tên chiến dịch</Label><Input placeholder="VD: Quét giá sản phẩm" value={websiteCampaignName} onChange={(e) => setWebsiteCampaignName(e.target.value)} /></div>
                <div className="space-y-2"><Label>Loại chiến dịch</Label><Input value="Website" disabled /></div>
                <div className="space-y-2 col-span-1 md:col-span-2">
                  <div className="flex items-center space-x-2 mb-2"><Label>Chọn Website</Label>{selectedWebsites.length > 0 && (<span className="bg-brand-orange-light text-gray-900 text-xs font-semibold px-2.5 py-0.5 rounded-full">{selectedWebsites.length}</span>)}</div>
                  <MultiSelectCombobox options={websiteSources} selected={selectedWebsites} onChange={setSelectedWebsites} placeholder="Chọn một hoặc nhiều website" searchPlaceholder="Tìm kiếm website..." emptyPlaceholder="Không tìm thấy website." />
                </div>
                <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                  <div className="space-y-2"><Label>Thời gian kết thúc</Label><DateTimePicker date={websiteEndDate} setDate={setWebsiteEndDate} /></div>
                  <div className="space-y-2"><Label>Tần suất quét</Label><div className="flex items-center space-x-2"><Input type="number" min="1" value={websiteScanFrequency} onChange={(e) => setWebsiteScanFrequency(parseInt(e.target.value, 10))} className="w-24" /><Select value={websiteScanUnit} onValueChange={setWebsiteScanUnit}><SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="minute">Phút</SelectItem><SelectItem value="hour">Giờ</SelectItem><SelectItem value="day">Ngày</SelectItem></SelectContent></Select></div></div>
                  <div className="flex justify-end"><Button className="bg-brand-orange hover:bg-brand-orange/90 text-white" onClick={() => handleCreateCampaign('Website')} disabled={isCreatingWebsite}>{isCreatingWebsite ? "Đang tạo..." : "Tạo chiến dịch"}</Button></div>
                </div>
              </div>
            </CardContent>
          </Card>
          <CampaignList campaigns={websiteCampaigns} loading={loadingCampaigns} onStatusChange={handleStatusChange} onEdit={handleEditClick} onDelete={handleDeleteClick} />
        </TabsContent>

        <TabsContent value="all" className="pt-6">
          <Card className="border-orange-200">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2"><Label>Tên chiến dịch</Label><Input placeholder="VD: Chiến dịch tổng hợp tháng 8" value={combinedCampaignName} onChange={(e) => setCombinedCampaignName(e.target.value)} /></div>
                <div className="space-y-2"><Label>Loại chiến dịch</Label><Input value="Tổng hợp" disabled /></div>
                <div className="space-y-2 col-span-1">
                  <div className="flex items-center space-x-2 mb-2"><Label>Chọn Group</Label>{combinedSelectedGroups.length > 0 && (<span className="bg-brand-orange-light text-gray-900 text-xs font-semibold px-2.5 py-0.5 rounded-full">{combinedSelectedGroups.length}</span>)}</div>
                  <MultiSelectCombobox options={facebookGroups} selected={combinedSelectedGroups} onChange={setCombinedSelectedGroups} placeholder="Chọn group (tùy chọn)" searchPlaceholder="Tìm kiếm group..." emptyPlaceholder="Không tìm thấy group." />
                </div>
                <div className="space-y-2 col-span-1">
                  <div className="flex items-center space-x-2 mb-2"><Label>Chọn Website</Label>{combinedSelectedWebsites.length > 0 && (<span className="bg-brand-orange-light text-gray-900 text-xs font-semibold px-2.5 py-0.5 rounded-full">{combinedSelectedWebsites.length}</span>)}</div>
                  <MultiSelectCombobox options={websiteSources} selected={combinedSelectedWebsites} onChange={setCombinedSelectedWebsites} placeholder="Chọn website (tùy chọn)" searchPlaceholder="Tìm kiếm website..." emptyPlaceholder="Không tìm thấy website." />
                </div>
                <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                  <div className="space-y-2"><Label>Thời gian kết thúc</Label><DateTimePicker date={combinedEndDate} setDate={setCombinedEndDate} /></div>
                  <div className="space-y-2"><Label>Tần suất quét</Label><div className="flex items-center space-x-2"><Input type="number" min="1" value={combinedScanFrequency} onChange={(e) => setCombinedScanFrequency(parseInt(e.target.value, 10))} className="w-24" /><Select value={combinedScanUnit} onValueChange={setCombinedScanUnit}><SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="minute">Phút</SelectItem><SelectItem value="hour">Giờ</SelectItem><SelectItem value="day">Ngày</SelectItem></SelectContent></Select></div></div>
                  <div className="flex justify-end"><Button className="bg-brand-orange hover:bg-brand-orange/90 text-white" onClick={() => handleCreateCampaign('Tổng hợp')} disabled={isCreatingCombined}>{isCreatingCombined ? "Đang tạo..." : "Tạo chiến dịch"}</Button></div>
                </div>
              </div>
            </CardContent>
          </Card>
          <CampaignList campaigns={combinedCampaigns} loading={loadingCampaigns} onStatusChange={handleStatusChange} onEdit={handleEditClick} onDelete={handleDeleteClick} />
        </TabsContent>
      </Tabs>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl bg-gradient-to-br from-white via-brand-orange-light/50 to-white">
          <DialogHeader><DialogTitle>Sửa chiến dịch</DialogTitle><DialogDescription>Cập nhật thông tin cho chiến dịch "{editingCampaign?.name}".</DialogDescription></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            <div className="space-y-2"><Label>Tên chiến dịch</Label><Input value={updatedCampaignName} onChange={(e) => setUpdatedCampaignName(e.target.value)} /></div>
            <div className="space-y-2"><Label>Loại chiến dịch</Label><Input value={editingCampaign?.type || ''} disabled /></div>
            
            {(editingCampaign?.type === 'Facebook' || editingCampaign?.type === 'Tổng hợp') && (
              <div className="space-y-2 col-span-2">
                <div className="flex items-center space-x-2 mb-2"><Label>Chọn Group</Label>{editSources.groups.length > 0 && (<span className="bg-brand-orange-light text-gray-900 text-xs font-semibold px-2.5 py-0.5 rounded-full">{editSources.groups.length}</span>)}</div>
                <MultiSelectCombobox options={facebookGroups} selected={editSources.groups} onChange={(newGroups) => setUpdatedSelectedSources([...newGroups, ...editSources.websites])} placeholder="Chọn một hoặc nhiều group" searchPlaceholder="Tìm kiếm group..." emptyPlaceholder="Không tìm thấy group." />
              </div>
            )}

            {(editingCampaign?.type === 'Website' || editingCampaign?.type === 'Tổng hợp') && (
              <div className="space-y-2 col-span-2">
                <div className="flex items-center space-x-2 mb-2"><Label>Chọn Website</Label>{editSources.websites.length > 0 && (<span className="bg-brand-orange-light text-gray-900 text-xs font-semibold px-2.5 py-0.5 rounded-full">{editSources.websites.length}</span>)}</div>
                <MultiSelectCombobox options={websiteSources} selected={editSources.websites} onChange={(newWebsites) => setUpdatedSelectedSources([...editSources.groups, ...newWebsites])} placeholder="Chọn một hoặc nhiều website" searchPlaceholder="Tìm kiếm website..." emptyPlaceholder="Không tìm thấy website." />
              </div>
            )}

            <div className="space-y-2"><Label>Thời gian kết thúc</Label><DateTimePicker date={updatedEndDate} setDate={setUpdatedEndDate} /></div>
            <div className="space-y-2"><Label>Tần suất quét</Label><div className="flex items-center space-x-2"><Input type="number" min="1" value={updatedScanFrequency} onChange={(e) => setUpdatedScanFrequency(parseInt(e.target.value, 10))} className="w-24" /><Select value={updatedScanUnit} onValueChange={setUpdatedScanUnit}><SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="minute">Phút</SelectItem><SelectItem value="hour">Giờ</SelectItem><SelectItem value="day">Ngày</SelectItem></SelectContent></Select></div></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Hủy</Button><Button onClick={handleUpdateCampaign} disabled={isUpdating} className="bg-brand-orange hover:bg-brand-orange/90 text-white">{isUpdating ? "Đang lưu..." : "Lưu thay đổi"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-gradient-to-br from-white via-brand-orange-light/50 to-white">
          <AlertDialogHeader><AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle><AlertDialogDescription>Hành động này không thể hoàn tác. Chiến dịch "{deletingCampaign?.name}" sẽ bị xóa vĩnh viễn.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction onClick={handleConfirmDelete} disabled={isDeleting} className="bg-brand-orange hover:bg-brand-orange/90 text-white">{isDeleting ? "Đang xóa..." : "Xóa"}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Index;