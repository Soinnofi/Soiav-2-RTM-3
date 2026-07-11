#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Soiav 2 Online Store Server
Сервер для онлайн-магазина приложений
Запуск: python server.py
"""

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import json
import os
import uuid
from datetime import datetime
from threading import Thread
import time

app = Flask(__name__)
CORS(app)

# ================== ДАННЫЕ ==================

# База данных приложений
APPS_DB = {
    "apps": [
        {
            "id": "music_player",
            "name": "Soiav Music Player",
            "version": "3.2.0",
            "category": "multimedia",
            "price": 0,
            "is_free": True,
            "rating": 4.8,
            "downloads": 15420,
            "size": "15.4 MB",
            "developer": "Soiav Studios",
            "description": "Мощный аудиоплеер с эквалайзером и поддержкой всех форматов",
            "short_desc": "Музыкальный плеер премиум-класса",
            "icon": "fa-headphones",
            "screenshots": [],
            "release_date": "2026-01-15",
            "requirements": "Soiav 2 build 5500+",
            "languages": ["ru", "en"],
            "features": ["Эквалайзер", "Плейлисты", "Подкасты", "Радио"]
        },
        {
            "id": "video_editor",
            "name": "Soiav Video Editor",
            "version": "2.1.0",
            "category": "creative",
            "price": 499,
            "is_free": False,
            "rating": 4.9,
            "downloads": 8920,
            "size": "128 MB",
            "developer": "Soiav Studios",
            "description": "Профессиональный видеоредактор с поддержкой 4K",
            "short_desc": "Редактируйте видео как профессионал",
            "icon": "fa-video",
            "screenshots": [],
            "release_date": "2026-02-01",
            "requirements": "Soiav 2 Pro build 5800+",
            "languages": ["ru", "en", "de", "fr"],
            "features": ["Монтаж", "Эффекты", "Переходы", "Титры"]
        },
        {
            "id": "photo_editor",
            "name": "Soiav Photo Editor",
            "version": "4.0.0",
            "category": "creative",
            "price": 299,
            "is_free": False,
            "rating": 4.7,
            "downloads": 21340,
            "size": "45.2 MB",
            "developer": "Soiav Studios",
            "description": "Редактор фотографий с AI-функциями",
            "short_desc": "Обработка фото на новом уровне",
            "icon": "fa-camera",
            "screenshots": [],
            "release_date": "2026-02-10",
            "requirements": "Soiav 2 build 5600+",
            "languages": ["ru", "en"],
            "features": ["Фильтры", "AI улучшение", "Ретушь", "Коллажи"]
        },
        {
            "id": "office_suite",
            "name": "Soiav Office",
            "version": "2026.1",
            "category": "productivity",
            "price": 1299,
            "is_free": False,
            "rating": 4.8,
            "downloads": 45200,
            "size": "256 MB",
            "developer": "Soiav Systems",
            "description": "Полный офисный пакет для работы с документами",
            "short_desc": "Документы, таблицы, презентации",
            "icon": "fa-file-alt",
            "screenshots": [],
            "release_date": "2026-01-01",
            "requirements": "Soiav 2 build 5200+",
            "languages": ["ru", "en", "es", "zh", "ar"],
            "features": ["Текстовый редактор", "Таблицы", "Презентации", "PDF"]
        },
        {
            "id": "vpn_secure",
            "name": "Soiav VPN Secure",
            "version": "1.5.0",
            "category": "security",
            "price": 349,
            "is_free": False,
            "rating": 4.6,
            "downloads": 18930,
            "size": "12.3 MB",
            "developer": "Security Labs",
            "description": "Безопасное соединение с шифрованием",
            "short_desc": "Ваша приватность под защитой",
            "icon": "fa-shield-alt",
            "screenshots": [],
            "release_date": "2026-01-20",
            "requirements": "Soiav 2 build 5400+",
            "languages": ["ru", "en", "de"],
            "features": ["Блокировка рекламы", "Анти-трекинг", "Kill Switch"]
        },
        {
            "id": "disk_cleaner",
            "name": "Soiav Cleaner Pro",
            "version": "3.0.0",
            "category": "utilities",
            "price": 199,
            "is_free": False,
            "rating": 4.5,
            "downloads": 67200,
            "size": "8.7 MB",
            "developer": "SysTools",
            "description": "Очистка системы от мусора и оптимизация",
            "short_desc": "Освободите место на диске",
            "icon": "fa-broom",
            "screenshots": [],
            "release_date": "2026-02-05",
            "requirements": "Soiav 2 build 5000+",
            "languages": ["ru", "en"],
            "features": ["Очистка кэша", "Удаление дубликатов", "Реестр"]
        }
    ],
    "games": [
        {
            "id": "cyber_racer",
            "name": "Cyber Racer 2077",
            "version": "1.2.0",
            "category": "racing",
            "price": 799,
            "is_free": False,
            "rating": 4.9,
            "downloads": 12340,
            "size": "1.2 GB",
            "developer": "Neon Games",
            "description": "Киберпанк-гонки на безумных скоростях",
            "short_desc": "Гоночный экшен в кибер-мире",
            "icon": "fa-car",
            "screenshots": [],
            "release_date": "2026-01-25",
            "requirements": "Soiav 2 Pro build 5900+",
            "languages": ["ru", "en", "jp"],
            "features": ["Мультиплеер", "Тюнинг", "Открытый мир"]
        },
        {
            "id": "space_shooter",
            "name": "Galaxy Shooter",
            "version": "0.9.5",
            "category": "action",
            "price": 0,
            "is_free": True,
            "rating": 4.7,
            "downloads": 34200,
            "size": "245 MB",
            "developer": "Space Labs",
            "description": "Космический шутер с захватывающим сюжетом",
            "short_desc": "Защитите галактику от захватчиков",
            "icon": "fa-rocket",
            "screenshots": [],
            "release_date": "2026-02-14",
            "requirements": "Soiav 2 build 5600+",
            "languages": ["ru", "en"],
            "features": ["3 уровня", "Боссы", "Улучшения корабля"]
        },
        {
            "id": "puzzle_master",
            "name": "Puzzle Master",
            "version": "2.0.0",
            "category": "puzzle",
            "price": 149,
            "is_free": False,
            "rating": 4.8,
            "downloads": 28700,
            "size": "56 MB",
            "developer": "Brain Games",
            "description": "Тысячи головоломок для развития мозга",
            "short_desc": "Тренируйте свой ум",
            "icon": "fa-puzzle-piece",
            "screenshots": [],
            "release_date": "2026-01-10",
            "requirements": "Soiav 2 build 5200+",
            "languages": ["ru", "en", "es", "fr", "de"],
            "features": ["500+ уровней", "Ежедневные задания", "Таблица лидеров"]
        }
    ],
    "ssap": [
        {
            "id": "weather_widget",
            "name": "Weather Widget SSAP",
            "version": "1.0.0",
            "category": "widget",
            "price": 0,
            "is_free": True,
            "rating": 4.5,
            "downloads": 890,
            "size": "15 KB",
            "developer": "Community",
            "description": "Виджет погоды для рабочего стола",
            "short_desc": "Всегда знайте погоду",
            "icon": "fa-cloud-sun",
            "code": "APP: WeatherWidget\nVERSION: 1.0\nTYPE: WIDGET\n\nFUNCTION main()\n  CREATE widget 300x200\n  SET location \"auto\"\n  FETCH weather data\n  DISPLAY temperature & condition\nEND",
            "release_date": "2026-02-18"
        }
    ]
}

# Пользователи и покупки
users = {}
purchases = {}

# Статистика загрузок
download_stats = {}

# ================== API ЭНДПОИНТЫ ==================

@app.route('/api/store/apps', methods=['GET'])
def get_apps():
    """Получить все приложения"""
    category = request.args.get('category', 'all')
    search = request.args.get('search', '')
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    
    all_items = []
    for cat in ['apps', 'games', 'ssap']:
        for item in APPS_DB.get(cat, []):
            item['type'] = cat
            all_items.append(item)
    
    if category != 'all':
        if category == 'apps':
            all_items = APPS_DB['apps'] + APPS_DB['ssap']
            for item in all_items:
                item['type'] = 'apps' if item in APPS_DB['apps'] else 'ssap'
        elif category == 'games':
            all_items = APPS_DB['games']
            for item in all_items:
                item['type'] = 'games'
        else:
            all_items = [item for item in all_items if item.get('category') == category]
    
    if search:
        search_lower = search.lower()
        all_items = [item for item in all_items if 
                    search_lower in item['name'].lower() or 
                    search_lower in item.get('short_desc', '').lower()]
    
    total = len(all_items)
    start = (page - 1) * per_page
    end = start + per_page
    
    return jsonify({
        'success': True,
        'items': all_items[start:end],
        'total': total,
        'page': page,
        'per_page': per_page,
        'total_pages': (total + per_page - 1) // per_page
    })

@app.route('/api/store/app/<app_id>', methods=['GET'])
def get_app(app_id):
    """Получить информацию о приложении"""
    for cat in ['apps', 'games', 'ssap']:
        for item in APPS_DB.get(cat, []):
            if item['id'] == app_id:
                item['type'] = cat
                return jsonify({'success': True, 'app': item})
    return jsonify({'success': False, 'error': 'App not found'}), 404

@app.route('/api/store/download', methods=['POST'])
def download_app():
    """Скачать приложение"""
    data = request.json
    app_id = data.get('app_id')
    user_id = data.get('user_id', 'anonymous')
    
    # Поиск приложения
    app = None
    for cat in ['apps', 'games', 'ssap']:
        for item in APPS_DB.get(cat, []):
            if item['id'] == app_id:
                app = item
                break
        if app:
            break
    
    if not app:
        return jsonify({'success': False, 'error': 'App not found'}), 404
    
    # Увеличиваем счетчик загрузок
    app['downloads'] = app.get('downloads', 0) + 1
    
    # Логируем загрузку
    if app_id not in download_stats:
        download_stats[app_id] = []
    download_stats[app_id].append({
        'user': user_id,
        'timestamp': datetime.now().isoformat(),
        'version': app.get('version')
    })
    
    # Сохраняем покупку если платное
    if not app.get('is_free', True) and user_id != 'anonymous':
        if user_id not in purchases:
            purchases[user_id] = []
        if app_id not in purchases[user_id]:
            purchases[user_id].append(app_id)
    
    return jsonify({
        'success': True,
        'message': f'Download started for {app["name"]}',
        'download_url': f'/api/store/downloads/{app_id}.app',
        'size': app['size']
    })

@app.route('/api/store/featured', methods=['GET'])
def get_featured():
    """Получить рекомендуемые приложения"""
    featured = []
    
    # Топ по загрузкам
    sorted_by_downloads = []
    for cat in ['apps', 'games', 'ssap']:
        for item in APPS_DB.get(cat, []):
            sorted_by_downloads.append((item.get('downloads', 0), item))
    
    sorted_by_downloads.sort(reverse=True, key=lambda x: x[0])
    featured = [item for _, item in sorted_by_downloads[:6]]
    
    return jsonify({'success': True, 'featured': featured})

@app.route('/api/store/categories', methods=['GET'])
def get_categories():
    """Получить категории"""
    categories = {
        'all': 'Все',
        'apps': 'Приложения',
        'games': 'Игры',
        'multimedia': 'Мультимедиа',
        'creative': 'Творчество',
        'productivity': 'Продуктивность',
        'security': 'Безопасность',
        'utilities': 'Утилиты',
        'racing': 'Гонки',
        'action': 'Экшн',
        'puzzle': 'Головоломки',
        'widget': 'Виджеты'
    }
    return jsonify({'success': True, 'categories': categories})

@app.route('/api/store/stats', methods=['GET'])
def get_stats():
    """Получить статистику магазина"""
    total_apps = sum(len(APPS_DB.get(cat, [])) for cat in ['apps', 'games', 'ssap'])
    total_downloads = sum(item.get('downloads', 0) for cat in ['apps', 'games', 'ssap'] for item in APPS_DB.get(cat, []))
    
    return jsonify({
        'success': True,
        'stats': {
            'total_apps': total_apps,
            'total_downloads': total_downloads,
            'free_apps': len([item for cat in ['apps', 'games', 'ssap'] for item in APPS_DB.get(cat, []) if item.get('is_free', True)]),
            'paid_apps': len([item for cat in ['apps', 'games', 'ssap'] for item in APPS_DB.get(cat, []) if not item.get('is_free', True)])
        }
    })

@app.route('/api/store/purchased', methods=['POST'])
def get_purchased():
    """Получить купленные приложения пользователя"""
    data = request.json
    user_id = data.get('user_id')
    
    if not user_id or user_id not in purchases:
        return jsonify({'success': True, 'purchased': []})
    
    purchased_ids = purchases[user_id]
    purchased_apps = []
    
    for cat in ['apps', 'games', 'ssap']:
        for item in APPS_DB.get(cat, []):
            if item['id'] in purchased_ids:
                purchased_apps.append(item)
    
    return jsonify({'success': True, 'purchased': purchased_apps})

# ================== ВЕБ-ИНТЕРФЕЙС ДЛЯ АДМИНА ==================

@app.route('/admin', methods=['GET'])
def admin_panel():
    """Админ-панель"""
    return '''
    <!DOCTYPE html>
    <html>
    <head>
        <title>Soiav Store Admin</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; background: #1a1a1a; color: #fff; }
            .container { max-width: 1200px; margin: 0 auto; }
            .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
            .stat-card { background: #2d2d2d; padding: 20px; border-radius: 12px; text-align: center; }
            .stat-number { font-size: 32px; font-weight: bold; color: #0078d7; }
            .app-list { background: #2d2d2d; border-radius: 12px; padding: 20px; }
            .app-item { display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #444; }
            .app-name { font-weight: bold; }
            .app-downloads { color: #4caf50; }
            h1 { color: #0078d7; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Soiav Store Admin Panel</h1>
            <div class="stats" id="stats"></div>
            <div class="app-list">
                <h2>Приложения</h2>
                <div id="appsList"></div>
            </div>
        </div>
        <script>
            fetch('/api/store/stats')
                .then(r => r.json())
                .then(data => {
                    const stats = data.stats;
                    document.getElementById('stats').innerHTML = `
                        <div class="stat-card"><div class="stat-number">${stats.total_apps}</div><div>Приложений</div></div>
                        <div class="stat-card"><div class="stat-number">${stats.total_downloads.toLocaleString()}</div><div>Загрузок</div></div>
                        <div class="stat-card"><div class="stat-number">${stats.free_apps}</div><div>Бесплатных</div></div>
                        <div class="stat-card"><div class="stat-number">${stats.paid_apps}</div><div>Платных</div></div>
                    `;
                });
            
            fetch('/api/store/apps?per_page=50')
                .then(r => r.json())
                .then(data => {
                    let html = '';
                    data.items.forEach(app => {
                        html += `
                            <div class="app-item">
                                <span class="app-name">${app.name}</span>
                                <span class="app-downloads">📥 ${app.downloads || 0}</span>
                                <span>⭐ ${app.rating || 0}</span>
                                <span>${app.is_free ? '🆓 Бесплатно' : '💰 ' + app.price + ' ₽'}</span>
                            </div>
                        `;
                    });
                    document.getElementById('appsList').innerHTML = html;
                });
        </script>
    </body>
    </html>
    '''

# ================== ЗАПУСК СЕРВЕРА ==================

if __name__ == '__main__':
    print("=" * 50)
    print("Soiav 2 Online Store Server")
    print("Версия: 2.0.0")
    print("=" * 50)
    print("\nСервер запущен на http://localhost:5000")
    print("API эндпоинты:")
    print("  GET  /api/store/apps     - Получить приложения")
    print("  GET  /api/store/app/<id> - Информация о приложении")
    print("  POST /api/store/download - Скачать приложение")
    print("  GET  /api/store/featured - Рекомендуемые")
    print("  GET  /api/store/stats    - Статистика")
    print("  GET  /admin              - Админ-панель")
    print("\nНажмите Ctrl+C для остановки")
    print("=" * 50)
    
    app.run(host='0.0.0.0', port=5000, debug=True, threaded=True)
