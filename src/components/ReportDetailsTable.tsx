import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from '@/integrations/supabase/client';
import { Campaign } from '@/pages/Index';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ExternalLink, Download, Filter, FileText } from 'lucide-react';

interface ReportData {
  id: string;
  content: string;
  source_url: string;
  author: string;
  posted_at: string;
  sentiment: 'positive' | 'negative' | 'neutral' | null;
  keywords_found?: string[] | null;
  ai_evaluation?: string | null;
}

interface ReportDetailsTableProps {
  selectedCampaign: Campaign | null;
}

const ReportDetailsTable = ({ selectedCampaign }: ReportDetailsTableProps) => {
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchReportData = async () => {
      if (!selectedCampaign) {
        setReportData([]);
        return;
      }
      setLoading(true);
      
      // NOTE: Using mock data for demonstration.
      const mockData: ReportData[] = [
        { id: '1', content: 'Sản phẩm này thật tuyệt vời, rất đáng tiền!', source_url: 'https://facebook.com/post/1', author: 'Nguyễn Văn A', posted_at: new Date().toISOString(), sentiment: 'positive', keywords_found: ['sản phẩm', 'tuyệt vời'], ai_evaluation: 'Phù hợp' },
        { id: '2', content: 'Chất lượng dịch vụ quá tệ, không bao giờ quay lại.', source_url: 'https://facebook.com/post/2', author: 'Trần Thị B', posted_at: new Date(Date.now() - 3600 * 1000 * 24).toISOString(), sentiment: 'negative', keywords_found: ['dịch vụ', 'tệ'], ai_evaluation: 'Phù hợp' },
        { id: '3', content: 'Giá hơi cao nhưng chấp nhận được.', source_url: 'https://example.com/review/3', author: 'Lê Văn C', posted_at: new Date(Date.now() - 3600 * 1000 * 48).toISOString(), sentiment: 'neutral', keywords_found: ['giá'], ai_evaluation: 'Không phù hợp' },
        { id: '4', content: 'Hôm nay cửa hàng có mở cửa không?', source_url: 'https://facebook.com/post/4', author: 'Phạm D', posted_at: new Date(Date.now() - 3600 * 1000 * 72).toISOString(), sentiment: null, keywords_found: null, ai_evaluation: 'Không phù hợp' },
      ];
      
      setTimeout(() => {
        setReportData(mockData);
        setLoading(false);
      }, 1000);
    };

    fetchReportData();
  }, [selectedCampaign]);

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
    <Card className="border-orange-200 h-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{selectedCampaign.name}</CardTitle>
            <CardDescription>Kết quả quét được từ chiến dịch.</CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm"><Filter className="h-4 w-4 mr-2" /> Lọc</Button>
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
              ) : reportData.length === 0 ? (
                <TableRow><TableCell colSpan={isFacebookCampaign ? 6 : 5} className="h-24 text-center">Không có dữ liệu cho chiến dịch này.</TableCell></TableRow>
              ) : (
                reportData.map((item) => (
                  <TableRow key={item.id}>
                    {isFacebookCampaign ? (
                      <>
                        <TableCell className="max-w-md truncate">{item.content}</TableCell>
                        <TableCell>{format(new Date(item.posted_at), 'dd/MM/yyyy HH:mm')}</TableCell>
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
                        <TableCell className="max-w-sm truncate">{item.content}</TableCell>
                        <TableCell>{item.author}</TableCell>
                        <TableCell>{format(new Date(item.posted_at), 'dd/MM/yyyy HH:mm')}</TableCell>
                        <TableCell>{getSentimentBadge(item.sentiment)}</TableCell>
                      </>
                    )}
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild className="text-brand-orange hover:bg-brand-orange-light hover:text-brand-orange">
                        <a href={item.source_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportDetailsTable;