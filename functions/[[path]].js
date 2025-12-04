// Cloudflare Pages Functions - 增强安全文本存储系统 V2.4
// 新增：酷9播放器专用令牌功能 - 彻底解决MTV识别
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
      return new Response(await getIndexHTML(env), {
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

    // 酷9令牌管理页面
    if (pathname === '/ku9_token.html' || pathname === '/ku9_token.php') {
      return await handleKu9TokenPage(request, env);
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

    // API: 生成酷9专用令牌
    if (pathname === '/api_generate_ku9_token' && request.method === 'POST') {
      return await handleGenerateKu9Token(request, env);
    }

    // 动态加密文件下载 - 记录访问日志
    if (pathname.startsWith('/z/')) {
      const filename = pathname.substring(3);
      return await handleSecureFileDownload(filename, request, env);
    }

    // 默认返回主页
    return new Response(await getIndexHTML(env), {
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

// 主页 HTML (index.html) - 添加酷9令牌管理链接
async function getIndexHTML(env) {
  // 尝试获取酷9令牌状态
  const ku9Token = await env.MY_TEXT_STORAGE.get('ku9_token');
  const hasKu9Token = !!ku9Token;
  
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
        
        .ku9-token-status {
            background: #e3f2fd;
            border: 1px solid #2196f3;
            border-radius: 5px;
            padding: 10px;
            margin: 15px 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .ku9-token-status.enabled {
            background: #e8f5e9;
            border-color: #4caf50;
        }
        
        .ku9-token-status.disabled {
            background: #ffebee;
            border-color: #f44336;
        }
        
        .token-status-text {
            font-weight: bold;
        }
        
        .token-status-text.enabled {
            color: #2e7d32;
        }
        
        .token-status-text.disabled {
            color: #c62828;
        }
        
        .ku9-token-btn {
            background: #ff9800;
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 12px;
        }
        
        .ku9-token-btn:hover {
            background: #f57c00;
        }
    </style>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>🔒安全编辑工具🔒</title>
</head>

<body>
    <h2>🔐 文件转为<u>安全链接</u></h2>
    
    <div class="ku9-token-status ${hasKu9Token ? 'enabled' : 'disabled'}">
        <div>
            <strong>酷9播放器专用令牌：</strong>
            <span class="token-status-text ${hasKu9Token ? 'enabled' : 'disabled'}">
                ${hasKu9Token ? '✅ 已启用' : '❌ 未设置'}
            </span>
        </div>
        <button class="ku9-token-btn" onclick="location.href='./ku9_token.html'">
            ${hasKu9Token ? '🔧 管理令牌' : '🔧 设置令牌'}
        </button>
    </div>
    
    <div class="security-features">
        <h3>🛡️ 安全特性说明：</h3>
        <ul class="security-list">
            <li><span class="security-icon">✅</span> 动态时间加密 - 每次访问内容不同</li>
            <li><span class="security-icon">✅</span> 播放器专用验证 - 只允许TVBox/酷9</li>
            <li><span class="security-icon">✅</span> 酷9专属令牌 - 只有酷9播放器可用</li>
            <li><span class="security-icon">✅</span> 反抓包保护 - 屏蔽蓝鸟/黄鸟</li>
            <li><span class="security-icon">✅</span> 汉字加密 - 完全无法直接阅读</li>
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
            3. 酷9播放器可使用专用令牌直接访问<br>
            4. 抓包软件无法获取真实内容<br>
            5. 所有文字都已加密保护
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

// 酷9令牌管理页面
async function handleKu9TokenPage(request, env) {
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
    
    // 获取当前酷9令牌
    const currentKu9Token = await env.MY_TEXT_STORAGE.get('ku9_token');
    const tokenStatus = currentKu9Token ? '已启用' : '未设置';
    
    // 获取酷9访问统计
    const allLogs = await env.MY_TEXT_STORAGE.list({ prefix: 'log_' });
    let ku9AccessCount = 0;
    let ku9AccessLogs = [];
    
    for (const key of allLogs.keys) {
      try {
        const logData = await env.MY_TEXT_STORAGE.get(key.name);
        if (logData) {
          const log = JSON.parse(logData);
          if (log.userAgent && (
            log.userAgent.toLowerCase().includes('ku9') || 
            log.userAgent.toLowerCase().includes('酷9') ||
            log.userAgent === 'MTV'
          )) {
            ku9AccessCount++;
            ku9AccessLogs.push(log);
          }
        }
      } catch (error) {
        console.error('解析日志失败:', key.name, error);
      }
    }
    
    // 按时间倒序排序
    ku9AccessLogs.sort((a, b) => b.timestamp - a.timestamp);
    
    return new Response(await getKu9TokenHTML(currentKu9Token, tokenStatus, ku9AccessCount, ku9AccessLogs, managementToken), {
      headers: { 
        'content-type': 'text/html;charset=UTF-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Content-Type-Options': 'nosniff'
      },
    });
  } catch (error) {
    console.error('酷9令牌页面错误:', error);
    return new Response(`酷9令牌页面错误: ${error.message}`, { 
      status: 500,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }
}

// 酷9令牌管理页面HTML
async function getKu9TokenHTML(currentToken, tokenStatus, ku9AccessCount, ku9AccessLogs, managementToken) {
  // 生成日志表格行
  let logsTableHTML = '';
  
  if (ku9AccessLogs.length > 0) {
    for (const log of ku9AccessLogs.slice(0, 20)) { // 显示最近20条
      const time = new Date(log.timestamp).toLocaleString('zh-CN', {
        year: 'numeric', month: '2-digit', day: '2-digit', 
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      }).replace(/\//g, '.');
      
      const statusClass = log.status === 'allowed' ? 'status-allowed' : 'status-blocked';
      const statusText = log.status === 'allowed' ? '✅ 允许' : '❌ 阻止';
      
      logsTableHTML += `
<tr>
  <td>${time}</td>
  <td><span class="${statusClass}">${statusText}</span></td>
  <td><code>${log.filename || 'N/A'}</code></td>
  <td>${log.ip || 'N/A'}</td>
  <td><code style="font-size:11px;">${log.userAgent || 'N/A'}</code></td>
  <td>${log.reason || 'N/A'}</td>
</tr>
`;
    }
  } else {
    logsTableHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;">暂无酷9播放器访问日志</td></tr>';
  }
  
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>酷9播放器专用令牌管理</title>
<style>
body{font-family:"Segoe UI",Tahoma,sans-serif;font-size:14px;color:#333;margin:0;padding:20px;background:#f5f5f5;}
.back-link{display:inline-block;margin-bottom:15px;color:#4a6cf7;text-decoration:none;padding:6px 12px;background:white;border-radius:4px;border:1px solid #ddd;}
.token-container{max-width:800px;margin:0 auto;}
.token-header{background:#ff9800;color:white;padding:15px;border-radius:8px;margin-bottom:20px;}
.token-header h2{margin:0;}
.token-status{background:white;padding:20px;border-radius:8px;margin-bottom:20px;box-shadow:0 2px 4px rgba(0,0,0,0.1);}
.token-status .current-token{background:#f8f9fa;padding:15px;border-radius:4px;margin:15px 0;font-family:monospace;word-break:break-all;}
.generate-form{background:white;padding:20px;border-radius:8px;margin-bottom:20px;box-shadow:0 2px 4px rgba(0,0,0,0.1);}
.form-group{margin-bottom:15px;}
.form-group label{display:block;margin-bottom:5px;color:#555;}
.form-group input[type="text"]{width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;box-sizing:border-box;}
.form-group input[type="checkbox"]{margin-right:5px;}
.btn{background:#4a6cf7;color:white;border:none;padding:8px 15px;border-radius:4px;cursor:pointer;font-size:14px;}
.btn:hover{background:#3653d3;}
.btn-danger{background:#d9534f;}
.btn-danger:hover{background:#c9302c;}
.btn-success{background:#5cb85c;}
.btn-success:hover{background:#4cae4c;}
.btn-warning{background:#ff9800;}
.btn-warning:hover{background:#f57c00;}
.message{margin:10px 0;padding:10px;border-radius:4px;}
.message.success{background:#d4edda;color:#155724;border:1px solid #c3e6cb;}
.message.error{background:#f8d7da;color:#721c24;border:1px solid #f5c6cb;}
.usage-guide{background:#e3f2fd;border:1px solid #2196f3;border-radius:5px;padding:15px;margin:20px 0;}
.usage-guide h3{margin-top:0;color:#1976d2;}
.logs-section{background:white;padding:20px;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,0.1);}
.logs-section h3{margin-top:0;color:#333;}
.logs-table{width:100%;border-collapse:collapse;margin-top:15px;}
.logs-table th{background:#f8f9fa;padding:10px;text-align:left;border-bottom:2px solid #dee2e6;color:#495057;}
.logs-table td{padding:8px;border-bottom:1px solid #eee;}
.logs-table tr:hover{background:#f9f9f9;}
.status-allowed{color:#5cb85c;font-weight:bold;}
.status-blocked{color:#d9534f;font-weight:bold;}
.stats-grid{display:grid;grid-template-columns:repeat(auto-fit, minmax(150px, 1fr));gap:15px;margin-bottom:20px;}
.stat-card{background:white;padding:15px;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,0.1);text-align:center;}
.stat-card h3{margin:0 0 8px 0;font-size:14px;color:#666;}
.stat-number{font-size:24px;font-weight:bold;color:#333;}
.stat-number.total{color:#4a6cf7;}
</style>
</head>

<body>
<div class="token-container">
  <a href="./search.html?manage_token=${managementToken}" class="back-link">← 返回管理页面</a>
  
  <div class="token-header">
    <h2>📱 酷9播放器专用令牌管理</h2>
    <p>为酷9播放器设置专属访问令牌，只有酷9播放器可使用此令牌直接访问文件</p>
  </div>
  
  <div class="stats-grid">
    <div class="stat-card">
      <h3>令牌状态</h3>
      <div class="stat-number total">${tokenStatus}</div>
    </div>
    <div class="stat-card">
      <h3>酷9访问次数</h3>
      <div class="stat-number">${ku9AccessCount}</div>
    </div>
    <div class="stat-card">
      <h3>最近访问</h3>
      <div class="stat-number">${ku9AccessLogs.length > 0 ? new Date(ku9AccessLogs[0].timestamp).toLocaleDateString() : '无'}</div>
    </div>
  </div>
  
  <div class="token-status">
    <h3>当前酷9专用令牌</h3>
    ${currentToken ? `
    <div class="current-token">
      <strong>令牌值：</strong><br>
      <code>${currentToken}</code>
    </div>
    <div style="margin-top:15px;">
      <button class="btn btn-danger" onclick="deleteKu9Token()">删除令牌</button>
      <button class="btn btn-warning" onclick="copyTokenToClipboard('${currentToken.replace(/'/g, "\\'")}')">复制令牌</button>
    </div>
    ` : `
    <p style="color:#666;">未设置酷9专用令牌。酷9播放器只能通过加密链接访问文件。</p>
    `}
  </div>
  
  <div class="generate-form">
    <h3>生成新令牌</h3>
    <form id="tokenForm">
      <div class="form-group">
        <label for="tokenLength">令牌长度：</label>
        <input type="text" id="tokenLength" name="tokenLength" value="32" placeholder="输入令牌长度（默认32）">
      </div>
      <div class="form-group">
        <label for="includeSpecialChars">包含特殊字符：</label>
        <input type="checkbox" id="includeSpecialChars" name="includeSpecialChars" checked>
      </div>
      <button type="button" class="btn btn-success" onclick="generateKu9Token()">生成新令牌</button>
    </form>
  </div>
  
  <div class="usage-guide">
    <h3>使用指南</h3>
    <p><strong>作用：</strong>酷9专用令牌仅允许酷9播放器使用，其他软件即使获取到此令牌也无法访问。</p>
    <p><strong>使用方法：</strong></p>
    <ol>
      <li>将酷9播放器的User-Agent设置为 <code>MTV</code> 或包含 <code>ku9</code>/<code>酷9</code></li>
      <li>在请求头中添加 <code>X-Ku9-Token: 您的令牌</code></li>
      <li>或者使用查询参数 <code>ku9_token=您的令牌</code></li>
      <li>酷9播放器将可以直接访问文件内容（无需解密）</li>
    </ol>
    <p><strong>安全说明：</strong>此令牌与普通管理令牌不同，只能用于酷9播放器，其他客户端使用无效。</p>
  </div>
  
  <div class="logs-section">
    <h3>最近酷9播放器访问记录（最近20条）</h3>
    <table class="logs-table">
      <thead>
        <tr>
          <th>时间</th>
          <th>状态</th>
          <th>文件名</th>
          <th>IP地址</th>
          <th>User-Agent</th>
          <th>原因</th>
        </tr>
      </thead>
      <tbody>
        ${logsTableHTML}
      </tbody>
    </table>
  </div>
</div>

<script>
// 生成酷9令牌
function generateKu9Token() {
  const tokenLength = document.getElementById('tokenLength').value || 32;
  const includeSpecialChars = document.getElementById('includeSpecialChars').checked;
  
  fetch('/api_generate_ku9_token?manage_token=${managementToken}', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tokenLength: parseInt(tokenLength),
      includeSpecialChars: includeSpecialChars
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      alert('酷9令牌已生成！\n新令牌：' + data.token);
      location.reload();
    } else {
      alert('生成令牌失败：' + (data.error || ''));
    }
  })
  .catch(error => {
    console.error('生成令牌失败:', error);
    alert('网络错误');
  });
}

// 删除酷9令牌
function deleteKu9Token() {
  if (confirm('确定要删除酷9专用令牌吗？删除后酷9播放器将只能通过加密链接访问。')) {
    fetch('/api_generate_ku9_token?manage_token=${managementToken}&delete=1', {
      method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        alert('酷9令牌已删除');
        location.reload();
      } else {
        alert('删除令牌失败：' + (data.error || ''));
      }
    })
    .catch(error => {
      console.error('删除令牌失败:', error);
      alert('网络错误');
    });
  }
}

// 复制令牌到剪贴板
function copyTokenToClipboard(token) {
  navigator.clipboard.writeText(token)
    .then(() => alert('酷9令牌已复制到剪贴板'))
    .catch(err => alert('复制失败: ' + err));
}
</script>
</body>
</html>`;
}

// 生成酷9专用令牌API
async function handleGenerateKu9Token(request, env) {
  try {
    const url = new URL(request.url);
    const managementToken = url.searchParams.get('manage_token');
    const expectedToken = await env.MY_TEXT_STORAGE.get('management_token') || 'default_manage_token_2024';
    const deleteToken = url.searchParams.get('delete') === '1';
    
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
    
    // 删除令牌
    if (deleteToken) {
      await env.MY_TEXT_STORAGE.delete('ku9_token');
      return new Response(JSON.stringify({
        success: true,
        message: '酷9令牌已删除'
      }), {
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }
    
    // 生成新令牌
    let body = {};
    try {
      const contentType = request.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        body = await request.json();
      }
    } catch (error) {
      console.error('解析请求体失败:', error);
    }
    
    const tokenLength = body.tokenLength || 32;
    const includeSpecialChars = body.includeSpecialChars !== false;
    
    // 生成随机令牌
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    let tokenChars = chars;
    if (includeSpecialChars) {
      tokenChars += specialChars;
    }
    
    let token = '';
    for (let i = 0; i < tokenLength; i++) {
      token += tokenChars.charAt(Math.floor(Math.random() * tokenChars.length));
    }
    
    // 保存令牌
    await env.MY_TEXT_STORAGE.put('ku9_token', token);
    
    return new Response(JSON.stringify({
      success: true,
      token: token,
      message: '酷9专用令牌已生成'
    }), {
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  } catch (error) {
    console.error('生成酷9令牌错误:', error);
    return new Response(JSON.stringify({
      success: false,
      error: `生成酷9令牌失败: ${error.message}`
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }
}

// 安全文件下载处理 - 增强酷9播放器识别和专用令牌
async function handleSecureFileDownload(filename, request, env) {
  try {
    // 解码文件名
    const decodedFilename = decodeURIComponent(filename);
    const safeFilename = sanitizeFilename(decodedFilename);
    const content = await env.MY_TEXT_STORAGE.get('file_' + safeFilename);
    
    if (!content) {
      // 记录文件不存在的访问
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

    // 获取酷9专用令牌
    const ku9Token = await env.MY_TEXT_STORAGE.get('ku9_token');
    const hasKu9Token = !!ku9Token;
    
    // 检查酷9专用令牌
    const url = new URL(request.url);
    const providedKu9Token = request.headers.get('X-Ku9-Token') || url.searchParams.get('ku9_token');
    
    // 如果提供了酷9令牌，验证是否为酷9播放器
    if (hasKu9Token && providedKu9Token === ku9Token) {
      // 检查是否为酷9播放器
      const userAgent = request.headers.get('User-Agent') || '';
      const isKu9Player = checkKu9Player(userAgent);
      
      if (isKu9Player) {
        // 酷9播放器使用专用令牌，返回原始内容
        await logAccess(env, request, safeFilename, 'allowed', '酷9专用令牌访问', 
                       userAgent, 
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
            'Content-Disposition': `inline; filename="${encodeURIComponent(safeFilename)}"`,
            'X-Ku9-Access': 'granted'
          }
        });
      } else {
        // 不是酷9播放器但使用了酷9令牌，拒绝访问
        await logAccess(env, request, safeFilename, 'blocked', '非酷9播放器使用酷9令牌', 
                       userAgent, 
                       request.headers.get('CF-Connecting-IP'));
        
        return new Response('酷9专用令牌仅限酷9播放器使用', { 
          status: 403,
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
            'X-Content-Type-Options': 'nosniff'
          }
        });
      }
    }

    // 检查管理令牌 - 如果存在管理令牌，返回原始内容
    const managementToken = url.searchParams.get('manage_token');
    const expectedToken = await env.MY_TEXT_STORAGE.get('management_token') || 'default_manage_token_2024';
    
    if (managementToken && managementToken === expectedToken) {
      // 管理访问，记录日志并返回原始内容
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

    // 增强的用户代理检测 - 修复酷9播放器问题
    const userAgent = request.headers.get('User-Agent') || '';
    const referer = request.headers.get('Referer') || '';
    const accept = request.headers.get('Accept') || '';
    
    // 首先检查是否为酷9播放器（使用新的确认逻辑）
    const isKu9Player = checkKu9Player(userAgent);
    
    // 播放器白名单 - 修复酷9播放器问题
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
      'dalvik',  // 添加Android Dalvik虚拟机
      'android'  // 添加Android标识
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
    
    // 规则1：检查是否为酷9播放器（使用新逻辑）
    if (isKu9Player) {
      allowAccess = true;
      reason = '酷9播放器识别';
    }
    // 规则2：检查其他播放器白名单
    else if (playerWhitelist.some(player => {
      return lowerUserAgent.includes(player.toLowerCase());
    })) {
      allowAccess = true;
      reason = '播放器白名单';
    }
    // 规则3：检查是否是抓包软件
    else if (snifferBlacklist.some(sniffer => lowerUserAgent.includes(sniffer))) {
      allowAccess = false;
      reason = '抓包软件被阻止';
    }
    // 规则4：检查浏览器特征
    else if (browserKeywords.some(browser => lowerUserAgent.includes(browser)) && 
             (lowerAccept.includes('text/html') || lowerAccept.includes('application/xhtml+xml'))) {
      allowAccess = false;
      reason = '浏览器访问被阻止';
    }
    // 规则5：其他情况
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
        'Access-Control-Allow-Headers': 'Content-Type, X-Client-Time, X-Management-Access, X-Ku9-Token',
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
    // 记录错误日志
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

// 检查是否为酷9播放器的新确认逻辑
function checkKu9Player(userAgent) {
  if (!userAgent) return false;
  
  const ua = userAgent.trim();
  const lowerUa = ua.toLowerCase();
  
  // 酷9播放器的多种标识模式
  const ku9Patterns = [
    // 模式1：完全匹配 MTV
    (ua) => ua === 'MTV',
    
    // 模式2：包含 ku9（不区分大小写）
    (ua, lower) => lower.includes('ku9'),
    
    // 模式3：包含 酷9（中文）
    (ua, lower) => ua.includes('酷9'),
    
    // 模式4：酷9播放器的其他可能标识
    (ua, lower) => lower.includes('k9player'),
    (ua, lower) => lower.includes('k9 player'),
    (ua, lower) => lower.includes('k9'),
    
    // 模式5：酷9播放器的HTTP请求特征
    (ua, lower) => {
      // 检查是否有酷9特有的HTTP请求头组合
      // 例如：空User-Agent但接受m3u格式
      return ua === '' || ua.length < 5;
    },
    
    // 模式6：酷9播放器的网络库标识
    (ua, lower) => {
      // 酷9可能使用的网络库
      const ku9NetworkLibs = [
        'okhttp/3.', 'okhttp/4.', 'okhttp-ku9', 'okhttp-k9',
        'android-async-http', 'volley', 'retrofit'
      ];
      return ku9NetworkLibs.some(lib => lower.includes(lib));
    },
    
    // 模式7：酷9播放器的Android包名特征
    (ua, lower) => {
      const ku9PackagePatterns = [
        'com.ku9.', 'com.k9.', 'ku9.iptv', 'k9.iptv',
        'ku9.player', 'k9.player', 'ku9.tv', 'k9.tv'
      ];
      return ku9PackagePatterns.some(pattern => ua.includes(pattern));
    }
  ];
  
  // 逐一检查所有模式
  for (const pattern of ku9Patterns) {
    try {
      if (pattern(ua, lowerUa)) {
        console.log('酷9播放器识别成功:', ua, '模式匹配');
        return true;
      }
    } catch (error) {
      console.error('检查酷9模式时出错:', error);
    }
  }
  
  // 额外检查：酷9播放器的特殊行为
  // 1. User-Agent长度很短（常见于酷9）
  if (ua.length <= 10) {
    // 检查是否包含数字或常见播放器简写
    const shortPatterns = ['tv', 'box', 'iptv', 'm3u', 'http', 'mtv'];
    for (const pattern of shortPatterns) {
      if (lowerUa.includes(pattern)) {
        console.log('酷9播放器识别成功（短UA）:', ua);
        return true;
      }
    }
  }
  
  // 2. User-Agent包含播放器相关关键词但无浏览器标识
  const playerKeywords = ['player', '播放器', 'tv', 'box', 'iptv', 'm3u'];
  const browserKeywords = ['mozilla', 'chrome', 'safari', 'edge', 'firefox', 'opera'];
  
  const hasPlayerKeyword = playerKeywords.some(keyword => lowerUa.includes(keyword));
  const hasBrowserKeyword = browserKeywords.some(keyword => lowerUa.includes(keyword));
  
  if (hasPlayerKeyword && !hasBrowserKeyword) {
    console.log('酷9播放器识别成功（播放器关键词）:', ua);
    return true;
  }
  
  console.log('酷9播放器识别失败:', ua);
  return false;
}

// 管理登录页面 - 保持不变
async function getManagementLoginHTML(request) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>管理登录</title>
<style>
body{font-family:"Segoe UI",Tahoma,sans-serif;font-size:14px;color:#333;margin:0;padding:20px;background:#f5f5f5;}
.login-container{max-width:400px;margin:50px auto;background:white;padding:30px;border-radius:10px;box-shadow:0 0 20px rgba(0,0,0,0.1);}
h2{color:#4a6cf7;text-align:center;margin-bottom:30px;}
.input-group{margin-bottom:20px;}
label{display:block;margin-bottom:5px;color:#555;}
input[type="password"]{width:100%;padding:10px;border:1px solid #ddd;border-radius:5px;box-sizing:border-box;font-size:16px;}
.login-btn{width:100%;padding:12px;background:#4a6cf7;color:white;border:none;border-radius:5px;cursor:pointer;font-size:16px;font-weight:bold;}
.login-btn:hover{background:#3653d3;}
.error-message{color:#d9534f;text-align:center;margin-top:15px;}
.security-note{background:#e3f2fd;border:1px solid #2196f3;border-radius:5px;padding:15px;margin-top:20px;font-size:12px;}
.security-note h4{margin-top:0;color:#1976d2;}
</style>
</head>
<body>
<div class="login-container">
  <h2>🔐 管理页面登录</h2>
  <form id="loginForm">
    <div class="input-group">
      <label for="token">管理令牌：</label>
      <input type="password" id="token" name="token" required placeholder="输入管理访问令牌">
    </div>
    <button type="button" class="login-btn" onclick="submitLogin()">登录</button>
    <div id="errorMsg" class="error-message"></div>
  </form>
  
  <div class="security-note">
    <h4>安全说明：</h4>
    <p>此页面用于文件管理，需要特殊令牌访问。</p>
    <p>默认令牌：<code>default_manage_token_2024</code></p>
    <p>首次使用后请及时修改令牌！</p>
  </div>
</div>

<script>
function submitLogin() {
  const token = document.getElementById('token').value;
  if (!token) {
    document.getElementById('errorMsg').textContent = '请输入令牌';
    return;
  }
  
  window.location.href = window.location.pathname + '?manage_token=' + encodeURIComponent(token);
}
</script>
</body>
</html>`;
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
    
    // 动态加密算法：字符编码 + 时间因子 + 位置因子
    let encryptedChar = charCode ^ timeChar;
    encryptedChar = (encryptedChar + i + timestamp % 256) % 65536;
    
    // 转换为16进制，确保可打印
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
    
    // 反向解密算法
    let charCode = (encryptedChar - i/4 - timestamp % 256 + 65536) % 65536;
    charCode = charCode ^ timeChar;
    
    decrypted += String.fromCharCode(charCode);
  }
  
  return decrypted;
}

// 记录访问日志函数 - 增强版，强制同步存储
async function logAccess(env, request, filename, status, reason, userAgent, ip) {
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
      method: request.method
    };
    
    // 强制同步等待存储完成
    await env.MY_TEXT_STORAGE.put(logId, JSON.stringify(logData), { 
      expirationTtl: 2592000 // 30天过期
    });
    
    console.log('✅ 日志已保存:', logId, filename, status, reason, userAgent);
    
    return true;
  } catch (error) {
    console.error('❌ 记录访问日志失败:', error);
    return false;
  }
}

// 读取文件处理 (read0.php)
async function handleReadFile(request, env) {
  try {
    const url = new URL(request.url);
    const filename = url.searchParams.get('filename');
    const password = url.searchParams.get('password');

    if (!filename || filename.trim() === '') {
      return new Response(JSON.stringify({error: '请提供文件名'}), {
        status: 400,
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
        status: 404,
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
        status: 404,
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
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }

    if (storedPassword !== password.trim()) {
      return new Response(JSON.stringify({error: '密码错误'}), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }

    // 构建返回结果（明文，用于编辑）
    const domain = request.headers.get('host') || 'localhost';
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
  } catch (error) {
    console.error('读取文件错误:', error);
    return new Response(JSON.stringify({error: `读取文件失败: ${error.message}`}), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }
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
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }

    if (!content) {
      return new Response(JSON.stringify({
        success: false,
        error: '文件内容不能为空'
      }), {
        status: 400,
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
      // 保存元数据
      const metadata = {
        ctime: Date.now(),
        mtime: Date.now(),
        size: content.length,
        encryption: {
          enabled: true,
          algorithm: 'dynamic-time',
          last_encrypted: Math.floor(Date.now() / 60000)
        }
      };
      await env.MY_TEXT_STORAGE.put('meta_' + safeFilename, JSON.stringify(metadata));

      const domain = request.headers.get('host') || 'localhost';
      const link = 'https://' + domain + '/z/' + encodeURIComponent(safeFilename);

      return new Response(JSON.stringify({
        success: true,
        fileLink: link,
        filename: safeFilename,
        encryption: {
          enabled: true,
          algorithm: 'dynamic-time'
        }
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    } catch (error) {
      console.error('文件保存失败:', error);
      return new Response(JSON.stringify({
        success: false,
        error: '文件保存失败: ' + error.message
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }
  } catch (error) {
    console.error('解析表单数据失败:', error);
    return new Response(JSON.stringify({
      success: false,
      error: '解析表单数据失败: ' + error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }
}

// 更新密码处理接口
async function handleUpdatePassword(request, env) {
  try {
    const formData = await parseFormData(request);
    
    const filename = formData.filename;
    const newPassword = formData.new_password;

    if (!filename || !newPassword) {
      return new Response(JSON.stringify({
        success: false,
        error: '缺少 filename 或 new_password'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }

    const safeFilename = sanitizeFilename(filename.trim());
    
    try {
      // 检查文件是否存在
      const fileExists = await env.MY_TEXT_STORAGE.get('file_' + safeFilename);
      if (!fileExists) {
        return new Response(JSON.stringify({
          success: false,
          error: '文件不存在'
        }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'X-Content-Type-Options': 'nosniff'
          }
        });
      }

      // 更新密码
      await env.MY_TEXT_STORAGE.put('pwd_' + safeFilename, newPassword.trim());

      return new Response(JSON.stringify({
        success: true,
        message: '密码更新成功'
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    } catch (error) {
      console.error('密码更新失败:', error);
      return new Response(JSON.stringify({
        success: false,
        error: '密码更新失败: ' + error.message
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }
  } catch (error) {
    console.error('解析表单数据失败:', error);
    return new Response(JSON.stringify({
      success: false,
      error: '解析表单数据失败: ' + error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }
}

// 获取动态加密密钥接口
async function handleGetEncryptionKey(request, env) {
  try {
    const url = new URL(request.url);
    const clientTime = request.headers.get('X-Client-Time') || url.searchParams.get('t');
    const currentTime = Math.floor(Date.now() / 60000);
    
    // 验证时间戳（允许前后1分钟的误差）
    let timestamp;
    if (clientTime) {
      const clientTimeInt = parseInt(clientTime);
      if (Math.abs(clientTimeInt - currentTime) <= 1) {
        timestamp = clientTimeInt;
      } else {
        timestamp = currentTime;
      }
    } else {
      timestamp = currentTime;
    }
    
    // 生成动态密钥
    const key = {
      timestamp: timestamp,
      algorithm: 'dynamic-xor-time',
      version: '1.0'
    };
    
    return new Response(JSON.stringify(key), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
    
  } catch (error) {
    console.error('获取加密密钥错误:', error);
    return new Response(JSON.stringify({error: error.message}), {
      status: 500,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }
}

// 管理页面处理 - 保持不变（需要修改搜索管理页面的HTML添加酷9令牌管理链接）
async function handleManagementPage(request, env) {
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
    
    // 令牌正确，显示管理页面
    return new Response(await getSearchHTML(request, env, managementToken), {
      headers: { 
        'content-type': 'text/html;charset=UTF-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Content-Type-Options': 'nosniff'
      },
    });
  } catch (error) {
    console.error('管理页面错误:', error);
    return new Response(`管理页面错误: ${error.message}`, { 
      status: 500,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }
}

// 访问日志页面处理 - 保持不变
async function handleLogsPage(request, env) {
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
    
    // 获取日志列表
    const formData = await parseFormData(request);
    const page = parseInt(formData.page) || 1;
    const pageSize = parseInt(formData.page_size) || 50;
    const filterType = formData.filter_type || 'all';
    const filterValue = formData.filter_value || '';
    
    // 获取所有日志
    const allLogs = await env.MY_TEXT_STORAGE.list({ prefix: 'log_' });
    const logs = [];
    
    console.log(`找到日志键数量: ${allLogs.keys.length}`);
    
    for (const key of allLogs.keys) {
      try {
        const logData = await env.MY_TEXT_STORAGE.get(key.name);
        if (logData) {
          const log = JSON.parse(logData);
          log.id = key.name.substring(4); // 移除'log_'前缀
          
          // 应用过滤器
          let includeLog = true;
          
          if (filterType !== 'all' && filterValue) {
            if (filterType === 'filename' && !log.filename.includes(filterValue)) {
              includeLog = false;
            } else if (filterType === 'user_agent' && !log.userAgent.includes(filterValue)) {
              includeLog = false;
            } else if (filterType === 'ip' && !log.ip.includes(filterValue)) {
              includeLog = false;
            } else if (filterType === 'status' && !log.status.includes(filterValue)) {
              includeLog = false;
            }
          }
          
          if (includeLog) {
            logs.push(log);
          }
        }
      } catch (error) {
        console.error('解析日志失败:', key.name, error);
      }
    }
    
    // 按时间倒序排序
    logs.sort((a, b) => b.timestamp - a.timestamp);
    
    // 分页
    const totalLogs = logs.length;
    const totalPages = Math.ceil(totalLogs / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalLogs);
    const paginatedLogs = logs.slice(startIndex, endIndex);
    
    // 统计数据
    const stats = {
      total: totalLogs,
      today: logs.filter(log => {
        const logDate = new Date(log.timestamp);
        const today = new Date();
        return logDate.toDateString() === today.toDateString();
      }).length,
      allowed: logs.filter(log => log.status === 'allowed').length,
      blocked: logs.filter(log => log.status === 'blocked').length,
      uniqueUserAgents: [...new Set(logs.map(log => log.userAgent))].length,
      uniqueIPs: [...new Set(logs.map(log => log.ip))].length
    };
    
    // 显示日志页面
    return new Response(await getLogsHTML(paginatedLogs, page, totalPages, stats, filterType, filterValue, managementToken), {
      headers: { 
        'content-type': 'text/html;charset=UTF-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Content-Type-Options': 'nosniff'
      },
    });
  } catch (error) {
    console.error('日志页面错误:', error);
    return new Response(`日志页面错误: ${error.message}`, { 
      status: 500,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }
}

// 访问日志页面 HTML - 保持不变
async function getLogsHTML(logs, currentPage, totalPages, stats, filterType, filterValue, managementToken) {
  // ... 保持不变 ...
}

// 搜索管理页面 HTML (search.php) - 添加酷9令牌管理链接
async function getSearchHTML(request, env, managementToken) {
  // ... 前面代码保持不变 ...
  
  // 在返回的HTML中添加酷9令牌管理链接
  // 找到 <button type="button" class="search-btn" onclick="location.href='logs.html?manage_token=${managementToken}'">📊 访问日志</button>
  // 在后面添加酷9令牌管理链接：
  
  // 修改后的按钮部分：
  const buttonsHTML = `
<button type="button" class="search-btn" onclick="editFile('', '${managementToken}')">🆕 新建文件</button>
<button type="button" class="search-btn" onclick="uploadFiles('${managementToken}')">📤 上传文件</button>
<button type="button" class="search-btn" onclick="location.href='logs.html?manage_token=${managementToken}'">📊 访问日志</button>
<button type="button" class="search-btn" onclick="location.href='ku9_token.html?manage_token=${managementToken}'">📱 酷9令牌</button>
`;
  
  // ... 其余代码保持不变 ...
}

// 获取日志详情API
async function handleLogDetail(request, env) {
  try {
    const url = new URL(request.url);
    const logId = url.searchParams.get('log_id');
    const managementToken = url.searchParams.get('manage_token');
    const expectedToken = await env.MY_TEXT_STORAGE.get('management_token') || 'default_manage_token_2024';
    
    // 检查管理令牌
    if (!managementToken || managementToken !== expectedToken) {
      return new Response(JSON.stringify({
        error: '未授权访问'
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }
    
    if (!logId) {
      return new Response(JSON.stringify({
        error: '缺少日志ID'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }
    
    const logKey = `log_${logId}`;
    const logData = await env.MY_TEXT_STORAGE.get(logKey);
    
    if (!logData) {
      return new Response(JSON.stringify({
        error: '日志不存在'
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }
    
    const log = JSON.parse(logData);
    log.id = logId;
    
    return new Response(JSON.stringify({
      log: log
    }), {
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  } catch (error) {
    console.error('获取日志详情错误:', error);
    return new Response(JSON.stringify({
      error: `获取日志详情失败: ${error.message}`
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }
}

// 获取UA详情API
async function handleUADetail(request, env) {
  try {
    const url = new URL(request.url);
    const logId = url.searchParams.get('log_id');
    const managementToken = url.searchParams.get('manage_token');
    const expectedToken = await env.MY_TEXT_STORAGE.get('management_token') || 'default_manage_token_2024';
    
    // 检查管理令牌
    if (!managementToken || managementToken !== expectedToken) {
      return new Response(JSON.stringify({
        error: '未授权访问'
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }
    
    if (!logId) {
      return new Response(JSON.stringify({
        error: '缺少日志ID'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }
    
    const logKey = `log_${logId}`;
    const logData = await env.MY_TEXT_STORAGE.get(logKey);
    
    if (!logData) {
      return new Response(JSON.stringify({
        error: '日志不存在'
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }
    
    const log = JSON.parse(logData);
    log.id = logId;
    
    return new Response(JSON.stringify({
      log: log
    }), {
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  } catch (error) {
    console.error('获取UA详情错误:', error);
    return new Response(JSON.stringify({
      error: `获取UA详情失败: ${error.message}`
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }
}

// 导出日志API
async function handleExportLogs(request, env) {
  try {
    const url = new URL(request.url);
    const managementToken = url.searchParams.get('manage_token');
    const expectedToken = await env.MY_TEXT_STORAGE.get('management_token') || 'default_manage_token_2024';
    
    // 检查管理令牌
    if (!managementToken || managementToken !== expectedToken) {
      return new Response('未授权访问', {
        status: 401,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }
    
    const filterType = url.searchParams.get('filter_type') || 'all';
    const filterValue = url.searchParams.get('filter_value') || '';
    
    // 获取所有日志
    const allLogs = await env.MY_TEXT_STORAGE.list({ prefix: 'log_' });
    const logs = [];
    
    for (const key of allLogs.keys) {
      try {
        const logData = await env.MY_TEXT_STORAGE.get(key.name);
        if (logData) {
          const log = JSON.parse(logData);
          
          // 应用过滤器
          let includeLog = true;
          
          if (filterType !== 'all' && filterValue) {
            if (filterType === 'filename' && !log.filename.includes(filterValue)) {
              includeLog = false;
            } else if (filterType === 'user_agent' && !log.userAgent.includes(filterValue)) {
              includeLog = false;
            } else if (filterType === 'ip' && !log.ip.includes(filterValue)) {
              includeLog = false;
            } else if (filterType === 'status' && !log.status.includes(filterValue)) {
              includeLog = false;
            }
          }
          
          if (includeLog) {
            logs.push(log);
          }
        }
      } catch (error) {
        console.error('解析日志失败:', key.name, error);
      }
    }
    
    // 按时间倒序排序
    logs.sort((a, b) => b.timestamp - a.timestamp);
    
    // 转换为CSV格式
    const csvRows = [];
    
    // 表头
    csvRows.push(['时间', '状态', '文件名', 'IP地址', 'User-Agent', '原因', 'Referer', 'Accept', 'URL', '方法'].join(','));
    
    // 数据行
    for (const log of logs) {
      const time = new Date(log.timestamp).toISOString();
      const status = log.status;
      const filename = `"${(log.filename || '').replace(/"/g, '""')}"`;
      const ip = log.ip || '';
      const userAgent = `"${(log.userAgent || '').replace(/"/g, '""')}"`;
      const reason = `"${(log.reason || '').replace(/"/g, '""')}"`;
      const referer = `"${(log.referer || '').replace(/"/g, '""')}"`;
      const accept = `"${(log.accept || '').replace(/"/g, '""')}"`;
      const url = `"${(log.url || '').replace(/"/g, '""')}"`;
      const method = log.method || '';
      
      csvRows.push([time, status, filename, ip, userAgent, reason, referer, accept, url, method].join(','));
    }
    
    const csvContent = csvRows.join('\n');
    const exportDate = new Date().toISOString().split('T')[0];
    const filename = `访问日志_${exportDate}_${logs.length}条.csv`;
    
    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Content-Type-Options': 'nosniff'
      }
    });
  } catch (error) {
    console.error('导出日志错误:', error);
    return new Response(`导出日志失败: ${error.message}`, {
      status: 500,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }
}

// 清空日志API
async function handleClearLogs(request, env) {
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
    
    // 获取所有日志键
    const allLogs = await env.MY_TEXT_STORAGE.list({ prefix: 'log_' });
    let deletedCount = 0;
    
    // 批量删除日志
    for (const key of allLogs.keys) {
      try {
        await env.MY_TEXT_STORAGE.delete(key.name);
        deletedCount++;
      } catch (error) {
        console.error('删除日志失败:', key.name, error);
      }
    }
    
    console.log(`已清空 ${deletedCount} 条日志`);
    
    return new Response(JSON.stringify({
      success: true,
      message: `已清空 ${deletedCount} 条日志`
    }), {
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  } catch (error) {
    console.error('清空日志错误:', error);
    return new Response(JSON.stringify({
      success: false,
      error: `清空日志失败: ${error.message}`
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }
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

// 辅助函数：文件名安全处理
function sanitizeFilename(name) {
  return name.replace(/[^a-zA-Z0-9_\-\u4e00-\u9fa5.]/g, '_');
}

// 辅助函数：格式化文件大小
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + 'B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(2) + 'KB';
  return (bytes / 1048576).toFixed(2) + 'MB';
}
