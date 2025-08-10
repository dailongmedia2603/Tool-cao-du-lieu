import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, CheckCircle, XCircle, FileClock, Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface ScanLog {
  id: string;
  campaign_id: string;
  scan_time: string;
  status: 'success' | 'error' | 'info';
  message: string;
  log_type: 'progress' | 'final';
}

interface CampaignScanStatus {
  campaignId: string;
  campaignName: string;
  logs: ScanLog[];
  status: 'scanning' | 'completed' | 'failed';
  latestMessage: string;
}

interface ScanStatusPopupProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const ScanStatusPopup = ({ isOpen, onOpenChange }: ScanStatusPopupProps) => {
  const [scanStatuses, setScanStatuses] = useState<CampaignScanStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    const fetchInitialData = async () => {
      setLoading(true);
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const { data: recentLogsData, error: logError } = await supabase
        .from('scan_logs')
        .select('*')
        .gte('scan_time', twentyFourHoursAgo)
        .order('scan_time', { ascending: false });

      if (logError) {
        console.error("Error fetching initial logs:", logError);
        setLoading(false);
        return;
      }

      const recentLogs: ScanLog[] = recentLogsData || [];

      const campaignIds = [...new Set(recentLogs.map(log => log.campaign_id))];
      if (campaignIds.length === 0) {
        setScanStatuses([]);
        setLoading(false);
        return;
      }
      
      const { data: campaignsData, error: campaignError } = await supabase
        .from('danh_sach_chien_dich')
        .select('id, name')
        .in('id', campaignIds);

      if (campaignError) {
        console.error("Error fetching campaign names:", campaignError);
        setLoading(false);
        return;
      }

      const campaigns = campaignsData || [];
      const campaignMap = new Map(campaigns.map(c => [c.id, c.name]));

      const groupedLogs = recentLogs.reduce((acc, log) => {
        if (!acc[log.campaign_id]) {
          acc[log.campaign_id] = [];
        }
        acc[log.campaign_id].push(log);
        return acc;
      }, {} as Record<string, ScanLog[]>);

      const statuses: CampaignScanStatus[] = Object.entries(groupedLogs).map(([campaignId, logs]) => {
        const latestLog = logs[0];
        let status: 'scanning' | 'completed' | 'failed' = 'scanning';
        if (latestLog.log_type === 'final') {
          status = latestLog.status === 'success' ? 'completed' : 'failed';
        }
        
        return {
          campaignId,
          campaignName: campaignMap.get(campaignId) || 'Unknown Campaign',
          logs,
          status,
          latestMessage: latestLog.message,
        };
      }).sort((a, b) => new Date(b.logs[0].scan_time).getTime() - new Date(a.logs[0].scan_time).getTime());

      setScanStatuses(statuses);
      setLoading(false);
    };

    fetchInitialData();

    const channel = supabase.channel('scan-status-popup')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'scan_logs' }, (payload) => {
        fetchInitialData(); // Refetch all on new log to keep it simple and robust
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };

  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-gradient-to-br from-white via-brand-orange-light/50 to-white">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Activity className="h-6 w-6 text-brand-orange" />
            <span>Trạng thái quét Real-time</span>
          </DialogTitle>
          <DialogDescription>
            Theo dõi tiến trình của các chiến dịch đang được quét. Tự động cập nhật.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] p-1">
          <div className="space-y-4 p-4">
            {loading ? (
              <div className="text-center text-gray-500 flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" /> Đang tải trạng thái...
              </div>
            ) : scanStatuses.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <FileClock className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium">Không có hoạt động quét gần đây</h3>
                <p className="mt-1 text-sm text-gray-500">Trạng thái sẽ xuất hiện ở đây khi bạn bắt đầu quét.</p>
              </div>
            ) : (
              scanStatuses.map(status => (
                <div key={status.campaignId} className="p-4 border border-orange-100 rounded-lg bg-white/60">
                  <div className="flex items-start space-x-4">
                    <div className="mt-1">
                      {status.status === 'scanning' && <Loader2 className="h-5 w-5 text-brand-orange animate-spin" />}
                      {status.status === 'completed' && <CheckCircle className="h-5 w-5 text-green-500" />}
                      {status.status === 'failed' && <XCircle className="h-5 w-5 text-red-500" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-800">{status.campaignName}</p>
                      <p className="text-sm text-gray-600">{status.latestMessage}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(status.logs[0].scan_time), { addSuffix: true, locale: vi })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ScanStatusPopup;