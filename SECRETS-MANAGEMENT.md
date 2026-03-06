# Gestione Secrets - GitHub e Render.com

## 🔐 Panoramica

I **secrets** (password, API keys, tokens) **non devono mai** essere committati in GitHub. Questa guida spiega come gestirli correttamente.

## ❌ Cosa NON Fare

```bash
# ❌ MAI committare questi file:
.env
.env.local
.env.production
config/secrets.json
credentials.txt
database_password.txt
```

## ✅ Best Practices

### 1. Usa .gitignore

Il repository ha già un `.gitignore` che esclude file sensibili:

```gitignore
# Environment variables
.env
.env.local
.env.*.local
*.env

# Secrets
secrets/
credentials/
*.pem
*.key
*.cert

# Database
*.sql
*.db
*.sqlite
```

**Verifica sempre prima di committare**:
```bash
# Controlla cosa stai per committare
git status
git diff

# Se vedi file sensibili, aggiungili a .gitignore
echo ".env" >> .gitignore
git add .gitignore
```

### 2. Usa File Template

Invece di committare `.env` con secrets reali, usa `.env.example`:

**File: `backend/api/.env.example`** (già nel repository):
```bash
# Database
POSTGIS_HOST=postgis
POSTGIS_PORT=5432
POSTGIS_DB=gisdb
POSTGIS_USER=gisuser
POSTGIS_PASSWORD=change_me_in_production

# QGIS Server
QGIS_SERVER_URL=http://qgis-server:80

# Paths
PROJECTS_DIR=/data/projects
QWC_CONFIG_DIR=/qwc-config
```

**File locale `.env`** (non committato):
```bash
# Database
POSTGIS_HOST=localhost
POSTGIS_PORT=5432
POSTGIS_DB=gisdb
POSTGIS_USER=gisuser
POSTGIS_PASSWORD=my_secret_password_123

# QGIS Server
QGIS_SERVER_URL=http://localhost:8080
```

### 3. Setup Locale Sicuro

```bash
# 1. Copia template
cd backend/api
cp .env.example .env

# 2. Modifica .env con i tuoi secrets
notepad .env  # o vim, nano, ecc.

# 3. Verifica che .env NON sia tracciato da git
git status  # Non deve apparire .env

# 4. Se appare, aggiungilo subito a .gitignore
echo "backend/api/.env" >> .gitignore
```

## 🔒 Gestione Secrets in GitHub

### GitHub Actions Secrets

Se usi CI/CD con GitHub Actions:

1. **Vai a**: Repository → Settings → Secrets and variables → Actions
2. **Aggiungi secrets**:
   - `RENDER_API_KEY` - Per deploy automatico
   - `DATABASE_URL` - Per test integration (opzionale)
   - `DOCKER_USERNAME` / `DOCKER_PASSWORD` - Per registry (opzionale)

3. **Usa nei workflows**:
```yaml
# .github/workflows/deploy.yml
jobs:
  deploy:
    steps:
      - name: Deploy to Render
        env:
          RENDER_API_KEY: ${{ secrets.RENDER_API_KEY }}
        run: |
          curl -X POST "https://api.render.com/deploy/..."
```

### GitHub Dependabot Secrets

Per vulnerabilità nelle dipendenze:

1. **Vai a**: Settings → Security → Dependabot
2. **Abilita**: Dependabot alerts e security updates
3. **Configura**: `.github/dependabot.yml`

## 🌐 Gestione Secrets in Render.com

### Metodo 1: Environment Variables (Consigliato)

**Per ogni servizio su Render**:

1. **Dashboard → Seleziona servizio** (es. `dufour-api`)
2. **Environment** (tab a sinistra)
3. **Add Environment Variable**:

#### Backend API Secrets
```
Key: POSTGIS_PASSWORD
Value: [genera password sicura]
☑ Secret (hidden in logs)

Key: JWT_SECRET_KEY
Value: [genera con: openssl rand -hex 32]
☑ Secret

Key: API_KEY
Value: [tua API key]
☑ Secret
```

#### Come generare secrets sicuri

```powershell
# PowerShell - Password casuale
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})

# Output esempio: aB3xK9mP2nQ7rY4sU8vW1zC6dE0fG5hJ
```

O usa un password manager:
- **1Password**: Generate → 32 characters
- **Bitwarden**: Tools → Password Generator
- **LastPass**: Generate Secure Password

### Metodo 2: Database Secrets (Automatico)

Quando crei un PostgreSQL su Render, i secrets sono **auto-generati**:

```
✅ Render genera automaticamente:
- POSTGRES_PASSWORD (strong random password)
- Internal DATABASE_URL
- External DATABASE_URL
```

**Link al backend**:

1. **Dashboard → Backend service** (`dufour-api`)
2. **Environment → Add from Database**
3. **Seleziona database**: `dufour-postgis`
4. **Render auto-crea**:
   - `POSTGIS_HOST` → from database.host
   - `POSTGIS_PORT` → from database.port
   - `POSTGIS_DB` → from database.database
   - `POSTGIS_USER` → from database.user
   - `POSTGIS_PASSWORD` → from database.password (**secret**)

### Metodo 3: Secret Files (per certificati)

Per file interi (`.pem`, `.key`, certificati SSL):

1. **Upload come Environment Variable**:
```bash
# Converti file in base64
base64 -w 0 certificate.pem > certificate.txt

# In Render:
Key: SSL_CERTIFICATE_BASE64
Value: [incolla contenuto certificate.txt]
☑ Secret
```

2. **Nel container, decodifica**:
```python
# backend/api/main.py
import os
import base64

cert_b64 = os.getenv("SSL_CERTIFICATE_BASE64")
if cert_b64:
    cert_content = base64.b64decode(cert_b64)
    with open("/tmp/certificate.pem", "wb") as f:
        f.write(cert_content)
```

### Metodo 4: Render Secrets Manager (Beta)

Render ha un Secrets Manager integrato:

1. **Dashboard → Account → Secrets**
2. **Create Secret Group**
3. **Link to services**

## 🔄 Rotation Secrets (Cambio Periodico)

### Database Password Rotation

```bash
# 1. Genera nuova password
$newPassword = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})

# 2. Connetti a database
psql $DATABASE_URL

# 3. Cambia password
ALTER USER gisuser WITH PASSWORD 'new_password_here';
\q

# 4. Aggiorna Render Environment Variable
# Dashboard → dufour-api → Environment → POSTGIS_PASSWORD
# Edit → new_password_here → Save

# 5. Redeploy service
# Dashboard → dufour-api → Manual Deploy → Deploy latest commit
```

### API Keys Rotation

Per API keys esterne (geo.admin.ch, ecc.):

```bash
# 1. Genera nuova key dal provider
# 2. Aggiungi come nuova env var (con _NEW suffix)
GEO_ADMIN_API_KEY_NEW=new_key_here

# 3. Modifica codice per tentare entrambe
# 4. Test con nuova key
# 5. Rimuovi vecchia key
# 6. Rinomina _NEW → normale
```

## 🛡️ Security Checklist

### Prima del Deploy

- [ ] Verifica `.gitignore` include `.env`
- [ ] Nessun file con password in git history
- [ ] `.env.example` ha valori placeholder (non reali)
- [ ] Secrets generati con tool sicuri (non "password123")
- [ ] Database password > 20 caratteri random
- [ ] API keys salvate in password manager

### Su Render.com

- [ ] Tutti i secrets marcati come "Secret" ☑
- [ ] Database password auto-generata (non custom)
- [ ] SSL/TLS abilitato (automatico su Render)
- [ ] Environment variables non in logs pubblici
- [ ] Secrets non in error messages

### Audit Periodico

```bash
# Ogni 3-6 mesi:
# 1. Ruota database passwords
# 2. Rigenera API keys
# 3. Controlla access logs
# 4. Verifica permessi database
# 5. Update dipendenze con vulnerabilità
```

## 🚨 Emergenza: Secret Compromesso

### Se un secret finisce su GitHub:

```bash
# 1. IMMEDIATO: Invalida il secret compromesso
# - Cambia database password
# - Revoca API key
# - Rigenera JWT secret

# 2. Rimuovi da Git History (ATTENTO!)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch path/to/secret/file" \
  --prune-empty --tag-name-filter cat -- --all

# 3. Force push (PERICOLOSO - coordina con team)
git push origin --force --all
git push origin --force --tags

# 4. Notifica il team
# 5. Controlla access logs per accessi non autorizzati
```

### Alternative più sicura (BFG Repo-Cleaner):

```bash
# Download BFG
# https://rtyley.github.io/bfg-repo-cleaner/

# Rimuovi file con secrets
java -jar bfg.jar --delete-files .env

# Cleanup
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Push
git push origin --force --all
```

## 📋 Template Secrets per Dufour-app

### Development (.env locale)

```bash
# backend/api/.env (NON committare)
POSTGIS_HOST=localhost
POSTGIS_PORT=5432
POSTGIS_DB=gisdb
POSTGIS_USER=gisuser
POSTGIS_PASSWORD=dev_password_local_123

QGIS_SERVER_URL=http://localhost:8080
PROJECTS_DIR=/data/projects
QWC_CONFIG_DIR=/qwc-config

# Optional
JWT_SECRET_KEY=dev_jwt_secret_change_in_prod
API_KEY=dev_api_key
```

### Render.com (Environment Variables)

**Database (auto-generated by Render)**:
```
POSTGRES_PASSWORD=auto_generated_strong_password
```

**Backend API**:
```
POSTGIS_HOST=dpg-xxxxx.frankfurt-postgres.render.com
POSTGIS_PORT=5432
POSTGIS_DB=gisdb
POSTGIS_USER=gisuser
POSTGIS_PASSWORD=[from database link] ☑ Secret

QGIS_SERVER_URL=https://dufour-qgis.onrender.com
PROJECTS_DIR=/data/projects
QWC_CONFIG_DIR=/qwc-config

JWT_SECRET_KEY=[openssl rand -hex 32] ☑ Secret
ADMIN_API_KEY=[genera casuale 32 char] ☑ Secret
```

**Frontend**:
```
NODE_ENV=production
VITE_API_URL=https://dufour-api.onrender.com
VITE_QGIS_SERVER_URL=https://dufour-qgis.onrender.com
```

## 🔗 Risorse

### Tools per Secrets
- **Password Generator**: https://passwordsgenerator.net
- **OpenSSL**: Per chiavi crittografiche
- **1Password / Bitwarden**: Password managers
- **Git-secrets**: Previene commit accidentali di secrets
  - https://github.com/awslabs/git-secrets

### Security Scanning
- **TruffleHog**: Cerca secrets in git history
  - https://github.com/trufflesecurity/trufflehog
- **GitGuardian**: Scan automatico repository
  - https://www.gitguardian.com
- **GitHub Secret Scanning**: Built-in GitHub
  - https://docs.github.com/code-security/secret-scanning

### Best Practices
- **OWASP Secrets Management**: https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html
- **Render Docs**: https://render.com/docs/environment-variables
- **12-Factor App**: https://12factor.net/config

## 💡 Pro Tips

1. **Mai hardcodare secrets nel codice**:
   ```python
   # ❌ NO
   password = "mypassword123"
   
   # ✅ SI
   password = os.getenv("POSTGIS_PASSWORD")
   ```

2. **Valida presenza secrets all'avvio**:
   ```python
   # backend/api/main.py
   required_secrets = [
       "POSTGIS_PASSWORD",
       "JWT_SECRET_KEY"
   ]
   
   for secret in required_secrets:
       if not os.getenv(secret):
           raise ValueError(f"Missing required secret: {secret}")
   ```

3. **Log sanitization**:
   ```python
   # Non loggare secrets
   logger.info(f"Connecting to {host}")  # ✅
   logger.info(f"Password: {password}")  # ❌
   ```

4. **Secrets in error messages**:
   ```python
   try:
       conn = psycopg2.connect(password=pwd)
   except Exception as e:
       # ❌ NO: logger.error(f"Connection failed: {e}")
       # ✅ SI:
       logger.error("Database connection failed")
   ```

---

**Ricorda**: Un secret compromesso può portare a:
- Accesso non autorizzato al database
- Costi imprevisti (API abuse)
- Data breach
- Reputazione danneggiata

**Meglio essere paranoici che hackerati!** 🔐
