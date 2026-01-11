import {
	createContext,
	useContext,
	useState,
	useEffect,
	useCallback,
	type ReactNode,
} from "react";
import {
	getSEOSettings,
	saveSEOSettings,
	DEFAULT_SEO_SETTINGS,
	type SEOSettings,
} from "@/lib/seo-settings";

interface SEOContextValue {
	settings: SEOSettings;
	isLoading: boolean;
	updateSettings: (newSettings: SEOSettings) => Promise<boolean>;
	refreshSettings: () => Promise<void>;
}

const SEOContext = createContext<SEOContextValue | null>(null);

export function SEOProvider({ children }: { children: ReactNode }) {
	const [settings, setSettings] = useState<SEOSettings>(DEFAULT_SEO_SETTINGS);
	const [isLoading, setIsLoading] = useState(true);

	const refreshSettings = useCallback(async () => {
		setIsLoading(true);
		try {
			const loaded = await getSEOSettings();
			setSettings(loaded);
		} catch (error) {
			console.error("Failed to refresh SEO settings:", error);
		} finally {
			setIsLoading(false);
		}
	}, []);

	const updateSettings = useCallback(
		async (newSettings: SEOSettings): Promise<boolean> => {
			const success = await saveSEOSettings(newSettings);
			if (success) {
				setSettings(newSettings);
			}
			return success;
		},
		[]
	);

	useEffect(() => {
		refreshSettings();
	}, [refreshSettings]);

	return (
		<SEOContext.Provider
			value={{ settings, isLoading, updateSettings, refreshSettings }}
		>
			{children}
		</SEOContext.Provider>
	);
}

export function useSEO(): SEOContextValue {
	const context = useContext(SEOContext);
	if (!context) {
		throw new Error("useSEO must be used within a SEOProvider");
	}
	return context;
}
