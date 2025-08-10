import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Campaign } from "@/pages/Index";
import { Facebook, Globe, Combine } from "lucide-react";

interface CampaignSelectorProps {
  campaigns: Campaign[];
  selectedCampaignId: string | null;
  onSelectCampaign: (id: string) => void;
  loading: boolean;
}

const CampaignSelector = ({ campaigns, selectedCampaignId, onSelectCampaign, loading }: CampaignSelectorProps) => {
  const facebookCampaigns = campaigns.filter(c => c.type === 'Facebook');
  const websiteCampaigns = campaigns.filter(c => c.type === 'Website');
  const combinedCampaigns = campaigns.filter(c => c.type === 'Tổng hợp');

  const campaignTypes = [
    { type: 'Facebook', campaigns: facebookCampaigns, icon: <Facebook className="h-5 w-5 text-blue-600" /> },
    { type: 'Website', campaigns: websiteCampaigns, icon: <Globe className="h-5 w-5 text-green-600" /> },
    { type: 'Tổng hợp', campaigns: combinedCampaigns, icon: <Combine className="h-5 w-5 text-purple-600" /> },
  ];

  return (
    <Card className="border-orange-200 h-full">
      <CardHeader>
        <CardTitle>Chọn chiến dịch</CardTitle>
        <CardDescription>Chọn một chiến dịch để xem báo cáo chi tiết.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center text-gray-500">Đang tải chiến dịch...</div>
        ) : (
          <Accordion type="multiple" defaultValue={['Facebook', 'Website', 'Tổng hợp']} className="w-full">
            {campaignTypes.map(ct => ct.campaigns.length > 0 && (
              <AccordionItem value={ct.type} key={ct.type}>
                <AccordionTrigger className="font-semibold text-base hover:no-underline">
                  <div className="flex items-center space-x-2">
                    {ct.icon}
                    <span>{ct.type}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pl-2 pr-0 pb-0">
                  <div className="space-y-1">
                    {ct.campaigns.map(campaign => (
                      <Button
                        key={campaign.id}
                        variant="ghost"
                        className={cn(
                          "w-full justify-start text-left h-auto py-2",
                          selectedCampaignId === campaign.id && "bg-brand-orange-light text-brand-orange"
                        )}
                        onClick={() => onSelectCampaign(campaign.id)}
                      >
                        {campaign.name}
                      </Button>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
};

export default CampaignSelector;