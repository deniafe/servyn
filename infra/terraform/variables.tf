variable "environment" {
  type        = string
  description = "Deployment environment (staging | production)"
}

variable "neon_api_key" {
  type      = string
  sensitive = true
}

variable "upstash_email" {
  type = string
}

variable "upstash_api_key" {
  type      = string
  sensitive = true
}

variable "cloudflare_api_token" {
  type      = string
  sensitive = true
}

variable "cloudflare_account_id" {
  type = string
}

variable "cloudflare_zone_id" {
  type = string
}
