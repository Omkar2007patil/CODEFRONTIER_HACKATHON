import sys
import os
import pytest
from fastapi.testclient import TestClient

# Ensure backend directory is in sys.path for all pytest tests
sys.path.insert(0, os.path.dirname(__file__))

from app.main import app

@pytest.fixture
def client():
    return TestClient(app)
