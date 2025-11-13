# Stripe Quick Setup Script
# Run this after creating your Stripe account

Write-Host "🚀 Egyptian EdTech Platform - Stripe Setup Helper" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (!(Test-Path ".env")) {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    Write-Host "Creating .env from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env" -ErrorAction SilentlyContinue
}

Write-Host "📋 Stripe Configuration Checklist" -ForegroundColor Green
Write-Host ""

Write-Host "1. Go to https://dashboard.stripe.com/register" -ForegroundColor White
Write-Host "   - Create your Stripe account"
Write-Host "   - Complete business verification"
Write-Host ""

Write-Host "2. Get API Keys:" -ForegroundColor White
Write-Host "   - Navigate to: Developers -> API Keys"
Write-Host "   - Copy your Secret Key (sk_test_...)"
Write-Host "   - Copy your Publishable Key (pk_test_...)"
Write-Host ""

$stripeSecretKey = Read-Host "   Paste your STRIPE_SECRET_KEY here"
$stripePublishableKey = Read-Host "   Paste your NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY here"

Write-Host ""
Write-Host "3. Create Products in Stripe Dashboard:" -ForegroundColor White
Write-Host "   Navigate to: Products -> Add Product"
Write-Host ""
Write-Host "   Create these 6 products:" -ForegroundColor Yellow
Write-Host ""

$products = @(
    @{Name="All-Access Library (Monthly)"; Price="149"; Interval="month"; Var="STRIPE_PRICE_CATEGORY_A_MONTHLY"},
    @{Name="All-Access Library (Yearly)"; Price="1428"; Interval="year"; Var="STRIPE_PRICE_CATEGORY_A_YEARLY"},
    @{Name="Signature Courses (Monthly)"; Price="249"; Interval="month"; Var="STRIPE_PRICE_CATEGORY_B_MONTHLY"},
    @{Name="Signature Courses (Yearly)"; Price="2388"; Interval="year"; Var="STRIPE_PRICE_CATEGORY_B_YEARLY"},
    @{Name="Complete Bundle (Monthly)"; Price="349"; Interval="month"; Var="STRIPE_PRICE_BUNDLE_AB_MONTHLY"},
    @{Name="Complete Bundle (Yearly)"; Price="3348"; Interval="year"; Var="STRIPE_PRICE_BUNDLE_AB_YEARLY"}
)

$priceIds = @{}

foreach ($product in $products) {
    Write-Host "   📦 $($product.Name)" -ForegroundColor Cyan
    Write-Host "      Price: $($product.Price) EGP / $($product.Interval)" -ForegroundColor Gray
    $priceId = Read-Host "      Enter the Price ID (price_xxxxx)"
    $priceIds[$product.Var] = $priceId
    Write-Host ""
}

Write-Host "4. Set up Webhook:" -ForegroundColor White
Write-Host "   - Navigate to: Developers -> Webhooks -> Add Endpoint"
Write-Host "   - Endpoint URL: https://yourdomain.com/api/stripe/webhook"
Write-Host "   - Select these events:"
Write-Host "     ✓ checkout.session.completed"
Write-Host "     ✓ customer.subscription.updated"
Write-Host "     ✓ customer.subscription.deleted"
Write-Host "     ✓ invoice.payment_succeeded"
Write-Host "     ✓ invoice.payment_failed"
Write-Host ""

$webhookSecret = Read-Host "   Paste your STRIPE_WEBHOOK_SECRET (whsec_...)"

Write-Host ""
Write-Host "✅ Configuration collected! Updating .env file..." -ForegroundColor Green

# Update .env file
$envContent = Get-Content ".env" -Raw

# Update or add Stripe keys
if ($envContent -match "STRIPE_SECRET_KEY=") {
    $envContent = $envContent -replace "STRIPE_SECRET_KEY=.*", "STRIPE_SECRET_KEY=$stripeSecretKey"
} else {
    $envContent += "`nSTRIPE_SECRET_KEY=$stripeSecretKey"
}

if ($envContent -match "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=") {
    $envContent = $envContent -replace "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=.*", "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$stripePublishableKey"
} else {
    $envContent += "`nNEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$stripePublishableKey"
}

if ($envContent -match "STRIPE_WEBHOOK_SECRET=") {
    $envContent = $envContent -replace "STRIPE_WEBHOOK_SECRET=.*", "STRIPE_WEBHOOK_SECRET=$webhookSecret"
} else {
    $envContent += "`nSTRIPE_WEBHOOK_SECRET=$webhookSecret"
}

# Add price IDs
foreach ($var in $priceIds.Keys) {
    if ($envContent -match "$var=") {
        $envContent = $envContent -replace "$var=.*", "$var=$($priceIds[$var])"
    } else {
        $envContent += "`n$var=$($priceIds[$var])"
    }
}

# Ensure NEXT_PUBLIC_APP_URL is set
if (-not ($envContent -match "NEXT_PUBLIC_APP_URL=")) {
    $envContent += "`nNEXT_PUBLIC_APP_URL=http://localhost:3000"
}

Set-Content ".env" $envContent

Write-Host ""
Write-Host "✅ .env file updated successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "🧪 Testing Setup..." -ForegroundColor Cyan
Write-Host ""

# Test if npm packages are installed
if (!(Test-Path "node_modules\stripe")) {
    Write-Host "📦 Installing Stripe packages..." -ForegroundColor Yellow
    npm install stripe @stripe/stripe-js
}

Write-Host ""
Write-Host "🎉 Stripe Configuration Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Run development server: npm run dev"
Write-Host "2. Test locally with Stripe CLI: stripe listen --forward-to localhost:3000/api/stripe/webhook"
Write-Host "3. Visit http://localhost:3000/en/subscribe"
Write-Host "4. Test subscription with card: 4242 4242 4242 4242"
Write-Host ""
Write-Host "📚 Full documentation: documentation/STRIPE_INTEGRATION_GUIDE.md" -ForegroundColor Gray
Write-Host ""
