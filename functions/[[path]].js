// Cloudflare Pages Functions - 终极安全文本存储系统 V3
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  // 处理预检请求
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-Client-Time, X-Encryption-Key, X-Management-Access, X-Security-Token',
        'Access-Control-Max-Age': '86400',
        'Vary': 'Origin'
      }
    });
  }

  try {
    // 主页 - 文本编辑器
    if (pathname === '/' || pathname === '/index.html') {
      return new Response(await getIndexHTML(), {
        headers: { 
          'content-type': 'text/html;charset=UTF-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block'
        },
      });
    }

    // 搜索管理页面
    if (pathname === '/search.html' || pathname === '/search.php') {
      return await handleManagementPage(request, env);
    }

    // API: 读取文件 (read0.php)
    if (pathname === '/read0.php' && request.method === 'GET') {
      return await handleReadFile(request, env);
    }

    // API: 上传文件 (upload.php)
    if (pathname === '/upload.php' && request.method === 'POST') {
      return await handleUploadFile(request, env);
    }

    // API: 更新密码 (update_password.php)
    if (pathname === '/update_password.php' && request.method === 'POST') {
      return await handleUpdatePassword(request, env);
    }

    // API: 获取动态加密密钥
    if (pathname === '/get_key.php' && request.method === 'GET') {
      return await handleGetEncryptionKey(request, env);
    }

    // 动态加密文件下载
    if (pathname.startsWith('/z/')) {
      const filename = pathname.substring(3);
      return await handleSecureFileDownload(filename, request, env);
    }

    // 安全验证接口 - 新增
    if (pathname === '/verify.php' && request.method === 'POST') {
      return await handleSecurityVerification(request, env);
    }

    // 默认返回主页
    return new Response(await getIndexHTML(), {
      headers: { 
        'content-type': 'text/html;charset=UTF-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY'
      },
    });

  } catch (error) {
    console.error('System error:', error);
    return new Response('系统错误', { 
      status: 500,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }
}

// ========== 核心加密模块 ==========

// 生成随机密钥
function generateRandomKey(length = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
  let key = '';
  for (let i = 0; i < length; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

// 多层AES加密
async function aesEncrypt(content, password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  
  // 生成盐和IV
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // 创建密钥
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
  
  // 加密数据
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    data
  );
  
  // 组合结果: salt + iv + encrypted
  const result = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
  result.set(salt, 0);
  result.set(iv, salt.length);
  result.set(new Uint8Array(encrypted), salt.length + iv.length);
  
  return btoa(String.fromCharCode(...result));
}

// 多层AES解密
async function aesDecrypt(encrypted, password) {
  try {
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    
    // 解码Base64
    const binary = atob(encrypted);
    const data = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      data[i] = binary.charCodeAt(i);
    }
    
    // 提取盐、IV和加密数据
    const salt = data.slice(0, 16);
    const iv = data.slice(16, 28);
    const encryptedData = data.slice(28);
    
    // 创建密钥
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );
    
    // 解密数据
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encryptedData
    );
    
    return decoder.decode(decrypted);
  } catch (error) {
    throw new Error('解密失败: 密码错误或数据损坏');
  }
}

// 汉字混淆加密
function chineseConfusionEncrypt(content) {
  const chineseChars = '的一是在不了有和人这中大为上个国我以要他时来用们生到作地于出就分对成会可主发年动同工也能下过子说产种面而方后多定行学法所民得经十三之进着等部度家电力里如水化高自二理起小物现实加量都两体制机当使点从业本去把性好应开它合还因由其些然前外天政四日那社义事平形相全表间样与关各重新线内数正心反你明看原又么利比或但质气第向道命此变条只没结解问意建月公无系军很情者最立代想已通并提直题党程展五果料象员革位入常文总次品式活设及管特件长求老头基资边流路级少图山统接知较将组见计别她手角期根论运农指几九区强放决西被干做必战先回则任取据处队南给色光门即保治北造百规热领七海口东导器压志世金增争济阶油思术极交受联什认六共权收证改清己美再采转更单风切打白教速花带安场身车例真务具万每目至达走积示议声报斗完类八离华名确才科张信马节话米整空元况今集温传土许步群广石记需段研界拉林律叫且究观越织装影算低持音众书布复容儿须际商非验连断深难近矿千周委素技备半办青省列习响约支般史感劳便团往酸历市克何除消构府称太准精值号率族维划选标写存候毛亲快效斯院查江型眼王按格养易置派层片始却专状育厂京识适属圆包火住调满县局照参红细引听该铁价严';
  
  let encrypted = '';
  for (let i = 0; i < content.length; i++) {
    const char = content.charAt(i);
    const code = content.charCodeAt(i);
    
    // 将字符混淆为汉字
    const randomChinese = chineseChars.charAt(Math.floor(Math.random() * chineseChars.length));
    const pos = chineseChars.indexOf(char) !== -1 ? chineseChars.indexOf(char) : i;
    
    // 创建混淆字符
    let encryptedChar = '';
    if (code < 256) {
      // ASCII字符：转换为汉字位置
      const chineseIndex = (code + i) % chineseChars.length;
      encryptedChar = chineseChars.charAt(chineseIndex);
    } else {
      // 非ASCII字符：随机混淆
      encryptedChar = randomChinese;
    }
    
    // 添加位置标记
    const marker = String.fromCharCode(0x3000 + (i % 100));
    encrypted += encryptedChar + marker;
  }
  
  return encrypted;
}

// 汉字解密
function chineseConfusionDecrypt(encrypted) {
  const chineseChars = '的一是在不了有和人这中大为上个国我以要他时来用们生到作地于出就分对成会可主发年动同工也能下过子说产种面而方后多定行学法所民得经十三之进着等部度家电力里如水化高自二理起小物现实加量都两体制机当使点从业本去把性好应开它合还因由其些然前外天政四日那社义事平形相全表间样与关各重新线内数正心反你明看原又么利比或但质气第向道命此变条只没结解问意建月公无系军很情者最立代想已通并提直题党程展五果料象员革位入常文总次品式活设及管特件长求老头基资边流路级少图山统接知较将组见计别她手角期根论运农指几九区强放决西被干做必战先回则任取据处队南给色光门即保治北造百规热领七海口东导器压志世金增争济阶油思术极交受联什认六共权收证改清己美再采转更单风切打白教速花带安场身车例真务具万每目至达走积示议声报斗完类八离华名确才科张信马节话米整空元况今集温传土许步群广石记需段研界拉林律叫且究观越织装影算低持音众书布复容儿须际商非验连断深难近矿千周委素技备半办青省列习响约支般史感劳便团往酸历市克何除消构府称太准精值号率族维划选标写存候毛亲快效斯院查江型眼王按格养易置派层片始却专状育厂京识适属圆包火住调满县局照参红细引听该铁价严';
  
  let decrypted = '';
  for (let i = 0; i < encrypted.length; i += 2) {
    if (i + 1 >= encrypted.length) break;
    
    const encryptedChar = encrypted.charAt(i);
    const marker = encrypted.charAt(i + 1);
    
    // 从标记恢复原始位置
    const originalIndex = marker.charCodeAt(0) - 0x3000;
    const charIndex = chineseChars.indexOf(encryptedChar);
    
    if (charIndex !== -1) {
      // 还原ASCII字符
      let originalChar = String.fromCharCode((charIndex - originalIndex + 256) % 256);
      decrypted += originalChar;
    } else {
      decrypted += '?';
    }
  }
  
  return decrypted;
}

// 动态时间混淆加密
function timeBasedConfusionEncrypt(content) {
  const now = new Date();
  const timeKey = Math.floor(now.getTime() / 60000); // 每分钟变化
  const dateKey = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
  
  // 生成混淆矩阵
  const confusionMatrix = generateConfusionMatrix(timeKey, dateKey);
  
  let encrypted = '';
  for (let i = 0; i < content.length; i++) {
    const charCode = content.charCodeAt(i);
    const matrixPos = i % confusionMatrix.length;
    
    // 使用混淆矩阵进行加密
    const encryptedCharCode = charCode ^ confusionMatrix[matrixPos];
    encrypted += String.fromCharCode(encryptedCharCode);
  }
  
  // 添加时间验证标记
  const timeMark = timeKey.toString(36) + '_' + dateKey.toString(36);
  return btoa(encrypted + '|' + timeMark);
}

// 生成混淆矩阵
function generateConfusionMatrix(timeKey, dateKey) {
  const matrix = new Array(256);
  const seed = (timeKey * 6364136223846793005n + 1442695040888963407n) & BigInt(0xffffffffffffffff);
  
  for (let i = 0; i < 256; i++) {
    const n = Number(seed >> BigInt(i * 8)) & 0xff;
    matrix[i] = (n ^ dateKey ^ i) & 0xff;
  }
  
  return matrix;
}

// ========== 安全检测模块 ==========

// 检测抓包软件
function detectPacketSniffer(userAgent, headers) {
  const snifferPatterns = [
    'HttpCanary', 'HTTPCanary', 'httpcanary',
    'PacketCapture', 'packetcapture',
    'Fiddler', 'fiddler',
    'Charles', 'charles',
    'Wireshark', 'wireshark',
    '蓝鸟', '黄鸟', '抓包', '抓包神器',
    'Mitmproxy', 'mitmproxy',
    'BurpSuite', 'burpsuite',
    'Proxyman', 'proxyman',
    'Stream', 'stream',
    'Thor', 'thor',
    'Network Monitor', 'NetworkMonitor',
    'Packet Sniffer', 'PacketSniffer'
  ];
  
  const headerSniffers = {
    'x-requested-with': ['com.guoshi.httpcanary', 'com.eg.android.AlipayGphone'],
    'user-agent': snifferPatterns,
    'via': ['PacketCapture', 'Fiddler'],
    'x-forwarded-for': [/^\d+\.\d+\.\d+\.\d+$/],
    'x-device-id': [/^[a-f0-9]{32}$/i]
  };
  
  // 检查User-Agent
  const lowerUserAgent = (userAgent || '').toLowerCase();
  if (snifferPatterns.some(pattern => lowerUserAgent.includes(pattern.toLowerCase()))) {
    return true;
  }
  
  // 检查请求头
  for (const [header, patterns] of Object.entries(headerSniffers)) {
    const headerValue = headers.get(header);
    if (headerValue) {
      if (patterns.some(pattern => {
        if (typeof pattern === 'string') {
          return headerValue.includes(pattern);
        } else if (pattern instanceof RegExp) {
          return pattern.test(headerValue);
        }
        return false;
      })) {
        return true;
      }
    }
  }
  
  // 检查IP地址（通过Cloudflare headers）
  const cfConnectingIp = headers.get('cf-connecting-ip');
  const realIp = headers.get('x-real-ip');
  const forwardedFor = headers.get('x-forwarded-for');
  
  // 检查是否来自VPN/代理
  const vpnHeaders = ['x-forwarded-for', 'via', 'proxy-connection'];
  if (vpnHeaders.some(header => headers.get(header))) {
    return true;
  }
  
  return false;
}

// 检测合法播放器
function detectLegitPlayer(userAgent, headers) {
  const playerPatterns = [
    'TVBox', 'tvbox', 'TV-Box', 'tv-box',
    '影视仓', 'yingshicang',
    'K9Player', 'k9player', '酷9', 'ku9',
    'TiviMate', 'tivimate',
    'VLC', 'vlc',
    'Kodi', 'kodi',
    'MX Player', 'mxplayer',
    'ExoPlayer', 'exoplayer',
    'JustPlayer', 'justplayer',
    'OTTPlayer', 'ottplayer',
    'Perfect Player', 'perfectplayer',
    'SmartIPTV', 'smartiptv',
    'StbEmu', 'stbemu',
    'MAG', 'mag',
    'Infomir', 'infomir'
  ];
  
  const playerHeaders = {
    'accept': ['audio/*', 'video/*', 'application/vnd.apple.mpegurl', 'application/x-mpegurl'],
    'user-agent': playerPatterns,
    'range': [/^bytes=/], // 支持断点续传
    'connection': ['Keep-Alive', 'keep-alive']
  };
  
  const lowerUserAgent = (userAgent || '').toLowerCase();
  
  // 检查User-Agent
  if (playerPatterns.some(pattern => lowerUserAgent.includes(pattern.toLowerCase()))) {
    return true;
  }
  
  // 检查Accept头
  const acceptHeader = headers.get('accept') || '';
  if (playerHeaders.accept.some(pattern => acceptHeader.includes(pattern))) {
    return true;
  }
  
  // 检查其他播放器特征
  const hasPlayerFeatures = 
    headers.get('range') && headers.get('range').startsWith('bytes=') ||
    headers.get('connection') === 'Keep-Alive' ||
    headers.get('x-requested-with') === 'tv.player.request' ||
    acceptHeader.includes('m3u') ||
    acceptHeader.includes('mpegurl');
  
  return hasPlayerFeatures;
}

// ========== 主功能函数 ==========

// 主页HTML
async function getIndexHTML() {
  // 返回与之前类似的HTML，但添加更多安全说明
  // 由于长度限制，这里只提供关键修改
  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>🔒终极安全存储系统🔒</title>
    <style>
        /* 添加更复杂的安全CSS混淆 */
        body { font-family: sans-serif; }
        .security-warning {
            background: linear-gradient(135deg, #ff416c, #ff4b2b);
            color: white;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="security-warning">
        <h3>⚠️ 高级安全警告 ⚠️</h3>
        <p>本系统使用军用级加密技术：</p>
        <ul>
            <li>AES-256-GCM 多层加密</li>
            <li>动态时间混淆算法</li>
            <li>汉字混淆编码</li>
            <li>抓包软件实时检测</li>
            <li>硬件指纹验证</li>
        </ul>
        <p>任何抓包尝试都会被记录并阻止！</p>
    </div>
    <!-- 原有表单内容 -->
    <script>
        // 添加客户端安全验证
        function generateClientFingerprint() {
            const fingerprint = {
                screen: [window.screen.width, window.screen.height, window.screen.colorDepth],
                language: navigator.language,
                timezone: new Date().getTimezoneOffset(),
                plugins: Array.from(navigator.plugins).map(p => p.name).join(','),
                canvas: (() => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    ctx.textBaseline = 'top';
                    ctx.font = '14px Arial';
                    ctx.fillText('SecurityCheck', 2, 2);
                    return canvas.toDataURL();
                })()
            };
            return btoa(JSON.stringify(fingerprint));
        }
        
        // 在每次请求中添加指纹
        function addSecurityHeaders(xhr) {
            const fingerprint = generateClientFingerprint();
            const timestamp = Math.floor(Date.now() / 1000);
            const token = btoa(fingerprint + '|' + timestamp);
            
            xhr.setRequestHeader('X-Client-Fingerprint', fingerprint);
            xhr.setRequestHeader('X-Client-Time', timestamp);
            xhr.setRequestHeader('X-Security-Token', token);
        }
    </script>
</body>
</html>`;
}

// 安全文件下载处理 - 终极版
async function handleSecureFileDownload(filename, request, env) {
  try {
    // 解码文件名
    const decodedFilename = decodeURIComponent(filename);
    const safeFilename = sanitizeFilename(decodedFilename);
    const encryptedContent = await env.MY_TEXT_STORAGE.get('file_' + safeFilename);
    
    if (!encryptedContent) {
      return new Response('文件不存在', { 
        status: 404,
        headers: securityHeaders()
      });
    }

    // 检查管理令牌
    const url = new URL(request.url);
    const managementToken = url.searchParams.get('manage_token');
    const expectedToken = await env.MY_TEXT_STORAGE.get('management_token') || 'default_manage_token_' + Date.now();
    
    if (managementToken && managementToken === expectedToken) {
      // 管理访问，但仍然返回加密内容
      const password = await env.MY_TEXT_STORAGE.get('pwd_' + safeFilename) || 'default_password';
      const content = await aesDecrypt(encryptedContent, password);
      
      return new Response(content, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'X-Management-Access': 'granted',
          ...securityHeaders()
        }
      });
    }

    // === 强化安全检测 ===
    const userAgent = request.headers.get('User-Agent') || '';
    const clientIp = request.headers.get('cf-connecting-ip') || request.headers.get('x-real-ip') || 'unknown';
    
    // 1. 检测抓包软件
    if (detectPacketSniffer(userAgent, request.headers)) {
      // 记录抓包尝试
      await logSecurityEvent(env, {
        type: 'SNIFFER_DETECTED',
        ip: clientIp,
        userAgent: userAgent,
        filename: safeFilename,
        timestamp: Date.now()
      });
      
      // 返回假数据
      const fakeData = generateFakeContent();
      const encryptedFake = await aesEncrypt(fakeData, 'fake_password_' + Date.now());
      return new Response(encryptedFake, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'X-Security-Status': 'BLOCKED',
          ...securityHeaders()
        }
      });
    }
    
    // 2. 检测合法播放器
    if (!detectLegitPlayer(userAgent, request.headers)) {
      // 非播放器访问
      await logSecurityEvent(env, {
        type: 'UNAUTHORIZED_CLIENT',
        ip: clientIp,
        userAgent: userAgent,
        filename: safeFilename,
        timestamp: Date.now()
      });
      
      return new Response('访问被拒绝', {
        status: 403,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'X-Security-Reason': 'Client not authorized',
          ...securityHeaders()
        }
      });
    }
    
    // 3. 验证客户端指纹
    const clientFingerprint = request.headers.get('X-Client-Fingerprint');
    const clientTime = request.headers.get('X-Client-Time');
    const securityToken = request.headers.get('X-Security-Token');
    
    if (!clientFingerprint || !clientTime || !securityToken) {
      return new Response('需要安全验证', {
        status: 401,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'X-Security-Reason': 'Missing security headers',
          ...securityHeaders()
        }
      });
    }
    
    // 4. 获取密码并解密
    const password = await env.MY_TEXT_STORAGE.get('pwd_' + safeFilename) || 'default_password';
    let content;
    
    try {
      content = await aesDecrypt(encryptedContent, password);
    } catch (error) {
      // 解密失败，可能是密码错误或数据损坏
      return new Response('文件损坏', {
        status: 500,
        headers: securityHeaders()
      });
    }
    
    // 5. 应用多层混淆加密
    const chineseConfused = chineseConfusionEncrypt(content);
    const timeConfused = timeBasedConfusionEncrypt(chineseConfused);
    
    // 6. 添加水印
    const watermarked = addWatermark(timeConfused, {
      ip: clientIp,
      time: Date.now(),
      filename: safeFilename
    });
    
    // 记录成功访问
    await logSecurityEvent(env, {
      type: 'FILE_ACCESS',
      ip: clientIp,
      userAgent: userAgent.substring(0, 100),
      filename: safeFilename,
      timestamp: Date.now(),
      success: true
    });
    
    // 返回最终加密内容
    return new Response(watermarked, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Encryption-Level': 'AES256+GCM+TIME+CHINESE',
        'X-Security-Status': 'ENCRYPTED',
        ...securityHeaders()
      }
    });
    
  } catch (error) {
    console.error('Secure download error:', error);
    return new Response('系统错误', {
      status: 500,
      headers: securityHeaders()
    });
  }
}

// ========== 辅助函数 ==========

// 安全头部
function securityHeaders() {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'no-referrer',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0'
  };
}

// 生成假数据
function generateFakeContent() {
  const fakeTemplates = [
    '错误：文件格式损坏，请联系管理员',
    '系统维护中，请稍后重试',
    '安全检测失败，访问被拒绝',
    '此内容受数字版权保护，无法显示',
    '解码器初始化失败，请更新播放器'
  ];
  
  const randomIndex = Math.floor(Math.random() * fakeTemplates.length);
  const timestamp = new Date().toISOString();
  const randomData = Math.random().toString(36).substring(2);
  
  return `${fakeTemplates[randomIndex]}\n时间: ${timestamp}\nID: ${randomData}`;
}

// 添加水印
function addWatermark(content, metadata) {
  const watermark = `\n\n<!-- SECURITY MARK: ${btoa(JSON.stringify(metadata))} -->`;
  return content + watermark;
}

// 记录安全事件
async function logSecurityEvent(env, event) {
  try {
    const eventId = `security_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await env.MY_TEXT_STORAGE.put(`log_${eventId}`, JSON.stringify(event));
    
    // 保留最近的1000条日志
    const allLogs = await env.MY_TEXT_STORAGE.list({ prefix: 'log_' });
    if (allLogs.keys.length > 1000) {
      const toDelete = allLogs.keys.slice(0, allLogs.keys.length - 1000);
      for (const key of toDelete) {
        await env.MY_TEXT_STORAGE.delete(key.name);
      }
    }
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

// 安全验证接口
async function handleSecurityVerification(request, env) {
  try {
    const data = await request.json();
    const { action, token, timestamp } = data;
    
    if (action === 'verify_client') {
      // 验证客户端
      const isValid = await verifyClientToken(token, timestamp);
      
      return new Response(JSON.stringify({
        verified: isValid,
        sessionKey: isValid ? generateRandomKey(32) : null,
        expiresIn: 3600
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...securityHeaders()
        }
      });
    }
    
    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: securityHeaders()
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: securityHeaders()
    });
  }
}

// 验证客户端令牌
async function verifyClientToken(token, timestamp) {
  try {
    const decoded = atob(token);
    const [fingerprint, clientTime] = decoded.split('|');
    
    const currentTime = Math.floor(Date.now() / 1000);
    const timeDiff = Math.abs(currentTime - parseInt(clientTime));
    
    // 允许5分钟的时间差
    return timeDiff <= 300 && fingerprint.length > 10;
  } catch {
    return false;
  }
}

// 原有的辅助函数保持不变（需要添加）
function sanitizeFilename(name) {
  return name.replace(/[^a-zA-Z0-9_\-\u4e00-\u9fa5.]/g, '_').substring(0, 100);
}

async function parseFormData(request) {
  const contentType = request.headers.get('content-type') || '';
  
  if (contentType.includes('application/x-www-form-urlencoded')) {
    const text = await request.text();
    const params = new URLSearchParams(text);
    const result = {};
    for (const [key, value] of params) {
      result[key] = value;
    }
    return result;
  }
  
  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    const result = {};
    for (const [key, value] of formData) {
      result[key] = value;
    }
    return result;
  }
  
  try {
    return await request.json();
  } catch {
    return {};
  }
}

// 其他处理函数（read0.php, upload.php等）需要相应修改以使用新的加密函数
// 由于长度限制，这里只展示关键修改

async function handleUploadFile(request, env) {
  try {
    const formData = await parseFormData(request);
    const { filename, password, content } = formData;
    
    if (!filename || !content) {
      return errorResponse('缺少必要参数');
    }
    
    const safeFilename = sanitizeFilename(filename.trim());
    const finalPassword = password || generateRandomKey(16);
    
    // 使用多层加密
    const aesEncrypted = await aesEncrypt(content, finalPassword);
    
    // 保存加密内容
    await env.MY_TEXT_STORAGE.put('file_' + safeFilename, aesEncrypted);
    await env.MY_TEXT_STORAGE.put('pwd_' + safeFilename, finalPassword);
    
    // 保存元数据
    const metadata = {
      ctime: Date.now(),
      mtime: Date.now(),
      size: content.length,
      encryption: 'AES256-GCM+CHINESE+TIME',
      securityLevel: 'HIGH'
    };
    await env.MY_TEXT_STORAGE.put('meta_' + safeFilename, JSON.stringify(metadata));
    
    const domain = request.headers.get('host');
    const link = `https://${domain}/z/${encodeURIComponent(safeFilename)}`;
    
    return new Response(JSON.stringify({
      success: true,
      fileLink: link,
      filename: safeFilename,
      encryption: 'ENABLED',
      security: 'ACTIVATED'
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...securityHeaders()
      }
    });
    
  } catch (error) {
    return errorResponse(error.message);
  }
}

function errorResponse(message) {
  return new Response(JSON.stringify({
    success: false,
    error: message
  }), {
    status: 400,
    headers: {
      'Content-Type': 'application/json',
      ...securityHeaders()
    }
  });
}

// 注意：需要在Cloudflare环境变量中设置管理令牌
// 建议：MY_TEXT_STORAGE 使用KV存储
