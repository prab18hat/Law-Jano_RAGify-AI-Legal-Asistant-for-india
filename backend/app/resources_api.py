from fastapi import APIRouter
from .resources_data import resources

router = APIRouter()

@router.get("/resources")
def get_resources():
    return resources
