resource "cloudflare_r2_bucket" "public" {
  account_id = var.cloudflare_account_id
  name       = "servyn-${var.environment}-public"
  location   = "WEUR" # Western Europe residency (AD-20)
}

resource "cloudflare_r2_bucket" "private" {
  account_id = var.cloudflare_account_id
  name       = "servyn-${var.environment}-private"
  location   = "WEUR"
}

resource "cloudflare_zone_settings_override" "servyn_tls" {
  zone_id = var.cloudflare_zone_id
  settings {
    ssl                      = "strict"
    always_use_https         = "on"
    min_tls_version          = "1.2"
    automatic_https_rewrites = "on"
  }
}
