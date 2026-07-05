# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.api.v1 import auth, users, projects, scenarios, runner

settings = get_settings()

app = FastAPI(
    title="QA Platform API",
    description="Kurumsal Web Uygulamaları için Test Otomasyon Sistemi",
    version="1.0.0"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "chrome-extension://*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Kullanıcılar"])
app.include_router(projects.router, prefix="/api/v1/projects", tags=["Projeler"])
app.include_router(scenarios.router, prefix="/api/v1/scenarios", tags=["Senaryolar"])
app.include_router(runner.router, prefix="/api/v1/runner", tags=["Test Runner"])

@app.get("/")
def root():
    return {"mesaj": "QA Platform API çalışıyor", "versiyon": "1.0.0"}

@app.get("/health")
def health_check():
    return {"durum": "sağlıklı"}