.PHONY: install dev build electron-dev electron-build clean lint preview help

# Default target
help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies
	npm install

dev: ## Start Vite dev server (browser only)
	npx vite

electron-dev: ## Start Electron + Vite dev mode
	npx concurrently "vite" "wait-on http://localhost:5173 && electron ."

build: ## Build for production (renderer only)
	npx vite build

electron-build: ## Build and package Electron app
	npx vite build && npx electron-builder

preview: ## Preview production build
	npx vite preview

clean: ## Remove build artifacts
	rm -rf dist dist-electron node_modules/.vite

dist-clean: ## Remove all generated files including node_modules
	rm -rf dist dist-electron node_modules
