// Cloudflare Pages Functions - 增强安全文本存储系统 V2.4
// 新增：酷9播放器专属token系统，严格检测规则
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

    // 访问日志页面
    if (pathname === '/logs.html' || pathname === '/logs.php') {
      return await handleLogsPage(request, env);
    }

    // 酷9播放器配置页面
    if (pathname === '/ku9_config.html') {
      return await handleKu9ConfigPage(request, env);
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

    // API: 获取日志详情
    if (pathname === '/api_log_detail' && request.method === 'GET') {
      return await handleLogDetail(request, env);
    }

    // API: 获取UA详情
    if (pathname === '/api_ua_detail' && request.method === 'GET') {
      return await handleUADetail(request, env);
    }

    // API: 导出日志
    if (pathname === '/api_export_logs' && request.method === 'GET') {
      return await handleExportLogs(request, env);
    }

    // API: 清空日志
    if (pathname === '/api_clear_logs' && request.method === 'POST') {
      return await handleClearLogs(request, env);
    }

    // API: 设置酷9专属token
    if (pathname === '/api_set_ku9_token' && request.method === 'POST') {
      return await handleSetKu9Token(request, env);
    }

    // API: 获取酷9播放器token状态
    if (pathname === '/api_ku9_status' && request.method === 'GET') {
      return await handleKu9Status(request, env);
    }

    // API: 生成酷9播放器链接
    if (pathname === '/api_generate_ku9_link' && request.method === 'POST') {
      return await handleGenerateKu9Link(request, env);
    }

    // 动态加密文件下载 - 记录访问日志
    if (pathname.startsWith('/z/')) {
      const filename = pathname.substring(3);
      return await handleSecureFileDownload(filename, request, env);
    }

    // 酷9专用下载接口
    if (pathname.startsWith('/ku9/')) {
      const filename = pathname.substring(5);
      return await handleKu9FileDownload(filename, request, env);
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
    console.error('全局错误:', error);
    return new Response(`Error: ${error.message}`, { 
      status: 500,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }
}

// 主页 HTML (index.html) - 添加酷9配置链接
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
        
        .security-features {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px;
            border-radius: 10px;
            margin: 20px 0;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .security-features h3 {
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
        
        .security-icon {
            font-size: 20px;
        }
        
        .encryption-info {
            background: #f8f9fa;
            border-left: 4px solid #28a745;
            padding: 10px;
            margin: 15px 0;
            font-size: 12px;
        }
        
        .blocked-software {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 5px;
            padding: 10px;
            margin: 15px 0;
        }
        
        .blocked-software h4 {
            margin-top: 0;
            color: #856404;
        }
        
        .ku9-notice {
            background: #e3f2fd;
            border: 2px solid #2196f3;
            border-radius: 8px;
            padding: 15px;
            margin: 15px 0;
        }
        
        .ku9-notice h4 {
            margin-top: 0;
            color: #1976d2;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .ku9-link {
            display: inline-block;
            margin-top: 10px;
            padding: 8px 12px;
            background: #2196f3;
            color: white;
            border-radius: 4px;
            text-decoration: none;
            font-weight: bold;
        }
        
        .ku9-link:hover {
            background: #0b7dda;
        }
    </style>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>🔒安全编辑工具🔒</title>
</head>

<body>
    <h2>🔐 文件转为<u>安全链接</u></h2>
    
    <div class="ku9-notice">
        <h4>📱 酷9播放器专用通道：</h4>
        <p>如果您是酷9播放器用户，请使用专用通道获得最佳兼容性。</p>
        <a href="./ku9_config.html" class="ku9-link">进入酷9配置页面 →</a>
    </div>
    
    <div class="security-features">
        <h3>🛡️ 安全特性说明：</h3>
        <ul class="security-list">
            <li><span class="security-icon">✅</span> 动态时间加密 - 每次访问内容不同</li>
            <li><span class="security-icon">✅</span> 播放器专用验证 - 只允许TVBox/酷9</li>
            <li><span class="security-icon">✅</span> 反抓包保护 - 屏蔽蓝鸟/黄鸟</li>
            <li><span class="security-icon">✅</span> 汉字加密 - 完全无法直接阅读</li>
            <li><span class="security-icon">🔐</span> 酷9专属token - 专用访问通道</li>
        </ul>
    </div>
    
    <div class="blocked-software">
        <h4>🚫 已屏蔽的抓包软件：</h4>
        <p>蓝鸟、黄鸟、HTTPCanary、Fiddler、Charles、Wireshark、PacketCapture等</p>
    </div>
    
    <p>可自定义扩展名，输入完整文件名如：<code>log.json</code>、<code>test.php</code>。〖<a href="./search.html"><b>接口搜索</b></a>〗〖<a href="./logs.html"><b>访问日志</b></a>〗</p><br>

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
        <div class="success-message">✅ 文件已成功转为安全链接：</div>
        <a id="linkAnchor" href="" target="_blank"></a>
        <button class="copy-btn" onclick="copyLink()">复制链接</button>
        
        <div class="encryption-info">
            <strong>🔒 安全说明：</strong><br>
            1. 此链接使用动态时间加密，每次访问内容都不同<br>
            2. 只有TVBox/酷9等播放器可以正常访问<br>
            3. 抓包软件无法获取真实内容<br>
            4. 所有文字都已加密保护<br>
            5. 酷9播放器可使用专属通道访问
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
            
            linkDisplay.scrollIntoView({ behavior: 'smooth' });
        }
        
        function copyLink() {
            const link = document.getElementById('linkAnchor').href;
            navigator.clipboard.writeText(link)
                .then(() => alert('安全链接已复制到剪贴板'))
                .catch(err => alert('复制失败: ' + err));
        }
    </script>
</body>
</html>`;
}

// 酷9播放器配置页面
async function handleKu9ConfigPage(request, env) {
  try {
    // 检查管理访问令牌
    const url = new URL(request.url);
    const managementToken = url.searchParams.get('manage_token');
    const expectedToken = await env.MY_TEXT_STORAGE.get('management_token') || 'default_manage_token_2024';
    
    // 如果没有令牌或令牌错误，显示登录页面
    if (!managementToken || managementToken !== expectedToken) {
      return new Response(await getManagementLoginHTML(request), {
        headers: { 
          'content-type': 'text/html;charset=UTF-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Content-Type-Options': 'nosniff'
        },
      });
    }
    
    // 获取当前酷9配置
    const ku9Config = await getKu9Config(env);
    const ku9Token = ku9Config.token || '未设置';
    const ku9LastUsed = ku9Config.lastUsed ? new Date(ku9Config.lastUsed).toLocaleString('zh-CN') : '从未使用';
    const ku9FileCount = await getKu9FileCount(env);
    
    // 显示酷9配置页面
    return new Response(await getKu9ConfigHTML(ku9Token, ku9LastUsed, ku9FileCount, managementToken, ku9Config), {
      headers: { 
        'content-type': 'text/html;charset=UTF-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Content-Type-Options': 'nosniff'
      },
    });
  } catch (error) {
    console.error('酷9配置页面错误:', error);
    return new Response(`酷9配置页面错误: ${error.message}`, { 
      status: 500,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }
}

// 获取酷9配置
async function getKu9Config(env) {
  try {
    const configData = await env.MY_TEXT_STORAGE.get('ku9_config');
    if (configData) {
      return JSON.parse(configData);
    }
  } catch (error) {
    console.error('获取酷9配置失败:', error);
  }
  
  // 默认配置
  return {
    token: null,
    lastUsed: null,
    strictMode: true,
    ipWhitelist: [],
    fileWhitelist: [],
    accessCount: 0
  };
}

// 获取酷9文件数量
async function getKu9FileCount(env) {
  try {
    const allFiles = await env.MY_TEXT_STORAGE.list();
    let count = 0;
    
    for (const key of allFiles.keys) {
      if (key.name.startsWith('file_')) {
        count++;
      }
    }
    
    return count;
  } catch (error) {
    console.error('获取文件数量失败:', error);
    return 0;
  }
}

// 酷9配置页面HTML
async function getKu9ConfigHTML(ku9Token, ku9LastUsed, ku9FileCount, managementToken, ku9Config) {
  const tokenStatus = ku9Token === '未设置' ? '未设置' : '已设置';
  const tokenValue = ku9Token === '未设置' ? '' : ku9Token;
  const fileList = await getKu9FileListHTML(managementToken);
  
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>酷9播放器专用配置</title>
<style>
body{font-family:"Segoe UI",Tahoma,sans-serif;font-size:14px;color:#333;margin:0;padding:20px;background:#f5f5f5;}
.config-container{max-width:800px;margin:0 auto;background:white;border-radius:10px;padding:20px;box-shadow:0 2px 10px rgba(0,0,0,0.1);}
.back-link{display:inline-block;margin-bottom:15px;color:#4a6cf7;text-decoration:none;padding:6px 12px;background:#f0f0f0;border-radius:4px;}
h2{color:#2196f3;margin-top:0;border-bottom:2px solid #2196f3;padding-bottom:10px;}
.status-card{background:linear-gradient(135deg,#e3f2fd,#bbdefb);border-radius:8px;padding:15px;margin-bottom:20px;}
.status-grid{display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:15px;margin-bottom:20px;}
.stat-item{background:white;padding:15px;border-radius:6px;border-left:4px solid #2196f3;}
.stat-label{font-size:12px;color:#666;margin-bottom:5px;}
.stat-value{font-size:24px;font-weight:bold;color:#2196f3;}
.token-section{margin:20px 0;}
.token-display{background:#f8f9fa;border:1px solid #dee2e6;border-radius:6px;padding:15px;margin-bottom:15px;}
.token-display code{font-family:monospace;font-size:16px;color:#d9534f;word-break:break-all;}
.input-group{margin-bottom:15px;}
label{display:block;margin-bottom:5px;font-weight:bold;color:#555;}
input[type="text"],textarea{width:100%;padding:10px;border:1px solid #ddd;border-radius:4px;box-sizing:border-box;font-family:monospace;}
.btn{background:#2196f3;color:white;border:none;padding:10px 20px;border-radius:4px;cursor:pointer;font-size:14px;margin-right:10px;}
.btn:hover{background:#0b7dda;}
.btn-danger{background:#d9534f;}
.btn-danger:hover{background:#c9302c;}
.btn-success{background:#5cb85c;}
.btn-success:hover{background:#4cae4c;}
.file-list{background:#f8f9fa;border:1px solid #dee2e6;border-radius:6px;padding:15px;margin-top:20px;}
.file-item{padding:8px;border-bottom:1px solid #eee;display:flex;justify-content:space-between;align-items:center;}
.file-item:last-child{border-bottom:none;}
.file-name{font-family:monospace;}
.file-actions button{background:#6c757d;color:white;border:none;padding:3px 8px;border-radius:3px;cursor:pointer;font-size:12px;margin-left:5px;}
.file-actions button:hover{background:#5a6268;}
.message{margin:10px 0;padding:10px;border-radius:4px;display:none;}
.message.success{background:#d4edda;color:#155724;border:1px solid #c3e6cb;}
.message.error{background:#f8d7da;color:#721c24;border:1px solid #f5c6cb;}
.instructions{background:#fff3cd;border:1px solid #ffeaa7;border-radius:6px;padding:15px;margin-top:20px;}
.instructions h4{color:#856404;margin-top:0;}
.instructions ol{padding-left:20px;}
.instructions li{margin-bottom:8px;}
.copy-btn{background:#6c757d;color:white;border:none;padding:5px 10px;border-radius:3px;cursor:pointer;font-size:12px;margin-left:10px;}
.copy-btn:hover{background:#5a6268;}
.token-actions{margin-top:10px;}
</style>
</head>

<body>
<div class="config-container">
  <a href="./search.html?manage_token=${managementToken}" class="back-link">← 返回管理页面</a>
  
  <h2>📱 酷9播放器专用配置</h2>
  
  <div class="status-card">
    <h3>酷9播放器状态</h3>
    <div class="status-grid">
      <div class="stat-item">
        <div class="stat-label">专属Token状态</div>
        <div class="stat-value">${tokenStatus}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">最后使用时间</div>
        <div class="stat-value" style="font-size:16px;">${ku9LastUsed}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">可用文件数</div>
        <div class="stat-value">${ku9FileCount}</div>
      </div>
    </div>
  </div>
  
  <div id="message" class="message"></div>
  
  <div class="token-section">
    <h3>专属Token配置</h3>
    <div class="token-display">
      <div class="stat-label">当前专属Token：</div>
      <code id="currentToken">${tokenValue}</code>
      ${tokenValue ? '<button class="copy-btn" onclick="copyToken()">复制Token</button>' : ''}
    </div>
    
    <div class="input-group">
      <label for="newToken">设置新Token：</label>
      <input type="text" id="newToken" placeholder="输入酷9专属Token，建议使用复杂字符串" value="${tokenValue}">
    </div>
    
    <div class="token-actions">
      <button class="btn" onclick="setToken()">💾 保存Token</button>
      <button class="btn btn-danger" onclick="resetToken()" ${!tokenValue ? 'disabled' : ''}>🗑️ 重置Token</button>
      <button class="btn btn-success" onclick="generateToken()">🎲 生成随机Token</button>
    </div>
  </div>
  
  <div class="instructions">
    <h4>使用说明：</h4>
    <ol>
      <li>设置专属Token后，酷9播放器必须使用此Token才能访问文件</li>
      <li>其他播放器使用此Token访问会被拒绝</li>
      <li>酷9播放器必须满足严格检测规则（UA包含'ku9'或'酷9'，或UA为'MTV'）</li>
      <li>访问链接格式：<code>https://你的域名/ku9/文件名?token=酷9专属Token</code></li>
      <li>或者使用下面的"生成酷9链接"功能</li>
    </ol>
  </div>
  
  <div>
    <h3>生成酷9播放器链接</h3>
    <div class="input-group">
      <label for="fileName">选择文件：</label>
      <select id="fileName" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:4px;">
        <option value="">请选择文件...</option>
        ${fileList}
      </select>
    </div>
    
    <div class="input-group">
      <label>生成的酷9链接：</label>
      <textarea id="ku9Link" rows="2" readonly placeholder="选择文件后自动生成链接"></textarea>
    </div>
    
    <button class="btn" onclick="generateKu9Link()" style="margin-top:10px;">🔗 生成酷9链接</button>
    <button class="btn copy-btn" onclick="copyKu9Link()" style="margin-top:10px;">📋 复制链接</button>
  </div>
  
  <div class="file-list">
    <h3>可用文件列表</h3>
    <div id="filesContainer">
      正在加载文件列表...
    </div>
  </div>
</div>

<script>
let currentToken = '${tokenValue}';

// 显示消息
function showMessage(text, type) {
  const msgDiv = document.getElementById('message');
  msgDiv.textContent = text;
  msgDiv.className = 'message ' + type;
  msgDiv.style.display = 'block';
  setTimeout(() => {
    msgDiv.style.display = 'none';
  }, 5000);
}

// 复制Token
function copyToken() {
  navigator.clipboard.writeText(currentToken)
    .then(() => showMessage('Token已复制到剪贴板', 'success'))
    .catch(err => showMessage('复制失败: ' + err, 'error'));
}

// 设置Token
function setToken() {
  const newToken = document.getElementById('newToken').value.trim();
  if (!newToken) {
    showMessage('请输入Token', 'error');
    return;
  }
  
  fetch('/api_set_ku9_token?manage_token=${managementToken}', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ token: newToken })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      currentToken = newToken;
      document.getElementById('currentToken').textContent = newToken;
      showMessage('Token设置成功', 'success');
      // 更新复制按钮
      const tokenDisplay = document.querySelector('.token-display');
      if (!tokenDisplay.querySelector('.copy-btn')) {
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.textContent = '复制Token';
        copyBtn.onclick = copyToken;
        tokenDisplay.appendChild(copyBtn);
      }
    } else {
      showMessage('设置失败: ' + data.error, 'error');
    }
  })
  .catch(error => {
    showMessage('网络错误: ' + error, 'error');
  });
}

// 重置Token
function resetToken() {
  if (!confirm('确定要重置Token吗？重置后酷9播放器将无法访问！')) {
    return;
  }
  
  fetch('/api_set_ku9_token?manage_token=${managementToken}', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ token: null })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      currentToken = '';
      document.getElementById('currentToken').textContent = '';
      document.getElementById('newToken').value = '';
      showMessage('Token已重置', 'success');
      // 移除复制按钮
      const copyBtn = document.querySelector('.token-display .copy-btn');
      if (copyBtn) copyBtn.remove();
    } else {
      showMessage('重置失败: ' + data.error, 'error');
    }
  })
  .catch(error => {
    showMessage('网络错误: ' + error, 'error');
  });
}

// 生成随机Token
function generateToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = 'ku9_';
  for (let i = 0; i < 24; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  token += '_' + Date.now().toString(36);
  
  document.getElementById('newToken').value = token;
  showMessage('已生成随机Token，请点击保存', 'success');
}

// 生成酷9链接
function generateKu9Link() {
  const fileName = document.getElementById('fileName').value;
  if (!fileName) {
    showMessage('请选择文件', 'error');
    return;
  }
  
  if (!currentToken) {
    showMessage('请先设置酷9专属Token', 'error');
    return;
  }
  
  fetch('/api_generate_ku9_link?manage_token=${managementToken}', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ filename: fileName })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      const link = data.link + '?token=' + encodeURIComponent(currentToken);
      document.getElementById('ku9Link').value = link;
    } else {
      showMessage('生成失败: ' + data.error, 'error');
    }
  })
  .catch(error => {
    showMessage('网络错误: ' + error, 'error');
  });
}

// 复制酷9链接
function copyKu9Link() {
  const link = document.getElementById('ku9Link').value;
  if (!link) {
    showMessage('没有可复制的链接', 'error');
    return;
  }
  
  navigator.clipboard.writeText(link)
    .then(() => showMessage('链接已复制到剪贴板', 'success'))
    .catch(err => showMessage('复制失败: ' + err, 'error'));
}

// 加载文件列表
function loadFiles() {
  fetch('/api_ku9_status?manage_token=${managementToken}&action=files')
    .then(response => response.json())
    .then(data => {
      const container = document.getElementById('filesContainer');
      if (data.files && data.files.length > 0) {
        let html = '';
        data.files.forEach(file => {
          html += \`
<div class="file-item">
  <div>
    <span class="file-name">\${file.name}</span>
    <span style="color:#666;font-size:12px;margin-left:10px;">\${formatFileSize(file.size)}</span>
  </div>
  <div class="file-actions">
    <button onclick="generateLinkForFile('\${file.name}')">生成链接</button>
    <button onclick="copyDirectLink('\${file.name}')">复制路径</button>
  </div>
</div>\`;
        });
        container.innerHTML = html;
      } else {
        container.innerHTML = '<div style="text-align:center;padding:20px;color:#666;">没有可用文件</div>';
      }
    })
    .catch(error => {
      console.error('加载文件列表失败:', error);
      document.getElementById('filesContainer').innerHTML = '<div style="text-align:center;padding:20px;color:#d9534f;">加载失败</div>';
    });
}

// 为指定文件生成链接
function generateLinkForFile(filename) {
  if (!currentToken) {
    showMessage('请先设置酷9专属Token', 'error');
    return;
  }
  
  document.getElementById('fileName').value = filename;
  generateKu9Link();
}

// 复制直接链接
function copyDirectLink(filename) {
  const link = '/ku9/' + encodeURIComponent(filename) + '?token=' + encodeURIComponent(currentToken);
  navigator.clipboard.writeText(link)
    .then(() => showMessage('路径已复制到剪贴板', 'success'))
    .catch(err => showMessage('复制失败: ' + err, 'error'));
}

// 格式化文件大小
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + 'B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(2) + 'KB';
  return (bytes / 1048576).toFixed(2) + 'MB';
}

// 页面加载时获取文件列表
document.addEventListener('DOMContentLoaded', function() {
  loadFiles();
  
  // 监听文件选择变化
  document.getElementById('fileName').addEventListener('change', function() {
    if (this.value && currentToken) {
      generateKu9Link();
    }
  });
});
</script>
</body>
</html>`;
}

// 获取酷9文件列表HTML
async function getKu9FileListHTML(managementToken) {
  // 这个函数应该返回一个文件列表的HTML选项
  // 由于需要从KV存储获取数据，这里返回一个占位符，实际数据由前端JavaScript获取
  return '';
}

// 酷9文件下载处理 - 严格检测
async function handleKu9FileDownload(filename, request, env) {
  try {
    // 解码文件名
    const decodedFilename = decodeURIComponent(filename);
    const safeFilename = sanitizeFilename(decodedFilename);
    const content = await env.MY_TEXT_STORAGE.get('file_' + safeFilename);
    
    if (!content) {
      await logAccess(env, request, safeFilename, 'blocked', '酷9: 文件不存在', 
                     request.headers.get('User-Agent'), 
                     request.headers.get('CF-Connecting-IP'),
                     'ku9');
      
      return new Response('文件不存在', { 
        status: 404,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }

    // 获取酷9专属token
    const ku9Config = await getKu9Config(env);
    const expectedKu9Token = ku9Config.token;
    
    // 如果没有设置酷9token，直接拒绝
    if (!expectedKu9Token) {
      await logAccess(env, request, safeFilename, 'blocked', '酷9: 未配置专属Token', 
                     request.headers.get('User-Agent'), 
                     request.headers.get('CF-Connecting-IP'),
                     'ku9');
      
      return new Response('酷9播放器访问未配置', { 
        status: 403,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }

    // 获取请求中的token
    const url = new URL(request.url);
    const providedToken = url.searchParams.get('token') || request.headers.get('X-Ku9-Token');
    
    // 严格检测：必须是酷9播放器且token正确
    const userAgent = request.headers.get('User-Agent') || '';
    const isKu9Player = await isStrictKu9Player(userAgent);
    
    if (!isKu9Player) {
      // 不是酷9播放器
      await logAccess(env, request, safeFilename, 'blocked', '酷9: 非酷9播放器访问', 
                     userAgent, 
                     request.headers.get('CF-Connecting-IP'),
                     'ku9');
      
      return new Response('仅限酷9播放器访问', { 
        status: 403,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }
    
    // 验证token
    if (!providedToken || providedToken !== expectedKu9Token) {
      await logAccess(env, request, safeFilename, 'blocked', '酷9: Token错误', 
                     userAgent, 
                     request.headers.get('CF-Connecting-IP'),
                     'ku9');
      
      return new Response('Token错误', { 
        status: 403,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }

    // 酷9播放器验证通过，记录日志
    await logAccess(env, request, safeFilename, 'allowed', '酷9: 专属Token访问', 
                   userAgent, 
                   request.headers.get('CF-Connecting-IP'),
                   'ku9');
    
    // 更新酷9配置中的最后使用时间
    ku9Config.lastUsed = Date.now();
    ku9Config.accessCount = (ku9Config.accessCount || 0) + 1;
    await env.MY_TEXT_STORAGE.put('ku9_config', JSON.stringify(ku9Config));

    // 动态时间加密内容
    const timestamp = Math.floor(Date.now() / 60000);
    const encryptedContent = dynamicEncrypt(content, timestamp);
    
    // 设置Content-Type
    let contentType = 'text/plain; charset=utf-8';
    if (safeFilename.endsWith('.json')) {
      contentType = 'application/json; charset=utf-8';
    } else if (safeFilename.endsWith('.m3u') || safeFilename.endsWith('.m3u8')) {
      contentType = 'audio/x-mpegurl; charset=utf-8';
    } else if (safeFilename.endsWith('.txt')) {
      contentType = 'text/plain; charset=utf-8';
    } else if (safeFilename.endsWith('.xml')) {
      contentType = 'application/xml; charset=utf-8';
    }
    
    // 返回加密内容
    return new Response(encryptedContent, {
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Client-Time, X-Ku9-Token',
        'X-Content-Type-Options': 'nosniff',
        'X-Encryption-Time': timestamp.toString(),
        'X-Encryption-Version': '2.0',
        'X-Ku9-Access': 'authorized',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Content-Disposition': `inline; filename="${encodeURIComponent('ku9_' + safeFilename)}"`
      }
    });
    
  } catch (error) {
    // 记录错误日志
    await logAccess(env, request, filename, 'error', `酷9: ${error.message}`, 
                   request.headers.get('User-Agent'), 
                   request.headers.get('CF-Connecting-IP'),
                   'ku9');
    
    console.error('酷9文件下载错误:', error);
    return new Response(`酷9下载错误: ${error.message}`, { 
      status: 500,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }
}

// 严格的酷9播放器检测
async function isStrictKu9Player(userAgent) {
  if (!userAgent) return false;
  
  const ua = userAgent.trim();
  const uaLower = ua.toLowerCase();
  
  // 规则1：精确匹配"MTV"
  if (ua === 'MTV') {
    return true;
  }
  
  // 规则2：必须包含酷9关键词
  const ku9Keywords = ['ku9', '酷9', 'k9player', 'k9 player'];
  const hasKu9Keyword = ku9Keywords.some(keyword => uaLower.includes(keyword));
  
  if (!hasKu9Keyword) {
    return false;
  }
  
  // 规则3：不能包含浏览器特征
  const browserKeywords = ['mozilla', 'chrome', 'safari', 'edge', 'firefox', 'webkit', 'gecko'];
  const hasBrowserKeyword = browserKeywords.some(keyword => uaLower.includes(keyword));
  
  if (hasBrowserKeyword) {
    return false;
  }
  
  // 规则4：应该包含播放器或Android特征
  const playerKeywords = ['android', 'okhttp', 'dalvik', 'player', '播放器'];
  const hasPlayerKeyword = playerKeywords.some(keyword => uaLower.includes(keyword));
  
  return hasPlayerKeyword;
}

// 安全文件下载处理 - 修复酷9播放器访问问题
async function handleSecureFileDownload(filename, request, env) {
  try {
    // 解码文件名
    const decodedFilename = decodeURIComponent(filename);
    const safeFilename = sanitizeFilename(decodedFilename);
    const content = await env.MY_TEXT_STORAGE.get('file_' + safeFilename);
    
    if (!content) {
      await logAccess(env, request, safeFilename, 'blocked', '文件不存在', 
                     request.headers.get('User-Agent'), 
                     request.headers.get('CF-Connecting-IP'));
      
      return new Response('文件不存在', { 
        status: 404,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }

    // 检查管理令牌 - 如果存在管理令牌，返回原始内容
    const url = new URL(request.url);
    const managementToken = url.searchParams.get('manage_token');
    const expectedToken = await env.MY_TEXT_STORAGE.get('management_token') || 'default_manage_token_2024';
    
    if (managementToken && managementToken === expectedToken) {
      await logAccess(env, request, safeFilename, 'allowed', '管理访问', 
                     request.headers.get('User-Agent'), 
                     request.headers.get('CF-Connecting-IP'));
      
      let contentType = 'text/plain; charset=utf-8';
      if (safeFilename.endsWith('.json')) {
        contentType = 'application/json; charset=utf-8';
      } else if (safeFilename.endsWith('.m3u') || safeFilename.endsWith('.m3u8')) {
        contentType = 'audio/x-mpegurl; charset=utf-8';
      } else if (safeFilename.endsWith('.txt')) {
        contentType = 'text/plain; charset=utf-8';
      } else if (safeFilename.endsWith('.html') || safeFilename.endsWith('.htm')) {
        contentType = 'text/html; charset=utf-8';
      } else if (safeFilename.endsWith('.xml')) {
        contentType = 'application/xml; charset=utf-8';
      } else if (safeFilename.endsWith('.php')) {
        contentType = 'text/plain; charset=utf-8';
      }
      
      return new Response(content, {
        headers: {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*',
          'X-Content-Type-Options': 'nosniff',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Content-Disposition': `inline; filename="${encodeURIComponent(safeFilename)}"`
        }
      });
    }

    // 增强的用户代理检测
    const userAgent = request.headers.get('User-Agent') || '';
    const referer = request.headers.get('Referer') || '';
    const accept = request.headers.get('Accept') || '';
    
    // 播放器白名单 - 移除酷9，因为酷9现在走专属通道
    const playerWhitelist = [
      'tvbox', 'tv-box', 'tv.box', '影视仓', 'yingshicang',
      'tivimate', 'tivi mate', 'tivi-mate', 'tivi',
      'vlc', 'videolan', 'kodi', 
      'mx player', 'mxplayer', 'mx',
      'exoplayer', 'exo player',
      'justplayer', 'just player',
      'ottplayer', 'ott player',
      'perfect player', 'perfectplayer',
      'iptv', 'smartiptv', 'smart iptv',
      'stb', 'set-top', 'set top box',
      'android-tv', 'android tv',
      'smarttv', 'smart tv',
      'mag', 'infomir',
      'okhttp', 'okhttp/', 'curl', 'wget',
      'm3u', 'm3u8', 'hls',
      'dalvik'
    ];
    
    // 抓包软件黑名单
    const snifferBlacklist = [
      'httpcanary', '蓝鸟', '黄鸟',
      'fiddler', 'charles', 'wireshark', 'packetcapture',
      'packet sniffer', 'packetsniffer', 'sniffer',
      'mitmproxy', 'burpsuite', 'burp',
      'proxyman', 'stream', 'thor',
      '青花瓷', '小黄鸟', '抓包', '抓包神器',
      'network monitor', 'networkmonitor'
    ];
    
    // 浏览器特征
    const browserKeywords = [
      'mozilla', 'chrome', 'safari', 'edge', 'firefox', 
      'msie', 'trident', 'opera', 'opr', 'webkit',
      'gecko', 'netscape', 'seamonkey', 'epiphany',
      'crios', 'fxios', 'samsungbrowser'
    ];
    
    const lowerUserAgent = userAgent.toLowerCase();
    const lowerAccept = accept.toLowerCase();
    
    // 决策逻辑
    let allowAccess = false;
    let reason = '';
    
    // 检查是否是酷9播放器（应该使用专属通道）
    const isKu9 = lowerUserAgent.includes('ku9') || 
                  lowerUserAgent.includes('酷9') || 
                  userAgent === 'MTV';
    
    if (isKu9) {
      // 酷9播放器应该使用/ku9/通道
      allowAccess = false;
      reason = '酷9播放器请使用专属通道';
    }
    // 规则1：检查播放器白名单
    else if (playerWhitelist.some(player => lowerUserAgent.includes(player))) {
      allowAccess = true;
      reason = '播放器访问';
    }
    // 规则2：检查是否是抓包软件
    else if (snifferBlacklist.some(sniffer => lowerUserAgent.includes(sniffer))) {
      allowAccess = false;
      reason = '抓包软件被阻止';
    }
    // 规则3：检查浏览器特征
    else if (browserKeywords.some(browser => lowerUserAgent.includes(browser)) && 
             (lowerAccept.includes('text/html') || lowerAccept.includes('application/xhtml+xml'))) {
      allowAccess = false;
      reason = '浏览器访问被阻止';
    }
    // 规则4：其他情况
    else {
      const hasPlayerFeatures = 
        lowerUserAgent.includes('player') ||
        lowerUserAgent.includes('播放器') ||
        lowerAccept.includes('audio/') ||
        lowerAccept.includes('video/') ||
        lowerAccept.includes('application/vnd.apple.mpegurl') ||
        lowerAccept.includes('application/x-mpegurl');
      
      if (hasPlayerFeatures) {
        allowAccess = true;
        reason = '播放器特征匹配';
      } else {
        allowAccess = false;
        reason = '未识别的客户端';
      }
    }
    
    // 如果不允许访问，记录日志并返回加密的错误页面
    if (!allowAccess) {
      await logAccess(env, request, safeFilename, 'blocked', reason, userAgent, 
                     request.headers.get('CF-Connecting-IP'));
      
      const timestamp = Math.floor(Date.now() / 60000);
      const errorMessage = `访问被拒绝 (${reason}) - ${new Date().toISOString()}`;
      const encryptedError = dynamicEncrypt(errorMessage, timestamp);
      
      return new Response(encryptedError, { 
        status: 403,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'X-Content-Type-Options': 'nosniff',
          'X-Access-Reason': reason,
          'X-Encryption-Time': timestamp.toString()
        }
      });
    }
    
    // 记录允许的访问日志
    await logAccess(env, request, safeFilename, 'allowed', reason, userAgent, 
                   request.headers.get('CF-Connecting-IP'));
    
    // 动态时间加密内容
    const timestamp = Math.floor(Date.now() / 60000);
    const encryptedContent = dynamicEncrypt(content, timestamp);
    
    // 设置Content-Type
    let contentType = 'text/plain; charset=utf-8';
    if (safeFilename.endsWith('.json')) {
      contentType = 'application/json; charset=utf-8';
    } else if (safeFilename.endsWith('.m3u') || safeFilename.endsWith('.m3u8')) {
      contentType = 'audio/x-mpegurl; charset=utf-8';
    } else if (safeFilename.endsWith('.txt')) {
      contentType = 'text/plain; charset=utf-8';
    } else if (safeFilename.endsWith('.html') || safeFilename.endsWith('.htm')) {
      contentType = 'text/html; charset=utf-8';
    } else if (safeFilename.endsWith('.xml')) {
      contentType = 'application/xml; charset=utf-8';
    } else if (safeFilename.endsWith('.php')) {
      contentType = 'text/plain; charset=utf-8';
    }
    
    // 返回加密内容
    return new Response(encryptedContent, {
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Client-Time, X-Management-Access',
        'X-Content-Type-Options': 'nosniff',
        'X-Encryption-Time': timestamp.toString(),
        'X-Encryption-Version': '1.0',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Content-Disposition': `inline; filename="${encodeURIComponent('encrypted_' + safeFilename)}"`
      }
    });
    
  } catch (error) {
    await logAccess(env, request, filename, 'error', error.message, 
                   request.headers.get('User-Agent'), 
                   request.headers.get('CF-Connecting-IP'));
    
    console.error('安全文件下载错误:', error);
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

// 设置酷9专属token
async function handleSetKu9Token(request, env) {
  try {
    const url = new URL(request.url);
    const managementToken = url.searchParams.get('manage_token');
    const expectedToken = await env.MY_TEXT_STORAGE.get('management_token') || 'default_manage_token_2024';
    
    // 检查管理令牌
    if (!managementToken || managementToken !== expectedToken) {
      return new Response(JSON.stringify({
        success: false,
        error: '未授权访问'
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }
    
    const data = await request.json();
    const newToken = data.token;
    
    // 获取现有配置
    const ku9Config = await getKu9Config(env);
    
    // 更新token
    if (newToken === null) {
      // 重置token
      delete ku9Config.token;
      delete ku9Config.lastUsed;
      delete ku9Config.accessCount;
    } else {
      ku9Config.token = newToken;
      ku9Config.updatedAt = Date.now();
    }
    
    // 保存配置
    await env.MY_TEXT_STORAGE.put('ku9_config', JSON.stringify(ku9Config));
    
    return new Response(JSON.stringify({
      success: true,
      message: newToken === null ? 'Token已重置' : 'Token设置成功'
    }), {
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  } catch (error) {
    console.error('设置酷9Token错误:', error);
    return new Response(JSON.stringify({
      success: false,
      error: `设置酷9Token失败: ${error.message}`
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }
}

// 获取酷9状态
async function handleKu9Status(request, env) {
  try {
    const url = new URL(request.url);
    const managementToken = url.searchParams.get('manage_token');
    const expectedToken = await env.MY_TEXT_STORAGE.get('management_token') || 'default_manage_token_2024';
    
    // 检查管理令牌
    if (!managementToken || managementToken !== expectedToken) {
      return new Response(JSON.stringify({
        success: false,
        error: '未授权访问'
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }
    
    const action = url.searchParams.get('action');
    
    if (action === 'files') {
      // 获取文件列表
      const allFiles = await env.MY_TEXT_STORAGE.list();
      const files = [];
      
      for (const key of allFiles.keys) {
        if (key.name.startsWith('file_')) {
          const filename = key.name.substring(5);
          const content = await env.MY_TEXT_STORAGE.get(key.name);
          files.push({
            name: filename,
            size: content ? content.length : 0
          });
        }
      }
      
      return new Response(JSON.stringify({
        success: true,
        files: files
      }), {
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    } else {
      // 获取酷9配置
      const ku9Config = await getKu9Config(env);
      
      return new Response(JSON.stringify({
        success: true,
        config: ku9Config
      }), {
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }
  } catch (error) {
    console.error('获取酷9状态错误:', error);
    return new Response(JSON.stringify({
      success: false,
      error: `获取酷9状态失败: ${error.message}`
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }
}

// 生成酷9链接
async function handleGenerateKu9Link(request, env) {
  try {
    const url = new URL(request.url);
    const managementToken = url.searchParams.get('manage_token');
    const expectedToken = await env.MY_TEXT_STORAGE.get('management_token') || 'default_manage_token_2024';
    
    // 检查管理令牌
    if (!managementToken || managementToken !== expectedToken) {
      return new Response(JSON.stringify({
        success: false,
        error: '未授权访问'
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }
    
    const data = await request.json();
    const filename = data.filename;
    
    if (!filename) {
      return new Response(JSON.stringify({
        success: false,
        error: '缺少文件名'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }
    
    // 检查文件是否存在
    const safeFilename = sanitizeFilename(filename);
    const content = await env.MY_TEXT_STORAGE.get('file_' + safeFilename);
    
    if (!content) {
      return new Response(JSON.stringify({
        success: false,
        error: '文件不存在'
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }
    
    const domain = request.headers.get('host') || 'localhost';
    const link = 'https://' + domain + '/ku9/' + encodeURIComponent(safeFilename);
    
    return new Response(JSON.stringify({
      success: true,
      link: link,
      filename: safeFilename
    }), {
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  } catch (error) {
    console.error('生成酷9链接错误:', error);
    return new Response(JSON.stringify({
      success: false,
      error: `生成酷9链接失败: ${error.message}`
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }
}

// 记录访问日志函数 - 增强版，添加来源参数
async function logAccess(env, request, filename, status, reason, userAgent, ip, source = 'normal') {
  try {
    const timestamp = Date.now();
    const logId = `log_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
    
    const logData = {
      timestamp,
      filename: filename || 'unknown',
      status, // 'allowed' 或 'blocked' 或 'error'
      reason: reason || 'unknown',
      userAgent: userAgent || request.headers.get('User-Agent') || 'unknown',
      ip: ip || request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown',
      referer: request.headers.get('Referer') || '',
      accept: request.headers.get('Accept') || '',
      url: request.url,
      method: request.method,
      source: source // 添加来源：normal, ku9, management
    };
    
    await env.MY_TEXT_STORAGE.put(logId, JSON.stringify(logData), { 
      expirationTtl: 2592000
    });
    
    console.log('✅ 日志已保存:', source, filename, status, reason);
    
    return true;
  } catch (error) {
    console.error('❌ 记录访问日志失败:', error);
    return false;
  }
}

// 加密函数 - 动态时间加密
function dynamicEncrypt(content, timestamp) {
  if (!content) return '';
  
  const timeKey = timestamp.toString();
  let encrypted = '';
  
  for (let i = 0; i < content.length; i++) {
    const charCode = content.charCodeAt(i);
    const timeIndex = i % timeKey.length;
    const timeChar = timeKey.charCodeAt(timeIndex);
    
    let encryptedChar = charCode ^ timeChar;
    encryptedChar = (encryptedChar + i + timestamp % 256) % 65536;
    
    encrypted += encryptedChar.toString(16).padStart(4, '0');
  }
  
  return encrypted;
}

// 解密函数
function dynamicDecrypt(encrypted, timestamp) {
  if (!encrypted || encrypted.length % 4 !== 0) return '';
  
  let decrypted = '';
  const timeKey = timestamp.toString();
  
  for (let i = 0; i < encrypted.length; i += 4) {
    const hex = encrypted.substr(i, 4);
    const encryptedChar = parseInt(hex, 16);
    
    const timeIndex = (i / 4) % timeKey.length;
    const timeChar = timeKey.charCodeAt(timeIndex);
    
    let charCode = (encryptedChar - i/4 - timestamp % 256 + 65536) % 65536;
    charCode = charCode ^ timeChar;
    
    decrypted += String.fromCharCode(charCode);
  }
  
  return decrypted;
}

// 以下函数保持不变（管理页面相关函数）
// handleManagementPage, handleLogsPage, getManagementLoginHTML, getSearchHTML, 
// getLogsHTML, handleReadFile, handleUploadFile, handleUpdatePassword,
// handleGetEncryptionKey, handleLogDetail, handleUADetail, 
// handleExportLogs, handleClearLogs, parseFormData, sanitizeFilename, formatFileSize

// 由于代码长度限制，我只列出了主要修改部分。以下是一些需要保持不变的函数，你可以从原始代码中复制：
// 1. handleManagementPage
// 2. handleLogsPage
// 3. getManagementLoginHTML
// 4. getSearchHTML
// 5. getLogsHTML
// 6. handleReadFile
// 7. handleUploadFile
// 8. handleUpdatePassword
// 9. handleGetEncryptionKey
// 10. handleLogDetail
// 11. handleUADetail
// 12. handleExportLogs
// 13. handleClearLogs
// 14. parseFormData
// 15. sanitizeFilename
// 16. formatFileSize

// 这些函数的功能与原始版本相同，只需要确保它们被包含在最终的代码中。
