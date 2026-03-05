# Contributing to Dufour.app

Thank you for your interest in contributing to Dufour.app! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and collaborative environment.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the [issue tracker](https://github.com/mlanini/dufour-app/issues) to avoid duplicates.

**When submitting a bug report, include:**
- Clear and descriptive title
- Steps to reproduce the issue
- Expected vs. actual behavior
- Screenshots (if applicable)
- Environment details (browser, OS, Docker version)
- Console errors or logs

### Suggesting Enhancements

Enhancement suggestions are welcome! Please submit them as GitHub issues with:
- Clear description of the proposed feature
- Use cases and benefits
- Possible implementation approach (optional)

### Pull Requests

1. **Fork the repository**
   ```bash
   git clone https://github.com/mlanini/dufour-app.git
   cd dufour-app
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Follow the coding standards (see below)
   - Write clear commit messages
   - Add tests if applicable
   - Update documentation

4. **Test your changes**
   ```bash
   # Start development environment
   docker-compose up -d
   cd frontend
   npm install
   npm run dev
   
   # Run tests (if available)
   npm test
   ```

5. **Commit and push**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request**
   - Provide a clear title and description
   - Reference related issues
   - Explain what changes were made and why
   - Include screenshots for UI changes

## Coding Standards

### JavaScript/React

- Use ES6+ syntax
- Follow [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- Use functional components and hooks
- Use meaningful variable and function names
- Add JSDoc comments for complex functions

**Example:**
```javascript
/**
 * Generate military symbol from SIDC code
 * @param {string} sidc - Symbol Identification Code (APP-6)
 * @param {Object} options - Rendering options
 * @returns {string} Data URL of generated symbol
 */
export function generateMilitarySymbol(sidc, options = {}) {
  // Implementation
}
```

### CSS

- Use consistent naming (kebab-case for classes)
- Group related properties
- Use CSS variables for theme colors
- Avoid !important unless absolutely necessary

### Git Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

**Examples:**
```
feat: add terrain profile tool
fix: correct coordinate transformation in search
docs: update deployment guide for Azure
refactor: simplify ORBAT tree rendering
```

## Project Structure

Understand the project organization before contributing:

```
dufour-app/
├── frontend/src/
│   ├── components/      # React components
│   ├── services/        # Business logic
│   ├── layers/          # Map layers
│   ├── store/           # Redux store
│   ├── i18n/            # Translations
│   └── styles/          # CSS files
├── qgis-server/         # QGIS configuration
├── postgis/             # Database initialization
└── nginx/               # Web server config
```

## Development Workflow

### Setting Up Development Environment

1. **Install prerequisites:**
   - Docker Desktop 20.10+
   - Node.js 18+
   - Git

2. **Clone and setup:**
   ```bash
   git clone https://github.com/mlanini/dufour-app.git
   cd dufour-app
   docker-compose up -d
   cd frontend
   npm install
   npm run dev
   ```

3. **Access the application:**
   - Frontend: http://localhost:5173
   - QGIS Server: http://localhost:8080
   - PostGIS: localhost:5432

### Making Changes

**Frontend changes:**
- Edit files in `frontend/src/`
- Vite hot-reload will update the browser automatically

**Backend changes:**
- Restart relevant Docker container:
  ```bash
  docker-compose restart qgis-server
  ```

**Database changes:**
- Edit `postgis/init/01-init.sh`
- Recreate database:
  ```bash
  docker-compose down -v
  docker-compose up -d postgis
  ```

## Areas Needing Contribution

### High Priority

- [ ] Unit tests for core components
- [ ] E2E tests with Playwright/Cypress
- [ ] Accessibility improvements (ARIA labels, keyboard navigation)
- [ ] Performance optimization for large datasets
- [ ] Mobile UI enhancements

### Features

- [ ] Additional measurement tools (bearing, coordinate display)
- [ ] More file format support (Shapefile, GeoPackage)
- [ ] Print templates
- [ ] Offline mode with service workers
- [ ] Plugin system for custom tools

### Documentation

- [ ] Video tutorials
- [ ] API documentation
- [ ] More examples and use cases
- [ ] Translations for additional languages

### Infrastructure

- [ ] GitHub Actions CI/CD pipeline
- [ ] Automated testing
- [ ] Docker image optimization
- [ ] Kubernetes deployment manifests

## Testing

Currently, the project is in early development and has limited test coverage. Contributions to testing are highly valued!

**Future test structure:**
```
frontend/
├── src/
│   └── __tests__/
│       ├── components/
│       ├── services/
│       └── utils/
└── e2e/
    └── tests/
```

## Documentation

When adding features or making changes:

1. Update relevant documentation files:
   - README.md - Overview and quick start
   - GUIDE.md - User-facing features
   - DEPLOY.md - Deployment procedures
   - ARCHITECTURE.md - Technical details

2. Add JSDoc comments to JavaScript functions

3. Update i18n files for new UI strings

## Internationalization (i18n)

When adding UI text:

1. Add keys to all language files:
   ```
   frontend/src/i18n/
   ├── en-US.json
   ├── de-CH.json
   ├── fr-FR.json
   └── it-IT.json
   ```

2. Use translation function in components:
   ```javascript
   const t = useTranslation();
   <button>{t('toolbar.save')}</button>
   ```

## Release Process

(Maintainers only)

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Create release tag: `git tag -a v0.2.0 -m "Release v0.2.0"`
4. Push tag: `git push origin v0.2.0`
5. Create GitHub release with release notes

## Questions?

- Open an issue for questions
- Start a discussion on GitHub Discussions
- Check existing documentation

## License

By contributing, you agree that your contributions will be licensed under the project's BSD 2-Clause License.

---

Thank you for contributing to Dufour.app! 🎉
