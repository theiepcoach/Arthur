import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Upload,
  FileText,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ArrowRight,
  ChevronRight,
  Target,
  BarChart3,
  Scale,
  ClipboardList,
  Sparkles,
  CreditCard,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

type RiskLevel = "HIGH" | "MODERATE" | "LOW";

interface CategoryScore {
  score: number;
  finding: string;
}

interface KeyRisk {
  title: string;
  explanation: string;
}

interface ScanResult {
  score: number;
  max_score: number;
  risk_level: RiskLevel;
  categories: Record<string, CategoryScore>;
  key_risks: KeyRisk[];
  impact_summary: string;
  recommended_actions: string[];
  scan_id?: string;
}

type Screen = "entry" | "upload" | "processing" | "partial" | "email-gate" | "payment-gate" | "results" | "upgrade";

const PROCESSING_MESSAGES = [
  "Reviewing present levels…",
  "Checking goal alignment…",
  "Analyzing services and supports…",
  "Scanning for compliance gaps…",
];

const CATEGORY_LABELS: Record<string, string> = {
  plaafp_clarity: "PLAAFP Clarity",
  goal_alignment: "Goal Alignment",
  goal_measurability: "Goal Measurability",
  services_specificity: "Services Specificity",
  progress_monitoring: "Progress Monitoring",
};

export default function IepRiskScanner() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [screen, setScreen] = useState<Screen>("entry");
  const [file, setFile] = useState<File | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Handle return from Stripe Checkout
  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    const scanId = searchParams.get("scan_id");

    if (paymentStatus === "success" && scanId) {
      setVerifying(true);
      setScreen("processing");
      setProgress(80);
      setMessageIndex(3);

      (async () => {
        try {
          const { data, error } = await supabase.functions.invoke("iep-scanner-verify-payment", {
            body: { scan_id: scanId },
          });

          if (error) throw error;
          if (data?.error) throw new Error(data.error);

          if (data?.paid) {
            setResult({
              score: data.score,
              max_score: data.max_score,
              risk_level: data.risk_level,
              categories: data.categories,
              key_risks: data.key_risks,
              impact_summary: data.impact_summary,
              recommended_actions: data.recommended_actions,
              scan_id: scanId,
            });
            setProgress(100);
            setTimeout(() => {
              setScreen("results");
              setVerifying(false);
            }, 500);
          } else {
            toast.error("Payment could not be verified. Please try again.");
            setScreen("entry");
            setVerifying(false);
          }
        } catch (err: any) {
          toast.error(err.message || "Payment verification failed.");
          setScreen("entry");
          setVerifying(false);
        }
      })();

      // Clean URL params
      setSearchParams({}, { replace: true });
    } else if (paymentStatus === "canceled") {
      toast("Payment was canceled. You can try again anytime.");
      setSearchParams({}, { replace: true });
    }
  }, []);

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && (f.type === "application/pdf" || f.name.endsWith(".docx") || f.name.endsWith(".doc"))) {
      setFile(f);
    } else {
      toast.error("Please upload a PDF or DOCX file.");
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  }, []);

  const runAnalysis = useCallback(async () => {
    if (!file || !confirmed) return;
    setScreen("processing");
    setProgress(0);
    setMessageIndex(0);

    const interval = setInterval(() => {
      setProgress((p) => (p >= 90 ? 90 : p + Math.random() * 15));
      setMessageIndex((i) => (i + 1) % PROCESSING_MESSAGES.length);
    }, 2000);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (user?.id) formData.append("user_id", user.id);

      const { data, error } = await supabase.functions.invoke("iep-risk-scanner", {
        body: formData,
      });

      clearInterval(interval);
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setProgress(100);
      setResult(data as ScanResult);

      // All users see partial first (risk level only)
      setTimeout(() => setScreen("partial"), 500);
    } catch (err: any) {
      clearInterval(interval);
      toast.error(err.message || "Analysis failed. Please try again.");
      setScreen("upload");
    }
  }, [file, confirmed, user]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !firstName || !lastName) return;

    try {
      if (result?.scan_id) {
        await supabase.functions.invoke("iep-risk-scanner", {
          body: {
            action: "capture_email",
            scan_id: result.scan_id,
            email,
            first_name: firstName,
            last_name: lastName,
          },
        });
      }
      // After email capture, show payment gate
      setScreen("payment-gate");
    } catch {
      setScreen("payment-gate");
    }
  };

  const handlePayment = async () => {
    if (!result?.scan_id) return;
    setPaymentLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("iep-scanner-checkout", {
        body: {
          scan_id: result.scan_id,
          email: email || user?.email || undefined,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      toast.error(err.message || "Could not start checkout. Please try again.");
      setPaymentLoading(false);
    }
  };

  const riskColor = (level: RiskLevel) => {
    switch (level) {
      case "HIGH": return "text-destructive";
      case "MODERATE": return "text-yellow-500";
      case "LOW": return "text-green-600";
    }
  };

  const riskBg = (level: RiskLevel) => {
    switch (level) {
      case "HIGH": return "bg-destructive/10 border-destructive/30";
      case "MODERATE": return "bg-yellow-500/10 border-yellow-500/30";
      case "LOW": return "bg-green-600/10 border-green-600/30";
    }
  };

  const riskIcon = (level: RiskLevel) => {
    switch (level) {
      case "HIGH": return <ShieldAlert className="h-8 w-8 text-destructive" />;
      case "MODERATE": return <AlertTriangle className="h-8 w-8 text-yellow-500" />;
      case "LOW": return <ShieldCheck className="h-8 w-8 text-green-600" />;
    }
  };

  const scoreColor = (score: number) => {
    if (score === 0) return "text-destructive";
    if (score === 1) return "text-yellow-500";
    return "text-green-600";
  };

  const reset = () => {
    setScreen("entry");
    setFile(null);
    setConfirmed(false);
    setResult(null);
    setProgress(0);
    setFirstName("");
    setLastName("");
    setEmail("");
    setPaymentLoading(false);
  };

  // ── SCREEN: Entry ──
  if (screen === "entry") {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-destructive/10 px-4 py-1.5 mb-6">
            <ShieldAlert className="h-4 w-4 text-destructive" />
            <span className="text-sm font-medium text-destructive">IEP Risk Analysis</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
            Stop guessing if the IEP is solid.{" "}
            <span className="text-primary">Know where it breaks.</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
            Upload your IEP and instantly see where it is weak, unclear, or legally exposed.
          </p>
          <Button
            size="lg"
            onClick={() => setScreen("upload")}
            className="text-lg px-8 py-6 h-auto"
          >
            Upload IEP
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <p className="mt-6 text-xs text-muted-foreground">
            No account required. Documents are processed temporarily and not stored.
          </p>
        </div>
      </div>
    );
  }

  // ── SCREEN: Upload ──
  if (screen === "upload") {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-16">
          <button
            onClick={() => setScreen("entry")}
            className="text-sm text-muted-foreground hover:text-foreground mb-8 flex items-center gap-1"
          >
            ← Back
          </button>
          <h2 className="text-2xl font-bold text-foreground mb-2">Upload Your IEP</h2>
          <p className="text-muted-foreground mb-8">
            Drag and drop your IEP document or click to browse.
          </p>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
              file ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/30 hover:bg-muted/30"
            }`}
          >
            {file ? (
              <div className="flex flex-col items-center gap-3">
                <FileText className="h-10 w-10 text-primary" />
                <p className="font-medium text-foreground">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <Button variant="outline" size="sm" onClick={() => setFile(null)}>
                  Remove
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Upload className="h-10 w-10 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Drag & drop your PDF or DOCX here
                </p>
                <label>
                  <input
                    type="file"
                    accept=".pdf,.docx,.doc"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <span className="text-sm text-primary hover:underline cursor-pointer">
                    or click to browse
                  </span>
                </label>
              </div>
            )}
          </div>

          <div className="flex items-start gap-3 mt-6">
            <Checkbox
              id="consent"
              checked={confirmed}
              onCheckedChange={(c) => setConfirmed(c === true)}
              className="mt-0.5"
            />
            <label htmlFor="consent" className="text-sm text-muted-foreground cursor-pointer">
              I confirm I have permission to upload this document for analysis.
            </label>
          </div>

          <Button
            size="lg"
            className="w-full mt-6"
            disabled={!file || !confirmed}
            onClick={runAnalysis}
          >
            Analyze My IEP
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // ── SCREEN: Processing ──
  if (screen === "processing") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">
            {verifying ? "Verifying Payment…" : "Analyzing Your IEP"}
          </h2>
          <p className="text-muted-foreground mb-6 h-6 transition-opacity">
            {verifying ? "Unlocking your full report…" : PROCESSING_MESSAGES[messageIndex]}
          </p>
          <Progress value={progress} className="h-2 mb-2" />
          <p className="text-xs text-muted-foreground">{Math.round(progress)}% complete</p>
        </div>
      </div>
    );
  }

  // ── SCREEN: Partial Results (risk level ONLY — no findings) ──
  if (screen === "partial" && result) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-4 py-12">
          {/* Risk Level Banner */}
          <div className={`rounded-xl border-2 p-6 mb-8 flex items-center gap-4 ${riskBg(result.risk_level)}`}>
            {riskIcon(result.risk_level)}
            <div>
              <h2 className="text-lg font-bold">
                IEP Risk Level:{" "}
                <span className={riskColor(result.risk_level)}>{result.risk_level}</span>
              </h2>
              <p className="text-sm text-muted-foreground">
                We found areas of concern in your IEP document.
              </p>
            </div>
          </div>

          {/* Blurred / Locked sections */}
          <div className="relative mb-8">
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/70 backdrop-blur-md rounded-xl">
              <div className="text-center px-6 py-8">
                <Lock className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="text-xl font-bold text-foreground mb-2">
                  See what's wrong with your IEP
                </h3>
                <p className="text-sm text-muted-foreground mb-5 max-w-md">
                  Get a preview of the key risks found in your document.
                </p>
                <Button
                  size="lg"
                  onClick={() => user ? setScreen("payment-gate") : setScreen("email-gate")}
                >
                  {user ? "Unlock Preview" : "Unlock Preview — Free"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Blurred preview content */}
            <div className="space-y-4 opacity-40 pointer-events-none select-none" aria-hidden>
              <Card>
                <CardHeader><CardTitle className="text-lg">Key Risks Found</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="border-l-2 border-yellow-500/60 pl-4">
                        <div className="h-4 bg-muted rounded w-1/2 mb-1" />
                        <div className="h-3 bg-muted rounded w-3/4" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-lg">Category Breakdown</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {["PLAAFP Clarity", "Goal Alignment", "Measurability", "Services", "Progress"].map((c) => (
                      <div key={c} className="flex items-center gap-3">
                        <div className="font-bold text-lg w-6 text-center text-muted-foreground">?</div>
                        <p className="text-sm text-muted-foreground">{c}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── SCREEN: Email Gate (guests only) ──
  if (screen === "email-gate" && result) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 py-16">
          <div className="text-center mb-8">
            {riskIcon(result.risk_level)}
            <h2 className="text-2xl font-bold text-foreground mt-4 mb-2">
              Your IEP Risk Level:{" "}
              <span className={riskColor(result.risk_level)}>{result.risk_level}</span>
            </h2>
            <p className="text-muted-foreground">
              Enter your details to see a preview of the issues found.
            </p>
          </div>

          <form onSubmit={handleEmailSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                required
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="h-11 px-4 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <input
                type="text"
                required
                placeholder="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="h-11 px-4 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-11 px-4 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Button type="submit" size="lg" className="w-full">
              See Preview
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <p className="text-xs text-muted-foreground mt-4 text-center">
            No spam, ever. We'll email you a copy of your results.
          </p>
        </div>
      </div>
    );
  }

  // ── SCREEN: Payment Gate (shows 1-2 findings + blurred full report) ──
  if (screen === "payment-gate" && result) {
    const visibleRisks = result.key_risks.slice(0, 2);
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-4 py-12">
          {/* Risk Level Banner */}
          <div className={`rounded-xl border-2 p-6 mb-8 flex items-center gap-4 ${riskBg(result.risk_level)}`}>
            {riskIcon(result.risk_level)}
            <div>
              <h2 className="text-lg font-bold">
                IEP Risk Level:{" "}
                <span className={riskColor(result.risk_level)}>{result.risk_level}</span>
              </h2>
              <p className="text-sm text-muted-foreground">
                Score: {result.score}/{result.max_score} across 5 evaluation categories
              </p>
            </div>
          </div>

          {/* Visible: 1-2 findings preview */}
          {visibleRisks.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Key Risks Found (Preview)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {visibleRisks.map((risk, i) => (
                    <div key={i} className="border-l-2 border-yellow-500/60 pl-4">
                      <p className="font-medium text-foreground text-sm">{risk.title}</p>
                      <p className="text-sm text-muted-foreground">{risk.explanation}</p>
                    </div>
                  ))}
                </div>
                {result.key_risks.length > 2 && (
                  <p className="text-xs text-muted-foreground mt-3 italic">
                    + {result.key_risks.length - 2} more risk{result.key_risks.length - 2 > 1 ? "s" : ""} found…
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Blurred full breakdown + Payment CTA */}
          <div className="relative mb-8">
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/70 backdrop-blur-md rounded-xl">
              <div className="text-center px-6 py-8">
                <CreditCard className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Unlock Your Full IEP Report
                </h3>
                <p className="text-sm text-muted-foreground mb-2 max-w-md">
                  Get the complete category breakdown, all identified risks,
                  impact analysis, and step-by-step recommendations.
                </p>
                <p className="text-2xl font-bold text-foreground mb-5">$9.99</p>
                <Button
                  size="lg"
                  onClick={handlePayment}
                  disabled={paymentLoading}
                >
                  {paymentLoading ? "Redirecting…" : "Unlock Full Report — $9.99"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <p className="text-xs text-muted-foreground mt-3">
                  One-time payment. Secure checkout via Stripe.
                </p>
              </div>
            </div>

            {/* Blurred preview content */}
            <div className="space-y-4 opacity-40 pointer-events-none select-none" aria-hidden>
              <Card>
                <CardHeader><CardTitle className="text-lg">Category Breakdown</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {["PLAAFP Clarity", "Goal Alignment", "Measurability", "Services", "Progress"].map((c) => (
                      <div key={c} className="flex items-center gap-3">
                        <div className="font-bold text-lg w-6 text-center text-muted-foreground">?</div>
                        <p className="text-sm text-muted-foreground">{c}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-lg">What This Means</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-16 bg-muted rounded w-full" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-lg">Recommendations</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-4 bg-muted rounded w-3/4" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── SCREEN: Full Results (paid) ──
  if (screen === "results" && result) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-4 py-12">
          {/* Risk Level Banner */}
          <div className={`rounded-xl border-2 p-6 mb-8 flex items-center gap-4 ${riskBg(result.risk_level)}`}>
            {riskIcon(result.risk_level)}
            <div>
              <h2 className="text-lg font-bold">
                IEP Risk Level:{" "}
                <span className={riskColor(result.risk_level)}>{result.risk_level}</span>
              </h2>
              <p className="text-sm text-muted-foreground">
                Score: {result.score}/{result.max_score} across 5 evaluation categories
              </p>
            </div>
          </div>

          {/* Category Breakdown */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Category Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(result.categories).map(([key, cat]) => (
                  <div key={key} className="flex items-start gap-3">
                    <div className={`font-bold text-lg w-6 text-center ${scoreColor(cat.score)}`}>
                      {cat.score}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm">
                        {CATEGORY_LABELS[key] || key}
                      </p>
                      <p className="text-sm text-muted-foreground">{cat.finding}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Key Risks */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Key Risks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {result.key_risks.map((risk, i) => (
                  <div key={i} className="border-l-2 border-yellow-500/60 pl-4">
                    <p className="font-medium text-foreground text-sm">{risk.title}</p>
                    <p className="text-sm text-muted-foreground">{risk.explanation}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* What This Means */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">What This Means</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">{result.impact_summary}</p>
            </CardContent>
          </Card>

          {/* What To Do Next */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                What To Do Next
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {result.recommended_actions.map((action, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    {action}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Upgrade Push */}
          <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-8 mb-6">
            <h3 className="text-xl font-bold text-foreground mb-3">What happens next?</h3>
            <p className="text-muted-foreground mb-4">
              Right now, you have insight. But you still need:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {[
                { icon: ClipboardList, label: "Organized case records" },
                { icon: Target, label: "Evidence tracking" },
                { icon: BarChart3, label: "Timeline documentation" },
                { icon: Scale, label: "Strong documentation for disputes" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border">
                  <Icon className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-sm font-medium text-foreground">{label}</span>
                </div>
              ))}
            </div>
            <Button size="lg" className="w-full" asChild>
              <Link to="/signup">
                Start Building Your Case
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* Pricing Bridge */}
          <div className="rounded-xl border border-border bg-muted/30 p-6 text-center">
            <Sparkles className="h-6 w-6 text-primary mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">
              From insight → to control
            </p>
            <p className="text-xs text-muted-foreground mb-4 max-w-md mx-auto">
              You've seen the gaps. Now build the system that closes them. Start with the plan built for your role.
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link to="/pricing">
                View Plans
                <ChevronRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </div>

          {/* Scan Again */}
          <div className="text-center mt-8">
            <Button variant="outline" onClick={reset}>
              Scan Another IEP
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
