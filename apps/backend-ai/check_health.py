
import requests
try:
    response = requests.get("http://localhost:8000/")
    print(response.json())
except Exception as e:
    print(e)
