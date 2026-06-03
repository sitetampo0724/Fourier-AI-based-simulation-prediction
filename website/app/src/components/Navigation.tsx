import { useEffect, useState } from "react";
import { Activity, BookOpen, BarChart3, Quote } from "lucide-react";

const navItems = [
  { label: "Methodology", href: "#methodology", icon: BookOpen },
  { label: "Console", href: "#console", icon: Activity },
  { label: "Results", href: "#results", icon: BarChart3 },
  { label: "Citation", href: "#citation", icon: Quote },
];

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);

      // Determine active section
      const sections = navItems.map((item) => {
        const el = document.querySelector(item.href);
        if (!el) return { id: item.href, top: Infinity };
        const rect = el.getBoundingClientRect();
        return { id: item.href, top: rect.top };
      });

      const current = sections.reduce((closest, section) => {
        if (section.top > -200 && section.top < closest.top) return section;
        return closest;
      }, sections[0]);

      if (current) setActiveSection(current.id);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ${
        scrolled
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-4 pointer-events-none"
      }`}
    >
      <div className="liquid-glass rounded-full px-6 py-3 flex items-center gap-6">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.href;
          return (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => handleClick(e, item.href)}
              className={`flex items-center gap-2 text-sm font-medium transition-colors duration-300 ${
                isActive
                  ? "text-[#00FFA3]"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <Icon size={14} />
              <span className="hidden sm:inline">{item.label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
