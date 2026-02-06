import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-white">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">ReceiptScan</h1>
        <p className="text-sm text-gray-500 mt-1">領収書スキャンアプリ</p>
      </div>
      <LoginForm />
    </div>
  );
}
