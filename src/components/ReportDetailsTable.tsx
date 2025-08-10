import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from '@/integrations/supabase/client';
import { Campaign } from '@/pages/Index';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ExternalLink, Download, Filter, FileText, History, Trash2 } from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { MultiSelectCombobox, SelectOption } from "@/components/ui/multi-select-combobox";
import * as XLSX from "xlsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScanLogsDialog, ScanLog } from "@/components/ScanLogsDialog";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface ReportData {
  id: string;
  content: string | null;
  source_url: string | null;
  author?: string | null;
  posted_at: string | null;
  sentiment: 'positive' | 'negative' | 'neutral' | null;
  keywords_found?: string[] | null;
  ai_evaluation?: string | null;
}

interface ReportDetailsTableProps {
  selectedCampaign: Campaign | null;
}

const ReportDetailsTable = ({ selectedCampaign }: ReportDetailsTableProps) => {
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [filteredData, setFilteredData] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(false);
  const [isContentModalOpen, setIsContentModalOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<string | null>(null);

  // Selection & Deletion states
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter states
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [selectedAiEvaluations, setSelectedAiEvaluations] = useState<string[]>([]);
  const [selectedSentiments, setSelectedSentiments] = useState<string[]>([]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Logs state
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [scanLogs, setScanLogs] = useState<ScanLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    const fetchReportData = async () => {
      if (!selectedCampaign) {
        setReportData([]);
        setFilteredData([]);
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
    setFilteredData(reportData);
    setCurrentPage(1);
    setSelectedRows([]);
    // Reset filters when data changes
    setSelectedKeywords([]);
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedAiEvaluations([]);
    setSelectedSentiments([]);
  }, [reportData]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, itemsPerPage]);

  const keywordOptions = useMemo(() => {
    const allKeywords = reportData.flatMap(item => item.keywords_found || []);
    return [...new Set(allKeywords)].map(kw => ({ value: kw, label: kw }));
  }, [reportData]);

  const aiEvaluationOptions = useMemo(() => {
    const allEvals = reportData.map(item => item.ai_evaluation).filter(Boolean);
    return [...new Set(allEvals as string[])].map(e => ({ value: e, label: e }));
  }, [reportData]);

  const sentimentOptions: SelectOption[] = [
    { value: 'positive', label: 'Tích cực' },
    { value: 'negative', label: 'Tiêu cực' },
    { value: 'neutral', label: 'Trung tính' },
  ];

  const handleApplyFilters = () => {
    let data = [...reportData];

    if (selectedKeywords.length > 0) {
      data = data.filter(item => item.keywords_found && selectedKeywords.some(kw => item.keywords_found!.includes(kw)));
    }
    if (startDate) {
      data = data.filter(item => item.posted_at && new Date(item.posted_at) >= startDate);
    }
    if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      data = data.filter(item => item.posted_at && new Date(item.posted_at) <= endOfDay);
    }
    if (selectedAiEvaluations.length > 0) {
      data = data.filter(item => item.ai_evaluation && selectedAiEvaluations.includes(item.ai_evaluation));
    }
    if (selectedSentiments.length > 0) {
      data = data.filter(item => item.sentiment && selectedSentiments.includes(item.sentiment));
    }

    setFilteredData(data);
    setCurrentPage(1);
    setIsFilterOpen(false);
  };

  const handleClearFilters = () => {
    setSelectedKeywords([]);
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedAiEvaluations([]);
    setSelectedSentiments([]);
    setFilteredData(reportData);
    setCurrentPage(1);
    setIsFilterOpen(false);
  };

  const handleViewContent = (content: string | null) => {
    if (content) {
      setSelectedContent(content);
      setIsContentModalOpen(true);
    }
  };

  const handleExportToExcel = () => {
    if (!selectedCampaign || filteredData.length === 0) {
      showError("Không có dữ liệu để xuất file.");
      return;
    }

    const isFacebook = selectedCampaign.type === 'Facebook';

    const sentimentText = (s: ReportData['sentiment']) => {
      switch (s) {
        case 'positive': return 'Tích cực';
        case 'negative': return 'Tiêu cực';
        case 'neutral': return 'Trung tính';
        default: return 'Chưa phân loại';
      }
    };

    const dataToExport = filteredData.map(item => {
      if (isFacebook) {
        return {
          'Nội dung bài viết': item.content,
          'Thời gian đăng': item.posted_at ? format(new Date(item.posted_at), 'dd/MM/yyyy HH:mm') : 'N/A',
          'Từ khoá': item.keywords_found?.join(', ') || 'N/A',
          'AI đánh giá': item.ai_evaluation || 'N/A',
          'Cảm xúc': sentimentText(item.sentiment),
          'Link bài viết': item.source_url,
        };
      } else { // Website or Combined
        return {
          'Nội dung': item.content,
          'Tác giả': item.author || 'N/A',
          'Thời gian': item.posted_at ? format(new Date(item.posted_at), 'dd/MM/yyyy HH:mm') : 'N/A',
          'Cảm xúc': sentimentText(item.sentiment),
          'Link bài viết': item.source_url,
        };
      }
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Báo cáo");

    const colWidths = Object.keys(dataToExport[0]).map(key => {
      let maxLength = key.length;
      if (key === 'Nội dung bài viết' || key === 'Nội dung') {
        maxLength = 60;
      } else {
        maxLength = Math.max(
          key.length,
          ...dataToExport.map(row => (row as any)[key]?.toString().length || 0)
        );
      }
      return { wch: maxLength + 2 };
    });
    worksheet['!cols'] = colWidths;

    XLSX.writeFile(workbook, `Bao_cao_${selectedCampaign.name.replace(/\s+/g, '_')}.xlsx`);
    showSuccess("Xuất file Excel thành công!");
  };

  const getSentimentBadge = (sentiment: ReportData['sentiment']) => {
    switch (sentiment) {
      case 'positive':
        return <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">Tích cực</Badge>;
      case 'negative':
        return <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100">Tiêu cực</Badge>;
      case 'neutral':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100">Trung tính</Badge>;
      default:
        return <Badge variant="outline">Chưa phân loại</Badge>;
    }
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
    if (checked) {
      const pageIds = paginatedData.map(item => item.id);
      setSelectedRows(prev => [...new Set([...prev, ...pageIds])]);
    } else {
      const pageIds = paginatedData.map(item => item.id);
      setSelectedRows(prev => prev.filter(id => !pageIds.includes(id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedCampaign || selectedRows.length === 0) return;
    setIsDeleting(true);

    const { data, error } = await supabase.functions.invoke('delete-report-items', {
        body: {
            item_ids: selectedRows,
            campaign_type: selectedCampaign.type,
        }
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

  const totalPages = useMemo(() => {
    if (itemsPerPage === -1) return 1;
    return Math.ceil(filteredData.length / itemsPerPage);
  }, [filteredData.length, itemsPerPage]);

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

  return (
    <>
      <Card className="border-orange-200 h-full flex flex-col">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">{selectedCampaign.name}</CardTitle>
              <CardDescription>Kết quả quét được từ chiến dịch. Hiển thị {filteredData.length} kết quả.</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              {selectedRows.length > 0 ? (
                <Button variant="destructive" size="sm" onClick={() => setIsDeleteAlertOpen(true)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Xóa ({selectedRows.length})
                </Button>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={handleOpenLogs}><History className="h-4 w-4 mr-2" /> Logs</Button>
                  <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm"><Filter className="h-4 w-4 mr-2" /> Lọc</Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 bg-gradient-to-br from-white via-brand-orange-light/50 to-white" align="end">
                      <div className="grid gap-4">
                        <div className="space-y-2"><h4 className="font-medium leading-none">Bộ lọc</h4><p className="text-sm text-muted-foreground">Lọc kết quả báo cáo theo các tiêu chí.</p></div>
                        <div className="grid gap-2">
                          {isFacebookCampaign && (
                            <>
                              <div className="grid grid-cols-3 items-center gap-4"><Label>Từ khoá</Label><div className="col-span-2"><MultiSelectCombobox options={keywordOptions} selected={selectedKeywords} onChange={setSelectedKeywords} placeholder="Chọn từ khoá..." /></div></div>
                              <div className="grid grid-cols-3 items-center gap-4"><Label>AI đánh giá</Label><div className="col-span-2"><MultiSelectCombobox options={aiEvaluationOptions} selected={selectedAiEvaluations} onChange={setSelectedAiEvaluations} placeholder="Chọn đánh giá..." /></div></div>
                            </>
                          )}
                          <div className="grid grid-cols-3 items-center gap-4"><Label>Cảm xúc</Label><div className="col-span-2"><MultiSelectCombobox options={sentimentOptions} selected={selectedSentiments} onChange={setSelectedSentiments} placeholder="Chọn cảm xúc..." /></div></div>
                          <div className="grid grid-cols-3 items-center gap-4"><Label>Từ ngày</Label><div className="col-span-2"><DateTimePicker date={startDate} setDate={setStartDate} /></div></div>
                          <div className="grid grid-cols-3 items-center gap-4"><Label>Đến ngày</Label><div className="col-span-2"><DateTimePicker date={endDate} setDate={setEndDate} /></div></div>
                        </div>
                        <div className="flex justify-between"><Button variant="ghost" onClick={handleClearFilters} className="text-brand-orange hover:text-brand-orange/80">Xóa bộ lọc</Button><Button onClick={handleApplyFilters} className="bg-brand-orange hover:bg-brand-orange/90 text-white">Áp dụng</Button></div>
                      </div>
                    </PopoverContent>
                  </Popover>
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
                    <Checkbox
                      checked={isAllOnPageSelected}
                      onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                      aria-label="Select all"
                      disabled={paginatedData.length === 0}
                    />
                  </TableHead>
                  {isFacebookCampaign ? (
                    <>
                      <TableHead>Nội dung bài viết</TableHead>
                      <TableHead>Thời gian đăng</TableHead>
                      <TableHead>Từ khoá</TableHead>
                      <TableHead>AI đánh giá</TableHead>
                      <TableHead>Cảm xúc</TableHead>
                      <TableHead className="text-right">Hành động</TableHead>
                    </>
                  ) : (
                    <>
                      <TableHead>Nội dung</TableHead>
                      <TableHead>Tác giả</TableHead>
                      <TableHead>Thời gian</TableHead>
                      <TableHead>Cảm xúc</TableHead>
                      <TableHead className="text-right">Hành động</TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={isFacebookCampaign ? 7 : 6} className="h-24 text-center">Đang tải báo cáo...</TableCell></TableRow>
                ) : paginatedData.length === 0 ? (
                  <TableRow><TableCell colSpan={isFacebookCampaign ? 7 : 6} className="h-24 text-center">Không có dữ liệu nào phù hợp.</TableCell></TableRow>
                ) : (
                  paginatedData.map((item) => (
                    <TableRow key={item.id} data-state={selectedRows.includes(item.id) && "selected"}>
                      <TableCell>
                        <Checkbox
                          checked={selectedRows.includes(item.id)}
                          onCheckedChange={(checked) => {
                            setSelectedRows(prev => checked ? [...prev, item.id] : prev.filter(id => id !== item.id));
                          }}
                          aria-label="Select row"
                        />
                      </TableCell>
                      {isFacebookCampaign ? (
                        <>
                          <TableCell className="max-w-md truncate cursor-pointer hover:text-brand-orange" onClick={() => handleViewContent(item.content)}>{item.content}</TableCell>
                          <TableCell>{item.posted_at ? format(new Date(item.posted_at), 'dd/MM/yyyy HH:mm') : 'N/A'}</TableCell>
                          <TableCell>
                            {item.keywords_found && item.keywords_found.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {item.keywords_found.map((keyword, index) => (
                                  <Badge key={index} variant="secondary">{keyword}</Badge>
                                ))}
                              </div>
                            ) : 'N/A'}
                          </TableCell>
                          <TableCell>{item.ai_evaluation || 'N/A'}</TableCell>
                          <TableCell>{getSentimentBadge(item.sentiment)}</TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell className="max-w-sm truncate cursor-pointer hover:text-brand-orange" onClick={() => handleViewContent(item.content)}>{item.content}</TableCell>
                          <TableCell>{item.author || 'N/A'}</TableCell>
                          <TableCell>{item.posted_at ? format(new Date(item.posted_at), 'dd/MM/yyyy HH:mm') : 'N/A'}</TableCell>
                          <TableCell>{getSentimentBadge(item.sentiment)}</TableCell>
                        </>
                      )}
                      <TableCell className="text-right">
                        {item.source_url ? (
                          <Button variant="ghost" size="icon" asChild className="text-brand-orange hover:bg-brand-orange-light hover:text-brand-orange">
                            <a href={item.source_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        ) : (
                           <Button variant="ghost" size="icon" disabled>
                              <ExternalLink className="h-4 w-4 text-gray-300" />
                           </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between pt-4 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <span>Hiển thị</span>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => {
                  setItemsPerPage(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-8 w-[75px]">
                  <SelectValue placeholder={itemsPerPage} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value={filteredData.length.toString()}>Tất cả</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-4">
              <span>
                Trang {currentPage} / {totalPages}
              </span>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages || totalPages === 0}
                >
                  Sau
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isContentModalOpen} onOpenChange={setIsContentModalOpen}>
        <DialogContent className="sm:max-w-2xl bg-gradient-to-br from-white via-brand-orange-light/50 to-white">
          <DialogHeader>
            <DialogTitle>Nội dung chi tiết</DialogTitle>
          </DialogHeader>
          <div className="py-4 max-h-[60vh] overflow-y-auto">
            <p className="whitespace-pre-wrap text-gray-800">{selectedContent}</p>
          </div>
        </DialogContent>
      </Dialog>

      <ScanLogsDialog
        isOpen={isLogsOpen}
        onOpenChange={setIsLogsOpen}
        logs={scanLogs}
        loading={loadingLogs}
      />

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Bạn sẽ xóa vĩnh viễn {selectedRows.length} mục đã chọn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSelected} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
              {isDeleting ? "Đang xóa..." : "Xác nhận xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ReportDetailsTable;