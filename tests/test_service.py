import unittest
from datetime import datetime, timedelta
from service.cinema_service import (
    get_all_screenings,
    add_screening,
    get_screening_by_id,
    update_screening,
    delete_screening,
    screenings
)

class TestDatabase(unittest.TestCase):
    def setUp(self):
        # Сброс базы данных перед каждым тестом
        screenings.clear()
        self.test_data = {
            "title": "Тестовый фильм",
            "genre": "Тест",
            "duration": 120,
            "price": 300.0,
            "seats": 50,
            "date": (datetime.now() + timedelta(days=1)).isoformat()
        }

    def test_add_and_get_screening(self):
        # Добавление и получение сеанса
        new_screening = add_screening(self.test_data)
        self.assertIn(new_screening, screenings)

        screening = get_screening_by_id(new_screening['id'])
        self.assertEqual(screening['title'], "Тестовый фильм")

    def test_sort_by_date(self):
        # Тест сортировки по дате
        dates = [
            (datetime.now() + timedelta(days=i)).isoformat()
            for i in [3, 1, 2]
        ]

        for i, date in enumerate(dates):
            add_screening({**self.test_data, "date": date, "title": f"Фильм {i + 1}"})

        # Сортировка по возрастанию
        sorted_asc = get_all_screenings('date', 'asc')
        self.assertEqual(sorted_asc[0]['title'], "Фильм 2")
        self.assertEqual(sorted_asc[1]['title'], "Фильм 3")
        self.assertEqual(sorted_asc[2]['title'], "Фильм 1")

        # Сортировка по убыванию
        sorted_desc = get_all_screenings('date', 'desc')
        self.assertEqual(sorted_desc[0]['title'], "Фильм 1")

    def test_update_screening(self):
        new_screening = add_screening(self.test_data)
        updated = update_screening(new_screening['id'], {"title": "Обновленный"})
        self.assertEqual(updated['title'], "Обновленный")
        self.assertEqual(get_screening_by_id(new_screening['id'])['title'], "Обновленный")

    def test_delete_screening(self):
        new_screening = add_screening(self.test_data)
        delete_screening(new_screening['id'])
        self.assertIsNone(get_screening_by_id(new_screening['id']))