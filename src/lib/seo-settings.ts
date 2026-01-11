import {
	SeoSettingORM,
	type SeoSettingModel,
} from "@/sdk/database/orm/orm_seo_setting";

const SEO_SETTINGS_KEY = "__seo_settings__";

export interface SEOSettings {
	siteTitle: string;
	metaDescription: string;
	ogTitle: string;
	ogDescription: string;
	ogImageUrl: string;
	canonicalUrl: string;
	twitterHandle: string;
}

export const DEFAULT_SEO_SETTINGS: SEOSettings = {
	siteTitle:
		"Designed Not To Fail | UK Petition to Prevent Damp, Mould & Heat Loss",
	metaDescription:
		"Join the UK petition to prevent avoidable damp, mould, ventilation failure and heat loss. Add your signature, share evidence, and help drive safer, healthier homes.",
	ogTitle:
		"Designed Not To Fail | UK Petition to Prevent Damp, Mould & Heat Loss",
	ogDescription:
		"Join the UK petition to prevent avoidable damp, mould, ventilation failure and heat loss. Add your signature, share evidence, and help drive safer, healthier homes.",
	ogImageUrl: "",
	canonicalUrl: "https://designednottofail.co.uk",
	twitterHandle: "",
};

export async function getSEOSettings(): Promise<SEOSettings> {
	try {
		const orm = SeoSettingORM.getInstance();
		const results = await orm.getSeoSettingBySettingKey(SEO_SETTINGS_KEY);

		if (results.length > 0) {
			const record = results[0];
			return {
				siteTitle: record.site_title || DEFAULT_SEO_SETTINGS.siteTitle,
				metaDescription:
					record.meta_description || DEFAULT_SEO_SETTINGS.metaDescription,
				ogTitle: record.og_title || DEFAULT_SEO_SETTINGS.ogTitle,
				ogDescription:
					record.og_description || DEFAULT_SEO_SETTINGS.ogDescription,
				ogImageUrl: record.og_image_url || DEFAULT_SEO_SETTINGS.ogImageUrl,
				canonicalUrl: record.canonical_url || DEFAULT_SEO_SETTINGS.canonicalUrl,
				twitterHandle:
					record.twitter_handle || DEFAULT_SEO_SETTINGS.twitterHandle,
			};
		}

		return DEFAULT_SEO_SETTINGS;
	} catch (error) {
		console.error("Failed to load SEO settings:", error);
		return DEFAULT_SEO_SETTINGS;
	}
}

export async function saveSEOSettings(settings: SEOSettings): Promise<boolean> {
	try {
		const orm = SeoSettingORM.getInstance();
		const existing = await orm.getSeoSettingBySettingKey(SEO_SETTINGS_KEY);

		const data: SeoSettingModel = {
			id: existing.length > 0 ? existing[0].id : "",
			data_creator: existing.length > 0 ? existing[0].data_creator : "",
			data_updater: "",
			create_time: existing.length > 0 ? existing[0].create_time : "",
			update_time: "",
			setting_key: SEO_SETTINGS_KEY,
			site_title: settings.siteTitle,
			meta_description: settings.metaDescription,
			og_title: settings.ogTitle,
			og_description: settings.ogDescription,
			og_image_url: settings.ogImageUrl,
			canonical_url: settings.canonicalUrl,
			twitter_handle: settings.twitterHandle || null,
		};

		if (existing.length > 0) {
			await orm.setSeoSettingBySettingKey(SEO_SETTINGS_KEY, data);
		} else {
			await orm.insertSeoSetting([data]);
		}

		return true;
	} catch (error) {
		console.error("Failed to save SEO settings:", error);
		return false;
	}
}
