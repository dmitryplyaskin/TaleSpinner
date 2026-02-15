req:
node 18^

intall:
```
git clone https://github.com/dmitryplyaskin/TaleSpinner
cd TaleSpinner
npm install
cd frontend && npm install
```

run:
```
cd TaleSpinner 
npm run start
npm run start:frontend
```

backend env and data migration:
```
# create root backend env from template
Copy-Item .\env.example .\.env

# optional one-time copy: server/data -> data
powershell -ExecutionPolicy Bypass -File .\scripts\copy-server-data-to-root.ps1
```
