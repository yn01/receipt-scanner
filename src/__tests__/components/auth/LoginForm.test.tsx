import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginForm from "@/components/auth/LoginForm";

// Mock next/navigation
const mockPush = jest.fn();
const mockRefresh = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

// Mock supabase client
const mockSignInWithPassword = jest.fn();
jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
    },
  }),
}));

describe("LoginForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render email and password fields", () => {
    render(<LoginForm />);
    expect(screen.getByLabelText("メールアドレス")).toBeInTheDocument();
    expect(screen.getByLabelText("パスワード")).toBeInTheDocument();
  });

  it("should render login button", () => {
    render(<LoginForm />);
    expect(
      screen.getByRole("button", { name: "ログイン" })
    ).toBeInTheDocument();
  });

  it("should render signup link", () => {
    render(<LoginForm />);
    expect(screen.getByText("サインアップ")).toBeInTheDocument();
  });

  it("should toggle password visibility", async () => {
    render(<LoginForm />);
    const passwordInput = screen.getByLabelText("パスワード");
    expect(passwordInput).toHaveAttribute("type", "password");

    const toggleButton = screen.getByLabelText("パスワードを表示");
    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute("type", "text");

    const hideButton = screen.getByLabelText("パスワードを隠す");
    fireEvent.click(hideButton);
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("should navigate to home on successful login", async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null });

    render(<LoginForm />);

    await userEvent.type(
      screen.getByLabelText("メールアドレス"),
      "test@example.com"
    );
    await userEvent.type(screen.getByLabelText("パスワード"), "password123");
    fireEvent.click(screen.getByRole("button", { name: "ログイン" }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });

  it("should show error on auth failure", async () => {
    mockSignInWithPassword.mockResolvedValue({
      error: { message: "Invalid credentials" },
    });

    render(<LoginForm />);

    await userEvent.type(
      screen.getByLabelText("メールアドレス"),
      "test@example.com"
    );
    await userEvent.type(screen.getByLabelText("パスワード"), "wrong");
    fireEvent.click(screen.getByRole("button", { name: "ログイン" }));

    await waitFor(() => {
      expect(
        screen.getByText("メールアドレスまたはパスワードが正しくありません。")
      ).toBeInTheDocument();
    });
  });

  it("should show generic error on exception", async () => {
    mockSignInWithPassword.mockRejectedValue(new Error("Network error"));

    render(<LoginForm />);

    await userEvent.type(
      screen.getByLabelText("メールアドレス"),
      "test@example.com"
    );
    await userEvent.type(screen.getByLabelText("パスワード"), "password123");
    fireEvent.click(screen.getByRole("button", { name: "ログイン" }));

    await waitFor(() => {
      expect(
        screen.getByText("ログインに失敗しました。再度お試しください。")
      ).toBeInTheDocument();
    });
  });
});
