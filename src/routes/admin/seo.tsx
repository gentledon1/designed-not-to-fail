import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEOSettingsCard } from "@/components/SEOSettingsCard";

export const Route = createFileRoute("/admin/seo")({
	component: AdminSEOPage,
});

function AdminSEOPage() {
	return (
		<div className="min-h-screen bg-background">
			<div className="container max-w-2xl mx-auto py-8 px-4">
				<div className="mb-6">
					<Link to="/">
						<Button variant="ghost" size="sm" className="gap-2">
							<ArrowLeft className="size-4" />
							Back to Home
						</Button>
					</Link>
				</div>

				<SEOSettingsCard />
			</div>
		</div>
	);
}
