import {
  AlertTriangleIcon,
  InfoIcon,
  LightbulbIcon,
  ShieldAlertIcon,
  type LucideIcon,
} from "lucide-react";

const styles: Record<string, { icon: LucideIcon; accent: string; iconColor: string }> = {
  tip: {
    icon: LightbulbIcon,
    accent: "border-emerald-500/30 bg-emerald-500/[0.06]",
    iconColor: "text-emerald-400",
  },
  important: {
    icon: AlertTriangleIcon,
    accent: "border-amber-500/30 bg-amber-500/[0.06]",
    iconColor: "text-amber-400",
  },
  warning: {
    icon: ShieldAlertIcon,
    accent: "border-red-500/30 bg-red-500/[0.06]",
    iconColor: "text-red-400",
  },
  info: {
    icon: InfoIcon,
    accent: "border-sky-500/30 bg-sky-500/[0.06]",
    iconColor: "text-sky-400",
  },
};

export default function Callout({
  type = "tip",
  title,
  children,
}: {
  type?: "tip" | "important" | "warning" | "info";
  title?: string;
  children: React.ReactNode;
}) {
  const config = styles[type] ?? styles.tip;
  const Icon = config.icon;

  return (
    <div className={`my-5 rounded-lg border px-4 py-3 ${config.accent}`}>
      <div className="mb-1 flex items-center gap-2">
        <Icon className={`size-4 ${config.iconColor}`} />
        {title && (
          <span className="text-[13px] font-medium text-foreground/80">{title}</span>
        )}
      </div>
      <div className="text-[13.5px] leading-relaxed text-foreground/65">{children}</div>
    </div>
  );
}