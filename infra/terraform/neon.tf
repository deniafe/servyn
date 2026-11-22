resource "neon_project" "servyn" {
  name      = "servyn-${var.environment}"
  region_id = "aws-eu-west-2" # London, UK/EU data residency (AD-20)
  pg_version = 16
}
