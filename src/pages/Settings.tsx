import React from 'react';

const Settings = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your general application settings.</p>
      </div>
      <div className="p-6 border rounded-lg bg-white">
        <p className="text-gray-600">Các cài đặt chung cho ứng dụng sẽ được cập nhật tại đây trong tương lai.</p>
      </div>
    </div>
  );
};

export default Settings;