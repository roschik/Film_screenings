from flask import Flask, render_template, request, jsonify
from flask_restx import Api, Resource, fields
from service.cinema_service import (
    get_all_screenings,
    get_screening_by_id,
    add_screening,
    update_screening,
    delete_screening,
    get_stats
)

app = Flask(__name__)
api = Api(app, doc='/swagger/', title='Cinema API', description='API управления киносеансами', version='1.0', prefix='/api')

# Модель данных для Swagger
movie_model = api.model('MovieScreening', {
    'id': fields.Integer(required=True),
    'title': fields.String(required=True),
    'genre': fields.String(required=True),
    'duration': fields.Integer(required=True),
    'price': fields.Float(required=True),
    'seats': fields.Integer(required=True),
    'date': fields.String(required=True)
})

# Веб-интерфейс
@app.route('/')
def home():
    return render_template('movies.html')

# API Endpoints
movies = api.namespace("",description='<h2>Операции с киносеансами</h2>')

@movies.route('/screening')
class ScreeningAPI(Resource):
    @movies.marshal_list_with(movie_model)
    @movies.doc(params={
        'sort': 'Поле для сортировки (title, genre, date, duration, price, seats)',
        'order': 'Порядок сортировки (asc/desc)'
    })
    def get(self):
        """Получить все сеансы с сортировкой"""
        return get_all_screenings(
            sort_field=request.args.get('sort', 'id'),
            sort_order=request.args.get('order', 'asc')
        )

    @movies.expect(movie_model)
    @movies.marshal_with(movie_model, code=201)
    def post(self):
        """Добавить новый сеанс"""
        return add_screening(api.payload), 201

@movies.route('/screening/<int:screening_id>')
class ScreeningAPI(Resource):
    @movies.marshal_with(movie_model)
    def get(self, screening_id):
        """Получить сеанс по ID"""
        screening = get_screening_by_id(screening_id)
        if not screening:
            api.abort(404, "Screening not found")
        return screening

    @movies.expect(movie_model)
    @movies.marshal_with(movie_model)
    def put(self, screening_id):
        """Обновить сеанс"""
        screening = update_screening(screening_id, request.json)
        if not screening:
            api.abort(404, "Screening not found")
        return screening

    @movies.response(204, 'Screening deleted')
    def delete(self, screening_id):
        """Удалить сеанс"""
        if not delete_screening(screening_id):
            api.abort(404, "Screening not found")
        return '', 204

@movies.route('/stats')
class StatsAPI(Resource):
    def get(self):
        """Получить статистику"""
        return get_stats()

if __name__ == '__main__':
    app.run(debug=True)