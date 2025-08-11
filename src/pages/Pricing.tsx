import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const pricingPlans = [
  {
    name: "Miễn phí",
    price: "0đ",
    period: "/ tháng",
    description: "Dành cho cá nhân hoặc người mới bắt đầu muốn trải nghiệm.",
    features: [
      "1 chiến dịch",
      "100 lượt quét/tháng",
      "Hỗ trợ qua cộng đồng",
    ],
    buttonText: "Gói hiện tại",
    isCurrent: true,
    isFeatured: false,
  },
  {
    name: "Plus",
    price: "499.000đ",
    period: "/ tháng",
    description: "Dành cho doanh nghiệp nhỏ và người dùng chuyên nghiệp.",
    features: [
      "5 chiến dịch",
      "5.000 lượt quét/tháng",
      "Lọc bằng AI",
      "Hỗ trợ qua email",
    ],
    buttonText: "Nâng cấp",
    isCurrent: false,
    isFeatured: false,
  },
  {
    name: "Pro",
    price: "999.000đ",
    period: "/ tháng",
    description: "Giải pháp toàn diện cho doanh nghiệp lớn và agency.",
    features: [
      "20 chiến dịch",
      "20.000 lượt quét/tháng",
      "Tất cả tính năng gói Plus",
      "Hỗ trợ ưu tiên",
    ],
    buttonText: "Nâng cấp",
    isCurrent: false,
    isFeatured: true,
  },
  {
    name: "Custom",
    price: "Liên hệ",
    period: "",
    description: "Thiết kế riêng theo nhu cầu đặc thù của bạn.",
    features: [
      "Số lượng chiến dịch & lượt quét tùy chỉnh",
      "Tích hợp API riêng",
      "Hỗ trợ chuyên dụng",
      "Báo cáo theo yêu cầu",
    ],
    buttonText: "Liên hệ",
    isCurrent: false,
    isFeatured: false,
  },
];

const Pricing = () => {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold">Bảng giá dịch vụ</h1>
        <p className="text-lg text-gray-500 mt-2">
          Chọn gói phù hợp nhất với nhu cầu của bạn.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {pricingPlans.map((plan) => (
          <Card
            key={plan.name}
            className={cn(
              "flex flex-col",
              plan.isFeatured && "border-brand-orange border-2 shadow-lg"
            )}
          >
            <CardHeader className="relative">
              {plan.isFeatured && (
                <div className="absolute top-0 right-4 -mt-3 bg-brand-orange text-white text-xs font-bold px-3 py-1 rounded-full">
                  Phổ biến
                </div>
              )}
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="mb-6">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-gray-500">{plan.period}</span>
              </div>
              <ul className="space-y-3 flex-1">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                className={cn(
                  "w-full mt-6",
                  plan.isFeatured ? "bg-brand-orange hover:bg-brand-orange/90 text-white" : "bg-gray-800 text-white hover:bg-gray-700"
                )}
                disabled={plan.isCurrent}
              >
                {plan.buttonText}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Pricing;