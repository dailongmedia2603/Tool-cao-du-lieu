import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FileText, Target, SlidersHorizontal, KeyRound } from "lucide-react";

const Guide = () => {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-4xl font-bold text-gray-800">Hướng dẫn sử dụng</h1>
        <p className="text-lg text-gray-500 mt-2">
          Chào mừng bạn đến với Listen PRO. Tài liệu này sẽ hướng dẫn bạn cách sử dụng các tính năng chính của ứng dụng.
        </p>
      </div>

      <Card className="border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-3">
            <KeyRound className="h-6 w-6 text-brand-orange" />
            <span>1. Cấu hình API Keys</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="prose max-w-none">
          <p>
            Đây là bước đầu tiên và quan trọng nhất để ứng dụng có thể hoạt động. Bạn cần cung cấp các API key cho các dịch vụ bên thứ ba.
          </p>
          <ul>
            <li><strong>API AI (Gemini):</strong> Dùng để phân tích và đánh giá nội dung. Lấy key từ <a href="https://aistudio.google.com" target="_blank" rel="noopener noreferrer">Google AI Studio</a>.</li>
            <li><strong>API Facebook:</strong> Dùng để lấy dữ liệu từ các group Facebook. Bạn cần sử dụng URL và Token từ dịch vụ proxy được cung cấp.</li>
            <li><strong>API Firecrawl:</strong> Dùng để thu thập dữ liệu từ các website. Lấy key từ <a href="https://firecrawl.dev" target="_blank" rel="noopener noreferrer">Firecrawl.dev</a>.</li>
          </ul>
          <p>
            Sau khi nhập key, hãy bấm nút "Test Connection" để đảm bảo thông tin chính xác trước khi "Save".
          </p>
        </CardContent>
      </Card>

      <Card className="border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-3">
            <SlidersHorizontal className="h-6 w-6 text-brand-orange" />
            <span>2. Thiết lập Nguồn dữ liệu</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="prose max-w-none">
          <p>
            Tại mục "Thiết lập nguồn", bạn có thể quản lý danh sách các nguồn mà bạn muốn theo dõi.
          </p>
          <Accordion type="single" collapsible>
            <AccordionItem value="item-1">
              <AccordionTrigger>Nguồn Website</AccordionTrigger>
              <AccordionContent>
                Thêm các URL của website bạn muốn quét. Mỗi website có thể được cấu hình với một "Endpoint" khác nhau (/scrape, /crawl, /map) tùy thuộc vào cấu trúc của trang web đó.
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
            Bạn có thể thêm từng nguồn một cách thủ công hoặc sử dụng tính năng "Import" để thêm hàng loạt từ file Excel.
          </p>
        </CardContent>
      </Card>

      <Card className="border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-3">
            <Target className="h-6 w-6 text-brand-orange" />
            <span>3. Tạo và Quản lý Chiến dịch</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="prose max-w-none">
          <p>
            Chiến dịch là trung tâm của Listen PRO. Mỗi chiến dịch sẽ liên kết các nguồn dữ liệu và các thiết lập quét để thu thập thông tin.
          </p>
          <ul>
            <li><strong>Tên chiến dịch:</strong> Đặt một cái tên dễ nhớ để phân biệt.</li>
            <li><strong>Loại chiến dịch:</strong> Chọn Facebook, Website, hoặc Tổng hợp.</li>
            <li><strong>Nguồn:</strong> Chọn các nguồn (group, website) đã được thiết lập trước đó.</li>
            <li><strong>Tần suất quét:</strong> Cài đặt thời gian giữa các lần quét (phút, giờ, ngày).</li>
            <li><strong>Lọc bằng AI (chỉ cho Facebook):</strong> Bật tính năng này và cung cấp "Yêu cầu AI" (prompt) để AI tự động phân tích và đánh giá nội dung bài viết.</li>
          </ul>
          <p>
            Sau khi tạo, bạn có thể "Tạm dừng", "Tiếp tục", "Sửa", "Xóa" hoặc "Quét ngay" cho mỗi chiến dịch.
          </p>
        </CardContent>
      </Card>

      <Card className="border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-3">
            <FileText className="h-6 w-6 text-brand-orange" />
            <span>4. Xem Báo cáo</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="prose max-w-none">
          <p>
            Mục "Báo cáo" hiển thị tất cả dữ liệu đã được thu thập từ các chiến dịch của bạn.
          </p>
          <ul>
            <li>Chọn một chiến dịch từ danh sách bên trái để xem chi tiết.</li>
            <li>Dữ liệu được hiển thị trong một bảng, bạn có thể xem chi tiết từng mục, xóa hoặc xuất ra file Excel.</li>
            <li>Sử dụng nút "Logs" để xem lịch sử các lần quét của chiến dịch, bao gồm cả các lỗi (nếu có).</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default Guide;