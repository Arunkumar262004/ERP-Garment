#!/bin/sh
set -e

cd /var/www

if [ ! -f vendor/autoload.php ]; then
  echo "[entrypoint] Installing composer dependencies..."
  composer install --no-interaction --prefer-dist --optimize-autoloader
fi

if [ ! -f .env ]; then
  echo "[entrypoint] Creating .env from .env.example..."
  cp .env.example .env
fi

if ! grep -q "^APP_KEY=base64" .env; then
  echo "[entrypoint] Generating application key..."
  php artisan key:generate --force
fi

DB_HOST_VALUE=${DB_HOST:-mysql}
DB_PORT_VALUE=${DB_PORT:-3306}
DB_DATABASE_VALUE=${DB_DATABASE:-erp}
DB_USERNAME_VALUE=${DB_USERNAME:-erp}
DB_PASSWORD_VALUE=${DB_PASSWORD:-erp_secret}

if [ "${DB_CONNECTION:-mysql}" = "mysql" ]; then
  echo "[entrypoint] Waiting for MySQL at ${DB_HOST_VALUE}:${DB_PORT_VALUE}..."
  until php -r "new PDO('mysql:host=${DB_HOST_VALUE};port=${DB_PORT_VALUE};dbname=${DB_DATABASE_VALUE}', '${DB_USERNAME_VALUE}', '${DB_PASSWORD_VALUE}');" 2>/dev/null; do
    sleep 2
  done
  echo "[entrypoint] MySQL is ready."
fi

echo "[entrypoint] Running migrations..."
php artisan migrate --force

if [ ! -f storage/.seeded ]; then
  echo "[entrypoint] Seeding database with demo data..."
  php artisan db:seed --force
  touch storage/.seeded
fi

exec "$@"
