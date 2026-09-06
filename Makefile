include .env

# Export variables so they are available to shell commands
export

migrate:
	@echo "Running migrations..."
	@PGPASSWORD=$(DB_PASSWORD) psql -h $(DB_HOST) -p $(DB_PORT) -U $(DB_USER) -d $(DB_NAME) -f sql/schema.sql
	@echo "Migration completed."

createdb:
	@echo "Creating database $(DB_NAME)..."
	@PGPASSWORD=$(DB_PASSWORD) createdb -h $(DB_HOST) -p $(DB_PORT) -U $(DB_USER) $(DB_NAME)
	@echo "Database $(DB_NAME) created."

dropdb:
	@echo "Dropping database $(DB_NAME)..."
	@PGPASSWORD=$(DB_PASSWORD) dropdb -h $(DB_HOST) -p $(DB_PORT) -U $(DB_USER) --if-exists --force $(DB_NAME)
	@echo "Database $(DB_NAME) dropped."

resetdb: dropdb createdb migrate

seed:
	@echo "Seeding database..."
	@PGPASSWORD=$(DB_PASSWORD) psql -h $(DB_HOST) -p $(DB_PORT) -U $(DB_USER) -d $(DB_NAME) -f sql/seed.sql
	@echo "Seeding completed."

freshdb: dropdb createdb migrate seed

psql:
	@PGPASSWORD=$(DB_PASSWORD) psql -h $(DB_HOST) -p $(DB_PORT) -U $(DB_USER) -d $(DB_NAME)

sqlc:
	@echo "Generating sqlc code..."
	@/opt/homebrew/bin/sqlc generate
	@echo "sqlc generation completed."


dev:
	@make -j 2 dev-backend dev-frontend

dev-backend:
	go run cmd/server/main.go

dev-frontend:
	cd frontend && npm run dev
