from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from typing import Dict
import time

class RateLimiter:
    def __init__(self, max_requests: int = 100, time_window: int = 60):
        """
        Initialize rate limiter
        :param max_requests: Maximum number of requests allowed
        :param time_window: Time window in seconds
        """
        self.request_counts: Dict[str, Dict[str, int]] = {}
        self.max_requests = max_requests
        self.time_window = time_window
    
    async def __call__(self, request: Request, call_next):
        """
        Rate limiting middleware
        :param request: Incoming request
        :param call_next: Next middleware or route handler
        :return: Response or rate limit error
        """
        client_ip = request.client.host
        current_time = time.time()
        
        # Clean up old request records
        self.request_counts[client_ip] = {
            k: v for k, v in self.request_counts.get(client_ip, {}).items()
            if current_time - k <= self.time_window
        }
        
        # Count requests in current time window
        request_count = len(self.request_counts.get(client_ip, {}))
        
        if request_count >= self.max_requests:
            return JSONResponse(
                status_code=429,
                content={
                    "error": "Too Many Requests",
                    "message": f"Limit of {self.max_requests} requests per {self.time_window} seconds exceeded"
                }
            )
        
        # Add current request
        if client_ip not in self.request_counts:
            self.request_counts[client_ip] = {}
        self.request_counts[client_ip][current_time] = 1
        
        response = await call_next(request)
        return response
