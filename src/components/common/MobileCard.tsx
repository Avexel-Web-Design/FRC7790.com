import type { ReactNode } from "react";

interface MobileCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function MobileCard({
  children,
  className = "",
  onClick,
}: MobileCardProps) {
  const baseClasses =
    "bg-black border border-gray-700 rounded-lg p-4 transition-colors";
  const interactiveClasses = onClick
    ? "cursor-pointer hover:bg-gray-900 active:bg-gray-800"
    : "";

  return (
    <div
      className={`${baseClasses} ${interactiveClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
