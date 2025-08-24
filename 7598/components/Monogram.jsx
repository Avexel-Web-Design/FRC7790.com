import React, { useMemo } from "react";

/**
 * Monogram Component
 * Creates a stylized monogram placeholder for profiles when photos aren't available
 *
 * @param {Object} props
 * @param {string} props.name - Full name of the person to generate initials from
 * @param {string} props.bgColorClass - Optional Tailwind color class for the background
 * @param {string} props.textColorClass - Optional Tailwind color class for the text
 * @param {string} props.className - Additional classes to apply
 * @param {string} props.size - Size of the monogram (lg, md, sm)
 */
const Monogram = ({
  name,
  bgColorClass = "",
  textColorClass = "text-white",
  className = "",
  size = "md",
}) => {
  // Get the initials from the name
  const initials = useMemo(() => {
    if (!name) return "??";

    // Get first character of each word and uppercase it
    return name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase())
      .slice(0, 2) // Limit to max 2 characters
      .join("");
  }, [name]);

  // Determine size classes
  const sizeClasses = useMemo(() => {
    switch (size) {
      case "lg":
        return "w-32 h-32 text-4xl";
      case "sm":
        return "w-10 h-10 text-sm";
      case "xs":
        return "w-8 h-8 text-xs";
      case "md":
      default:
        return "w-16 h-16 text-xl";
    }
  }, [size]);

  // Use the same gradient as the rest of the site instead of generating random ones
  const gradientStyle = useMemo(() => {
    if (bgColorClass) return {};

    // Match the site's blue-purple gradient
    return {
      background: "linear-gradient(135deg, #8b5cf6, #3b82f6)",
    };
  }, [bgColorClass]);

  return (
    <div
      className={`relative rounded-full overflow-hidden ${sizeClasses} ${className}`}
      aria-label={`Monogram for ${name}`}
    >
      {/* Add decorative elements similar to the site's aesthetic */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>

      {/* Main background */}
      <div
        className={`absolute inset-0 ${bgColorClass}`}
        style={gradientStyle}
      ></div>

      {/* Shimmering overlay effect */}
      <div className="absolute inset-0 bg-gradient-radial from-white/10 to-transparent opacity-40"></div>

      {/* Glowing animated ring */}
      <div className="absolute inset-[-1px] border border-white/20 rounded-full"></div>
      <div className="absolute inset-[-2px] border border-white/10 rounded-full animate-pulse-slow"></div>

      {/* Initials text */}
      <div
        className={`absolute inset-0 flex items-center justify-center font-bold ${textColorClass}`}
      >
        {initials}
      </div>
    </div>
  );
};

export default Monogram;
