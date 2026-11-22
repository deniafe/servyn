resource "upstash_redis_database" "servyn" {
  database_name = "servyn-${var.environment}"
  region        = "eu-west-2" # London (AD-20)
  tls           = true
}
