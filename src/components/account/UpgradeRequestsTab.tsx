import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { showError, showLoading, showSuccess, dismissToast } from '@/utils/toast';
import { format } from 'date-fns';
import { ArrowRight, Check, X } from 'lucide-react';

interface UpgradeRequest {
  id: string;
  created_at: string;
  status: 'pending' | 'approved' | 'rejected';
  profiles: {
    email: string;
    avatar_url: string | null;
  } | null;
  current_plan: {
    name: string;
  } | null;
  requested_plan: {
    name: string;
  } | null;
}

const UpgradeRequestsTab = () => {
  const [requests, setRequests] = useState<UpgradeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null); // Store request ID

  const fetchRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('upgrade_requests')
      .select(`
        id,
        created_at,
        status,
        profiles ( email, avatar_url ),
        current_plan:current_plan_id ( name ),
        requested_plan:requested_plan_id ( name )
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      showError("Không thể tải danh sách yêu cầu.");
      console.error(error);
    } else {
      setRequests(data as any);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleRequest = async (requestId: string, action: 'approve' | 'reject') => {
    setIsSubmitting(requestId);
    const toastId = showLoading(`Đang ${action === 'approve' ? 'duyệt' : 'từ chối'} yêu cầu...`);
    
    const { error } = await supabase.functions.invoke(`${action}-upgrade-request`, {
      body: { request_id: requestId }
    });

    dismissToast(toastId);
    if (error) {
      showError(`Thao tác thất bại: ${error.message}`);
    } else {
      showSuccess(`Đã ${action === 'approve' ? 'duyệt' : 'từ chối'} yêu cầu thành công!`);
      setRequests(prev => prev.filter(req => req.id !== requestId));
    }
    setIsSubmitting(null);
  };

  const getInitials = (email: string) => (email ? email.charAt(0).toUpperCase() : "P");

  return (
    <div className="border border-orange-200 rounded-lg bg-white">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 hover:bg-gray-50">
            <TableHead>Tài khoản</TableHead>
            <TableHead>Gói nâng cấp</TableHead>
            <TableHead>Ngày yêu cầu</TableHead>
            <TableHead className="text-right">Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={4} className="text-center py-8">Đang tải dữ liệu...</TableCell></TableRow>
          ) : requests.length === 0 ? (
            <TableRow><TableCell colSpan={4} className="text-center py-8">Không có yêu cầu nâng cấp nào đang chờ.</TableCell></TableRow>
          ) : (
            requests.map((req) => (
              <TableRow key={req.id}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={req.profiles?.avatar_url || ''} />
                      <AvatarFallback className="bg-brand-orange-light text-brand-orange">{getInitials(req.profiles?.email || "")}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{req.profiles?.email}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2 font-medium">
                    <Badge variant="outline">{req.current_plan?.name || 'Chưa có'}</Badge>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                    <Badge className="bg-brand-orange text-white">{req.requested_plan?.name}</Badge>
                  </div>
                </TableCell>
                <TableCell>{format(new Date(req.created_at), "dd/MM/yyyy HH:mm")}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-green-600 border-green-300 hover:bg-green-50 hover:text-green-700"
                    onClick={() => handleRequest(req.id, 'approve')}
                    disabled={isSubmitting === req.id}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Duyệt
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700"
                    onClick={() => handleRequest(req.id, 'reject')}
                    disabled={isSubmitting === req.id}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Từ chối
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default UpgradeRequestsTab;