import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Account = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tài khoản</h1>
        <p className="text-gray-500 mt-1">Quản lý thông tin tài khoản của bạn.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Thông tin cá nhân</CardTitle>
          <CardDescription>Cập nhật thông tin cá nhân của bạn ở đây.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Chức năng đang được phát triển.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Account;