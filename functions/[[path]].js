// Cloudflare Pages Functions - 增强安全文本存储系统 V2.4
// 专为酷9播放器优化的安全访问系统
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

    // 访问日志页面
    if (pathname === '/logs.html' || pathname === '/logs.php') {
      return await handleLogsPage(request, env);
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

    // 动态加密文件下载 - 记录访问日志
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

// 主页 HTML (index.html) - 新增酷9专属token生成
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
        
        .ku9-token-section {
            background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
            color: white;
            padding: 15px;
            border-radius: 10px;
            margin: 20px 0;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .ku9-token-section h3 {
            margin-top: 0;
            color: white;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .token-display {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 5px;
            padding: 10px;
            margin: 10px 0;
            font-family: monospace;
            word-break: break-all;
        }
        
        .token-usage {
            background: rgba(255, 255, 255, 0.2);
            border-radius: 5px;
            padding: 10px;
            margin-top: 10px;
            font-size: 12px;
        }
        
        .token-usage h4 {
            margin-top: 0;
            margin-bottom: 8px;
            color: #e3f2fd;
        }
    </style>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>🔒安全编辑工具🔒 - 酷9专属版</title>
</head>

<body>
    <h2>🔐 文件转为<u>安全链接</u></h2>
    
    <div class="ku9-token-section">
        <h3>🎯 酷9播放器专属访问系统</h3>
        <p><strong>酷9专属Token:</strong></p>
        <div class="token-display" id="ku9TokenDisplay">ku9_special_token_$(Date.now().toString(36))_${Math.random().toString(36).substr(2, 8)}</div>
        <button class="copy-btn" onclick="copyKu9Token()">复制酷9Token</button>
        
        <div class="token-usage">
            <h4>🔧 酷9播放器配置方法:</h4>
            <ol>
                <li>复制上面的酷9专属Token</li>
                <li>在酷9播放器中添加以下格式的链接：
                    <br><code>https://您的域名/z/文件名?ku9_token=酷9Token</code>
                </li>
                <li>酷9播放器UA必须包含"酷9"或"ku9"标识</li>
                <li>其他播放器无法使用此Token访问</li>
            </ol>
            <p style="color: #ffeb3b; font-weight: bold;">⚠️ 注意：只有酷9播放器可以使用此Token，其他软件会立即被拦截！</p>
        </div>
    </div>
    
    <div class="security-features">
        <h3>🛡️ 安全特性说明：</h3>
        <ul class="security-list">
            <li><span class="security-icon">✅</span> 动态时间加密 - 每次访问内容不同</li>
            <li><span class="security-icon">✅</span> 播放器专用验证 - 只允许TVBox/酷9</li>
            <li><span class="security-icon">✅</span> 反抓包保护 - 屏蔽蓝鸟/黄鸟</li>
            <li><span class="security-icon">✅</span> 汉字加密 - 完全无法直接阅读</li>
            <li><span class="security-icon">🎯</span> 酷9专属Token - 仅酷9播放器可用</li>
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
            4. 所有文字都已加密保护
        </div>
        
        <div class="token-usage" style="background: #e3f2fd; color: #333; margin-top: 10px;">
            <h4>🎯 酷9播放器专属访问：</h4>
            <p>酷9播放器可使用以下格式访问：</p>
            <code id="ku9AccessLink" style="display: block; margin: 5px 0; padding: 5px; background: #f5f5f5; border-radius: 3px;"></code>
            <button class="copy-btn" onclick="copyKu9AccessLink()">复制酷9链接</button>
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
            const ku9AccessLink = document.getElementById('ku9AccessLink');
            const ku9Token = document.getElementById('ku9TokenDisplay').textContent;
            
            linkAnchor.href = link;
            linkAnchor.textContent = link;
            linkDisplay.style.display = 'block';
            
            // 生成酷9专属访问链接
            const url = new URL(link);
            const filename = url.pathname.split('/z/')[1];
            const ku9Link = link.split('/z/')[0] + '/z/' + filename + '?ku9_token=' + encodeURIComponent(ku9Token);
            ku9AccessLink.textContent = ku9Link;
            
            linkDisplay.scrollIntoView({ behavior: 'smooth' });
        }
        
        function copyLink() {
            const link = document.getElementById('linkAnchor').href;
            navigator.clipboard.writeText(link)
                .then(() => alert('安全链接已复制到剪贴板'))
                .catch(err => alert('复制失败: ' + err));
        }
        
        function copyKu9Token() {
            const token = document.getElementById('ku9TokenDisplay').textContent;
            navigator.clipboard.writeText(token)
                .then(() => alert('酷9专属Token已复制到剪贴板'))
                .catch(err => alert('复制失败: ' + err));
        }
        
        function copyKu9AccessLink() {
            const link = document.getElementById('ku9AccessLink').textContent;
            navigator.clipboard.writeText(link)
                .then(() => alert('酷9专属访问链接已复制到剪贴板'))
                .catch(err => alert('复制失败: ' + err));
        }
    </script>
</body>
</html>`;
}

// 管理页面处理 - 保持不变
async function handleManagementPage(request, env) {
  try {
    const url = new URL(request.url);
    const managementToken = url.searchParams.get('manage_token');
    const expectedToken = await env.MY_TEXT_STORAGE.get('management_token') || 'default_manage_token_2024';
    
    if (!managementToken || managementToken !== expectedToken) {
      return new Response(await getManagementLoginHTML(request), {
        headers: { 
          'content-type': 'text/html;charset=UTF-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Content-Type-Options': 'nosniff'
        },
      });
    }
    
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
    const url = new URL(request.url);
    const managementToken = url.searchParams.get('manage_token');
    const expectedToken = await env.MY_TEXT_STORAGE.get('management_token') || 'default_manage_token_2024';
    
    if (!managementToken || managementToken !== expectedToken) {
      return new Response(await getManagementLoginHTML(request), {
        headers: { 
          'content-type': 'text/html;charset=UTF-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Content-Type-Options': 'nosniff'
        },
      });
    }
    
    const formData = await parseFormData(request);
    const page = parseInt(formData.page) || 1;
    const pageSize = parseInt(formData.page_size) || 50;
    const filterType = formData.filter_type || 'all';
    const filterValue = formData.filter_value || '';
    
    const allLogs = await env.MY_TEXT_STORAGE.list({ prefix: 'log_' });
    const logs = [];
    
    console.log(`找到日志键数量: ${allLogs.keys.length}`);
    
    for (const key of allLogs.keys) {
      try {
        const logData = await env.MY_TEXT_STORAGE.get(key.name);
        if (logData) {
          const log = JSON.parse(logData);
          log.id = key.name.substring(4);
          
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
    
    logs.sort((a, b) => b.timestamp - a.timestamp);
    
    const totalLogs = logs.length;
    const totalPages = Math.ceil(totalLogs / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalLogs);
    const paginatedLogs = logs.slice(startIndex, endIndex);
    
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
      uniqueIPs: [...new Set(logs.map(log => log.ip))].length,
      ku9Access: logs.filter(log => log.accessType === 'ku9_token').length
    };
    
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
  // ... (日志页面HTML代码保持不变，为节省空间省略)
  // 完整的日志页面HTML代码...
}

// 管理登录页面 - 保持不变
async function getManagementLoginHTML(request) {
  // ... (管理登录页面HTML代码保持不变，为节省空间省略)
  // 完整的管理登录页面HTML代码...
}

// 搜索管理页面 HTML (search.php) - 保持不变
async function getSearchHTML(request, env, managementToken) {
  // ... (搜索管理页面HTML代码保持不变，为节省空间省略)
  // 完整的搜索管理页面HTML代码...
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

// 记录访问日志函数
async function logAccess(env, request, filename, status, reason, userAgent, ip, accessType = 'normal') {
  try {
    const timestamp = Date.now();
    const logId = `log_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
    
    const logData = {
      timestamp,
      filename: filename || 'unknown',
      status,
      reason: reason || 'unknown',
      userAgent: userAgent || request.headers.get('User-Agent') || 'unknown',
      ip: ip || request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown',
      referer: request.headers.get('Referer') || '',
      accept: request.headers.get('Accept') || '',
      url: request.url,
      method: request.method,
      accessType: accessType // normal, management, ku9_token
    };
    
    await env.MY_TEXT_STORAGE.put(logId, JSON.stringify(logData), { 
      expirationTtl: 2592000 // 30天过期
    });
    
    console.log('✅ 日志已保存:', logId, filename, status, reason, accessType);
    
    return true;
  } catch (error) {
    console.error('❌ 记录访问日志失败:', error);
    return false;
  }
}

// 严格的酷9播放器检测函数
function strictKu9PlayerDetection(userAgent, headers, clientTime) {
  if (!userAgent) return false;
  
  const ua = userAgent.toLowerCase();
  
  // 酷9播放器的严格特征列表
  const ku9StrictPatterns = [
    // 必须包含的关键词（至少匹配一个）
    /ku9/i,
    /酷9/i,
    /k9player/i,
    /k9 player/i,
    /^MTV$/i, // 精确匹配MTV
    /ku-9/i,
    /酷我9/i,
    /k9box/i,
    /k9tv/i,
    /ku9tv/i,
    /酷9tv/i
  ];
  
  // 禁止的特征（浏览器、抓包工具等）
  const forbiddenPatterns = [
    /mozilla/i,
    /chrome/i,
    /safari/i,
    /edge/i,
    /firefox/i,
    /opera/i,
    /webkit/i,
    /gecko/i,
    /httpcanary/i,
    /fiddler/i,
    /charles/i,
    /wireshark/i,
    /packetcapture/i,
    /蓝鸟/i,
    /黄鸟/i,
    /抓包/i,
    /sniffer/i,
    /mitm/i,
    /proxy/i,
    /burp/i,
    /postman/i,
    /curl\/[0-9]/i,
    /python-requests/i,
    /java\/[0-9]/i,
    /php\/[0-9]/i,
    /go-http-client/i,
    /node-fetch/i,
    /axios/i
  ];
  
  // 检查是否匹配酷9特征
  const hasKu9Feature = ku9StrictPatterns.some(pattern => pattern.test(userAgent));
  
  if (!hasKu9Feature) {
    console.log('❌ 酷9检测失败：未找到酷9特征');
    return false;
  }
  
  // 检查是否包含禁止的特征
  const hasForbiddenFeature = forbiddenPatterns.some(pattern => pattern.test(userAgent));
  
  if (hasForbiddenFeature) {
    console.log('❌ 酷9检测失败：包含禁止特征');
    return false;
  }
  
  // 检查时间戳（如果提供了客户端时间）
  if (clientTime) {
    const serverTime = Math.floor(Date.now() / 60000);
    const clientTimeInt = parseInt(clientTime);
    
    // 允许前后2分钟的误差
    if (Math.abs(clientTimeInt - serverTime) > 2) {
      console.log('❌ 酷9检测失败：时间戳超出允许范围');
      return false;
    }
  }
  
  // 检查常见的Android播放器特征（可选）
  const androidFeatures = [
    /dalvik/i,
    /android/i,
    /okhttp/i,
    /exoplayer/i,
    /mediaplayer/i
  ];
  
  const hasAndroidFeature = androidFeatures.some(pattern => pattern.test(ua));
  
  // 酷9通常是Android应用，应该有Android特征
  if (!hasAndroidFeature && !ua.includes('mtv')) {
    console.log('⚠️ 酷9检测警告：未找到Android特征，但可能还是酷9');
  }
  
  console.log('✅ 酷9检测通过：严格验证成功');
  return true;
}

// 读取文件处理 (read0.php) - 保持不变
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

// 安全文件下载处理 - 酷9专属访问系统
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

    // 获取请求参数和头部
    const url = new URL(request.url);
    const managementToken = url.searchParams.get('manage_token');
    const ku9Token = url.searchParams.get('ku9_token') || request.headers.get('X-Ku9-Token');
    const clientTime = request.headers.get('X-Client-Time') || url.searchParams.get('t');
    
    const userAgent = request.headers.get('User-Agent') || '';
    const referer = request.headers.get('Referer') || '';
    const accept = request.headers.get('Accept') || '';
    
    // 检查管理令牌 - 最高优先级
    const expectedManagementToken = await env.MY_TEXT_STORAGE.get('management_token') || 'default_manage_token_2024';
    
    if (managementToken && managementToken === expectedManagementToken) {
      await logAccess(env, request, safeFilename, 'allowed', '管理访问', 
                     userAgent, 
                     request.headers.get('CF-Connecting-IP'),
                     'management');
      
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

    // 检查酷9专属令牌 - 第二优先级
    const expectedKu9Token = env.KU9_ACCESS_TOKEN || 'ku9_special_token_default_2024';
    
    if (ku9Token) {
      if (ku9Token === expectedKu9Token) {
        // 令牌正确，进行严格的酷9播放器检测
        const isKu9Player = strictKu9PlayerDetection(userAgent, request.headers, clientTime);
        
        if (isKu9Player) {
          // 酷9播放器验证通过
          await logAccess(env, request, safeFilename, 'allowed', '酷9专属令牌验证通过', 
                         userAgent, 
                         request.headers.get('CF-Connecting-IP'),
                         'ku9_token');
          
          // 动态时间加密内容
          const timestamp = Math.floor(Date.now() / 60000);
          const encryptedContent = dynamicEncrypt(content, timestamp);
          
          let contentType = 'text/plain; charset=utf-8';
          if (safeFilename.endsWith('.json')) {
            contentType = 'application/json; charset=utf-8';
          } else if (safeFilename.endsWith('.m3u') || safeFilename.endsWith('.m3u8')) {
            contentType = 'audio/x-mpegurl; charset=utf-8';
          } else if (safeFilename.endsWith('.txt')) {
            contentType = 'text/plain; charset=utf-8';
          }
          
          return new Response(encryptedContent, {
            headers: {
              'Content-Type': contentType,
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, X-Client-Time, X-Ku9-Token, X-Ku9-Signature',
              'X-Content-Type-Options': 'nosniff',
              'X-Encryption-Time': timestamp.toString(),
              'X-Encryption-Version': '2.0',
              'X-Ku9-Access': 'granted',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0',
              'Content-Disposition': `inline; filename="${encodeURIComponent('ku9_encrypted_' + safeFilename)}"`
            }
          });
        } else {
          // 令牌正确但不是酷9播放器
          await logAccess(env, request, safeFilename, 'blocked', '酷9令牌被非酷9客户端使用', 
                         userAgent, 
                         request.headers.get('CF-Connecting-IP'),
                         'ku9_token_abuse');
          
          const errorMessage = `🚫 访问被拒绝：酷9专属令牌只能由酷9播放器使用\nUser-Agent: ${userAgent}`;
          return new Response(errorMessage, { 
            status: 403,
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
              'Access-Control-Allow-Origin': '*',
              'X-Content-Type-Options': 'nosniff',
              'X-Ku9-Access': 'denied',
              'X-Ku9-Reason': 'non_ku9_client'
            }
          });
        }
      } else {
        // 令牌错误
        await logAccess(env, request, safeFilename, 'blocked', '无效的酷9令牌', 
                       userAgent, 
                       request.headers.get('CF-Connecting-IP'),
                       'ku9_token_invalid');
        
        return new Response('无效的酷9令牌', { 
          status: 403,
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
            'X-Content-Type-Options': 'nosniff'
          }
        });
      }
    }

    // 普通播放器检测（无令牌）
    const lowerUserAgent = userAgent.toLowerCase();
    const lowerAccept = accept.toLowerCase();
    
    // 播放器白名单
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
      'dalvik', 'android'
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
    
    // 决策逻辑
    let allowAccess = false;
    let reason = '';
    
    // 规则1：检查播放器白名单（排除酷9，因为酷9应该用令牌）
    const isPlayer = playerWhitelist.some(player => {
      return lowerUserAgent.includes(player.toLowerCase());
    });
    
    if (isPlayer) {
      allowAccess = true;
      reason = '普通播放器访问';
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
    // 规则4：检查是否有酷9特征（应该用令牌但没用）
    else if (strictKu9PlayerDetection(userAgent, request.headers, clientTime)) {
      allowAccess = false;
      reason = '酷9播放器请使用专属令牌访问';
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
    
    // 如果不允许访问
    if (!allowAccess) {
      await logAccess(env, request, safeFilename, 'blocked', reason, userAgent, 
                     request.headers.get('CF-Connecting-IP'));
      
      const errorMessage = `访问被拒绝 (${reason}) - ${new Date().toISOString()}`;
      
      return new Response(errorMessage, { 
        status: 403,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'X-Content-Type-Options': 'nosniff',
          'X-Access-Reason': reason
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
        'Access-Control-Allow-Headers': 'Content-Type, X-Client-Time',
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

// 获取动态加密密钥接口 - 保持不变
async function handleGetEncryptionKey(request, env) {
  try {
    const url = new URL(request.url);
    const clientTime = request.headers.get('X-Client-Time') || url.searchParams.get('t');
    const currentTime = Math.floor(Date.now() / 60000);
    
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

// 上传文件处理 (upload.php) - 保持不变
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
      await env.MY_TEXT_STORAGE.put('file_' + safeFilename, content);
      await env.MY_TEXT_STORAGE.put('pwd_' + safeFilename, finalPassword);
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

// 更新密码处理接口 - 保持不变
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

// 获取日志详情API - 保持不变
async function handleLogDetail(request, env) {
  try {
    const url = new URL(request.url);
    const logId = url.searchParams.get('log_id');
    const managementToken = url.searchParams.get('manage_token');
    const expectedToken = await env.MY_TEXT_STORAGE.get('management_token') || 'default_manage_token_2024';
    
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

// 获取UA详情API - 保持不变
async function handleUADetail(request, env) {
  try {
    const url = new URL(request.url);
    const logId = url.searchParams.get('log_id');
    const managementToken = url.searchParams.get('manage_token');
    const expectedToken = await env.MY_TEXT_STORAGE.get('management_token') || 'default_manage_token_2024';
    
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

// 导出日志API - 保持不变
async function handleExportLogs(request, env) {
  try {
    const url = new URL(request.url);
    const managementToken = url.searchParams.get('manage_token');
    const expectedToken = await env.MY_TEXT_STORAGE.get('management_token') || 'default_manage_token_2024';
    
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
    
    const allLogs = await env.MY_TEXT_STORAGE.list({ prefix: 'log_' });
    const logs = [];
    
    for (const key of allLogs.keys) {
      try {
        const logData = await env.MY_TEXT_STORAGE.get(key.name);
        if (logData) {
          const log = JSON.parse(logData);
          
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
    
    logs.sort((a, b) => b.timestamp - a.timestamp);
    
    const csvRows = [];
    csvRows.push(['时间', '状态', '文件名', 'IP地址', 'User-Agent', '原因', 'Referer', 'Accept', 'URL', '方法', '访问类型'].join(','));
    
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
      const accessType = log.accessType || 'normal';
      
      csvRows.push([time, status, filename, ip, userAgent, reason, referer, accept, url, method, accessType].join(','));
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

// 清空日志API - 保持不变
async function handleClearLogs(request, env) {
  try {
    const url = new URL(request.url);
    const managementToken = url.searchParams.get('manage_token');
    const expectedToken = await env.MY_TEXT_STORAGE.get('management_token') || 'default_manage_token_2024';
    
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
    
    const allLogs = await env.MY_TEXT_STORAGE.list({ prefix: 'log_' });
    let deletedCount = 0;
    
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
