
#### Para generar SECRET_KEY
```bash
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

#### Para iniciar la API
```bash
uvicorn app.main:app --reload
```