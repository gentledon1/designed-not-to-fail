import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { FloatingBanner } from "@/components/FloatingBanner";
import { SEOProvider } from "@/contexts/SEOContext";
import { SEOHead } from "@/components/SEOHead";

export const Route = createRootRoute({
	component: Root,
});

function Root() {
	return (
		<SEOProvider>
			<SEOHead />
			<div className="flex flex-col min-h-screen">
				<ErrorBoundary tagName="main" className="flex-1">
					<Outlet />
				</ErrorBoundary>
				<TanStackRouterDevtools position="bottom-right" />
				<FloatingBanner position="bottom-left" />
			</div>
		</SEOProvider>
	);
}
