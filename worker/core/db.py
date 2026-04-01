from pymongo import MongoClient
from core.config import MONGO_URI

client = MongoClient(MONGO_URI)
db = client["codeReview"]

submissions_collection = db["submissions"]