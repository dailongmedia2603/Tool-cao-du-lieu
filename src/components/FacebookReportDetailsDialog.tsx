import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  CalendarDays,
  Tags,
  BrainCircuit,
  Smile,
  Meh,
  Frown,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ReportData {
  id: string;
  keywords_found?: string[] | null;
  ai_evaluation?: string | null;
  title: string | null;
  price: string | null;
  area: string | null;
  address: string | null;
  listing_url: string | null;
  posted_date_string: string | null;
  description: string | null;
  source_url: string | null;
  posted_at: string | null;
  sentiment: 'positive' | 'negative' | 'neutral' | null;
}

interface FacebookReportDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  item: ReportData | null;
}

const DetailItem = ({ icon: Icon, label, children, className }: { icon: React.ElementType; label: string; children: React.ReactNode; className?: string }) => {
  return (
    <div className={cn("flex flex-col space-y-2", className)}>
      <div className="flex items-center space-x-2">
        <Icon className="h-5 w-5 text-brand-orange flex-shrink-0" />
        <p className="text-sm font-semibold text-gray-600">{label}</p>
      </div>
      <div className="pl-7 text-base text-gray-800">
        {children || <span className="text-sm text-gray-400 italic">Chưa có dữ liệu</span>}
      </div>
    </div>
  );
};

const SentimentBadge = ({ sentiment }: { sentiment: 'positive' | 'negative' | 'neutral' | null }) => {
  if (!sentiment) return null;

  switch (sentiment) {
    case 'positive':
      return <Badge className="bg-green-100 text-green-800 border-green-200 flex items-center"><Smile className="h-4 w-4 mr-1.5" /> Tích cực</Badge>;
    case 'negative':
      return <Badge className="bg-red-100 text-red-800 border-red-200 flex items-center"><Frown className="h-4 w-4 mr-1.5" /> Tiêu cực</Badge>;
    case 'neutral':
      return <Badge className="bg-gray-100 text-gray-800 border-gray-200 flex items-center"><Meh className="h-4 w-4 mr-1.5" /> Trung tính</Badge>;
    default:
      return null;
  }
};

export const FacebookReportDetailsDialog = ({ isOpen, onOpenChange, item }: FacebookReportDetailsDialogProps) => {
  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-gradient-to-br from-white via-brand-orange-light/50 to-white">
        <DialogHeader>
          <DialogTitle>Chi tiết bài viết</DialogTitle>
          <DialogDescription>
            Thông tin chi tiết được trích xuất từ nguồn Facebook.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 max-h-[60vh] overflow-y-auto space-y-6 pr-4">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DetailItem icon={CalendarDays} label="Ngày đăng">
              {item.posted_at ? format(new Date(item.posted_at), 'dd/MM/yyyy HH:mm') : null}
            </DetailItem>
            <DetailItem icon={Smile} label="Cảm xúc">
              <SentimentBadge sentiment={item.sentiment} />
            </DetailItem>
          </div>

          <DetailItem icon={Tags} label="Từ khóa được tìm thấy">
            {item.keywords_found && item.keywords_found.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {item.keywords_found.map((kw, i) => <Badge key={i} variant="secondary">{kw}</Badge>)}
              </div>
            ) : null}
          </DetailItem>

          <DetailItem icon={FileText} label="Nội dung chi tiết">
            {item.description ? (
              <p className="whitespace-pre-wrap text-gray-700 text-sm font-normal bg-white/50 p-3 rounded-md border border-orange-100">
                {item.description}
              </p>
            ) : null}
          </DetailItem>

          <DetailItem icon={BrainCircuit} label="AI Đánh giá">
            {item.ai_evaluation ? (
              <p className="text-gray-700 text-sm font-normal bg-white/50 p-3 rounded-md border border-orange-100">{item.ai_evaluation}</p>
            ) : null}
          </DetailItem>

        </div>
      </DialogContent>
    </Dialog>
  );
};