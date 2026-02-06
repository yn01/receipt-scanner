import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SignupForm from "@/components/auth/SignupForm";

// Mock next/navigation
const mockPush = jest.fn();
const mockRefresh = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

// Mock supabase client
const mockSignUp = jest.fn();
jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signUp: mockSignUp,
    },
  }),
}));

describe("SignupForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render email, password, and confirm password fields", () => {
    render(<SignupForm />);
    expect(screen.getByLabelText("メールアドレス")).toBeInTheDocument();
    expect(screen.getByLabelText("パスワード")).toBeInTheDocument();
    expect(screen.getByLabelText("パスワード（確認）")).toBeInTheDocument();
  });

  it("should render signup button", () => {
    render(<SignupForm />);
    expect(
      screen.getByRole("button", { name: "アカウントを作成" })
    ).toBeInTheDocument();
  });

  it("should render login link", () => {
    render(<SignupForm />);
    expect(screen.getByText("ログイン")).toBeInTheDocument();
  });

  it("should show error when password is less than 8 characters", async () => {
    render(<SignupForm />);

    await userEvent.type(
      screen.getByLabelText("メールアドレス"),
      "test@example.com"
    );
    await userEvent.type(screen.getByLabelText("パスワード"), "short");
    await userEvent.type(screen.getByLabelText("パスワード（確認）"), "short");
    fireEvent.click(screen.getByRole("button", { name: "アカウントを作成" }));

    await waitFor(() => {
      expect(
        screen.getByText("パスワードは8文字以上で入力してください。")
      ).toBeInTheDocument();
    });
  });

  it("should show error when passwords do not match", async () => {
    render(<SignupForm />);

    await userEvent.type(
      screen.getByLabelText("メールアドレス"),
      "test@example.com"
    );
    await userEvent.type(screen.getByLabelText("パスワード"), "password123");
    await userEvent.type(
      screen.getByLabelText("パスワード（確認）"),
      "different123"
    );
    fireEvent.click(screen.getByRole("button", { name: "アカウントを作成" }));

    await waitFor(() => {
      expect(
        screen.getByText("パスワードが一致しません。")
      ).toBeInTheDocument();
    });
  });

  it("should navigate to home on successful signup", async () => {
    mockSignUp.mockResolvedValue({ error: null });

    render(<SignupForm />);

    await userEvent.type(
      screen.getByLabelText("メールアドレス"),
      "test@example.com"
    );
    await userEvent.type(screen.getByLabelText("パスワード"), "password123");
    await userEvent.type(
      screen.getByLabelText("パスワード（確認）"),
      "password123"
    );
    fireEvent.click(screen.getByRole("button", { name: "アカウントを作成" }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });

  it("should show error when email is already registered", async () => {
    mockSignUp.mockResolvedValue({
      error: { message: "User already registered" },
    });

    render(<SignupForm />);

    await userEvent.type(
      screen.getByLabelText("メールアドレス"),
      "test@example.com"
    );
    await userEvent.type(screen.getByLabelText("パスワード"), "password123");
    await userEvent.type(
      screen.getByLabelText("パスワード（確認）"),
      "password123"
    );
    fireEvent.click(screen.getByRole("button", { name: "アカウントを作成" }));

    await waitFor(() => {
      expect(
        screen.getByText("このメールアドレスは既に登録されています。")
      ).toBeInTheDocument();
    });
  });

  it("should show generic error on exception", async () => {
    mockSignUp.mockRejectedValue(new Error("Network error"));

    render(<SignupForm />);

    await userEvent.type(
      screen.getByLabelText("メールアドレス"),
      "test@example.com"
    );
    await userEvent.type(screen.getByLabelText("パスワード"), "password123");
    await userEvent.type(
      screen.getByLabelText("パスワード（確認）"),
      "password123"
    );
    fireEvent.click(screen.getByRole("button", { name: "アカウントを作成" }));

    await waitFor(() => {
      expect(
        screen.getByText(
          "アカウントの作成に失敗しました。再度お試しください。"
        )
      ).toBeInTheDocument();
    });
  });

  it("should toggle password visibility for both fields", () => {
    render(<SignupForm />);
    const passwordInput = screen.getByLabelText("パスワード");
    const confirmInput = screen.getByLabelText("パスワード（確認）");

    expect(passwordInput).toHaveAttribute("type", "password");
    expect(confirmInput).toHaveAttribute("type", "password");

    fireEvent.click(screen.getByLabelText("パスワードを表示"));
    expect(passwordInput).toHaveAttribute("type", "text");
    expect(confirmInput).toHaveAttribute("type", "text");
  });
});
