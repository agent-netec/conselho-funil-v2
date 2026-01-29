import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { CompetitorTechStack } from "@/types/competitors"
import { 
  Globe, 
  BarChart3, 
  Mail, 
  CreditCard, 
  Server, 
  Zap 
} from "lucide-react"

interface TechStackBadgesProps {
  techStack?: CompetitorTechStack;
  className?: string;
}

export function TechStackBadges({ techStack, className }: TechStackBadgesProps) {
  if (!techStack) return null;

  const sections = [
    { label: "CMS", icon: Globe, value: techStack.cms, color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
    { label: "Analytics", icon: BarChart3, values: techStack.analytics, color: "bg-green-500/10 text-green-500 border-green-500/20" },
    { label: "Marketing", icon: Mail, values: techStack.marketing, color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
    { label: "Payments", icon: CreditCard, values: techStack.payments, color: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
    { label: "Infra", icon: Server, values: techStack.infrastructure, color: "bg-slate-500/10 text-slate-500 border-slate-500/20" },
  ];

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {sections.map((section) => {
        const Icon = section.icon;
        
        if (section.value) {
          return (
            <Badge key={section.label} variant="outline" className={`flex items-center gap-1.5 px-2 py-0.5 ${section.color}`}>
              <Icon className="h-3 w-3" />
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-70 mr-1">{section.label}:</span>
              {section.value}
            </Badge>
          );
        }

        if (section.values && section.values.length > 0) {
          return section.values.map((val) => (
            <Badge key={`${section.label}-${val}`} variant="outline" className={`flex items-center gap-1.5 px-2 py-0.5 ${section.color}`}>
              <Icon className="h-3 w-3" />
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-70 mr-1">{section.label}:</span>
              {val}
            </Badge>
          ));
        }

        return null;
      })}
      
      {!techStack.cms && (!techStack.analytics || techStack.analytics.length === 0) && (
        <Badge variant="secondary" className="text-[10px] opacity-50 italic">
          Nenhuma tecnologia detectada
        </Badge>
      )}
    </div>
  );
}
