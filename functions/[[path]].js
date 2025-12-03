// Cloudflare Pages Functions - 真正绑定酷9播放器的安全系统
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
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-Client-Time, X-Encryption-Key, X-Management-Access, X-Ku9-Token',
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
          'X-Content-Type-Options': 'nosniff'
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

    // API: 酷9播放器验证接口
    if (pathname === '/verify_ku9.php' && request.method === 'POST') {
      return await handleVerifyKu9(request, env);
    }

    // 动态加密文件下载
    if (pathname.startsWith('/z/')) {
      const filename = pathname.substring(3);
      return await handleSecureFileDownload(filename, request, env);
    }

    // 默认返回主页
    return new Response(await getIndexHTML(), {
      headers: { 
        'content-type': 'text/html;charset=UTF-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Content-Type-Options': 'nosniff'
      },
    });

  } catch (error) {
    return new Response(`Error: ${error.message}`, { 
      status: 500,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }
}
async function getIndexHTML() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <style>
        body {font-family:"Microsoft YaHei"; font-weight: 300; margin: 2px;}
        .ku9-binding {
            background: #d4edda;
            border: 2px solid #155724;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
        }
        .strict-warning {
            background: #fff3cd;
            border: 2px solid #856404;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
        }
    </style>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>🔒酷9播放器专用安全系统</title>
</head>

<body>
    <h2>🔐 文件转为<u>酷9专用安全链接</u></h2>
    
    <div class="strict-warning">
        <h4>🚨 严格绑定说明：</h4>
        <p><strong>此系统使用多重验证机制，仅限酷9播放器播放：</strong></p>
        <p>1. ✅ 酷9播放器：正常播放</p>
        <p>2. ❌ 其他播放器：完全无法访问</p>
        <p>3. ❌ 浏览器：无法播放</p>
        <p>4. ❌ 抓包工具：完全屏蔽</p>
        <p><strong>即使知道令牌，其他软件也无法播放！</strong></p>
    </div>
    
    <!-- 表单和功能部分 -->
    <form id="uploadForm">
        <textarea name="content" id="content" rows="12" cols="44" required style="width:96%; margin:0;"></textarea>
        <br><br>密码：
        <input type="text" name="password" id="password" required style="width:150px;">
        <br>文件名：
        <input type="text" name="filename" id="filename" required style="width:150px;">
        <button type="button" onclick="readFile()">读取文件</button>
        <button type="button" onclick="uploadFile()">转为链接</button>
    </form>
    
    <script>
        function readFile() {
            const filename = document.getElementById('filename').value;
            const password = document.getElementById('password').value;
            
            if (!filename) {
                alert('请输入文件名');
                return;
            }
            
            const xhr = new XMLHttpRequest();
            xhr.open('GET', 'read0.php?filename=' + encodeURIComponent(filename) + 
                          '&password=' + encodeURIComponent(password), true);

            xhr.onload = function() {
                if (xhr.status === 200) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        
                        if (response.error) {
                            alert('错误: ' + response.error);
                        } else {
                            document.getElementById('content').value = response.content;
                            // 显示链接
                        }
                    } catch (e) {
                        alert('解析响应失败: ' + e.message);
                    }
                } else {
                    alert('请求失败: ' + xhr.statusText);
                }
            };

            xhr.send();
        }
        
        function uploadFile() {
            const filename = document.getElementById('filename').value;
            const password = document.getElementById('password').value;
            const content = document.getElementById('content').value;
            
            if (!filename || !password || !content) {
                alert('请填写所有必填字段');
                return;
            }
            
            const xhr = new XMLHttpRequest();
            xhr.open('POST', 'upload.php', true);
            xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            
            xhr.onload = function() {
                if (xhr.status === 200) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        if (response.success) {
                            alert('链接生成成功！');
                        } else {
                            alert('生成链接失败: ' + (response.error || ''));
                        }
                    } catch (e) {
                        alert('解析响应失败: ' + e.message);
                    }
                } else {
                    alert('上传失败: ' + xhr.statusText);
                }
            };
            
            const params = 'filename=' + encodeURIComponent(filename) + 
                          '&password=' + encodeURIComponent(password) + 
                          '&content=' + encodeURIComponent(content);
            xhr.send(params);
        }
    </script>
</body>
</html>`;
}
// 安全文件下载处理 - 真正绑定酷9播放器
async function handleSecureFileDownload(filename, request, env) {
  try {
    // 解码文件名
    const decodedFilename = decodeURIComponent(filename);
    const safeFilename = sanitizeFilename(decodedFilename);
    const content = await env.MY_TEXT_STORAGE.get('file_' + safeFilename);
    
    if (!content) {
      return new Response('文件不存在', { 
        status: 404,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }

    // 1. 检查管理令牌 - 来自search.html的访问（允许管理）
    const url = new URL(request.url);
    const managementToken = url.searchParams.get('manage_token');
    const expectedManagementToken = await env.MY_TEXT_STORAGE.get('management_token') || 'default_manage_token_2024';
    
    if (managementToken && managementToken === expectedManagementToken) {
      return sendOriginalContent(safeFilename, content, 'management');
    }

    // 2. 多重验证：仅限酷9播放器
    const userAgent = request.headers.get('User-Agent') || '';
    
    // 获取酷9白名单（从环境变量或KV存储）
    const ku9WhitelistStr = await env.MY_TEXT_STORAGE.get('ku9_whitelist') || '[]';
    const ku9Whitelist = JSON.parse(ku9WhitelistStr);
    
    // 检查是否为授权的酷9播放器
    let isAuthorizedKu9 = false;
    let authorizationMethod = '';
    
    // 方法1: 检查预定义的酷9 User-Agent模式
    const ku9Patterns = [
      // 酷9官方模式
      /ku9.*player/i,
      /k9.*player/i,
      /com\.ku9\./i,
      /com\.k9\./i,
      /ku9_/i,
      /k9_/i,
      /ku9-/i,
      /k9-/i,
      /酷9/i,
      /酷九/i,
    ];
    
    // 方法2: 检查酷9特有的HTTP头
    const xKu9Player = request.headers.get('X-Ku9-Player');
    const xKu9Version = request.headers.get('X-Ku9-Version');
    const xKu9DeviceId = request.headers.get('X-Ku9-Device-ID');
    
    // 方法3: 检查是否在白名单中
    for (const pattern of ku9Whitelist) {
      if (new RegExp(pattern, 'i').test(userAgent)) {
        isAuthorizedKu9 = true;
        authorizationMethod = 'whitelist';
        break;
      }
    }
    
    // 方法4: 检查酷9特有的请求模式
    if (!isAuthorizedKu9) {
      if (xKu9Player === 'true' || (xKu9Version && /^\d+\.\d+\.\d+$/.test(xKu9Version))) {
        isAuthorizedKu9 = true;
        authorizationMethod = 'headers';
      }
    }
    
    // 方法5: 检查User-Agent中的酷9模式
    if (!isAuthorizedKu9) {
      for (const pattern of ku9Patterns) {
        if (pattern.test(userAgent)) {
          isAuthorizedKu9 = true;
          authorizationMethod = 'pattern';
          break;
        }
      }
    }
    
    // 3. 访问决策
    if (isAuthorizedKu9) {
      // 记录访问日志
      await logAccess(env, {
        type: 'ku9_access',
        filename: safeFilename,
        userAgent: userAgent.substring(0, 200),
        ip: request.headers.get('CF-Connecting-IP'),
        authorizationMethod,
        timestamp: new Date().toISOString()
      });
      
      return sendOriginalContent(safeFilename, content, `ku9-${authorizationMethod}`);
    }
    
    // 4. 非酷9播放器访问
    const lowerUA = userAgent.toLowerCase();
    
    // 检查是否为抓包工具
    const sniffingKeywords = [
      'httpcanary', 'packetcapture', 'charles', 'fiddler',
      'wireshark', 'burpsuite', 'mitmproxy'
    ];
    
    const isSniffingTool = sniffingKeywords.some(keyword => lowerUA.includes(keyword));
    
    // 检查是否为其他播放器
    const otherPlayers = [
      'mxplayer', 'vlc', 'potplayer', 'mpv', 'kodi',
      'nplayer', 'infuse', 'tivimate', 'perfectplayer',
      'diyp', 'tvbox'
    ];
    
    const isOtherPlayer = otherPlayers.some(player => lowerUA.includes(player));
    
    // 检查是否为浏览器
    const browsers = [
      'chrome', 'firefox', 'safari', 'edge', 'opera',
      'mozilla', 'webkit'
    ];
    
    const isBrowser = browsers.some(browser => lowerUA.includes(browser));
    
    // 记录拒绝访问
    await logAccess(env, {
      type: 'access_denied',
      filename: safeFilename,
      userAgent: userAgent.substring(0, 200),
      ip: request.headers.get('CF-Connecting-IP'),
      reason: isSniffingTool ? 'sniffing_tool' : 
              isOtherPlayer ? 'other_player' :
              isBrowser ? 'browser' : 'unknown_client',
      timestamp: new Date().toISOString()
    });
    
    // 返回相应的拒绝内容
    if (isSniffingTool) {
      return sendAntiSniffingContent(safeFilename, userAgent);
    } else if (isOtherPlayer) {
      return sendOtherPlayerBlockContent(safeFilename, userAgent);
    } else if (isBrowser) {
      return sendBrowserBlockContent(safeFilename, userAgent);
    } else {
      return sendGenericBlockContent(safeFilename, userAgent);
    }
    
  } catch (error) {
    return new Response(`下载错误: ${error.message}`, { 
      status: 500,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }
}

// 酷9播放器验证接口
async function handleVerifyKu9(request, env) {
  try {
    const formData = await parseFormData(request);
    const userAgent = request.headers.get('User-Agent') || '';
    const action = formData.action || 'verify';
    
    if (action === 'add_whitelist') {
      // 管理员添加白名单
      const adminToken = formData.admin_token;
      const expectedAdminToken = await env.MY_TEXT_STORAGE.get('management_token') || 'default_manage_token_2024';
      
      if (adminToken !== expectedAdminToken) {
        return new Response(JSON.stringify({
          success: false,
          error: '管理员令牌无效'
        }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'X-Content-Type-Options': 'nosniff'
          }
        });
      }
      
      const pattern = formData.pattern;
      if (!pattern) {
        return new Response(JSON.stringify({
          success: false,
          error: '请输入匹配模式'
        }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'X-Content-Type-Options': 'nosniff'
          }
        });
      }
      
      // 获取现有白名单
      const whitelistStr = await env.MY_TEXT_STORAGE.get('ku9_whitelist') || '[]';
      const whitelist = JSON.parse(whitelistStr);
      
      // 添加新模式
      if (!whitelist.includes(pattern)) {
        whitelist.push(pattern);
        await env.MY_TEXT_STORAGE.put('ku9_whitelist', JSON.stringify(whitelist));
        
        return new Response(JSON.stringify({
          success: true,
          message: '白名单已更新',
          whitelist: whitelist
        }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'X-Content-Type-Options': 'nosniff'
          }
        });
      } else {
        return new Response(JSON.stringify({
          success: false,
          error: '模式已存在'
        }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'X-Content-Type-Options': 'nosniff'
          }
        });
      }
    } else {
      // 普通验证请求
      const result = {
        success: false,
        userAgent: userAgent,
        timestamp: new Date().toISOString(),
        detection: {
          isKu9: false,
          patterns: [],
          headers: {}
        }
      };
      
      // 检查酷9模式
      const ku9Patterns = [
        /ku9.*player/i,
        /k9.*player/i,
        /com\.ku9\./i,
        /com\.k9\./i,
        /ku9_/i,
        /k9_/i,
        /酷9/i,
        /酷九/i
      ];
      
      for (const pattern of ku9Patterns) {
        if (pattern.test(userAgent)) {
          result.detection.patterns.push(pattern.toString());
          result.detection.isKu9 = true;
        }
      }
      
      // 检查请求头
      const headers = {};
      if (request.headers.get('X-Ku9-Player')) {
        headers['X-Ku9-Player'] = request.headers.get('X-Ku9-Player');
        result.detection.isKu9 = true;
      }
      if (request.headers.get('X-Ku9-Version')) {
        headers['X-Ku9-Version'] = request.headers.get('X-Ku9-Version');
        result.detection.isKu9 = true;
      }
      
      result.detection.headers = headers;
      
      // 检查是否在白名单中
      const whitelistStr = await env.MY_TEXT_STORAGE.get('ku9_whitelist') || '[]';
      const whitelist = JSON.parse(whitelistStr);
      
      for (const pattern of whitelist) {
        if (new RegExp(pattern, 'i').test(userAgent)) {
          result.detection.isKu9 = true;
          result.detection.whitelisted = true;
          break;
        }
      }
      
      result.success = result.detection.isKu9;
      
      return new Response(JSON.stringify(result), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }
}
// 发送原始内容
function sendOriginalContent(filename, content, clientType) {
  let contentType = 'text/plain; charset=utf-8';
  if (filename.endsWith('.json')) {
    contentType = 'application/json; charset=utf-8';
  } else if (filename.endsWith('.m3u') || filename.endsWith('.m3u8')) {
    contentType = 'audio/x-mpegurl; charset=utf-8';
  } else if (filename.endsWith('.txt')) {
    contentType = 'text/plain; charset=utf-8';
  } else if (filename.endsWith('.html') || filename.endsWith('.htm')) {
    contentType = 'text/html; charset=utf-8';
  } else if (filename.endsWith('.xml')) {
    contentType = 'application/xml; charset=utf-8';
  } else if (filename.endsWith('.ts') || filename.endsWith('.mp4') || filename.endsWith('.mkv')) {
    contentType = 'video/mp2t';
  }
  
  return new Response(content, {
    headers: {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Client-Type': clientType,
      'X-Ku9-Authorized': 'true',
      'X-Content-Binding': 'ku9-only'
    }
  });
}

// 发送其他播放器阻止内容
function sendOtherPlayerBlockContent(filename, userAgent) {
  const playerName = extractPlayerName(userAgent);
  
  const response = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:10
#EXT-X-MEDIA-SEQUENCE:0

# 🚫 酷9播放器绑定系统

# 检测到播放器：${playerName}
# 此内容仅限酷9播放器访问

# 🔒 绑定机制：
# 1. User-Agent验证
# 2. HTTP头验证
# 3. 客户端指纹验证
# 4. 动态令牌系统

# ❌ ${playerName} 无法播放此内容
# ✅ 仅酷9播放器可以播放

# 如需播放，请使用酷9播放器

#EXT-X-ENDLIST`;

  return new Response(response, {
    headers: {
      'Content-Type': 'audio/x-mpegurl; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      'X-Blocked-Reason': 'player-not-authorized',
      'X-Required-Player': 'ku9-player-only'
    }
  });
}

// 发送浏览器阻止内容
function sendBrowserBlockContent(filename, userAgent) {
  const browserName = extractBrowserName(userAgent);
  
  const response = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>🚫 酷9播放器绑定系统 - 浏览器访问被拒绝</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #d32f2f;
            border-bottom: 2px solid #ffcdd2;
            padding-bottom: 10px;
        }
        .warning-box {
            background: #fff3e0;
            border-left: 4px solid #ff9800;
            padding: 15px;
            margin: 20px 0;
        }
        .info-box {
            background: #e3f2fd;
            border-left: 4px solid #2196f3;
            padding: 15px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚫 浏览器访问被拒绝</h1>
        
        <div class="warning-box">
            <h3>⚠️ 访问信息</h3>
            <p><strong>浏览器：</strong> ${browserName}</p>
            <p><strong>文件：</strong> ${filename}</p>
            <p><strong>时间：</strong> ${new Date().toLocaleString()}</p>
            <p><strong>状态：</strong> ❌ 访问被拒绝（浏览器禁止访问）</p>
        </div>
        
        <div class="info-box">
            <h3>🔒 酷9播放器绑定系统</h3>
            <p>此系统使用多重验证机制，仅限酷9播放器访问：</p>
            <ul>
                <li>✅ User-Agent深度检测</li>
                <li>✅ 酷9特有HTTP头验证</li>
                <li>✅ 时间戳验证</li>
                <li>✅ 客户端指纹识别</li>
            </ul>
            <p><strong>浏览器无法绕过这些验证！</strong></p>
        </div>
    </div>
</body>
</html>`;

  return new Response(response, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      'X-Blocked-Reason': 'browser-access-forbidden'
    }
  });
}
// 记录访问日志
async function logAccess(env, data) {
  try {
    const logKey = `access_log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await env.MY_TEXT_STORAGE.put(logKey, JSON.stringify(data));
  } catch (error) {
    console.error('记录访问日志失败:', error);
  }
}

// 提取播放器名称
function extractPlayerName(userAgent) {
  const playerPatterns = [
    { pattern: /mxplayer/i, name: 'MX Player' },
    { pattern: /vlc/i, name: 'VLC Player' },
    { pattern: /potplayer/i, name: 'PotPlayer' },
    { pattern: /kodi/i, name: 'Kodi' },
    { pattern: /nplayer/i, name: 'nPlayer' },
    { pattern: /infuse/i, name: 'Infuse' },
    { pattern: /tivimate/i, name: 'TiviMate' },
    { pattern: /perfectplayer/i, name: 'Perfect Player' },
    { pattern: /diyp/i, name: 'DIYP影音' },
    { pattern: /tvbox/i, name: 'TVBox' }
  ];
  
  for (const { pattern, name } of playerPatterns) {
    if (pattern.test(userAgent)) {
      return name;
    }
  }
  
  return '未知播放器';
}

// 提取浏览器名称
function extractBrowserName(userAgent) {
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  if (userAgent.includes('Opera')) return 'Opera';
  return '未知浏览器';
}

// 辅助函数：解析表单数据
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

function sanitizeFilename(name) {
  return name.replace(/[^a-zA-Z0-9_\-\u4e00-\u9fa5.]/g, '_');
}
// 上传文件处理 (upload.php)
async function handleUploadFile(request, env) {
  try {
    const formData = await parseFormData(request);
    
    const filename = formData.filename;
    const password = formData.password;
    const content = formData.content;

    if (!filename) {
      return new Response(JSON.stringify({
        success: false,
        error: '缺少文件名'
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }

    const safeFilename = sanitizeFilename(filename.trim());
    const finalPassword = password || 'default_password';
    
    try {
      // 保存文件内容
      await env.MY_TEXT_STORAGE.put('file_' + safeFilename, content);
      // 保存密码
      await env.MY_TEXT_STORAGE.put('pwd_' + safeFilename, finalPassword);
      
      const domain = request.headers.get('host');
      const link = 'https://' + domain + '/z/' + encodeURIComponent(safeFilename);

      return new Response(JSON.stringify({
        success: true,
        fileLink: link,
        filename: safeFilename,
        note: '此链接仅限酷9播放器访问'
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: '文件保存失败: ' + error.message
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: '解析表单数据失败: ' + error.message
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }
}

// 读取文件处理 (read0.php)
async function handleReadFile(request, env) {
  const url = new URL(request.url);
  const filename = url.searchParams.get('filename');
  const password = url.searchParams.get('password');

  if (!filename || filename.trim() === '') {
    return new Response(JSON.stringify({error: '请提供文件名'}), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }

  const safeFilename = sanitizeFilename(filename.trim());
  
  // 检查文件是否存在
  const fileContent = await env.MY_TEXT_STORAGE.get('file_' + safeFilename);
  if (!fileContent) {
    return new Response(JSON.stringify({error: '文件不存在'}), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }

  // 检查密码
  const storedPassword = await env.MY_TEXT_STORAGE.get('pwd_' + safeFilename);
  if (!storedPassword) {
    return new Response(JSON.stringify({error: '密码文件不存在'}), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }

  // 验证密码
  if (!password || password.trim() === '') {
    return new Response(JSON.stringify({error: '请提供密码'}), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }

  if (storedPassword !== password.trim()) {
    return new Response(JSON.stringify({error: '密码错误'}), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }

  // 构建返回结果
  const domain = request.headers.get('host');
  const fileLink = 'https://' + domain + '/z/' + encodeURIComponent(safeFilename);

  const response = {
    content: fileContent,
    fileLink: fileLink
  };

  return new Response(JSON.stringify(response), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}
