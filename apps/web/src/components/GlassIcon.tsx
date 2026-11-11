import React, { CSSProperties, ReactNode } from "react";

export type GlassPlateType = "tilt" | "offset" | "circle" | "none";

export interface GlassIconProps {
  children: ReactNode;
  plate?: GlassPlateType;
  size?: number | string;
  radius?: number | string;
  tilt?: string;
  spread?: number;
  tint?: string;
  drop?: string;
  plateBg?: string;
  ink?: string;
  shade?: number;
  shine?: number;
  glyphShadow?: string;
  glyphSize?: string | number;
  label?: string;
  className?: string;
  style?: CSSProperties;
  onClick?: (e: React.MouseEvent) => void;
  as?: "div" | "button" | "span";
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  "aria-label"?: string;
  id?: string;
}

export function GlassIcon({
  children,
  plate = "tilt",
  size,
  radius,
  tilt,
  spread,
  tint,
  drop,
  plateBg,
  ink,
  shade,
  shine,
  glyphShadow,
  glyphSize,
  label,
  className = "",
  style = {},
  onClick,
  as: Component = "div",
  type,
  disabled,
  "aria-label": ariaLabel,
  id,
}: GlassIconProps) {
  const customStyles: CSSProperties = {
    ...style,
    ...(size !== undefined && {
      "--glass-icons-size": typeof size === "number" ? `${size}px` : size,
    }),
    ...(radius !== undefined && {
      "--glass-icons-radius": typeof radius === "number" ? `${radius}px` : radius,
    }),
    ...(tilt !== undefined && { "--glass-icons-tilt": tilt }),
    ...(spread !== undefined && { "--glass-icons-spread": spread }),
    ...(tint !== undefined && { "--glass-icons-tint": tint }),
    ...(drop !== undefined && { "--glass-icons-drop": drop }),
    ...(plateBg !== undefined && { "--glass-icons-plate-bg": plateBg }),
    ...(ink !== undefined && { "--glass-icons-ink": ink }),
    ...(shade !== undefined && { "--glass-icons-shade": shade }),
    ...(shine !== undefined && { "--glass-icons-shine": shine }),
    ...(glyphShadow !== undefined && { "--glass-icons-glyph-shadow": glyphShadow }),
    ...(glyphSize !== undefined && {
      "--glass-icons-glyph-size": typeof glyphSize === "number" ? `${glyphSize}px` : glyphSize,
    }),
  } as CSSProperties;

  const plateClass =
    plate === "tilt"
      ? "glass-icon-plate glass-icon-plate--tilt"
      : plate === "offset"
        ? "glass-icon-plate glass-icon-plate--offset"
        : plate === "circle"
          ? "glass-icon-plate glass-icon-plate--circle"
          : null;

  return (
    <Component
      id={id}
      type={Component === "button" ? type || "button" : undefined}
      disabled={Component === "button" ? disabled : undefined}
      onClick={onClick}
      aria-label={ariaLabel}
      className={`glass-icon ${className}`}
      style={customStyles}
    >
      {plateClass && <div className={plateClass} aria-hidden="true" />}
      <div className="glass-icon-glass" aria-hidden="true">
        <div className="glass-icon-shade" />
        <div className="glass-icon-shine" />
      </div>
      <div className="glass-icon-face">
        <div className="glass-icon-glyph">{children}</div>
      </div>
      {label && <span className="glass-icon-label">{label}</span>}
    </Component>
  );
}
