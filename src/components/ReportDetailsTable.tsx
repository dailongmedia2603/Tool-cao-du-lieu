import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from '@/integrations/supabase/client';
import { Campaign } from '@/pages/Index';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { 
  ExternalLink, Download, FileText, History, Trash2, Eye, 
  Tag, Scaling, MapPin, CalendarDays, Tags, BrainCircuit 
} from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import * as XLSX from "xlsx";
import { ScanLogsDialog, ScanLog } from "@/components/ScanLogsDialog";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from './ui/separator';
import { FacebookReportDetailsDialog } from "@/components/FacebookReportDetailsDialog";

interface ReportData {
  id: string;
  // Facebook specific
  keywords_found?: string[] | null;
  ai_evaluation?: string | null;
  // Website specific
  title: string | null;
  price: string | null;
  area: string | null;
  address: string | null;
  listing_url: string | null;
  posted_date_string: string | null;
  // Common
  description: string | null;
  source_url: string | null;
  posted_at: string | null;
  sentiment: 'positive' | 'negative' | 'neutral' | null;
}

interface ReportDetailsTableProps {
  selectedCampaign: Campaign | null;
}

const DetailItem = ({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children: React.ReactNode }) => {
  if (!children) return null;
  return (
    <div className="flex items-start space-x-3">
      <Icon className="h-5 w-5 text-brand-orange flex-shrink-0 mt-1" />
      <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <div className="text-base text-gray-800">{children}</div>
      </div>
    </div>
  );
};

const ReportDetailsTable = ({ selectedCampaign }: ReportDetailsTableProps) => {
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedItemDetails, setSelectedItemDetails] = useState<ReportData | null>(null);

  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [scanLogs, setScanLogs] = useState<ScanLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    const fetchReportData = async () => {
      if (!selectedCampaign) {
        setReportData([]);
        return;
      }
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke(
        "get-report-data",
        {
          body: { 
            campaign_id: selectedCampaign.id,
            campaign_type: selectedCampaign.type 
          },
        }
      );

      if (error) {
        showError(`Không thể tải dữ liệu báo cáo: ${error.message}`);
        setReportData([]);
      } else {
        setReportData(data as ReportData[]);
      }
      
      setLoading(false);
    };

    fetchReportData();
  }, [selectedCampaign]);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedRows([]);
  }, [reportData]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return reportData.slice(startIndex, endIndex);
  }, [reportData, currentPage, itemsPerPage]);

  const handleViewDetails = (item: ReportData) => {
    setSelectedItemDetails(item);
    setIsDetailsModalOpen(true);
  };

  const handleExportToExcel = () => {
    if (!selectedCampaign || reportData.length === 0) {
      showError("Không có dữ liệu để xuất file.");
      return;
    }

    const isFacebook = selectedCampaign.type === 'Facebook';

    const dataToExport = reportData.map(item => {
      if (isFacebook) {
        return {
          'Nội dung': item.description,
          'Thời gian đăng': item.posted_at ? format(new Date(item.posted_at), 'dd/MM/yyyy HH:mm') : 'N/A',
          'Từ khoá': item.keywords_found?.join(', ') || 'N/A',
          'AI đánh giá': item.ai_evaluation || 'N/A',
          'Link bài viết': item.source_url,
        };
      } else { // Website or Combined
        return {
          'Tiêu đề': item.title,
          'Giá': item.price,
          'Diện tích': item.area,
          'Địa chỉ': item.address,
          'Ngày đăng': item.posted_date_string,
          'Link tin đăng': item.listing_url,
          'Nội dung': item.description,
        };
      }
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Báo cáo");
    XLSX.writeFile(workbook, `Bao_cao_${selectedCampaign.name.replace(/\s+/g, '_')}.xlsx`);
    showSuccess("Xuất file Excel thành công!");
  };

  const handleOpenLogs = async () => {
    if (!selectedCampaign) return;
    setIsLogsOpen(true);
    setLoadingLogs(true);

    const { data, error } = await supabase.functions.invoke('get-scan-logs', {
        body: { campaign_id: selectedCampaign.id }
    });

    if (error) {
        showError(`Không thể tải logs: ${error.message}`);
        setScanLogs([]);
    } else {
        setScanLogs(data as ScanLog[]);
    }
    setLoadingLogs(false);
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedRows(checked ? paginatedData.map(item => item.id) : []);
  };

  const handleDeleteSelected = async () => {
    if (!selectedCampaign || selectedRows.length === 0) return;
    setIsDeleting(true);

    const { data, error } = await supabase.functions.invoke('delete-report-items', {
        body: { item_ids: selectedRows, campaign_type: selectedCampaign.type }
    });

    setIsDeleting(false);
    setIsDeleteAlertOpen(false);

    if (error) {
        showError(`Xóa thất bại: ${error.message}`);
    } else {
        showSuccess(`Đã xóa thành công ${selectedRows.length} mục.`);
        setReportData(prev => prev.filter(item => !selectedRows.includes(item.id)));
        setSelectedRows([]);
    }
  };

  const totalPages = Math.ceil(reportData.length / itemsPerPage);

  if (!selectedCampaign) {
    return (
      <Card className="border-orange-200 h-full flex items-center justify-center">
        <div className="text-center text-gray-500">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có báo cáo</h3>
          <p className="mt-1 text-sm text-gray-500">Vui lòng chọn một chiến dịch để xem kết quả.</p>
        </div>
      </Card>
    );
  }

  const isFacebookCampaign = selectedCampaign.type === 'Facebook';
  const isAllOnPageSelected = paginatedData.length > 0 && paginatedData.every(item => selectedRows.includes(item.id));

  const renderTableHeaders = () => {
    if (isFacebookCampaign) {
      return (
        <>
          <TableHead>Nội dung bài viết</TableHead>
          <TableHead>Thời gian đăng</TableHead>
          <TableHead>Từ khoá</TableHead>
          <TableHead>AI đánh giá</TableHead>
          <TableHead className="text-right">Link</TableHead>
        </>
      );
    }
    return (
      <>
        <TableHead>Tiêu đề</TableHead>
        <TableHead>Giá</TableHead>
        <TableHead>Diện tích</TableHead>
        <TableHead>Địa chỉ</TableHead>
        <TableHead>Ngày đăng</TableHead>
        <TableHead className="text-right">Hành động</TableHead>
      </>
    );
  };

  const renderTableRow = (item: ReportData) => {
    if (isFacebookCampaign) {
      return (
        <>
          <TableCell className="max-w-md truncate cursor-pointer hover:text-brand-orange" onClick={() => handleViewDetails(item)}>{item.description}</TableCell>
          <TableCell>{item.posted_at ? format(new Date(item.posted_at), 'dd/MM/yyyy HH:mm') : 'N/A'}</TableCell>
          <TableCell>
            {item.keywords_found && item.keywords_found.length > 0 ? (
              <div className="flex flex-wrap gap-1">{item.keywords_found.map((kw, i) => <Badge key={i} variant="secondary">{kw}</Badge>)}</div>
            ) : 'N/A'}
          </TableCell>
          <TableCell>{item.ai_evaluation || 'N/A'}</TableCell>
          <TableCell className="text-right">
            <Button variant="ghost" size="icon" asChild className="text-brand-orange hover:bg-brand-orange-light hover:text-brand-orange">
              <a href={item.source_url!} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /></a>
            </Button>
          </TableCell>
        </>
      );
    }
    return (
      <>
        <TableCell className="font-medium max-w-xs truncate">{item.title}</TableCell>
        <TableCell>{item.price}</TableCell>
        <TableCell>{item.area}</TableCell>
        <TableCell className="max-w-xs truncate">{item.address}</TableCell>
        <TableCell>{item.posted_date_string}</TableCell>
        <TableCell className="text-right space-x-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleViewDetails(item)}>
            <Eye className="h-4 w-4 text-gray-600" />
          </Button>
          <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-brand-orange hover:bg-brand-orange-light hover:text-brand-orange">
            <a href={item.listing_url || item.source_url!} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /></a>
          </Button>
        </TableCell>
      </>
    );
  };

  return (
    <>
      <Card className="border-orange-200 h-full flex flex-col">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">{selectedCampaign.name}</CardTitle>
              <CardDescription>Kết quả quét được từ chiến dịch. Hiển thị {reportData.length} kết quả.</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              {selectedRows.length > 0 ? (
                <Button variant="destructive" size="sm" onClick={() => setIsDeleteAlertOpen(true)}><Trash2 className="h-4 w-4 mr-2" />Xóa ({selectedRows.length})</Button>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={handleOpenLogs}><History className="h-4 w-4 mr-2" /> Logs</Button>
                  <Button variant="outline" size="sm" onClick={handleExportToExcel}><Download className="h-4 w-4 mr-2" /> Xuất file</Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col">
          <div className="overflow-auto flex-grow">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox checked={isAllOnPageSelected} onCheckedChange={(c) => handleSelectAll(c as boolean)} disabled={paginatedData.length === 0} />
                  </TableHead>
                  {renderTableHeaders()}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="h-24 text-center">Đang tải báo cáo...</TableCell></TableRow>
                ) : paginatedData.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="h-24 text-center">Không có dữ liệu nào.</TableCell></TableRow>
                ) : (
                  paginatedData.map((item) => (
                    <TableRow key={item.id} data-state={selectedRows.includes(item.id) && "selected"}>
                      <TableCell>
                        <Checkbox checked={selectedRows.includes(item.id)} onCheckedChange={(c) => setSelectedRows(p => c ? [...p, item.id] : p.filter(id => id !== item.id))} aria-label="Select row" />
                      </TableCell>
                      {renderTableRow(item)}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between pt-4 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <span>Hiển thị</span>
              <Select value={itemsPerPage.toString()} onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}>
                <SelectTrigger className="h-8 w-[75px]"><SelectValue placeholder={itemsPerPage} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-4">
              <span>Trang {currentPage} / {totalPages}</span>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>Trước</Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0}>Sau</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {isFacebookCampaign ? (
        <FacebookReportDetailsDialog
          isOpen={isDetailsModalOpen}
          onOpenChange={setIsDetailsModalOpen}
          item={selectedItemDetails}
        />
      ) : (
        <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
          <DialogContent className="sm:max-w-2xl bg-gradient-to-br from-white via-brand-orange-light/50 to-white">
            <DialogHeader>
              <DialogTitle>{selectedItemDetails?.title || 'Chi tiết bài viết'}</DialogTitle>
              <DialogDescription>
                Thông tin chi tiết được trích xuất từ nguồn.
              </DialogDescription>
            </DialogHeader>
            {selectedItemDetails && (
              <div className="py-4 max-h-[60vh] overflow-y-auto space-y-6 pr-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DetailItem icon={Tag} label="Giá">
                    <Badge variant="secondary" className="text-base font-semibold">{selectedItemDetails.price}</Badge>
                  </DetailItem>
                  <DetailItem icon={Scaling} label="Diện tích">
                    <Badge variant="secondary" className="text-base font-semibold">{selectedItemDetails.area}</Badge>
                  </DetailItem>
                  <DetailItem icon={MapPin} label="Địa chỉ / Khu vực">
                    {selectedItemDetails.address}
                  </DetailItem>
                  <DetailItem icon={CalendarDays} label="Ngày đăng">
                    {selectedItemDetails.posted_date_string || (selectedItemDetails.posted_at ? format(new Date(selectedItemDetails.posted_at), 'dd/MM/yyyy HH:mm') : 'N/A')}
                  </DetailItem>
                </div>
                
                {selectedItemDetails.description && (
                  <div>
                    <Separator className="my-4" />
                    <DetailItem icon={FileText} label="Nội dung chi tiết">
                      <p className="whitespace-pre-wrap text-gray-700 text-sm font-normal bg-white/50 p-3 rounded-md border border-orange-100">
                        {selectedItemDetails.description}
                      </p>
                    </DetailItem>
                  </div>
                )}

                {selectedItemDetails.keywords_found && selectedItemDetails.keywords_found.length > 0 && (
                   <div>
                    <Separator className="my-4" />
                    <DetailItem icon={Tags} label="Từ khóa được tìm thấy">
                       <div className="flex flex-wrap gap-2">
                        {selectedItemDetails.keywords_found.map((kw, i) => <Badge key={i}>{kw}</Badge>)}
                      </div>
                    </DetailItem>
                  </div>
                )}

                {selectedItemDetails.ai_evaluation && (
                   <div>
                    <Separator className="my-4" />
                    <DetailItem icon={BrainCircuit} label="AI Đánh giá">
                      <p className="text-gray-700 text-sm font-normal bg-white/50 p-3 rounded-md border border-orange-100">{selectedItemDetails.ai_evaluation}</p>
                    </DetailItem>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      <ScanLogsDialog isOpen={isLogsOpen} onOpenChange={setIsLogsOpen} logs={scanLogs} loading={loadingLogs} />

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
            <AlertDialogDescription>Hành động này không thể hoàn tác. Bạn sẽ xóa vĩnh viễn {selectedRows.length} mục đã chọn.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSelected} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">{isDeleting ? "Đang xóa..." : "Xác nhận xóa"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ReportDetailsTable;