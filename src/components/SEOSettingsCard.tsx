import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Globe, Save, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	FormDescription,
} from "@/components/ui/form";
import { useSEO } from "@/contexts/SEOContext";
import { DEFAULT_SEO_SETTINGS } from "@/lib/seo-settings";

const seoSettingsSchema = z.object({
	siteTitle: z.string().min(1, "Site title is required"),
	metaDescription: z.string().min(1, "Meta description is required"),
	ogTitle: z.string().min(1, "OG title is required"),
	ogDescription: z.string().min(1, "OG description is required"),
	ogImageUrl: z.string().optional(),
	canonicalUrl: z.string().url("Must be a valid URL").or(z.literal("")),
	twitterHandle: z.string().optional(),
});

type SEOSettingsFormValues = z.infer<typeof seoSettingsSchema>;

export function SEOSettingsCard() {
	const { settings, isLoading, updateSettings } = useSEO();
	const [isSaving, setIsSaving] = useState(false);
	const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">(
		"idle"
	);

	const form = useForm<SEOSettingsFormValues>({
		resolver: zodResolver(seoSettingsSchema),
		defaultValues: {
			siteTitle: settings.siteTitle,
			metaDescription: settings.metaDescription,
			ogTitle: settings.ogTitle,
			ogDescription: settings.ogDescription,
			ogImageUrl: settings.ogImageUrl,
			canonicalUrl: settings.canonicalUrl,
			twitterHandle: settings.twitterHandle,
		},
	});

	useEffect(() => {
		if (!isLoading) {
			form.reset({
				siteTitle: settings.siteTitle,
				metaDescription: settings.metaDescription,
				ogTitle: settings.ogTitle,
				ogDescription: settings.ogDescription,
				ogImageUrl: settings.ogImageUrl,
				canonicalUrl: settings.canonicalUrl,
				twitterHandle: settings.twitterHandle,
			});
		}
	}, [settings, isLoading, form]);

	const onSubmit = async (data: SEOSettingsFormValues) => {
		setIsSaving(true);
		setSaveStatus("idle");

		const success = await updateSettings({
			siteTitle: data.siteTitle,
			metaDescription: data.metaDescription,
			ogTitle: data.ogTitle,
			ogDescription: data.ogDescription,
			ogImageUrl: data.ogImageUrl || "",
			canonicalUrl: data.canonicalUrl || "",
			twitterHandle: data.twitterHandle || "",
		});

		setIsSaving(false);
		setSaveStatus(success ? "success" : "error");

		if (success) {
			setTimeout(() => setSaveStatus("idle"), 3000);
		}
	};

	const handleReset = () => {
		form.reset({
			siteTitle: DEFAULT_SEO_SETTINGS.siteTitle,
			metaDescription: DEFAULT_SEO_SETTINGS.metaDescription,
			ogTitle: DEFAULT_SEO_SETTINGS.ogTitle,
			ogDescription: DEFAULT_SEO_SETTINGS.ogDescription,
			ogImageUrl: DEFAULT_SEO_SETTINGS.ogImageUrl,
			canonicalUrl: DEFAULT_SEO_SETTINGS.canonicalUrl,
			twitterHandle: DEFAULT_SEO_SETTINGS.twitterHandle,
		});
	};

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Globe className="size-5" />
						SEO & Social
					</CardTitle>
					<CardDescription>Loading settings...</CardDescription>
				</CardHeader>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Globe className="size-5" />
					SEO & Social
				</CardTitle>
				<CardDescription>
					Configure search engine optimization and social media sharing settings
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="siteTitle"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Site Title</FormLabel>
									<FormControl>
										<Input placeholder="Your site title" {...field} />
									</FormControl>
									<FormDescription>
										Appears in browser tabs and search results
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="metaDescription"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Meta Description</FormLabel>
									<FormControl>
										<Textarea
											placeholder="Brief description of your site"
											className="min-h-[80px]"
											{...field}
										/>
									</FormControl>
									<FormDescription>
										Shown in search engine results (150-160 characters
										recommended)
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="ogTitle"
							render={({ field }) => (
								<FormItem>
									<FormLabel>OpenGraph Title</FormLabel>
									<FormControl>
										<Input placeholder="Title for social sharing" {...field} />
									</FormControl>
									<FormDescription>
										Title shown when shared on social media
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="ogDescription"
							render={({ field }) => (
								<FormItem>
									<FormLabel>OpenGraph Description</FormLabel>
									<FormControl>
										<Textarea
											placeholder="Description for social sharing"
											className="min-h-[80px]"
											{...field}
										/>
									</FormControl>
									<FormDescription>
										Description shown when shared on social media
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="ogImageUrl"
							render={({ field }) => (
								<FormItem>
									<FormLabel>OpenGraph Image URL</FormLabel>
									<FormControl>
										<Input
											placeholder="https://example.com/image.jpg"
											{...field}
										/>
									</FormControl>
									<FormDescription>
										Image shown when shared on social media (1200x630px
										recommended)
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="canonicalUrl"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Canonical URL</FormLabel>
									<FormControl>
										<Input placeholder="https://yourdomain.com" {...field} />
									</FormControl>
									<FormDescription>
										Primary URL for this site (helps prevent duplicate content
										issues)
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="twitterHandle"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Twitter/X Handle (Optional)</FormLabel>
									<FormControl>
										<Input placeholder="@yourhandle" {...field} />
									</FormControl>
									<FormDescription>
										Your Twitter/X username for attribution
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="flex items-center gap-3 pt-4">
							<Button type="submit" disabled={isSaving}>
								<Save className="size-4" />
								{isSaving ? "Saving..." : "Save Settings"}
							</Button>
							<Button type="button" variant="outline" onClick={handleReset}>
								<RotateCcw className="size-4" />
								Reset to Defaults
							</Button>
							{saveStatus === "success" && (
								<span className="text-sm text-green-600">
									Settings saved successfully!
								</span>
							)}
							{saveStatus === "error" && (
								<span className="text-sm text-red-600">
									Failed to save settings. Please try again.
								</span>
							)}
						</div>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
}
