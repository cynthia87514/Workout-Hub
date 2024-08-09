from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dbconfig import engine, Base
from router.exercise import ExerciseRouter
from router.user import Userrouter

# 創建所有 table，先執行檢查
Base.metadata.create_all(bind=engine, checkfirst=True)

app = FastAPI(debug=True)

app.mount("/static", StaticFiles(directory="static", html=True))

@app.get("/introduction")
async def index():
    return FileResponse("./static/html/introduction.html", media_type="text/html")

@app.get("/")
async def index():
    return FileResponse("./static/html/homepage.html", media_type="text/html")

@app.get("/records")
async def index():
    return FileResponse("./static/html/records.html", media_type="text/html")

@app.get("/profile")
async def index():
    return FileResponse("./static/html/profile.html", media_type="text/html")

@app.get("/diet")
async def index():
    return FileResponse("./static/html/diet.html", media_type="text/html")

app.include_router(ExerciseRouter)
app.include_router(Userrouter)