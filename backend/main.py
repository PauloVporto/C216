from fastapi import FastAPI

app = FastAPI(
    title="C216 Backend",
    version="0.1.0"
)


@app.get("/")
def root():
    return {"message": "Backend C216 funcionando"}


@app.get("/health")
def health():
    return {"status": "ok"}
