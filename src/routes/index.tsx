import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
	Home,
	Shield,
	Users,
	FileText,
	CheckCircle,
	AlertTriangle,
	Droplets,
	Thermometer,
	Lock,
	Download,
	Twitter,
	Facebook,
	Linkedin,
	ArrowRight,
	Mail,
	MapPin,
	ExternalLink,
} from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import {
	authenticateAdmin,
	validateSession,
	logoutAdmin,
	resetAdminPassword,
	isPasswordSet,
} from "@/lib/admin-auth";
import {
	PetitionSignatureORM,
	type PetitionSignatureModel,
} from "@/sdk/database/orm/orm_petition_signature";
import { SEOSettingsCard } from "@/components/SEOSettingsCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/")({
	component: App,
});

// UK postcode regex pattern
const UK_POSTCODE_REGEX =
	/^([A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}|GIR ?0AA)$/i;

// Form validation schema
const petitionFormSchema = z.object({
	name: z.string().min(2, "Name must be at least 2 characters"),
	email: z.string().email("Please enter a valid email address"),
	postcode: z
		.string()
		.regex(UK_POSTCODE_REGEX, "Please enter a valid UK postcode"),
	comment: z.string().optional(),
	consent: z.literal(true, {
		errorMap: () => ({
			message: "You must consent to data processing to sign the petition",
		}),
	}),
});

type PetitionFormValues = z.infer<typeof petitionFormSchema>;

function App() {
	const [signatureCount, setSignatureCount] = useState(0);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitSuccess, setSubmitSuccess] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [isAdminOpen, setIsAdminOpen] = useState(false);
	const [adminPassword, setAdminPassword] = useState("");
	const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
	const [signatures, setSignatures] = useState<PetitionSignatureModel[]>([]);
	const [isLoadingSignatures, setIsLoadingSignatures] = useState(false);

	const form = useForm<PetitionFormValues>({
		resolver: zodResolver(petitionFormSchema),
		defaultValues: {
			name: "",
			email: "",
			postcode: "",
			comment: "",
			consent: undefined,
		},
	});

	// Load signature count on mount
	useEffect(() => {
		loadSignatureCount();
	}, []);

	const loadSignatureCount = async () => {
		try {
			const orm = PetitionSignatureORM.getInstance();
			const allSignatures = await orm.getAllPetitionSignature();
			setSignatureCount(allSignatures.length);
		} catch (error) {
			console.error("Failed to load signature count:", error);
		}
	};

	const loadAllSignatures = async () => {
		setIsLoadingSignatures(true);
		try {
			const orm = PetitionSignatureORM.getInstance();
			const allSignatures = await orm.getAllPetitionSignature();
			setSignatures(allSignatures);
		} catch (error) {
			console.error("Failed to load signatures:", error);
		} finally {
			setIsLoadingSignatures(false);
		}
	};

	const onSubmit = async (data: PetitionFormValues) => {
		setIsSubmitting(true);
		setSubmitError(null);
		try {
			const orm = PetitionSignatureORM.getInstance();

			// Check if email already exists
			const existing = await orm.getPetitionSignatureByEmail(data.email);
			if (existing.length > 0) {
				setSubmitError(
					"This email address has already signed the petition. Thank you for your support!"
				);
				setIsSubmitting(false);
				return;
			}

			// Insert new signature
			await orm.insertPetitionSignature([
				{
					id: "",
					data_creator: "",
					data_updater: "",
					create_time: "",
					update_time: "",
					name: data.name,
					email: data.email,
					postcode: data.postcode.toUpperCase(),
					comment: data.comment || null,
					consent: data.consent,
				},
			]);

			setSubmitSuccess(true);
			form.reset();
			loadSignatureCount();
		} catch (error) {
			console.error("Failed to submit petition:", error);
			setSubmitError(
				"Failed to submit your signature. Please try again later."
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const [isAdminLoading, setIsAdminLoading] = useState(false);
	const [adminError, setAdminError] = useState<string | null>(null);
	const [adminPasswordIsSet, setAdminPasswordIsSet] = useState<boolean | null>(null);
	const [isResettingPassword, setIsResettingPassword] = useState(false);

	// Check for existing admin session on mount and password status
	useEffect(() => {
		const checkExistingSession = async () => {
			const isValid = await validateSession();
			if (isValid) {
				setIsAdminAuthenticated(true);
			}
			// Check if password has been set
			const passwordSet = await isPasswordSet();
			setAdminPasswordIsSet(passwordSet);
		};
		checkExistingSession();
	}, []);

	const handleAdminLogin = async () => {
		setIsAdminLoading(true);
		setAdminError(null);

		try {
			const sessionToken = await authenticateAdmin(adminPassword);

			if (sessionToken) {
				setIsAdminAuthenticated(true);
				setAdminPassword("");
				setAdminPasswordIsSet(true); // Password is now set
				loadAllSignatures();
			} else {
				setAdminError("Incorrect password. Please try again.");
			}
		} catch (error) {
			console.error("Admin login failed:", error);
			setAdminError("Login failed. Please try again later.");
		} finally {
			setIsAdminLoading(false);
		}
	};

	const handleResetPassword = async () => {
		if (!confirm("Are you sure you want to reset the admin password? You will need to set a new password on next login.")) {
			return;
		}

		setIsResettingPassword(true);
		try {
			const success = await resetAdminPassword();
			if (success) {
				setAdminPasswordIsSet(false);
				setIsAdminAuthenticated(false);
				setSignatures([]);
				alert("Admin password has been reset. Next login will set a new password.");
			} else {
				alert("Failed to reset password. Please try again.");
			}
		} catch (error) {
			console.error("Failed to reset password:", error);
			alert("Failed to reset password. Please try again.");
		} finally {
			setIsResettingPassword(false);
		}
	};

	const handleAdminLogout = async () => {
		await logoutAdmin();
		setIsAdminAuthenticated(false);
		setSignatures([]);
		setIsAdminOpen(false);
	};

	const exportToCSV = () => {
		const headers = ["ID", "Name", "Email", "Postcode", "Comment", "Date Signed"];
		const csvContent = [
			headers.join(","),
			...signatures.map((sig) =>
				[
					sig.id,
					`"${sig.name.replace(/"/g, '""')}"`,
					sig.email,
					sig.postcode,
					`"${(sig.comment || "").replace(/"/g, '""')}"`,
					new Date(parseInt(sig.create_time) * 1000).toLocaleDateString("en-GB"),
				].join(",")
			),
		].join("\n");

		const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
		const link = document.createElement("a");
		link.href = URL.createObjectURL(blob);
		link.download = `petition-signatures-${new Date().toISOString().split("T")[0]}.csv`;
		link.click();
	};

	const shareUrl = typeof window !== "undefined" ? window.location.href : "";
	const shareText =
		"Join me in demanding better housing standards to prevent damp, mould, and thermal failures in UK homes.";

	const scrollToPetition = () => {
		document.getElementById("petition-form")?.scrollIntoView({ behavior: "smooth" });
	};

	return (
		<div className="min-h-screen bg-background">
			{/* Hero Section */}
			<section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
				<div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptMCAwdi02aC02djZoNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-50" />
				<div className="container mx-auto px-4 py-16 md:py-24 lg:py-32 relative">
					<div className="max-w-4xl mx-auto text-center">
						<div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
							<AlertTriangle className="size-4" />
							<span>Urgent Action Required</span>
						</div>
						<h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
							Safe Homes,{" "}
							<span className="text-amber-400">Healthy Lives</span>
						</h1>
						<p className="text-lg md:text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
							Join thousands of UK residents demanding enforceable housing
							quality standards to prevent damp, mould, and thermal loss
							failures that put families at risk.
						</p>
						<div className="flex flex-col sm:flex-row gap-4 justify-center">
							<Button
								size="lg"
								className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold"
								onClick={scrollToPetition}
							>
								Sign the Petition
								<ArrowRight className="size-5" />
							</Button>
							<Button
								size="lg"
								variant="outline"
								className="border-slate-400 text-slate-900 hover:bg-slate-100"
								onClick={() =>
									document
										.getElementById("evidence")
										?.scrollIntoView({ behavior: "smooth" })
								}
							>
								View the Evidence
							</Button>
						</div>
						<p className="text-slate-400 mt-6">
							<span className="text-amber-400 font-bold text-2xl">
								{signatureCount.toLocaleString()}
							</span>{" "}
							signatures and counting
						</p>
					</div>
				</div>
			</section>

			{/* Evidence Grid Section */}
			<section id="evidence" className="py-16 md:py-24 bg-slate-50">
				<div className="container mx-auto px-4">
					<div className="text-center mb-12">
						<h2 className="text-3xl md:text-4xl font-bold mb-4">
							The Evidence is Clear
						</h2>
						<p className="text-muted-foreground max-w-2xl mx-auto">
							Real inspection findings from UK properties demonstrate the urgent
							need for improved housing standards. These issues affect millions
							of homes across the country.
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						<Card className="overflow-hidden">
							<div className="aspect-video bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
								<Droplets className="size-16 text-blue-400" />
							</div>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Droplets className="size-5 text-blue-500" />
									Rising Damp
								</CardTitle>
								<CardDescription>
									Moisture rising through walls due to failed damp-proof
									courses, causing structural damage and health hazards.
								</CardDescription>
							</CardHeader>
						</Card>

						<Card className="overflow-hidden">
							<div className="aspect-video bg-gradient-to-br from-green-900 to-slate-900 flex items-center justify-center">
								<AlertTriangle className="size-16 text-green-400" />
							</div>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<AlertTriangle className="size-5 text-green-600" />
									Black Mould Growth
								</CardTitle>
								<CardDescription>
									Toxic mould colonies forming in poorly ventilated spaces,
									triggering respiratory conditions and allergies.
								</CardDescription>
							</CardHeader>
						</Card>

						<Card className="overflow-hidden">
							<div className="aspect-video bg-gradient-to-br from-orange-900 to-slate-900 flex items-center justify-center">
								<Thermometer className="size-16 text-orange-400" />
							</div>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Thermometer className="size-5 text-orange-500" />
									Thermal Bridging
								</CardTitle>
								<CardDescription>
									Cold spots where insulation fails, leading to condensation,
									energy waste, and uncomfortable living conditions.
								</CardDescription>
							</CardHeader>
						</Card>

						<Card className="overflow-hidden">
							<div className="aspect-video bg-gradient-to-br from-cyan-900 to-slate-900 flex items-center justify-center">
								<Home className="size-16 text-cyan-400" />
							</div>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Home className="size-5 text-cyan-500" />
									Window Condensation
								</CardTitle>
								<CardDescription>
									Single-glazed or poorly fitted windows causing excessive
									condensation and water damage to frames and walls.
								</CardDescription>
							</CardHeader>
						</Card>

						<Card className="overflow-hidden">
							<div className="aspect-video bg-gradient-to-br from-purple-900 to-slate-900 flex items-center justify-center">
								<Shield className="size-16 text-purple-400" />
							</div>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Shield className="size-5 text-purple-500" />
									Roof Leaks
								</CardTitle>
								<CardDescription>
									Penetrating damp from damaged roofing causing ceiling damage,
									electrical hazards, and structural weakening.
								</CardDescription>
							</CardHeader>
						</Card>

						<Card className="overflow-hidden">
							<div className="aspect-video bg-gradient-to-br from-red-900 to-slate-900 flex items-center justify-center">
								<Users className="size-16 text-red-400" />
							</div>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Users className="size-5 text-red-500" />
									Health Impact
								</CardTitle>
								<CardDescription>
									Families living in these conditions face increased risk of
									asthma, infections, and mental health challenges.
								</CardDescription>
							</CardHeader>
						</Card>
					</div>
				</div>
			</section>

			{/* How It Works Section */}
			<section className="py-16 md:py-24">
				<div className="container mx-auto px-4">
					<div className="text-center mb-12">
						<h2 className="text-3xl md:text-4xl font-bold mb-4">
							How Your Voice Creates Change
						</h2>
						<p className="text-muted-foreground max-w-2xl mx-auto">
							Every signature strengthens our collective voice. Here&apos;s how
							your participation drives meaningful reform in UK housing
							standards.
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-4 gap-8">
						<div className="text-center">
							<div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
								<FileText className="size-8 text-amber-600" />
							</div>
							<h3 className="font-semibold text-lg mb-2">1. Sign the Petition</h3>
							<p className="text-muted-foreground text-sm">
								Add your name and postcode to show your support for improved
								housing standards.
							</p>
						</div>

						<div className="text-center">
							<div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
								<Users className="size-8 text-blue-600" />
							</div>
							<h3 className="font-semibold text-lg mb-2">2. Build Momentum</h3>
							<p className="text-muted-foreground text-sm">
								Share with friends and family to grow our coalition of concerned
								residents.
							</p>
						</div>

						<div className="text-center">
							<div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
								<CheckCircle className="size-8 text-green-600" />
							</div>
							<h3 className="font-semibold text-lg mb-2">3. Present Evidence</h3>
							<p className="text-muted-foreground text-sm">
								We deliver signatures with documented evidence to MPs and housing
								authorities.
							</p>
						</div>

						<div className="text-center">
							<div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
								<Shield className="size-8 text-purple-600" />
							</div>
							<h3 className="font-semibold text-lg mb-2">4. Achieve Change</h3>
							<p className="text-muted-foreground text-sm">
								Push for enforceable standards that protect tenants and
								homeowners alike.
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Petition Form Section */}
			<section id="petition-form" className="py-16 md:py-24 bg-slate-900 text-white">
				<div className="container mx-auto px-4">
					<div className="max-w-2xl mx-auto">
						<div className="text-center mb-8">
							<h2 className="text-3xl md:text-4xl font-bold mb-4">
								Sign the Petition
							</h2>
							<p className="text-slate-300">
								Add your voice to demand safe, healthy homes for everyone in the
								UK. Your signature matters.
							</p>
						</div>

						{submitSuccess ? (
							<Card className="bg-green-50 border-green-200">
								<CardContent className="pt-6">
									<div className="text-center">
										<CheckCircle className="size-16 text-green-500 mx-auto mb-4" />
										<h3 className="text-xl font-semibold text-green-800 mb-2">
											Thank You for Signing!
										</h3>
										<p className="text-green-700 mb-6">
											Your signature has been recorded. Help us reach more
											people by sharing this petition.
										</p>
										<div className="flex justify-center gap-4">
											<Button
												variant="outline"
												size="sm"
												onClick={() =>
													window.open(
														`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
														"_blank"
													)
												}
											>
												<Twitter className="size-4" />
												Share on X
											</Button>
											<Button
												variant="outline"
												size="sm"
												onClick={() =>
													window.open(
														`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
														"_blank"
													)
												}
											>
												<Facebook className="size-4" />
												Share on Facebook
											</Button>
										</div>
										<Button
											variant="link"
											className="mt-4 text-green-700"
											onClick={() => setSubmitSuccess(false)}
										>
											Sign another petition
										</Button>
									</div>
								</CardContent>
							</Card>
						) : (
							<Card className="bg-white">
								<CardContent className="pt-6">
									<Form {...form}>
										<form
											onSubmit={form.handleSubmit(onSubmit)}
											className="space-y-6"
										>
											<FormField
												control={form.control}
												name="name"
												render={({ field }) => (
													<FormItem>
														<FormLabel className="text-slate-900">
															Full Name *
														</FormLabel>
														<FormControl>
															<Input
																placeholder="Enter your full name"
																{...field}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={form.control}
												name="email"
												render={({ field }) => (
													<FormItem>
														<FormLabel className="text-slate-900">
															Email Address *
														</FormLabel>
														<FormControl>
															<Input
																type="email"
																placeholder="your.email@example.com"
																{...field}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={form.control}
												name="postcode"
												render={({ field }) => (
													<FormItem>
														<FormLabel className="text-slate-900">
															UK Postcode *
														</FormLabel>
														<FormControl>
															<Input
																placeholder="e.g. SW1A 1AA"
																{...field}
																onChange={(e) =>
																	field.onChange(e.target.value.toUpperCase())
																}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={form.control}
												name="comment"
												render={({ field }) => (
													<FormItem>
														<FormLabel className="text-slate-900">
															Your Story (Optional)
														</FormLabel>
														<FormControl>
															<Textarea
																placeholder="Share your experience with housing quality issues..."
																className="min-h-[100px]"
																{...field}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={form.control}
												name="consent"
												render={({ field }) => (
													<FormItem className="flex flex-row items-start space-x-3 space-y-0">
														<FormControl>
															<Checkbox
																checked={field.value}
																onCheckedChange={field.onChange}
															/>
														</FormControl>
														<div className="space-y-1 leading-none">
															<FormLabel className="text-slate-700 font-normal">
																I consent to my data being processed for this
																petition and understand it may be shared with
																government bodies to support housing reform. *
															</FormLabel>
															<FormMessage />
														</div>
													</FormItem>
												)}
											/>

											{submitError && (
												<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
													{submitError}
												</div>
											)}

											<Button
												type="submit"
												size="lg"
												className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold"
												disabled={isSubmitting}
											>
												{isSubmitting ? "Submitting..." : "Sign the Petition"}
											</Button>
										</form>
									</Form>
								</CardContent>
							</Card>
						)}
					</div>
				</div>
			</section>

			{/* Social Sharing Section */}
			<section className="py-12 bg-amber-500">
				<div className="container mx-auto px-4">
					<div className="flex flex-col md:flex-row items-center justify-between gap-6">
						<div>
							<h3 className="text-2xl font-bold text-slate-900">
								Help Us Reach More People
							</h3>
							<p className="text-slate-800">
								Share this petition with your network to amplify our voice.
							</p>
						</div>
						<div className="flex gap-3">
							<Button
								variant="secondary"
								onClick={() =>
									window.open(
										`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
										"_blank"
									)
								}
								aria-label="Share on X (Twitter)"
							>
								<Twitter className="size-5" />
								<span className="hidden sm:inline">Share on X</span>
							</Button>
							<Button
								variant="secondary"
								onClick={() =>
									window.open(
										`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
										"_blank"
									)
								}
								aria-label="Share on Facebook"
							>
								<Facebook className="size-5" />
								<span className="hidden sm:inline">Facebook</span>
							</Button>
							<Button
								variant="secondary"
								onClick={() =>
									window.open(
										`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
										"_blank"
									)
								}
								aria-label="Share on LinkedIn"
							>
								<Linkedin className="size-5" />
								<span className="hidden sm:inline">LinkedIn</span>
							</Button>
						</div>
					</div>
				</div>
			</section>

			{/* FAQs Section */}
			<section className="py-16 md:py-24">
				<div className="container mx-auto px-4">
					<div className="max-w-3xl mx-auto">
						<div className="text-center mb-12">
							<h2 className="text-3xl md:text-4xl font-bold mb-4">
								Frequently Asked Questions
							</h2>
							<p className="text-muted-foreground">
								Find answers to common questions about this petition and our
								campaign.
							</p>
						</div>

						<Accordion type="single" collapsible className="w-full">
							<AccordionItem value="item-1">
								<AccordionTrigger>
									What is this petition trying to achieve?
								</AccordionTrigger>
								<AccordionContent>
									This petition calls for enforceable housing quality standards
									across the UK to prevent damp, mould, and thermal loss
									failures. We want mandatory inspections, clear minimum
									standards, and effective enforcement mechanisms to protect
									residents from unhealthy living conditions.
								</AccordionContent>
							</AccordionItem>

							<AccordionItem value="item-2">
								<AccordionTrigger>
									Why do you need my postcode?
								</AccordionTrigger>
								<AccordionContent>
									Your postcode helps us demonstrate geographic support across
									the UK. It allows us to show MPs that their constituents are
									concerned about housing standards and strengthens our case
									when presenting the petition to Parliament and local housing
									authorities.
								</AccordionContent>
							</AccordionItem>

							<AccordionItem value="item-3">
								<AccordionTrigger>
									How will my data be used?
								</AccordionTrigger>
								<AccordionContent>
									Your data will be used solely for this petition. We may share
									aggregated signature counts and anonymised geographic data
									with government bodies and media to support our campaign. Your
									email will only be used for campaign updates if you opt in,
									and will never be sold to third parties.
								</AccordionContent>
							</AccordionItem>

							<AccordionItem value="item-4">
								<AccordionTrigger>
									Who is behind this campaign?
								</AccordionTrigger>
								<AccordionContent>
									This is a grassroots campaign driven by concerned UK
									residents, housing advocates, and public health professionals
									who have seen the devastating impact of poor housing quality
									on families and communities. We operate independently and are
									not affiliated with any political party.
								</AccordionContent>
							</AccordionItem>

							<AccordionItem value="item-5">
								<AccordionTrigger>
									What happens when the petition reaches its target?
								</AccordionTrigger>
								<AccordionContent>
									Once we reach significant signature milestones, we will
									formally present the petition to relevant government
									departments, MPs, and housing committees. We will also engage
									with media to raise public awareness and push for legislative
									action on housing quality standards.
								</AccordionContent>
							</AccordionItem>

							<AccordionItem value="item-6">
								<AccordionTrigger>
									Can I sign if I rent or own my home?
								</AccordionTrigger>
								<AccordionContent>
									Absolutely! This petition is open to all UK residents
									regardless of housing tenure. Whether you rent privately, live
									in social housing, or own your home, improved housing
									standards benefit everyone and protect property values while
									ensuring safe living conditions.
								</AccordionContent>
							</AccordionItem>
						</Accordion>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="bg-slate-900 text-slate-300 py-12">
				<div className="container mx-auto px-4">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
						<div>
							<h4 className="text-white font-semibold text-lg mb-4">
								Safe Homes Campaign
							</h4>
							<p className="text-sm">
								A data-driven initiative advocating for enforceable housing
								quality standards to prevent damp, mould, and thermal failures
								across the UK.
							</p>
						</div>

						<div>
							<h4 className="text-white font-semibold text-lg mb-4">Contact</h4>
							<div className="space-y-2 text-sm">
								<p className="flex items-center gap-2">
									<Mail className="size-4" />
									contact@safehomescampaign.org.uk
								</p>
								<p className="flex items-center gap-2">
									<MapPin className="size-4" />
									United Kingdom
								</p>
							</div>
						</div>

						<div>
							<h4 className="text-white font-semibold text-lg mb-4">Links</h4>
							<div className="space-y-2 text-sm">
								<button
									className="block hover:text-white transition-colors"
									onClick={() =>
										alert(
											"Privacy Policy: We collect only essential data for this petition. Your information is securely stored and never sold to third parties."
										)
									}
								>
									Privacy Policy
								</button>
								<Dialog open={isAdminOpen} onOpenChange={setIsAdminOpen}>
									<DialogTrigger asChild>
										<button className="block hover:text-white transition-colors">
											<Lock className="inline size-3 mr-1" />
											Admin Access
										</button>
									</DialogTrigger>
									<DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
										<DialogHeader>
											<DialogTitle>Admin Panel</DialogTitle>
											<DialogDescription>
												{isAdminAuthenticated
													? "View and export petition signatures"
													: "Enter the admin password to access signatures"}
											</DialogDescription>
										</DialogHeader>

										{!isAdminAuthenticated ? (
											<div className="space-y-4">
												<div>
													<Label htmlFor="admin-password">Password</Label>
													<Input
														id="admin-password"
														type="password"
														value={adminPassword}
														onChange={(e) => setAdminPassword(e.target.value)}
														placeholder={adminPasswordIsSet === false ? "Set your admin password" : "Enter admin password"}
														disabled={isAdminLoading}
														onKeyDown={(e) =>
															e.key === "Enter" && !isAdminLoading && handleAdminLogin()
														}
													/>
												</div>
												{adminError && (
													<p className="text-sm text-red-600">{adminError}</p>
												)}
												<Button
													onClick={handleAdminLogin}
													disabled={isAdminLoading}
												>
													{isAdminLoading ? "Logging in..." : adminPasswordIsSet === false ? "Set Password & Login" : "Login"}
												</Button>
												<p className="text-xs text-muted-foreground">
													{adminPasswordIsSet === false
														? "First login sets password. Choose a secure password."
														: "First login sets password."}
												</p>
											</div>
										) : (
											<div className="space-y-4">
												<div className="flex justify-between items-center mb-4">
													<div className="flex gap-2">
														<Button
															onClick={handleResetPassword}
															variant="outline"
															disabled={isResettingPassword}
															className="text-red-600 hover:text-red-700 hover:bg-red-50"
														>
															{isResettingPassword ? "Resetting..." : "Reset Password"}
														</Button>
														<Button onClick={handleAdminLogout} variant="ghost">
															Logout
														</Button>
													</div>
												</div>

												<Tabs defaultValue="signatures" className="w-full">
													<TabsList className="grid w-full grid-cols-2">
														<TabsTrigger value="signatures">Signatures</TabsTrigger>
														<TabsTrigger value="seo-social">SEO & Social</TabsTrigger>
													</TabsList>

													<TabsContent value="signatures" className="mt-4">
														<div className="space-y-4">
															<div className="flex justify-between items-center">
																<p className="text-sm text-muted-foreground">
																	Total signatures: {signatures.length}
																</p>
																<Button onClick={exportToCSV} variant="outline">
																	<Download className="size-4" />
																	Export CSV
																</Button>
															</div>

															{isLoadingSignatures ? (
																<p>Loading signatures...</p>
															) : (
																<Table>
																	<TableHeader>
																		<TableRow>
																			<TableHead>Name</TableHead>
																			<TableHead>Email</TableHead>
																			<TableHead>Postcode</TableHead>
																			<TableHead>Comment</TableHead>
																			<TableHead>Date</TableHead>
																		</TableRow>
																	</TableHeader>
																	<TableBody>
																		{signatures.map((sig) => (
																			<TableRow key={sig.id}>
																				<TableCell>{sig.name}</TableCell>
																				<TableCell>{sig.email}</TableCell>
																				<TableCell>{sig.postcode}</TableCell>
																				<TableCell className="max-w-[200px] truncate">
																					{sig.comment || "-"}
																				</TableCell>
																				<TableCell>
																					{new Date(
																						parseInt(sig.create_time) * 1000
																					).toLocaleDateString("en-GB")}
																				</TableCell>
																			</TableRow>
																		))}
																	</TableBody>
																</Table>
															)}
														</div>
													</TabsContent>

													<TabsContent value="seo-social" className="mt-4">
														<div className="mb-4 flex justify-end">
															<Link to="/admin/seo">
																<Button variant="outline" size="sm" className="gap-2">
																	<ExternalLink className="size-4" />
																	Open Full Page
																</Button>
															</Link>
														</div>
														<SEOSettingsCard />
													</TabsContent>
												</Tabs>
											</div>
										)}
									</DialogContent>
								</Dialog>
							</div>
						</div>
					</div>

					<div className="border-t border-slate-700 mt-8 pt-8 text-center text-sm">
						<p>
							© {new Date().getFullYear()} Safe Homes Campaign. All rights
							reserved.
						</p>
						<p className="mt-2 text-slate-500">
							This campaign is focused on evidence-based advocacy for proactive
							housing standards.
						</p>
					</div>
				</div>
			</footer>
		</div>
	);
}
