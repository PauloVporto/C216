import logging
import time
from fastapi import Request

logger = logging.getLogger("uvicorn.error")

async def log_requests(request: Request, call_next):
    inicio = time.perf_counter()
    response = await call_next(request)
    logger.info("%s %s %s %.4fs", request.method, request.url.path, response.status_code, time.perf_counter() - inicio)
    return response
