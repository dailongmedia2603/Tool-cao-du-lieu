import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { CheckCircle, XCircle, Clock, Code, CalendarRange, Info, Facebook, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

export interface ScanLog {
  id: string;
  scan_time: string;
  status: 'success' | 'error' | 'info';
  message: string;
  details: any;
  source_type: string | null;
  log_type: 'progress' | 'final';
}

interface ScanLogsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  logs: ScanLog[];
  loading: boolean;
}

const formatTimestamp = (timestamp: number | null | undefined) => {
  if (!timestamp) return 'N/A';
  return format(new Date(timestamp * 1000), "HH:mm dd/MM/yyyy");
};

const SourceBadge = ({ sourceType }: { sourceType: string | null }) => {
  if (!sourceType) return null;
  const isFacebook = sourceType.toLowerCase().includes('facebook');
  const isWebsite = sourceType.toLowerCase().includes('website');
  return (
    <Badge variant="outline" className={cn(
      "border-gray-300",
      isFacebook && "border-blue-200 bg-blue-50 text-blue-700",
      isWebsite && "border-green-200 bg-green-50 text-green-700",
    )}>
      {isFacebook && <Facebook className="h-3 w-3 mr-1.5" />}
      {isWebsite && <Globe className="h-3 w-3 mr-1.5" />}
      {sourceType}
    </Badge>
  );
};

export const ScanLogsDialog = ({ isOpen, onOpenChange, logs, loading }: ScanLogsDialogProps) => {
  const scanSessions = useMemo(() => {
    if (!logs || logs.length === 0) return [];
    const sortedLogs = [...logs].sort((a, b) => new Date(a.scan_time).getTime() - new Date(b.scan_time).getTime());
    const sessions: ScanLog[][] = [];
    let currentSession: ScanLog[] = [];
    for (const log of sortedLogs) {
      currentSession.push(log);
      if (log.log_type === 'final') {
        sessions.push(currentSession);
        currentSession = [];
      }
    }
    if (currentSession.length > 0) {
      sessions.push(currentSession);
    }
    return sessions.reverse();
  }, [logs]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl bg-gradient-to-br from-white via-brand-orange-light/50 to-white p-0">
        <DialogHeader className="p-6 pb-4 border-b border-orange-100">
          <DialogTitle className="text-2xl font-bold text-gray-800">Lịch sử quét</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="p-6">
            {loading ? (
              <p className="text-center text-gray-500">Đang tải lịch sử...</p>
            ) : scanSessions.length === 0 ? (
              <p className="text-center text-gray-500">Chưa có lịch sử quét nào.</p>
            ) : (
              <Accordion type="multiple" className="w-full space-y-2">
                {scanSessions.map((session, index) => {
                  const finalLog = session.find(l => l.log_type === 'final') || session[session.length - 1];
                  const sessionStatus = finalLog.status;
                  const sessionMessage = finalLog.message;
                  const sessionTime = finalLog.scan_time;
                  const firstLog = session[0];

                  return (
                    <AccordionItem value={`session-${index}`} key={index} className="border border-orange-100 rounded-lg bg-white/50">
                      <AccordionTrigger className="p-4 hover:no-underline">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center space-x-4">
                            {sessionStatus === 'success' ? <CheckCircle className="h-5 w-5 text-green-500" /> : sessionStatus === 'error' ? <XCircle className="h-5 w-5 text-red-500" /> : <Info className="h-5 w-5 text-blue-500" />}
                            <div className="text-left">
                              <p className="font-semibold text-gray-800">{sessionMessage}</p>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 mt-1">
                                <span className="flex items-center"><Clock className="h-3 w-3 mr-1.5" />{format(new Date(sessionTime), "dd/MM/yyyy, HH:mm:ss")}</span>
                                <SourceBadge sourceType={firstLog.source_type} />
                              </div>
                            </div>
                          </div>
                          <Badge variant={sessionStatus === 'success' ? 'default' : sessionStatus === 'error' ? 'destructive' : 'secondary'} className={cn(sessionStatus === 'success' && 'bg-green-500', sessionStatus === 'info' && 'bg-blue-100 text-blue-800')}>
                            {sessionStatus === 'success' ? 'Hoàn thành' : sessionStatus === 'error' ? 'Thất bại' : 'Đang xử lý'}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="p-4 pt-0">
                        <div className="bg-gray-800 text-white p-4 rounded-md">
                          <h4 className="font-semibold mb-2 flex items-center"><Code className="h-4 w-4 mr-2"/>Chi tiết phiên quét</h4>
                          <pre className="text-xs whitespace-pre-wrap break-all overflow-x-auto">{JSON.stringify(finalLog.details, null, 2)}</pre>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )
                })}
              </Accordion>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};