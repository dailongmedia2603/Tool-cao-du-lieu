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
import { CheckCircle, XCircle, Clock, Code, CalendarRange } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ScanLog {
  id: string;
  scan_time: string;
  status: 'success' | 'error';
  message: string;
  details: any;
}

interface ScanLogsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  logs: ScanLog[];
  loading: boolean;
}

const formatTimestamp = (timestamp: number | null | undefined) => {
  if (!timestamp) return 'N/A';
  // Timestamp is in seconds, convert to milliseconds for Date object
  return format(new Date(timestamp * 1000), "HH:mm dd/MM/yyyy");
};

export const ScanLogsDialog = ({ isOpen, onOpenChange, logs, loading }: ScanLogsDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl bg-gradient-to-br from-white via-brand-orange-light/50 to-white p-0">
        <DialogHeader className="p-6 pb-4 border-b border-orange-100">
          <DialogTitle className="text-2xl font-bold text-gray-800">
            Lịch sử quét
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="p-6">
            {loading ? (
              <p className="text-center text-gray-500">Đang tải lịch sử...</p>
            ) : logs.length === 0 ? (
              <p className="text-center text-gray-500">Chưa có lịch sử quét nào.</p>
            ) : (
              <Accordion type="single" collapsible className="w-full space-y-2">
                {logs.map((log) => (
                  <AccordionItem value={log.id} key={log.id} className="border border-orange-100 rounded-lg bg-white/50">
                    <AccordionTrigger className="p-4 hover:no-underline">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center space-x-4">
                          {log.status === 'success' ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                          <div className="text-left">
                            <p className="font-semibold text-gray-800">{log.message}</p>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 mt-1">
                              <span className="flex items-center">
                                <Clock className="h-3 w-3 mr-1.5" />
                                {format(new Date(log.scan_time), "dd/MM/yyyy, HH:mm:ss")}
                              </span>
                              {log.details?.since && log.details?.until && (
                                <span className="flex items-center border-l border-gray-300 pl-4">
                                  <CalendarRange className="h-3 w-3 mr-1.5" />
                                  {`Từ ${formatTimestamp(log.details.since)} đến ${formatTimestamp(log.details.until)}`}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Badge variant={log.status === 'success' ? 'default' : 'destructive'} className={cn(log.status === 'success' && 'bg-green-500')}>
                          {log.status === 'success' ? 'Thành công' : 'Thất bại'}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-4 pt-0">
                      <div className="bg-gray-800 text-white p-4 rounded-md">
                        <h4 className="font-semibold mb-2 flex items-center"><Code className="h-4 w-4 mr-2"/>Chi tiết API</h4>
                        <pre className="text-xs whitespace-pre-wrap break-all overflow-x-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};