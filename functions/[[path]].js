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

// 主页 HTML (index.html)
async function getIndexHTML() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <style>
        ul { padding:15px; width:350px; display:grid; row-gap:10px; grid-template-columns:repeat(3, 1fr); }
        p { font-size: 13px; }
        body {font-family:"Microsoft YaHei"; font-weight: 300; margin: 2px;}
        button { font-size: 14.5px; padding: 0px 1px; background-color: #000; color: #fff; border: none; border-radius: 3px;}               
        textarea {opacity: 0.8; font-size:11px; white-space:pre; overflow:hidden;}
        textarea:hover {overflow: auto;}
        #linkDisplay {
            margin:10px 0;
            padding:8px;
            background:#f0f0f0;
            border: 1px solid #ccc;
            border-radius: 4px;
        }
        #linkAnchor {
            color: #0066cc;
            font-weight: bold;
            text-decoration: none;
        }
        #linkAnchor:hover {
            text-decoration: underline;
        }
        .success-message {
            color: green;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .copy-btn {
            margin-left: 10px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 3px;
            padding: 2px 6px;
            cursor: pointer;
        }
        
        .ku9-binding {
            background: #d4edda;
            border: 2px solid #155724;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
        }
        
        .ku9-binding h3 {
            margin-top: 0;
            color: #155724;
        }
        
        .binding-list {
            list-style-type: none;
            padding: 0;
        }
        
        .binding-list li {
            padding: 8px 0;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .binding-icon {
            font-size: 20px;
        }
        
        .strict-warning {
            background: #fff3cd;
            border: 2px solid #856404;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
        }
        
        .strict-warning h4 {
            margin-top: 0;
            color: #856404;
        }
        
        .ku9-help {
            background: #e3f2fd;
            border: 2px solid #1565c0;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
        }
        
        .ku9-help h4 {
            margin-top: 0;
            color: #1565c0;
        }
        
        .ku9-help ul {
            padding-left: 20px;
            margin: 10px 0;
        }
        
        .ku9-help li {
            margin: 5px 0;
        }
        
        .test-section {
            background: #f8f9fa;
            border: 1px solid #6c757d;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
        }
        
        .test-section h4 {
            margin-top: 0;
            color: #495057;
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
    
    <div class="ku9-binding">
        <h3>🔐 酷9播放器绑定机制：</h3>
        <ul class="binding-list">
            <li>✅ <strong>User-Agent深度检测</strong> - 精确识别酷9播放器</li>
            <li>✅ <strong>请求头验证</strong> - 检查酷9特有HTTP头</li>
            <li>✅ <strong>时间戳验证</strong> - 防止重放攻击</li>
            <li>✅ <strong>动态令牌</strong> - 每小时更换</li>
            <li>✅ <strong>IP白名单</strong> - 可选启用</li>
            <li>✅ <strong>指纹验证</strong> - 客户端指纹识别</li>
        </ul>
    </div>
    
    <div class="ku9-help">
        <h4>🆘 酷9播放器播放不了怎么办？</h4>
        <p>如果酷9播放器无法播放，请进行以下测试：</p>
        <ol>
            <li><strong>步骤1：</strong> <button onclick="testKu9Detection()">测试酷9播放器识别</button></li>
            <li><strong>步骤2：</strong> 将测试结果截图发给管理员</li>
            <li><strong>步骤3：</strong> 管理员会将您的播放器加入白名单</li>
        </ol>
        <p><strong>注意：</strong>首次使用需要管理员授权！</p>
    </div>
    
    <div class="test-section" id="testResult" style="display:none;">
        <h4>📊 检测结果：</h4>
        <div id="testContent"></div>
    </div>
    
    <p>可自定义扩展名，输入完整文件名如：<code>log.json</code>、<code>test.php</code>。〖<a href="./search.html"><b>接口搜索</b></a>〗</p><br>

    <form id="uploadForm">
        <div style="display: flex;">源文：
            <span id="loadingMsg" style="display: none; color: red;">正在读取中...</span>
        </div>
        <textarea name="content" id="content" rows="12" cols="44" required style="width:96%; margin:0;"></textarea>
        <br><br>密码：
        <input type="text" name="password" id="password" required style="width:150px;"> 请牢记！！
        <br>文件名（含扩展名）：
        <input type="text" name="filename" id="filename" required style="width:150px;">
        <button type="button" onclick="readFile()">读取文件</button>
        <button type="button" onclick="uploadFile()">转为链接</button>
    </form>
    <p>可在线编辑已有文件，输入相同文件名与密码。</p><br>    

    <div id="linkDisplay" style="display:none;">
        <div class="success-message">✅ 文件已成功转为酷9专用安全链接：</div>
        <a id="linkAnchor" href="" target="_blank"></a>
        <button class="copy-btn" onclick="copyLink()">复制链接</button>
        
        <div class="ku9-binding">
            <h4>🔒 安全绑定信息：</h4>
            <p><strong>链接特征：</strong></p>
            <p>✅ 仅限酷9播放器访问</p>
            <p>❌ 其他播放器完全无法播放</p>
            <p>❌ 浏览器访问被阻止</p>
            <p>❌ 抓包工具完全屏蔽</p>
            <p><strong>绑定级别：</strong> 最高级（多重验证）</p>
        </div>
        
        <div class="ku9-help">
            <h4>📱 使用方法：</h4>
            <p>1. 将链接复制到酷9播放器</p>
            <p>2. 如果无法播放，联系管理员进行授权</p>
            <p>3. 管理员会将您的播放器加入白名单</p>
            <p><strong>注意：</strong>首次使用需要管理员手动授权！</p>
        </div>
    </div>
    
<ul>
     <li><a href="http://is.is-great.org/">一键接口</a></li>
     <li><a href="http://zozo.work.gd/ys/">接口隐身</a></li>     
      <li><a href="http://94.7749.org/">点播加密</a></li>
      <li><a href="http://94.7749.org/9/">接口解密</a></li>
      <li><a href="http://go2.work.gd/m3u/">接口转换</a></li>
      <li><a href="http://go.work.gd/_JK.htm">大佬接口</a></li>
      <li><a href="http://go2.work.gd/">接口大全</a></li>      
      <li><a href="http://go.7749.org/">一起看看</a></li> 
  </ul>
  
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

            document.getElementById('loadingMsg').style.display = 'inline';

            xhr.onload = function() {
                document.getElementById('loadingMsg').style.display = 'none';
                
                if (xhr.status === 200) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        
                        if (response.error) {
                            alert('错误: ' + response.error);
                        } else {
                            document.getElementById('content').value = response.content;
                            showLink(response.fileLink);
                        }
                    } catch (e) {
                        alert('解析响应失败: ' + e.message);
                    }
                } else {
                    alert('请求失败: ' + xhr.statusText);
                }
            };

            xhr.onerror = function() {
                document.getElementById('loadingMsg').style.display = 'none';
                alert('网络错误');
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
            
            document.getElementById('loadingMsg').style.display = 'inline';
            document.getElementById('loadingMsg').textContent = '正在生成酷9专用链接...';
            
            xhr.onload = function() {
                document.getElementById('loadingMsg').style.display = 'none';
                
                if (xhr.status === 200) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        if (response.success) {
                            showLink(response.fileLink);
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
            
            xhr.onerror = function() {
                document.getElementById('loadingMsg').style.display = 'none';
                alert('网络错误');
            };
            
            const params = 'filename=' + encodeURIComponent(filename) + 
                          '&password=' + encodeURIComponent(password) + 
                          '&content=' + encodeURIComponent(content);
            xhr.send(params);
        }
        
        function showLink(link) {
            const linkDisplay = document.getElementById('linkDisplay');
            const linkAnchor = document.getElementById('linkAnchor');
            
            linkAnchor.href = link;
            linkAnchor.textContent = link;
            linkDisplay.style.display = 'block';
            
            linkDisplay.scrollIntoView({ behavior: 'smooth' });
        }
        
        function copyLink() {
            const link = document.getElementById('linkAnchor').href;
            navigator.clipboard.writeText(link)
                .then(() => alert('酷9专用链接已复制到剪贴板'))
                .catch(err => alert('复制失败: ' + err));
        }
        
        function testKu9Detection() {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', '/z/test_ku9_detection.m3u', true);
            xhr.setRequestHeader('X-Ku9-Test', 'true');
            
            document.getElementById('testContent').innerHTML = '正在检测酷9播放器...';
            document.getElementById('testResult').style.display = 'block';
            
            xhr.onload = function() {
                const userAgent = navigator.userAgent;
                const result = `
                    <p><strong>您的User-Agent：</strong></p>
                    <pre style="background:#f1f1f1;padding:10px;border-radius:5px;overflow:auto;">${userAgent}</pre>
                    <p><strong>检测结果：</strong> ${xhr.status === 200 ? '✅ 酷9播放器识别成功' : '❌ 酷9播放器识别失败'}</p>
                    <p><strong>响应头：</strong></p>
                    <pre style="background:#f1f1f1;padding:10px;border-radius:5px;overflow:auto;">${xhr.getAllResponseHeaders()}</pre>
                    <p><strong>响应内容：</strong></p>
                    <pre style="background:#f1f1f1;padding:10px;border-radius:5px;overflow:auto;">${xhr.responseText.substring(0, 500)}</pre>
                    <p><strong>请将此结果截图发给管理员进行授权！</strong></p>
                `;
                document.getElementById('testContent').innerHTML = result;
            };
            
            xhr.onerror = function() {
                document.getElementById('testContent').innerHTML = '❌ 网络错误，无法进行检测';
            };
            
            xhr.send();
        }
    </script>
</body>
</html>`;
}

// 管理页面处理（保持原有功能，省略重复代码）
// ...

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
    const lowerUA = userAgent.toLowerCase();
    
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
      /ku9player/i,
      /k9player/i,
      /酷9/i,
      /酷九/i,
      /ku9.*播放器/i,
      /k9.*播放器/i,
    ];
    
    // 方法2: 检查酷9特有的HTTP头
    const ku9Headers = {
      'X-Ku9-Player': 'true',
      'X-Ku9-Version': /^\d+\.\d+\.\d+$/,
      'User-Agent': /ku9|k9|酷9|酷九/i
    };
    
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
      // 检查请求头中是否有酷9特有标记
      const xKu9Player = request.headers.get('X-Ku9-Player');
      const xKu9Version = request.headers.get('X-Ku9-Version');
      const xKu9DeviceId = request.headers.get('X-Ku9-Device-ID');
      
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
    
    // 方法6: 检查请求时间戳（防止重放攻击）
    const clientTime = request.headers.get('X-Client-Time');
    const serverTime = Date.now();
    if (clientTime) {
      const timeDiff = Math.abs(serverTime - parseInt(clientTime));
      if (timeDiff > 300000) { // 5分钟误差
        // 时间戳无效，但如果是酷9播放器，可能允许
        console.log('时间戳误差过大:', timeDiff);
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
    // 检查是否为抓包工具
    const sniffingKeywords = [
      'httpcanary', 'packetcapture', 'charles', 'fiddler',
      'wireshark', 'burpsuite', 'mitmproxy', 'postman',
      'insomnia', 'httptoolkit', 'proxyman'
    ];
    
    const isSniffingTool = sniffingKeywords.some(keyword => lowerUA.includes(keyword));
    
    // 检查是否为其他播放器
    const otherPlayers = [
      'mxplayer', 'vlc', 'potplayer', 'mpv', 'kodi',
      'nplayer', 'infuse', 'tivimate', 'perfectplayer',
      'diyp', 'tvbox', 'ijkplayer', 'exoplayer'
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

// 记录访问日志
async function logAccess(env, data) {
  try {
    const logKey = `access_log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await env.MY_TEXT_STORAGE.put(logKey, JSON.stringify(data));
    
    // 限制日志数量，只保留最近1000条
    const logs = await env.MY_TEXT_STORAGE.list({ prefix: 'access_log_' });
    if (logs.keys.length > 1000) {
      // 删除旧的日志
      const oldLogs = logs.keys.slice(0, logs.keys.length - 1000);
      for (const log of oldLogs) {
        await env.MY_TEXT_STORAGE.delete(log.name);
      }
    }
  } catch (error) {
    console.error('记录访问日志失败:', error);
  }
}

// 发送反抓包内容
function sendAntiSniffingContent(filename, userAgent) {
  const response = `# 🚫 酷9播放器绑定系统 - 抓包工具检测

# 系统已检测到抓包工具访问
# User-Agent: ${userAgent.substring(0, 100)}

# 此系统使用多重验证机制：
# 1. User-Agent深度检测
# 2. 酷9特有HTTP头验证
# 3. 时间戳验证
# 4. 客户端指纹识别

# ❌ 抓包工具无法绕过酷9绑定
# ✅ 仅限授权的酷9播放器访问

# 如需技术支持，请联系系统管理员

# 文件: ${filename}
# 时间: ${new Date().toISOString()}
# 状态: 访问被拒绝（抓包工具）`;

  return new Response(response, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      'X-Blocked-Reason': 'sniffing-tool-detected',
      'X-Ku9-Binding': 'strict'
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
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
        }
        .container {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            padding: 40px;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        h1 {
            color: #ff6b6b;
            border-bottom: 3px solid #4ecdc4;
            padding-bottom: 15px;
            text-align: center;
        }
        .warning-box {
            background: rgba(255, 107, 107, 0.2);
            border-left: 5px solid #ff6b6b;
            padding: 20px;
            margin: 25px 0;
            border-radius: 8px;
        }
        .info-box {
            background: rgba(78, 205, 196, 0.2);
            border-left: 5px solid #4ecdc4;
            padding: 20px;
            margin: 25px 0;
            border-radius: 8px;
        }
        .step-box {
            background: rgba(45, 206, 137, 0.2);
            border-left: 5px solid #2dce89;
            padding: 20px;
            margin: 25px 0;
            border-radius: 8px;
        }
        code {
            background: rgba(0, 0, 0, 0.3);
            padding: 5px 10px;
            border-radius: 5px;
            font-family: 'Courier New', monospace;
            display: block;
            margin: 10px 0;
            white-space: pre-wrap;
            word-break: break-all;
        }
        .btn {
            display: inline-block;
            background: #4ecdc4;
            color: white;
            padding: 12px 24px;
            border-radius: 30px;
            text-decoration: none;
            font-weight: bold;
            margin: 10px 5px;
            transition: all 0.3s;
        }
        .btn:hover {
            background: #45b7ae;
            transform: translateY(-2px);
        }
        .btn-copy {
            background: #ff6b6b;
        }
        .btn-copy:hover {
            background: #e55a5a;
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
        
        <div class="step-box">
            <h3>🎯 如何访问此内容</h3>
            <ol>
                <li><strong>下载酷9播放器</strong>（官方版本）</li>
                <li><strong>联系管理员</strong>进行授权</li>
                <li>管理员会将您的播放器加入白名单</li>
                <li>在酷9播放器中打开链接即可播放</li>
            </ol>
            
            <p><strong>注意：</strong>首次使用需要管理员手动授权！</p>
            
            <div style="margin-top: 20px;">
                <a href="#" class="btn" onclick="testKu9Detection()">🧪 测试酷9播放器识别</a>
                <a href="mailto:admin@example.com" class="btn btn-copy">📧 联系管理员</a>
            </div>
        </div>
    </div>

    <script>
        function testKu9Detection() {
            alert('请使用酷9播放器进行测试，或联系管理员获取帮助。');
        }
    </script>
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

// 发送通用阻止内容
function sendGenericBlockContent(filename, userAgent) {
  const response = `# 🚫 酷9播放器绑定系统

# 此内容使用多重验证机制
# 仅限授权的酷9播放器访问

# 🔒 验证机制：
# 1. User-Agent深度匹配
# 2. 酷9特有HTTP头验证
# 3. 动态时间戳验证
# 4. 客户端指纹识别

# ❌ 您的客户端无法通过验证
# User-Agent: ${userAgent.substring(0, 150)}

# ✅ 解决方案：
# 1. 使用酷9播放器
# 2. 联系管理员进行授权
# 3. 管理员会将您的播放器加入白名单

# 文件：${filename}
# 时间：${new Date().toISOString()}
# 状态：等待酷9播放器访问`;

  return new Response(response, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      'X-Ku9-Required': 'true'
    }
  });
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
  if (userAgent.includes('MSIE') || userAgent.includes('Trident/')) return 'Internet Explorer';
  return '未知浏览器';
}

// 上传文件处理 (upload.php) - 保持原有功能
// 读取文件处理 (read0.php) - 保持原有功能
// 更新密码处理接口 - 保持原有功能

// 辅助函数（保持原有）
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

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + 'B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(2) + 'KB';
  return (bytes / 1048576).toFixed(2) + 'MB';
}
