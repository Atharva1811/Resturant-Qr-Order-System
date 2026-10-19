import { Link } from "react-router";
import { BRAND_CONFIG } from "src/config/brand.config";

type FooterLink = {
    title: string;
    href: string;
};

const footerLinks: FooterLink[] = [
    { title: "Documentation", href: "#/admin/dashboard" },
    { title: "Support", href: `mailto:${BRAND_CONFIG.supportEmail}` },
    { title: "Privacy & Terms", href: "#" },
];

export default function Footer() {
    return (
        <div className="flex md:flex-row flex-col items-center justify-between gap-3 text-center py-4 border-t border-border/40 mt-auto">
            <p className="text-xs text-muted-foreground">
                {BRAND_CONFIG.copyright} — <span className="text-foreground/80 font-medium">{BRAND_CONFIG.tagline}</span>
            </p>

            <div className="flex gap-4">
                {footerLinks.map((item, index) => (
                    <Link
                        key={index}
                        to={item.href}
                        className="text-xs hover:text-primary text-muted-foreground transition-colors"
                    >
                        {item.title}
                    </Link>
                ))}
            </div>
        </div>
    );
}
