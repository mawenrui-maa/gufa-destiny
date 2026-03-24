// 主应用程序 - 古法命盘系统手机版

// 授权验证相关 - 离线一人一号绑定设备
// 注册码格式：NAME-XXXX-YYYY-XXXX
// 最后一段是简单校验：hash(name + deviceId)，一人一号，离线验证

// 简单哈希函数
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16).substring(0, 8).toUpperCase();
}

// 获取设备ID（基于设备信息生成唯一标识）
function getDeviceId() {
    const screenInfo = `${screen.width}x${screen.height}`;
    const ua = navigator.userAgent.substring(0, 80);
    const deviceString = screenInfo + ua;
    return 'd_' + simpleHash(deviceString);
}

// 检查本地存储中是否已经授权
function checkAuthorization() {
    const licenseKey = localStorage.getItem('gufa_license_key');
    const deviceId = getDeviceId();
    const authorized = localStorage.getItem('gufa_authorized');
    
    if (authorized === 'true' && licenseKey) {
        // 验证本地保存的注册码是否匹配当前设备
        return verifyLicenseOffline(licenseKey, deviceId);
    }
    return false;
}

// 离线验证注册码
// 注册码格式：用户名-校验hash  ->  ZHANGSAN-ABCDEF12
function verifyLicenseOffline(key, deviceId) {
    key = key.trim().toUpperCase();
    const parts = key.split('-');
    
    // 至少两段
    if (parts.length < 2) {
        return false;
    }
    
    // 最后一段是校验码
    const checkHash = parts.pop();
    // 原字符串 = 用户名 + 设备id
    const originalString = parts.join('-') + deviceId;
    const calculatedHash = simpleHash(originalString);
    
    // 校验匹配成功
    return calculatedHash === checkHash.substring(0, calculatedHash.length);
}

// 生成注册码（你在生成的时候用这个算法）
// 用法：generateLicense("用户名") -> 输出 "用户名-XXXX-HASH"
function generateLicense(username, deviceId) {
    username = username.trim().toUpperCase().replace(/\s+/g, '-');
    const hash = simpleHash(username + deviceId);
    return `${username}-${hash.substring(0, 8)}`;
}

// 验证注册码
function verifyLicense(key) {
    key = key.trim().toUpperCase();
    const deviceId = getDeviceId();
    
    // 离线验证
    if (verifyLicenseOffline(key, deviceId)) {
        return {
            success: true,
            key: key,
            deviceId: deviceId,
            message: '激活成功'
        };
    }
    
    // 验证失败
    // 检查是否本地已经授权过（兼容老用户）
    if (localStorage.getItem('gufa_authorized') === 'true') {
        return {success: true, key: key, deviceId: deviceId};
    }
    
    return {
        success: false,
        message: '注册码无效或者已经绑定其他设备'
    };
}

// 保存授权状态
function saveAuthorization(key, deviceId) {
    localStorage.setItem('gufa_license_key', key);
    localStorage.setItem('gufa_device_id', deviceId);
    localStorage.setItem('gufa_authorized', 'true');
}

// 核心逻辑
let destinySystem;
let currentData = {};
let collections;
let currentLiunianData = {};

// DOM元素 - 延迟到DOM加载后获取
let authPage, appPage, licenseKeyInput, activateBtn, authError;
let nameInput, yearInput, monthInput, dayInput, hourInput, genderInput;
let calculateBtn, resetBtn, stemDisplay, pillarGrid, shenshaGrid;
let dayunContainer, liunianGrid, clockCanvas, collectBtn, showCollectionsBtn;
let clearCollectionsBtn, collectionInfo, statusBar, collectionModal, collectionList, closeModal;

// 神煞配置
const shenshaConfig = [
    ["八煞", "ba_sha"], ["白虎", "white_tiger"], 
    ["三煞", "san_sha"], ["天乙贵人", "tianyi_guiren"],
    ["禄神", "lu_shen"], ["将星", "jiang_xing"],
    ["华盖", "hua_gai"], ["红鸾", "hong_luan"],
    ["天喜", "tian_xi"], ["桃花", "tao_hua"],
    ["孤辰", "gu_chen"], ["寡宿", "gua_su"],
    ["六冲", "liu_chong"], ["六合", "liu_he"],
    ["六害", "liu_hai"], ["三刑", "san_xing"],
    ["三合局", "san_he_ju"]
];

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing...');
    
    // 初始化核心逻辑
    destinySystem = new AncientDestinySystem();
    collections = loadCollections();
    currentLiunianData = {};
    
    // 获取DOM元素
    authPage = document.getElementById('authPage');
    appPage = document.getElementById('appPage');
    licenseKeyInput = document.getElementById('licenseKey');
    activateBtn = document.getElementById('activateBtn');
    authError = document.getElementById('authError');
    
    nameInput = document.getElementById('nameInput');
    yearInput = document.getElementById('yearInput');
    monthInput = document.getElementById('monthInput');
    dayInput = document.getElementById('dayInput');
    hourInput = document.getElementById('hourInput');
    genderInput = document.getElementById('genderInput');
    calculateBtn = document.getElementById('calculateBtn');
    resetBtn = document.getElementById('resetBtn');
    stemDisplay = document.getElementById('stemDisplay');
    pillarGrid = document.getElementById('pillarGrid');
    shenshaGrid = document.getElementById('shenshaGrid');
    dayunContainer = document.getElementById('dayunContainer');
    liunianGrid = document.getElementById('liunianGrid');
    clockCanvas = document.getElementById('clockCanvas');
    collectBtn = document.getElementById('collectBtn');
    showCollectionsBtn = document.getElementById('showCollectionsBtn');
    clearCollectionsBtn = document.getElementById('clearCollectionsBtn');
    collectionInfo = document.getElementById('collectionInfo');
    statusBar = document.getElementById('statusBar');
    collectionModal = document.getElementById('collectionModal');
    collectionList = document.getElementById('collectionList');
    closeModal = document.getElementById('closeModal');
    
    // 检查授权
    if (checkAuthorization()) {
        showApp();
    } else {
        showAuth();
        // 显示设备ID
        const deviceId = getDeviceId();
        document.getElementById('deviceIdDisplay').textContent = deviceId;
        document.getElementById('copyDeviceId').addEventListener('click', function() {
            navigator.clipboard.writeText(deviceId).then(() => {
                alert('设备ID已复制');
            });
        });
    }
    
    // 绑定事件
    if (activateBtn) {
        activateBtn.addEventListener('click', handleActivate);
    }
    if (licenseKeyInput) {
        licenseKeyInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleActivate();
            }
        });
    }
    
    if (calculateBtn) {
        calculateBtn.addEventListener('click', calculateDestiny);
    }
    if (resetBtn) {
        resetBtn.addEventListener('click', resetInputs);
    }
    
    if (collectBtn) {
        collectBtn.addEventListener('click', collectCurrent);
    }
    if (showCollectionsBtn) {
        showCollectionsBtn.addEventListener('click', showCollections);
    }
    if (clearCollectionsBtn) {
        clearCollectionsBtn.addEventListener('click', clearCollections);
    }
    if (closeModal) {
        closeModal.addEventListener('click', hideModal);
    }
    if (collectionModal) {
        collectionModal.addEventListener('click', function(e) {
            if (e.target === collectionModal) {
                hideModal();
            }
        });
    }
    
    // 测试按钮
    document.querySelectorAll('.test-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const testNum = parseInt(this.dataset.test);
            setTestCase(testNum);
        });
    });
    
    updateCollectionInfo();
    initPillarGrid();
    initShenshaGrid();
    console.log('Initialization complete');
});

// 显示授权页面
function showAuth() {
    authPage.style.display = 'flex';
    appPage.style.display = 'none';
}

// 显示应用页面
function showApp() {
    authPage.style.display = 'none';
    appPage.style.display = 'block';
}

// 处理激活
async function handleActivate() {
    console.log('验证注册码:', licenseKeyInput.value.trim().toUpperCase());
    const key = licenseKeyInput.value;
    const result = await verifyLicense(key);
    
    if (result.success) {
        console.log('验证成功');
        saveAuthorization(result.key, result.deviceId);
        showApp();
        
        // 提示：这里需要你更新后端的JSON文件，把usedBy填上设备ID
        // 你可以手动更新github gist上的authorization.json
        console.log('请更新授权列表，绑定设备ID:', result.deviceId);
    } else {
        console.log('验证失败:', result.message);
        authError.textContent = result.message;
        authError.style.display = 'block';
    }
}

// 初始化四柱网格
function initPillarGrid() {
    const pillarNames = ['年柱', '月柱', '日柱', '时柱'];
    pillarGrid.innerHTML = '';
    
    pillarNames.forEach(name => {
        const card = document.createElement('div');
        card.className = 'pillar-card';
        if (name === '日柱') {
            card.innerHTML = `
                <div class="pillar-name">${name}</div>
                <div class="double-branch">
                    <div class="pillar-branch-wrapper">
                        <div class="pillar-branch" id="pillar-${name}-branch1"></div>
                        <div class="pillar-info">
                            <div id="pillar-${name}-zodiac1"></div>
                            <div id="pillar-${name}-number1"></div>
                            <div id="pillar-${name}-element1"></div>
                        </div>
                    </div>
                    <div class="pillar-branch-wrapper">
                        <div class="pillar-branch" id="pillar-${name}-branch2"></div>
                        <div class="pillar-info">
                            <div id="pillar-${name}-zodiac2"></div>
                            <div id="pillar-${name}-number2"></div>
                            <div id="pillar-${name}-element2"></div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            card.innerHTML = `
                <div class="pillar-name">${name}</div>
                <div class="pillar-branch" id="pillar-${name}-branch"></div>
                <div class="pillar-info">
                    <div id="pillar-${name}-zodiac"></div>
                    <div id="pillar-${name}-number"></div>
                    <div id="pillar-${name}-element"></div>
                </div>
            `;
        }
        pillarGrid.appendChild(card);
    });
}

// 初始化神煞网格
function initShenshaGrid() {
    shenshaGrid.innerHTML = '';
    shenshaConfig.forEach(([name, key]) => {
        const item = document.createElement('div');
        item.className = 'shensha-item';
        item.innerHTML = `
            <span class="shensha-label">${name}:</span>
            <span class="shensha-value" id="shensha-${key}"></span>
        `;
        shenshaGrid.appendChild(item);
    });
}

// 设置测试用例
function setTestCase(num) {
    if (num === 1) {
        nameInput.value = '测试1';
        yearInput.value = 1986;
        monthInput.value = 1;
        dayInput.value = 13;
        hourInput.value = 23;
        genderInput.value = '女';
    } else if (num === 2) {
        nameInput.value = '测试2';
        yearInput.value = 1986;
        monthInput.value = 5;
        dayInput.value = 13;
        hourInput.value = 11;
        genderInput.value = '女';
    } else if (num === 3) {
        nameInput.value = '测试3';
        yearInput.value = 1986;
        monthInput.value = 8;
        dayInput.value = 15;
        hourInput.value = 18;
        genderInput.value = '男';
    }
    setStatus(`已加载测试用例：${nameInput.value}`);
}

// 重置输入
function resetInputs() {
    nameInput.value = '命主';
    yearInput.value = 1986;
    monthInput.value = 5;
    dayInput.value = 13;
    hourInput.value = 11;
    genderInput.value = '女';
    setStatus('输入已重置');
    clearDisplay();
}

// 清空显示
function clearDisplay() {
    if (stemDisplay) {
        stemDisplay.textContent = '天干（年）: ';
    }
    if (pillarGrid) {
        initPillarGrid();
        initShenshaGrid();
    }
    if (dayunContainer) {
        dayunContainer.innerHTML = '';
    }
    if (liunianGrid) {
        liunianGrid.innerHTML = '';
    }
    clearClock();
}

// 计算命盘
function calculateDestiny() {
    try {
        const birth_data = {
            lunar_year: parseInt(yearInput.value),
            lunar_month: parseInt(monthInput.value),
            lunar_day: parseInt(dayInput.value),
            hour: parseInt(hourInput.value),
            gender: genderInput.value
        };
        
        // 验证输入
        if (!(1900 <= birth_data.lunar_year && birth_data.lunar_year <= 2100)) {
            alert('年份必须在1900-2100之间！');
            return;
        }
        if (!(1 <= birth_data.lunar_month && birth_data.lunar_month <= 12)) {
            alert('农历月份必须在1-12之间！');
            return;
        }
        if (!(1 <= birth_data.lunar_day && birth_data.lunar_day <= 30)) {
            alert('农历日期必须在1-30之间！');
            return;
        }
        if (!(0 <= birth_data.hour && birth_data.hour <= 23)) {
            alert('时辰必须在0-23之间！');
            return;
        }
        
        const hour_branch = destinySystem._get_hour_branch(birth_data.hour);
        if (!hour_branch) {
            alert('无法确定时辰地支！');
            return;
        }
        
        // 计算四柱
        const pillars = destinySystem.calculate_stem_branch(birth_data);
        
        // 计算大运
        const start_year = birth_data.lunar_year;
        const da_yun = destinySystem.calculate_da_yun(
            pillars,
            birth_data.gender,
            birth_data.lunar_month,
            start_year
        );
        
        // 获取流年数据
        const liu_nian_data = destinySystem.get_liu_nian(start_year);
        
        // 神煞分析
        const shensha_results = destinySystem.shen_sha_analysis(pillars);
        
        // 计算十二宫
        const [twelve_palaces, ming_gong_branch] = destinySystem.calculate_twelve_palaces(
            birth_data.lunar_month,
            hour_branch
        );
        
        // 保存当前数据
        currentData = {
            birth_data: birth_data,
            pillars: pillars,
            shensha_results: shensha_results,
            da_yun: da_yun,
            liu_nian_data: liu_nian_data,
            twelve_palaces: twelve_palaces
        };
        
        // 更新显示
        updatePillarDisplay(pillars);
        updateShenshaDisplay(shensha_results);
        updateDayunDisplay(da_yun, liu_nian_data);
        updatePalaceClock(twelve_palaces, ming_gong_branch);
        
        const name = nameInput.value || '命主';
        setStatus(`排盘完成：${name} - ${birth_data.lunar_year}年${birth_data.lunar_month}月${birth_data.lunar_day}日${hour_branch}时`);
        
    } catch (e) {
        alert('计算错误: ' + e.message);
        console.error(e);
    }
}

// 更新四柱显示
function updatePillarDisplay(pillars) {
    stemDisplay.textContent = `天干（年）: ${pillars.year.stem}`;
    
    const pillarData = [
        ['年柱', pillars.year.branch],
        ['月柱', pillars.month.branch],
        ['日柱', pillars.day.branches],
        ['时柱', pillars.hour.branch]
    ];
    
    // 先清空日柱第二个框
    document.getElementById(`pillar-${'日柱'}-branch2`).textContent = '';
    document.getElementById(`pillar-${'日柱'}-zodiac2`).textContent = '';
    document.getElementById(`pillar-${'日柱'}-number2`).textContent = '';
    document.getElementById(`pillar-${'日柱'}-element2`).textContent = '';
    
    pillarData.forEach(([name, branchData]) => {
        if (name === '日柱') {
            // 日柱特殊处理
            if (branchData && branchData.length >= 1) {
                const info1 = destinySystem.get_branch_info(branchData[0]);
                document.getElementById(`pillar-${name}-branch1`).textContent = branchData[0];
                document.getElementById(`pillar-${name}-zodiac1`).textContent = info1.zodiac;
                document.getElementById(`pillar-${name}-number1`).textContent = info1.number;
                document.getElementById(`pillar-${name}-element1`).textContent = info1.element;
            }
            if (branchData && branchData.length >= 2) {
                const info2 = destinySystem.get_branch_info(branchData[1]);
                document.getElementById(`pillar-${name}-branch2`).textContent = branchData[1];
                document.getElementById(`pillar-${name}-zodiac2`).textContent = info2.zodiac;
                document.getElementById(`pillar-${name}-number2`).textContent = info2.number;
                document.getElementById(`pillar-${name}-element2`).textContent = info2.element;
            }
        } else {
            // 正常处理
            const element = document.getElementById(`pillar-${name}-branch`);
            if (element) element.innerHTML = '';
            const zodiacEl = document.getElementById(`pillar-${name}-zodiac`);
            if (zodiacEl) zodiacEl.innerHTML = '';
            const numberEl = document.getElementById(`pillar-${name}-number`);
            if (numberEl) numberEl.innerHTML = '';
            const elementEl = document.getElementById(`pillar-${name}-element`);
            if (elementEl) elementEl.innerHTML = '';
            
            if (branchData) {
                const info = destinySystem.get_branch_info(branchData);
                if (element) element.textContent = branchData;
                if (zodiacEl) zodiacEl.textContent = info.zodiac;
                if (numberEl) numberEl.textContent = info.number;
                if (elementEl) elementEl.textContent = info.element;
            }
        }
    });
}

// 更新神煞显示
function updateShenshaDisplay(shensha_results) {
    shenshaConfig.forEach(([name, key]) => {
        const element = document.getElementById(`shensha-${key}`);
        let value = shensha_results[key];
        let needProcess = true;
        
        // 六冲、六合、六害、三刑都在branch_relations里
        if (key === 'san_xing') {
            value = shensha_results.branch_relations['三刑'];
        } else if (key === 'liu_chong') {
            value = shensha_results.branch_relations['六冲'];
        } else if (key === 'liu_he') {
            value = shensha_results.branch_relations['六合'];
        } else if (key === 'liu_hai') {
            value = shensha_results.branch_relations['六害'];
        }
        
        if (!value || (Array.isArray(value) && value.length === 0) || (typeof value === 'object' && Object.keys(value).length === 0)) {
            element.textContent = '无';
            return;
        }
        
        let text = '';
        
        if (key === 'ba_sha' && Array.isArray(value)) {
            text = value.map(pair => pair.join('')).join('、');
        } else if (key === 'white_tiger' && Array.isArray(value)) {
            text = value.map(pair => pair.join('')).join('、');
        } else if (key === 'san_sha' && typeof value === 'object') {
            const parts = [];
            for (const [sha_type, branch] of Object.entries(value)) {
                const typeMap = {jie: '劫', bing: '病', zai: '灾', wang: '亡'};
                parts.push(`${typeMap[sha_type]}:${branch}`);
            }
            text = parts.join(' ');
        } else if (key === 'san_he_ju' && Array.isArray(value)) {
            const parts = [];
            for (const san_he of value) {
                if (san_he.complete) {
                    parts.push(`${san_he.name}(${san_he.element})`);
                }
            }
            text = parts.join(' ') || '无';
        } else if (key === 'tianyi_guiren' && Array.isArray(value)) {
            text = value.join('、');
        } else if (typeof value === 'string') {
            text = value;
        } else if (Array.isArray(value)) {
            text = value.slice(0, 3).join(' ');
        }
        
        element.textContent = text;
    });
}

// 更新大运显示
function updateDayunDisplay(da_yun, liu_nian_data) {
    dayunContainer.innerHTML = '';
    currentLiunianData = liu_nian_data;
    
    da_yun.forEach((daYunItem, index) => {
        const item = document.createElement('div');
        item.className = 'dayun-item';
        if (index === 0) item.classList.add('active');
        item.innerHTML = `
            <div class="dayun-age">${daYunItem.age_range}</div>
            <div class="dayun-branch">${daYunItem.branch}</div>
        `;
        item.addEventListener('click', () => showLiunian(index));
        dayunContainer.appendChild(item);
    });
    
    // 默认显示第一个大运
    if (da_yun.length > 0) {
        showLiunian(0);
    }
}

// 显示流年
function showLiunian(dayunIndex) {
    // 激活选中的大运
    const items = document.querySelectorAll('.dayun-item');
    items.forEach((item, index) => {
        if (index === dayunIndex) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // 清空流年
    liunianGrid.innerHTML = '';
    
    // 获取对应大运的流年数据
    const keys = Object.keys(currentLiunianData);
    if (dayunIndex < keys.length) {
        const key = keys[dayunIndex];
        const yearList = currentLiunianData[key];
        
        // 两行显示，每行5年
        yearList.forEach(yearInfo => {
            const item = document.createElement('div');
            item.className = 'liunian-item';
            item.innerHTML = `
                <div class="liunian-year">${yearInfo.year}</div>
                <div class="liunian-stem">${yearInfo.stem_branch}</div>
            `;
            liunianGrid.appendChild(item);
        });
    }
}

// 更新十二宫时钟
function updatePalaceClock(twelvePalaces, mingGong) {
    const canvas = clockCanvas;
    const ctx = canvas.getContext('2d');
    const size = 280;
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = 120;
    
    // 清空画布
    ctx.clearRect(0, 0, size, size);
    
    // 绘制外圆
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // 地支顺序：顺时针，子在下（正下方）
    const branches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    
    // 绘制每个地支位置
    branches.forEach((branch, i) => {
        // 计算角度 - 从正下方（子）开始顺时针
        const angle = (Math.PI / 2) + i * (Math.PI / 6); // 90度是正下方
        const x = centerX + radius * 0.85 * Math.cos(angle);
        const y = centerY + radius * 0.85 * Math.sin(angle);
        
        // 获取宫位名称
        let palaceName = '';
        for (const [palace, b] of Object.entries(twelvePalaces)) {
            if (b === branch) {
                palaceName = palace;
                break;
            }
        }
        
        // 获取信息
        const info = destinySystem.get_branch_info(branch);
        const isMingGong = palaceName === '命宫';
        
        // 绘制背景圆
        ctx.beginPath();
        const r = 32;
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        if (isMingGong) {
            ctx.fillStyle = '#ffcccc';
        } else if (palaceName) {
            ctx.fillStyle = '#e6f7ff';
        } else {
            ctx.fillStyle = '#ffffff';
        }
        ctx.fill();
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // 绘制文字
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // 地支
        ctx.font = 'bold 16px sans-serif';
        ctx.fillStyle = isMingGong ? '#ff0000' : '#0000ff';
        ctx.fillText(branch, x, y - 12);
        
        // 星
        ctx.font = '10px sans-serif';
        ctx.fillStyle = '#333';
        ctx.fillText(info.star, x, y + 2);
        
        // 宫位名称
        if (palaceName) {
            ctx.font = '10px sans-serif';
            ctx.fillStyle = isMingGong ? '#ff0000' : '#0000ff';
            ctx.fillText(palaceName, x, y + 14);
        }
    });
}

// 清空时钟
function clearClock() {
    const canvas = clockCanvas;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// 收藏功能
function loadCollections() {
    const data = localStorage.getItem('gufa_collections');
    return data ? JSON.parse(data) : [];
}

function saveCollections() {
    localStorage.setItem('gufa_collections', JSON.stringify(collections));
}

function updateCollectionInfo() {
    collectionInfo.textContent = `已收藏: ${collections.length} 个命盘`;
}

function collectCurrent() {
    if (!currentData || !currentData.pillars) {
        alert('请先进行排盘操作！');
        return;
    }
    
    let name = nameInput.value.trim();
    if (!name) {
        name = `命主_${new Date().format('yyyyMMdd_HHmm')}`;
    }
    
    const now = new Date();
    const record = {
        id: collections.length + 1,
        name: name,
        birth_data: currentData.birth_data,
        pillars: currentData.pillars,
        shensha_results: currentData.shensha_results,
        da_yun: currentData.da_yun,
        twelve_palaces: currentData.twelve_palaces,
        created_at: now.toISOString().replace('T', ' ').slice(0, 19),
        liu_nian_years: Object.keys(currentData.liu_nian_data)[0] || ""
    };
    
    collections.push(record);
    saveCollections();
    updateCollectionInfo();
    alert(`已成功收藏命盘: ${name}`);
}

function showCollections() {
    if (collections.length === 0) {
        alert('收藏夹为空！');
        return;
    }
    
    collectionList.innerHTML = '';
    
    collections.forEach((record, index) => {
        const item = document.createElement('div');
        item.className = 'collection-item';
        const bd = record.birth_data;
        item.innerHTML = `
            <div class="collection-name">${record.id}. ${record.name}</div>
            <div class="collection-info">${bd.lunar_year}年${bd.lunar_month}月${bd.lunar_day}日 ${bd.gender}性 - ${record.created_at}</div>
            <div class="collection-actions">
                <button class="btn load-btn" data-index="${index}">加载</button>
                <button class="btn delete-btn" data-index="${index}">删除</button>
            </div>
        `;
        collectionList.appendChild(item);
        
        item.querySelector('.load-btn').addEventListener('click', () => {
            loadCollection(index);
            hideModal();
        });
        
        item.querySelector('.delete-btn').addEventListener('click', () => {
            if (confirm(`确定要删除收藏: ${record.name} 吗？`)) {
                deleteCollection(index);
                showCollections();
                updateCollectionInfo();
            }
        });
    });
    
    collectionModal.style.display = 'flex';
}

function loadCollection(index) {
    const record = collections[index];
    const bd = record.birth_data;
    
    nameInput.value = record.name;
    yearInput.value = bd.lunar_year;
    monthInput.value = bd.lunar_month;
    dayInput.value = bd.lunar_day;
    hourInput.value = bd.hour;
    genderInput.value = bd.gender;
    
    calculateDestiny();
    alert(`已加载收藏: ${record.name}`);
}

function deleteCollection(index) {
    collections.splice(index, 1);
    // 重新编号
    collections.forEach((record, i) => {
        record.id = i + 1;
    });
    saveCollections();
}

function clearCollections() {
    if (collections.length === 0) {
        alert('收藏夹已为空！');
        return;
    }
    
    if (confirm('确定要清空所有收藏吗？')) {
        collections = [];
        saveCollections();
        updateCollectionInfo();
        alert('所有收藏已清空！');
    }
}

function hideModal() {
    collectionModal.style.display = 'none';
}

function setStatus(text) {
    statusBar.textContent = text;
}

// 辅助函数：日期格式化
if (!Date.prototype.format) {
    Date.prototype.format = function(format) {
        const o = {
            'M+': this.getMonth() + 1,
            'd+': this.getDate(),
            'H+': this.getHours(),
            'm+': this.getMinutes(),
            's+': this.getSeconds(),
        };
        if (/(y+)/.test(format)) {
            format = format.replace(RegExp.$1, (this.getFullYear() + '').substr(4 - RegExp.$1.length));
        }
        for (const k in o) {
            if (new RegExp(`(${k})`).test(format)) {
                format = format.replace(RegExp.$1, RegExp.$1.length === 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length));
            }
        }
        return format;
    };
}
