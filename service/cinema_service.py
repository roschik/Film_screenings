from datetime import datetime, timezone

screenings = [
    {
        "id": 1,
        "title": "Герои анекдотов",
        "genre": "Комедия",
        "duration": 83,
        "price": 400,
        "seats": 120,
        "date": "2025-07-25 11:00"
    },
    {
        "id": 2,
        "title": "Шаман",
        "genre": "Ужасы",
        "duration": 100,
        "price": 300,
        "seats": 80,
        "date": "2025-07-25 20:30"
    },
    {
        "id": 3,
        "title": "Косолапый агент",
        "genre": "Мультфильм",
        "duration": 94,
        "price": 250,
        "seats": 200,
        "date": "2025-07-25 14:15"
    }
]


def get_all_screenings(sort_field='date', sort_order='asc'):
    """Получить все сеансы с сортировкой"""
    screenings_copy = screenings.copy()

    if sort_field == 'date':
        # Специальная обработка для сортировки по дате
        screenings_copy.sort(
            key=lambda x: datetime.fromisoformat(x['date']).timestamp(),
            reverse=(sort_order == 'desc')
        )
    else:
        # Стандартная сортировка для других полей
        screenings_copy.sort(
            key=lambda x: x[sort_field],
            reverse=(sort_order == 'desc')
        )

    return screenings_copy


def get_screening_by_id(screening_id):
    """Найти сеанс по ID"""
    screening = next((s for s in screenings if s['id'] == screening_id), None)
    if screening and 'date' in screening:
    # Конвертируем UTC в локальное время для отображения
        utc_date = datetime.fromisoformat(screening['date'])
        local_date = utc_date.astimezone()
        screening['date'] = local_date.isoformat()
    return screening


def add_screening(new_screening):
    """Добавить новый сеанс"""
    new_id = max([s['id'] for s in screenings], default=0) + 1
    if 'date' in new_screening:
        local_date = datetime.fromisoformat(new_screening['date'])
        utc_date = local_date.astimezone(timezone.utc)
        new_screening['date'] = utc_date.isoformat()

    screening = {**new_screening, "id": new_id}
    screenings.append(screening)
    return screening


def update_screening(screening_id, updated_data):
    """Обновить существующий сеанс"""
    screening = get_screening_by_id(screening_id)
    if screening:
        screening.update(updated_data)
    return screening


def delete_screening(screening_id):
    """Удалить сеанс"""
    global screenings
    screenings = [s for s in screenings if s['id'] != screening_id]
    return True


def get_stats():
    """Получить статистику по числовым полям"""
    numeric_fields = ['duration', 'price', 'seats']
    stats = {}

    for field in numeric_fields:
        values = [s[field] for s in screenings]
        stats[field] = {
            'min': min(values),
            'max': max(values),
            'avg': round(sum(values) / len(values), 2)
        }

    return stats