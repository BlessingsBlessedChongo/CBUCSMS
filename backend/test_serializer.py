import os
import django
from pathlib import Path

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import StockRequest
from api.serializers import StockRequestSerializer

requests = StockRequest.objects.all()
serializer = StockRequestSerializer(requests, many=True)
print("Serialization successful")
print(serializer.data)