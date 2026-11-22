terraform {
  required_version = ">= 1.7.0"

  required_providers {
    neon = {
      source  = "kislerdm/neon"
      version = "~> 0.6"
    }
    upstash = {
      source  = "upstash/upstash"
      version = "~> 1.5"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.40"
    }
  }
}

provider "neon" {
  api_key = var.neon_api_key
}

provider "upstash" {
  email   = var.upstash_email
  api_key = var.upstash_api_key
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}
