import SignupForm from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-white">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">サインアップ</h1>
        <p className="text-sm text-gray-500 mt-1">新しいアカウントを作成</p>
      </div>
      <SignupForm />
    </div>
  );
}
