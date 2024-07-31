from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

app = FastAPI()

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