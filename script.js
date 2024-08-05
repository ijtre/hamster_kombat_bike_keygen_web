const APP_TOKEN = 'd28721be-fd2d-4b45-869e-9f253b554e50';
const PROMO_ID = '43e35910-c168-4634-ad4f-52fd764a843f';
const EVENTS_DELAY = 20000;

document.getElementById('startBtn').addEventListener('click', async () => {
    const startBtn = document.getElementById('startBtn');
    const keyCountSelect = document.getElementById('keyCountSelect');
    const keyCountLabel = document.getElementById('keyCountLabel');
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const keyContainer = document.getElementById('keyContainer');
    const keysList = document.getElementById('keysList');
    const copyAllBtn = document.getElementById('copyAllBtn');
    const generatedKeysTitle = document.getElementById('generatedKeysTitle');
    const keyCount = parseInt(keyCountSelect.value);

    progressBar.style.width = '0%';
    progressText.innerText = '0%';
    progressContainer.classList.remove('hidden');
    keyContainer.classList.add('hidden');
    generatedKeysTitle.classList.add('hidden');
    keysList.innerHTML = '';
    keyCountSelect.classList.add('hidden');
    keyCountLabel.innerText = `Генерируется ключей: ${keyCount}`
    startBtn.classList.add('hidden');
    copyAllBtn.classList.add('hidden');
    startBtn.disabled = true;

    let progress = 0;
    let progressStopped = false;

    const updateProgress = (increment) => {
        const steps = 10;
        const stepIncrement = increment / steps;
        let step = 0;

        const increaseProgress = () => {
            if (progressStopped) return;
            if (step < steps) {
                progress += stepIncrement;
                progressBar.style.width = `${progress}%`;
                progressText.innerText = `${Math.round(progress)}%`;
                step++;
                setTimeout(increaseProgress, 2000 / steps + Math.random() * 1000);
            }
        };

        increaseProgress();
    };

    const generateKeyProcess = async () => {
        const clientId = generateClientId();
        let clientToken;
        try {
            clientToken = await login(clientId);
        } catch (error) {
            alert(`Не удалось войти: ${error.message}`);
            startBtn.disabled = false;
            return null;
        }

        for (let i = 0; i < 7; i++) {
            await sleep(EVENTS_DELAY * delayRandom());
            const hasCode = await emulateProgress(clientToken);
            updateProgress(10 / keyCount);
            if (hasCode) {
                break;
            }
        }

        try {
            const key = await generateKey(clientToken);
            updateProgress(30 / keyCount);
            return key;
        } catch (error) {
            alert(`Не удалось сгенерировать ключ: ${error.message}`);
            return null;
        }
    };

    const keys = await Promise.all(Array.from({ length: keyCount }, generateKeyProcess));

    progressStopped = true;

    progressBar.style.width = '100%';
    progressText.innerText = '100%';

    if (keys.length > 1) {
        keysList.innerHTML = keys.filter(key => key).map((key, index) => `
            <div class="key-item">
                <div class="key-number">${index+1}</div>
                <input type="text" value="${key}" readonly>
                <button class="copyKeyBtn copy-button" data-key="${key}">Скопировать ключ</button>
            </div>
        `).join('');
        copyAllBtn.classList.remove('hidden');
    } else if (keys.length === 1) {
        keysList.innerHTML = `
            <div class="key-item">
                <div class="key-number">1</div>
                <input type="text" value="${keys[0]}" readonly>
                <button class="copyKeyBtn copy-button" data-key="${keys[0]}">Скопировать ключ</button>
            </div>
        `;
    }

    keyContainer.classList.remove('hidden');
    generatedKeysTitle.classList.remove('hidden');
    keyCountLabel.innerText = "Выберите количество ключей для генерации:"
    document.querySelectorAll('.copyKeyBtn').forEach(button => {
        button.addEventListener('click', (event) => {
            const key = event.target.getAttribute('data-key');
            navigator.clipboard.writeText(key).then(() => {
                event.target.innerText = 'Ключ скопирован';
                event.target.style.backgroundColor = '#28a745';
                setTimeout(() => {
                    event.target.innerText = 'Скопировать ключ';
                    event.target.style.backgroundColor = '#6a0080';
                }, 2000);
            });
        });
    });
    copyAllBtn.addEventListener('click', (event) => {
        const keysText = keys.filter(key => key).join('\n');
        navigator.clipboard.writeText(keysText).then(() => {
            event.target.innerText = 'Все ключи скопированы';
            event.target.style.backgroundColor = '#28a745';
            setTimeout(() => {
                event.target.innerText = 'Скопировать все ключи';
                event.target.style.backgroundColor = '#6a0080';
            }, 2000);
        });
    });

    startBtn.classList.remove('hidden');
    keyCountSelect.classList.remove('hidden');
    startBtn.disabled = false;
});


document.getElementById('creatorChannelBtn').addEventListener('click', () => {
    window.location.href = 'https://t.me/pdosi_project';
});

function generateClientId() {
    const timestamp = Date.now();
    const randomNumbers = Array.from({ length: 19 }, () => Math.floor(Math.random() * 10)).join('');
    return `${timestamp}-${randomNumbers}`;
}

async function login(clientId) {
    const response = await fetch('https://api.gamepromo.io/promo/login-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appToken: APP_TOKEN, clientId, clientOrigin: 'deviceid' })
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Не удалось войти');
    }
    return data.clientToken;
}

async function emulateProgress(clientToken) {
    const response = await fetch('https://api.gamepromo.io/promo/register-event', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${clientToken}`
        },
        body: JSON.stringify({
            promoId: PROMO_ID,
            eventId: crypto.randomUUID(),
            eventOrigin: 'undefined'
        })
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Не удалось зарегистрировать событие');
    }
    return data.hasCode;
}

async function generateKey(clientToken) {
    const response = await fetch('https://api.gamepromo.io/promo/create-code', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${clientToken}`
        },
        body: JSON.stringify({ promoId: PROMO_ID })
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Не удалось сгенерировать ключ');
    }
    return data.promoCode;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function delayRandom() {
    return Math.random() / 3 + 1;
}