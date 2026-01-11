import { useEffect } from "react";
import { useSEO } from "@/contexts/SEOContext";

export function SEOHead() {
	const { settings, isLoading } = useSEO();

	useEffect(() => {
		if (isLoading) return;

		// Update document title
		document.title = settings.siteTitle;

		// Helper to update or create meta tag
		const setMetaTag = (
			selector: string,
			attribute: string,
			content: string
		) => {
			if (!content) return;
			let element = document.querySelector(selector) as HTMLMetaElement | null;
			if (!element) {
				element = document.createElement("meta");
				if (selector.includes('name="')) {
					element.name = selector.match(/name="([^"]+)"/)?.[1] || "";
				} else if (selector.includes('property="')) {
					element.setAttribute(
						"property",
						selector.match(/property="([^"]+)"/)?.[1] || ""
					);
				}
				document.head.appendChild(element);
			}
			element.setAttribute(attribute, content);
		};

		// Helper to update or create link tag
		const setLinkTag = (rel: string, href: string) => {
			if (!href) return;
			let element = document.querySelector(
				`link[rel="${rel}"]`
			) as HTMLLinkElement | null;
			if (!element) {
				element = document.createElement("link");
				element.rel = rel;
				document.head.appendChild(element);
			}
			element.href = href;
		};

		// Meta description
		setMetaTag('meta[name="description"]', "content", settings.metaDescription);

		// OpenGraph tags
		setMetaTag('meta[property="og:title"]', "content", settings.ogTitle);
		setMetaTag(
			'meta[property="og:description"]',
			"content",
			settings.ogDescription
		);
		setMetaTag('meta[property="og:image"]', "content", settings.ogImageUrl);
		setMetaTag('meta[property="og:url"]', "content", settings.canonicalUrl);
		setMetaTag('meta[property="og:type"]', "content", "website");

		// Twitter Card tags
		setMetaTag('meta[name="twitter:card"]', "content", "summary_large_image");
		setMetaTag('meta[name="twitter:title"]', "content", settings.ogTitle);
		setMetaTag(
			'meta[name="twitter:description"]',
			"content",
			settings.ogDescription
		);
		setMetaTag('meta[name="twitter:image"]', "content", settings.ogImageUrl);
		if (settings.twitterHandle) {
			setMetaTag(
				'meta[name="twitter:site"]',
				"content",
				settings.twitterHandle
			);
		}

		// Canonical URL
		setLinkTag("canonical", settings.canonicalUrl);

		// Schema.org JSON-LD for Organization
		let jsonLdScript = document.querySelector(
			'script[type="application/ld+json"][data-seo="organization"]'
		) as HTMLScriptElement | null;
		if (!jsonLdScript) {
			jsonLdScript = document.createElement("script");
			jsonLdScript.type = "application/ld+json";
			jsonLdScript.setAttribute("data-seo", "organization");
			document.head.appendChild(jsonLdScript);
		}
		const schemaData = {
			"@context": "https://schema.org",
			"@type": "Organization",
			name: "Designed Not To Fail",
			url: settings.canonicalUrl,
			sameAs: [] as string[],
		};
		jsonLdScript.textContent = JSON.stringify(schemaData);
	}, [settings, isLoading]);

	return null;
}
