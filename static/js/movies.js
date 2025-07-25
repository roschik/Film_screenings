document.addEventListener('DOMContentLoaded', function() {
    loadScreenings();
    loadStats();
    refreshScreeningsTable();

    document.getElementById('addScreeningSubmit').addEventListener('click', handleAddScreening);
    document.getElementById('editScreeningSubmit').addEventListener('click', handleUpdateScreening);
    document.getElementById('addScreeningModal').addEventListener('hidden.bs.modal', function() {
        document.getElementById('addScreeningForm').reset();
    });
    document.getElementById('applyFilters').addEventListener('click', applyFilters);
});

async function applyFilters() {

    try {
        const applyBtn = document.getElementById('applyFilters');
        applyBtn.disabled = true;
        applyBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Загрузка...';

        const sortField = document.getElementById('sortField').value;
        const sortOrder = document.getElementById('sortOrder').value;

        await loadScreenings(sortField, sortOrder);

    } catch (error) {
        console.error('Ошибка сортировки:', error);
        showAlert('Не удалось применить сортировку', 'danger');
    } finally {
        const applyBtn = document.getElementById('applyFilters');
        if (applyBtn) {
            applyBtn.disabled = false;
            applyBtn.innerHTML = '<i class="bi bi-funnel-fill"></i> Применить';
        }
    }
}

async function loadScreenings(sortField = 'date', sortOrder = 'asc') {
    try {
        const url = `/api/screening?sort=${sortField}&order=${sortOrder}`;

        const response = await fetch(url);
        if (!response.ok) throw new Error('Ошибка загрузки данных');

        const screenings = await response.json();
        renderScreeningsTable(screenings);

    } catch (error) {
        console.error('Ошибка загрузки сеансов:', error);
        showAlert('Не удалось загрузить список сеансов', 'danger');
    }
}

async function loadStats() {
    try {
        const response = await fetch('/api/stats');
        const stats = await response.json();

        const statsRow = document.getElementById('statsRow');
        statsRow.innerHTML = '';

        for (const field in stats) {
            statsRow.innerHTML += `
                <div class="col-md-4">
                    <div class="card h-100 border-0 shadow-sm">
                        <div class="card-body">
                            <h3 class="h5">${getFieldName(field)}</h3>
                            <div class="d-flex justify-content-between">
                                <div>
                                    <small class="text-muted">Минимум</small>
                                    <div class="fs-4">${stats[field].min}</div>
                                </div>
                                <div>
                                    <small class="text-muted">Максимум</small>
                                    <div class="fs-4">${stats[field].max}</div>
                                </div>
                                <div>
                                    <small class="text-muted">Среднее</small>
                                    <div class="fs-4">${stats[field].avg}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        showAlert('Ошибка загрузки статистики: ' + error.message, 'danger');
    }
}

async function updateScreening(screeningId, updatedData) {
    try {
        const response = await fetch(`/api/screening/${screeningId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Ошибка при обновлении сеанса');
        }

        return await response.json();
    } catch (error) {
        console.error('Ошибка при обновлении сеанса:', error);
        throw error;
    }
}

async function deleteScreening(screeningId) {
    try {
        const response = await fetch(`/api/screening/${screeningId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Ошибка при удалении сеанса');
        }

        return true;
    } catch (error) {
        console.error('Ошибка при удалении сеанса:', error);
        throw error;
    }
}

async function handleAddScreening(event) {
    event.preventDefault();
    const form = document.getElementById('addScreeningForm');
    if (!form) return;
    console.log(form);
    const formData = new FormData(form);
    const submitBtn = document.getElementById('addScreeningSubmit');

    try {
        if (!formData.get('title')) {
            throw new Error('Укажите название фильма');
        }

        const data = {
            title: formData.get('title'),
            genre: formData.get('genre') || 'Не указан',
            duration: Math.abs(parseInt(formData.get('duration'))) || 90,
            price: Math.abs(parseFloat(formData.get('price'))) || 300,
            seats: Math.abs(parseInt(formData.get('seats'))) || 50,
            date: formData.get('date') || new Date().toISOString()
        };

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Добавление...';

        const response = await fetch('/api/screening', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Ошибка сервера');
        }

        const result = await response.json();
        console.log('Добавлен сеанс:', result);

        await refreshScreeningsTable();
        bootstrap.Modal.getInstance(form.closest('.modal')).hide();
        form.reset();
        await loadStats();
        showAlert('Сеанс успешно добавлен!', 'success');

    } catch (error) {
        console.error('Ошибка добавления:', error);
        showAlert(error.message, 'danger');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Добавить сеанс';
    }
}

async function handleUpdateScreening() {
    const form = document.getElementById('editScreeningForm');
    const screeningId = form.dataset.screeningId;
    const formData = new FormData(form);

    const updatedData = {
        title: formData.get('title'),
        genre: formData.get('genre'),
        duration: parseInt(formData.get('duration')),
        price: parseFloat(formData.get('price')),
        seats: parseInt(formData.get('seats')),
        date: formData.get('date')
    };

    try {
        const submitBtn = document.getElementById('editScreeningSubmit');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> Сохранение...';

        await updateScreening(screeningId, updatedData);

        await refreshScreeningsTable();
        await loadStats();
        bootstrap.Modal.getInstance(document.getElementById('editScreeningModal')).hide();

        showAlert('Сеанс успешно обновлен!', 'success');
    } catch (error) {
        showAlert(error.message, 'danger');
    } finally {
        const submitBtn = document.getElementById('editScreeningSubmit');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Сохранить изменения';
    }
}

async function handleDeleteScreening(screeningId) {
    if (!confirm('Вы уверены, что хотите удалить этот сеанс?'))
        return;

    try {
        const deleteBtn = document.querySelector(`button[data-screening-id="${screeningId}"]`);
        deleteBtn.disabled = true;
        deleteBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span>';

        await deleteScreening(screeningId);
        await refreshScreeningsTable();
        await loadStats();

        showAlert('Сеанс успешно удален!', 'success');
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

function getFieldName(field) {
    const names = {
        'duration': 'Длительность',
        'price': 'Цена',
        'seats': 'Места'
    };
    return names[field] || field;
}

async function refreshScreeningsTable() {
    try {
        const response = await fetch('/api/screening');
        const screenings = await response.json();
        renderScreeningsTable(screenings);
    } catch (error) {
        showAlert('Ошибка при обновлении таблицы: ' + error.message, 'danger');
    }
}

function renderScreeningsTable(screenings) {
    const tableBody = document.getElementById('screeningsTableBody');
    tableBody.innerHTML = '';

    screenings.forEach(screening => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${screening.title}</td>
            <td>${screening.genre}</td>
            <td>${screening.duration} мин</td>
            <td>${screening.price.toFixed(2)} ₽</td>
            <td>${screening.seats}</td>
            <td>${formatDateTime(screening.date)}</td>
            <td class="text-nowrap">
                <button class="btn btn-sm btn-outline-primary me-2 edit-btn"
                        data-screening-id="${screening.id}">
                    <i class="bi bi-pencil"></i> Редактировать
                </button>
                <button class="btn btn-sm btn-outline-danger delete-btn"
                        data-screening-id="${screening.id}">
                    <i class="bi bi-trash"></i> Удалить
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => loadScreeningForEdit(btn.dataset.screeningId));
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => handleDeleteScreening(btn.dataset.screeningId));
    });
}

async function loadScreeningForEdit(screeningId) {
    try {
        const response = await fetch(`/api/screening/${screeningId}`);
        const screening = await response.json();

        const form = document.getElementById('editScreeningForm');
        form.dataset.screeningId = screening.id;
        form.elements['title'].value = screening.title;
        form.elements['genre'].value = screening.genre;
        form.elements['duration'].value = screening.duration;
        form.elements['price'].value = screening.price;
        form.elements['seats'].value = screening.seats;

        if (screening.date) {
            const date = new Date(screening.date);
            const timezoneOffset = date.getTimezoneOffset() * 60000; // в миллисекундах
            const localDate = new Date(date.getTime() - timezoneOffset);
            form.elements['date'].value = localDate.toISOString().slice(0, 16);
        }

        new bootstrap.Modal(document.getElementById('editScreeningModal')).show();
    } catch (error) {
        showAlert('Ошибка загрузки данных сеанса: ' + error.message, 'danger');
    }
}

function formatDateTime(dateString) {
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('ru-RU', options);
}

function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show mt-3`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    const container = document.querySelector('.container');
    container.prepend(alertDiv);

    setTimeout(() => alertDiv.remove(), 5000);
}