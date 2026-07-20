// ================== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ==================
let currentStep = 1;
let apps = [];
let installedApps = new Set();
let activeWindows = new Set();
let currentCalendarMonth = new Date().getMonth();
let currentCalendarYear = new Date().getFullYear();
let currentAppCalendarMonth = new Date().getMonth();
let currentAppCalendarYear = new Date().getFullYear();
let developerMode = false;
let ssapFiles = {};
let selectedVersion = 'home';
let desktopIconSize = 'medium';
let taskbarPosition = 'bottom';
let sidUser = null;
let files = [];
let notifications = [];
let syncEnabled = true;
let currentUser = {
    name: 'Пользователь Soiav',
    email: 'user@soiav.com',
    avatar: 'https://i.ibb.co/HT71Ghdd/photo-output.png'
};

// ================== ИНИЦИАЛИЗАЦИЯ ==================
document.addEventListener('DOMContentLoaded', function() {
    initializeSystem();
    loadApps();
    updateTime();
    setInterval(updateTime, 1000);
    initializeSetupHandlers();
    initializeCalendar();
    initializeAppCalendar();
    initializeSettings();
    initializeSSAPFiles();
    loadSampleFiles();
    addSampleNotifications();
    
    // Закрытие контекстного меню при клике вне
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.context-menu')) {
            document.getElementById('contextMenu').classList.remove('active');
        }
    });
    
    // Drag and drop для окон
    initializeWindowDrag();
});

// ================== SSAP ФАЙЛЫ ==================
function initializeSSAPFiles() {
    ssapFiles = {
        'game.ssap': {
            name: 'Космическая игра',
            type: 'game',
            code: `APP: SpaceGame
VERSION: 1.0
TYPE: GAME

SCENE main
  BACKGROUND: space_bg
  PLAYER: spaceship
  ENEMIES: 5
  POWERUPS: 3
  
FUNCTION start_game()
  INIT player_position = [50, 50]
  INIT score = 0
  START game_loop()
END

FUNCTION game_loop()
  WHILE player_alive
    UPDATE player_position
    SPAWN enemies
    CHECK collisions
    RENDER frame
  END
  SHOW game_over
END`,
            description: 'Простая космическая аркада'
        },
        'app.ssap': {
            name: 'Калькулятор',
            type: 'app',
            code: `APP: Calculator
VERSION: 1.0
TYPE: APPLICATION

INTERFACE main
  WINDOW: [400, 500]
  TITLE: "Калькулятор"
  
  COMPONENTS:
    DISPLAY: result_display
    BUTTONS: number_buttons[0-9]
    OPERATORS: [plus, minus, multiply, divide]
    EQUALS: equals_btn
    CLEAR: clear_btn

FUNCTION calculate(expression)
  PARSE expression
  EVALUATE math
  RETURN result
END

FUNCTION button_click(value)
  UPDATE display
  IF equals_clicked
    CALL calculate()
  END
END`,
            description: 'Простой калькулятор'
        },
        'code.ssap': {
            name: 'Текстовый редактор',
            type: 'app',
            code: `APP: TextEditor
VERSION: 1.0
TYPE: APPLICATION

INTERFACE editor
  WINDOW: [800, 600]
  TITLE: "Текстовый редактор"
  MENU: [file, edit, view, help]
  
  COMPONENTS:
    TEXTAREA: main_editor
    TOOLBAR: formatting_tools
    STATUS_BAR: document_info

FUNCTION open_file(path)
  READ file_content
  LOAD_TO_EDITOR content
  UPDATE status_bar
END

FUNCTION save_file()
  GET editor_content
  WRITE_TO_FILE content
  SHOW success_message
END

FUNCTION format_text(style)
  APPLY style
  UPDATE preview
END`,
            description: 'Текстовый редактор с подсветкой синтаксиса'
        },
        'example.ssap': {
            name: 'Пример программы',
            type: 'demo',
            code: `APP: HelloWorld
VERSION: 1.0
TYPE: DEMO

FUNCTION main()
  PRINT "Добро пожаловать в Soiav 2!"
  PRINT "Это пример .ssap файла"
  PRINT "Система успешно загружена"
  
  CREATE window "Пример"
  ADD button "Нажми меня" WITH action show_message
  ADD label "Статус: Готов"
END

FUNCTION show_message()
  DISPLAY "Программа работает корректно!"
  LOG "Кнопка нажата"
END`,
            description: 'Демонстрационный файл'
        },
        'browser.ssap': {
            name: 'Веб-браузер',
            type: 'app',
            code: `APP: SimpleBrowser
VERSION: 1.0
TYPE: APPLICATION

INTERFACE browser
  WINDOW: [900, 600]
  TITLE: "SSAP Browser"
  
  COMPONENTS:
    URL_BAR: address_input
    BACK_BTN: back_button
    FORWARD_BTN: forward_button
    REFRESH_BTN: refresh_button
    WEB_VIEW: main_view

FUNCTION navigate(url)
  LOAD url
  UPDATE address_bar
  RENDER page
END

FUNCTION search(query)
  SEARCH query
  SHOW results
END

FUNCTION bookmark_page()
  SAVE current_url
  ADD to_bookmarks
  SHOW notification
END`,
            description: 'Простой веб-браузер'
        }
    };
}

// ================== SSAP ФУНКЦИИ ==================
function openSSAPFile(filename) {
    const ssapFile = ssapFiles[filename];
    if (!ssapFile) {
        showNotification('Ошибка', `Файл ${filename} не найден`);
        return;
    }

    if (ssapFile.type === 'game') {
        runSSAPGame(ssapFile);
    } else {
        openSSAPRunner(ssapFile);
    }
}

function openSSAPRunner(ssapFile) {
    const runner = document.getElementById('ssapRunner');
    if (!runner) {
        // Создаем окно для SSAP Runner если его нет
        createSSAPRunnerWindow();
    }
    
    const content = document.getElementById('ssapRunnerContent');
    
    let runnerContent = '';
    
    switch(ssapFile.type) {
        case 'app':
            runnerContent = `
                <div class="ssap-app-window">
                    <div class="ssap-app-title">${ssapFile.name}</div>
                    <div class="ssap-app-content">
                        <p>${ssapFile.description}</p>
                        <div style="margin: 20px 0;">
                            <button class="game-btn" onclick="startSSAPApp('${ssapFile.name}')">
                                <i class="fas fa-play"></i> Запустить приложение
                            </button>
                            <button class="game-btn" onclick="showSSAPCode('${ssapFile.name}')">
                                <i class="fas fa-code"></i> Показать код
                            </button>
                        </div>
                    </div>
                </div>
            `;
            break;
        case 'demo':
            runnerContent = `
                <div class="ssap-app-window">
                    <div class="ssap-app-title">${ssapFile.name}</div>
                    <div class="ssap-app-content">
                        <p>${ssapFile.description}</p>
                        <div style="background: var(--background-secondary); padding: 20px; border-radius: 8px; margin: 15px 0;">
                            <pre style="font-family: 'Courier New', monospace; font-size: 12px; color: var(--text-primary);">${ssapFile.code}</pre>
                        </div>
                        <button class="game-btn" onclick="executeSSAPDemo('${ssapFile.name}')">
                            <i class="fas fa-play"></i> Выполнить демо
                        </button>
                    </div>
                </div>
            `;
            break;
    }
    
    content.innerHTML = runnerContent;
    document.querySelector('#ssapRunner .window-header span').innerHTML = `<i class="fas fa-play"></i> ${ssapFile.name}`;
    openApp('ssapRunner');
}

function createSSAPRunnerWindow() {
    const desktop = document.querySelector('.desktop');
    const runnerWindow = document.createElement('div');
    runnerWindow.className = 'window';
    runnerWindow.id = 'ssapRunner';
    runnerWindow.innerHTML = `
        <div class="window-header">
            <span><i class="fas fa-play"></i> SSAP Runner</span>
            <div class="window-controls">
                <button class="window-control" onclick="minimizeWindow('ssapRunner')">–</button>
                <button class="window-control" onclick="maximizeWindow('ssapRunner')">□</button>
                <button class="window-control" onclick="closeWindow('ssapRunner')">×</button>
            </div>
        </div>
        <div class="window-content" id="ssapRunnerContent"></div>
    `;
    desktop.appendChild(runnerWindow);
}

function runSSAPGame(ssapFile) {
    const runner = document.getElementById('ssapRunner');
    if (!runner) {
        createSSAPRunnerWindow();
    }
    
    const content = document.getElementById('ssapRunnerContent');
    
    const gameContent = `
        <div class="game-container">
            <div class="game-title">${ssapFile.name}</div>
            <div class="game-controls">
                <button class="game-btn" onclick="startGame()">
                    <i class="fas fa-play"></i> Начать игру
                </button>
                <button class="game-btn" onclick="showInstructions()">
                    <i class="fas fa-info-circle"></i> Инструкции
                </button>
                <button class="game-btn" onclick="showSSAPCode('${ssapFile.name}')">
                    <i class="fas fa-code"></i> Исходный код
                </button>
            </div>
            <canvas id="gameCanvas" width="600" height="400" class="game-canvas"></canvas>
            <div id="gameInfo" style="margin-top: 15px; font-size: 14px; color: var(--text-secondary);">
                Очки: <span id="score">0</span> | Жизни: <span id="lives">3</span>
            </div>
        </div>
    `;
    
    content.innerHTML = gameContent;
    document.querySelector('#ssapRunner .window-header span').innerHTML = `<i class="fas fa-gamepad"></i> ${ssapFile.name}`;
    openApp('ssapRunner');
}

function startSSAPApp(appName) {
    showNotification('Запуск приложения', `Приложение "${appName}" запускается...`);
    setTimeout(() => {
        showNotification('Приложение', `"${appName}" успешно запущено`);
    }, 1500);
}

function executeSSAPDemo(demoName) {
    showNotification('Демонстрация', `Выполняется демо: ${demoName}`);
    
    const messages = [
        "Инициализация системы...",
        "Загрузка модулей...", 
        "Проверка зависимостей...",
        "Запуск демонстрации...",
        "Демонстрация завершена успешно!"
    ];
    
    let currentMessage = 0;
    const interval = setInterval(() => {
        if (currentMessage < messages.length) {
            showNotification('Демо', messages[currentMessage]);
            currentMessage++;
        } else {
            clearInterval(interval);
        }
    }, 1000);
}

function showSSAPCode(filename) {
    const ssapFile = ssapFiles[filename];
    if (ssapFile) {
        const fileViewer = document.getElementById('fileViewer');
        if (!fileViewer) {
            createFileViewerWindow();
        }
        
        const content = document.getElementById('fileViewerContent');
        
        content.innerHTML = `
            <div class="file-content">
                <h3>${ssapFile.name} - Исходный код</h3>
                <p>Тип: ${ssapFile.type} | Описание: ${ssapFile.description}</p>
                <div style="background: #1e1e1e; color: #d4d4d4; padding: 20px; border-radius: 8px; margin: 15px 0; font-family: 'Courier New', monospace; font-size: 12px; line-height: 1.4; overflow-x: auto;">
                    <pre>${ssapFile.code}</pre>
                </div>
                <button class="setting-btn" onclick="openSSAPCompilerWithCode('${filename}')">
                    <i class="fas fa-edit"></i> Редактировать в компиляторе
                </button>
            </div>
        `;
        
        document.querySelector('#fileViewer .window-header span').innerHTML = `<i class="fas fa-code"></i> ${filename}`;
        openApp('fileViewer');
    }
}

function createFileViewerWindow() {
    const desktop = document.querySelector('.desktop');
    const fileViewer = document.createElement('div');
    fileViewer.className = 'window';
    fileViewer.id = 'fileViewer';
    fileViewer.innerHTML = `
        <div class="window-header">
            <span><i class="fas fa-file"></i> Просмотр файла</span>
            <div class="window-controls">
                <button class="window-control" onclick="minimizeWindow('fileViewer')">–</button>
                <button class="window-control" onclick="maximizeWindow('fileViewer')">□</button>
                <button class="window-control" onclick="closeWindow('fileViewer')">×</button>
            </div>
        </div>
        <div class="window-content" id="fileViewerContent"></div>
    `;
    desktop.appendChild(fileViewer);
}

function openSSAPCompiler() {
    openApp('ssapCompiler');
}

function openSSAPCompilerWithCode(filename) {
    const ssapFile = ssapFiles[filename];
    if (ssapFile) {
        document.getElementById('ssapCodeEditor').value = ssapFile.code;
        openApp('ssapCompiler');
    }
}

function newSSAPFile() {
    document.getElementById('ssapCodeEditor').value = '// Новый SSAP файл\n\nAPP: NewApp\nVERSION: 1.0\nTYPE: APPLICATION\n\nFUNCTION main()\n  PRINT "Hello World!"\nEND';
    showNotification('SSAP', 'Создан новый файл');
}

function loadSSAPFile() {
    const filename = Object.keys(ssapFiles)[0];
    const ssapFile = ssapFiles[filename];
    if (ssapFile) {
        document.getElementById('ssapCodeEditor').value = ssapFile.code;
        showNotification('Компилятор', `Загружен файл: ${filename}`);
    }
}

function compileSSAP() {
    const code = document.getElementById('ssapCodeEditor').value;
    const output = document.getElementById('compilerOutput');
    
    output.innerHTML = '';
    
    const steps = [
        "Парсинг SSAP кода...",
        "Проверка синтаксиса...",
        "Оптимизация байт-кода...",
        "Генерация исполняемого файла...",
        "Компиляция завершена успешно!"
    ];
    
    let currentStep = 0;
    
    function nextStep() {
        if (currentStep < steps.length) {
            const line = document.createElement('div');
            line.textContent = `> ${steps[currentStep]}`;
            output.appendChild(line);
            currentStep++;
            output.scrollTop = output.scrollHeight;
            setTimeout(nextStep, 800);
        } else {
            const successLine = document.createElement('div');
            successLine.innerHTML = `<span style="color: #4CAF50;">> Готово! Приложение скомпилировано.</span>`;
            output.appendChild(successLine);
            output.scrollTop = output.scrollHeight;
            
            showNotification('Компилятор', 'SSAP код успешно скомпилирован');
        }
    }
    
    nextStep();
}

function saveSSAPFile() {
    const code = document.getElementById('ssapCodeEditor').value;
    showNotification('Компилятор', 'Файл сохранен успешно');
}

function publishToStore() {
    const code = document.getElementById('ssapCodeEditor').value;
    showNotification('Магазин', 'Приложение отправлено на проверку');
    setTimeout(() => {
        showNotification('Магазин', 'Приложение опубликовано в Soiav Store');
    }, 2000);
}

// ================== ФУНКЦИИ УСТАНОВКИ ==================
function initializeSetupHandlers() {
    document.querySelectorAll('.theme-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.theme-option').forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
            const theme = this.dataset.theme;
            document.documentElement.setAttribute('data-theme', theme);
        });
    });

    document.querySelectorAll('.wallpaper-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.wallpaper-option').forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

function initializeSystem() {
    const savedTheme = localStorage.getItem('soiav-theme');
    const savedWallpaper = localStorage.getItem('soiav-wallpaper');
    const savedUsername = localStorage.getItem('soiav-username');
    const savedAccentColor = localStorage.getItem('soiav-accent-color');
    const savedVersion = localStorage.getItem('soiav-version');
    const savedIconSize = localStorage.getItem('soiav-icon-size');
    const savedTaskbarPos = localStorage.getItem('soiav-taskbar-position');
    const savedSidUser = localStorage.getItem('soiav-sid-user');

    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeSelector(savedTheme);
    }
    
    if (savedWallpaper) {
        setWallpaper(savedWallpaper);
    }
    
    if (savedUsername) {
        document.getElementById('username').value = savedUsername;
        updateUserInfo(savedUsername);
    }
    
    if (savedAccentColor) {
        document.documentElement.style.setProperty('--accent-color', savedAccentColor);
        document.getElementById('accentColor').value = savedAccentColor;
    }
    
    if (savedVersion) {
        selectedVersion = savedVersion;
    }
    
    if (savedIconSize) {
        desktopIconSize = savedIconSize;
        applyDesktopIconSize(savedIconSize);
    }
    
    if (savedTaskbarPos) {
        taskbarPosition = savedTaskbarPos;
        applyTaskbarPosition(savedTaskbarPos);
    }
    
    if (savedSidUser) {
        sidUser = JSON.parse(savedSidUser);
        updateUserInfo(sidUser.name);
    }

    if (localStorage.getItem('soiav-setup-completed')) {
        completeSetup();
    }
}

function nextStep(step) {
    if (step === 7) {
        startFinalSetup();
        return;
    }
    
    document.getElementById(`step${currentStep}`).classList.remove('active');
    document.getElementById(`step${step}`).classList.add('active');
    currentStep = step;
}

function prevStep(step) {
    document.getElementById(`step${currentStep}`).classList.remove('active');
    document.getElementById(`step${step}`).classList.add('active');
    currentStep = step;
}

function selectVersion(version) {
    selectedVersion = version;
    document.querySelectorAll('.version-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    event.currentTarget.classList.add('selected');
    
    const versionNames = {
        'home': 'Soiav 2 Домашняя',
        'pro': 'Soiav 2 Pro',
        'server': 'Soiav 2 Server'
    };
    showNotification('Выбрана версия', versionNames[version]);
}

function loginSid() {
    const email = document.getElementById('sidEmail').value;
    const password = document.getElementById('sidPassword').value;
    const remember = document.getElementById('rememberSid').checked;
    
    if (email && password) {
        sidUser = {
            name: email.split('@')[0],
            email: email,
            avatar: 'https://i.ibb.co/HT71Ghdd/photo-output.png'
        };
        
        if (remember) {
            localStorage.setItem('soiav-sid-user', JSON.stringify(sidUser));
        }
        
        updateUserInfo(sidUser.name);
        showNotification('SID Аккаунт', 'Вход выполнен успешно');
        nextStep(5);
    } else {
        showNotification('Ошибка', 'Введите email и пароль');
    }
}

function createSidAccount() {
    showNotification('SID Аккаунт', 'Открытие страницы регистрации');
    setTimeout(() => {
        document.getElementById('sidEmail').value = 'newuser@soiav.com';
        document.getElementById('sidPassword').value = 'password123';
        showNotification('SID Аккаунт', 'Демо-аккаунт создан');
    }, 1000);
}

function startFinalSetup() {
    document.getElementById(`step${currentStep}`).classList.remove('active');
    document.getElementById('step7').classList.add('active');
    currentStep = 7;

    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    const steps = [
        {text: 'Подготовка системы...', duration: 1000},
        {text: 'Настройка тем...', duration: 1500},
        {text: 'Применение обоев...', duration: 1200},
        {text: 'Активация версии...', duration: 1000},
        {text: 'Настройка SID аккаунта...', duration: 1500},
        {text: 'Конфигурация системы...', duration: 1800},
        {text: 'Синхронизация данных...', duration: 2000},
        {text: 'Оптимизация...', duration: 2000},
        {text: 'Завершение...', duration: 1500}
    ];

    let totalTime = 0;
    steps.forEach(step => totalTime += step.duration);

    let currentProgress = 0;
    let currentStepIndex = 0;

    function updateProgress() {
        if (currentStepIndex < steps.length) {
            const step = steps[currentStepIndex];
            progressText.textContent = step.text;
            
            setTimeout(() => {
                currentProgress += (step.duration / totalTime) * 100;
                progressFill.style.width = currentProgress + '%';
                currentStepIndex++;
                updateProgress();
            }, step.duration);
        } else {
            setTimeout(() => {
                completeSetup();
            }, 1000);
        }
    }

    updateProgress();
}

function completeSetup() {
    const theme = document.querySelector('.theme-option.active')?.dataset.theme || 'light';
    const wallpaper = document.querySelector('.wallpaper-option.active')?.dataset.wallpaper || '1';
    const username = document.getElementById('username').value || 'Пользователь Soiav';
    const accentColor = document.getElementById('accentColor').value;
    const iconSize = document.getElementById('iconSize').value;
    const taskbarPos = document.getElementById('taskbarPosition').value;
    const syncSettings = document.getElementById('syncSettings').value;
    const systemDisk = document.getElementById('systemDisk')?.value || 'C';
    const performance = document.getElementById('performance')?.value || 'balanced';
    const timezone = document.getElementById('timezone')?.value || 'moscow';
    const version = selectedVersion;

    localStorage.setItem('soiav-theme', theme);
    localStorage.setItem('soiav-wallpaper', wallpaper);
    localStorage.setItem('soiav-username', username);
    localStorage.setItem('soiav-accent-color', accentColor);
    localStorage.setItem('soiav-icon-size', iconSize);
    localStorage.setItem('soiav-taskbar-position', taskbarPos);
    localStorage.setItem('soiav-system-disk', systemDisk);
    localStorage.setItem('soiav-performance', performance);
    localStorage.setItem('soiav-timezone', timezone);
    localStorage.setItem('soiav-version', version);
    localStorage.setItem('soiav-sync-settings', syncSettings);
    localStorage.setItem('soiav-setup-completed', 'true');

    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.setProperty('--accent-color', accentColor);
    setWallpaper(wallpaper);
    updateUserInfo(username);
    applyDesktopIconSize(iconSize);
    applyTaskbarPosition(taskbarPos);

    document.querySelector('.setup-wizard').classList.remove('active');
    document.querySelector('.desktop').classList.add('active');

    const versionNames = {
        'home': 'Soiav 2 Домашняя',
        'pro': 'Soiav 2 Pro',
        'server': 'Soiav 2 Server'
    };

    setTimeout(() => {
        showNotification('Добро пожаловать!', `${versionNames[version]} · Добро пожаловать, ${username}!`);
        if (syncEnabled) {
            syncAll();
        }
    }, 1000);
}

function setWallpaper(wallpaperId) {
    const wallpapers = {
        '1': 'https://i.ibb.co/pr6sjWJQ/IMG-3606.jpg',
        '2': 'https://i.ibb.co/ccyK7XZr/IMG-3607.jpg'
    };
    
    if (wallpapers[wallpaperId]) {
        document.querySelector('.desktop').style.backgroundImage = `url('${wallpapers[wallpaperId]}')`;
        localStorage.setItem('soiav-wallpaper', wallpaperId);
    }
}

function syncWallpaper() {
    const currentWallpaper = localStorage.getItem('soiav-wallpaper') || '1';
    setWallpaper(currentWallpaper);
    showNotification('Синхронизация', 'Обои синхронизированы');
}

function updateUserInfo(username) {
    const nameElements = document.querySelectorAll('.user-name, .user-name-start, #userName, #accountUserName, #userNameStart');
    const emailElements = document.querySelectorAll('.user-email, #userEmail, #accountUserEmail');
    const avatarElements = document.querySelectorAll('.user-avatar, .user-avatar-small, .user-avatar-large');
    
    nameElements.forEach(el => {
        if (el) el.textContent = username;
    });
    
    emailElements.forEach(el => {
        if (el) el.textContent = sidUser ? sidUser.email : 'user@soiav.local';
    });
    
    avatarElements.forEach(el => {
        if (el.tagName === 'IMG') {
            el.src = sidUser ? sidUser.avatar : 'https://i.ibb.co/HT71Ghdd/photo-output.png';
        } else {
            const initials = username.split(' ').map(n => n[0]).join('').toUpperCase() || 'ПС';
            el.textContent = initials;
        }
    });
    
    currentUser.name = username;
}

function updateThemeSelector(theme) {
    document.querySelectorAll('.theme-option').forEach(opt => {
        if (opt.dataset.theme === theme) {
            opt.classList.add('active');
        } else {
            opt.classList.remove('active');
        }
    });
}

// ================== ФУНКЦИИ РАБОЧЕГО СТОЛА И ОКОН ==================
function openApp(appId) {
    const window = document.getElementById(appId);
    if (window) {
        window.classList.add('active');
        activeWindows.add(appId);
        updateTaskbar(appId, true);
        
        if (!document.querySelector(`.taskbar-app[data-app="${appId}"]`)) {
            const appElement = document.querySelector(`.desktop-icon[data-app="${appId}"]`);
            if (appElement) {
                const icon = appElement.querySelector('img') ? 
                    `<img src="${appElement.querySelector('img').src}" style="width:20px;height:20px;">` : 
                    `<i class="${appElement.querySelector('i').className}"></i>`;
                addToTaskbar(appId, icon);
            }
        }
        
        window.style.animation = 'windowSlideIn 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)';
        setTimeout(() => {
            window.style.animation = '';
        }, 300);
        
        // Поднимаем окно поверх других
        bringToFront(appId);
    }
}

function bringToFront(appId) {
    const windows = document.querySelectorAll('.window');
    let maxZIndex = 100;
    windows.forEach(w => {
        const zIndex = parseInt(w.style.zIndex) || 100;
        if (zIndex > maxZIndex) maxZIndex = zIndex;
    });
    
    document.getElementById(appId).style.zIndex = maxZIndex + 1;
}

function closeWindow(appId) {
    const window = document.getElementById(appId);
    if (window) {
        window.classList.remove('active');
        activeWindows.delete(appId);
        updateTaskbar(appId, false);
        
        window.style.animation = 'fadeOut 0.2s ease';
        setTimeout(() => {
            window.style.animation = '';
        }, 200);
    }
}

function minimizeWindow(appId) {
    const window = document.getElementById(appId);
    if (window) {
        window.classList.remove('active');
        updateTaskbar(appId, false);
    }
}

function maximizeWindow(appId) {
    const window = document.getElementById(appId);
    if (window) {
        if (window.classList.contains('maximized')) {
            window.classList.remove('maximized');
            window.style.width = '';
            window.style.height = '';
            window.style.top = '';
            window.style.left = '';
        } else {
            window.classList.add('maximized');
        }
    }
}

function toggleApp(appId) {
    const window = document.getElementById(appId);
    if (window && window.classList.contains('active')) {
        minimizeWindow(appId);
    } else {
        openApp(appId);
    }
}

function updateTaskbar(appId, isActive) {
    const taskbarApp = document.querySelector(`.taskbar-app[data-app="${appId}"]`);
    if (taskbarApp) {
        if (isActive) {
            taskbarApp.classList.add('active');
        } else {
            taskbarApp.classList.remove('active');
        }
    }
}

function addToTaskbar(appId, iconHtml) {
    const taskbarApps = document.getElementById('taskbarApps');
    
    // Проверяем, нет ли уже такого приложения
    if (document.querySelector(`.taskbar-app[data-app="${appId}"]`)) {
        return;
    }
    
    const appElement = document.createElement('div');
    appElement.className = 'taskbar-app';
    appElement.setAttribute('data-app', appId);
    appElement.innerHTML = iconHtml;
    appElement.onclick = () => toggleApp(appId);
    taskbarApps.appendChild(appElement);
}

function initializeWindowDrag() {
    let dragElement = null;
    let dragOffset = { x: 0, y: 0 };

    document.addEventListener('mousedown', function(e) {
        if (e.target.closest('.window-header')) {
            const header = e.target.closest('.window-header');
            const window = header.parentElement;
            
            if (window.classList.contains('maximized')) return;
            
            dragElement = window;
            dragOffset.x = e.clientX - window.offsetLeft;
            dragOffset.y = e.clientY - window.offsetTop;
            
            bringToFront(window.id);
        }
    });

    document.addEventListener('mousemove', function(e) {
        if (dragElement && !dragElement.classList.contains('maximized')) {
            dragElement.style.left = (e.clientX - dragOffset.x) + 'px';
            dragElement.style.top = (e.clientY - dragOffset.y) + 'px';
        }
    });

    document.addEventListener('mouseup', function() {
        dragElement = null;
    });
}

// ================== МЕНЮ ПУСК ==================
function toggleStartMenu() {
    const startMenu = document.getElementById('startMenu');
    startMenu.classList.toggle('active');
}

function toggleSideMenu() {
    const sideMenu = document.getElementById('sideMenu');
    sideMenu.classList.toggle('active');
}

function toggleNotificationCenter() {
    const notificationCenter = document.getElementById('notificationCenter');
    notificationCenter.classList.toggle('active');
}

function toggleAccountMenu() {
    const accountMenu = document.getElementById('accountMenu');
    accountMenu.classList.toggle('active');
}

function toggleCalendar() {
    const calendarPopup = document.getElementById('calendarPopup');
    calendarPopup.classList.toggle('active');
    updateCalendar();
}

// ================== КОНТЕКСТНОЕ МЕНЮ (ПКМ) ==================
function showContextMenu(e) {
    e.preventDefault();
    const menu = document.getElementById('contextMenu');
    menu.style.left = e.pageX + 'px';
    menu.style.top = e.pageY + 'px';
    menu.classList.add('active');
}

function createNewItem(type) {
    const names = {
        'file': 'Новый файл.txt',
        'folder': 'Новая папка',
        'document': 'Новый документ.txt',
        'shortcut': 'Новый ярлык'
    };
    
    const desktopIcons = document.getElementById('desktopIcons');
    const icon = document.createElement('div');
    icon.className = 'desktop-icon';
    
    let iconHtml = '';
    switch(type) {
        case 'file':
            iconHtml = '<i class="fas fa-file"></i>';
            break;
        case 'folder':
            iconHtml = '<i class="fas fa-folder"></i>';
            break;
        case 'document':
            iconHtml = '<i class="fas fa-file-alt"></i>';
            break;
        case 'shortcut':
            iconHtml = '<i class="fas fa-link"></i>';
            break;
    }
    
    icon.innerHTML = iconHtml + `<span>${names[type]}</span>`;
    icon.onclick = () => openFile(names[type]);
    desktopIcons.appendChild(icon);
    
    showNotification('Создано', names[type]);
    document.getElementById('contextMenu').classList.remove('active');
}

function openPersonalization() {
    openApp('settings');
    setTimeout(() => {
        document.querySelector('[data-category="personalization"]').click();
    }, 300);
    document.getElementById('contextMenu').classList.remove('active');
}

function changeIconSize() {
    const sizes = ['small', 'medium', 'large'];
    const currentIndex = sizes.indexOf(desktopIconSize);
    const nextIndex = (currentIndex + 1) % sizes.length;
    desktopIconSize = sizes[nextIndex];
    
    applyDesktopIconSize(desktopIconSize);
    localStorage.setItem('soiav-icon-size', desktopIconSize);
    
    showNotification('Размер иконок', `Установлен размер: ${getSizeName(desktopIconSize)}`);
    document.getElementById('contextMenu').classList.remove('active');
}

function applyDesktopIconSize(size) {
    document.querySelectorAll('.desktop-icon').forEach(icon => {
        icon.dataset.size = size;
    });
}

function getSizeName(size) {
    const names = {
        'small': 'Маленькие',
        'medium': 'Средние',
        'large': 'Большие'
    };
    return names[size];
}

function refreshDesktop() {
    showNotification('Обновление', 'Рабочий стол обновлен');
    document.getElementById('contextMenu').classList.remove('active');
}

// ================== НАСТРОЙКИ ==================
function initializeSettings() {
    document.querySelectorAll('.settings-category').forEach(category => {
        category.addEventListener('click', function() {
            const categoryId = this.dataset.category;
            
            document.querySelectorAll('.settings-category').forEach(cat => cat.classList.remove('active'));
            this.classList.add('active');
            
            document.querySelectorAll('.settings-section').forEach(section => section.classList.remove('active'));
            
            // Загружаем содержимое секции
            loadSettingsContent(categoryId);
        });
    });
    
    // Загружаем начальную секцию
    loadSettingsContent('personalization');
}

function loadSettingsContent(categoryId) {
    const content = document.getElementById('settingsContent');
    
    let html = '';
    
    switch(categoryId) {
        case 'personalization':
            html = `
                <div class="settings-section active">
                    <h3>Персонализация</h3>
                    <div class="setting-item">
                        <div class="setting-info">
                            <div class="setting-title">Тема оформления</div>
                            <div class="setting-desc">Выберите тему оформления</div>
                        </div>
                        <select class="setting-control" onchange="changeTheme(this.value)">
                            <option value="light">Светлая</option>
                            <option value="dark">Темная</option>
                            <option value="blue">Синяя</option>
                            <option value="green">Зеленая</option>
                            <option value="purple">Фиолетовая</option>
                        </select>
                    </div>
                    <div class="setting-item">
                        <div class="setting-info">
                            <div class="setting-title">Цвет акцента</div>
                            <div class="setting-desc">Основной цвет системы</div>
                        </div>
                        <input type="color" class="setting-control" id="accentColorSetting" value="#0078d7" onchange="changeAccentColor(this.value)">
                    </div>
                    <div class="setting-item">
                        <div class="setting-info">
                            <div class="setting-title">Размер иконок</div>
                            <div class="setting-desc">Размер иконок на рабочем столе</div>
                        </div>
                        <select class="setting-control" onchange="changeDesktopIconSize(this.value)">
                            <option value="small">Маленькие</option>
                            <option value="medium" selected>Средние</option>
                            <option value="large">Большие</option>
                        </select>
                    </div>
                    <div class="setting-item">
                        <div class="setting-info">
                            <div class="setting-title">Положение панели задач</div>
                            <div class="setting-desc">Где будет расположена панель задач</div>
                        </div>
                        <select class="setting-control" onchange="changeTaskbarPosition(this.value)">
                            <option value="bottom">Снизу</option>
                            <option value="top">Сверху</option>
                            <option value="left">Слева</option>
                            <option value="right">Справа</option>
                        </select>
                    </div>
                    <div class="setting-item">
                        <div class="setting-info">
                            <div class="setting-title">Обои</div>
                            <div class="setting-desc">Выберите обои рабочего стола</div>
                        </div>
                        <button class="setting-btn" onclick="openWallpaperPicker()">Выбрать</button>
                    </div>
                </div>
            `;
            break;
            
        case 'account':
            html = `
                <div class="settings-section active">
                    <h3>Аккаунт</h3>
                    <div class="account-settings">
                        <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 30px;">
                            <img src="${sidUser ? sidUser.avatar : 'https://i.ibb.co/HT71Ghdd/photo-output.png'}" style="width: 80px; height: 80px; border-radius: 50%; border: 3px solid var(--accent-color);">
                            <div>
                                <h4 style="margin-bottom: 5px;">${currentUser.name}</h4>
                                <p style="color: var(--text-secondary);">${sidUser ? sidUser.email : 'user@soiav.local'}</p>
                            </div>
                        </div>
                        
                        <div class="setting-item">
                            <div class="setting-info">
                                <div class="setting-title">Имя пользователя</div>
                                <div class="setting-desc">Измените отображаемое имя</div>
                            </div>
                            <input type="text" class="setting-control" value="${currentUser.name}" onchange="updateUserName(this.value)">
                        </div>
                        
                        <div class="setting-item">
                            <div class="setting-info">
                                <div class="setting-title">SID аккаунт</div>
                                <div class="setting-desc">Управление облачным аккаунтом</div>
                            </div>
                            ${sidUser ? 
                                '<button class="setting-btn" onclick="manageSidAccount()">Управлять</button>' : 
                                '<button class="setting-btn" onclick="loginSid()">Войти</button>'}
                        </div>
                        
                        <div class="setting-item">
                            <div class="setting-info">
                                <div class="setting-title">Синхронизация</div>
                                <div class="setting-desc">Синхронизировать настройки и файлы</div>
                            </div>
                            <button class="setting-btn" onclick="syncAll()">Синхр.</button>
                        </div>
                    </div>
                </div>
            `;
            break;
            
        case 'system':
            html = `
                <div class="settings-section active">
                    <h3>Система</h3>
                    <div class="setting-item">
                        <div class="setting-info">
                            <div class="setting-title">Имя компьютера</div>
                            <div class="setting-desc">SOIAV-DESKTOP</div>
                        </div>
                        <button class="setting-btn" onclick="changeComputerName()">Изменить</button>
                    </div>
                    <div class="setting-item">
                        <div class="setting-info">
                            <div class="setting-title">Производительность</div>
                            <div class="setting-desc">Режим электропитания</div>
                        </div>
                        <select class="setting-control" onchange="changePerformanceMode(this.value)">
                            <option value="balanced">Сбалансированный</option>
                            <option value="performance">Высокая</option>
                            <option value="powersave">Экономия</option>
                        </select>
                    </div>
                    <div class="setting-item">
                        <div class="setting-info">
                            <div class="setting-title">Системный диск</div>
                            <div class="setting-desc">Выберите диск для установки</div>
                        </div>
                        <select class="setting-control" id="systemDiskSetting">
                            <option value="C">Диск C: (SSD 512GB)</option>
                            <option value="D">Диск D: (HDD 2TB)</option>
                            <option value="E">Диск E: (Облачное)</option>
                        </select>
                    </div>
                    <div class="setting-item">
                        <div class="setting-info">
                            <div class="setting-title">Часовой пояс</div>
                            <div class="setting-desc">Москва (UTC+3)</div>
                        </div>
                        <select class="setting-control" onchange="changeTimezone(this.value)">
                            <option value="moscow">Москва (UTC+3)</option>
                            <option value="london">Лондон (UTC+0)</option>
                            <option value="newyork">Нью-Йорк (UTC-5)</option>
                            <option value="tokyo">Токио (UTC+9)</option>
                        </select>
                    </div>
                </div>
            `;
            break;
            
        case 'sync':
            html = `
                <div class="settings-section active">
                    <h3>Синхронизация</h3>
                    <div class="setting-item">
                        <div class="setting-info">
                            <div class="setting-title">SID Cloud</div>
                            <div class="setting-desc">Облачное хранилище и синхронизация</div>
                        </div>
                        <div class="toggle-switch ${syncEnabled ? 'active' : ''}" onclick="toggleSync()"></div>
                    </div>
                    <div class="setting-item">
                        <div class="setting-info">
                            <div class="setting-title">Синхронизировать файлы</div>
                            <div class="setting-desc">Автоматическая синхронизация файлов</div>
                        </div>
                        <input type="checkbox" checked onchange="toggleFileSync(this.checked)">
                    </div>
                    <div class="setting-item">
                        <div class="setting-info">
                            <div class="setting-title">Синхронизировать настройки</div>
                            <div class="setting-desc">Синхронизация настроек системы</div>
                        </div>
                        <input type="checkbox" checked onchange="toggleSettingsSync(this.checked)">
                    </div>
                    <div class="setting-item">
                        <div class="setting-info">
                            <div class="setting-title">Последняя синхронизация</div>
                            <div class="setting-desc">${new Date().toLocaleString()}</div>
                        </div>
                        <button class="setting-btn" onclick="syncAll()">Синхр.</button>
                    </div>
                    <div class="sync-status" style="margin-top: 20px; padding: 15px; background: var(--background-primary); border-radius: 16px;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <i class="fas fa-cloud" style="color: var(--accent-color); font-size: 24px;"></i>
                            <div>
                                <div style="font-weight: 600;">SID Cloud</div>
                                <div style="font-size: 12px; color: var(--text-secondary);">Подключено • 2.3 GB из 15 GB</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            break;
            
        case 'devices':
            html = `
                <div class="settings-section active">
                    <h3>Устройства</h3>
                    <div class="setting-item">
                        <div class="setting-info">
                            <div class="setting-title">Bluetooth</div>
                            <div class="setting-desc">Управление Bluetooth устройствами</div>
                        </div>
                        <button class="setting-btn" onclick="manageBluetooth()">Управлять</button>
                    </div>
                    <div class="setting-item">
                        <div class="setting-info">
                            <div class="setting-title">Принтеры</div>
                            <div class="setting-desc">Добавление и настройка принтеров</div>
                        </div>
                        <button class="setting-btn" onclick="managePrinters()">Настроить</button>
                    </div>
                    <div class="setting-item">
                        <div class="setting-info">
                            <div class="setting-title">Мышь</div>
                            <div class="setting-desc">Настройка указателя</div>
                        </div>
                        <button class="setting-btn" onclick="manageMouse()">Настроить</button>
                    </div>
                    <div class="setting-item">
                        <div class="setting-info">
                            <div class="setting-title">Клавиатура</div>
                            <div class="setting-desc">Раскладка и сочетания</div>
                        </div>
                        <button class="setting-btn" onclick="manageKeyboard()">Настроить</button>
                    </div>
                    <div class="setting-item">
                        <div class="setting-info">
                            <div class="setting-title">Звук</div>
                            <div class="setting-desc">Настройка звука</div>
                        </div>
                        <button class="setting-btn" onclick="manageSound()">Настроить</button>
                    </div>
                </div>
            `;
            break;
            
        case 'apps':
            html = `
                <div class="settings-section active">
                    <h3>Приложения</h3>
                    <div class="setting-item">
                        <div class="setting-info">
                            <div class="setting-title">Установленные приложения</div>
                            <div class="setting-desc">Список установленных приложений</div>
                        </div>
                        <button class="setting-btn" onclick="openApp('store')">Управлять</button>
                    </div>
                    <div class="setting-item">
                        <div class="setting-info">
                            <div class="setting-title">Приложения по умолчанию</div>
                            <div class="setting-desc">Выбор программ по умолчанию</div>
                        </div>
                        <button class="setting-btn">Настроить</button>
                    </div>
                    <div class="setting-item">
                        <div class="setting-info">
                            <div class="setting-title">SSAP приложения</div>
                            <div class="setting-desc">Управление SSAP приложениями</div>
                        </div>
                        <button class="setting-btn" onclick="openApp('ssapCompiler')">Открыть</button>
                    </div>
                </div>
            `;
            break;
            
        case 'updates':
            html = `
                <div class="settings-section active">
                    <h3>Обновления</h3>
                    <div class="setting-item">
                        <div class="setting-info">
                            <div class="setting-title">Проверка обновлений</div>
                            <div class="setting-desc">Последняя проверка: сегодня</div>
                        </div>
                        <button class="setting-btn" onclick="checkForUpdates()">Проверить</button>
                    </div>
                    <div class="setting-item">
                        <div class="setting-info">
                            <div class="setting-title">Автоматические обновления</div>
                            <div class="setting-desc">Включено</div>
                        </div>
                        <button class="setting-btn">Настроить</button>
                    </div>
                    <div class="update-info" style="margin-top: 20px; padding: 15px; background: var(--background-primary); border-radius: 16px;">
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <img src="https://i.ibb.co/x8sWmNMy/photo-output.png" style="width: 40px; height: 40px;">
                            <div>
                                <div style="font-weight: 600;">Soiav 2 build 6002</div>
                                <div style="font-size: 12px; color: var(--text-secondary);">Установлена последняя версия</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            break;
            
        case 'developer':
            html = `
                <div class="settings-section active">
                    <h3>Для разработчиков</h3>
                    <div class="setting-item">
                        <div class="setting-info">
                            <div class="setting-title">Режим разработчика</div>
                            <div class="setting-desc">Включить расширенные функции</div>
                        </div>
                        <div class="toggle-switch" onclick="toggleDeveloperMode()"></div>
                    </div>
                    <div class="setting-item">
                        <div class="setting-info">
                            <div class="setting-title">SSAP компилятор</div>
                            <div class="setting-desc">Компиляция SSAP приложений</div>
                        </div>
                        <button class="setting-btn" onclick="openApp('ssapCompiler')">Открыть</button>
                    </div>
                    <div class="setting-item">
                        <div class="setting-info">
                            <div class="setting-title">Публикация в магазин</div>
                            <div class="setting-desc">Опубликовать приложение</div>
                        </div>
                        <button class="setting-btn" onclick="publishToStore()">Опубликовать</button>
                    </div>
                </div>
            `;
            break;
            
        case 'about':
            html = `
                <div class="settings-section active">
                    <h3>О системе</h3>
                    <div class="about-info" style="background: var(--background-primary); padding: 30px; border-radius: 20px; text-align: center;">
                        <div class="setup-logo" style="margin: 0 auto 20px;">
                            <i class="fas fa-star"></i>
                        </div>
                        <h2 style="color: var(--accent-color); margin-bottom: 10px;">Soiav 2 RTM</h2>
                        <p style="color: var(--text-secondary); margin-bottom: 20px;">build 5992</p>
                        <div style="line-height: 2; text-align: left;">
                            <p><strong>Версия:</strong> 2.0.6002</p>
                            <p><strong>Сборка:</strong> RTM (Release to Manufacturing)</p>
                            <p><strong>Дата выпуска:</strong> Май 2026</p>
                            <p><strong>Разработчик:</strong> Soiav Systems</p>
                            <p><strong>Платформа:</strong> Soiav OS</p>
                            <p><strong>Тип системы:</strong> 64-разрядная</p>
                            <p><strong>© 2026 Soiav Systems. Все права защищены.</strong></p>
                        </div>
                    </div>
                </div>
            `;
            break;
    }
    
    content.innerHTML = html;
}

function changeTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('soiav-theme', theme);
    updateThemeSelector(theme);
}

function changeAccentColor(color) {
    document.documentElement.style.setProperty('--accent-color', color);
    localStorage.setItem('soiav-accent-color', color);
}

function changeDesktopIconSize(size) {
    desktopIconSize = size;
    applyDesktopIconSize(size);
    localStorage.setItem('soiav-icon-size', size);
    showNotification('Иконки', `Размер изменен на ${getSizeName(size)}`);
}

function changeTaskbarPosition(position) {
    taskbarPosition = position;
    applyTaskbarPosition(position);
    localStorage.setItem('soiav-taskbar-position', position);
    showNotification('Панель задач', `Положение изменено`);
}

function applyTaskbarPosition(position) {
    const taskbar = document.getElementById('taskbar');
    taskbar.dataset.position = position;
    
    const startMenu = document.getElementById('startMenu');
    if (position === 'top') {
        startMenu.style.bottom = 'auto';
        startMenu.style.top = '60px';
    } else if (position === 'bottom') {
        startMenu.style.bottom = '60px';
        startMenu.style.top = 'auto';
    } else if (position === 'left') {
        startMenu.style.bottom = '60px';
        startMenu.style.left = '60px';
    } else if (position === 'right') {
        startMenu.style.bottom = '60px';
        startMenu.style.right = '60px';
        startMenu.style.left = 'auto';
    }
}

function openWallpaperPicker() {
    showNotification('Обои', 'Выберите обои');
    // В реальной версии здесь был бы выбор обоев
    setTimeout(() => {
        const wallpapers = ['1', '2'];
        const randomWallpaper = wallpapers[Math.floor(Math.random() * wallpapers.length)];
        setWallpaper(randomWallpaper);
    }, 1000);
}

function updateUserName(name) {
    if (name) {
        currentUser.name = name;
        updateUserInfo(name);
        localStorage.setItem('soiav-username', name);
        showNotification('Аккаунт', `Имя изменено на ${name}`);
    }
}

function manageSidAccount() {
    showNotification('SID Аккаунт', 'Открытие управления аккаунтом');
}

function changeComputerName() {
    const newName = prompt('Введите новое имя компьютера:', 'SOIAV-DESKTOP');
    if (newName) {
        showNotification('Система', `Имя компьютера изменено на ${newName}`);
    }
}

function changePerformanceMode(mode) {
    const modes = {
        'balanced': 'Сбалансированный',
        'performance': 'Высокая производительность',
        'powersave': 'Энергосбережение'
    };
    showNotification('Производительность', `Режим: ${modes[mode]}`);
    localStorage.setItem('soiav-performance', mode);
}

function changeTimezone(timezone) {
    const timezones = {
        'moscow': 'Москва (UTC+3)',
        'london': 'Лондон (UTC+0)',
        'newyork': 'Нью-Йорк (UTC-5)',
        'tokyo': 'Токио (UTC+9)'
    };
    showNotification('Часовой пояс', `Установлен: ${timezones[timezone]}`);
    localStorage.setItem('soiav-timezone', timezone);
}

function toggleSync() {
    syncEnabled = !syncEnabled;
    const toggle = document.querySelector('#sync .toggle-switch');
    if (toggle) {
        toggle.classList.toggle('active');
    }
    showNotification('Синхронизация', syncEnabled ? 'Включена' : 'Выключена');
}

function toggleFileSync(enabled) {
    showNotification('Синхронизация', `Синхронизация файлов ${enabled ? 'включена' : 'выключена'}`);
}

function toggleSettingsSync(enabled) {
    showNotification('Синхронизация', `Синхронизация настроек ${enabled ? 'включена' : 'выключена'}`);
}

function syncAll() {
    showNotification('Синхронизация', 'Синхронизация данных...');
    setTimeout(() => {
        document.getElementById('syncStatus').textContent = 'Синхронизировано';
        showNotification('Синхронизация', 'Все данные синхронизированы');
    }, 2000);
}

function checkForUpdates() {
    showNotification('Обновления', 'Проверка обновлений...');
    setTimeout(() => {
        showNotification('Обновления', 'Установлена последняя версия build 5992');
    }, 2000);
}

function toggleDeveloperMode() {
    developerMode = !developerMode;
    const toggle = document.querySelector('[data-category="developer"] .toggle-switch');
    if (toggle) {
        toggle.classList.toggle('active');
    }
    showNotification('Режим разработчика', developerMode ? 'Включен' : 'Выключен');
}

function lockScreen() {
    showNotification('Система', 'Экран заблокирован');
    toggleAccountMenu();
}

function logout() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        showNotification('Система', 'Выход из системы...');
        setTimeout(() => {
            localStorage.removeItem('soiav-setup-completed');
            location.reload();
        }, 1000);
    }
}

function showShutdownMenu() {
    showNotification('Питание', 'Выключение или перезагрузка');
}

// ================== БЫСТРЫЕ НАСТРОЙКИ ==================
function toggleWiFi() {
    const toggle = document.getElementById('wifiToggle');
    toggle.classList.toggle('active');
    showNotification('Wi-Fi', toggle.classList.contains('active') ? 'Включено' : 'Выключено');
}

function toggleBluetooth() {
    const toggle = document.getElementById('bluetoothToggle');
    toggle.classList.toggle('active');
    showNotification('Bluetooth', toggle.classList.contains('active') ? 'Включено' : 'Выключено');
}

function toggleAirplane() {
    const toggle = document.getElementById('airplaneToggle');
    toggle.classList.toggle('active');
    showNotification('Режим полета', toggle.classList.contains('active') ? 'Включено' : 'Выключено');
}

function toggleDarkMode() {
    const toggle = document.getElementById('darkModeToggle');
    toggle.classList.toggle('active');
    
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('soiav-theme', newTheme);
    updateThemeSelector(newTheme);
    
    showNotification('Темный режим', newTheme === 'dark' ? 'Включен' : 'Выключен');
}

// ================== УСТРОЙСТВА ==================
function manageBluetooth() {
    showNotification('Bluetooth', 'Открытие менеджера Bluetooth устройств...');
    
    const devices = [
        { name: 'Наушники Sony', type: 'audio', status: 'connected' },
        { name: 'Мышь Logitech', type: 'mouse', status: 'connected' },
        { name: 'Клавиатура Microsoft', type: 'keyboard', status: 'available' },
        { name: 'Телефон Samsung', type: 'phone', status: 'offline' }
    ];
    
    setTimeout(() => {
        showDeviceManager('Bluetooth устройства', devices);
    }, 1000);
}

function managePrinters() {
    showNotification('Принтеры', 'Открытие менеджера принтеров...');
    
    const printers = [
        { name: 'HP LaserJet Pro', type: 'printer', status: 'online' },
        { name: 'Canon PIXMA', type: 'printer', status: 'offline' },
        { name: 'Epson Workforce', type: 'printer', status: 'online' }
    ];
    
    setTimeout(() => {
        showDeviceManager('Принтеры и сканеры', printers);
    }, 1000);
}

function manageMouse() {
    showNotification('Мышь', 'Открытие настроек мыши...');
}

function manageKeyboard() {
    showNotification('Клавиатура', 'Открытие настроек клавиатуры...');
}

function manageSound() {
    showNotification('Звук', 'Открытие настроек звука...');
}

function showDeviceManager(title, devices) {
    const fileViewer = document.getElementById('fileViewer');
    if (!fileViewer) {
        createFileViewerWindow();
    }
    
    const content = document.getElementById('fileViewerContent');
    
    let devicesHTML = '';
    devices.forEach(device => {
        const statusClass = device.status === 'connected' || device.status === 'online' ? '' : 
                           device.status === 'available' ? 'connecting' : 'offline';
        
        devicesHTML += `
            <div class="device-item">
                <div class="device-info">
                    <div class="device-icon">
                        <i class="fas fa-${getDeviceIcon(device.type)}"></i>
                    </div>
                    <div class="device-details">
                        <h4>${device.name}</h4>
                        <p>${getDeviceTypeName(device.type)}</p>
                    </div>
                </div>
                <div class="device-status">
                    <div class="status-indicator ${statusClass}"></div>
                    <span>${getStatusText(device.status)}</span>
                </div>
            </div>
        `;
    });
    
    content.innerHTML = `
        <div class="file-content">
            <h3>${title}</h3>
            <div class="device-list">
                ${devicesHTML}
            </div>
            <div style="margin-top: 20px;">
                <button class="setting-btn" onclick="scanForDevices()">
                    <i class="fas fa-sync-alt"></i> Обновить список
                </button>
                <button class="setting-btn" onclick="addNewDevice()">
                    <i class="fas fa-plus"></i> Добавить устройство
                </button>
            </div>
        </div>
    `;
    
    document.querySelector('#fileViewer .window-header span').innerHTML = `<i class="fas fa-plug"></i> ${title}`;
    openApp('fileViewer');
}

function getDeviceIcon(type) {
    const icons = {
        'audio': 'headphones',
        'mouse': 'mouse',
        'keyboard': 'keyboard',
        'phone': 'mobile-alt',
        'printer': 'print'
    };
    return icons[type] || 'plug';
}

function getDeviceTypeName(type) {
    const names = {
        'audio': 'Аудио устройство',
        'mouse': 'Мышь',
        'keyboard': 'Клавиатура',
        'phone': 'Телефон',
        'printer': 'Принтер'
    };
    return names[type] || 'Устройство';
}

function getStatusText(status) {
    const texts = {
        'connected': 'Подключено',
        'available': 'Доступно',
        'offline': 'Не в сети',
        'online': 'В сети'
    };
    return texts[status] || status;
}

function scanForDevices() {
    showNotification('Поиск', 'Сканирование устройств...');
    setTimeout(() => {
        showNotification('Поиск', 'Новые устройства не найдены');
    }, 2000);
}

function addNewDevice() {
    showNotification('Добавление', 'Открытие мастера добавления устройств...');
}

// ================== УВЕДОМЛЕНИЯ ==================
function showNotification(title, text) {
    console.log(`Уведомление: ${title} - ${text}`);
    
    // Добавляем в список уведомлений
    const notification = {
        id: Date.now(),
        title: title,
        text: text,
        time: new Date().toLocaleTimeString(),
        read: false
    };
    
    notifications.unshift(notification);
    updateNotificationBadge();
    updateNotificationsList();
    
    // Показываем всплывающее уведомление
    const popup = document.createElement('div');
    popup.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--background-secondary);
        color: var(--text-primary);
        padding: 12px 16px;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        border-left: 4px solid var(--accent-color);
        z-index: 10000;
        max-width: 280px;
        animation: slideInRight 0.3s ease;
        backdrop-filter: var(--blur);
    `;
    popup.innerHTML = `
        <strong>${title}</strong><br>
        <span style="font-size: 11px; color: var(--text-secondary);">${text}</span>
    `;
    
    document.body.appendChild(popup);
    
    setTimeout(() => {
        popup.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (popup.parentNode) {
                popup.parentNode.removeChild(popup);
            }
        }, 300);
    }, 3000);
}

function updateNotificationBadge() {
    const unreadCount = notifications.filter(n => !n.read).length;
    const badge = document.getElementById('notificationBadge');
    if (badge) {
        badge.textContent = unreadCount;
        badge.style.display = unreadCount > 0 ? 'flex' : 'none';
    }
}

function updateNotificationsList() {
    const list = document.getElementById('notificationsList');
    if (!list) return;
    
    let html = '';
    notifications.slice(0, 5).forEach(notif => {
        html += `
            <div class="notification" onclick="markNotificationRead(${notif.id})">
                <div class="notification-icon"><i class="fas fa-bell"></i></div>
                <div class="notification-content">
                    <div class="notification-title">${notif.title}</div>
                    <div class="notification-text">${notif.text}</div>
                    <div style="font-size: 10px; color: var(--text-secondary); margin-top: 4px;">${notif.time}</div>
                </div>
            </div>
        `;
    });
    
    if (notifications.length === 0) {
        html = '<div style="text-align: center; padding: 30px; color: var(--text-secondary);">Нет уведомлений</div>';
    }
    
    list.innerHTML = html;
}

function markNotificationRead(id) {
    const notif = notifications.find(n => n.id === id);
    if (notif) {
        notif.read = true;
        updateNotificationBadge();
        updateNotificationsList();
    }
}

function addSampleNotifications() {
    notifications.push({
        id: 1,
        title: 'Добро пожаловать!',
        text: 'Soiav 2 build 5992 успешно установлена',
        time: new Date().toLocaleTimeString(),
        read: false
    });
    
    notifications.push({
        id: 2,
        title: 'SID Cloud',
        text: 'Синхронизация настроек завершена',
        time: new Date().toLocaleTimeString(),
        read: false
    });
    
    updateNotificationBadge();
    updateNotificationsList();
}

// ================== ВРЕМЯ И КАЛЕНДАРЬ ==================
function updateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
    });
    const dateString = now.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    
    const currentTime = document.getElementById('currentTime');
    const currentDate = document.getElementById('currentDate');
    
    if (currentTime) currentTime.textContent = timeString;
    if (currentDate) currentDate.textContent = dateString;
}

function initializeCalendar() {
    updateCalendar();
}

function updateCalendar() {
    const calendarMonth = document.getElementById('calendarMonth');
    const calendarDays = document.getElementById('calendarDays');
    
    if (!calendarMonth || !calendarDays) return;
    
    const monthNames = [
        'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];
    
    calendarMonth.textContent = `${monthNames[currentCalendarMonth]} ${currentCalendarYear}`;
    
    const firstDay = new Date(currentCalendarYear, currentCalendarMonth, 1);
    const lastDay = new Date(currentCalendarYear, currentCalendarMonth + 1, 0);
    const today = new Date();
    
    let daysHtml = '';
    const startingDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    
    for (let i = 0; i < startingDay; i++) {
        const prevMonthDay = new Date(currentCalendarYear, currentCalendarMonth, -i);
        daysHtml += `<div class="calendar-day-popup other-month">${prevMonthDay.getDate()}</div>`;
    }
    
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const isToday = day === today.getDate() && 
                       currentCalendarMonth === today.getMonth() && 
                       currentCalendarYear === today.getFullYear();
        const dayClass = isToday ? 'calendar-day-popup current' : 'calendar-day-popup';
        daysHtml += `<div class="${dayClass}">${day}</div>`;
    }
    
    const totalCells = 42;
    const remainingCells = totalCells - (startingDay + lastDay.getDate());
    
    for (let i = 1; i <= remainingCells; i++) {
        daysHtml += `<div class="calendar-day-popup other-month">${i}</div>`;
    }
    
    calendarDays.innerHTML = daysHtml;
}

function changeCalendarMonth(direction) {
    currentCalendarMonth += direction;
    if (currentCalendarMonth < 0) {
        currentCalendarMonth = 11;
        currentCalendarYear--;
    } else if (currentCalendarMonth > 11) {
        currentCalendarMonth = 0;
        currentCalendarYear++;
    }
    updateCalendar();
}

function initializeAppCalendar() {
    updateAppCalendar();
}

function updateAppCalendar() {
    const appCalendarMonth = document.getElementById('appCalendarMonth');
    const appCalendarDays = document.getElementById('appCalendarDays');
    
    if (!appCalendarMonth || !appCalendarDays) return;
    
    const monthNames = [
        'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];
    
    appCalendarMonth.textContent = `${monthNames[currentAppCalendarMonth]} ${currentAppCalendarYear}`;
    
    const firstDay = new Date(currentAppCalendarYear, currentAppCalendarMonth, 1);
    const lastDay = new Date(currentAppCalendarYear, currentAppCalendarMonth + 1, 0);
    const today = new Date();
    
    let daysHtml = '';
    const startingDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    
    for (let i = 0; i < startingDay; i++) {
        const prevMonthDay = new Date(currentAppCalendarYear, currentAppCalendarMonth, -i);
        daysHtml += `<div class="calendar-day other-month">${prevMonthDay.getDate()}</div>`;
    }
    
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const isToday = day === today.getDate() && 
                       currentAppCalendarMonth === today.getMonth() && 
                       currentAppCalendarYear === today.getFullYear();
        const dayClass = isToday ? 'calendar-day current' : 'calendar-day';
        daysHtml += `<div class="${dayClass}">${day}</div>`;
    }
    
    const totalCells = 42;
    const remainingCells = totalCells - (startingDay + lastDay.getDate());
    
    for (let i = 1; i <= remainingCells; i++) {
        daysHtml += `<div class="calendar-day other-month">${i}</div>`;
    }
    
    appCalendarDays.innerHTML = daysHtml;
}

function changeAppCalendarMonth(direction) {
    currentAppCalendarMonth += direction;
    if (currentAppCalendarMonth < 0) {
        currentAppCalendarMonth = 11;
        currentAppCalendarYear--;
    } else if (currentAppCalendarMonth > 11) {
        currentAppCalendarMonth = 0;
        currentAppCalendarYear++;
    }
    updateAppCalendar();
}

// ================== ПРИЛОЖЕНИЯ И МАГАЗИН ==================
function loadApps() {
    apps = [
        {
            id: 'calculator',
            title: 'Калькулятор',
            description: 'Простой и удобный калькулятор',
            icon: 'fas fa-calculator',
            category: 'utilities',
            size: '2.3 MB',
            rating: 4.5,
            installed: true,
            isNew: false
        },
        {
            id: 'snake',
            title: 'Змейка',
            description: 'Классическая игра змейка',
            icon: 'fas fa-gamepad',
            category: 'games',
            size: '1.8 MB',
            rating: 4.8,
            installed: true,
            isNew: false
        },
        {
            id: 'tetris',
            title: 'Тетрис',
            description: 'Классический тетрис',
            icon: 'fas fa-th-large',
            category: 'games',
            size: '2.1 MB',
            rating: 4.9,
            installed: false,
            isNew: true
        },
        {
            id: 'minesweeper',
            title: 'Сапер',
            description: 'Классический сапер',
            icon: 'fas fa-flag',
            category: 'games',
            size: '1.5 MB',
            rating: 4.3,
            installed: false,
            isNew: false
        },
        {
            id: 'chess',
            title: 'Шахматы',
            description: 'Классические шахматы',
            icon: 'fas fa-chess',
            category: 'games',
            size: '3.4 MB',
            rating: 4.7,
            installed: false,
            isNew: true
        },
        {
            id: 'ssapdev',
            title: 'SSAP Dev Tools',
            description: 'Инструменты для разработки',
            icon: 'fas fa-code',
            category: 'dev',
            size: '5.2 MB',
            rating: 4.9,
            installed: true,
            isNew: true
        },
        {
            id: 'webbrowser',
            title: 'Soiav Browser',
            description: 'Быстрый браузер',
            icon: 'fas fa-globe',
            category: 'apps',
            size: '8.7 MB',
            rating: 4.8,
            installed: true,
            isNew: false
        },
        {
            id: 'mailapp',
            title: 'Soiav Mail',
            description: 'Почтовый клиент',
            icon: 'fas fa-envelope',
            category: 'apps',
            size: '4.3 MB',
            rating: 4.6,
            installed: true,
            isNew: false
        }
    ];
    
    renderApps();
}

function renderApps() {
    const appsGrid = document.getElementById('appsGrid');
    if (!appsGrid) return;
    
    appsGrid.innerHTML = '';
    
    apps.forEach(app => {
        const appCard = document.createElement('div');
        appCard.className = 'app-card';
        appCard.innerHTML = `
            ${app.isNew ? '<div class="new-badge">Новый</div>' : ''}
            <div class="app-icon">
                <i class="${app.icon}"></i>
            </div>
            <div class="app-title">${app.title}</div>
            <div class="app-desc">${app.description}</div>
            <div class="app-meta">
                <span>${app.size}</span>
                <span>★ ${app.rating}</span>
            </div>
            <button class="install-btn ${app.installed ? 'installed' : ''}" 
                    onclick="installApp('${app.id}')">
                ${app.installed ? 'Установлено' : 'Установить'}
            </button>
        `;
        appsGrid.appendChild(appCard);
    });
}

function filterApps(category) {
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
    
    // Здесь можно реализовать фильтрацию
    showNotification('Магазин', `Категория: ${category}`);
}

function installApp(appId) {
    const app = apps.find(a => a.id === appId);
    if (app && !app.installed) {
        app.installed = true;
        installedApps.add(appId);
        renderApps();
        
        createDesktopIcon(app);
        
        showNotification('Установка', `Приложение "${app.title}" успешно установлено!`);
    } else if (app && app.installed) {
        showNotification('Установка', `Приложение "${app.title}" уже установлено`);
    }
}

function createDesktopIcon(app) {
    const desktopIcons = document.querySelector('.desktop-icons');
    if (!desktopIcons) return;
    
    // Проверяем, нет ли уже такой иконки
    if (document.querySelector(`.desktop-icon[data-app="${app.id}"]`)) {
        return;
    }
    
    const icon = document.createElement('div');
    icon.className = 'desktop-icon';
    icon.setAttribute('data-app', app.id);
    
    // Используем img для приложений с кастомными иконками, иначе fa
    if (app.id === 'mailapp') {
        icon.innerHTML = `<img src="https://i.ibb.co/39h7Yjqs/photo-output.png" alt="${app.title}"><span>${app.title}</span>`;
    } else if (app.id === 'webbrowser') {
        icon.innerHTML = `<img src="https://i.ibb.co/Rkk0W5Nz/photo-output.png" alt="${app.title}"><span>${app.title}</span>`;
    } else {
        icon.innerHTML = `<i class="${app.icon}"></i><span>${app.title}</span>`;
    }
    
    icon.onclick = () => openApp(app.id);
    desktopIcons.appendChild(icon);
}

// ================== ФАЙЛЫ И ДОКУМЕНТЫ ==================
function loadSampleFiles() {
    files = [
        { name: 'Документ.txt', type: 'txt', size: '1.2 KB', date: new Date() },
        { name: 'Изображение.jpg', type: 'jpg', size: '245 KB', date: new Date() },
        { name: 'Музыка.mp3', type: 'mp3', size: '3.4 MB', date: new Date() },
        { name: 'Видео.mp4', type: 'mp4', size: '15.2 MB', date: new Date() },
        { name: 'Архив.zip', type: 'zip', size: '8.7 MB', date: new Date() }
    ];
}

function openFile(filename) {
    if (filename === 'documents' || filename === 'images' || filename === 'downloads' || 
        filename === 'music' || filename === 'videos' || filename === 'cloud') {
        showNotification('Проводник', `Открыта папка: ${filename}`);
        updateFileGrid(filename);
    } else {
        openFileViewer(filename);
    }
}

function openFolder(folderName) {
    showNotification('Проводник', `Открыта папка: ${folderName}`);
    document.getElementById('addressBar').textContent = `Этот компьютер > ${folderName}`;
}

function updateFileGrid(folder) {
    const fileGrid = document.getElementById('fileGrid');
    if (!fileGrid) return;
    
    let files = [];
    
    if (folder === 'cloud') {
        files = [
            { name: 'Документы SID', type: 'folder', icon: 'fas fa-folder' },
            { name: 'Фото SID', type: 'folder', icon: 'fas fa-folder' },
            { name: 'Резервная копия.ssap', type: 'ssap', icon: 'fas fa-code' }
        ];
    } else {
        files = [
            { name: 'Отчет.docx', type: 'doc', icon: 'fas fa-file-word' },
            { name: 'Презентация.pptx', type: 'ppt', icon: 'fas fa-file-powerpoint' },
            { name: 'Таблица.xlsx', type: 'xls', icon: 'fas fa-file-excel' },
            { name: 'Заметки.txt', type: 'txt', icon: 'fas fa-file-alt' }
        ];
    }
    
    let html = '';
    files.forEach(file => {
        html += `
            <div class="file-item" onclick="openFile('${file.name}')">
                <i class="${file.icon}"></i>
                <span>${file.name}</span>
            </div>
        `;
    });
    
    fileGrid.innerHTML = html;
}

function navigateBack() {
    showNotification('Проводник', 'Навигация назад');
}

function navigateForward() {
    showNotification('Проводник', 'Навигация вперед');
}

function navigateUp() {
    showNotification('Проводник', 'На уровень вверх');
}

function createNewFolder() {
    const name = prompt('Введите имя новой папки:', 'Новая папка');
    if (name) {
        showNotification('Проводник', `Папка "${name}" создана`);
    }
}

function syncFiles() {
    showNotification('Синхронизация', 'Синхронизация файлов с SID Cloud...');
    setTimeout(() => {
        showNotification('Синхронизация', 'Файлы синхронизированы');
    }, 2000);
}

function openFileViewer(filename) {
    const fileViewer = document.getElementById('fileViewer');
    if (!fileViewer) {
        createFileViewerWindow();
    }
    
    const fileViewerContent = document.getElementById('fileViewerContent');
    
    let content = '';
    let title = '';
    
    switch (filename) {
        case 'document.txt':
        case 'Документ.txt':
            title = 'Документ.txt';
            content = `
                <div class="file-content">
                    <h3>Содержимое документа</h3>
                    <p>Это пример текстового документа в системе Soiav 2 RTM.</p>
                    <p>Вы можете создавать, редактировать и сохранять текстовые файлы.</p>
                    <p>Soiav 2 build 5992 поддерживает работу с различными форматами файлов.</p>
                    <p>Дата создания: ${new Date().toLocaleDateString('ru-RU')}</p>
                    <p>Автор: ${currentUser.name}</p>
                </div>
            `;
            break;
        case 'image.jpg':
        case 'Изображение.jpg':
            title = 'Изображение.jpg';
            content = `
                <div class="file-content">
                    <h3>Просмотр изображения</h3>
                    <div style="background: var(--background-primary); padding: 30px; border-radius: 16px; text-align: center;">
                        <img src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4" style="max-width: 100%; max-height: 300px; border-radius: 12px;">
                    </div>
                    <p style="margin-top: 15px;">Размер: 2.4 MB<br>Разрешение: 1920x1080</p>
                </div>
            `;
            break;
        case 'music.mp3':
        case 'Музыка.mp3':
            title = 'Музыка.mp3';
            content = `
                <div class="file-content">
                    <h3>Аудио файл</h3>
                    <div style="background: var(--background-primary); padding: 30px; border-radius: 16px; text-align: center;">
                        <i class="fas fa-music" style="font-size: 48px; color: var(--accent-color); margin-bottom: 15px;"></i>
                        <p>Сейчас воспроизводится: Неизвестный исполнитель - Трек 1</p>
                        <div style="margin-top: 20px;">
                            <button class="toolbar-btn"><i class="fas fa-play"></i></button>
                            <button class="toolbar-btn"><i class="fas fa-pause"></i></button>
                            <button class="toolbar-btn"><i class="fas fa-stop"></i></button>
                        </div>
                    </div>
                    <p style="margin-top: 15px;">Формат: MP3<br>Длительность: 3:45<br>Битрейт: 320 kbps</p>
                </div>
            `;
            break;
        default:
            title = filename;
            content = `
                <div class="file-content">
                    <h3>Файл: ${filename}</h3>
                    <p>Тип файла: Документ</p>
                    <p>Размер: 1.2 KB</p>
                    <p>Дата изменения: ${new Date().toLocaleDateString('ru-RU')}</p>
                    <button class="setting-btn" style="margin-top: 15px;" onclick="editFile('${filename}')">
                        <i class="fas fa-edit"></i> Редактировать
                    </button>
                </div>
            `;
    }
    
    document.querySelector('#fileViewer .window-header span').innerHTML = `<i class="fas fa-file"></i> ${title}`;
    fileViewerContent.innerHTML = content;
    openApp('fileViewer');
}

function editFile(filename) {
    showNotification('Редактор', `Открыт файл: ${filename} для редактирования`);
}

// ================== ПОЧТА ==================
function selectMailFolder(folder) {
    document.querySelectorAll('.folder').forEach(f => f.classList.remove('active'));
    event.currentTarget.classList.add('active');
    
    const mailList = document.getElementById('mailList');
    
    let mails = [];
    
    if (folder === 'inbox') {
        mails = [
            { sender: 'Команда Soiav', subject: 'Добро пожаловать в Soiav 2 RTM!', date: 'Сегодня', unread: true },
            { sender: 'SID Cloud', subject: 'Синхронизация завершена', date: 'Вчера', unread: false },
            { sender: 'Система', subject: 'Обновление безопасности', date: 'Вчера', unread: false },
            { sender: 'Магазин', subject: 'Новые приложения доступны', date: '2 дня назад', unread: true }
        ];
    } else if (folder === 'sent') {
        mails = [
            { sender: 'Я', subject: 'Отправленное письмо 1', date: 'Вчера', unread: false },
            { sender: 'Я', subject: 'Отправленное письмо 2', date: '3 дня назад', unread: false }
        ];
    } else if (folder === 'drafts') {
        mails = [
            { sender: 'Черновик', subject: 'Новое письмо', date: 'Сегодня', unread: false },
            { sender: 'Черновик', subject: 'Ответ клиенту', date: 'Вчера', unread: false }
        ];
    } else {
        mails = [];
    }
    
    let html = '';
    mails.forEach(mail => {
        html += `
            <div class="mail-item ${mail.unread ? 'unread' : ''}">
                <div class="mail-sender">${mail.sender}</div>
                <div class="mail-subject">${mail.subject}</div>
                <div class="mail-date">${mail.date}</div>
            </div>
        `;
    });
    
    if (mails.length === 0) {
        html = '<div style="text-align: center; padding: 30px; color: var(--text-secondary);">Нет писем</div>';
    }
    
    mailList.innerHTML = html;
}

// ================== ФОТО ==================
function importPhotos() {
    showNotification('Фото', 'Импорт фотографий...');
}

function syncPhotos() {
    showNotification('Фото', 'Синхронизация с SID Cloud...');
}

function createAlbum() {
    const name = prompt('Введите название альбома:');
    if (name) {
        showNotification('Фото', `Альбом "${name}" создан`);
    }
}

function openPhoto(photoId) {
    showNotification('Фото', `Открыто изображение: ${photoId}`);
}

// ================== ПОГОДА ==================
function searchWeather() {
    const city = document.getElementById('weatherCity').value;
    if (city) {
        showNotification('Погода', `Поиск погоды в городе: ${city}`);
        updateWeatherData(city);
    }
}

function updateWeatherData(city) {
    const weatherCurrent = document.getElementById('weatherCurrent');
    const weatherForecast = document.getElementById('weatherForecast');
    
    weatherCurrent.innerHTML = `
        <div class="weather-icon">
            <i class="fas fa-sun"></i>
        </div>
        <div class="weather-info">
            <div class="weather-temp">+23°C</div>
            <div class="weather-desc">Солнечно</div>
            <div class="weather-location">${city || 'Москва'}, Россия</div>
        </div>
    `;
    
    weatherForecast.innerHTML = `
        <div class="forecast-day">
            <div>Завтра</div>
            <i class="fas fa-cloud-sun"></i>
            <div>+21°C</div>
        </div>
        <div class="forecast-day">
            <div>Ср</div>
            <i class="fas fa-cloud-rain"></i>
            <div>+18°C</div>
        </div>
        <div class="forecast-day">
            <div>Чт</div>
            <i class="fas fa-cloud"></i>
            <div>+19°C</div>
        </div>
        <div class="forecast-day">
            <div>Пт</div>
            <i class="fas fa-sun"></i>
            <div>+22°C</div>
        </div>
        <div class="forecast-day">
            <div>Сб</div>
            <i class="fas fa-sun"></i>
            <div>+24°C</div>
        </div>
        <div class="forecast-day">
            <div>Вс</div>
            <i class="fas fa-cloud-sun"></i>
            <div>+20°C</div>
        </div>
    `;
}

// ================== МУЗЫКА ==================
function playTrack(trackId) {
    const nowPlaying = document.querySelector('.now-playing');
    const trackTitle = nowPlaying.querySelector('.track-title');
    const trackArtist = nowPlaying.querySelector('.track-artist');
    
    trackTitle.textContent = 'Композиция ' + trackId.slice(-1);
    trackArtist.textContent = 'Исполнитель';
    
    showNotification('Музыка', `Воспроизведение: Композиция ${trackId.slice(-1)}`);
}

// ================== БРАУЗЕР ==================
function refreshBrowser() {
    showNotification('Браузер', 'Страница обновляется');
}

function searchWeb() {
    const query = document.getElementById('searchInput').value;
    if (query) {
        showNotification('Браузер', `Поиск: ${query}`);
        document.getElementById('browserUrl').value = `https://search.soiav.com/?q=${encodeURIComponent(query)}`;
    }
}

// ================== ЗАКРЫТИЕ МЕНЮ ПРИ КЛИКЕ ВНЕ ==================
document.addEventListener('click', function(e) {
    if (!e.target.closest('.account-btn') && !e.target.closest('.account-menu')) {
        const accountMenu = document.getElementById('accountMenu');
        if (accountMenu) accountMenu.classList.remove('active');
    }
    
    if (!e.target.closest('.start-btn') && !e.target.closest('.start-menu')) {
        const startMenu = document.getElementById('startMenu');
        if (startMenu) startMenu.classList.remove('active');
    }
    
    if (!e.target.closest('.tray-icon') && !e.target.closest('.notification-center')) {
        const notificationCenter = document.getElementById('notificationCenter');
        if (notificationCenter) notificationCenter.classList.remove('active');
    }
    
    if (!e.target.closest('.tray-icon') && !e.target.closest('.side-menu')) {
        const sideMenu = document.getElementById('sideMenu');
        if (sideMenu) sideMenu.classList.remove('active');
    }
    
    if (!e.target.closest('.time-display') && !e.target.closest('.calendar-popup')) {
        const calendarPopup = document.getElementById('calendarPopup');
        if (calendarPopup) calendarPopup.classList.remove('active');
    }
});

// Добавляем стили для анимаций, если их нет
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
    
    @keyframes startMenuSlide {
        0% {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
        }
        100% {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }
`;
document.head.appendChild(style);
// ================== ФУНКЦИИ ДЛЯ УСТРОЙСТВ (PRINTERS, BLUETOOTH) ==================

// Открыть мастер принтера
function openPrinterWizard() {
    let wizard = document.getElementById('printerWizard');
    if (!wizard) {
        wizard = document.createElement('div');
        wizard.id = 'printerWizard';
        wizard.className = 'printer-wizard';
        wizard.innerHTML = `
            <h2>Добавление принтера</h2>
            <div class="wizard-step" id="printerStep1">
                <h3>Выберите способ подключения</h3>
                <div class="printer-option" onclick="selectPrinterType('usb')">
                    <i class="fas fa-usb"></i>
                    <div>
                        <div style="font-weight: 600;">USB принтер</div>
                        <div style="font-size: 12px; color: var(--text-secondary);">Подключите принтер через USB</div>
                    </div>
                </div>
                <div class="printer-option" onclick="selectPrinterType('network')">
                    <i class="fas fa-wifi"></i>
                    <div>
                        <div style="font-weight: 600;">Сетевой принтер</div>
                        <div style="font-size: 12px; color: var(--text-secondary);">Поиск в локальной сети</div>
                    </div>
                </div>
                <div class="printer-option" onclick="selectPrinterType('bluetooth')">
                    <i class="fas fa-bluetooth"></i>
                    <div>
                        <div style="font-weight: 600;">Bluetooth принтер</div>
                        <div style="font-size: 12px; color: var(--text-secondary);">Беспроводное подключение</div>
                    </div>
                </div>
            </div>
            <div class="setup-buttons" style="margin-top: 20px;">
                <button class="setup-btn secondary" onclick="closePrinterWizard()">Отмена</button>
            </div>
        `;
        document.body.appendChild(wizard);
    }
    wizard.classList.add('active');
}

function closePrinterWizard() {
    const wizard = document.getElementById('printerWizard');
    if (wizard) wizard.classList.remove('active');
}

function selectPrinterType(type) {
    showNotification('Принтер', `Выбран тип: ${type === 'usb' ? 'USB' : type === 'network' ? 'Сетевой' : 'Bluetooth'}`);
    
    const wizard = document.getElementById('printerWizard');
    wizard.innerHTML = `
        <h2>Поиск принтеров...</h2>
        <div style="text-align: center; padding: 30px;">
            <div class="loading-spinner" style="margin: 0 auto 20px;"></div>
            <p>Идет поиск доступных принтеров...</p>
        </div>
    `;
    
    setTimeout(() => {
        const printers = [
            { name: 'HP LaserJet Pro M15w', type: 'laser', status: 'online' },
            { name: 'Canon PIXMA TS3340', type: 'inkjet', status: 'online' },
            { name: 'Epson L3150', type: 'inkjet', status: 'offline' }
        ];
        
        let printersHTML = '<h2>Найденные принтеры</h2>';
        printers.forEach(printer => {
            printersHTML += `
                <div class="printer-item" style="cursor: pointer;" onclick="installPrinter('${printer.name}')">
                    <div class="printer-info">
                        <div class="printer-icon"><i class="fas fa-print"></i></div>
                        <div class="printer-details">
                            <h4>${printer.name}</h4>
                            <p>${printer.type === 'laser' ? 'Лазерный' : 'Струйный'}</p>
                        </div>
                    </div>
                    <div class="printer-status">
                        <span class="status-badge ${printer.status === 'offline' ? 'offline' : ''}">${printer.status === 'online' ? 'В сети' : 'Не в сети'}</span>
                    </div>
                </div>
            `;
        });
        
        printersHTML += `
            <div class="setup-buttons" style="margin-top: 20px;">
                <button class="setup-btn secondary" onclick="closePrinterWizard()">Закрыть</button>
            </div>
        `;
        
        wizard.innerHTML = printersHTML;
    }, 2000);
}

function installPrinter(printerName) {
    showNotification('Принтер', `Установка ${printerName}...`);
    setTimeout(() => {
        showNotification('Принтер', `${printerName} успешно установлен`);
        closePrinterWizard();
    }, 2000);
}

// Bluetooth менеджер
function openBluetoothManager() {
    let manager = document.getElementById('bluetoothManager');
    if (!manager) {
        manager = document.createElement('div');
        manager.id = 'bluetoothManager';
        manager.className = 'printer-wizard';
        manager.style.maxWidth = '600px';
        manager.innerHTML = `
            <div class="bluetooth-header">
                <h2>Bluetooth устройства</h2>
                <div class="bluetooth-toggle">
                    <span>Bluetooth</span>
                    <div class="toggle-switch active" id="bluetoothMainToggle" onclick="toggleBluetoothMain()"></div>
                </div>
            </div>
            <div class="bluetooth-devices" id="bluetoothDevicesList"></div>
            <div style="margin-top: 20px;">
                <button class="setting-btn" onclick="scanBluetoothDevices()">
                    <i class="fas fa-sync-alt"></i> Поиск устройств
                </button>
                <button class="setting-btn secondary" onclick="closeBluetoothManager()">Закрыть</button>
            </div>
        `;
        document.body.appendChild(manager);
    }
    manager.classList.add('active');
    updateBluetoothDevices();
}

function closeBluetoothManager() {
    const manager = document.getElementById('bluetoothManager');
    if (manager) manager.classList.remove('active');
}

function toggleBluetoothMain() {
    const toggle = document.getElementById('bluetoothMainToggle');
    toggle.classList.toggle('active');
    showNotification('Bluetooth', toggle.classList.contains('active') ? 'Включен' : 'Выключен');
    updateBluetoothDevices();
}

function scanBluetoothDevices() {
    showNotification('Bluetooth', 'Поиск устройств...');
    setTimeout(updateBluetoothDevices, 2000);
}

function updateBluetoothDevices() {
    const list = document.getElementById('bluetoothDevicesList');
    if (!list) return;
    
    const devices = [
        { name: 'Sony WH-1000XM4', type: 'headphones', battery: 85, signal: 80, status: 'paired' },
        { name: 'Logitech MX Master 3', type: 'mouse', battery: 45, signal: 95, status: 'paired' },
        { name: 'iPhone 15 Pro', type: 'phone', battery: 60, signal: 70, status: 'available' },
        { name: 'Samsung Galaxy Buds', type: 'earbuds', battery: 30, signal: 50, status: 'available' },
        { name: 'Xbox Controller', type: 'gamepad', battery: 90, signal: 65, status: 'available' }
    ];
    
    let html = '<h3>Сопряженные устройства</h3>';
    
    devices.filter(d => d.status === 'paired').forEach(device => {
        html += `
            <div class="bluetooth-device paired">
                <div class="device-info">
                    <div class="device-icon"><i class="fas fa-${getBluetoothIcon(device.type)}"></i></div>
                    <div>
                        <h4>${device.name}</h4>
                        <div class="device-battery">
                            <i class="fas fa-battery-${getBatteryIcon(device.battery)}"></i>
                            <span>${device.battery}%</span>
                            <span class="device-signal">
                                ${getSignalBars(device.signal)}
                            </span>
                        </div>
                    </div>
                </div>
                <div class="device-actions">
                    <button class="device-action-btn" onclick="disconnectBluetooth('${device.name}')">Отключить</button>
                    <button class="device-action-btn" onclick="removeBluetooth('${device.name}')">Удалить</button>
                </div>
            </div>
        `;
    });
    
    html += '<h3 style="margin-top: 20px;">Доступные устройства</h3>';
    
    devices.filter(d => d.status === 'available').forEach(device => {
        html += `
            <div class="bluetooth-device available">
                <div class="device-info">
                    <div class="device-icon"><i class="fas fa-${getBluetoothIcon(device.type)}"></i></div>
                    <div>
                        <h4>${device.name}</h4>
                        <div class="device-battery">
                            <i class="fas fa-battery-${getBatteryIcon(device.battery)}"></i>
                            <span>${device.battery}%</span>
                            <span class="device-signal">
                                ${getSignalBars(device.signal)}
                            </span>
                        </div>
                    </div>
                </div>
                <div class="device-actions">
                    <button class="device-action-btn" onclick="pairBluetooth('${device.name}')">Подключиться</button>
                </div>
            </div>
        `;
    });
    
    list.innerHTML = html;
}

function getBluetoothIcon(type) {
    const icons = {
        'headphones': 'headphones',
        'mouse': 'mouse',
        'phone': 'mobile-alt',
        'earbuds': 'headphones',
        'gamepad': 'gamepad'
    };
    return icons[type] || 'bluetooth';
}

function getBatteryIcon(percent) {
    if (percent >= 80) return 'full';
    if (percent >= 60) return 'three-quarters';
    if (percent >= 40) return 'half';
    if (percent >= 20) return 'quarter';
    return 'empty';
}

function getSignalBars(signal) {
    const bars = Math.floor(signal / 25) + 1;
    return '📶'.repeat(bars);
}

function pairBluetooth(deviceName) {
    showNotification('Bluetooth', `Подключение к ${deviceName}...`);
    setTimeout(() => {
        showNotification('Bluetooth', `Устройство ${deviceName} подключено`);
        updateBluetoothDevices();
    }, 2000);
}

function disconnectBluetooth(deviceName) {
    showNotification('Bluetooth', `Отключение от ${deviceName}`);
    setTimeout(updateBluetoothDevices, 1000);
}

function removeBluetooth(deviceName) {
    showNotification('Bluetooth', `Устройство ${deviceName} удалено`);
    setTimeout(updateBluetoothDevices, 1000);
}

// ================== ФУНКЦИИ ДЛЯ МЫШИ И КЛАВИАТУРЫ ==================

function manageMouse() {
    let mouseSettings = document.getElementById('mouseSettings');
    if (!mouseSettings) {
        mouseSettings = document.createElement('div');
        mouseSettings.id = 'mouseSettings';
        mouseSettings.className = 'printer-wizard';
        mouseSettings.innerHTML = `
            <h2>Настройки мыши</h2>
            <div class="setting-item">
                <div class="setting-info">
                    <div class="setting-title">Скорость указателя</div>
                    <div class="setting-desc">Настройте чувствительность</div>
                </div>
                <input type="range" min="0" max="20" value="10" class="slider" style="width: 150px;" onchange="changeMouseSpeed(this.value)">
            </div>
            <div class="setting-item">
                <div class="setting-info">
                    <div class="setting-title">Ускорение</div>
                    <div class="setting-desc">Повышение точности</div>
                </div>
                <input type="checkbox" checked onchange="toggleMouseAcceleration(this.checked)">
            </div>
            <div class="setting-item">
                <div class="setting-info">
                    <div class="setting-title">Основная кнопка</div>
                    <div class="setting-desc">Выберите основную кнопку</div>
                </div>
                <select class="setting-control" onchange="changePrimaryButton(this.value)">
                    <option value="left">Левая</option>
                    <option value="right">Правая</option>
                </select>
            </div>
            <div class="setting-item">
                <div class="setting-info">
                    <div class="setting-title">Скорость прокрутки</div>
                    <div class="setting-desc">Количество строк за раз</div>
                </div>
                <input type="number" min="1" max="100" value="3" class="setting-control" style="width: 80px;" onchange="changeScrollSpeed(this.value)">
            </div>
            <div class="setup-buttons" style="margin-top: 20px;">
                <button class="setup-btn" onclick="closeMouseSettings()">Сохранить</button>
                <button class="setup-btn secondary" onclick="closeMouseSettings()">Отмена</button>
            </div>
        `;
        document.body.appendChild(mouseSettings);
    }
    mouseSettings.classList.add('active');
}

function closeMouseSettings() {
    const settings = document.getElementById('mouseSettings');
    if (settings) settings.classList.remove('active');
}

function changeMouseSpeed(speed) {
    document.documentElement.style.setProperty('--mouse-speed', speed / 10);
}

function toggleMouseAcceleration(enabled) {
    showNotification('Мышь', `Ускорение ${enabled ? 'включено' : 'выключено'}`);
}

function changePrimaryButton(button) {
    showNotification('Мышь', `Основная кнопка: ${button === 'left' ? 'Левая' : 'Правая'}`);
}

function changeScrollSpeed(speed) {
    showNotification('Мышь', `Скорость прокрутки: ${speed} строк`);
}

function manageKeyboard() {
    let keyboardSettings = document.getElementById('keyboardSettings');
    if (!keyboardSettings) {
        keyboardSettings = document.createElement('div');
        keyboardSettings.id = 'keyboardSettings';
        keyboardSettings.className = 'printer-wizard';
        keyboardSettings.innerHTML = `
            <h2>Настройки клавиатуры</h2>
            <div class="setting-item">
                <div class="setting-info">
                    <div class="setting-title">Раскладка</div>
                    <div class="setting-desc">Текущая раскладка: Русская</div>
                </div>
                <button class="setting-btn" onclick="changeKeyboardLayout()">Изменить</button>
            </div>
            <div class="setting-item">
                <div class="setting-info">
                    <div class="setting-title">Задержка повтора</div>
                    <div class="setting-desc">Время до начала повтора</div>
                </div>
                <input type="range" min="0" max="1" step="0.1" value="0.5" class="slider" style="width: 150px;" onchange="changeKeyDelay(this.value)">
            </div>
            <div class="setting-item">
                <div class="setting-info">
                    <div class="setting-title">Скорость повтора</div>
                    <div class="setting-desc">Символов в секунду</div>
                </div>
                <input type="range" min="1" max="30" value="10" class="slider" style="width: 150px;" onchange="changeKeyRepeat(this.value)">
            </div>
            <div class="setting-item">
                <div class="setting-info">
                    <div class="setting-title">Звук клавиш</div>
                    <div class="setting-desc">Воспроизводить звук при нажатии</div>
                </div>
                <input type="checkbox" onchange="toggleKeySound(this.checked)">
            </div>
            <div class="setting-item">
                <div class="setting-info">
                    <div class="setting-title">Подсветка</div>
                    <div class="setting-desc">Яркость подсветки клавиатуры</div>
                </div>
                <input type="range" min="0" max="100" value="50" class="slider" style="width: 150px;" onchange="changeKeyboardBrightness(this.value)">
            </div>
            <div class="setup-buttons" style="margin-top: 20px;">
                <button class="setup-btn" onclick="closeKeyboardSettings()">Сохранить</button>
                <button class="setup-btn secondary" onclick="closeKeyboardSettings()">Отмена</button>
            </div>
        `;
        document.body.appendChild(keyboardSettings);
    }
    keyboardSettings.classList.add('active');
}

function closeKeyboardSettings() {
    const settings = document.getElementById('keyboardSettings');
    if (settings) settings.classList.remove('active');
}

function changeKeyboardLayout() {
    showNotification('Клавиатура', 'Переключение раскладки...');
    setTimeout(() => {
        showNotification('Клавиатура', 'Раскладка изменена');
    }, 500);
}

function changeKeyDelay(delay) {
    showNotification('Клавиатура', `Задержка повтора: ${delay} сек`);
}

function changeKeyRepeat(speed) {
    showNotification('Клавиатура', `Скорость повтора: ${speed} симв/сек`);
}

function toggleKeySound(enabled) {
    showNotification('Клавиатура', `Звук клавиш ${enabled ? 'включен' : 'выключен'}`);
}

function changeKeyboardBrightness(brightness) {
    showNotification('Клавиатура', `Яркость: ${brightness}%`);
}

// ================== ФУНКЦИИ ДЛЯ ЗВУКА ==================

function manageSound() {
    let soundSettings = document.getElementById('soundSettings');
    if (!soundSettings) {
        soundSettings = document.createElement('div');
        soundSettings.id = 'soundSettings';
        soundSettings.className = 'printer-wizard';
        soundSettings.innerHTML = `
            <h2>Настройки звука</h2>
            <div class="setting-item">
                <div class="setting-info">
                    <div class="setting-title">Громкость</div>
                    <div class="setting-desc">Общая громкость системы</div>
                </div>
                <input type="range" min="0" max="100" value="60" class="slider" style="width: 150px;" onchange="changeVolume(this.value)">
            </div>
            <div class="setting-item">
                <div class="setting-info">
                    <div class="setting-title">Устройство вывода</div>
                    <div class="setting-desc">Динамики (Realtek Audio)</div>
                </div>
                <button class="setting-btn" onclick="changeOutputDevice()">Изменить</button>
            </div>
            <div class="setting-item">
                <div class="setting-info">
                    <div class="setting-title">Устройство ввода</div>
                    <div class="setting-desc">Микрофон (Realtek Audio)</div>
                </div>
                <button class="setting-btn" onclick="changeInputDevice()">Изменить</button>
            </div>
            <div class="setting-item">
                <div class="setting-info">
                    <div class="setting-title">Звуковая схема</div>
                    <div class="setting-desc">Стандартная Windows</div>
                </div>
                <button class="setting-btn" onclick="changeSoundScheme()">Изменить</button>
            </div>
            <div class="setup-buttons" style="margin-top: 20px;">
                <button class="setup-btn" onclick="closeSoundSettings()">Сохранить</button>
                <button class="setup-btn secondary" onclick="closeSoundSettings()">Отмена</button>
            </div>
        `;
        document.body.appendChild(soundSettings);
    }
    soundSettings.classList.add('active');
}

function closeSoundSettings() {
    const settings = document.getElementById('soundSettings');
    if (settings) settings.classList.remove('active');
}

function changeVolume(volume) {
    showNotification('Звук', `Громкость: ${volume}%`);
}

function changeOutputDevice() {
    showNotification('Звук', 'Выбор устройства вывода');
}

function changeInputDevice() {
    showNotification('Звук', 'Выбор устройства ввода');
}

function changeSoundScheme() {
    showNotification('Звук', 'Изменение звуковой схемы');
}

// ================== ФУНКЦИИ ДЛЯ ТЕРМИНАЛА ==================

function handleTerminalCommand(event) {
    if (event.key === 'Enter') {
        const input = document.getElementById('terminalInput');
        const command = input.value.trim();
        const output = document.getElementById('terminalOutput');
        
        if (command) {
            // Добавляем команду в вывод
            output.innerHTML += `<div class="terminal-line"><span class="prompt">user@soiav:~$</span> ${command}</div>`;
            
            // Обрабатываем команду
            processTerminalCommand(command, output);
            
            // Очищаем ввод
            input.value = '';
            
            // Скроллим вниз
            output.scrollTop = output.scrollHeight;
        }
    }
}

function processTerminalCommand(command, output) {
    const cmd = command.toLowerCase();
    
    if (cmd === 'help') {
        output.innerHTML += `
            <div class="terminal-line">Доступные команды:</div>
            <div class="terminal-line">  <span class="command">help</span> - показать помощь</div>
            <div class="terminal-line">  <span class="command">clear</span> - очистить экран</div>
            <div class="terminal-line">  <span class="command">date</span> - показать дату</div>
            <div class="terminal-line">  <span class="command">time</span> - показать время</div>
            <div class="terminal-line">  <span class="command">whoami</span> - показать пользователя</div>
            <div class="terminal-line">  <span class="command">ls</span> - список файлов</div>
            <div class="terminal-line">  <span class="command">pwd</span> - текущая директория</div>
            <div class="terminal-line">  <span class="command">echo [текст]</span> - вывести текст</div>
            <div class="terminal-line">  <span class="command">ssap</span> - информация о SSAP</div>
            <div class="terminal-line">  <span class="command">version</span> - версия системы</div>
        `;
    }
    else if (cmd === 'clear') {
        output.innerHTML = '';
    }
    else if (cmd === 'date') {
        output.innerHTML += `<div class="terminal-line"><span class="success">${new Date().toLocaleDateString('ru-RU')}</span></div>`;
    }
    else if (cmd === 'time') {
        output.innerHTML += `<div class="terminal-line"><span class="success">${new Date().toLocaleTimeString('ru-RU')}</span></div>`;
    }
    else if (cmd === 'whoami') {
        output.innerHTML += `<div class="terminal-line"><span class="success">${currentUser.name}</span></div>`;
    }
    else if (cmd === 'pwd') {
        output.innerHTML += `<div class="terminal-line"><span class="success">/home/${currentUser.name.toLowerCase().replace(' ', '')}</span></div>`;
    }
    else if (cmd === 'ls') {
        output.innerHTML += `
            <div class="terminal-line">Документы/</div>
            <div class="terminal-line">Загрузки/</div>
            <div class="terminal-line">Музыка/</div>
            <div class="terminal-line">Видео/</div>
            <div class="terminal-line">Изображения/</div>
            <div class="terminal-line">Desktop/</div>
            <div class="terminal-line">README.txt</div>
            <div class="terminal-line">config.ssap</div>
        `;
    }
    else if (cmd.startsWith('echo ')) {
        const text = command.substring(5);
        output.innerHTML += `<div class="terminal-line"><span class="success">${text}</span></div>`;
    }
    else if (cmd === 'ssap') {
        output.innerHTML += `
            <div class="terminal-line">SSAP Runtime v1.0</div>
            <div class="terminal-line">Доступные команды SSAP:</div>
            <div class="terminal-line">  <span class="command">ssap run [file]</span> - запустить SSAP файл</div>
            <div class="terminal-line">  <span class="command">ssap compile [file]</span> - скомпилировать SSAP</div>
        `;
    }
    else if (cmd === 'version') {
        output.innerHTML += `<div class="terminal-line"><span class="success">Soiav 2 RTM build 5992</span></div>`;
    }
    else if (cmd === '') {
        // Ничего
    }
    else {
        output.innerHTML += `<div class="terminal-line"><span class="error">Команда не найдена: ${command}</span></div>`;
    }
}

// ================== ФУНКЦИИ ДЛЯ ФОТО ==================

function loadPhotos() {
    const grid = document.getElementById('photosGrid');
    if (!grid) return;
    
    const photos = [
        { id: 1, url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4', name: 'Закат' },
        { id: 2, url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb', name: 'Горы' },
        { id: 3, url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05', name: 'Лес' },
        { id: 4, url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e', name: 'Природа' },
        { id: 5, url: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e', name: 'Озеро' },
        { id: 6, url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e', name: 'Пейзаж' }
    ];
    
    let html = '';
    photos.forEach(photo => {
        html += `
            <div class="photo-item" onclick="openPhoto(${photo.id})">
                <img src="${photo.url}" alt="${photo.name}">
                <span>${photo.name}</span>
            </div>
        `;
    });
    
    grid.innerHTML = html;
}

// Загружаем фото при открытии приложения
document.addEventListener('DOMContentLoaded', function() {
    // ... существующий код ...
    
    // Добавляем наблюдатель за открытием окна фото
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.target.id === 'photos' && mutation.target.classList.contains('active')) {
                loadPhotos();
            }
        });
    });
    
    const photosWindow = document.getElementById('photos');
    if (photosWindow) {
        observer.observe(photosWindow, { attributes: true, attributeFilter: ['class'] });
    }
});

// ================== ФУНКЦИИ ДЛЯ МУЗЫКИ ==================

function loadPlaylist() {
    const playlist = document.getElementById('playlist');
    if (!playlist) return;
    
    const tracks = [
        { id: 1, title: 'Summer Vibes', artist: 'Artist 1', duration: '3:45' },
        { id: 2, title: 'Night Drive', artist: 'Artist 2', duration: '4:20' },
        { id: 3, title: 'Morning Light', artist: 'Artist 3', duration: '3:15' },
        { id: 4, title: 'Urban Flow', artist: 'Artist 4', duration: '3:55' },
        { id: 5, title: 'Dreamscape', artist: 'Artist 5', duration: '5:30' }
    ];
    
    let html = '';
    tracks.forEach(track => {
        html += `
            <div class="playlist-item" onclick="playTrack(${track.id})">
                <i class="fas fa-music"></i>
                <div class="track-info">
                    <div class="track-title">${track.title}</div>
                    <div class="track-artist">${track.artist}</div>
                </div>
                <div class="track-duration">${track.duration}</div>
            </div>
        `;
    });
    
    playlist.innerHTML = html;
}

// Загружаем плейлист при открытии музыки
document.addEventListener('DOMContentLoaded', function() {
    // ... существующий код ...
    
    const musicObserver = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.target.id === 'music' && mutation.target.classList.contains('active')) {
                loadPlaylist();
            }
        });
    });
    
    const musicWindow = document.getElementById('music');
    if (musicWindow) {
        musicObserver.observe(musicWindow, { attributes: true, attributeFilter: ['class'] });
    }
});

// ================== ФИКСЫ ДЛЯ СУЩЕСТВУЮЩИХ ФУНКЦИЙ ==================

// Исправляем функцию openApp чтобы окна корректно открывались
const originalOpenApp = openApp;
openApp = function(appId) {
    const window = document.getElementById(appId);
    if (window) {
        window.classList.add('active');
        activeWindows.add(appId);
        updateTaskbar(appId, true);
        
        // Добавляем на панель задач если нет
        if (!document.querySelector(`.taskbar-app[data-app="${appId}"]`)) {
            const appElement = document.querySelector(`.desktop-icon[data-app="${appId}"]`);
            if (appElement) {
                const icon = appElement.querySelector('img') ? 
                    `<img src="${appElement.querySelector('img').src}" style="width:20px;height:20px;">` : 
                    `<i class="${appElement.querySelector('i').className}"></i>`;
                addToTaskbar(appId, icon);
            }
        }
        
        // Специфичные действия для приложений
        if (appId === 'photos') {
            loadPhotos();
        } else if (appId === 'music') {
            loadPlaylist();
        } else if (appId === 'ssapCompiler') {
            loadSSAPExamples();
        }
        
        window.style.animation = 'windowSlideIn 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)';
        setTimeout(() => {
            window.style.animation = '';
        }, 300);
        
        bringToFront(appId);
    }
};

// Функция для загрузки примеров SSAP
function loadSSAPExamples() {
    const editor = document.getElementById('ssapCodeEditor');
    if (editor && !editor.value) {
        editor.value = `// Soiav SSAP Example
APP: MyApp
VERSION: 1.0
TYPE: APPLICATION

FUNCTION main()
  PRINT "Hello from Soiav 2!"
  CREATE window main
  ADD button "Click me" WITH action onClick
END

FUNCTION onClick()
  SHOW "Button clicked!"
END`;
    }
}

// Исправляем функцию для открытия файлов
const originalOpenFile = openFile;
openFile = function(filename) {
    if (filename.includes('.ssap')) {
        openSSAPFile(filename);
    } else {
        openFileViewer(filename);
    }
};

// Добавляем функцию для открытия SSAP файлов из меню
function openSSAPFile() {
    const files = Object.keys(ssapFiles);
    if (files.length > 0) {
        const fileList = files.map((f, i) => `${i+1}. ${f}`).join('\n');
        const choice = prompt(`Выберите SSAP файл:\n${fileList}\n\nВведите номер:`, '1');
        if (choice) {
            const index = parseInt(choice) - 1;
            if (index >= 0 && index < files.length) {
                openSSAPFileWithContent(files[index]);
            }
        }
    }
}

function openSSAPFileWithContent(filename) {
    const ssapFile = ssapFiles[filename];
    if (ssapFile) {
        document.getElementById('ssapCodeEditor').value = ssapFile.code;
        showNotification('SSAP', `Загружен файл: ${filename}`);
        openApp('ssapCompiler');
    }
}
// ================== ТАЧ-УПРАВЛЕНИЕ ДЛЯ ПЛАНШЕТОВ ==================

let touchDragging = false;
let touchResizing = false;
let currentWindow = null;
let touchStartX, touchStartY;
let windowStartX, windowStartY;
let resizeStartWidth, resizeStartHeight;
let resizeStartX, resizeStartY;

document.addEventListener('touchstart', function(e) {
    const touch = e.touches[0];
    const target = e.target;
    
    if (target.closest('.window-header')) {
        e.preventDefault();
        const window = target.closest('.window');
        if (window && !window.classList.contains('maximized')) {
            touchDragging = true;
            currentWindow = window;
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            windowStartX = window.offsetLeft;
            windowStartY = window.offsetTop;
        }
    }
    
    if (target.closest('.window-resize-handle')) {
        e.preventDefault();
        const window = target.closest('.window');
        if (window && !window.classList.contains('maximized')) {
            touchResizing = true;
            currentWindow = window;
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            resizeStartWidth = window.offsetWidth;
            resizeStartHeight = window.offsetHeight;
            resizeStartX = touch.clientX;
            resizeStartY = touch.clientY;
        }
    }
});

document.addEventListener('touchmove', function(e) {
    e.preventDefault();
    const touch = e.touches[0];
    
    if (touchDragging && currentWindow) {
        const dx = touch.clientX - touchStartX;
        const dy = touch.clientY - touchStartY;
        currentWindow.style.left = (windowStartX + dx) + 'px';
        currentWindow.style.top = (windowStartY + dy) + 'px';
    }
    
    if (touchResizing && currentWindow) {
        const dx = touch.clientX - resizeStartX;
        const dy = touch.clientY - resizeStartY;
        currentWindow.style.width = (resizeStartWidth + dx) + 'px';
        currentWindow.style.height = (resizeStartHeight + dy) + 'px';
    }
});

document.addEventListener('touchend', function() {
    touchDragging = false;
    touchResizing = false;
    currentWindow = null;
});

// ================== ДВА РЕЖИМА ПУСКА ==================

let startMenuMode = 'list'; // 'list' или 'tiles'

function toggleStartMenuMode() {
    startMenuMode = startMenuMode === 'list' ? 'tiles' : 'list';
    updateStartMenu();
    localStorage.setItem('soiav-start-menu-mode', startMenuMode);
}

function updateStartMenu() {
    const startMenu = document.getElementById('startMenu');
    const savedMode = localStorage.getItem('soiav-start-menu-mode');
    if (savedMode) startMenuMode = savedMode;
    
    if (startMenuMode === 'tiles') {
        startMenu.classList.add('tiles-mode');
        renderTilesStartMenu();
    } else {
        startMenu.classList.remove('tiles-mode');
        renderListStartMenu();
    }
}

function renderTilesStartMenu() {
    const startMenu = document.getElementById('startMenu');
    const apps = [
        { name: 'Файлы', icon: 'https://i.ibb.co/Z6BGYQLL/photo-output.png', action: 'fileExplorer', size: 'medium', color: '#0078d7' },
        { name: 'Браузер', icon: 'https://i.ibb.co/Rkk0W5Nz/photo-output.png', action: 'browser', size: 'medium', color: '#106ebe' },
        { name: 'Магазин', icon: 'https://i.ibb.co/m5SqS4nc/photo-output.png', action: 'store', size: 'medium', color: '#107c41' },
        { name: 'Почта', icon: 'https://i.ibb.co/39h7Yjqs/photo-output.png', action: 'mail', size: 'medium', color: '#0078d7' },
        { name: 'Фото', icon: 'https://i.ibb.co/FqYXmK2H/photo-output.png', action: 'photos', size: 'medium', color: '#0078d7' },
        { name: 'Погода', icon: 'https://i.ibb.co/216zwxdv/photo-output.png', action: 'weather', size: 'medium', color: '#0078d7' },
        { name: 'Настройки', icon: 'fas fa-cog', action: 'settings', size: 'small', color: '#0078d7' },
        { name: 'Терминал', icon: 'fas fa-terminal', action: 'terminal', size: 'small', color: '#0078d7' },
        { name: 'Календарь', icon: 'fas fa-calendar-alt', action: 'calendar', size: 'small', color: '#0078d7' },
        { name: 'Музыка', icon: 'fas fa-music', action: 'music', size: 'small', color: '#0078d7' },
        { name: 'SSAP', icon: 'fas fa-code', action: 'ssapCompiler', size: 'wide', color: '#0078d7' }
    ];
    
    let html = `
        <div class="start-menu-header">
            <div class="user-info">
                <img src="https://i.ibb.co/HT71Ghdd/photo-output.png" class="user-avatar-large">
                <div class="user-details">
                    <div class="user-name">${currentUser.name}</div>
                    <div class="user-email">${sidUser ? sidUser.email : 'user@soiav.local'}</div>
                </div>
            </div>
            <div class="start-menu-controls">
                <button class="start-menu-mode-btn" onclick="toggleStartMenuMode()">
                    <i class="fas fa-${startMenuMode === 'list' ? 'th' : 'list'}"></i>
                </button>
                <button class="start-menu-close" onclick="toggleStartMenu()">×</button>
            </div>
        </div>
        <div class="tiles-grid">
    `;
    
    apps.forEach(app => {
        html += `
            <div class="tile ${app.size}" onclick="openApp('${app.action}')" style="background: ${app.color};">
                ${app.icon.includes('fas') ? 
                    `<i class="${app.icon}"></i>` : 
                    `<img src="${app.icon}" style="width: 32px; height: 32px; filter: brightness(0) invert(1);">`
                }
                <span>${app.name}</span>
            </div>
        `;
    });
    
    html += `
        </div>
        <div class="power-bar">
            <button onclick="lockScreen()"><i class="fas fa-lock"></i></button>
            <button onclick="logout()"><i class="fas fa-sign-out-alt"></i></button>
            <button onclick="showShutdownMenu()"><i class="fas fa-power-off"></i></button>
        </div>
    `;
    
    startMenu.innerHTML = html;
}

function renderListStartMenu() {
    const startMenu = document.getElementById('startMenu');
    startMenu.innerHTML = `
        <div class="start-menu-header">
            <div class="user-info">
                <img src="https://i.ibb.co/HT71Ghdd/photo-output.png" class="user-avatar-large">
                <div class="user-details">
                    <div class="user-name">${currentUser.name}</div>
                    <div class="user-email">${sidUser ? sidUser.email : 'user@soiav.local'}</div>
                </div>
            </div>
            <div class="start-menu-controls">
                <button class="start-menu-mode-btn" onclick="toggleStartMenuMode()">
                    <i class="fas fa-${startMenuMode === 'list' ? 'th' : 'list'}"></i>
                </button>
                <button class="start-menu-close" onclick="toggleStartMenu()">×</button>
            </div>
        </div>
        <div class="start-menu-content">
            <div class="start-menu-apps">
                <div class="start-menu-item" onclick="openApp('fileExplorer')">
                    <img src="https://i.ibb.co/Z6BGYQLL/photo-output.png"> <span>Файлы</span>
                </div>
                <div class="start-menu-item" onclick="openApp('browser')">
                    <img src="https://i.ibb.co/Rkk0W5Nz/photo-output.png"> <span>Браузер</span>
                </div>
                <div class="start-menu-item" onclick="openApp('store')">
                    <img src="https://i.ibb.co/m5SqS4nc/photo-output.png"> <span>Магазин</span>
                </div>
                <div class="start-menu-item" onclick="openApp('mail')">
                    <img src="https://i.ibb.co/39h7Yjqs/photo-output.png"> <span>Почта</span>
                </div>
                <div class="start-menu-item" onclick="openApp('photos')">
                    <img src="https://i.ibb.co/FqYXmK2H/photo-output.png"> <span>Фото</span>
                </div>
                <div class="start-menu-item" onclick="openApp('weather')">
                    <img src="https://i.ibb.co/216zwxdv/photo-output.png"> <span>Погода</span>
                </div>
                <div class="start-menu-item" onclick="openApp('settings')">
                    <i class="fas fa-cog"></i> <span>Настройки</span>
                </div>
                <div class="start-menu-item" onclick="openApp('terminal')">
                    <i class="fas fa-terminal"></i> <span>Терминал</span>
                </div>
                <div class="start-menu-item" onclick="openApp('calendar')">
                    <i class="fas fa-calendar-alt"></i> <span>Календарь</span>
                </div>
                <div class="start-menu-item" onclick="openApp('music')">
                    <i class="fas fa-music"></i> <span>Музыка</span>
                </div>
                <div class="start-menu-item" onclick="openApp('ssapCompiler')">
                    <i class="fas fa-code"></i> <span>SSAP</span>
                </div>
            </div>
            <div class="start-menu-right">
                <div class="quick-actions">
                    <div class="quick-action" onclick="toggleWiFi()"><i class="fas fa-wifi"></i><span>Wi-Fi</span></div>
                    <div class="quick-action" onclick="toggleBluetooth()"><i class="fas fa-bluetooth"></i><span>BT</span></div>
                    <div class="quick-action" onclick="toggleDarkMode()"><i class="fas fa-moon"></i><span>Тема</span></div>
                    <div class="quick-action" onclick="syncAll()"><i class="fas fa-sync-alt"></i><span>Синхр</span></div>
                </div>
                <div class="power-options">
                    <div class="power-option" onclick="lockScreen()"><i class="fas fa-lock"></i><span>Блок</span></div>
                    <div class="power-option" onclick="logout()"><i class="fas fa-sign-out-alt"></i><span>Выход</span></div>
                    <div class="power-option" onclick="showShutdownMenu()"><i class="fas fa-power-off"></i><span>Питание</span></div>
                </div>
            </div>
        </div>
    `;
}

// ================== SOINMAIL (ПОЧТА) ПОЛНЫЙ ИНТЕРФЕЙС ==================

let mailData = {
    inbox: [
        { from: 'Команда Soiav', subject: 'Добро пожаловать!', content: 'Спасибо что выбрали Soiav 2!', date: '10:30', read: false, starred: false, attachments: [] },
        { from: 'SID Cloud', subject: 'Синхронизация', content: 'Ваши файлы синхронизированы', date: 'Вчера', read: true, starred: true, attachments: [] },
        { from: 'Магазин', subject: 'Новинки', content: 'Появились новые приложения', date: '2 дн', read: false, starred: false, attachments: ['image.jpg'] }
    ],
    sent: [
        { from: 'Я', to: 'user@example.com', subject: 'Привет', content: 'Как дела?', date: 'Вчера', read: true }
    ],
    drafts: [
        { from: 'Черновик', subject: 'Новое письмо', content: '...', date: 'Сегодня', read: false }
    ],
    spam: [],
    trash: []
};

let currentMailFolder = 'inbox';
let selectedMail = null;

function selectMailFolder(folder) {
    currentMailFolder = folder;
    document.querySelectorAll('.folder').forEach(f => f.classList.remove('active'));
    event.currentTarget.classList.add('active');
    renderMailList();
    document.getElementById('mailContent').innerHTML = '<div class="mail-preview-placeholder">Выберите письмо</div>';
}

function renderMailList() {
    const list = document.getElementById('mailList');
    const mails = mailData[currentMailFolder] || [];
    
    let html = '';
    mails.forEach((mail, index) => {
        html += `
            <div class="mail-item ${mail.read ? '' : 'unread'}" onclick="selectMail(${index})">
                <div class="mail-checkbox" onclick="event.stopPropagation(); toggleMailStar(${index})">
                    <i class="fas fa-${mail.starred ? 'star' : 'star-o'}" style="color: ${mail.starred ? '#ffc107' : 'var(--text-secondary)'};"></i>
                </div>
                <div class="mail-sender">${mail.from}</div>
                <div class="mail-subject">${mail.subject}</div>
                <div class="mail-date">${mail.date}</div>
                ${mail.attachments.length ? '<i class="fas fa-paperclip"></i>' : ''}
            </div>
        `;
    });
    
    if (mails.length === 0) {
        html = '<div class="mail-empty">Нет писем</div>';
    }
    
    list.innerHTML = html;
}

function selectMail(index) {
    selectedMail = mailData[currentMailFolder][index];
    selectedMail.read = true;
    renderMailList();
    
    let attachments = '';
    if (selectedMail.attachments.length) {
        attachments = `
            <div class="mail-attachments">
                <h4>Вложения:</h4>
                ${selectedMail.attachments.map(a => `
                    <div class="attachment" onclick="downloadAttachment('${a}')">
                        <i class="fas fa-paperclip"></i> ${a}
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    document.getElementById('mailContent').innerHTML = `
        <div class="mail-view">
            <div class="mail-view-header">
                <h2>${selectedMail.subject}</h2>
                <div class="mail-actions">
                    <button onclick="replyMail()"><i class="fas fa-reply"></i></button>
                    <button onclick="forwardMail()"><i class="fas fa-forward"></i></button>
                    <button onclick="deleteMail()"><i class="fas fa-trash"></i></button>
                </div>
            </div>
            <div class="mail-view-from">
                <strong>От:</strong> ${selectedMail.from}<br>
                <strong>Кому:</strong> ${selectedMail.to || currentUser.email}<br>
                <strong>Дата:</strong> ${new Date().toLocaleString()}
            </div>
            <div class="mail-view-content">
                ${selectedMail.content}
            </div>
            ${attachments}
        </div>
    `;
}

function newMail() {
    document.getElementById('mailContent').innerHTML = `
        <div class="mail-compose">
            <h2>Новое письмо</h2>
            <input type="text" placeholder="Кому" id="composeTo" class="compose-input">
            <input type="text" placeholder="Тема" id="composeSubject" class="compose-input">
            <textarea placeholder="Текст письма..." id="composeBody" rows="10" class="compose-textarea"></textarea>
            <div class="compose-actions">
                <button onclick="sendMail()" class="compose-send">Отправить</button>
                <button onclick="saveDraft()" class="compose-draft">Сохранить</button>
                <button onclick="cancelCompose()" class="compose-cancel">Отмена</button>
            </div>
        </div>
    `;
}

function sendMail() {
    const to = document.getElementById('composeTo').value;
    const subject = document.getElementById('composeSubject').value;
    const body = document.getElementById('composeBody').value;
    
    mailData.sent.push({
        from: 'Я',
        to: to,
        subject: subject,
        content: body,
        date: 'Только что',
        read: true,
        starred: false,
        attachments: []
    });
    
    showNotification('Почта', 'Письмо отправлено');
    selectMailFolder('sent');
}

// ================== ПОГОДА С ВЫБОРОМ ИСТОЧНИКА ==================

let weatherProvider = 'yandex';
let weatherData = null;

function initWeather() {
    const savedProvider = localStorage.getItem('soiav-weather-provider');
    if (savedProvider) weatherProvider = savedProvider;
    
    document.getElementById('weatherProvider').value = weatherProvider;
    loadWeather('Москва');
}

function changeWeatherProvider(provider) {
    weatherProvider = provider;
    localStorage.setItem('soiav-weather-provider', provider);
    loadWeather(document.getElementById('weatherCity').value || 'Москва');
}

function loadWeather(city) {
    showNotification('Погода', `Загрузка данных для ${city}...`);
    
    setTimeout(() => {
        if (weatherProvider === 'yandex') {
            weatherData = {
                temp: 23,
                feels: 21,
                condition: 'Солнечно',
                humidity: 65,
                wind: 3,
                pressure: 750,
                sunrise: '06:30',
                sunset: '19:45',
                forecast: [
                    { day: 'Пн', temp: 23, icon: 'sun' },
                    { day: 'Вт', temp: 22, icon: 'sun' },
                    { day: 'Ср', temp: 19, icon: 'cloud-sun' },
                    { day: 'Чт', temp: 18, icon: 'cloud-rain' },
                    { day: 'Пт', temp: 20, icon: 'cloud-sun' },
                    { day: 'Сб', temp: 24, icon: 'sun' }
                ]
            };
        } else {
            weatherData = {
                temp: 24,
                feels: 22,
                condition: 'Clear sky',
                humidity: 60,
                wind: 2.5,
                pressure: 1012,
                sunrise: '06:15',
                sunset: '20:00',
                forecast: [
                    { day: 'Mon', temp: 24, icon: 'sun' },
                    { day: 'Tue', temp: 23, icon: 'sun' },
                    { day: 'Wed', temp: 20, icon: 'cloud-sun' },
                    { day: 'Thu', temp: 19, icon: 'cloud-rain' },
                    { day: 'Fri', temp: 21, icon: 'cloud-sun' },
                    { day: 'Sat', temp: 25, icon: 'sun' }
                ]
            };
        }
        
        updateWeatherDisplay(city);
    }, 1000);
}

function updateWeatherDisplay(city) {
    document.getElementById('weatherCurrent').innerHTML = `
        <div class="weather-icon"><i class="fas fa-${weatherData.condition === 'Солнечно' ? 'sun' : 'cloud-sun'}"></i></div>
        <div class="weather-info">
            <div class="weather-temp">+${weatherData.temp}°C</div>
            <div class="weather-desc">${weatherData.condition}</div>
            <div class="weather-location">${city || 'Москва'}, Россия</div>
        </div>
    `;
    
    let forecast = '';
    weatherData.forecast.forEach(day => {
        forecast += `
            <div class="forecast-day">
                <div>${day.day}</div>
                <i class="fas fa-${day.icon}"></i>
                <div>+${day.temp}°</div>
            </div>
        `;
    });
    
    document.getElementById('weatherForecast').innerHTML = forecast;
    
    document.getElementById('weatherDetails').innerHTML = `
        <div class="weather-detail"><i class="fas fa-temperature-low"></i> Ощущается: +${weatherData.feels}°</div>
        <div class="weather-detail"><i class="fas fa-tint"></i> Влажность: ${weatherData.humidity}%</div>
        <div class="weather-detail"><i class="fas fa-wind"></i> Ветер: ${weatherData.wind} м/с</div>
        <div class="weather-detail"><i class="fas fa-compress"></i> Давление: ${weatherData.pressure} мм</div>
        <div class="weather-detail"><i class="fas fa-sun"></i> Восход: ${weatherData.sunrise}</div>
        <div class="weather-detail"><i class="fas fa-moon"></i> Закат: ${weatherData.sunset}</div>
    `;
}

// ================== ПОЛЬЗОВАТЕЛЬСКИЕ ОБОИ ==================

function uploadWallpaper(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        document.querySelector('.desktop').style.backgroundImage = `url('${e.target.result}')`;
        localStorage.setItem('soiav-custom-wallpaper', e.target.result);
        showNotification('Обои', 'Обои изменены');
    };
    reader.readAsDataURL(file);
}

function openWallpaperPicker() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = function(e) {
        if (e.target.files[0]) {
            uploadWallpaper(e.target.files[0]);
        }
    };
    input.click();
}

// ================== ИМПОРТ ФАЙЛОВ ==================

function importFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = function(e) {
        Array.from(e.target.files).forEach(file => {
            const reader = new FileReader();
            reader.onload = function(f) {
                const fileObj = {
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    data: f.target.result,
                    date: new Date()
                };
                files.push(fileObj);
                showNotification('Файлы', `Импортирован: ${file.name}`);
                
                if (file.type.startsWith('image/')) {
                    addPhotoToGrid(file.name, f.target.result);
                }
            };
            
            if (file.type.startsWith('image/')) {
                reader.readAsDataURL(file);
            } else {
                reader.readAsText(file);
            }
        });
    };
    input.click();
}

function addPhotoToGrid(name, data) {
    const grid = document.getElementById('photosGrid');
    if (grid) {
        const photo = document.createElement('div');
        photo.className = 'photo-item';
        photo.onclick = () => openPhoto(name);
        photo.innerHTML = `
            <img src="${data}" alt="${name}">
            <span>${name}</span>
        `;
        grid.appendChild(photo);
    }
}

function openPhoto(name) {
    const photo = files.find(f => f.name === name);
    if (photo) {
        const viewer = document.getElementById('fileViewer');
        if (!viewer) createFileViewerWindow();
        
        document.getElementById('fileViewerContent').innerHTML = `
            <div class="file-content" style="text-align: center;">
                <img src="${photo.data}" style="max-width: 100%; max-height: 70vh; border-radius: 16px;">
                <p style="margin-top: 15px;">${photo.name} • ${(photo.size/1024).toFixed(2)} KB</p>
            </div>
        `;
        openApp('fileViewer');
    }
}

// ================== SSAP С HTML/CSS/JS ==================

function createSSAPProject(type) {
    const templates = {
        html: `<!DOCTYPE html>
<html>
<head>
    <title>SSAP App</title>
    <style>
        body {
            font-family: 'Segoe UI', sans-serif;
            margin: 20px;
            background: var(--background-primary);
            color: var(--text-primary);
        }
        .app {
            max-width: 600px;
            margin: 0 auto;
        }
        button {
            background: var(--accent-color);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
        }
    </style>
</head>
<body>
    <div class="app">
        <h1>Моё SSAP приложение</h1>
        <button onclick="sayHello()">Нажми меня</button>
    </div>
    <script>
        function sayHello() {
            alert('Привет из SSAP!');
        }
    <\/script>
</body>
</html>`,
        css: `/* SSAP Styles */
.app {
    animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

.button {
    background: var(--accent-color);
    transition: all 0.3s;
}

.button:hover {
    transform: scale(1.05);
}`,
        js: `// SSAP JavaScript
class SSAPApp {
    constructor() {
        this.name = 'MyApp';
        this.version = '1.0';
    }
    
    init() {
        console.log('SSAP App started');
        this.render();
    }
    
    render() {
        // App logic here
    }
}

new SSAPApp().init();`,
        java: `// SSAP Java-style
public class SSAPApplication {
    private String name;
    private int version;
    
    public SSAPApplication() {
        this.name = "MyApp";
        this.version = 1;
    }
    
    public void start() {
        System.out.println("SSAP App running");
        createWindow();
    }
    
    private void createWindow() {
        // Window creation logic
    }
}`
    };
    
    document.getElementById('ssapCodeEditor').value = templates[type];
    showNotification('SSAP', `Создан шаблон ${type.toUpperCase()}`);
    openApp('ssapCompiler');
}

// ================== ИНИЦИАЛИЗАЦИЯ ВСЕГО ==================

document.addEventListener('DOMContentLoaded', function() {
    // Добавляем кнопку выбора режима пуска в настройки
    setTimeout(() => {
        const settingsContent = document.getElementById('settingsContent');
        if (settingsContent) {
            const originalLoad = loadSettingsContent;
            window.loadSettingsContent = function(categoryId) {
                originalLoad(categoryId);
                if (categoryId === 'personalization') {
                    const personalizationSection = document.querySelector('.settings-section.active');
                    if (personalizationSection) {
                        personalizationSection.innerHTML += `
                            <div class="setting-item">
                                <div class="setting-info">
                                    <div class="setting-title">Режим меню Пуск</div>
                                    <div class="setting-desc">Обычный список или плитки</div>
                                </div>
                                <select class="setting-control" onchange="changeStartMenuMode(this.value)">
                                    <option value="list" ${startMenuMode === 'list' ? 'selected' : ''}>Обычный</option>
                                    <option value="tiles" ${startMenuMode === 'tiles' ? 'selected' : ''}>Плитки</option>
                                </select>
                            </div>
                        `;
                    }
                }
            };
        }
        
        // Добавляем кнопку импорта в фото
        const photosWindow = document.getElementById('photos');
        if (photosWindow) {
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.target.id === 'photos' && mutation.target.classList.contains('active')) {
                        const toolbar = document.querySelector('.photos-toolbar');
                        if (toolbar && !document.getElementById('importPhotoBtn')) {
                            toolbar.innerHTML += `
                                <button class="toolbar-btn" onclick="importFile()" id="importPhotoBtn">
                                    <i class="fas fa-upload"></i> Импорт фото
                                </button>
                            `;
                        }
                    }
                });
            });
            observer.observe(photosWindow, { attributes: true, attributeFilter: ['class'] });
        }
        
        // Добавляем выбор источника погоды
        const weatherWindow = document.getElementById('weather');
        if (weatherWindow) {
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.target.id === 'weather' && mutation.target.classList.contains('active')) {
                        const search = document.querySelector('.weather-search');
                        if (search && !document.getElementById('weatherProvider')) {
                            search.innerHTML += `
                                <select id="weatherProvider" onchange="changeWeatherProvider(this.value)" style="margin-left: 10px; padding: 12px; border-radius: 30px; background: var(--background-primary); border: 1px solid rgba(0,0,0,0.1);">
                                    <option value="yandex">Яндекс</option>
                                    <option value="google">Google</option>
                                </select>
                            `;
                            if (!document.getElementById('weatherDetails')) {
                                search.insertAdjacentHTML('afterend', '<div id="weatherDetails" class="weather-details" style="display: grid; grid-template-columns: repeat(2,1fr); gap: 15px; margin-top: 20px;"></div>');
                            }
                            initWeather();
                        }
                    }
                });
            });
            observer.observe(weatherWindow, { attributes: true, attributeFilter: ['class'] });
        }
        
        // Добавляем ресайз-хендлы к окнам
        document.querySelectorAll('.window').forEach(win => {
            if (!win.querySelector('.window-resize-handle')) {
                const handle = document.createElement('div');
                handle.className = 'window-resize-handle';
                handle.style.cssText = 'position: absolute; bottom: 0; right: 0; width: 20px; height: 20px; cursor: nwse-resize; z-index: 1000;';
                win.appendChild(handle);
            }
        });
    }, 1000);
});

function changeStartMenuMode(mode) {
    startMenuMode = mode;
    localStorage.setItem('soiav-start-menu-mode', mode);
    updateStartMenu();
    showNotification('Пуск', `Режим: ${mode === 'list' ? 'Обычный' : 'Плитки'}`);
}

// ================== ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ ==================

function toggleMailStar(index) {
    const mail = mailData[currentMailFolder][index];
    mail.starred = !mail.starred;
    renderMailList();
}

function deleteMail() {
    if (selectedMail) {
        mailData.trash.push(selectedMail);
        mailData[currentMailFolder] = mailData[currentMailFolder].filter(m => m !== selectedMail);
        selectedMail = null;
        renderMailList();
        document.getElementById('mailContent').innerHTML = '<div class="mail-preview-placeholder">Письмо удалено</div>';
        showNotification('Почта', 'Письмо перемещено в корзину');
    }
}

function replyMail() {
    if (selectedMail) {
        newMail();
        document.getElementById('composeTo').value = selectedMail.from;
        document.getElementById('composeSubject').value = `Re: ${selectedMail.subject}`;
    }
}

function forwardMail() {
    if (selectedMail) {
        newMail();
        document.getElementById('composeSubject').value = `Fwd: ${selectedMail.subject}`;
        document.getElementById('composeBody').value = `\n\n---------- Forwarded message ----------\nОт: ${selectedMail.from}\nТема: ${selectedMail.subject}\n\n${selectedMail.content}`;
    }
}

function saveDraft() {
    const to = document.getElementById('composeTo').value;
    const subject = document.getElementById('composeSubject').value;
    const body = document.getElementById('composeBody').value;
    
    mailData.drafts.push({
        from: 'Черновик',
        to: to,
        subject: subject,
        content: body,
        date: 'Только что',
        read: true,
        starred: false,
        attachments: []
    });
    
    showNotification('Почта', 'Черновик сохранен');
    selectMailFolder('drafts');
}

function cancelCompose() {
    document.getElementById('mailContent').innerHTML = '<div class="mail-preview-placeholder">Выберите письмо</div>';
}

function downloadAttachment(name) {
    showNotification('Файлы', `Скачивание: ${name}`);
}

// ================== ЗАПУСК ==================

// Обновляем меню пуск при загрузке
setTimeout(updateStartMenu, 500);
// ================== КНОПКА ЗАКРЫТИЯ ВСЕХ УВЕДОМЛЕНИЙ ==================

function clearAllNotifications() {
    notifications = [];
    updateNotificationBadge();
    updateNotificationsList();
    showNotification('Уведомления', 'Все уведомления удалены');
}

// Обновляем функцию открытия центра уведомлений
const originalToggleNotificationCenter = toggleNotificationCenter;
toggleNotificationCenter = function() {
    originalToggleNotificationCenter();
    
    const notificationCenter = document.getElementById('notificationCenter');
    if (notificationCenter && notificationCenter.classList.contains('active')) {
        const header = notificationCenter.querySelector('.nc-header');
        if (header && !document.getElementById('clearAllBtn')) {
            const clearBtn = document.createElement('button');
            clearBtn.id = 'clearAllBtn';
            clearBtn.innerHTML = '<i class="fas fa-trash"></i>';
            clearBtn.style.cssText = 'background: none; border: none; font-size: 16px; cursor: pointer; color: var(--text-primary); padding: 4px 8px; border-radius: 10px; margin-left: 10px;';
            clearBtn.onclick = function(e) {
                e.stopPropagation();
                clearAllNotifications();
            };
            clearBtn.title = 'Очистить все';
            header.appendChild(clearBtn);
        }
    }
};
// ================== ПОЛНОЭКРАННЫЙ ПУСК С ПЛИТКАМИ ==================

let startTiles = [
    { id: 1, name: 'Файлы', icon: 'https://i.ibb.co/Z6BGYQLL/photo-output.png', action: 'fileExplorer', size: 'medium', color: '#0078d7', row: 0, col: 0 },
    { id: 2, name: 'Браузер', icon: 'https://i.ibb.co/Rkk0W5Nz/photo-output.png', action: 'browser', size: 'medium', color: '#106ebe', row: 0, col: 2 },
    { id: 3, name: 'Магазин', icon: 'https://i.ibb.co/m5SqS4nc/photo-output.png', action: 'store', size: 'medium', color: '#107c41', row: 0, col: 4 },
    { id: 4, name: 'Почта', icon: 'https://i.ibb.co/39h7Yjqs/photo-output.png', action: 'mail', size: 'medium', color: '#0078d7', row: 2, col: 0 },
    { id: 5, name: 'Фото', icon: 'https://i.ibb.co/FqYXmK2H/photo-output.png', action: 'photos', size: 'medium', color: '#0078d7', row: 2, col: 2 },
    { id: 6, name: 'Погода', icon: 'https://i.ibb.co/216zwxdv/photo-output.png', action: 'weather', size: 'medium', color: '#0078d7', row: 2, col: 4 },
    { id: 7, name: 'Настройки', icon: 'fas fa-cog', action: 'settings', size: 'small', color: '#0078d7', row: 4, col: 0 },
    { id: 8, name: 'Терминал', icon: 'fas fa-terminal', action: 'terminal', size: 'small', color: '#0078d7', row: 4, col: 1 },
    { id: 9, name: 'Календарь', icon: 'fas fa-calendar-alt', action: 'calendar', size: 'small', color: '#0078d7', row: 4, col: 2 },
    { id: 10, name: 'Музыка', icon: 'fas fa-music', action: 'music', size: 'small', color: '#0078d7', row: 4, col: 3 },
    { id: 11, name: 'SSAP', icon: 'fas fa-code', action: 'ssapCompiler', size: 'wide', color: '#0078d7', row: 0, col: 6 }
];

let draggingTile = null;
let dragOffsetX, dragOffsetY;

function enterFullscreenStart() {
    const startMenu = document.getElementById('startMenu');
    startMenu.classList.add('fullscreen');
    document.body.classList.add('start-fullscreen');
    renderFullscreenTiles();
}

function exitFullscreenStart() {
    const startMenu = document.getElementById('startMenu');
    startMenu.classList.remove('fullscreen');
    document.body.classList.remove('start-fullscreen');
}

function renderFullscreenTiles() {
    const startMenu = document.getElementById('startMenu');
    
    let html = `
        <div class="fullscreen-header">
            <div class="user-info">
                <img src="https://i.ibb.co/HT71Ghdd/photo-output.png" class="user-avatar-large">
                <div>
                    <div class="user-name">${currentUser.name}</div>
                    <div class="user-email">${sidUser ? sidUser.email : 'user@soiav.local'}</div>
                </div>
            </div>
            <div class="fullscreen-controls">
                <button onclick="toggleStartMenuMode()" class="fullscreen-btn" title="Обычный пуск">
                    <i class="fas fa-list"></i>
                </button>
                <button onclick="exitFullscreenStart()" class="fullscreen-btn" title="Закрыть">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
        <div class="tiles-workspace">
            <div class="tiles-grid-full" id="tilesGrid"></div>
            <div class="tiles-sidebar">
                <div class="tiles-recommended">
                    <h3>Рекомендуемые</h3>
                    <div class="rec-item" onclick="openApp('store')">
                        <i class="fas fa-download"></i> Новые приложения
                    </div>
                    <div class="rec-item" onclick="openApp('mail')">
                        <i class="fas fa-envelope"></i> Непрочитанные письма
                    </div>
                </div>
                <div class="tiles-power">
                    <button onclick="lockScreen()"><i class="fas fa-lock"></i></button>
                    <button onclick="logout()"><i class="fas fa-sign-out-alt"></i></button>
                    <button onclick="showShutdownMenu()"><i class="fas fa-power-off"></i></button>
                </div>
            </div>
        </div>
    `;
    
    startMenu.innerHTML = html;
    
    const grid = document.getElementById('tilesGrid');
    renderTilesGrid(grid);
    
    // Добавляем возможность редактирования плиток
    enableTileEditing();
}

function renderTilesGrid(container) {
    container.innerHTML = '';
    
    // Сортируем плитки по позиции
    const sortedTiles = [...startTiles].sort((a, b) => {
        if (a.row === b.row) return a.col - b.col;
        return a.row - b.row;
    });
    
    sortedTiles.forEach(tile => {
        const tileEl = document.createElement('div');
        tileEl.className = `tile-full ${tile.size}`;
        tileEl.setAttribute('data-id', tile.id);
        tileEl.setAttribute('data-row', tile.row);
        tileEl.setAttribute('data-col', tile.col);
        tileEl.style.background = tile.color;
        tileEl.style.gridRow = `${tile.row + 1} / span ${getTileSpan(tile.size, 'row')}`;
        tileEl.style.gridColumn = `${tile.col + 1} / span ${getTileSpan(tile.size, 'col')}`;
        
        tileEl.innerHTML = `
            ${tile.icon.includes('fas') ? 
                `<i class="${tile.icon}"></i>` : 
                `<img src="${tile.icon}">`
            }
            <span>${tile.name}</span>
            <div class="tile-edit-controls">
                <button onclick="event.stopPropagation(); resizeTile(${tile.id}, 'small')" title="Маленькая">□</button>
                <button onclick="event.stopPropagation(); resizeTile(${tile.id}, 'medium')" title="Средняя">◫</button>
                <button onclick="event.stopPropagation(); resizeTile(${tile.id}, 'wide')" title="Широкая">▭</button>
                <button onclick="event.stopPropagation(); removeTile(${tile.id})" title="Удалить"><i class="fas fa-times"></i></button>
            </div>
        `;
        
        tileEl.onclick = () => openApp(tile.action);
        
        // Добавляем drag and drop
        tileEl.setAttribute('draggable', 'true');
        tileEl.addEventListener('dragstart', handleTileDragStart);
        tileEl.addEventListener('dragend', handleTileDragEnd);
        tileEl.addEventListener('dragover', handleTileDragOver);
        tileEl.addEventListener('drop', handleTileDrop);
        
        container.appendChild(tileEl);
    });
}

function getTileSpan(size, dimension) {
    if (dimension === 'row') {
        return size === 'wide' ? 2 : 1;
    } else {
        return size === 'small' ? 1 : size === 'medium' ? 2 : 3;
    }
}

function handleTileDragStart(e) {
    const tile = e.target.closest('.tile-full');
    if (!tile) return;
    
    draggingTile = {
        id: parseInt(tile.dataset.id),
        element: tile,
        startRow: parseInt(tile.dataset.row),
        startCol: parseInt(tile.dataset.col)
    };
    
    e.dataTransfer.setData('text/plain', tile.dataset.id);
    tile.classList.add('dragging');
}

function handleTileDragEnd(e) {
    document.querySelectorAll('.tile-full').forEach(t => t.classList.remove('dragging', 'drag-over'));
    draggingTile = null;
}

function handleTileDragOver(e) {
    e.preventDefault();
    const tile = e.target.closest('.tile-full');
    if (tile && draggingTile && tile.dataset.id !== draggingTile.id) {
        tile.classList.add('drag-over');
    }
}

function handleTileDrop(e) {
    e.preventDefault();
    const targetTile = e.target.closest('.tile-full');
    if (!targetTile || !draggingTile) return;
    
    targetTile.classList.remove('drag-over');
    
    const targetId = parseInt(targetTile.dataset.id);
    const targetRow = parseInt(targetTile.dataset.row);
    const targetCol = parseInt(targetTile.dataset.col);
    
    // Меняем позиции плиток
    const draggedIndex = startTiles.findIndex(t => t.id === draggingTile.id);
    const targetIndex = startTiles.findIndex(t => t.id === targetId);
    
    if (draggedIndex !== -1 && targetIndex !== -1) {
        const tempRow = startTiles[draggedIndex].row;
        const tempCol = startTiles[draggedIndex].col;
        
        startTiles[draggedIndex].row = targetRow;
        startTiles[draggedIndex].col = targetCol;
        
        startTiles[targetIndex].row = tempRow;
        startTiles[targetIndex].col = tempCol;
        
        // Сохраняем в localStorage
        localStorage.setItem('soiav-tiles', JSON.stringify(startTiles));
        
        // Перерисовываем
        renderTilesGrid(document.getElementById('tilesGrid'));
    }
}

function resizeTile(tileId, newSize) {
    const tile = startTiles.find(t => t.id === tileId);
    if (tile) {
        tile.size = newSize;
        localStorage.setItem('soiav-tiles', JSON.stringify(startTiles));
        renderTilesGrid(document.getElementById('tilesGrid'));
        showNotification('Плитки', `Размер изменен на ${newSize}`);
    }
}

function removeTile(tileId) {
    if (confirm('Убрать плитку?')) {
        startTiles = startTiles.filter(t => t.id !== tileId);
        localStorage.setItem('soiav-tiles', JSON.stringify(startTiles));
        renderTilesGrid(document.getElementById('tilesGrid'));
    }
}

function addTile() {
    const apps = [
        { name: 'Калькулятор', icon: 'fas fa-calculator', action: 'calculator' },
        { name: 'Змейка', icon: 'fas fa-gamepad', action: 'snake' },
        { name: 'Тетрис', icon: 'fas fa-th-large', action: 'tetris' }
    ];
    
    let html = '<div style="padding: 20px;"><h3>Добавить плитку</h3>';
    apps.forEach(app => {
        html += `
            <div class="add-tile-item" onclick="addTileToGrid('${app.name}', '${app.icon}', '${app.action}')">
                <i class="${app.icon}"></i> ${app.name}
            </div>
        `;
    });
    html += '<button class="setup-btn" onclick="closeAddTile()">Отмена</button></div>';
    
    const sidebar = document.querySelector('.tiles-sidebar');
    sidebar.innerHTML = html;
}

function addTileToGrid(name, icon, action) {
    const newId = Math.max(...startTiles.map(t => t.id)) + 1;
    
    // Ищем свободное место
    let row = 0, col = 0;
    let found = false;
    
    for (let r = 0; r < 6 && !found; r++) {
        for (let c = 0; c < 6 && !found; c++) {
            if (!startTiles.some(t => t.row === r && t.col === c)) {
                row = r;
                col = c;
                found = true;
            }
        }
    }
    
    startTiles.push({
        id: newId,
        name: name,
        icon: icon,
        action: action,
        size: 'small',
        color: '#0078d7',
        row: row,
        col: col
    });
    
    localStorage.setItem('soiav-tiles', JSON.stringify(startTiles));
    renderTilesGrid(document.getElementById('tilesGrid'));
    
    // Восстанавливаем сайдбар
    const sidebar = document.querySelector('.tiles-sidebar');
    sidebar.innerHTML = `
        <div class="tiles-recommended">
            <h3>Рекомендуемые</h3>
            <div class="rec-item" onclick="openApp('store')">
                <i class="fas fa-download"></i> Новые приложения
            </div>
            <div class="rec-item" onclick="openApp('mail')">
                <i class="fas fa-envelope"></i> Непрочитанные письма
            </div>
            <div class="rec-item" onclick="addTile()">
                <i class="fas fa-plus"></i> Добавить плитку
            </div>
        </div>
        <div class="tiles-power">
            <button onclick="lockScreen()"><i class="fas fa-lock"></i></button>
            <button onclick="logout()"><i class="fas fa-sign-out-alt"></i></button>
            <button onclick="showShutdownMenu()"><i class="fas fa-power-off"></i></button>
        </div>
    `;
}

function closeAddTile() {
    const sidebar = document.querySelector('.tiles-sidebar');
    sidebar.innerHTML = `
        <div class="tiles-recommended">
            <h3>Рекомендуемые</h3>
            <div class="rec-item" onclick="openApp('store')">
                <i class="fas fa-download"></i> Новые приложения
            </div>
            <div class="rec-item" onclick="openApp('mail')">
                <i class="fas fa-envelope"></i> Непрочитанные письма
            </div>
            <div class="rec-item" onclick="addTile()">
                <i class="fas fa-plus"></i> Добавить плитку
            </div>
        </div>
        <div class="tiles-power">
            <button onclick="lockScreen()"><i class="fas fa-lock"></i></button>
            <button onclick="logout()"><i class="fas fa-sign-out-alt"></i></button>
            <button onclick="showShutdownMenu()"><i class="fas fa-power-off"></i></button>
        </div>
    `;
}

function enableTileEditing() {
    // Добавляем кнопку редактирования в заголовок
    const header = document.querySelector('.fullscreen-header');
    if (header && !document.querySelector('.edit-tiles-btn')) {
        const editBtn = document.createElement('button');
        editBtn.className = 'fullscreen-btn edit-tiles-btn';
        editBtn.innerHTML = '<i class="fas fa-pencil-alt"></i>';
        editBtn.title = 'Режим редактирования';
        editBtn.onclick = toggleEditMode;
        header.querySelector('.fullscreen-controls').appendChild(editBtn);
    }
}

function toggleEditMode() {
    document.querySelectorAll('.tile-full').forEach(tile => {
        tile.classList.toggle('edit-mode');
    });
}

// Загружаем сохраненные плитки
const savedTiles = localStorage.getItem('soiav-tiles');
if (savedTiles) {
    startTiles = JSON.parse(savedTiles);
}

// Обновляем функцию переключения режимов
const originalToggleStartMenuMode = toggleStartMenuMode;
toggleStartMenuMode = function() {
    if (startMenuMode === 'list') {
        startMenuMode = 'tiles';
        enterFullscreenStart();
    } else {
        startMenuMode = 'list';
        exitFullscreenStart();
        renderListStartMenu();
    }
    localStorage.setItem('soiav-start-menu-mode', startMenuMode);
};
// ================== НОВЫЕ АНИМАЦИИ ==================
function addAnimationClass(element, animation) {
    element.classList.add(animation);
    setTimeout(() => element.classList.remove(animation), 500);
}

// Анимация для иконок при наведении
document.querySelectorAll('.desktop-icon, .taskbar-app, .start-btn').forEach(el => {
    el.addEventListener('mouseenter', () => addAnimationClass(el, 'bounce-animation'));
});

// ================== ОНЛАЙН МАГАЗИН (SERVERS) ==================
let storeServerConnected = false;
let onlineApps = [];

async function connectToStoreServer() {
    try {
        const response = await fetch('http://localhost:5000/api/store/stats');
        if (response.ok) {
            storeServerConnected = true;
            document.getElementById('storeServerStatus')?.classList.add('online');
            document.getElementById('storeServerStatus')?.classList.remove('offline');
            return true;
        }
    } catch(e) {
        console.log('Сервер магазина не запущен');
    }
    storeServerConnected = false;
    document.getElementById('storeServerStatus')?.classList.add('offline');
    document.getElementById('storeServerStatus')?.classList.remove('online');
    return false;
}

async function loadOnlineApps(category = 'all', search = '') {
    if (!storeServerConnected) await connectToStoreServer();
    
    const appsGrid = document.getElementById('appsGrid');
    if (appsGrid) {
        appsGrid.innerHTML = '<div class="store-loading"><div class="spinner"></div><p>Загрузка приложений...</p></div>';
    }
    
    let url = storeServerConnected ? 
        `http://localhost:5000/api/store/apps?category=${category}&search=${encodeURIComponent(search)}` :
        '/api/store/apps-local';
    
    try {
        let apps = [];
        if (storeServerConnected) {
            const response = await fetch(url);
            const data = await response.json();
            apps = data.items || [];
            onlineApps = apps;
        } else {
            apps = getLocalApps();
        }
        
        renderOnlineApps(apps);
        updateStoreStats();
    } catch(e) {
        renderOnlineApps(getLocalApps());
    }
}

function getLocalApps() {
    return [
        {id: "calc", name: "Калькулятор", price: 0, is_free: true, rating: 4.5, downloads: 1234, size: "2 MB", icon: "fa-calculator", category: "utilities", description: "Простой калькулятор"},
        {id: "notepad", name: "Блокнот", price: 0, is_free: true, rating: 4.3, downloads: 5678, size: "1 MB", icon: "fa-edit", category: "utilities", description: "Текстовый редактор"},
        {id: "snake", name: "Змейка", price: 0, is_free: true, rating: 4.7, downloads: 3456, size: "3 MB", icon: "fa-gamepad", category: "games", description: "Классическая игра"},
        {id: "tetris", name: "Тетрис", price: 99, is_free: false, rating: 4.8, downloads: 7890, size: "5 MB", icon: "fa-th-large", category: "games", description: "Головоломка"},
    ];
}

function renderOnlineApps(apps) {
    const appsGrid = document.getElementById('appsGrid');
    if (!appsGrid) return;
    
    appsGrid.innerHTML = '';
    apps.forEach(app => {
        const card = document.createElement('div');
        card.className = 'app-card';
        card.innerHTML = `
            <div class="app-icon"><i class="fas ${app.icon}"></i></div>
            <div class="app-title">${app.name}</div>
            <div class="app-desc">${app.description || app.short_desc || ''}</div>
            <div class="app-meta">
                <span>${app.size || 'N/A'}</span>
                <span>⭐ ${app.rating || 0}</span>
                <span>📥 ${(app.downloads || 0).toLocaleString()}</span>
            </div>
            <button class="install-btn" onclick="downloadOnlineApp('${app.id}')">
                ${app.is_free ? 'Бесплатно' : `${app.price} ₽`}
            </button>
        `;
        card.onclick = (e) => { if(!e.target.classList.contains('install-btn')) showAppDetails(app); };
        appsGrid.appendChild(card);
    });
}

async function downloadOnlineApp(appId) {
    const app = onlineApps.find(a => a.id === appId) || getLocalApps().find(a => a.id === appId);
    if (!app) return;
    
    showNotification('Магазин', `Скачивание ${app.name}...`);
    
    if (storeServerConnected) {
        try {
            await fetch('http://localhost:5000/api/store/download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ app_id: appId, user_id: localStorage.getItem('soiav-user-id') || 'anonymous' })
            });
        } catch(e) {}
    }
    
    // Показываем прогресс скачивания
    showDownloadProgress(app.name);
    
    setTimeout(() => {
        if (!installedApps.has(appId)) {
            installedApps.add(appId);
            createDesktopIconForApp(app);
            showNotification('Магазин', `${app.name} успешно установлен!`);
        }
        closeDownloadProgress();
    }, 3000);
}

function showDownloadProgress(appName) {
    let progressDiv = document.getElementById('downloadProgress');
    if (!progressDiv) {
        progressDiv = document.createElement('div');
        progressDiv.id = 'downloadProgress';
        progressDiv.className = 'download-progress';
        progressDiv.innerHTML = `
            <div><strong><i class="fas fa-download"></i> Скачивание</strong></div>
            <div id="downloadAppName">${appName}</div>
            <div class="progress-bar"><div class="progress-fill" id="downloadProgressFill"></div></div>
        `;
        document.body.appendChild(progressDiv);
    } else {
        document.getElementById('downloadAppName').textContent = appName;
        progressDiv.style.display = 'block';
    }
    
    let progress = 0;
    const interval = setInterval(() => {
        progress += 10;
        document.getElementById('downloadProgressFill').style.width = progress + '%';
        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                if(progressDiv) progressDiv.style.display = 'none';
            }, 1000);
        }
    }, 300);
}

function closeDownloadProgress() {
    const div = document.getElementById('downloadProgress');
    if(div) div.style.display = 'none';
}

function createDesktopIconForApp(app) {
    const desktopIcons = document.querySelector('.desktop-icons');
    if(!desktopIcons || document.querySelector(`.desktop-icon[data-app="${app.id}"]`)) return;
    
    const icon = document.createElement('div');
    icon.className = 'desktop-icon';
    icon.setAttribute('data-app', app.id);
    icon.innerHTML = `<i class="fas ${app.icon}"></i><span>${app.name}</span>`;
    icon.onclick = () => openFakeApp(app);
    desktopIcons.appendChild(icon);
}

function openFakeApp(app) {
    showNotification(app.name, `Приложение "${app.name}" запущено (демо-версия)`);
}

function showAppDetails(app) {
    let modal = document.getElementById('appDetailsModal');
    if(!modal) {
        modal = document.createElement('div');
        modal.id = 'appDetailsModal';
        modal.className = 'app-details-modal';
        document.body.appendChild(modal);
    }
    
    modal.innerHTML = `
        <div class="app-details-header">
            <i class="fas ${app.icon}"></i>
            <h2>${app.name}</h2>
            <div class="server-status ${storeServerConnected ? '' : 'offline'}">
                <i class="fas fa-${storeServerConnected ? 'check-circle' : 'exclamation-circle'}"></i>
                ${storeServerConnected ? 'Онлайн магазин' : 'Локальный режим'}
            </div>
        </div>
        <div class="app-details-body">
            <p>${app.description || 'Нет описания'}</p>
            <div class="app-details-features">
                <span class="feature-tag"><i class="fas fa-star"></i> Рейтинг: ${app.rating || 0}</span>
                <span class="feature-tag"><i class="fas fa-download"></i> Загрузок: ${(app.downloads || 0).toLocaleString()}</span>
                <span class="feature-tag"><i class="fas fa-hdd"></i> Размер: ${app.size || 'N/A'}</span>
                <span class="feature-tag"><i class="fas fa-tag"></i> ${app.is_free ? 'Бесплатно' : `${app.price} ₽`}</span>
            </div>
        </div>
        <div class="app-details-footer">
            <button class="setup-btn" onclick="downloadOnlineApp('${app.id}'); closeAppDetails()">Установить</button>
            <button class="setup-btn secondary" onclick="closeAppDetails()">Закрыть</button>
        </div>
    `;
    modal.style.display = 'block';
}

function closeAppDetails() {
    const modal = document.getElementById('appDetailsModal');
    if(modal) modal.style.display = 'none';
}

async function updateStoreStats() {
    if(!storeServerConnected) await connectToStoreServer();
    
    const statsContainer = document.querySelector('.store-stats-bar');
    if(!statsContainer) return;
    
    if(storeServerConnected) {
        try {
            const response = await fetch('http://localhost:5000/api/store/stats');
            const data = await response.json();
            const stats = data.stats;
            statsContainer.innerHTML = `
                <div class="stat-badge"><i class="fas fa-apps"></i> ${stats.total_apps} приложений</div>
                <div class="stat-badge"><i class="fas fa-download"></i> ${stats.total_downloads.toLocaleString()} загрузок</div>
                <div class="stat-badge"><i class="fas fa-gift"></i> ${stats.free_apps} бесплатных</div>
                <div class="stat-badge"><i class="fas fa-star"></i> ${stats.paid_apps} платных</div>
            `;
        } catch(e) {}
    } else {
        const localApps = getLocalApps();
        statsContainer.innerHTML = `
            <div class="stat-badge"><i class="fas fa-apps"></i> ${localApps.length} приложений</div>
            <div class="stat-badge"><i class="fas fa-download"></i> Локальный режим</div>
            <div class="stat-badge server-status offline"><i class="fas fa-plug"></i> Сервер не запущен</div>
        `;
    }
}

// Обновляем функцию открытия магазина
const originalStoreOpen = openApp;
openApp = function(appId) {
    originalStoreOpen(appId);
    if(appId === 'store') {
        setTimeout(() => {
            loadOnlineApps();
            const searchInput = document.getElementById('storeSearch');
            if(searchInput) {
                searchInput.addEventListener('input', (e) => loadOnlineApps('all', e.target.value));
            }
            const cats = document.querySelectorAll('.category-btn');
            cats.forEach(btn => {
                btn.onclick = () => {
                    cats.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    loadOnlineApps(btn.textContent === 'Все' ? 'all' : 
                                  btn.textContent === 'Игры' ? 'games' :
                                  btn.textContent === 'SSAP' ? 'ssap' : 'apps');
                };
            });
        }, 100);
    }
};

// Запускаем подключение к серверу
setTimeout(() => connectToStoreServer(), 1000);

// ================== НОВЫЕ ПУНКТЫ В ПРИЛОЖЕНИЯХ ==================

// Добавляем новые приложения в меню пуск
const newApps = [
    {name: "Калькулятор", icon: "fas fa-calculator", action: "calculator"},
    {name: "Змейка", icon: "fas fa-gamepad", action: "snake"},
    {name: "Тетрис", icon: "fas fa-th-large", action: "tetris"},
    {name: "Шахматы", icon: "fas fa-chess", action: "chess"},
    {name: "Сапёр", icon: "fas fa-flag", action: "minesweeper"}
];

function addNewAppsToStartMenu() {
    const startApps = document.querySelector('.start-menu-apps');
    if(startApps && !document.querySelector('.start-menu-item[data-app="calculator"]')) {
        newApps.forEach(app => {
            const item = document.createElement('div');
            item.className = 'start-menu-item';
            item.setAttribute('data-app', app.action);
            item.innerHTML = `<i class="${app.icon}"></i><span>${app.name}</span>`;
            item.onclick = () => showNotification(app.name, `Демо-приложение "${app.name}"`);
            startApps.appendChild(item);
        });
    }
}

setTimeout(addNewAppsToStartMenu, 1000);

// ================== НОВЫЕ ОБОИ ==================

function addNewWallpapers() {
    const newWallpapers = [
        'https://i.ibb.co/DHSVYYT7/IMG-4555.png',
        'https://i.ibb.co/LXwRKZvJ/IMG-4554.png',
        'https://i.ibb.co/XrXhFsfd/IMG-4541.jpg',
        'https://i.ibb.co/Mm7QHdm/IMG-4537.png',
        'https://i.ibb.co/DfhR03QY/IMG-4540.jpg',
        'https://i.ibb.co/TMpLx19c/IMG-4535.jpg',
        'https://i.ibb.co/DHc83R8m/IMG-4532.jpg',
        'https://i.ibb.co/4njh5XfW/IMG-4536.jpg',
        'https://i.ibb.co/XrG22RV7/IMG-4530.png',
        'https://i.ibb.co/fGtk2cF6/IMG-4531.jpg'
    ];
    
    const wallpaperGrid = document.querySelector('.wallpaper-grid');
    if(wallpaperGrid && wallpaperGrid.children.length < 12) {
        newWallpapers.forEach((url, index) => {
            const option = document.createElement('div');
            option.className = 'wallpaper-option';
            option.style.backgroundImage = `url('${url}')`;
            option.setAttribute('data-wallpaper', index + 3);
            option.onclick = function() {
                document.querySelectorAll('.wallpaper-option').forEach(opt => opt.classList.remove('active'));
                this.classList.add('active');
                document.querySelector('.desktop').style.backgroundImage = `url('${url}')`;
                localStorage.setItem('soiav-wallpaper', url);
            };
            wallpaperGrid.appendChild(option);
        });
    }
}

setTimeout(addNewWallpapers, 500);

// ================== НОВЫЕ АНИМАЦИИ ДЛЯ ОКОН ==================

const styleAnim = document.createElement('style');
styleAnim.textContent = `
    .window.active { animation: rotateIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55) !important; }
    .desktop-icon { transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55); }
    .desktop-icon:hover { transform: translateY(-5px) scale(1.1); filter: drop-shadow(0 5px 15px rgba(0,120,215,0.3)); }
    .taskbar-app { transition: all 0.2s cubic-bezier(0.68, -0.55, 0.265, 1.55); }
    .taskbar-app:hover { transform: translateY(-3px) scale(1.05); }
    .start-btn:hover { animation: bounce 0.5s ease; }
    @keyframes bounce {
        0%,100% { transform: scale(1); }
        50% { transform: scale(1.1); }
    }
`;
document.head.appendChild(styleAnim);
// ================== ПОЛЗУНОК ДЛЯ ОБОЕВ В МАСТЕРЕ УСТАНОВКИ ==================

function scrollWallpapers(direction) {
    const grid = document.getElementById('wallpaperGrid');
    if (!grid) return;
    
    const scrollAmount = 300;
    if (direction === -1) {
        grid.scrollBy({ top: -scrollAmount, behavior: 'smooth' });
    } else {
        grid.scrollBy({ top: scrollAmount, behavior: 'smooth' });
    }
    
    // Обновляем индикаторы после прокрутки
    setTimeout(updateScrollIndicator, 100);
}

function updateScrollIndicator() {
    const grid = document.getElementById('wallpaperGrid');
    const indicator = document.getElementById('scrollIndicator');
    if (!grid || !indicator) return;
    
    const scrollTop = grid.scrollTop;
    const maxScroll = grid.scrollHeight - grid.clientHeight;
    const scrollPercent = maxScroll > 0 ? scrollTop / maxScroll : 0;
    
    // Создаем индикаторы (10 штук)
    const numDots = 10;
    let dotsHtml = '';
    
    for (let i = 0; i < numDots; i++) {
        const dotPosition = i / (numDots - 1);
        const isActive = Math.abs(scrollPercent - dotPosition) < (1 / numDots);
        dotsHtml += `<div class="scroll-dot ${isActive ? 'active' : ''}" onclick="scrollToWallpaper(${i / (numDots - 1)})"></div>`;
    }
    
    indicator.innerHTML = dotsHtml;
}

function scrollToWallpaper(percent) {
    const grid = document.getElementById('wallpaperGrid');
    if (!grid) return;
    
    const maxScroll = grid.scrollHeight - grid.clientHeight;
    grid.scrollTo({ top: maxScroll * percent, behavior: 'smooth' });
    
    setTimeout(updateScrollIndicator, 100);
}

// Добавляем обработчик прокрутки для обновления индикаторов
function initWallpaperScroll() {
    const grid = document.getElementById('wallpaperGrid');
    if (grid) {
        grid.addEventListener('scroll', updateScrollIndicator);
        setTimeout(updateScrollIndicator, 100);
    }
}

// Запускаем при загрузке
document.addEventListener('DOMContentLoaded', function() {
    initWallpaperScroll();
});

// Также обновляем при открытии шага с обоями
const originalNextStep = window.nextStep;
window.nextStep = function(step) {
    if (originalNextStep) originalNextStep(step);
    if (step === 2) {
        setTimeout(updateScrollIndicator, 50);
    }
};
// ================== ТАЧ-ПРОКРУТКА ДЛЯ ОБОЕВ ==================

let wallpaperTouchStartY = 0;

document.querySelectorAll('.wallpaper-grid').forEach(grid => {
    grid.addEventListener('touchstart', (e) => {
        wallpaperTouchStartY = e.touches[0].clientY;
    });
    
    grid.addEventListener('touchmove', (e) => {
        const deltaY = wallpaperTouchStartY - e.touches[0].clientY;
        grid.scrollTop += deltaY;
        wallpaperTouchStartY = e.touches[0].clientY;
        e.preventDefault();
    }, { passive: false });
});
// ================== МОДАЛЬНОЕ ОКНО ДЛЯ ПРИЛОЖЕНИЙ ==================

function showAppDetails(app) {
    // Удаляем старые модалки
    const oldModal = document.querySelector('.app-modal');
    const oldOverlay = document.querySelector('.app-modal-overlay');
    if (oldModal) oldModal.remove();
    if (oldOverlay) oldOverlay.remove();
    
    // Создаем overlay
    const overlay = document.createElement('div');
    overlay.className = 'app-modal-overlay';
    overlay.onclick = closeAppModal;
    document.body.appendChild(overlay);
    
    // Создаем модальное окно
    const modal = document.createElement('div');
    modal.className = 'app-modal';
    modal.innerHTML = `
        <div class="app-modal-header">
            <i class="fas ${app.icon || 'fa-app-store'}"></i>
            <h3>${app.name || 'Приложение'}</h3>
        </div>
        <div class="app-modal-body">
            <p>${app.description || 'Описание отсутствует'}</p>
            <div class="app-modal-info">
                <span><i class="fas fa-star"></i> ${app.rating || '4.5'}</span>
                <span><i class="fas fa-download"></i> ${(app.downloads || 0).toLocaleString()}</span>
                <span><i class="fas fa-hdd"></i> ${app.size || 'N/A'}</span>
                <span><i class="fas fa-tag"></i> ${app.is_free ? 'Бесплатно' : app.price + ' ₽'}</span>
            </div>
        </div>
        <div class="app-modal-footer">
            <button class="setup-btn" onclick="downloadOnlineApp('${app.id}'); closeAppModal()">Установить</button>
            <button class="setup-btn secondary" onclick="closeAppModal()">Закрыть</button>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function closeAppModal() {
    const modal = document.querySelector('.app-modal');
    const overlay = document.querySelector('.app-modal-overlay');
    if (modal) modal.remove();
    if (overlay) overlay.remove();
}

// Обновляем функцию renderOnlineApps чтобы при клике на карточку открывалось окно
const originalRenderOnlineApps = renderOnlineApps;
renderOnlineApps = function(apps) {
    const appsGrid = document.getElementById('appsGrid');
    if (!appsGrid) return;
    
    appsGrid.innerHTML = '';
    apps.forEach(app => {
        const card = document.createElement('div');
        card.className = 'app-card';
        card.innerHTML = `
            <div class="app-icon"><i class="fas ${app.icon || 'fa-app-store'}"></i></div>
            <div class="app-title">${app.name}</div>
            <div class="app-desc">${app.description || ''}</div>
            <div class="app-meta">
                <span>${app.size || 'N/A'}</span>
                <span>⭐ ${app.rating || 0}</span>
            </div>
            <button class="install-btn" onclick="event.stopPropagation(); downloadOnlineApp('${app.id}')">
                ${app.is_free ? 'Бесплатно' : `${app.price} ₽`}
            </button>
        `;
        // Клик по карточке (не по кнопке) открывает детали
        card.onclick = (e) => {
            if(!e.target.classList.contains('install-btn')) {
                showAppDetails(app);
            }
        };
        appsGrid.appendChild(card);
    });
};
// ================== ОБНОВЛЕНИЕ BUILD 6032 ==================

// ================== НОВЫЙ БРАУЗЕР ==================
let browserTabs = [{ url: 'https://google.com', title: 'Google' }];
let browserHistory = ['https://google.com'];
let browserHistoryIndex = 0;

function openBrowserNew() {
    openApp('browserNew');
    document.getElementById('browserFrame').src = 'https://google.com';
}

function addBrowserTab() {
    const tabsContainer = document.getElementById('browserTabs');
    const tab = document.createElement('div');
    tab.className = 'browser-tab';
    const index = browserTabs.length;
    tab.innerHTML = `<span>Новая вкладка</span><button class="tab-close" onclick="closeBrowserTab(event, ${index})">×</button>`;
    tab.onclick = () => activateBrowserTab(index);
    tabsContainer.appendChild(tab);
    browserTabs.push({ url: 'https://google.com', title: 'Новая вкладка' });
    activateBrowserTab(index);
}

function closeBrowserTab(e, index) {
    e.stopPropagation();
    if (browserTabs.length === 1) return;
    browserTabs.splice(index, 1);
    const tabs = document.querySelectorAll('.browser-tab');
    tabs[index].remove();
    activateBrowserTab(0);
}

function activateBrowserTab(index) {
    document.querySelectorAll('.browser-tab').forEach(t => t.classList.remove('active'));
    const tabs = document.querySelectorAll('.browser-tab');
    if (tabs[index]) tabs[index].classList.add('active');
    if (browserTabs[index]) {
        document.getElementById('browserFrame').src = browserTabs[index].url;
        document.getElementById('browserUrlNew').value = browserTabs[index].url;
    }
}

function navigateBrowserNew() {
    const url = document.getElementById('browserUrlNew').value.trim();
    if (!url) return;
    
    let finalUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        finalUrl = 'https://' + url;
    }
    
    document.getElementById('browserFrame').src = finalUrl;
    document.getElementById('browserUrlNew').value = finalUrl;
    
    browserHistory.push(finalUrl);
    browserHistoryIndex = browserHistory.length - 1;
    
    const activeTab = document.querySelector('.browser-tab.active');
    if (activeTab) {
        const title = finalUrl.replace('https://', '').replace('http://', '').split('/')[0];
        activeTab.querySelector('span').textContent = title || 'Новая вкладка';
        const index = Array.from(document.querySelectorAll('.browser-tab')).indexOf(activeTab);
        if (browserTabs[index]) browserTabs[index].url = finalUrl;
    }
}

function refreshBrowserNew() {
    const frame = document.getElementById('browserFrame');
    frame.src = frame.src;
    showNotification('Браузер', 'Страница обновлена');
}

function goBackBrowser() {
    if (browserHistoryIndex > 0) {
        browserHistoryIndex--;
        const url = browserHistory[browserHistoryIndex];
        document.getElementById('browserFrame').src = url;
        document.getElementById('browserUrlNew').value = url;
    }
}

function goForwardBrowser() {
    if (browserHistoryIndex < browserHistory.length - 1) {
        browserHistoryIndex++;
        const url = browserHistory[browserHistoryIndex];
        document.getElementById('browserFrame').src = url;
        document.getElementById('browserUrlNew').value = url;
    }
}

function goHomeBrowser() {
    document.getElementById('browserFrame').src = 'https://google.com';
    document.getElementById('browserUrlNew').value = 'https://google.com';
}

// Обработка Enter в адресной строке
document.addEventListener('DOMContentLoaded', function() {
    const urlInput = document.getElementById('browserUrlNew');
    if (urlInput) {
        urlInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') navigateBrowserNew();
        });
    }
});

// ================== НОВЫЙ ПЛЕЕР ==================
let playerTracks = [
    { title: 'Summer Vibes', artist: 'Artist One', duration: 225 },
    { title: 'Night Drive', artist: 'Artist Two', duration: 180 },
    { title: 'Morning Light', artist: 'Artist Three', duration: 210 },
    { title: 'Urban Flow', artist: 'Artist Four', duration: 195 }
];
let playerCurrentTrack = 0;
let playerIsPlaying = false;
let playerProgress = 0;
let playerInterval = null;

function openPlayerNew() {
    openApp('playerNew');
    updatePlayerUI();
}

function playerPlayPause() {
    playerIsPlaying = !playerIsPlaying;
    const btn = document.getElementById('playerPlayBtn');
    btn.innerHTML = `<i class="fas fa-${playerIsPlaying ? 'pause' : 'play'}"></i>`;
    
    if (playerIsPlaying) {
        playerInterval = setInterval(() => {
            playerProgress += 0.5;
            if (playerProgress >= 100) {
                playerProgress = 0;
                playerNext();
            }
            document.getElementById('playerProgress').value = playerProgress;
            const current = Math.floor((playerProgress / 100) * playerTracks[playerCurrentTrack].duration);
            document.getElementById('playerCurrentTime').textContent = formatTime(current);
        }, 100);
    } else {
        clearInterval(playerInterval);
    }
}

function playerPrev() {
    playerCurrentTrack = (playerCurrentTrack - 1 + playerTracks.length) % playerTracks.length;
    playerProgress = 0;
    updatePlayerUI();
}

function playerNext() {
    playerCurrentTrack = (playerCurrentTrack + 1) % playerTracks.length;
    playerProgress = 0;
    updatePlayerUI();
}

function playerPlayTrack(index) {
    playerCurrentTrack = index;
    playerProgress = 0;
    updatePlayerUI();
    if (!playerIsPlaying) playerPlayPause();
}

function playerVolume() {
    showNotification('Плеер', 'Громкость: 80%');
}

function playerShuffle() {
    showNotification('Плеер', 'Перемешивание включено');
}

function playerRepeat() {
    showNotification('Плеер', 'Повтор включен');
}

function updatePlayerUI() {
    const track = playerTracks[playerCurrentTrack];
    document.querySelectorAll('#playerPlaylist .playlist-item').forEach(item => item.classList.remove('active'));
    const items = document.querySelectorAll('#playerPlaylist .playlist-item');
    if (items[playerCurrentTrack]) items[playerCurrentTrack].classList.add('active');
    document.getElementById('playerTotalTime').textContent = formatTime(track.duration);
    document.getElementById('playerProgress').value = 0;
    document.getElementById('playerCurrentTime').textContent = '0:00';
    
    // Визуализатор
    const viz = document.getElementById('playerVisualizer');
    viz.innerHTML = '';
    for (let i = 0; i < 40; i++) {
        const bar = document.createElement('div');
        bar.className = 'viz-bar';
        bar.style.height = Math.random() * 60 + 20 + 'px';
        viz.appendChild(bar);
    }
}

function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

// ================== НОВЫЙ ТЕРМИНАЛ ==================
function openTerminalNew() {
    openApp('terminalNew');
}

function handleTerminalNew(event) {
    if (event.key === 'Enter') {
        const input = document.getElementById('terminalInputNew');
        const output = document.getElementById('terminalOutputNew');
        const cmd = input.value.trim();
        
        if (cmd) {
            output.innerHTML += `<div class="terminal-line"><span class="prompt">user@soiav:~$</span> ${cmd}</div>`;
            
            const lowerCmd = cmd.toLowerCase();
            if (lowerCmd === 'help') {
                output.innerHTML += `
                    <div class="terminal-line">Доступные команды:</div>
                    <div class="terminal-line">  <span class="cmd">help</span> - помощь</div>
                    <div class="terminal-line">  <span class="cmd">clear</span> - очистить</div>
                    <div class="terminal-line">  <span class="cmd">date</span> - дата</div>
                    <div class="terminal-line">  <span class="cmd">time</span> - время</div>
                    <div class="terminal-line">  <span class="cmd">whoami</span> - пользователь</div>
                    <div class="terminal-line">  <span class="cmd">ls</span> - список файлов</div>
                    <div class="terminal-line">  <span class="cmd">version</span> - версия системы</div>
                    <div class="terminal-line">  <span class="cmd">echo [текст]</span> - вывод текста</div>
                    <div class="terminal-line">  <span class="cmd">neofetch</span> - информация о системе</div>
                    <div class="terminal-line">  <span class="cmd">calc</span> - открыть калькулятор</div>
                    <div class="terminal-line">  <span class="cmd">browser</span> - открыть браузер</div>
                `;
            } else if (lowerCmd === 'clear') {
                output.innerHTML = '';
            } else if (lowerCmd === 'date') {
                output.innerHTML += `<div class="terminal-line"><span class="cmd-success">${new Date().toLocaleDateString('ru-RU')}</span></div>`;
            } else if (lowerCmd === 'time') {
                output.innerHTML += `<div class="terminal-line"><span class="cmd-success">${new Date().toLocaleTimeString('ru-RU')}</span></div>`;
            } else if (lowerCmd === 'whoami') {
                output.innerHTML += `<div class="terminal-line"><span class="cmd-success">${currentUser.name}</span></div>`;
            } else if (lowerCmd === 'ls') {
                output.innerHTML += `
                    <div class="terminal-line">📁 Документы/</div>
                    <div class="terminal-line">📁 Загрузки/</div>
                    <div class="terminal-line">📁 Музыка/</div>
                    <div class="terminal-line">📁 Видео/</div>
                    <div class="terminal-line">📁 Изображения/</div>
                    <div class="terminal-line">📄 README.txt</div>
                    <div class="terminal-line">📄 config.ssap</div>
                `;
            } else if (lowerCmd === 'version') {
                output.innerHTML += `<div class="terminal-line"><span class="cmd-success">Soiav 2 RTM build 6032</span></div>`;
            } else if (lowerCmd === 'neofetch') {
                output.innerHTML += `
                    <div class="terminal-line" style="color:#00ff00;white-space:pre;">
╔═══════════════════════════════════════╗
║   Soiav 2 RTM build 6032             ║
║   OS: Soiav OS 64-bit                ║
║   Kernel: Soiav Kernel 5.15          ║
║   Shell: Soiav Shell v2.0            ║
║   Theme: ${document.documentElement.getAttribute('data-theme') || 'light'}                    ║
║   User: ${currentUser.name} ║
╚═══════════════════════════════════════╝
                    </div>
                `;
            } else if (lowerCmd === 'calc') {
                output.innerHTML += `<div class="terminal-line"><span class="cmd-success">Открываю калькулятор...</span></div>`;
                setTimeout(() => openApp('calculatorNew'), 500);
            } else if (lowerCmd === 'browser') {
                output.innerHTML += `<div class="terminal-line"><span class="cmd-success">Открываю браузер...</span></div>`;
                setTimeout(() => openBrowserNew(), 500);
            } else if (lowerCmd.startsWith('echo ')) {
                output.innerHTML += `<div class="terminal-line"><span class="cmd-success">${cmd.substring(5)}</span></div>`;
            } else {
                output.innerHTML += `<div class="terminal-line"><span class="cmd-error">Команда не найдена: ${cmd}</span></div>`;
            }
            
            input.value = '';
            output.scrollTop = output.scrollHeight;
        }
    }
}

// ================== НОВЫЙ КАЛЬКУЛЯТОР ==================
let calcDisplay = '0';
let calcExpression = '';
let calcResult = '';

function openCalculatorNew() {
    openApp('calculatorNew');
    calcDisplay = '0';
    document.getElementById('calcDisplay').textContent = '0';
}

function calcInput(value) {
    const display = document.getElementById('calcDisplay');
    
    if (value === 'C') {
        calcDisplay = '0';
        calcExpression = '';
        display.textContent = '0';
        return;
    }
    
    if (value === '±') {
        if (calcDisplay.startsWith('-')) {
            calcDisplay = calcDisplay.substring(1);
        } else if (calcDisplay !== '0') {
            calcDisplay = '-' + calcDisplay;
        }
        display.textContent = calcDisplay;
        return;
    }
    
    if (value === '%') {
        const num = parseFloat(calcDisplay);
        calcDisplay = (num / 100).toString();
        display.textContent = calcDisplay;
        return;
    }
    
    if (['+', '−', '×', '÷'].includes(value)) {
        if (calcExpression && !calcExpression.endsWith(' ')) {
            calcCalculate();
        }
        calcExpression = calcDisplay + ' ' + value + ' ';
        calcDisplay = '0';
        display.textContent = '0';
        return;
    }
    
    if (value === '.') {
        if (!calcDisplay.includes('.')) {
            calcDisplay += '.';
        }
        display.textContent = calcDisplay;
        return;
    }
    
    if (calcDisplay === '0' && value !== '.') {
        calcDisplay = value;
    } else {
        calcDisplay += value;
    }
    display.textContent = calcDisplay;
}

function calcCalculate() {
    const display = document.getElementById('calcDisplay');
    if (!calcExpression) return;
    
    const expression = calcExpression + calcDisplay;
    const parts = expression.split(' ');
    const num1 = parseFloat(parts[0]);
    const operator = parts[1];
    const num2 = parseFloat(parts[2]);
    
    if (isNaN(num1) || isNaN(num2)) return;
    
    let result = 0;
    switch(operator) {
        case '+': result = num1 + num2; break;
        case '−': result = num1 - num2; break;
        case '×': result = num1 * num2; break;
        case '÷': result = num2 !== 0 ? num1 / num2 : 'Ошибка'; break;
        default: return;
    }
    
    if (result === 'Ошибка') {
        display.textContent = 'Ошибка';
        calcDisplay = '0';
        calcExpression = '';
        return;
    }
    
    calcDisplay = result.toString();
    display.textContent = calcDisplay;
    calcExpression = '';
}

// ================== НОВАЯ ПАПКА ==================
function openFolderNew() {
    openApp('folderNew');
}

function folderNewFile() {
    showNotification('Папка', 'Создан новый файл');
}

function folderNewFolder() {
    showNotification('Папка', 'Создана новая папка');
}

function folderRefresh() {
    showNotification('Папка', 'Обновлено');
}

function folderOpen(name) {
    showNotification('Папка', `Открыта папка: ${name}`);
}

// ================== ОБНОВЛЕННЫЙ МАГАЗИН ==================

// Проверка сервера при запуске
async function checkStoreServer() {
    try {
        const response = await fetch('http://localhost:5000/api/store/stats');
        if (response.ok) {
            storeServerConnected = true;
            console.log('✅ Сервер магазина подключен');
            return true;
        }
    } catch(e) {
        console.log('❌ Сервер магазина не доступен');
    }
    storeServerConnected = false;
    return false;
}

// Загрузка приложений
async function loadStoreApps(category = 'all', search = '') {
    const grid = document.getElementById('appsGrid');
    if (!grid) return;
    
    grid.innerHTML = '<div class="store-loading"><div class="spinner"></div><p>Загрузка приложений...</p></div>';
    
    let apps = [];
    
    if (storeServerConnected) {
        try {
            const url = `http://localhost:5000/api/store/apps?category=${category}&search=${encodeURIComponent(search)}`;
            const response = await fetch(url);
            const data = await response.json();
            apps = data.items || [];
        } catch(e) {
            apps = getLocalApps();
        }
    } else {
        apps = getLocalApps();
    }
    
    renderStoreApps(apps);
}

function getLocalApps() {
    return [
        { id: "calc", name: "Калькулятор", price: 0, is_free: true, rating: 4.5, downloads: 1234, size: "2 MB", icon: "fa-calculator", category: "utilities", description: "Мощный калькулятор с историей" },
        { id: "notepad", name: "Блокнот", price: 0, is_free: true, rating: 4.3, downloads: 5678, size: "1 MB", icon: "fa-edit", category: "utilities", description: "Текстовый редактор с подсветкой" },
        { id: "snake", name: "Змейка 3D", price: 0, is_free: true, rating: 4.7, downloads: 3456, size: "3 MB", icon: "fa-gamepad", category: "games", description: "Классическая игра в 3D" },
        { id: "tetris", name: "Тетрис", price: 99, is_free: false, rating: 4.8, downloads: 7890, size: "5 MB", icon: "fa-th-large", category: "games", description: "Головоломка с новыми уровнями" },
        { id: "editor", name: "SSAP Editor", price: 0, is_free: true, rating: 4.9, downloads: 4321, size: "8 MB", icon: "fa-code", category: "dev", description: "Редактор кода SSAP" },
        { id: "player", name: "Media Player", price: 0, is_free: true, rating: 4.6, downloads: 2345, size: "6 MB", icon: "fa-music", category: "multimedia", description: "Мощный аудиоплеер" }
    ];
}

function renderStoreApps(apps) {
    const grid = document.getElementById('appsGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    apps.forEach(app => {
        const card = document.createElement('div');
        card.className = 'app-card';
        card.innerHTML = `
            <div class="app-icon"><i class="fas ${app.icon || 'fa-app-store'}"></i></div>
            <div class="app-title">${app.name}</div>
            <div class="app-desc">${app.description || ''}</div>
            <div class="app-meta">
                <span>${app.size || 'N/A'}</span>
                <span>⭐ ${app.rating || 0}</span>
                <span>📥 ${(app.downloads || 0).toLocaleString()}</span>
            </div>
            <button class="install-btn" onclick="event.stopPropagation(); installStoreApp('${app.id}')">
                ${app.is_free ? 'Бесплатно' : `${app.price} ₽`}
            </button>
        `;
        card.onclick = () => showAppDetailsModal(app);
        grid.appendChild(card);
    });
}

function installStoreApp(appId) {
    const app = getLocalApps().find(a => a.id === appId);
    if (!app) return;
    
    showNotification('Магазин', `Установка ${app.name}...`);
    
    let progress = 0;
    const interval = setInterval(() => {
        progress += 10;
        if (progress >= 100) {
            clearInterval(interval);
            if (!installedApps.has(appId)) {
                installedApps.add(appId);
                createDesktopIconForStoreApp(app);
                showNotification('Магазин', `${app.name} установлен!`);
            }
        }
    }, 200);
}

function createDesktopIconForStoreApp(app) {
    const container = document.querySelector('.desktop-icons');
    if (!container || document.querySelector(`.desktop-icon[data-app="${app.id}"]`)) return;
    
    const icon = document.createElement('div');
    icon.className = 'desktop-icon';
    icon.setAttribute('data-app', app.id);
    icon.innerHTML = `<i class="fas ${app.icon}"></i><span>${app.name}</span>`;
    icon.onclick = () => showNotification(app.name, 'Приложение запущено (демо)');
    container.appendChild(icon);
}

function showAppDetailsModal(app) {
    let modal = document.getElementById('appDetailsModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'appDetailsModal';
        modal.className = 'app-details-modal';
        document.body.appendChild(modal);
    }
    
    modal.innerHTML = `
        <div class="app-details-header">
            <i class="fas ${app.icon || 'fa-app-store'}"></i>
            <h2>${app.name}</h2>
        </div>
        <div class="app-details-body">
            <p>${app.description || 'Нет описания'}</p>
            <div class="app-details-features">
                <span class="feature-tag"><i class="fas fa-star"></i> ${app.rating || 0}</span>
                <span class="feature-tag"><i class="fas fa-download"></i> ${(app.downloads || 0).toLocaleString()}</span>
                <span class="feature-tag"><i class="fas fa-hdd"></i> ${app.size || 'N/A'}</span>
                <span class="feature-tag"><i class="fas fa-tag"></i> ${app.is_free ? 'Бесплатно' : `${app.price} ₽`}</span>
            </div>
        </div>
        <div class="app-details-footer">
            <button class="setup-btn" onclick="installStoreApp('${app.id}'); closeAppDetailsModal()">Установить</button>
            <button class="setup-btn secondary" onclick="closeAppDetailsModal()">Закрыть</button>
        </div>
    `;
    modal.style.display = 'block';
}

function closeAppDetailsModal() {
    const modal = document.getElementById('appDetailsModal');
    if (modal) modal.style.display = 'none';
}

// ================== ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ ==================

// Функция для добавления новых иконок в меню пуск (без эмодзи)
function addNewStartMenuItems() {
    const startApps = document.querySelector('.start-menu-apps');
    if (!startApps) return;
    
    const newItems = [
        { name: 'Браузер', icon: 'fa-globe', action: 'browserNew' },
        { name: 'Плеер', icon: 'fa-headphones', action: 'playerNew' },
        { name: 'Терминал', icon: 'fa-terminal', action: 'terminalNew' },
        { name: 'Калькулятор', icon: 'fa-calculator', action: 'calculatorNew' },
        { name: 'Мои документы', icon: 'fa-folder-open', action: 'folderNew' }
    ];
    
    newItems.forEach(item => {
        const el = document.createElement('div');
        el.className = 'start-menu-item';
        el.innerHTML = `<i class="fas ${item.icon}"></i><span>${item.name}</span>`;
        el.onclick = () => {
            if (item.action === 'browserNew') openBrowserNew();
            else if (item.action === 'playerNew') openPlayerNew();
            else if (item.action === 'terminalNew') openTerminalNew();
            else if (item.action === 'calculatorNew') openCalculatorNew();
            else if (item.action === 'folderNew') openFolderNew();
            else openApp(item.action);
            toggleStartMenu();
        };
        startApps.appendChild(el);
    });
}

// Запуск при загрузке
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        addNewStartMenuItems();
        checkStoreServer();
    }, 500);
});
// ================== НОВЫЕ ПРИЛОЖЕНИЯ ==================

// ===== 1. ЧАТ (MESSENGER) =====
function openChatApp() {
    openApp('chatApp');
}

let chatContacts = [
    { name: 'Алексей', msg: 'Привет!', time: '12:30', online: true },
    { name: 'Мария', msg: 'Как дела?', time: '11:15', online: true },
    { name: 'Дмитрий', msg: 'Встреча завтра', time: 'Вчера', online: false },
    { name: 'Екатерина', msg: 'Спасибо!', time: 'Вчера', online: false }
];

let chatMessages = {
    0: [
        { text: 'Привет! Как дела?', sent: false, time: '12:25' },
        { text: 'Привет! Всё отлично, а у тебя?', sent: true, time: '12:27' },
        { text: 'Тоже хорошо! Что нового?', sent: false, time: '12:30' }
    ],
    1: [
        { text: 'Привет, Мария!', sent: true, time: '11:10' },
        { text: 'Привет! Как жизнь?', sent: false, time: '11:12' },
        { text: 'Отлично! А у тебя?', sent: true, time: '11:15' }
    ],
    2: [
        { text: 'Завтра встреча в 10:00', sent: false, time: 'Вчера 18:00' },
        { text: 'Ок, буду', sent: true, time: 'Вчера 18:05' }
    ],
    3: [
        { text: 'Спасибо за помощь!', sent: false, time: 'Вчера 15:00' },
        { text: 'Всегда пожалуйста!', sent: true, time: 'Вчера 15:02' }
    ]
};

let currentChat = 0;

function selectChat(index) {
    currentChat = index;
    document.querySelectorAll('.contact').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.contact')[index].classList.add('active');
    
    const contact = chatContacts[index];
    document.querySelector('.chat-user .chat-user-name').textContent = contact.name;
    document.querySelector('.chat-user .chat-user-status').textContent = contact.online ? 'В сети' : 'Был(а) недавно';
    document.querySelector('.chat-user img').src = `https://i.pravatar.cc/40?img=${index + 1}`;
    
    renderMessages();
}

function renderMessages() {
    const container = document.getElementById('chatMessages');
    container.innerHTML = '';
    
    chatMessages[currentChat].forEach(msg => {
        const div = document.createElement('div');
        div.className = `message ${msg.sent ? 'sent' : 'received'}`;
        div.innerHTML = `
            <div class="message-text">${msg.text}</div>
            <span class="message-time">${msg.time}</span>
        `;
        container.appendChild(div);
    });
    
    container.scrollTop = container.scrollHeight;
}

function chatSend(event) {
    if (event.key === 'Enter') {
        chatSendMessage();
    }
}

function chatSendMessage() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text) return;
    
    const now = new Date();
    const time = now.getHours() + ':' + now.getMinutes().toString().padStart(2, '0');
    
    chatMessages[currentChat].push({
        text: text,
        sent: true,
        time: time
    });
    
    renderMessages();
    input.value = '';
    
    // Имитация ответа
    setTimeout(() => {
        const responses = ['Понял!', 'Хорошо!', 'Ок', '👍', 'Спасибо!', 'Отлично!'];
        chatMessages[currentChat].push({
            text: responses[Math.floor(Math.random() * responses.length)],
            sent: false,
            time: new Date().getHours() + ':' + new Date().getMinutes().toString().padStart(2, '0')
        });
        renderMessages();
    }, 1000 + Math.random() * 2000);
}

function chatEmoji() {
    const emojis = ['😊', '😂', '❤️', '👍', '🔥', '💪', '🎉', '👋'];
    const input = document.getElementById('chatInput');
    input.value += emojis[Math.floor(Math.random() * emojis.length)];
    input.focus();
}

// ===== 2. ЗАМЕТКИ =====
function openNotesApp() {
    openApp('notesApp');
}

let notes = [
    { id: 1, title: 'Список покупок', text: 'Хлеб, Молоко, Яйца, Масло', date: 'Сегодня' },
    { id: 2, title: 'Идеи для проекта', text: '1. Новый дизайн\n2. Улучшить производительность\n3. Добавить тёмную тему', date: 'Вчера' }
];

let currentNote = null;

function renderNotes() {
    const container = document.getElementById('notesList');
    container.innerHTML = '';
    
    notes.forEach(note => {
        const div = document.createElement('div');
        div.className = `note-item${currentNote && currentNote.id === note.id ? ' active' : ''}`;
        div.innerHTML = `
            <div class="note-title">${note.title}</div>
            <div class="note-preview">${note.text.substring(0, 30)}${note.text.length > 30 ? '...' : ''}</div>
            <div class="note-date">${note.date}</div>
        `;
        div.onclick = () => selectNote(note.id);
        container.appendChild(div);
    });
}

function selectNote(id) {
    currentNote = notes.find(n => n.id === id);
    if (currentNote) {
        document.getElementById('noteEditor').style.display = 'block';
        document.getElementById('noteTitle').value = currentNote.title;
        document.getElementById('noteText').value = currentNote.text;
        renderNotes();
    }
}

function notesNew() {
    const newNote = {
        id: Date.now(),
        title: 'Новая заметка',
        text: 'Введите текст...',
        date: 'Сейчас'
    };
    notes.unshift(newNote);
    currentNote = newNote;
    renderNotes();
    document.getElementById('noteEditor').style.display = 'block';
    document.getElementById('noteTitle').value = newNote.title;
    document.getElementById('noteText').value = newNote.text;
}

function notesSave() {
    if (!currentNote) return;
    currentNote.title = document.getElementById('noteTitle').value || 'Без названия';
    currentNote.text = document.getElementById('noteText').value || '';
    currentNote.date = 'Только что';
    renderNotes();
    showNotification('Заметки', 'Заметка сохранена');
}

function notesDelete() {
    if (!currentNote) return;
    if (confirm('Удалить заметку?')) {
        notes = notes.filter(n => n.id !== currentNote.id);
        currentNote = null;
        renderNotes();
        document.getElementById('noteEditor').style.display = 'none';
        showNotification('Заметки', 'Заметка удалена');
    }
}

function notesSearch() {
    const query = document.getElementById('notesSearch').value.toLowerCase();
    const container = document.getElementById('notesList');
    container.innerHTML = '';
    
    const filtered = notes.filter(n => 
        n.title.toLowerCase().includes(query) || 
        n.text.toLowerCase().includes(query)
    );
    
    filtered.forEach(note => {
        const div = document.createElement('div');
        div.className = 'note-item';
        div.innerHTML = `
            <div class="note-title">${note.title}</div>
            <div class="note-preview">${note.text.substring(0, 30)}${note.text.length > 30 ? '...' : ''}</div>
            <div class="note-date">${note.date}</div>
        `;
        div.onclick = () => selectNote(note.id);
        container.appendChild(div);
    });
}

// ===== 3. ПОГОДА =====
function openWeatherApp() {
    openApp('weatherApp');
}

let weatherCities = [
    { name: 'Москва', temp: 23, condition: 'Солнечно', icon: 'fa-sun', humidity: 65, wind: 3 },
    { name: 'Санкт-Петербург', temp: 18, condition: 'Облачно', icon: 'fa-cloud', humidity: 78, wind: 5 },
    { name: 'Новосибирск', temp: 21, condition: 'Ясно', icon: 'fa-sun', humidity: 55, wind: 2 },
    { name: 'Екатеринбург', temp: 19, condition: 'Дождь', icon: 'fa-cloud-rain', humidity: 82, wind: 4 }
];

let currentCity = 0;
let weatherForecast = [
    { day: 'Пн', temp: 23, icon: 'fa-sun' },
    { day: 'Вт', temp: 22, icon: 'fa-sun' },
    { day: 'Ср', temp: 19, icon: 'fa-cloud-sun' },
    { day: 'Чт', temp: 17, icon: 'fa-cloud-rain' },
    { day: 'Пт', temp: 20, icon: 'fa-cloud-sun' },
    { day: 'Сб', temp: 24, icon: 'fa-sun' }
];

function renderWeather() {
    const city = weatherCities[currentCity];
    document.getElementById('weatherCityName').textContent = city.name;
    document.getElementById('weatherTemp').textContent = city.temp + '°C';
    document.getElementById('weatherCondition').textContent = city.condition;
    document.getElementById('weatherIcon').className = `fas ${city.icon}`;
    document.getElementById('weatherHumidity').textContent = city.humidity + '%';
    document.getElementById('weatherWind').textContent = city.wind + ' м/с';
    
    const forecast = document.getElementById('weatherForecastList');
    forecast.innerHTML = '';
    weatherForecast.forEach(day => {
        const div = document.createElement('div');
        div.className = 'forecast-item';
        div.innerHTML = `
            <div>${day.day}</div>
            <i class="fas ${day.icon}"></i>
            <div>${day.temp}°</div>
        `;
        forecast.appendChild(div);
    });
}

function weatherSearch() {
    const query = document.getElementById('weatherSearchInput').value.trim();
    if (!query) return;
    
    const found = weatherCities.find(c => c.name.toLowerCase() === query.toLowerCase());
    if (found) {
        currentCity = weatherCities.indexOf(found);
        renderWeather();
        showNotification('Погода', `Погода в ${found.name}`);
    } else {
        showNotification('Погода', 'Город не найден');
    }
}

function weatherChangeCity(dir) {
    currentCity = (currentCity + dir + weatherCities.length) % weatherCities.length;
    renderWeather();
}

// ===== 4. ЗАДАЧИ =====
function openTasksApp() {
    openApp('tasksApp');
}

let tasks = [
    { id: 1, title: 'Завершить проект', done: false, priority: 'high' },
    { id: 2, title: 'Купить продукты', done: false, priority: 'medium' },
    { id: 3, title: 'Позвонить маме', done: true, priority: 'low' }
];

function renderTasks() {
    const container = document.getElementById('tasksList');
    container.innerHTML = '';
    
    tasks.forEach(task => {
        const div = document.createElement('div');
        div.className = `task-item${task.done ? ' done' : ''}`;
        div.innerHTML = `
            <input type="checkbox" ${task.done ? 'checked' : ''} onchange="toggleTask(${task.id})">
            <span>${task.title}</span>
            <span class="task-priority ${task.priority}">${task.priority}</span>
            <button onclick="deleteTask(${task.id})"><i class="fas fa-times"></i></button>
        `;
        container.appendChild(div);
    });
}

function addTask() {
    const input = document.getElementById('taskInput');
    const text = input.value.trim();
    if (!text) return;
    
    tasks.push({
        id: Date.now(),
        title: text,
        done: false,
        priority: 'medium'
    });
    input.value = '';
    renderTasks();
    showNotification('Задачи', 'Задача добавлена');
}

function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.done = !task.done;
        renderTasks();
    }
}

function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    renderTasks();
    showNotification('Задачи', 'Задача удалена');
}

// ===== 5. ПЕРЕВОДЧИК =====
function openTranslateApp() {
    openApp('translateApp');
}

function translateText() {
    const input = document.getElementById('translateInput').value.trim();
    if (!input) return;
    
    const output = document.getElementById('translateOutput');
    output.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Перевод...';
    
    setTimeout(() => {
        const translations = {
            'привет': 'Hello',
            'мир': 'World',
            'как дела': 'How are you',
            'спасибо': 'Thank you',
            'пока': 'Goodbye',
            'я люблю': 'I love'
        };
        
        let result = input;
        for (let [key, val] of Object.entries(translations)) {
            if (input.toLowerCase().includes(key)) {
                result = result.replace(new RegExp(key, 'gi'), val);
                break;
            }
        }
        
        if (result === input) {
            result = 'Перевод не найден. Попробуйте: привет, мир, как дела, спасибо, пока, я люблю';
        }
        
        output.textContent = result;
    }, 500);
}

// ===== 6. ДИКТОФОН =====
function openRecorderApp() {
    openApp('recorderApp');
}

let isRecording = false;
let recordings = [
    { name: 'Запись 1', duration: '0:45', date: 'Сегодня' },
    { name: 'Запись 2', duration: '1:20', date: 'Вчера' }
];

function toggleRecording() {
    isRecording = !isRecording;
    const btn = document.getElementById('recordingBtn');
    btn.innerHTML = `<i class="fas fa-${isRecording ? 'stop' : 'microphone'}"></i>`;
    btn.className = `record-btn ${isRecording ? 'recording' : ''}`;
    document.getElementById('recordingStatus').textContent = isRecording ? '🔴 Запись...' : 'Готово к записи';
    
    if (isRecording) {
        showNotification('Диктофон', 'Запись начата');
        setTimeout(() => {
            if (isRecording) {
                isRecording = false;
                document.getElementById('recordingBtn').innerHTML = '<i class="fas fa-microphone"></i>';
                document.getElementById('recordingBtn').className = 'record-btn';
                document.getElementById('recordingStatus').textContent = 'Готово к записи';
                recordings.push({ name: 'Запись ' + (recordings.length + 1), duration: '0:30', date: 'Сейчас' });
                renderRecordings();
                showNotification('Диктофон', 'Запись сохранена');
            }
        }, 3000);
    } else {
        showNotification('Диктофон', 'Запись остановлена');
    }
}

function renderRecordings() {
    const container = document.getElementById('recordingsList');
    container.innerHTML = '';
    recordings.forEach(rec => {
        const div = document.createElement('div');
        div.className = 'recording-item';
        div.innerHTML = `
            <i class="fas fa-file-audio"></i>
            <div>
                <div>${rec.name}</div>
                <div style="font-size:12px;color:var(--text-secondary);">${rec.duration} · ${rec.date}</div>
            </div>
            <button onclick="playRecording('${rec.name}')"><i class="fas fa-play"></i></button>
        `;
        container.appendChild(div);
    });
}

function playRecording(name) {
    showNotification('Диктофон', `Воспроизведение: ${name}`);
}

// ===== 7. СКАНЕР =====
function openScannerApp() {
    openApp('scannerApp');
}

function startScan() {
    showNotification('Сканер', 'Сканирование начато...');
    const status = document.getElementById('scanStatus');
    status.textContent = '🔍 Сканирование...';
    status.style.color = '#ffc107';
    
    let progress = 0;
    const interval = setInterval(() => {
        progress += 10;
        document.getElementById('scanProgress').style.width = progress + '%';
        if (progress >= 100) {
            clearInterval(interval);
            status.textContent = '✅ Готово! Документ отсканирован';
            status.style.color = '#4caf50';
            showNotification('Сканер', 'Сканирование завершено');
        }
    }, 500);
}

// ===== 8. ЧАСЫ =====
function openClockApp() {
    openApp('clockApp');
    updateClock();
    setInterval(updateClock, 1000);
}

function updateClock() {
    const now = new Date();
    document.getElementById('clockTime').textContent = now.toLocaleTimeString('ru-RU');
    document.getElementById('clockDate').textContent = now.toLocaleDateString('ru-RU', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

// ===== 9. КОМПАС =====
function openCompassApp() {
    openApp('compassApp');
    // Имитация работы компаса
    let angle = 0;
    setInterval(() => {
        angle = (angle + 1) % 360;
        document.getElementById('compassNeedle').style.transform = `rotate(${angle}deg)`;
        document.getElementById('compassDegree').textContent = Math.round(angle) + '°';
        
        const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        document.getElementById('compassDirection').textContent = dirs[Math.round(angle / 45) % 8];
    }, 50);
}

// ===== 10. ФОНАРИК =====
function openFlashlightApp() {
    openApp('flashlightApp');
}

let flashlightOn = false;

function toggleFlashlight() {
    flashlightOn = !flashlightOn;
    const light = document.getElementById('flashlightLight');
    const btn = document.getElementById('flashlightBtn');
    
    if (flashlightOn) {
        light.style.display = 'block';
        btn.innerHTML = '<i class="fas fa-power-off"></i> Выключить';
        btn.className = 'flashlight-btn on';
        document.body.style.background = '#fff';
        document.body.style.color = '#000';
        showNotification('Фонарик', '🔦 Включен');
    } else {
        light.style.display = 'none';
        btn.innerHTML = '<i class="fas fa-power-off"></i> Включить';
        btn.className = 'flashlight-btn';
        document.body.style.background = '';
        document.body.style.color = '';
        showNotification('Фонарик', 'Выключен');
    }
}
// ================== BUILD 6032 - УЛУЧШЕНИЯ СУЩЕСТВУЮЩИХ ПРИЛОЖЕНИЙ ==================

// ===== 1. ПРОВОДНИК - ДОБАВЛЯЕМ ОБЛАЧНЫЕ ДИСКИ =====
const originalOpenFolder = openFolder;
openFolder = function(folderName) {
    if (folderName === 'cloud') {
        document.getElementById('addressBar').textContent = 'Этот компьютер > SID Cloud';
        document.getElementById('fileGrid').innerHTML = `
            <div class="file-item" onclick="openCloudFile('document')">
                <i class="fas fa-file-alt"></i>
                <span>Документ SID.txt</span>
            </div>
            <div class="file-item" onclick="openCloudFile('photo')">
                <i class="fas fa-image"></i>
                <span>Фото SID.jpg</span>
            </div>
            <div class="file-item" onclick="openCloudFile('ssap')">
                <i class="fas fa-code"></i>
                <span>app.ssap</span>
            </div>
            <div class="file-item" onclick="openCloudFile('music')">
                <i class="fas fa-music"></i>
                <span>трек SID.mp3</span>
            </div>
        `;
        showNotification('Проводник', 'SID Cloud подключен');
        return;
    }
    originalOpenFolder(folderName);
};

function openCloudFile(type) {
    const names = {
        'document': 'Документ',
        'photo': 'Фото',
        'ssap': 'SSAP файл',
        'music': 'Музыка'
    };
    showNotification('SID Cloud', `Открыт: ${names[type] || type}`);
    if (type === 'ssap') {
        openApp('ssapCompiler');
    }
}

// ===== 2. БРАУЗЕР - ВКЛАДКИ И НАВИГАЦИЯ =====
let browserTabs = [{ url: 'https://google.com', title: 'Google' }];
let browserHistory = ['https://google.com'];
let browserHistoryIndex = 0;

function addBrowserTab() {
    const tabsContainer = document.querySelector('.browser-tabs-container');
    if (!tabsContainer) {
        // Создаем контейнер если его нет
        const toolbar = document.querySelector('.browser-bar');
        if (toolbar) {
            const container = document.createElement('div');
            container.className = 'browser-tabs-container';
            container.style.cssText = 'display:flex;gap:4px;margin-bottom:10px;flex-wrap:wrap;';
            toolbar.parentNode.insertBefore(container, toolbar);
        }
    }
    
    const container = document.querySelector('.browser-tabs-container') || document.querySelector('.browser-bar');
    const tab = document.createElement('div');
    tab.className = 'browser-tab';
    tab.style.cssText = 'padding:6px 12px;background:var(--bg-tertiary);border-radius:8px 8px 0 0;cursor:pointer;display:flex;align-items:center;gap:8px;font-size:12px;';
    const index = browserTabs.length;
    tab.innerHTML = `<span>Новая вкладка</span><span onclick="event.stopPropagation();closeBrowserTab(${index})" style="cursor:pointer;padding:0 4px;">×</span>`;
    tab.onclick = () => activateBrowserTab(index);
    container.appendChild(tab);
    browserTabs.push({ url: 'https://google.com', title: 'Новая вкладка' });
    activateBrowserTab(index);
}

function closeBrowserTab(index) {
    if (browserTabs.length === 1) return;
    browserTabs.splice(index, 1);
    const tabs = document.querySelectorAll('.browser-tab');
    if (tabs[index]) tabs[index].remove();
    activateBrowserTab(0);
}

function activateBrowserTab(index) {
    document.querySelectorAll('.browser-tab').forEach(t => t.style.background = 'var(--bg-tertiary)');
    const tabs = document.querySelectorAll('.browser-tab');
    if (tabs[index]) {
        tabs[index].style.background = 'var(--accent-color)';
        tabs[index].style.color = 'white';
    }
    if (browserTabs[index]) {
        const url = browserTabs[index].url;
        document.querySelector('.url-bar').value = url;
        // Имитация загрузки страницы
        const content = document.querySelector('.browser-content');
        if (content) {
            content.innerHTML = `
                <div style="padding:20px;text-align:center;">
                    <i class="fas fa-globe" style="font-size:48px;color:var(--accent-color);margin-bottom:20px;"></i>
                    <h3>${browserTabs[index].title}</h3>
                    <p style="color:var(--text-secondary);">Страница загружена: ${url}</p>
                    <div style="margin-top:20px;display:flex;gap:10px;justify-content:center;">
                        <button onclick="window.open('${url}','_blank')" class="toolbar-btn">Открыть в новой вкладке</button>
                    </div>
                </div>
            `;
        }
    }
}

// Переопределяем функцию браузера
const originalBrowserOpen = openApp;
openApp = function(appId) {
    originalBrowserOpen(appId);
    if (appId === 'browser') {
        setTimeout(() => {
            // Добавляем кнопку новой вкладки
            const toolbar = document.querySelector('.browser-bar');
            if (toolbar && !document.querySelector('.browser-tabs-container')) {
                const container = document.createElement('div');
                container.className = 'browser-tabs-container';
                container.style.cssText = 'display:flex;gap:4px;margin-bottom:10px;flex-wrap:wrap;align-items:center;';
                container.innerHTML = `
                    <div class="browser-tab" style="padding:6px 12px;background:var(--accent-color);color:white;border-radius:8px 8px 0 0;cursor:pointer;display:flex;align-items:center;gap:8px;font-size:12px;">
                        <span>Google</span>
                    </div>
                    <button onclick="addBrowserTab()" style="background:var(--bg-tertiary);border:none;padding:6px 12px;border-radius:8px;cursor:pointer;font-size:14px;">+</button>
                `;
                toolbar.parentNode.insertBefore(container, toolbar);
                
                // Добавляем кнопку "Домой"
                const controls = document.querySelector('.browser-controls');
                if (controls) {
                    const homeBtn = document.createElement('button');
                    homeBtn.className = 'browser-btn';
                    homeBtn.innerHTML = '<i class="fas fa-home"></i>';
                    homeBtn.onclick = () => {
                        document.querySelector('.url-bar').value = 'https://google.com';
                        document.querySelector('.browser-content').innerHTML = `
                            <div style="padding:20px;text-align:center;">
                                <i class="fas fa-globe" style="font-size:48px;color:var(--accent-color);margin-bottom:20px;"></i>
                                <h3>Google</h3>
                                <p style="color:var(--text-secondary);">Поисковая система</p>
                            </div>
                        `;
                    };
                    controls.appendChild(homeBtn);
                }
            }
        }, 100);
    }
};

// ===== 3. МАГАЗИН - ПОДКЛЮЧЕНИЕ К СЕРВЕРУ =====
let storeConnected = false;

async function checkStoreConnection() {
    try {
        const response = await fetch('http://localhost:5000/api/store/stats');
        if (response.ok) {
            storeConnected = true;
            console.log('✅ Магазин подключен к серверу');
            return true;
        }
    } catch(e) {
        console.log('❌ Сервер магазина не запущен');
    }
    storeConnected = false;
    return false;
}

async function loadStoreApps(category = 'all', search = '') {
    const grid = document.getElementById('appsGrid');
    if (!grid) return;
    
    grid.innerHTML = '<div style="text-align:center;padding:30px;"><div class="loading-spinner"></div><p>Загрузка приложений...</p></div>';
    
    let apps = [];
    
    if (storeConnected) {
        try {
            const url = `http://localhost:5000/api/store/apps?category=${category}&search=${encodeURIComponent(search)}`;
            const response = await fetch(url);
            const data = await response.json();
            apps = data.items || [];
        } catch(e) {
            apps = getLocalApps();
        }
    } else {
        apps = getLocalApps();
    }
    
    renderStoreApps(apps);
}

function getLocalApps() {
    return [
        { id: "calc", name: "Калькулятор", price: 0, is_free: true, rating: 4.5, downloads: 1234, size: "2 MB", icon: "fa-calculator", category: "utilities", description: "Мощный калькулятор" },
        { id: "notes", name: "Заметки", price: 0, is_free: true, rating: 4.7, downloads: 5678, size: "4 MB", icon: "fa-sticky-note", category: "productivity", description: "Умные заметки" },
        { id: "weather", name: "Погода", price: 0, is_free: true, rating: 4.6, downloads: 21340, size: "8 MB", icon: "fa-cloud-sun", category: "utilities", description: "Точный прогноз" },
        { id: "tasks", name: "Задачи", price: 0, is_free: true, rating: 4.8, downloads: 6720, size: "3 MB", icon: "fa-tasks", category: "productivity", description: "Менеджер задач" },
        { id: "translate", name: "Переводчик", price: 0, is_free: true, rating: 4.5, downloads: 3420, size: "6 MB", icon: "fa-language", category: "utilities", description: "Переводчик 100+ языков" }
    ];
}

function renderStoreApps(apps) {
    const grid = document.getElementById('appsGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    apps.forEach(app => {
        const card = document.createElement('div');
        card.className = 'app-card';
        card.innerHTML = `
            <div class="app-icon"><i class="fas ${app.icon || 'fa-app-store'}"></i></div>
            <div class="app-title">${app.name}</div>
            <div class="app-desc">${app.description || ''}</div>
            <div class="app-meta">
                <span>${app.size || 'N/A'}</span>
                <span>⭐ ${app.rating || 0}</span>
                <span>📥 ${(app.downloads || 0).toLocaleString()}</span>
            </div>
            <button class="install-btn" onclick="event.stopPropagation();installStoreApp('${app.id}')">
                ${app.is_free ? 'Бесплатно' : `${app.price} ₽`}
            </button>
        `;
        grid.appendChild(card);
    });
}

function installStoreApp(appId) {
    const apps = getLocalApps();
    const app = apps.find(a => a.id === appId);
    if (!app) return;
    
    showNotification('Магазин', `Установка ${app.name}...`);
    
    let progress = 0;
    const interval = setInterval(() => {
        progress += 10;
        if (progress >= 100) {
            clearInterval(interval);
            if (!installedApps.has(appId)) {
                installedApps.add(appId);
                createStoreIcon(app);
                showNotification('Магазин', `${app.name} установлен!`);
            }
        }
    }, 200);
}

function createStoreIcon(app) {
    const container = document.querySelector('.desktop-icons');
    if (!container || document.querySelector(`.desktop-icon[data-app="${app.id}"]`)) return;
    
    const icon = document.createElement('div');
    icon.className = 'desktop-icon';
    icon.setAttribute('data-app', app.id);
    icon.innerHTML = `<i class="fas ${app.icon}"></i><span>${app.name}</span>`;
    icon.onclick = () => showNotification(app.name, 'Приложение запущено');
    container.appendChild(icon);
}

// Проверяем сервер при открытии магазина
const originalStoreOpen = openApp;
openApp = function(appId) {
    originalStoreOpen(appId);
    if (appId === 'store') {
        setTimeout(() => {
            checkStoreConnection().then(() => {
                loadStoreApps();
                // Добавляем поиск
                const searchInput = document.querySelector('.search-bar input');
                if (searchInput) {
                    searchInput.addEventListener('input', (e) => {
                        loadStoreApps('all', e.target.value);
                    });
                }
                // Категории
                document.querySelectorAll('.category-btn').forEach(btn => {
                    btn.onclick = () => {
                        document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        const cat = btn.textContent === 'Все' ? 'all' : 
                                   btn.textContent === 'Игры' ? 'games' :
                                   btn.textContent === 'SSAP' ? 'ssap' : 'apps';
                        loadStoreApps(cat);
                    };
                });
            });
        }, 200);
    }
};

// ===== 4. НАСТРОЙКИ - НОВЫЕ РАЗДЕЛЫ =====
const originalLoadSettings = loadSettingsContent;
loadSettingsContent = function(categoryId) {
    originalLoadSettings(categoryId);
    
    if (categoryId === 'system') {
        const section = document.querySelector('.settings-section.active');
        if (section) {
            section.innerHTML += `
                <div class="setting-item">
                    <div class="setting-info">
                        <div class="setting-title">SID Cloud</div>
                        <div class="setting-desc">Облачное хранилище</div>
                    </div>
                    <button class="setting-btn" onclick="showNotification('SID Cloud','Подключено')">Подключить</button>
                </div>
                <div class="setting-item">
                    <div class="setting-info">
                        <div class="setting-title">Автообновление</div>
                        <div class="setting-desc">Автоматически обновлять приложения</div>
                    </div>
                    <input type="checkbox" checked onchange="showNotification('Обновления',this.checked?'Включено':'Выключено')">
                </div>
            `;
        }
    }
    
    if (categoryId === 'personalization') {
        const section = document.querySelector('.settings-section.active');
        if (section) {
            section.innerHTML += `
                <div class="setting-item">
                    <div class="setting-info">
                        <div class="setting-title">Анимации</div>
                        <div class="setting-desc">Включить анимации интерфейса</div>
                    </div>
                    <input type="checkbox" checked onchange="showNotification('Анимации',this.checked?'Включены':'Выключены')">
                </div>
                <div class="setting-item">
                    <div class="setting-info">
                        <div class="setting-title">Прозрачность</div>
                        <div class="setting-desc">Эффект прозрачности окон</div>
                    </div>
                    <input type="range" min="0" max="100" value="80" onchange="showNotification('Прозрачность',this.value+'%')">
                </div>
            `;
        }
    }
};

// ===== 5. ТЕРМИНАЛ - НОВЫЕ КОМАНДЫ =====
const originalTerminal = handleTerminalCommand;
handleTerminalCommand = function(command, output) {
    const cmd = command.toLowerCase();
    
    if (cmd === 'help') {
        output.innerHTML += `
            <div class="terminal-line">Доступные команды:</div>
            <div class="terminal-line">  <span class="command">help</span> - показать помощь</div>
            <div class="terminal-line">  <span class="command">clear</span> - очистить экран</div>
            <div class="terminal-line">  <span class="command">date</span> - показать дату</div>
            <div class="terminal-line">  <span class="command">time</span> - показать время</div>
            <div class="terminal-line">  <span class="command">whoami</span> - показать пользователя</div>
            <div class="terminal-line">  <span class="command">ls</span> - список файлов</div>
            <div class="terminal-line">  <span class="command">pwd</span> - текущая директория</div>
            <div class="terminal-line">  <span class="command">echo [текст]</span> - вывести текст</div>
            <div class="terminal-line">  <span class="command">version</span> - версия системы</div>
            <div class="terminal-line">  <span class="command">neofetch</span> - информация о системе</div>
            <div class="terminal-line">  <span class="command">calc</span> - открыть калькулятор</div>
            <div class="terminal-line">  <span class="command">browser</span> - открыть браузер</div>
            <div class="terminal-line">  <span class="command">store</span> - открыть магазин</div>
            <div class="terminal-line">  <span class="command">settings</span> - открыть настройки</div>
        `;
        return;
    }
    
    if (cmd === 'neofetch') {
        output.innerHTML += `
            <div class="terminal-line" style="color:#00ff00;white-space:pre;">
╔═══════════════════════════════════════╗
║   Soiav 2 RTM build 6032             ║
║   OS: Soiav OS 64-bit                ║
║   Kernel: Soiav Kernel 5.15          ║
║   Shell: Soiav Shell v2.0            ║
║   Theme: ${document.documentElement.getAttribute('data-theme') || 'light'}                    ║
║   User: ${currentUser.name} ║
╚═══════════════════════════════════════╝
            </div>
        `;
        return;
    }
    
    if (cmd === 'calc') {
        output.innerHTML += `<div class="terminal-line"><span class="success">Открываю калькулятор...</span></div>`;
        setTimeout(() => {
            const calcWindow = document.querySelector('.desktop .window');
            if (calcWindow) {
                // Ищем окно калькулятора, если нет - открываем через showNotification
                showNotification('Терминал', 'Калькулятор открыт');
            }
        }, 300);
        return;
    }
    
    if (cmd === 'browser') {
        output.innerHTML += `<div class="terminal-line"><span class="success">Открываю браузер...</span></div>`;
        setTimeout(() => openApp('browser'), 300);
        return;
    }
    
    if (cmd === 'store') {
        output.innerHTML += `<div class="terminal-line"><span class="success">Открываю магазин...</span></div>`;
        setTimeout(() => openApp('store'), 300);
        return;
    }
    
    if (cmd === 'settings') {
        output.innerHTML += `<div class="terminal-line"><span class="success">Открываю настройки...</span></div>`;
        setTimeout(() => openApp('settings'), 300);
        return;
    }
    
    // Если команда не обработана - вызываем оригинальную
    originalTerminal(command, output);
};
// ================== BUILD 6032 - РАБОЧИЕ УЛУЧШЕНИЯ ==================

// ===== 1. НОВЫЕ ПРИЛОЖЕНИЯ В МЕНЮ ПУСК =====
function addNewAppsToStartMenu() {
    const startApps = document.querySelector('.start-menu-apps');
    if (!startApps) return;
    
    // Проверяем, не добавлены ли уже
    if (document.querySelector('.start-menu-item[data-app="calculator"]')) return;
    
    const newApps = [
        { name: 'Калькулятор', icon: 'fa-calculator', action: 'calculator' },
        { name: 'Заметки', icon: 'fa-sticky-note', action: 'notes' },
        { name: 'Погода', icon: 'fa-cloud-sun', action: 'weather' },
        { name: 'Задачи', icon: 'fa-tasks', action: 'tasks' },
        { name: 'Переводчик', icon: 'fa-language', action: 'translate' }
    ];
    
    newApps.forEach(app => {
        const item = document.createElement('div');
        item.className = 'start-menu-item';
        item.setAttribute('data-app', app.action);
        item.innerHTML = `<i class="fas ${app.icon}"></i><span>${app.name}</span>`;
        item.onclick = function(e) {
            e.stopPropagation();
            showNotification(app.name, 'Демо-приложение открыто');
            document.getElementById('startMenu').classList.remove('active');
        };
        startApps.appendChild(item);
    });
}

// ===== 2. РАБОЧИЙ БРАУЗЕР С ВКЛАДКАМИ =====
let browserTabCount = 1;

function addBrowserTab() {
    browserTabCount++;
    const url = document.querySelector('.url-bar')?.value || 'https://google.com';
    showNotification('Браузер', `Новая вкладка: ${browserTabCount}`);
    document.querySelector('.url-bar').value = 'https://google.com';
    // Обновляем контент
    const content = document.querySelector('.browser-content');
    if (content) {
        content.innerHTML = `
            <div style="padding:30px;text-align:center;">
                <i class="fas fa-globe" style="font-size:48px;color:var(--accent-color);margin-bottom:15px;"></i>
                <h3>Вкладка ${browserTabCount}</h3>
                <p style="color:var(--text-secondary);">Введите URL в адресной строке</p>
                <div style="margin-top:15px;display:flex;gap:10px;justify-content:center;">
                    <button onclick="document.querySelector('.url-bar').value='https://google.com';document.querySelector('.browser-content').innerHTML='<div style=padding:30px;text-align:center;><i class=fas fa-globe style=font-size:48px;color:var(--accent-color);margin-bottom:15px;></i><h3>Google</h3><p style=color:var(--text-secondary);>Поисковая система</p></div>'" class="toolbar-btn">Google</button>
                    <button onclick="document.querySelector('.url-bar').value='https://youtube.com';document.querySelector('.browser-content').innerHTML='<div style=padding:30px;text-align:center;><i class=fas fa-video style=font-size:48px;color:var(--accent-color);margin-bottom:15px;></i><h3>YouTube</h3><p style=color:var(--text-secondary);>Видеохостинг</p></div>'" class="toolbar-btn">YouTube</button>
                </div>
            </div>
        `;
    }
}

// Добавляем кнопку новой вкладки в браузер
function initBrowserTabs() {
    const browserBar = document.querySelector('.browser-bar');
    if (!browserBar) return;
    
    // Добавляем кнопку "+" если её нет
    if (!document.querySelector('.browser-tab-add')) {
        const addBtn = document.createElement('button');
        addBtn.className = 'browser-btn browser-tab-add';
        addBtn.innerHTML = '<i class="fas fa-plus"></i>';
        addBtn.title = 'Новая вкладка';
        addBtn.onclick = addBrowserTab;
        addBtn.style.cssText = 'background:var(--bg-tertiary);border:none;padding:6px 12px;border-radius:8px;cursor:pointer;font-size:14px;margin-left:5px;';
        browserBar.appendChild(addBtn);
    }
}

// ===== 3. НОВЫЕ КОМАНДЫ В ТЕРМИНАЛЕ =====
function addTerminalCommands() {
    const terminalInput = document.getElementById('terminalInput');
    if (!terminalInput) return;
    
    // Сохраняем оригинальный обработчик
    const originalHandler = terminalInput.onkeypress;
    
    terminalInput.onkeypress = function(e) {
        if (e.key === 'Enter') {
            const cmd = this.value.trim().toLowerCase();
            const output = document.getElementById('terminalOutput');
            
            if (cmd === 'help') {
                output.innerHTML += `
                    <div class="terminal-line">Доступные команды:</div>
                    <div class="terminal-line">  <span class="command">help</span> - помощь</div>
                    <div class="terminal-line">  <span class="command">clear</span> - очистить</div>
                    <div class="terminal-line">  <span class="command">date</span> - дата</div>
                    <div class="terminal-line">  <span class="command">time</span> - время</div>
                    <div class="terminal-line">  <span class="command">whoami</span> - пользователь</div>
                    <div class="terminal-line">  <span class="command">ls</span> - список файлов</div>
                    <div class="terminal-line">  <span class="command">version</span> - версия</div>
                    <div class="terminal-line">  <span class="command">calc</span> - калькулятор</div>
                    <div class="terminal-line">  <span class="command">browser</span> - браузер</div>
                    <div class="terminal-line">  <span class="command">store</span> - магазин</div>
                `;
                this.value = '';
                output.scrollTop = output.scrollHeight;
                return;
            }
            
            if (cmd === 'calc') {
                output.innerHTML += `<div class="terminal-line"><span class="success">Открываю калькулятор...</span></div>`;
                showNotification('Терминал', 'Калькулятор открыт');
                this.value = '';
                output.scrollTop = output.scrollHeight;
                return;
            }
            
            if (cmd === 'browser') {
                output.innerHTML += `<div class="terminal-line"><span class="success">Открываю браузер...</span></div>`;
                openApp('browser');
                this.value = '';
                output.scrollTop = output.scrollHeight;
                return;
            }
            
            if (cmd === 'store') {
                output.innerHTML += `<div class="terminal-line"><span class="success">Открываю магазин...</span></div>`;
                openApp('store');
                this.value = '';
                output.scrollTop = output.scrollHeight;
                return;
            }
            
            if (cmd === 'version') {
                output.innerHTML += `<div class="terminal-line"><span class="success">Soiav 2 RTM build 6032</span></div>`;
                this.value = '';
                output.scrollTop = output.scrollHeight;
                return;
            }
            
            // Если команда не обработана - передаём дальше
            if (originalHandler) {
                originalHandler.call(this, e);
            }
        }
    };
}

// ===== 4. УЛУЧШЕННЫЙ МАГАЗИН =====
function initStore() {
    const storeGrid = document.getElementById('appsGrid');
    if (!storeGrid) return;
    
    // Добавляем локальные приложения
    const localApps = [
        { name: 'Калькулятор', icon: 'fa-calculator', desc: 'Простой калькулятор', free: true },
        { name: 'Заметки', icon: 'fa-sticky-note', desc: 'Текстовые заметки', free: true },
        { name: 'Погода', icon: 'fa-cloud-sun', desc: 'Прогноз погоды', free: true },
        { name: 'Задачи', icon: 'fa-tasks', desc: 'Список задач', free: true },
        { name: 'Переводчик', icon: 'fa-language', desc: 'Перевод текста', free: true }
    ];
    
    storeGrid.innerHTML = '';
    localApps.forEach(app => {
        const card = document.createElement('div');
        card.className = 'app-card';
        card.innerHTML = `
            <div class="app-icon"><i class="fas ${app.icon}"></i></div>
            <div class="app-title">${app.name}</div>
            <div class="app-desc">${app.desc}</div>
            <div class="app-meta">
                <span>1.5 MB</span>
                <span>⭐ 4.5</span>
            </div>
            <button class="install-btn" onclick="showNotification('Магазин','${app.name} установлен!')">
                ${app.free ? 'Бесплатно' : '99 ₽'}
            </button>
        `;
        storeGrid.appendChild(card);
    });
}

// ===== 5. УЛУЧШЕННЫЕ НАСТРОЙКИ =====
function initSettings() {
    // Добавляем новые пункты в настройки
    const settingsSidebar = document.querySelector('.settings-sidebar');
    if (!settingsSidebar) return;
    
    // Проверяем, не добавлены ли уже
    if (document.querySelector('[data-category="updates"]')) return;
    
    const newCategories = [
        { category: 'updates', icon: 'fa-download', name: 'Обновления' },
        { category: 'privacy', icon: 'fa-shield-alt', name: 'Конфиденциальность' }
    ];
    
    newCategories.forEach(cat => {
        const item = document.createElement('div');
        item.className = 'settings-category';
        item.setAttribute('data-category', cat.category);
        item.innerHTML = `<i class="fas ${cat.icon}"></i><span>${cat.name}</span>`;
        item.onclick = function() {
            document.querySelectorAll('.settings-category').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            showNotification('Настройки', `Раздел: ${cat.name}`);
        };
        settingsSidebar.appendChild(item);
    });
}

// ===== 6. ЗАПУСК ВСЕХ УЛУЧШЕНИЙ =====
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        addNewAppsToStartMenu();
        initBrowserTabs();
        addTerminalCommands();
        initStore();
        initSettings();
        
        console.log('✅ Build 6032 загружен!');
    }, 1000);
});
