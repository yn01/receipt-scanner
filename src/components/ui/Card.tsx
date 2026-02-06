interface CardProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export default function Card({ children, onClick, className = "" }: CardProps) {
  const Component = onClick ? "button" : "div";
  return (
    <Component
      onClick={onClick}
      className={`
        bg-white rounded-lg shadow-sm border border-gray-200 p-4
        ${onClick ? "cursor-pointer hover:shadow-md transition-shadow w-full text-left" : ""}
        ${className}
      `}
    >
      {children}
    </Component>
  );
}
