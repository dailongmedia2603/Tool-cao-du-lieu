import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Session } from '@supabase/supabase-js';

interface LoginProps {
  session: Session | null;
}

const Login = ({ session }: LoginProps) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (session) {
      navigate('/');
    }
  }, [session, navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4" style={{ background: 'radial-gradient(circle at 100% 0, rgba(255, 244, 236, 0.5) 0%, transparent 70%), radial-gradient(circle at 100% 100%, rgba(255, 244, 236, 0.3) 0%, transparent 50%)' }}>
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <img src="/logolistenpro.png" alt="Listen Pro Logo" className="h-20 object-contain" />
        </div>
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#F97316',
                  brandAccent: '#FB923C',
                },
              },
            },
          }}
          providers={[]}
          localization={{
            variables: {
              sign_in: {
                email_label: 'Địa chỉ email',
                password_label: 'Mật khẩu',
                email_input_placeholder: 'Địa chỉ email của bạn',
                password_input_placeholder: 'Mật khẩu của bạn',
                button_label: 'Đăng nhập',
                social_provider_text: 'Đăng nhập với {{provider}}',
                link_text: 'Đã có tài khoản? Đăng nhập',
              },
              sign_up: {
                email_label: 'Địa chỉ email',
                password_label: 'Mật khẩu',
                email_input_placeholder: 'Địa chỉ email của bạn',
                password_input_placeholder: 'Mật khẩu của bạn',
                button_label: 'Đăng ký',
                social_provider_text: 'Đăng ký với {{provider}}',
                link_text: 'Chưa có tài khoản? Đăng ký',
                confirmation_text: 'Kiểm tra email của bạn để xác nhận tài khoản.',
              },
              forgotten_password: {
                email_label: 'Địa chỉ email',
                password_label: 'Mật khẩu',
                email_input_placeholder: 'Địa chỉ email của bạn',
                button_label: 'Gửi hướng dẫn',
                link_text: 'Quên mật khẩu?',
                confirmation_text: 'Kiểm tra email của bạn để lấy lại mật khẩu.',
              },
            },
          }}
        />
      </div>
    </div>
  );
};

export default Login;