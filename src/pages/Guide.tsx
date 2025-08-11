import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FileText, Target, SlidersHorizontal, KeyRound, Book, ChevronRight } from "lucide-react";
import { cn } from '@/lib/utils';

// Define the structure for a guide section
interface GuideSection {
  id: string;
  title: string;
  icon: React.ElementType;
  content: React.ReactNode;
}

// Content for each section
const sections: GuideSection[] = [
  {
    id: 'introduction',
    title: 'Giới thiệu',
    icon: Book,
    content: (
      <div>
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Chào mừng đến với Listen PRO</h2>
        <p className="text-lg text-gray-600">
          Listen PRO là một công cụ mạnh mẽ giúp bạn theo dõi, thu thập và phân tích thông tin từ nhiều nguồn khác nhau trên internet như mạng xã hội và website. Tài liệu này sẽ hướng dẫn bạn từng bước để khai thác tối đa các tính năng của ứng dụng.
        </p>
      </div>
    ),
  },
  {
    id: 'api-keys',
    title: 'Cấu hình API Keys',
    icon: KeyRound,
    content: (
      <div className="prose max-w-none">
        <p>
          Đây là bước đầu tiên và quan trọng nhất để ứng dụng có thể hoạt động. Bạn cần cung cấp các API key cho các dịch vụ bên thứ ba mà Listen PRO sử dụng để thu thập và phân tích dữ liệu.
        </p>
        <ul>
          <li><strong>API AI (Gemini):</strong> Dùng để phân tích và đánh giá nội dung bằng trí tuệ nhân tạo. Bạn có thể lấy key từ <a href="https://aistudio.google.com" target="_blank" rel="noopener noreferrer">Google AI Studio</a>.</li>
          <li><strong>API Facebook:</strong> Dùng để lấy dữ liệu từ các group Facebook. Bạn cần sử dụng URL và Token từ dịch vụ proxy được cung cấp cho bạn.</li>
          <li><strong>API Firecrawl:</strong> Dùng để thu thập dữ liệu từ các website. Bạn có thể đăng ký và lấy key từ <a href="https://firecrawl.dev" target="_blank" rel="noopener noreferrer">Firecrawl.dev</a>.</li>
        </ul>
        <p>
          Sau khi nhập key vào các trường tương ứng trong mục "API Keys", hãy bấm nút <strong>Test Connection</strong> để đảm bảo thông tin chính xác trước khi bấm <strong>Save</strong>.
        </p>
      </div>
    ),
  },
  {
    id: 'data-sources',
    title: 'Thiết lập Nguồn',
    icon: SlidersHorizontal,
    content: (
      <div className="prose max-w-none">
        <p>
          Tại mục "Thiết lập nguồn", bạn có thể quản lý danh sách các nguồn mà bạn muốn theo dõi. Nguồn được chia thành hai loại chính:
        </p>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>Nguồn Website</AccordionTrigger>
            <AccordionContent>
              Thêm các URL của website bạn muốn quét. Mỗi website có thể được cấu hình với một "Endpoint" khác nhau (/scrape, /crawl, /map) tùy thuộc vào cấu trúc của trang web đó và loại dữ liệu bạn muốn thu thập.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Nguồn Group Facebook</AccordionTrigger>
            <AccordionContent>
              Thêm các Group ID và Tên Group mà bạn muốn theo dõi. Dữ liệu từ các group này sẽ được thu thập để phân tích.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        <p className="mt-4">
          Bạn có thể thêm từng nguồn một cách thủ công hoặc sử dụng tính năng <strong>Import</strong> để thêm hàng loạt từ file Excel, giúp tiết kiệm thời gian khi có nhiều nguồn cần quản lý.
        </p>
      </div>
    ),
  },
  {
    id: 'campaigns',
    title: 'Quản lý Chiến dịch',
    icon: Target,
    content: (
      <div className="prose max-w-none">
        <p>
          Chiến dịch là trung tâm của Listen PRO. Mỗi chiến dịch sẽ liên kết các nguồn dữ liệu và các thiết lập quét để thu thập thông tin theo mục tiêu của bạn.
        </p>
        <ul>
          <li><strong>Tên chiến dịch:</strong> Đặt một cái tên dễ nhớ để phân biệt.</li>
          <li><strong>Loại chiến dịch:</strong> Chọn Facebook, Website, hoặc Tổng hợp (kết hợp cả hai).</li>
          <li><strong>Nguồn:</strong> Chọn các nguồn (group, website) đã được thiết lập trước đó để đưa vào chiến dịch.</li>
          <li><strong>Tần suất quét:</strong> Cài đặt thời gian giữa các lần quét (phút, giờ, ngày).</li>
          <li><strong>Lọc bằng AI (chỉ cho Facebook):</strong> Bật tính năng này và cung cấp "Yêu cầu AI" (prompt) để AI tự động phân tích và đánh giá nội dung bài viết theo các tiêu chí của bạn.</li>
        </ul>
        <p>
          Sau khi tạo, bạn có thể "Tạm dừng", "Tiếp tục", "Sửa", "Xóa" hoặc thực hiện <strong>Quét ngay</strong> cho mỗi chiến dịch.
        </p>
      </div>
    ),
  },
  {
    id: 'reports',
    title: 'Xem Báo cáo',
    icon: FileText,
    content: (
      <div className="prose max-w-none">
        <p>
          Mục "Báo cáo" hiển thị tất cả dữ liệu đã được thu thập từ các chiến dịch của bạn.
        </p>
        <ul>
          <li>Chọn một chiến dịch từ danh sách bên trái để xem chi tiết kết quả quét.</li>
          <li>Dữ liệu được hiển thị trong một bảng, bạn có thể xem chi tiết từng mục, xóa các mục không cần thiết hoặc xuất toàn bộ báo cáo ra file Excel.</li>
          <li>Sử dụng nút <strong>Logs</strong> để xem lịch sử chi tiết các lần quét của chiến dịch, bao gồm cả các lỗi (nếu có), giúp bạn theo dõi và gỡ lỗi khi cần.</li>
        </ul>
      </div>
    ),
  },
];

const Guide = () => {
  const [activeSection, setActiveSection] = useState<string>(sections[0].id);

  const currentSection = sections.find(s => s.id === activeSection);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Hướng dẫn sử dụng</h1>
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Navigation */}
        <nav className="md:w-1/4 lg:w-1/5">
          <div className="space-y-2">
            {sections.map(section => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "w-full flex items-center justify-between text-left p-3 rounded-lg transition-colors",
                  activeSection === section.id
                    ? "bg-brand-orange-light text-brand-orange font-semibold"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <div className="flex items-center space-x-3">
                  <section.icon className="h-5 w-5 flex-shrink-0" />
                  <span>{section.title}</span>
                </div>
                <ChevronRight className={cn(
                  "h-4 w-4 transition-transform",
                  activeSection === section.id ? "transform translate-x-1" : ""
                )} />
              </button>
            ))}
          </div>
        </nav>

        {/* Right Content */}
        <main className="flex-1 md:w-3/4 lg:w-4/5">
          <Card className="border-orange-200 h-full">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3 text-2xl">
                {currentSection && <currentSection.icon className="h-7 w-7 text-brand-orange" />}
                <span>{currentSection?.title}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentSection?.content}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default Guide;