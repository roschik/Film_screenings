import unittest
from app import app
from service.cinema_service  import screenings


class TestAPI(unittest.TestCase):
    def setUp(self):
        app.config['TESTING'] = True
        self.client = app.test_client()
        screenings.clear()  # Очищаем базу перед тестами

    def test_get_screenings(self):
        # Тест получения списка сеансов
        response = self.client.get('/api/screening')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json, [])

    def test_create_screening(self):
        # Тест создания сеанса
        test_data = {
            "title": "Тестовый",
            "genre": "Тест",
            "duration": 100,
            "price": 200.0,
            "seats": 30,
            "date": "2023-12-20T18:00:00"
        }

        response = self.client.post(
            '/api/screening',
            json=test_data,
            headers={'Content-Type': 'application/json'}
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json['title'], "Тестовый")

    def test_sorting(self):
        # Тест сортировки через API
        test_data = [
            {"title": "A", "date": "2025-07-31T18:00:00", "duration": 90},
            {"title": "B", "date": "2025-07-31T12:00:00", "duration": 120}
        ]

        for data in test_data:
            self.client.post('/api/screening', json=data)

        # Сортировка по дате (по возрастанию)
        response = self.client.get('/api/screening?sort=date&order=asc')
        self.assertEqual(response.json[0]['title'], "B")

        # Сортировка по длительности (по убыванию)
        response = self.client.get('/api/screening?sort=duration&order=desc')
        self.assertEqual(response.json[0]['title'], "B")