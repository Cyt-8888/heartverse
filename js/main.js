const pages = ['home', 'section1', 'section2', 'section3', 'section4'];

// 1. 算法核心：动态生成高精度圆润球形纹理（免资产依赖，防报错）
function createCircleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // 绘制径向渐变，实现边缘柔和羽化的完美球体粒子
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
}

// 2. 初始化复刻级灰白空间 Three.js 粒子群
function initThreejsParticles() {
    const canvas = document.getElementById('bg-particle-canvas');
    if (!canvas) return;

    const scene = new THREE.Scene();
    // 雾化处理，让远处的粒子具有与图片一致的朦胧消散空间感
    scene.fog = new THREE.FogExp2('#e4e7eb', 0.12);

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // 大量粒子流动承托（高密度，还原图片丰富细节）
    const particleCount = 1800; 
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const randomScales = new Float32Array(particleCount); // 存储随机波动频率

    // 配色方案：严格对应图片中的璀璨纯白、科技灰白、生命红
    const colorWhite = new THREE.Color('#ffffff');
    const colorGrey = new THREE.Color('#cbd5e0');
    const colorRed = new THREE.Color('#ff3355');

    for (let i = 0; i < particleCount * 3; i += 3) {
        // 让粒子呈轻微拉伸的椭圆流体状散射排布
        positions[i] = (Math.random() - 0.5) * 10;
        positions[i + 1] = (Math.random() - 0.5) * 8;
        positions[i + 2] = (Math.random() - 0.5) * 6;

        // 颜色概率混合：70% 璀璨白/灰白粒子作为大空间底色，30% 缀以灵动生命红粒子
        const rand = Math.random();
        let chosenColor = colorWhite;
        if (rand > 0.3 && rand <= 0.7) {
            chosenColor = colorGrey;
        } else if (rand > 0.7) {
            chosenColor = colorRed;
        }

        colors[i] = chosenColor.r;
        colors[i + 1] = chosenColor.g;
        colors[i + 2] = chosenColor.b;

        randomScales[i / 3] = Math.random() * 10;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // 使用高阶 PointsMaterial 结合球形纹理
    const particleMaterial = new THREE.PointsMaterial({
        size: 0.05,
        vertexColors: true,
        transparent: true,
        opacity: 0.75,
        map: createCircleTexture(), // 挂载圆润球形材质
        blending: THREE.NormalBlending, // 灰白模式下使用常规混合，防止粒子在白底上过载蒸发
        depthWrite: false
    });

    const particleMesh = new THREE.Points(geometry, particleMaterial);
    scene.add(particleMesh);

    camera.position.z = 4;

    // 引入正弦微流体动效，让红白粒子呈现如同图片中从左下向右上浮动的柔和生命感
    let elapsedTime = 0;
    function animateParticles() {
        requestAnimationFrame(animateParticles);
        elapsedTime += 0.002;

        particleMesh.rotation.y = elapsedTime * 0.1;
        particleMesh.rotation.x = elapsedTime * 0.05;

        // 动能矩阵微调
        const positionsArr = geometry.attributes.position.array;
        for (let i = 0; i < particleCount; i++) {
            const idx = i * 3;
            // 让粒子在 Y 轴上产生错落有致的正弦漂浮流动
            positionsArr[idx + 1] += Math.sin(elapsedTime + randomScales[i]) * 0.0008;
        }
        geometry.attributes.position.needsUpdate = true;

        renderer.render(scene, camera);
    }
    
    animateParticles();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// 3. 异步分屏组件动态装载
async function loadContent() {
    for (const id of pages) {
        try {
            const response = await fetch(`sections/${id}.html`);
            if (response.ok) {
                const html = await response.text();
                const container = document.getElementById(id);
                container.innerHTML = html;

                const scripts = container.querySelectorAll('script');
                scripts.forEach(oldScript => {
                    const newScript = document.createElement('script');
                    Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
                    newScript.appendChild(document.createTextNode(oldScript.innerHTML));
                    oldScript.parentNode.replaceChild(newScript, oldScript);
                });
            }
        } catch (error) {
            console.error(`加载分屏失败: ${id}`, error);
        }
    }
    initPremiumInteractions();
}

// 4. 全局滚动状态观察联动系统
function initPremiumInteractions() {
    const sections = document.querySelectorAll('.screen');
    const navLinks = document.querySelectorAll('.nav-links a');
    const progressDots = document.querySelectorAll('.dots-container .v-dot');
    const startNum = document.querySelector('.top-num');
    const activeLine = document.querySelector('.active-progress-line');
    const navbar = document.querySelector('.navbar');

    // 核心更新函数：统一更新 UI 状态
    function updateUI(index, currentId) {
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentId}`) link.classList.add('active');
        });

        progressDots.forEach(dot => {
            dot.classList.remove('active');
            if (dot.getAttribute('href') === `#${currentId}`) dot.classList.add('active');
        });

        if (startNum) startNum.textContent = `0${index + 1}`;
        if (activeLine) {
            const percent = (index / (pages.length - 1)) * 100;
            activeLine.style.height = `${percent}%`;
        }
    }

    // 优化：使用较低的 threshold 并引入更安全的交叠判定
    const scrollObserver = new IntersectionObserver((entries) => {
        // 防止触底时被强行覆盖，优先保留触底状态
        const isBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 60;
        if (isBottom) return;

        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const currentId = entry.target.id;
                const index = pages.indexOf(currentId);
                updateUI(index, currentId);
            }
        });
    }, { root: null, threshold: 0.3 }); // 降到 0.3，保证带有庞大页脚的内容更容易触发

    sections.forEach(sec => scrollObserver.observe(sec));

    let lastScrollTop = 0;
    window.addEventListener('scroll', () => {
        let currentScroll = window.pageYOffset || document.documentElement.scrollTop;
        
        // 1. 隐藏/显示 导航栏逻辑
        if (currentScroll > lastScrollTop && currentScroll > 90) {
            navbar.classList.add('navbar--hidden');
        } else {
            navbar.classList.remove('navbar--hidden');
        }
        lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;

        // 2. 核心补丁：极致触底安全锁
        // 当页面完全滑到底部时，强制拉满最后一页的联动动画（05 屏）
        if (window.innerHeight + currentScroll >= document.documentElement.scrollHeight - 5) {
            const lastIndex = pages.length - 1;
            const lastId = pages[lastIndex];
            updateUI(lastIndex, lastId);
        }
    }, { passive: true });
}

// 生命周期安全挂载
window.addEventListener('DOMContentLoaded', () => {
    initThreejsParticles();
    loadContent();
});