FROM php:8.2-cli

# Install pdo and pdo_mysql for TiDB/MySQL connection
RUN docker-php-ext-install pdo pdo_mysql

WORKDIR /app

# Copy project files
COPY . .

# Expose Render dynamic port
ENV PORT=10000
EXPOSE 10000

# Start PHP built-in server with router
CMD ["sh", "-c", "php -S 0.0.0.0:${PORT:-10000} server.php"]