import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from '@/integrations/supabase/client';
import { Campaign } from '@/pages/Index';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ExternalLink, Download, Filter, FileText, X } from 'lucide-react';
import { showError } from '@/utils/toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { MultiSelectCombobox, SelectOption } from "@/components/ui/multi-select-combobox";

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

  // Filter states
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [selectedAiEvaluations, setSelectedAiEvaluations] = useState<string[]>([]);
  const [selectedSentiments, setSelectedSentiments] = useState<string[]>([]);

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
    // Reset filters when data changes
    setSelectedKeywords([]);
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedAiEvaluations([]);
    setSelectedSentiments([]);
  }, [reportData]);

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
    setIsFilterOpen(false);
  };

  const handleClearFilters = () => {
    setSelectedKeywords([]);
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedAiEvaluations([]);
    setSelectedSentiments([]);
    setFilteredData(reportData);
    setIsFilterOpen(false);
  };

  const handleViewContent = (content: string | null) => {
    if (content) {
      setSelectedContent(content);
      setIsContentModalOpen(true);
    }
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

  return (
    <>
      <Card className="border-orange-200 h-full">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">{selectedCampaign.name}</CardTitle>
              <CardDescription>Kết quả quét được từ chiến dịch.</CardDescription>
            </div>
            <div className="flex space-x-2">
              <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm"><Filter className="h-4 w-4 mr-2" /> Lọc</Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 bg-gradient-to-br from-white via-brand-orange-light/50 to-white" align="end">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium leading-none">Bộ lọc</h4>
                      <p className="text-sm text-muted-foreground">
                        Lọc kết quả báo cáo theo các tiêu chí.
                      </p>
                    </div>
                    <div className="grid gap-2">
                      {isFacebookCampaign && (
                        <>
                          <div className="grid grid-cols-3 items-center gap-4">
                            <Label>Từ khoá</Label>
                            <div className="col-span-2">
                              <MultiSelectCombobox options={keywordOptions} selected={selectedKeywords} onChange={setSelectedKeywords} placeholder="Chọn từ khoá..." />
                            </div>
                          </div>
                          <div className="grid grid-cols-3 items-center gap-4">
                            <Label>AI đánh giá</Label>
                            <div className="col-span-2">
                              <MultiSelectCombobox options={aiEvaluationOptions} selected={selectedAiEvaluations} onChange={setSelectedAiEvaluations} placeholder="Chọn đánh giá..." />
                            </div>
                          </div>
                        </>
                      )}
                      <div className="grid grid-cols-3 items-center gap-4">
                        <Label>Cảm xúc</Label>
                        <div className="col-span-2">
                          <MultiSelectCombobox options={sentimentOptions} selected={selectedSentiments} onChange={setSelectedSentiments} placeholder="Chọn cảm xúc..." />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 items-center gap-4">
                        <Label>Từ ngày</Label>
                        <div className="col-span-2"><DateTimePicker date={startDate} setDate={setStartDate} /></div>
                      </div>
                      <div className="grid grid-cols-3 items-center gap-4">
                        <Label>Đến ngày</Label>
                        <div className="col-span-2"><DateTimePicker date={endDate} setDate={setEndDate} /></div>
                      </div>
                    </div>
                    <div className="flex justify-between">
                        <Button variant="ghost" onClick={handleClearFilters} className="text-brand-orange hover:text-brand-orange/80">Xóa bộ lọc</Button>
                        <Button onClick={handleApplyFilters} className="bg-brand-orange hover:bg-brand-orange/90 text-white">Áp dụng</Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-2" /> Xuất file</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
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
                  <TableRow><TableCell colSpan={isFacebookCampaign ? 6 : 5} className="h-24 text-center">Đang tải báo cáo...</TableCell></TableRow>
                ) : filteredData.length === 0 ? (
                  <TableRow><TableCell colSpan={isFacebookCampaign ? 6 : 5} className="h-24 text-center">Không có dữ liệu nào phù hợp.</TableCell></TableRow>
                ) : (
                  filteredData.map((item) => (
                    <TableRow key={item.id}>
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
    </>
  );
};

export default ReportDetailsTable;