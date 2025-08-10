import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Campaign } from './Index';
import ReportWidget from '@/components/ReportWidget';
import CampaignSelector from '@/components/CampaignSelector';
import ReportDetailsTable from '@/components/ReportDetailsTable';
import { BarChart, MessageSquare, Users, AlertCircle } from 'lucide-react';

const Reports = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCampaigns = async () => {
      setLoadingCampaigns(true);
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching campaigns:", error);
      } else {
        setCampaigns(data as Campaign[]);
        // Auto-select the first campaign if available
        if (data && data.length > 0) {
          setSelectedCampaignId(data[0].id);
        }
      }
      setLoadingCampaigns(false);
    };

    fetchCampaigns();
  }, []);

  const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId) || null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Báo cáo</h1>
        <p className="text-gray-500 mt-1">
          Theo dõi kết quả được trả về khi chiến dịch được chạy.
        </p>
      </div>

      {/* Report Widgets */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <ReportWidget
          icon={<BarChart className="h-5 w-5" />}
          title="Tổng số kết quả"
          value="1,234"
          change={12}
        />
        <ReportWidget
          icon={<MessageSquare className="h-5 w-5" />}
          title="Bình luận tích cực"
          value="820"
          change={5}
        />
        <ReportWidget
          icon={<Users className="h-5 w-5" />}
          title="Lượt tiếp cận"
          value="15,6k"
          change={-2}
        />
        <ReportWidget
          icon={<AlertCircle className="h-5 w-5" />}
          title="Bình luận tiêu cực"
          value="56"
          change={-10}
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <CampaignSelector
            campaigns={campaigns}
            selectedCampaignId={selectedCampaignId}
            onSelectCampaign={setSelectedCampaignId}
            loading={loadingCampaigns}
          />
        </div>
        <div className="lg:col-span-2">
          <ReportDetailsTable selectedCampaign={selectedCampaign} />
        </div>
      </div>
    </div>
  );
};

export default Reports;