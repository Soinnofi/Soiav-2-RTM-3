#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Soiav 2 Store Server v3.0 (Build 6032)
Запуск: python server.py
Установка: pip install flask flask-cors
"""

from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
import json
import os
import uuid
import hashlib
from datetime import datetime

app = Flask(__name__)
CORS(app)

# ================== ДАННЫЕ ==================

APPS = [
    {
        "id": "chat_pro",
        "name": "Soiav Messenger",
        "version": "2.0.0",
        "category": "social",
        "price": 0,
        "is_free": True,
        "rating": 4.9,
        "downloads": 15420,
        "size": "12.4 MB",
        "developer": "Soiav Labs",
        "description": "Мощный мессенджер с шифрованием, голосовыми и видеозвонками",
        "short_desc": "Мессенджер с шифрованием",
        "icon": "fa-comments",
        "release_date": "2026-07-10",
        "color": "#128C7E"
    },
    {
        "id": "notes_pro",
        "name": "Soiav Заметки",
        "version": "3.0.0",
        "category": "productivity",
        "price": 0,
        "is_free": True,
        "rating": 4.7,
        "downloads": 8920,
        "size": "4.2 MB",
        "developer": "Soiav Systems",
        "description": "Умные заметки с синхронизацией, тегами и напоминаниями",
        "short_desc": "Умные заметки",
        "icon": "fa-sticky-note",
        "release_date": "2026-07-08",
        "color": "#FFC107"
    },
    {
        "id": "weather_pro",
        "name": "Soiav Погода Pro",
        "version": "2.5.0",
        "category": "utilities",
        "price": 0,
        "is_free": True,
        "rating": 4.6,
        "downloads": 21340,
        "size": "8.7 MB",
        "developer": "Soiav Weather",
        "description": "Точный прогноз погоды с картами, радаром и уведомлениями",
        "short_desc": "Прогноз погоды",
        "icon": "fa-cloud-sun",
        "release_date": "2026-07-06",
        "color": "#2196F3"
    },
    {
        "id": "task_pro",
        "name": "Soiav Задачи",
        "version": "1.8.0",
        "category": "productivity",
        "price": 0,
        "is_free": True,
        "rating": 4.8,
        "downloads": 6720,
        "size": "3.1 MB",
        "developer": "Soiav Labs",
        "description": "Умный менеджер задач с доской Канбан и напоминаниями",
        "short_desc": "Менеджер задач",
        "icon": "fa-tasks",
        "release_date": "2026-07-05",
        "color": "#9C27B0"
    },
    {
        "id": "translate_pro",
        "name": "Soiav Переводчик",
        "version": "1.2.0",
        "category": "utilities",
        "price": 0,
        "is_free": True,
        "rating": 4.5,
        "downloads": 3420,
        "size": "6.8 MB",
        "developer": "Soiav AI",
        "description": "Переводчик на 100+ языков с голосовым вводом и офлайн-режимом",
        "short_desc": "Переводчик с AI",
        "icon": "fa-language",
        "release_date": "2026-07-07",
        "color": "#4CAF50"
    },
    {
        "id": "recorder_pro",
        "name": "Soiav Диктофон",
        "version": "2.0.0",
        "category": "multimedia",
        "price": 0,
        "is_free": True,
        "rating": 4.4,
        "downloads": 5670,
        "size": "5.3 MB",
        "developer": "Soiav Audio",
        "description": "Качественная запись звука с шумоподавлением и транскрипцией",
        "short_desc": "Диктофон с шумоподавлением",
        "icon": "fa-microphone",
        "release_date": "2026-07-04",
        "color": "#F44336"
    },
    {
        "id": "scanner_pro",
        "name": "Soiav Сканер",
        "version": "1.5.0",
        "category": "utilities",
        "price": 0,
        "is_free": True,
        "rating": 4.3,
        "downloads": 4320,
        "size": "7.2 MB",
        "developer": "Soiav Scan",
        "description": "Сканер документов с OCR, распознаванием текста и PDF-экспортом",
        "short_desc": "Сканер документов",
        "icon": "fa-camera",
        "release_date": "2026-07-03",
        "color": "#FF9800"
    },
    {
        "id": "clock_pro",
        "name": "Soiav Часы",
        "version": "3.0.0",
        "category": "utilities",
        "price": 0,
        "is_free": True,
        "rating": 4.7,
        "downloads": 18930,
        "size": "2.8 MB",
        "developer": "Soiav Systems",
        "description": "Красивые часы с будильником, таймером и секундомером",
        "short_desc": "Часы с будильником",
        "icon": "fa-clock",
        "release_date": "2026-07-02",
        "color": "#607D8B"
    },
    {
        "id": "compass_pro",
        "name": "Soiav Компас",
        "version": "1.0.0",
        "category": "utilities",
        "price": 0,
        "is_free": True,
        "rating": 4.2,
        "downloads": 2340,
        "size": "1.5 MB",
        "developer": "Soiav Tools",
        "description": "Точный компас с GPS-координатами и высотой над уровнем моря",
        "short_desc": "Компас с GPS",
        "icon": "fa-compass",
        "release_date": "2026-07-09",
        "color": "#795548"
    },
    {
        "id": "flashlight_pro",
        "name": "Soiav Фонарик",
        "version": "2.0.0",
        "category": "utilities",
        "price": 0,
        "is_free": True,
        "rating": 4.6,
        "downloads": 32100,
        "size": "1.2 MB",
        "developer": "Soiav Tools",
        "description": "Яркий фонарик с режимами мигания и SOS",
        "short_desc": "Фонарик с SOS",
        "icon": "fa-lightbulb",
        "release_date": "2026-07-01",
        "color": "#FFD600"
    }
]

USERS = {
    "test": {
        "id": "test",
        "name": "Тестовый Пользователь",
        "email": "test@soiav.com",
        "password": hashlib.sha256("123456".encode()).hexdigest(),
        "purchases": []
    }
}

PURCHASES = {}
DOWNLOADS = {}
REVIEWS = {}

# ================== API ==================

@app.route('/api/store/apps', methods=['GET'])
def get_apps():
    category = request.args.get('category', 'all')
    search = request.args.get('search', '')
    
    result = APPS.copy()
    
    if category != 'all':
        result = [app for app in result if app.get('category') == category]
    
    if search:
        s = search.lower()
        result = [app for app in result if s in app['name'].lower() or s in app.get('short_desc', '').lower()]
    
    return jsonify({
        'success': True,
        'items': result,
        'total': len(result)
    })

@app.route('/api/store/app/<app_id>', methods=['GET'])
def get_app(app_id):
    for app in APPS:
        if app['id'] == app_id:
            return jsonify({
                'success': True,
                'app': app,
                'reviews': REVIEWS.get(app_id, [])
            })
    return jsonify({'success': False, 'error': 'App not found'}), 404

@app.route('/api/store/download', methods=['POST'])
def download_app():
    data = request.json
    app_id = data.get('app_id')
    user_id = data.get('user_id', 'anonymous')
    
    for app in APPS:
        if app['id'] == app_id:
            app['downloads'] = app.get('downloads', 0) + 1
            
            if app_id not in DOWNLOADS:
                DOWNLOADS[app_id] = []
            DOWNLOADS[app_id].append({
                'user': user_id,
                'timestamp': datetime.now().isoformat()
            })
            
            return jsonify({
                'success': True,
                'message': f'Download started for {app["name"]}',
                'size': app.get('size', 'N/A'),
                'version': app.get('version', '1.0')
            })
    
    return jsonify({'success': False, 'error': 'App not found'}), 404

@app.route('/api/store/stats', methods=['GET'])
def get_stats():
    total = len(APPS)
    downloads = sum(app.get('downloads', 0) for app in APPS)
    free = len([app for app in APPS if app.get('is_free', True)])
    paid = len([app for app in APPS if not app.get('is_free', True)])
    
    top = sorted(APPS, key=lambda x: x.get('downloads', 0), reverse=True)[:5]
    
    return jsonify({
        'success': True,
        'stats': {
            'total_apps': total,
            'total_downloads': downloads,
            'free_apps': free,
            'paid_apps': paid
        },
        'top_apps': top
    })

@app.route('/api/store/categories', methods=['GET'])
def get_categories():
    cats = {}
    for app in APPS:
        cat = app.get('category', 'other')
        cats[cat] = cats.get(cat, 0) + 1
    
    names = {
        'all': 'Все',
        'social': 'Соцсети',
        'productivity': 'Продуктивность',
        'utilities': 'Утилиты',
        'multimedia': 'Мультимедиа'
    }
    
    return jsonify({
        'success': True,
        'categories': cats,
        'names': names
    })

@app.route('/api/store/featured', methods=['GET'])
def get_featured():
    featured = sorted(APPS, key=lambda x: (x.get('rating', 0), x.get('downloads', 0)), reverse=True)[:6]
    return jsonify({'success': True, 'featured': featured})

@app.route('/api/store/review', methods=['POST'])
def add_review():
    data = request.json
    app_id = data.get('app_id')
    user_id = data.get('user_id')
    rating = data.get('rating')
    text = data.get('text', '')
    
    if app_id not in REVIEWS:
        REVIEWS[app_id] = []
    
    REVIEWS[app_id].append({
        'user': user_id,
        'rating': rating,
        'text': text,
        'date': datetime.now().isoformat()
    })
    
    # Обновляем рейтинг
    for app in APPS:
        if app['id'] == app_id:
            total = sum(r['rating'] for r in REVIEWS[app_id])
            app['rating'] = round(total / len(REVIEWS[app_id]), 1)
            break
    
    return jsonify({'success': True, 'message': 'Review added'})

@app.route('/api/store/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'success': False, 'error': 'Email и пароль обязательны'}), 400
    
    pwd_hash = hashlib.sha256(password.encode()).hexdigest()
    
    for user_id, user in USERS.items():
        if user.get('email') == email and user.get('password') == pwd_hash:
            return jsonify({
                'success': True,
                'user': {
                    'id': user_id,
                    'name': user.get('name'),
                    'email': user.get('email')
                }
            })
    
    return jsonify({'success': False, 'error': 'Неверный email или пароль'}), 401

@app.route('/api/store/register', methods=['POST'])
def register():
    data = request.json
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    
    if not name or not email or not password:
        return jsonify({'success': False, 'error': 'Все поля обязательны'}), 400
    
    for user in USERS.values():
        if user.get('email') == email:
            return jsonify({'success': False, 'error': 'Email уже используется'}), 400
    
    user_id = str(uuid.uuid4())[:8]
    USERS[user_id] = {
        'id': user_id,
        'name': name,
        'email': email,
        'password': hashlib.sha256(password.encode()).hexdigest(),
        'purchases': []
    }
    
    return jsonify({
        'success': True,
        'user': {
            'id': user_id,
            'name': name,
            'email': email
        }
    })

@app.route('/api/store/purchased', methods=['POST'])
def get_purchased():
    data = request.json
    user_id = data.get('user_id')
    
    if user_id not in USERS:
        return jsonify({'success': False, 'error': 'User not found'}), 404
    
    purchased = []
    for app_id in PURCHASES.get(user_id, []):
        for app in APPS:
            if app['id'] == app_id:
                purchased.append(app)
                break
    
    return jsonify({'success': True, 'purchased': purchased})

@app.route('/api/store/purchase', methods=['POST'])
def purchase():
    data = request.json
    user_id = data.get('user_id')
    app_id = data.get('app_id')
    
    if user_id not in USERS:
        return jsonify({'success': False, 'error': 'User not found'}), 404
    
    if user_id not in PURCHASES:
        PURCHASES[user_id] = []
    
    if app_id not in PURCHASES[user_id]:
        PURCHASES[user_id].append(app_id)
    
    return jsonify({'success': True, 'message': 'App purchased'})

@app.route('/admin', methods=['GET'])
def admin():
    return '''
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Soiav Store Admin</title>
        <style>
            * { margin:0; padding:0; box-sizing:border-box; }
            body {
                font-family: 'Segoe UI', sans-serif;
                background: #0d0d0d;
                color: #fff;
                padding: 30px;
            }
            .container { max-width: 1200px; margin: 0 auto; }
            h1 { color: #0078d7; font-weight: 300; margin-bottom: 5px; }
            .sub { color: #666; margin-bottom: 30px; }
            .stats {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 20px;
                margin: 30px 0;
            }
            .stat {
                background: #1a1a1a;
                padding: 25px;
                border-radius: 16px;
                text-align: center;
                border: 1px solid #2a2a2a;
            }
            .stat-num { font-size: 36px; font-weight: bold; color: #0078d7; }
            .stat-label { color: #888; margin-top: 5px; }
            .panel {
                background: #1a1a1a;
                border-radius: 16px;
                padding: 25px;
                margin-top: 30px;
                border: 1px solid #2a2a2a;
            }
            .panel h2 { color: #0078d7; font-weight: 300; margin-bottom: 20px; }
            .app-item {
                display: grid;
                grid-template-columns: 2fr 1fr 1fr 1fr;
                padding: 12px 16px;
                border-bottom: 1px solid #2a2a2a;
            }
            .app-item:hover { background: #2a2a2a; }
            .app-name { font-weight: 600; }
            .app-downloads { color: #4caf50; }
            .app-rating { color: #ffc107; }
            .app-price { color: #888; }
            .top-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
                gap: 15px;
            }
            .top-item {
                background: #2a2a2a;
                padding: 15px;
                border-radius: 12px;
                text-align: center;
            }
            .top-item .name { font-weight: 600; }
            .top-item .down { color: #4caf50; font-size: 14px; }
            .refresh {
                background: #0078d7;
                border: none;
                color: white;
                padding: 10px 24px;
                border-radius: 12px;
                cursor: pointer;
                font-size: 14px;
                transition: 0.3s;
                margin-bottom: 20px;
            }
            .refresh:hover { background: #106ebe; transform: scale(1.02); }
            @media (max-width: 768px) {
                .stats { grid-template-columns: repeat(2, 1fr); }
                .app-item { grid-template-columns: 1fr; gap: 5px; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🚀 Soiav Store Admin</h1>
            <div class="sub">Build 6032 · Сервер на порту 5000</div>
            
            <button class="refresh" onclick="location.reload()">⟳ Обновить</button>
            
            <div class="stats" id="stats"></div>
            
            <div class="panel">
                <h2>🏆 Топ приложений</h2>
                <div class="top-grid" id="top"></div>
            </div>
            
            <div class="panel">
                <h2>📦 Все приложения</h2>
                <div id="apps"></div>
            </div>
        </div>
        
        <script>
            fetch('/api/store/stats')
                .then(r => r.json())
                .then(data => {
                    const s = data.stats;
                    document.getElementById('stats').innerHTML = `
                        <div class="stat"><div class="stat-num">${s.total_apps}</div><div class="stat-label">📱 Приложений</div></div>
                        <div class="stat"><div class="stat-num">${s.total_downloads.toLocaleString()}</div><div class="stat-label">⬇️ Загрузок</div></div>
                        <div class="stat"><div class="stat-num">${s.free_apps}</div><div class="stat-label">🆓 Бесплатных</div></div>
                        <div class="stat"><div class="stat-num">${s.paid_apps}</div><div class="stat-label">💰 Платных</div></div>
                    `;
                    
                    const top = data.top_apps || [];
                    document.getElementById('top').innerHTML = top.map(a => `
                        <div class="top-item">
                            <div class="name">${a.name}</div>
                            <div class="down">⬇️ ${(a.downloads || 0).toLocaleString()}</div>
                            <div style="color:#ffc107;">⭐ ${a.rating || 0}</div>
                        </div>
                    `).join('');
                });
            
            fetch('/api/store/apps')
                .then(r => r.json())
                .then(data => {
                    document.getElementById('apps').innerHTML = data.items.map(a => `
                        <div class="app-item">
                            <span class="app-name">${a.name}</span>
                            <span class="app-downloads">⬇️ ${(a.downloads || 0).toLocaleString()}</span>
                            <span class="app-rating">⭐ ${a.rating || 0}</span>
                            <span class="app-price">${a.is_free ? '🆓' : '💰 ' + a.price + ' ₽'}</span>
                        </div>
                    `).join('');
                });
        </script>
    </body>
    </html>
    '''

if __name__ == '__main__':
    print("=" * 50)
    print("🔥 Soiav Store Server v3.0")
    print("📦 Build 6032")
    print("=" * 50)
    print("\n✅ Сервер запущен: http://localhost:5000")
    print("📱 Админ-панель: http://localhost:5000/admin")
    print("🆕 Новые приложения: Messenger, Заметки, Погода, Задачи, Переводчик, Диктофон, Сканер, Часы, Компас, Фонарик")
    print("\nНажми Ctrl+C для остановки")
    print("=" * 50)
    
    app.run(host='0.0.0.0', port=5000, debug=True)
