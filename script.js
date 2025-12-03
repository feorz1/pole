// ---------------------
// Константы и состояние
// ---------------------

const RUSSIAN_LETTERS = [
    "А","Б","В","Г","Д","Е","Ё","Ж","З","И","Й",
    "К","Л","М","Н","О","П","Р","С","Т","У","Ф",
    "Х","Ц","Ч","Ш","Щ","Ъ","Ы","Ь","Э","Ю","Я"
];

// аватары как в "Своя игра" — просто цикл по эмодзи
const AVATARS = ["🧑", "👩", "🧔", "👨‍🦰", "👩‍🦱", "👨‍🦳", "🧑‍🎓", "🧑‍💻"];

// Призы по умолчанию
let PRIZES = [
    { points: 1000,  name: "Набор ручек" },
    { points: 2000,  name: "Настольная лампа" },
    { points: 3000,  name: "Беспроводная мышь" },
    { points: 5000,  name: "Наушники" },
    { points: 7500,  name: "Умная колонка" },
    { points: 10000, name: "Игровая клавиатура" },
    { points: 15000, name: "Фитнес-браслет" },
    { points: 20000, name: "Планшет" },
    { points: 25000, name: "Смартфон" },
    { points: 30000, name: "Ноутбук" },
    { points: 40000, name: "Телевизор" },
    { points: 50000, name: "Путешествие" }
];

// состояние игроков
let players = [];
let nextPlayerId = 1;
let activePlayerId = null;

// состояние слова
let currentWord = "КОМПЬЮТЕР";
let currentHint = "Электронная машина для обработки информации";
let openedPositions = [];      // boolean по индексам букв
let usedLetters = new Set();   // набор использованных букв
let newlyOpenedLetters = new Set(); // индексы только что открытых букв для анимации

// барабан
const wheelCanvas = document.getElementById("wheelCanvas");
const wheelCtx = wheelCanvas.getContext("2d");
const WHEEL_SIZE = wheelCanvas.width;
const WHEEL_RADIUS = WHEEL_SIZE / 2;
const SECTOR_COUNT = 24;
const sectorAngle = 2 * Math.PI / SECTOR_COUNT;

// список секторов (значение и тип)
const wheelSectorsBase = [
    { type: "points", value: 100 },
    { type: "points", value: 150 },
    { type: "points", value: 200 },
    { type: "points", value: 250 },
    { type: "points", value: 300 },
    { type: "points", value: 350 },
    { type: "points", value: 400 },
    { type: "points", value: 450 },
    { type: "points", value: 500 },
    { type: "points", value: 550 },
    { type: "points", value: 600 },
    { type: "points", value: 650 },
    { type: "points", value: 700 },
    { type: "points", value: 750 },
    { type: "points", value: 800 },
    { type: "points", value: 850 },
    { type: "points", value: 900 },
    { type: "points", value: 950 },
    { type: "points", value: 1000 },
    { type: "x2",     value: 0 },
    { type: "plus",   value: 0 },   // открыть любую букву
    { type: "bankrupt", value: 0 }, // банкрот
    { type: "zero",   value: 0 },   // 0
    { type: "empty",  value: 0 }    // пустой
];

// Функция перемешивания массива (Fisher-Yates shuffle)
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Перемешанные секторы барабана
const wheelSectors = shuffleArray(wheelSectorsBase);

let wheelRotation = 0;      // текущий угол поворота
let isSpinning = false;
let lastSector = null;      // последний сектор после остановки
let lastPointsValue = null; // число очков, выпавшее на секторе "points"

// режим открытия любой буквы
let isOpenAnyMode = false;

// DOM-элементы
const playersContainer = document.getElementById("playersContainer");
const addPlayerBtn = document.getElementById("addPlayerBtn");

const hintTextEl = document.getElementById("hintText");
const wordContainerEl = document.getElementById("wordContainer");
const scoreValueEl = document.getElementById("scoreValue");
const keyboardEl = document.getElementById("keyboard");
const spinButton = document.getElementById("spinButton");
const lastResultEl = document.getElementById("lastResult");
const prizesButton = document.getElementById("prizesButton");

const wordInput = document.getElementById("wordInput");
const hintInput = document.getElementById("hintInput");
const applyWordBtn = document.getElementById("applyWordBtn");
const prizesEditor = document.getElementById("prizesEditor");

const saveConfigBtn = document.getElementById("saveConfigBtn");
const loadConfigInput = document.getElementById("loadConfigInput");
const loadFileBtn = document.getElementById("loadFileBtn");
const fileStatus = document.getElementById("fileStatus");

const settingsModal = document.getElementById("settingsModal");
const settingsButton = document.getElementById("settingsButton");
const closeSettingsBtn = document.getElementById("closeSettingsBtn");
const addPrizeBtn = document.getElementById("addPrizeBtn");

const prizesModal = document.getElementById("prizesModal");
const prizesTableBody = document.getElementById("prizesTableBody");
const closePrizesModalBtn = document.getElementById("closePrizesModal");

const winModal = document.getElementById("winModal");
const winWordText = document.getElementById("winWordText");
const winScoreText = document.getElementById("winScoreText");
const winPrizesTableBody = document.getElementById("winPrizesTableBody");
const newGameBtn = document.getElementById("newGameBtn");

// ---------------------
// Утилиты
// ---------------------

function getActivePlayer() {
    return players.find(p => p.id === activePlayerId) || null;
}

function setActivePlayer(id) {
    activePlayerId = id;
    renderPlayers();
    updateScorePanel();
}

function cycleToNextPlayer() {
    if (players.length === 0) return;
    if (!activePlayerId) {
        setActivePlayer(players[0].id);
        return;
    }
    const idx = players.findIndex(p => p.id === activePlayerId);
    const nextIdx = (idx + 1) % players.length;
    setActivePlayer(players[nextIdx].id);
    // Сбрасываем состояние барабана при смене игрока
    lastSector = null;
    lastPointsValue = null;
    isOpenAnyMode = false;
    updateSpinButtonState(); // Включаем кнопку при смене игрока
}

function formatPoints(p) {
    return p.toString();
}

// ---------------------
// Игроки
// ---------------------

function addPlayer() {
    const id = nextPlayerId++;
    const player = {
        id,
        name: `Игрок ${id}`,
        score: 0,
        avatarIndex: (id - 1) % AVATARS.length
    };
    players.push(player);
    if (!activePlayerId) {
        activePlayerId = id;
    }
    renderPlayers();
    updateScorePanel();
}

function removePlayer(id) {
    players = players.filter(p => p.id !== id);
    if (players.length === 0) {
        activePlayerId = null;
        scoreValueEl.textContent = "0";
    } else if (activePlayerId === id) {
        activePlayerId = players[0].id;
    }
    renderPlayers();
    updateScorePanel();
}

function changePlayerAvatar(id) {
    const p = players.find(pl => pl.id === id);
    if (!p) return;
    p.avatarIndex = (p.avatarIndex + 1) % AVATARS.length;
    renderPlayers();
}

function changePlayerName(id, newName) {
    const p = players.find(pl => pl.id === id);
    if (!p) return;
    p.name = newName || `Игрок ${id}`;
    renderPlayers();
}

function updatePlayerScore(id, delta) {
    const p = players.find(pl => pl.id === id);
    if (!p) return;
    p.score += delta;
    if (p.score < 0) p.score = 0;
    renderPlayers();
    updateScorePanel();
}

function setPlayerScore(id, value) {
    const p = players.find(pl => pl.id === id);
    if (!p) return;
    p.score = Math.max(0, value);
    renderPlayers();
    updateScorePanel();
}

function renderPlayers() {
    playersContainer.innerHTML = "";
    players.forEach(player => {
        const card = document.createElement("div");
        card.className = "player-card" + (player.id === activePlayerId ? " active" : "");
        card.addEventListener("click", () => {
            setActivePlayer(player.id);
        });

        const removeBtn = document.createElement("button");
        removeBtn.className = "player-remove";
        removeBtn.textContent = "✕";
        removeBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            removePlayer(player.id);
        });
        card.appendChild(removeBtn);

        const avatar = document.createElement("div");
        avatar.className = "player-avatar";
        avatar.textContent = AVATARS[player.avatarIndex];
        avatar.addEventListener("click", (e) => {
            e.stopPropagation();
            changePlayerAvatar(player.id);
        });
        card.appendChild(avatar);

        const nameInput = document.createElement("input");
        nameInput.className = "player-name";
        nameInput.value = player.name;
        nameInput.addEventListener("click", e => e.stopPropagation());
        nameInput.addEventListener("change", e => {
            changePlayerName(player.id, e.target.value.trim());
        });
        card.appendChild(nameInput);

        const score = document.createElement("div");
        score.className = "player-score";
        score.textContent = player.score;
        card.appendChild(score);

        playersContainer.appendChild(card);
    });
}

// ---------------------
// Слово и клавиатура
// ---------------------

function initWordState() {
    const upper = (currentWord || "").toUpperCase();
    currentWord = upper;
    openedPositions = [];
    for (let i = 0; i < currentWord.length; i++) {
        openedPositions.push(false);
    }
    usedLetters.clear();
    newlyOpenedLetters.clear();
}

function renderWord() {
    if (!wordContainerEl || !currentWord) return;
    
    wordContainerEl.innerHTML = "";
    for (let i = 0; i < currentWord.length; i++) {
        const ch = currentWord[i];
        const cell = document.createElement("div");
        if (ch === " ") {
            cell.className = "letter-cell empty-space";
        } else {
            cell.className = "letter-cell";
            if (openedPositions[i]) {
                cell.textContent = ch;
                // Добавляем анимацию, если буква только что открыта
                if (newlyOpenedLetters.has(i)) {
                    cell.classList.add("letter-animate");
                    // Удаляем из Set после небольшой задержки, чтобы анимация успела запуститься
                    setTimeout(() => {
                        newlyOpenedLetters.delete(i);
                    }, 600); // Увеличиваем задержку до длительности анимации
                }
            } else {
                // Показываем закрытую букву как пустую ячейку с рамкой
                // Всегда создаем ячейку, даже если буква не открыта
                if (isOpenAnyMode) {
                    cell.classList.add("openable");
                    cell.addEventListener("click", () => handleOpenAnyClick(i));
                }
            }
        }
        wordContainerEl.appendChild(cell);
    }
}

function renderHint() {
    hintTextEl.textContent = currentHint || "";
}

function buildKeyboard() {
    keyboardEl.innerHTML = "";
    RUSSIAN_LETTERS.forEach(letter => {
        const key = document.createElement("div");
        key.className = "key";
        key.textContent = letter;
        key.dataset.letter = letter;
        key.addEventListener("click", () => handleLetterClick(letter));
        keyboardEl.appendChild(key);
    });
}

function setKeyboardEnabled(enabled) {
    const keys = keyboardEl.querySelectorAll(".key");
    keys.forEach(k => {
        if (enabled && !usedLetters.has(k.dataset.letter)) {
            k.classList.remove("disabled");
        } else if (!enabled) {
            k.classList.add("disabled");
        }
    });
}

function refreshKeyboardDisabled() {
    const keys = keyboardEl.querySelectorAll(".key");
    keys.forEach(k => {
        const letter = k.dataset.letter;
        if (usedLetters.has(letter)) {
            k.classList.add("disabled");
        } else {
            k.classList.remove("disabled");
        }
    });
}

function handleLetterClick(letter) {
    if (isSpinning || isOpenAnyMode) return;
    if (usedLetters.has(letter)) return;

    if (!lastSector || lastSector.type !== "points") return;

    usedLetters.add(letter);
    refreshKeyboardDisabled();
    const upper = currentWord;
    let found = 0;
    for (let i = 0; i < upper.length; i++) {
        if (upper[i] === letter) {
            if (!openedPositions[i]) {
                openedPositions[i] = true;
                newlyOpenedLetters.add(i); // Отмечаем для анимации
            }
            found++;
        }
    }
    renderWord();

    const active = getActivePlayer();
    if (!active) return;

    if (found > 0) {
        const gained = lastPointsValue * found;
        updatePlayerScore(active.id, gained);
        lastResultEl.textContent = `Буква "${letter}", совпадений: ${found}, +${gained} очков`;
        if (checkWin()) {
            lastResultEl.textContent += " — СЛОВО ОТГАДАНО!";
        }
    } else {
        lastResultEl.textContent = `Буквы "${letter}" нет в слове.`;
        cycleToNextPlayer();
    }

    lastSector = null;
    lastPointsValue = null;
    setKeyboardEnabled(false);
    updateSpinButtonState(); // Включаем кнопку после выбора буквы
}

function handleOpenAnyClick(index) {
    if (!isOpenAnyMode) return;
    if (index < 0 || index >= currentWord.length) return;
    if (currentWord[index] === " ") return;
    if (!openedPositions[index]) {
        openedPositions[index] = true;
        newlyOpenedLetters.add(index); // Отмечаем для анимации
    }
    isOpenAnyMode = false;
    renderWord();
    lastResultEl.textContent = "Буква открыта бесплатно.";
    setKeyboardEnabled(false);
    updateSpinButtonState(); // Включаем кнопку после открытия буквы
    if (checkWin()) {
        lastResultEl.textContent += " — СЛОВО ОТГАДАНО!";
    }
}

function checkWin() {
    for (let i = 0; i < currentWord.length; i++) {
        if (currentWord[i] !== " " && !openedPositions[i]) {
            return false;
        }
    }
    
    // Если слово угадано, показываем модальное окно
    showWinModal();
    return true;
}

function showWinModal() {
    const active = getActivePlayer();
    const score = active ? active.score : 0;
    
    // Заполняем информацию о победе
    winWordText.textContent = currentWord.toUpperCase();
    winScoreText.textContent = score;
    
    // Заполняем доступные призы
    winPrizesTableBody.innerHTML = "";
    const availablePrizes = PRIZES.filter(p => p.points > 0 && score >= p.points)
        .sort((a, b) => a.points - b.points);
    
    if (availablePrizes.length === 0) {
        const row = document.createElement("tr");
        row.innerHTML = `<td colspan="2" style="text-align: center; color: #999;">Нет доступных призов</td>`;
        winPrizesTableBody.appendChild(row);
    } else {
        availablePrizes.forEach(prize => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${prize.points}</td>
                <td>${prize.name || "—"}</td>
            `;
            winPrizesTableBody.appendChild(row);
        });
    }
    
    // Показываем модальное окно
    winModal.classList.remove("hidden");
    setKeyboardEnabled(false);
}

function startNewGame() {
    // Закрываем модальное окно
    winModal.classList.add("hidden");
    
    // Сбрасываем игру
    usedLetters.clear();
    newlyOpenedLetters.clear();
    openedPositions = new Array(currentWord.length).fill(false);
    lastSector = null;
    lastPointsValue = null;
    isOpenAnyMode = false;
    isSpinning = false;
    
    // Обнуляем очки всех игроков
    players.forEach(p => {
        p.score = 0;
    });
    
    // Обновляем интерфейс
    renderWord();
    renderPlayers();
    updateScorePanel();
    refreshKeyboardDisabled();
    lastResultEl.textContent = "Новая игра начата!";
    
    // Перерисовываем барабан
    drawWheel();
}

// ---------------------
// Барабан
// ---------------------

function drawWheel() {
    wheelCtx.clearRect(0, 0, WHEEL_SIZE, WHEEL_SIZE);
    wheelCtx.save();
    wheelCtx.translate(WHEEL_RADIUS, WHEEL_RADIUS);
    wheelCtx.rotate(wheelRotation);

    for (let i = 0; i < SECTOR_COUNT; i++) {
        const startAngle = i * sectorAngle;
        const endAngle = startAngle + sectorAngle;
        const sector = wheelSectors[i];

        const even = i % 2 === 0;
        let color;
        let textColor;
        
        if (sector.type === "points") {
            // Чередование белого и синего для очков
            color = even ? "#ffffff" : "#2196F3";
            textColor = even ? "#000000" : "#ffffff";
        } else if (sector.type === "x2") {
            color = "#4CAF50"; // зеленый
            textColor = "#ffffff";
        } else if (sector.type === "plus") {
            color = "#FFC107"; // желтый
            textColor = "#000000";
        } else if (sector.type === "bankrupt") {
            color = "#F44336"; // красный
            textColor = "#ffffff";
        } else if (sector.type === "zero") {
            color = "#9E9E9E"; // серый
            textColor = "#ffffff";
        } else {
            color = "#E0E0E0"; // светло-серый для пустого
            textColor = "#666666";
        }

        wheelCtx.beginPath();
        wheelCtx.moveTo(0, 0);
        wheelCtx.arc(0, 0, WHEEL_RADIUS - 4, startAngle, endAngle);
        wheelCtx.closePath();
        wheelCtx.fillStyle = color;
        wheelCtx.fill();
        wheelCtx.strokeStyle = "#CCCCCC";
        wheelCtx.lineWidth = 2;
        wheelCtx.stroke();

        // текст
        wheelCtx.save();
        const midAngle = startAngle + sectorAngle / 2;
        wheelCtx.rotate(midAngle);
        wheelCtx.translate(WHEEL_RADIUS * 0.65, 0);
        wheelCtx.rotate(Math.PI / 2);
        wheelCtx.fillStyle = textColor;
        wheelCtx.font = "bold 16px system-ui";
        wheelCtx.textAlign = "center";
        wheelCtx.textBaseline = "middle";

        let text = "";
        if (sector.type === "points") {
            text = String(sector.value);
        } else if (sector.type === "x2") {
            text = "x2";
        } else if (sector.type === "plus") {
            text = "+";
        } else if (sector.type === "bankrupt") {
            text = "Б";
        } else if (sector.type === "zero") {
            text = "0";
        } else {
            text = "";
        }
        wheelCtx.fillText(text, 0, 0);
        wheelCtx.restore();
    }

    wheelCtx.restore();
}

function updateSpinButtonState() {
    // Отключаем кнопку, если:
    // 1. Барабан крутится
    // 2. Выпали очки и нужно выбрать букву
    // 3. В режиме открытия любой буквы
    const shouldDisable = isSpinning || 
                         (lastSector && lastSector.type === "points" && lastPointsValue !== null) ||
                         isOpenAnyMode;
    
    if (spinButton) {
        spinButton.disabled = shouldDisable;
        if (shouldDisable) {
            spinButton.classList.add("disabled");
        } else {
            spinButton.classList.remove("disabled");
        }
    }
}

function spinWheel() {
    if (isSpinning) return;
    if (!getActivePlayer()) return;

    isSpinning = true;
    isOpenAnyMode = false;
    renderWord();
    lastSector = null;
    lastPointsValue = null;
    lastResultEl.textContent = "";
    setKeyboardEnabled(false);
    updateSpinButtonState();

    const extraRotations = 4 + Math.random() * 3;
    const startRotation = wheelRotation;
    const finalRotationTarget = wheelRotation + extraRotations * 2 * Math.PI;

    const duration = 2500;
    const startTime = performance.now();

    function animate(time) {
        const elapsed = time - startTime;
        const t = Math.min(1, elapsed / duration);
        const easeOut = 1 - Math.pow(1 - t, 3);
        wheelRotation = startRotation + (finalRotationTarget - startRotation) * easeOut;
        drawWheel();

        if (t < 1) {
            requestAnimationFrame(animate);
        } else {
            wheelRotation = wheelRotation % (2 * Math.PI);
            drawWheel();
            isSpinning = false;
            determineWheelResult();
            updateSpinButtonState();
        }
    }

    requestAnimationFrame(animate);
}

function determineWheelResult() {
    // указатель сверху: угол -PI/2
    const pointerAngle = -Math.PI / 2;
    let relativeAngle = pointerAngle - wheelRotation;
    relativeAngle = ((relativeAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

    let index = Math.floor(relativeAngle / sectorAngle);
    index = index % SECTOR_COUNT;
    const sector = wheelSectors[index];
    lastSector = sector;

    if (sector.type === "points") {
        lastPointsValue = sector.value;
        lastResultEl.textContent = `Выпало: ${sector.value} очков. Выберите букву.`;
        setKeyboardEnabled(true);
        updateSpinButtonState(); // Отключаем кнопку, нужно выбрать букву
    } else if (sector.type === "x2") {
        const active = getActivePlayer();
        if (active) {
            setPlayerScore(active.id, active.score * 2);
            lastResultEl.textContent = "Выпало: x2 — очки активного игрока удвоены.";
        }
        setKeyboardEnabled(false);
        updateSpinButtonState(); // Включаем кнопку
    } else if (sector.type === "plus") {
        isOpenAnyMode = true;
        renderWord();
        lastResultEl.textContent = "Выпало: + — кликните по любой закрытой букве, чтобы открыть её.";
        setKeyboardEnabled(false);
        updateSpinButtonState(); // Отключаем кнопку, нужно выбрать букву
    } else if (sector.type === "bankrupt") {
        const active = getActivePlayer();
        if (active) {
            setPlayerScore(active.id, 0);
            lastResultEl.textContent = "Выпало: Банкрот — очки обнулены.";
            cycleToNextPlayer();
        }
        setKeyboardEnabled(false);
        updateSpinButtonState(); // Включаем кнопку
    } else if (sector.type === "zero") {
        lastResultEl.textContent = "Выпало: 0 — пропуск хода.";
        cycleToNextPlayer();
        setKeyboardEnabled(false);
        updateSpinButtonState(); // Включаем кнопку
    } else {
        lastResultEl.textContent = "Выпал пустой сектор — ничего не происходит.";
        setKeyboardEnabled(false);
        updateSpinButtonState(); // Включаем кнопку
    }
}

// ---------------------
// Очки и интерфейс
// ---------------------

function updateScorePanel() {
    const active = getActivePlayer();
    scoreValueEl.textContent = active ? formatPoints(active.score) : "0";
}

// ---------------------
// Призы
// ---------------------

function renderPrizesEditor() {
    prizesEditor.innerHTML = "";
    PRIZES.forEach((p, index) => {
        const row = document.createElement("div");
        row.className = "prize-row";

        const pointsInput = document.createElement("input");
        pointsInput.className = "prize-input";
        pointsInput.type = "number";
        pointsInput.value = p.points;
        pointsInput.addEventListener("change", e => {
            const val = parseInt(e.target.value, 10);
            PRIZES[index].points = isNaN(val) ? 0 : Math.max(0, val);
            renderPrizesTable();
        });

        const nameInput = document.createElement("input");
        nameInput.className = "prize-input";
        nameInput.type = "text";
        nameInput.value = p.name;
        nameInput.addEventListener("change", e => {
            PRIZES[index].name = e.target.value;
            renderPrizesTable();
        });

        const removeBtn = document.createElement("button");
        removeBtn.className = "prize-remove";
        removeBtn.textContent = "✕";
        removeBtn.addEventListener("click", () => {
            PRIZES.splice(index, 1);
            renderPrizesEditor();
            renderPrizesTable();
        });

        row.appendChild(pointsInput);
        row.appendChild(nameInput);
        row.appendChild(removeBtn);
        prizesEditor.appendChild(row);
    });
}

function addPrize() {
    PRIZES.push({ points: 0, name: "" });
    renderPrizesEditor();
    renderPrizesTable();
}

function renderPrizesTable() {
    prizesTableBody.innerHTML = "";
    PRIZES.forEach(p => {
        const tr = document.createElement("tr");
        const tdPoints = document.createElement("td");
        const tdName = document.createElement("td");
        tdPoints.textContent = p.points;
        tdName.textContent = p.name;
        tr.appendChild(tdPoints);
        tr.appendChild(tdName);
        prizesTableBody.appendChild(tr);
    });
}

// ---------------------
// Сохранение / загрузка
// ---------------------

function saveConfigToFile() {
    const data = {
        players,
        activePlayerId,
        word: currentWord,
        hint: currentHint,
        prizes: PRIZES
    };
    const text = JSON.stringify(data, null, 2);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pole_chudes_config.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function loadConfigFromFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        try {
            const text = e.target.result;
            const data = JSON.parse(text);

            if (Array.isArray(data.players)) {
                players = data.players.map(p => ({
                    id: p.id,
                    name: p.name,
                    score: p.score,
                    avatarIndex: p.avatarIndex % AVATARS.length
                }));
                nextPlayerId = players.reduce((max, p) => Math.max(max, p.id), 0) + 1;
            }
            activePlayerId = data.activePlayerId || (players[0] && players[0].id) || null;

            if (typeof data.word === "string") {
                currentWord = data.word.toUpperCase();
            }
            if (typeof data.hint === "string") {
                currentHint = data.hint;
            }
            if (Array.isArray(data.prizes)) {
                PRIZES = data.prizes.map(pr => ({
                    points: Number(pr.points) || 0,
                    name: String(pr.name || "")
                }));
            }

            initWordState();
            renderWord();
            renderHint();
            renderPlayers();
            updateScorePanel();
            renderPrizesEditor();
            renderPrizesTable();
            refreshKeyboardDisabled();
            lastResultEl.textContent = "Конфигурация загружена.";
            fileStatus.textContent = `Загружен: ${file.name}`;
        } catch (err) {
            alert("Не удалось загрузить конфигурацию: " + err.message);
            fileStatus.textContent = "Ошибка загрузки";
        }
    };
    reader.readAsText(file, "utf-8");
}

// ---------------------
// Инициализация
// ---------------------

function initSettingsFields() {
    wordInput.value = currentWord;
    hintInput.value = currentHint;
}

function initEvents() {
    addPlayerBtn.addEventListener("click", () => {
        addPlayer();
    });

    spinButton.addEventListener("click", () => {
        spinWheel();
    });

    applyWordBtn.addEventListener("click", () => {
        const w = (wordInput.value || "").toUpperCase();
        const cleaned = w.replace(/[^А-ЯЁ ]/g, "");
        currentWord = cleaned || "КОМПЬЮТЕР";
        currentHint = hintInput.value || currentHint;
        initWordState();
        renderWord();
        renderHint();
        usedLetters.clear();
        refreshKeyboardDisabled();
        lastResultEl.textContent = "Новое слово установлено.";
    });

    prizesButton.addEventListener("click", () => {
        renderPrizesTable();
        prizesModal.classList.remove("hidden");
    });

    closePrizesModalBtn.addEventListener("click", () => {
        prizesModal.classList.add("hidden");
    });

    prizesModal.querySelector(".modal-backdrop").addEventListener("click", () => {
        prizesModal.classList.add("hidden");
    });

    saveConfigBtn.addEventListener("click", () => {
        saveConfigToFile();
    });

    settingsButton.addEventListener("click", () => {
        initSettingsFields();
        settingsModal.classList.remove("hidden");
    });

    closeSettingsBtn.addEventListener("click", () => {
        settingsModal.classList.add("hidden");
    });

    settingsModal.querySelector(".modal-backdrop").addEventListener("click", () => {
        settingsModal.classList.add("hidden");
    });

    addPrizeBtn.addEventListener("click", () => {
        addPrize();
    });

    loadConfigInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
            fileStatus.textContent = `Выбран: ${file.name}`;
        } else {
            fileStatus.textContent = "Файл не выбран";
        }
    });

    loadFileBtn.addEventListener("click", () => {
        const file = loadConfigInput.files[0];
        if (file) {
            loadConfigFromFile(file);
        } else {
            alert("Сначала выберите файл");
        }
    });

    newGameBtn.addEventListener("click", () => {
        startNewGame();
    });
}

function initGame() {
    initWordState();
    renderWord();
    renderHint();
    buildKeyboard();
    refreshKeyboardDisabled();
    initSettingsFields();
    renderPrizesEditor();
    drawWheel();
    updateSpinButtonState(); // Инициализируем состояние кнопки

    // создадим хотя бы одного игрока
    addPlayer();
}

// Старт
document.addEventListener("DOMContentLoaded", () => {
    initEvents();
    initGame();
});
