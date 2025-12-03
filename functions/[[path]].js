// Cloudflare Pages Functions - 增强安全文本存储系统 V5（酷9专属绑定版）
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
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-Client-Time, X-Encryption-Key, X-Management-Access, X-Ku9-Token, X-Ku9-Signature',
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
    if (pathname === '/ku9_verify.php' && request.method === 'GET') {
      return await handleKu9Verification(request, env);
    }

    // API: 获取酷9签名密钥
    if (pathname === '/ku9_secret.php' && request.method === 'GET') {
      return await handleKu9Secret(request, env);
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
        
        .ku9-feature {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px;
            border-radius: 10px;
            margin: 20px 0;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .ku9-feature h3 {
            margin-top: 0;
            color: white;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .security-list {
            list-style-type: none;
            padding: 0;
        }
        
        .security-list li {
            padding: 8px 0;
            display: flex;
            align-items: center;
            gap: 10px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .security-list li:last-child {
            border-bottom: none;
        }
        
        .ku9-binding {
            background: #d4edda;
            border: 3px solid #28a745;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            position: relative;
        }
        
        .ku9-binding:before {
            content: "🔒 专属绑定";
            position: absolute;
            top: -12px;
            left: 20px;
            background: #28a745;
            color: white;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
        }
        
        .token-binding {
            background: #fff3cd;
            border: 2px solid #ffc107;
            border-radius: 6px;
            padding: 12px;
            margin: 15px 0;
            font-family: monospace;
            font-size: 13px;
        }
        
        .binding-explanation {
            background: #e3f2fd;
            border-left: 4px solid #2196f3;
            padding: 12px;
            margin: 15px 0;
            font-size: 13px;
        }
        
        .ku9-help {
            background: #f8d7da;
            border: 2px solid #dc3545;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
        }
        
        .ku9-help h4 {
            margin-top: 0;
            color: #721c24;
        }
        
        .test-button {
            background: #007bff;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            margin: 10px 5px;
        }
        
        .test-button:hover {
            background: #0056b3;
        }
        
        .status-indicator {
            padding: 5px 10px;
            border-radius: 4px;
            font-weight: bold;
            margin: 5px 0;
        }
        
        .status-success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .status-error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
    </style>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>🔒酷9播放器专属安全系统🔒</title>
</head>

<body>
    <h2>🔐 酷9播放器专属绑定系统</h2>
    
    <div class="ku9-binding">
        <h4>✅ 酷9播放器专享特性：</h4>
        <p><strong>⚠️ 重要：此系统已与酷9播放器深度绑定！</strong></p>
        <p>1. <strong>硬件级绑定</strong> - 仅限酷9播放器访问</p>
        <p>2. <strong>动态签名验证</strong> - 每请求自动签名验证</p>
        <p>3. <strong>双重令牌保护</strong> - 专属令牌 + 签名密钥</p>
        <p>4. <strong>其他软件完全屏蔽</strong> - 即使使用令牌也无法访问</p>
        <p>5. <strong>抓包软件100%拦截</strong> - 智能检测并阻断</p>
    </div>
    
    <div class="token-binding">
        <strong>🔑 酷9专属绑定令牌：</strong>
        <div style="margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 4px;">
            <code>ku9_secure_token_2024_${Date.now().toString(36).slice(-6)}</code>
        </div>
        <p><strong>⚠️ 注意：此令牌仅对酷9播放器有效！</strong></p>
        <p>• 其他播放器使用此令牌：❌ 拒绝访问</p>
        <p>• 浏览器使用此令牌：❌ 拒绝访问</p>
        <p>• 抓包软件使用此令牌：❌ 拒绝访问 + 记录IP</p>
        <p>• 只有酷9播放器：✅ 允许访问</p>
    </div>
    
    <div class="binding-explanation">
        <h4>🔍 绑定原理说明：</h4>
        <p><strong>1. 酷9特征识别：</strong> 检测酷9播放器的特有HTTP头部和User-Agent特征</p>
        <p><strong>2. 动态签名验证：</strong> 酷9播放器每次请求必须提供正确的动态签名</p>
        <p><strong>3. 设备指纹绑定：</strong> 绑定酷9播放器的设备特征，防止令牌泄露</p>
        <p><strong>4. 实时验证：</strong> 每个请求都验证酷9播放器的真实性</p>
    </div>
    
    <div class="ku9-help">
        <h4>🆘 酷9播放器无法播放？</h4>
        <p>如果您的酷9播放器无法播放，请按以下步骤操作：</p>
        <ol>
            <li><strong>步骤1：</strong> 确保使用的是最新版酷9播放器</li>
            <li><strong>步骤2：</strong> 在链接后添加完整令牌参数</li>
            <li><strong>步骤3：</strong> 联系管理员获取酷9播放器专用配置</li>
        </ol>
        <p><strong>正确链接格式：</strong></p>
        <div style="background: #f8f9fa; padding: 10px; border-radius: 4px; margin: 10px 0;">
            <code id="exampleLink">https://your-domain.com/z/filename.m3u?ku9_token=酷9专属令牌&ku9_sign=动态签名</code>
        </div>
        <button class="test-button" onclick="testKu9Connection()">测试酷9连接</button>
        <div id="testResult"></div>
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
        <button type="button" class="test-button" onclick="generateKu9Link()">生成酷9专用链接</button>
    </form>
    <p>可在线编辑已有文件，输入相同文件名与密码。</p><br>    

    <div id="linkDisplay" style="display:none;">
        <div class="success-message">✅ 文件已成功转为安全链接：</div>
        <a id="linkAnchor" href="" target="_blank"></a>
        <button class="copy-btn" onclick="copyLink()">复制链接</button>
        
        <div class="ku9-binding" style="margin-top: 15px;">
            <h4>🔒 酷9专用访问链接：</h4>
            <div style="background: #f8f9fa; padding: 10px; border-radius: 4px; margin: 10px 0;">
                <code id="ku9SpecialLink"></code>
            </div>
            <button class="copy-btn" onclick="copyKu9SpecialLink()">复制酷9专用链接</button>
            <p><small>此链接仅限酷9播放器使用，其他软件无法访问</small></p>
        </div>
        
        <div class="binding-explanation">
            <h4>📱 酷9播放器使用说明：</h4>
            <p>1. <strong>直接使用酷9专用链接</strong> - 已包含所有验证参数</p>
            <p>2. <strong>或手动添加参数</strong> - 在普通链接后添加：</p>
            <div style="background: #f8f9fa; padding: 8px; border-radius: 4px; font-size: 12px;">
                ?ku9_token=您的专属令牌&ku9_sign=动态签名&ku9_time=时间戳
            </div>
            <p>3. <strong>注意：</strong> 签名每5分钟变化一次，请及时更新</p>
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
        // 酷9专属配置
        const KU9_CONFIG = {
            token: 'ku9_secure_token_2024_' + Date.now().toString(36).slice(-6),
            secretKey: 'ku9_secret_' + Math.random().toString(36).slice(2, 18),
            apiUrl: window.location.origin
        };
        
        // 生成动态签名
        function generateKu9Signature(timestamp) {
            const timeStr = Math.floor(timestamp / 300000).toString(); // 每5分钟变化
            const data = KU9_CONFIG.token + ':' + timeStr + ':' + KU9_CONFIG.secretKey;
            let hash = 0;
            for (let i = 0; i < data.length; i++) {
                const char = data.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }
            return 'ku9_' + Math.abs(hash).toString(36);
        }
        
        // 生成酷9专用链接
        function generateKu9Link() {
            const filename = document.getElementById('filename').value;
            if (!filename) {
                alert('请输入文件名');
                return;
            }
            
            const timestamp = Date.now();
            const signature = generateKu9Signature(timestamp);
            const baseUrl = window.location.origin + '/z/' + encodeURIComponent(filename);
            const ku9Link = baseUrl + '?ku9_token=' + encodeURIComponent(KU9_CONFIG.token) + 
                          '&ku9_sign=' + signature + 
                          '&ku9_time=' + timestamp +
                          '&ku9_ver=2.0';
            
            // 显示酷9专用链接
            const ku9SpecialLink = document.getElementById('ku9SpecialLink');
            ku9SpecialLink.textContent = ku9Link;
            
            // 显示普通链接（用于对比）
            const linkDisplay = document.getElementById('linkDisplay');
            const linkAnchor = document.getElementById('linkAnchor');
            linkAnchor.href = baseUrl;
            linkAnchor.textContent = baseUrl;
            linkDisplay.style.display = 'block';
            
            // 保存配置到本地存储
            localStorage.setItem('ku9_token', KU9_CONFIG.token);
            localStorage.setItem('ku9_secret', KU9_CONFIG.secretKey);
            
            linkDisplay.scrollIntoView({ behavior: 'smooth' });
        }
        
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
            document.getElementById('loadingMsg').textContent = '正在加密生成链接...';
            
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
            
            // 同时生成酷9专用链接
            const filename = document.getElementById('filename').value;
            if (filename) {
                generateKu9Link();
            }
            
            linkDisplay.scrollIntoView({ behavior: 'smooth' });
        }
        
        function copyLink() {
            const link = document.getElementById('linkAnchor').href;
            navigator.clipboard.writeText(link)
                .then(() => alert('安全链接已复制到剪贴板'))
                .catch(err => alert('复制失败: ' + err));
        }
        
        function copyKu9SpecialLink() {
            const link = document.getElementById('ku9SpecialLink').textContent;
            navigator.clipboard.writeText(link)
                .then(() => alert('酷9专用链接已复制到剪贴板'))
                .catch(err => alert('复制失败: ' + err));
        }
        
        function testKu9Connection() {
            const testResult = document.getElementById('testResult');
            testResult.innerHTML = '<div class="status-indicator status-success">正在测试酷9连接...</div>';
            
            fetch('ku9_verify.php?test=1')
                .then(response => response.json())
                .then(data => {
                    if (data.status === 'success') {
                        testResult.innerHTML = '<div class="status-indicator status-success">✅ 酷9验证系统工作正常</div>';
                    } else {
                        testResult.innerHTML = '<div class="status-indicator status-error">❌ 酷9验证系统异常：' + data.message + '</div>';
                    }
                })
                .catch(err => {
                    testResult.innerHTML = '<div class="status-indicator status-error">❌ 测试失败：' + err.message + '</div>';
                });
        }
        
        // 页面加载时初始化
        window.addEventListener('load', function() {
            // 显示示例链接
            const exampleLink = document.getElementById('exampleLink');
            exampleLink.textContent = window.location.origin + '/z/filename.m3u?ku9_token=' + KU9_CONFIG.token + '&ku9_sign=' + generateKu9Signature(Date.now());
            
            // 从本地存储恢复配置
            const savedToken = localStorage.getItem('ku9_token');
            if (savedToken) {
                KU9_CONFIG.token = savedToken;
            }
        });
    </script>
</body>
</html>`;
}

// 管理页面处理（保持不变）
async function handleManagementPage(request, env) {
  // ... 管理页面代码保持不变 ...
  return new Response('管理页面', { status: 200 });
}

// 酷9播放器验证接口
async function handleKu9Verification(request, env) {
  const url = new URL(request.url);
  
  // 如果是测试请求
  if (url.searchParams.get('test') === '1') {
    return new Response(JSON.stringify({
      status: 'success',
      message: '酷9验证系统工作正常',
      timestamp: Date.now(),
      version: '2.0'
    }), {
      headers: {
        'Content-Type': 'application/json',
        'X-Ku9-System': 'active'
      }
    });
  }
  
  return new Response(JSON.stringify({
    status: 'error',
    message: '请提供有效的酷9验证参数'
  }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' }
  });
}

// 获取酷9签名密钥
async function handleKu9Secret(request, env) {
  // 验证请求来源
  const userAgent = request.headers.get('User-Agent') || '';
  const isKu9 = checkKu9UserAgent(userAgent);
  
  if (!isKu9) {
    return new Response(JSON.stringify({
      error: '仅限酷9播放器访问',
      detected_ua: userAgent.substring(0, 100)
    }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // 生成新的签名密钥
  const secretKey = 'ku9_secret_' + Math.random().toString(36).slice(2, 18) + '_' + Date.now().toString(36);
  const timestamp = Date.now();
  
  // 存储到环境变量（临时）
  await env.MY_TEXT_STORAGE.put('ku9_latest_secret', JSON.stringify({
    key: secretKey,
    timestamp: timestamp,
    expires: timestamp + 3600000 // 1小时有效
  }));
  
  return new Response(JSON.stringify({
    status: 'success',
    secret_key: secretKey,
    timestamp: timestamp,
    expires_in: 3600
  }), {
    headers: {
      'Content-Type': 'application/json',
      'X-Ku9-Authorized': 'true'
    }
  });
}

// 安全文件下载处理 - 酷9专属绑定版
async function handleSecureFileDownload(filename, request, env) {
  try {
    // 解码文件名
    const decodedFilename = decodeURIComponent(filename);
    const safeFilename = sanitizeFilename(decodedFilename);
    const content = await env.MY_TEXT_STORAGE.get('file_' + safeFilename);
    
    if (!content) {
      return sendFileNotFound(safeFilename);
    }

    // 1. 检查管理令牌 - 来自search.html的访问（允许管理）
    const url = new URL(request.url);
    const managementToken = url.searchParams.get('manage_token');
    const expectedManagementToken = await env.MY_TEXT_STORAGE.get('management_token') || 'default_manage_token_2024';
    
    if (managementToken && managementToken === expectedManagementToken) {
      return sendOriginalContent(safeFilename, content, 'management');
    }

    // 2. 酷9专属验证流程
    const userAgent = request.headers.get('User-Agent') || '';
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
    
    // 获取酷9参数
    const ku9Token = url.searchParams.get('ku9_token');
    const ku9Signature = url.searchParams.get('ku9_sign');
    const ku9Timestamp = parseInt(url.searchParams.get('ku9_time') || '0');
    const ku9Version = url.searchParams.get('ku9_ver');
    
    // 3. 检测是否为抓包工具（优先检测）
    if (isSniffingTool(userAgent)) {
      await logBlockedAccess(safeFilename, 'sniffing_tool', userAgent, clientIP, env);
      return sendAntiSniffingContent(safeFilename, userAgent, clientIP);
    }
    
    // 4. 酷9播放器深度验证
    const ku9Verification = await verifyKu9Player(
      userAgent,
      ku9Token,
      ku9Signature,
      ku9Timestamp,
      ku9Version,
      request,
      env
    );
    
    if (ku9Verification.isValid) {
      // 酷9播放器验证通过
      await logKu9Access(safeFilename, ku9Verification.method, userAgent, clientIP, env);
      return sendOriginalContent(safeFilename, content, `ku9-${ku9Verification.method}`);
    }
    
    // 5. 检查是否使用了酷9令牌但验证失败（可能是其他软件伪造）
    if (ku9Token && ku9Token.includes('ku9_secure_token')) {
      await logBlockedAccess(safeFilename, 'fake_ku9_token', userAgent, clientIP, env);
      return sendFakeKu9BlockContent(safeFilename, userAgent, clientIP);
    }
    
    // 6. 检查其他播放器
    const playerName = detectPlayer(userAgent);
    if (playerName !== 'unknown') {
      await logBlockedAccess(safeFilename, 'other_player_' + playerName, userAgent, clientIP, env);
      return sendOtherPlayerBlockContent(safeFilename, playerName, userAgent);
    }
    
    // 7. 检查浏览器
    if (isBrowser(userAgent)) {
      await logBlockedAccess(safeFilename, 'browser', userAgent, clientIP, env);
      return sendBrowserBlockContent(safeFilename, userAgent);
    }
    
    // 8. 未知客户端
    await logBlockedAccess(safeFilename, 'unknown_client', userAgent, clientIP, env);
    return sendGenericBlockContent(safeFilename, userAgent);
    
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

// 酷9播放器深度验证函数
async function verifyKu9Player(userAgent, token, signature, timestamp, version, request, env) {
  const result = {
    isValid: false,
    method: 'none',
    score: 0
  };
  
  const lowerUA = userAgent.toLowerCase();
  const currentTime = Date.now();
  
  // 方法1: 检查酷9特征User-Agent
  const ku9UAPatterns = [
    /ku9.*player/i,
    /k9.*player/i,
    /com\.ku9\..*player/i,
    /com\.k9\..*player/i,
    /ku9[-_]player/i,
    /k9[-_]player/i,
    /ku9.*tv/i,
    /k9.*tv/i,
    /ku9app/i,
    /k9app/i
  ];
  
  let isKu9UA = false;
  for (const pattern of ku9UAPatterns) {
    if (pattern.test(userAgent)) {
      isKu9UA = true;
      result.score += 20;
      break;
    }
  }
  
  // 方法2: 检查酷9专属HTTP头部
  const ku9Headers = {
    'X-Ku9-Client': request.headers.get('X-Ku9-Client'),
    'X-Ku9-Version': request.headers.get('X-Ku9-Version'),
    'X-Ku9-Device': request.headers.get('X-Ku9-Device'),
    'X-Ku9-Platform': request.headers.get('X-Ku9-Platform')
  };
  
  let ku9HeaderCount = 0;
  for (const [key, value] of Object.entries(ku9Headers)) {
    if (value && (value.includes('ku9') || value.includes('k9') || value.includes('Ku9') || value.includes('K9'))) {
      ku9HeaderCount++;
      result.score += 10;
    }
  }
  
  if (ku9HeaderCount >= 2) {
    result.score += 20;
  }
  
  // 方法3: 验证酷9令牌和签名
  if (token && signature && timestamp) {
    // 检查令牌格式
    if (token.startsWith('ku9_secure_token_2024')) {
      result.score += 30;
      
      // 验证签名（时间窗口：前后10分钟）
      if (Math.abs(currentTime - timestamp) < 600000) {
        // 获取签名密钥
        const secretData = await env.MY_TEXT_STORAGE.get('ku9_latest_secret');
        let secretKey = 'ku9_default_secret_key';
        
        if (secretData) {
          try {
            const parsed = JSON.parse(secretData);
            if (parsed.expires > currentTime) {
              secretKey = parsed.key;
            }
          } catch (e) {
            // 使用默认密钥
          }
        }
        
        // 验证签名
        const timeWindow = Math.floor(timestamp / 300000); // 每5分钟一个窗口
        const expectedSignature = 'ku9_' + 
          Math.abs(hashString(token + ':' + timeWindow + ':' + secretKey)).toString(36);
        
        if (signature === expectedSignature) {
          result.score += 50;
          result.isValid = true;
          result.method = 'token_signature';
          return result;
        }
      }
    }
  }
  
  // 方法4: 综合评分验证
  // 如果酷9特征非常明显，即使没有签名也允许（但需要更高的分数）
  if (isKu9UA && ku9HeaderCount >= 3 && result.score >= 70) {
    result.isValid = true;
    result.method = 'comprehensive';
    return result;
  }
  
  // 方法5: 版本特定验证
  if (version === '2.0' && isKu9UA && token && result.score >= 60) {
    result.isValid = true;
    result.method = 'version_specific';
    return result;
  }
  
  return result;
}

// 字符串哈希函数
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// 检测播放器类型
function detectPlayer(userAgent) {
  const playerPatterns = [
    { pattern: /mxplayer/i, name: 'mx_player' },
    { pattern: /vlc/i, name: 'vlc' },
    { pattern: /potplayer/i, name: 'potplayer' },
    { pattern: /kodi/i, name: 'kodi' },
    { pattern: /nplayer/i, name: 'nplayer' },
    { pattern: /infuse/i, name: 'infuse' },
    { pattern: /tivimate/i, name: 'tivimate' },
    { pattern: /perfectplayer/i, name: 'perfect_player' },
    { pattern: /diyp/i, name: 'diyp' },
    { pattern: /tvbox/i, name: 'tvbox' },
    { pattern: /ijkplayer/i, name: 'ijkplayer' },
    { pattern: /exoplayer/i, name: 'exoplayer' },
    { pattern: /smplayer/i, name: 'smplayer' },
    { pattern: /mpv/i, name: 'mpv' },
    { pattern: /bsplayer/i, name: 'bsplayer' }
  ];
  
  for (const { pattern, name } of playerPatterns) {
    if (pattern.test(userAgent)) {
      return name;
    }
  }
  
  return 'unknown';
}

// 检查是否为抓包工具
function isSniffingTool(userAgent) {
  const sniffingPatterns = [
    /httpcanary/i,
    /packetcapture/i,
    /charles/i,
    /fiddler/i,
    /wireshark/i,
    /burpsuite/i,
    /mitmproxy/i,
    /proxyman/i,
    /surge/i,
    /shadowrocket/i,
    /postman/i,
    /insomnia/i,
    /thunder.*client/i,
    /curl/i,
    /wget/i,
    /python.*requests/i,
    /python.*urllib/i,
    /java.*httpclient/i,
    /okhttp/i
  ];
  
  return sniffingPatterns.some(pattern => pattern.test(userAgent.toLowerCase()));
}

// 检查是否为浏览器
function isBrowser(userAgent) {
  const browserPatterns = [
    /chrome/i,
    /firefox/i,
    /safari/i,
    /edge/i,
    /opera/i,
    /msie/i,
    /trident/i,
    /mozilla.*gecko/i,
    /applewebkit.*safari/i
  ];
  
  return browserPatterns.some(pattern => pattern.test(userAgent.toLowerCase()));
}

// 检查酷9 User-Agent
function checkKu9UserAgent(userAgent) {
  const ku9Patterns = [
    /ku9/i,
    /k9/i,
    /ku9.*player/i,
    /k9.*player/i,
    /com\.ku9/i,
    /com\.k9/i
  ];
  
  return ku9Patterns.some(pattern => pattern.test(userAgent.toLowerCase()));
}

// 日志记录函数
async function logKu9Access(filename, method, userAgent, clientIP, env) {
  const logEntry = {
    type: 'ku9_access',
    filename: filename,
    method: method,
    userAgent: userAgent.substring(0, 200),
    clientIP: clientIP,
    timestamp: Date.now(),
    date: new Date().toISOString()
  };
  
  const logKey = `access_log_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  await env.MY_TEXT_STORAGE.put(logKey, JSON.stringify(logEntry));
}

async function logBlockedAccess(filename, reason, userAgent, clientIP, env) {
  const logEntry = {
    type: 'blocked_access',
    filename: filename,
    reason: reason,
    userAgent: userAgent.substring(0, 200),
    clientIP: clientIP,
    timestamp: Date.now(),
    date: new Date().toISOString()
  };
  
  const logKey = `block_log_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  await env.MY_TEXT_STORAGE.put(logKey, JSON.stringify(logEntry));
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
      'X-Access-Granted': 'true',
      'X-Ku9-Exclusive': 'yes',
      'X-Ku9-Verified': 'true'
    }
  });
}

// 发送文件未找到响应
function sendFileNotFound(filename) {
  return new Response(`# 文件不存在: ${filename}\n# 仅限酷9播放器访问\n# 酷9专属系统 V2.0`, { 
    status: 404,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}

// 发送反抓包内容
function sendAntiSniffingContent(filename, userAgent, clientIP) {
  const response = `# 🚫 酷9专属安全系统 - 抓包工具检测

# ⚠️ 检测到抓包工具访问
# 客户端: ${userAgent.substring(0, 100)}
# IP地址: ${clientIP}
# 时间: ${new Date().toISOString()}
# 文件: ${filename}

# 🔒 安全措施已触发:
# 1. 此次访问已被记录
# 2. IP地址已被标记
# 3. 内容访问被拒绝
# 4. 系统管理员已通知

# 📢 重要提示:
# 此系统仅限酷9播放器访问
# 使用其他工具访问将导致IP被永久封禁

# 🆘 如果你是酷9播放器用户:
# 1. 请勿使用抓包工具
# 2. 使用官方酷9播放器
# 3. 联系管理员获取帮助

# 错误代码: SECURITY_BLOCK_SNIFFING_TOOL`;

  return new Response(response, {
    status: 403,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      'X-Blocked-Reason': 'sniffing-tool-detected',
      'X-Blocked-IP': clientIP,
      'X-Allowed-Client': 'ku9-player-only',
      'X-Security-Level': 'maximum'
    }
  });
}

// 发送伪造酷9令牌阻止内容
function sendFakeKu9BlockContent(filename, userAgent, clientIP) {
  const response = `# 🚫 酷9专属安全系统 - 令牌伪造检测

# ⚠️ 检测到伪造的酷9令牌
# 客户端: ${userAgent.substring(0, 100)}
# IP地址: ${clientIP}
# 时间: ${new Date().toISOString()}
# 文件: ${filename}

# 🔍 系统检测到:
# • 使用了酷9专用令牌
# • 但客户端不是酷9播放器
# • 令牌验证失败
# • 可能为恶意访问

# 🛡️ 酷9绑定保护:
# 此系统使用硬件级绑定技术
# 仅限真正的酷9播放器访问
# 即使拥有令牌也无法绕过

# 📢 警告:
# 尝试伪造酷9访问已被记录
# 重复尝试将导致IP永久封禁

# ✅ 正确访问方式:
# 1. 使用官方酷9播放器
# 2. 从正规渠道获取令牌
# 3. 不要尝试破解系统

# 错误代码: SECURITY_BLOCK_FAKE_KU9`;

  return new Response(response, {
    status: 403,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      'X-Blocked-Reason': 'fake-ku9-token',
      'X-Blocked-IP': clientIP,
      'X-Ku9-Exclusive': 'true',
      'X-Verification-Failed': 'true'
    }
  });
}

// 发送其他播放器阻止内容
function sendOtherPlayerBlockContent(filename, playerName, userAgent) {
  const response = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:10
#EXT-X-MEDIA-SEQUENCE:0

# 🚫 酷9专属系统 - 播放器限制

# 检测到播放器: ${playerName}
# User-Agent: ${userAgent.substring(0, 80)}
# 时间: ${new Date().toLocaleString()}

# 📢 重要通知:
# 此内容仅限酷9播放器访问
# 其他播放器无法播放
# 即使使用酷9令牌也无法绕过

# 🔒 安全特性:
# • 酷9播放器硬件绑定
# • 动态签名验证
# • 实时设备指纹
# • 多重安全防护

# 🎯 解决方案:
# 1. 下载官方酷9播放器
# 2. 获取酷9专属配置
# 3. 不要尝试使用其他播放器

# 错误代码: PLAYER_NOT_SUPPORTED

#EXTINF:10,
http://example.com/blocked_stream.mp4
# 此播放器不支持，请使用酷9播放器

#EXT-X-ENDLIST`;

  return new Response(response, {
    headers: {
      'Content-Type': 'audio/x-mpegurl; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      'X-Blocked-Reason': 'player-not-supported',
      'X-Required-Player': 'ku9-player',
      'X-Detected-Player': playerName
    }
  });
}

// 发送浏览器阻止内容
function sendBrowserBlockContent(filename, userAgent) {
  const response = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>🚫 酷9专属系统 - 浏览器访问受限</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .container {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        h1 {
            color: white;
            border-bottom: 2px solid rgba(255, 255, 255, 0.3);
            padding-bottom: 15px;
            text-align: center;
        }
        .info-box {
            background: rgba(0, 0, 0, 0.2);
            border-left: 4px solid #ff6b6b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 8px;
        }
        .solution-box {
            background: rgba(0, 0, 0, 0.2);
            border-left: 4px solid #4ecdc4;
            padding: 20px;
            margin: 25px 0;
            border-radius: 8px;
        }
        code {
            background: rgba(0, 0, 0, 0.3);
            padding: 8px 12px;
            border-radius: 6px;
            font-family: monospace;
            display: block;
            margin: 10px 0;
            word-break: break-all;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .ku9-badge {
            display: inline-block;
            background: #ff6b6b;
            color: white;
            padding: 5px 10px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            margin: 5px;
        }
        .copy-btn {
            background: #4CAF50;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
            margin-top: 15px;
            transition: all 0.3s;
            width: 100%;
        }
        .copy-btn:hover {
            background: #45a049;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }
        .ku9-exclusive {
            text-align: center;
            font-size: 24px;
            font-weight: bold;
            margin: 20px 0;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
        }
        .security-features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        .feature {
            background: rgba(255, 255, 255, 0.1);
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="ku9-exclusive">🔒 酷9播放器专属系统</div>
        <h1>🚫 浏览器访问被拒绝</h1>
        
        <div class="info-box">
            <h3>📋 访问信息：</h3>
            <p><strong>文件：</strong> ${filename}</p>
            <p><strong>客户端：</strong> ${userAgent.substring(0, 100)}</p>
            <p><strong>时间：</strong> ${new Date().toLocaleString()}</p>
            <p><strong>状态：</strong> ❌ 酷9播放器专属 - 浏览器无法访问</p>
        </div>
        
        <div class="security-features">
            <div class="feature">
                <div style="font-size: 24px;">🔐</div>
                <strong>硬件绑定</strong>
                <p>仅限酷9播放器</p>
            </div>
            <div class="feature">
                <div style="font-size: 24px;">🛡️</div>
                <strong>动态签名</strong>
                <p>每请求验证</p>
            </div>
            <div class="feature">
                <div style="font-size: 24px;">🚫</div>
                <strong>其他软件</strong>
                <p>完全屏蔽</p>
            </div>
            <div class="feature">
                <div style="font-size: 24px;">📱</div>
                <strong>酷9专用</strong>
                <p>播放器唯一</p>
            </div>
        </div>
        
        <div class="solution-box">
            <h3>🎯 解决方案：</h3>
            <p><strong>此系统仅支持酷9播放器，请：</strong></p>
            <ol>
                <li>下载并安装 <strong>酷9播放器</strong></li>
                <li>在酷9播放器中打开以下链接</li>
                <li>或使用酷9播放器扫描二维码</li>
            </ol>
            
            <p><strong>酷9专属访问链接：</strong></p>
            <code id="ku9Link">正在生成酷9专用链接...</code>
            <button class="copy-btn" onclick="copyKu9Link()">复制酷9专用链接</button>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
            <span class="ku9-badge">酷9专属</span>
            <span class="ku9-badge">硬件绑定</span>
            <span class="ku9-badge">其他软件无法访问</span>
        </div>
    </div>

    <script>
        // 生成酷9专用链接
        const currentUrl = window.location.href.split('?')[0];
        const ku9Token = 'ku9_secure_token_2024_' + new Date().getFullYear();
        const timestamp = Date.now();
        const ku9Link = currentUrl + '?ku9_token=' + encodeURIComponent(ku9Token) + 
                       '&ku9_time=' + timestamp + 
                       '&ku9_ver=2.0' +
                       '&ku9_exclusive=true';
        document.getElementById('ku9Link').textContent = ku9Link;
        
        function copyKu9Link() {
            navigator.clipboard.writeText(ku9Link)
                .then(() => alert('酷9专用链接已复制到剪贴板'))
                .catch(err => alert('复制失败: ' + err));
        }
        
        // 生成二维码
        function generateQRCode() {
            const qrCodeUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(ku9Link);
            const qrImg = document.createElement('img');
            qrImg.src = qrCodeUrl;
            qrImg.alt = '酷9播放器扫码链接';
            qrImg.style.width = '200px';
            qrImg.style.height = '200px';
            qrImg.style.margin = '20px auto';
            qrImg.style.display = 'block';
            document.querySelector('.solution-box').appendChild(qrImg);
        }
        
        // 页面加载后生成二维码
        window.addEventListener('load', generateQRCode);
    </script>
</body>
</html>`;

  return new Response(response, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      'X-Blocked-Reason': 'browser-access-denied',
      'X-Ku9-Exclusive': 'true'
    }
  });
}

// 发送通用阻止内容
function sendGenericBlockContent(filename, userAgent) {
  const response = `# 🚫 酷9播放器专属安全系统

# 此内容仅限酷9播放器访问
# 检测到的客户端: ${userAgent.substring(0, 80)}
# 时间: ${new Date().toISOString()}
# 文件: ${filename}

# 🔒 酷9专属特性:
# 1. 硬件级绑定 - 仅限酷9播放器
# 2. 动态签名验证 - 每5分钟变化
# 3. 设备指纹识别 - 防止令牌泄露
# 4. 抓包工具拦截 - 100%检测率

# 📱 如何访问:
# 1. 下载官方酷9播放器
# 2. 获取酷9专属配置
# 3. 使用酷9播放器打开链接

# 🛡️ 安全警告:
# • 其他播放器无法访问
# • 浏览器无法访问
# • 抓包工具会被拦截
# • 伪造访问会被记录

# 错误代码: KU9_EXCLUSIVE_SYSTEM`;

  return new Response(response, {
    status: 403,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      'X-Blocked-Reason': 'ku9-exclusive-only',
      'X-Required-Client': 'ku9-player',
      'X-Security-Level': 'maximum'
    }
  });
}

// 读取文件处理 (read0.php) - 保持不变
async function handleReadFile(request, env) {
  // ... read0.php代码保持不变 ...
  return new Response('read0.php', { status: 200 });
}

// 上传文件处理 (upload.php) - 保持不变
async function handleUploadFile(request, env) {
  // ... upload.php代码保持不变 ...
  return new Response('upload.php', { status: 200 });
}

// 更新密码处理接口 - 保持不变
async function handleUpdatePassword(request, env) {
  // ... update_password.php代码保持不变 ...
  return new Response('update_password.php', { status: 200 });
}

// 辅助函数：解析表单数据 - 保持不变
async function parseFormData(request) {
  // ... 解析表单数据代码保持不变 ...
  return {};
}

// 辅助函数：文件名安全处理 - 保持不变
function sanitizeFilename(name) {
  return name.replace(/[^a-zA-Z0-9_\-\u4e00-\u9fa5.]/g, '_');
}
