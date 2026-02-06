"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Link from "next/link";

export default function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("パスワードは8文字以上で入力してください。");
      return;
    }

    if (password !== confirmPassword) {
      setError("パスワードが一致しません。");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        if (authError.message.includes("already registered")) {
          setError("このメールアドレスは既に登録されています。");
        } else {
          setError("アカウントの作成に失敗しました。再度お試しください。");
        }
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("アカウントの作成に失敗しました。再度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-sm">
      <Input
        label="メールアドレス"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="example@email.com"
        required
        autoComplete="email"
      />
      <div>
        <div className="relative">
          <Input
            label="パスワード"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="8文字以上"
            required
            autoComplete="new-password"
            minLength={8}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-[34px] p-1 text-gray-500"
            aria-label={showPassword ? "パスワードを隠す" : "パスワードを表示"}
          >
            {showPassword ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-500">パスワードは8文字以上</p>
      </div>
      <Input
        label="パスワード（確認）"
        type={showPassword ? "text" : "password"}
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="パスワードを再入力"
        required
        autoComplete="new-password"
      />

      {error && (
        <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>
      )}

      <Button type="submit" fullWidth loading={loading} size="lg">
        アカウントを作成
      </Button>

      <p className="text-center text-sm text-gray-500">
        既にアカウントをお持ちの方{" "}
        <Link href="/login" className="text-blue-600 hover:underline">
          ログイン
        </Link>
      </p>
    </form>
  );
}
