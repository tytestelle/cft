// Cloudflare Pages Functions - 增强安全文本存储系统 V3.0
// 升级：酷9播放器专属令牌系统 + 精确识别
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
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-Client-Time, X-Encryption-Key, X-Management-Access, X-Ku9-Token, X-Device-ID',
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

    // 酷9令牌管理页面
    if (pathname === '/ku9.html' || pathname === '/ku9.php') {
      return await handleKu9Page(request, env);
    }

    // 设备管理页面
    if (pathname === '/devices.html' || pathname === '/devices.php') {
      return await handleDevicesPage(request, env);
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

    // API: 生成酷9令牌
    if (pathname === '/api_generate_ku9_token' && request.method === 'POST') {
      return await handleGenerateKu9Token(request, env);
    }

    // API: 删除酷9令牌
    if (pathname === '/api_delete_ku9_token' && request.method === 'POST') {
      return await handleDeleteKu9Token(request, env);
    }

    // API: 标记UA为酷9
    if (pathname === '/api_mark_ua' && request.method === 'POST') {
      return await handleMarkUA(request, env);
    }

    // API: 更新设备信息
    if (pathname === '/api_update_device' && request.method === 'POST') {
      return await handleUpdateDevice(request, env);
    }

    // 动态加密文件下载 - 记录访问日志
    if (pathname.startsWith('/z/')) {
      const filename = pathname.substring(3);
      return await handleSecureFileDownload(filename, request, env);
    }

    // 酷9专用下载端点
    if (pathname.startsWith('/k9/')) {
      const filename = pathname.substring(4);
      return await handleKu9SecureDownload(filename, request, env);
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
        
        .ku9-info {
            background: #e3f2fd;
            border: 1px solid #bbdefb;
            border-radius: 5px;
            padding: 10px;
            margin: 15px 0;
        }
        
        .ku9-info h4 {
            margin-top: 0;
            color: #1976d2;
        }
    </style>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>🔒安全编辑工具🔒 - 酷9专用版</title>
</head>

<body>
    <h2>🔐 文件转为<u>安全链接</u></h2>
    
    <div class="security-features">
        <h3>🛡️ 安全特性说明：</h3>
        <ul class="security-list">
            <li><span class="security-icon">✅</span> 动态时间加密 - 每次访问内容不同</li>
            <li><span class="security-icon">✅</span> 播放器专用验证 - 只允许TVBox/酷9</li>
            <li><span class="security-icon">✅</span> 反抓包保护 - 屏蔽蓝鸟/黄鸟</li>
            <li><span class="security-icon">✅</span> 汉字加密 - 完全无法直接阅读</li>
            <li><span class="security-icon">✅</span> 酷9专属令牌 - 单独安全通道</li>
        </ul>
    </div>
    
    <div class="ku9-info">
        <h4>🎯 酷9播放器专用功能：</h4>
        <p>• 酷9播放器使用专属令牌访问</p>
        <p>• 每个设备独立识别，防止滥用</p>
        <p>• 后台可精确控制每个设备的访问权限</p>
        <p>• 〖<a href="./ku9.html?manage_token=default_manage_token_2024" style="color:#d32f2f;"><b>酷9令牌管理</b></a>〗</p>
    </div>
    
    <div class="blocked-software">
        <h4>🚫 已屏蔽的抓包软件：</h4>
        <p>蓝鸟、黄鸟、HTTPCanary、Fiddler、Charles、Wireshark、PacketCapture等</p>
    </div>
    
    <p>可自定义扩展名，输入完整文件名如：<code>log.json</code>、<code>test.php</code>。〖<a href="./search.html?manage_token=default_manage_token_2024"><b>接口搜索</b></a>〗〖<a href="./logs.html?manage_token=default_manage_token_2024"><b>访问日志</b></a>〗</p><br>

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
async function handleKu9Page(request, env) {
  try {
    // 检查管理访问令牌
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
    
    return new Response(await getKu9HTML(request, env, managementToken), {
      headers: { 
        'content-type': 'text/html;charset=UTF-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Content-Type-Options': 'nosniff'
      },
    });
  } catch (error) {
    console.error('酷9管理页面错误:', error);
    return new Response(`酷9管理页面错误: ${error.message}`, { 
      status: 500,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }
}

// 设备管理页面
async function handleDevicesPage(request, env) {
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
    
    return new Response(await getDevicesHTML(request, env, managementToken), {
      headers: { 
        'content-type': 'text/html;charset=UTF-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Content-Type-Options': 'nosniff'
      },
    });
  } catch (error) {
    console.error('设备管理页面错误:', error);
    return new Response(`设备管理页面错误: ${error.message}`, { 
      status: 500,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }
}

// 酷9管理页面 HTML
async function getKu9HTML(request, env, managementToken) {
  const url = new URL(request.url);
  const formData = await parseFormData(request);
  
  let messages = [];
  
  // 处理生成令牌请求
  if (formData.generate_token) {
    const deviceName = formData.device_name || '未命名设备';
    const expiresDays = parseInt(formData.expires_days) || 30;
    const maxUsage = parseInt(formData.max_usage) || 1000;
    
    // 生成令牌
    const token = generateToken();
    const tokenData = {
      token: token,
      device_name: deviceName,
      created_at: Date.now(),
      expires_at: Date.now() + (expiresDays * 24 * 60 * 60 * 1000),
      max_usage: maxUsage,
      used_count: 0,
      last_used: 0,
      enabled: true,
      description: formData.description || '',
      allowed_ips: formData.allowed_ips ? formData.allowed_ips.split(',').map(ip => ip.trim()).filter(ip => ip) : []
    };
    
    await env.MY_TEXT_STORAGE.put(`ku9_token_${token}`, JSON.stringify(tokenData));
    messages.push(`✅ 酷9令牌已生成: ${token}`);
  }
  
  // 获取所有酷9令牌
  const allKeys = await env.MY_TEXT_STORAGE.list();
  const ku9Tokens = [];
  
  for (const key of allKeys.keys) {
    if (key.name.startsWith('ku9_token_')) {
      try {
        const tokenData = await env.MY_TEXT_STORAGE.get(key.name);
        if (tokenData) {
          const data = JSON.parse(tokenData);
          data.token = key.name.substring(10); // 移除'ku9_token_'前缀
          ku9Tokens.push(data);
        }
      } catch (error) {
        console.error('解析酷9令牌失败:', key.name, error);
      }
    }
  }
  
  // 按创建时间排序
  ku9Tokens.sort((a, b) => b.created_at - a.created_at);
  
  // 生成令牌列表HTML
  let tokensHTML = '';
  if (ku9Tokens.length > 0) {
    for (const token of ku9Tokens) {
      const createdDate = new Date(token.created_at).toLocaleString('zh-CN');
      const expiresDate = new Date(token.expires_at).toLocaleString('zh-CN');
      const lastUsedDate = token.last_used ? new Date(token.last_used).toLocaleString('zh-CN') : '从未使用';
      const status = token.enabled ? '✅ 启用' : '❌ 禁用';
      const statusClass = token.enabled ? 'status-enabled' : 'status-disabled';
      const usagePercent = token.max_usage > 0 ? Math.round((token.used_count / token.max_usage) * 100) : 0;
      
      tokensHTML += `
<tr>
  <td><code class="token-code">${token.token}</code></td>
  <td>${token.device_name}</td>
  <td>${createdDate}</td>
  <td>${expiresDate}</td>
  <td>${token.used_count} / ${token.max_usage}</td>
  <td>
    <div class="usage-bar">
      <div class="usage-fill" style="width: ${usagePercent}%"></div>
    </div>
    ${usagePercent}%
  </td>
  <td>${lastUsedDate}</td>
  <td><span class="${statusClass}">${status}</span></td>
  <td>
    <button class="action-btn copy-token-btn" onclick="copyToken('${token.token}')">复制</button>
    <button class="action-btn toggle-btn" onclick="toggleToken('${token.token}', ${!token.enabled})">${token.enabled ? '禁用' : '启用'}</button>
    <button class="action-btn delete-btn" onclick="deleteToken('${token.token}')">删除</button>
  </td>
</tr>
`;
    }
  } else {
    tokensHTML = '<tr><td colspan="9" style="text-align:center;padding:20px;">暂无酷9令牌</td></tr>';
  }
  
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>酷9令牌管理</title>
<style>
body{font-family:"Segoe UI",Tahoma,sans-serif;font-size:14px;color:#333;margin:0;padding:10px;background:#f5f5f5;}
.container{max-width:100%;margin:0 auto;}
.back-link{display:inline-block;margin-bottom:15px;color:#4a6cf7;text-decoration:none;padding:6px 12px;background:white;border-radius:4px;border:1px solid #ddd;}
.header{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;}
.header h1{margin:0;color:#4a6cf7;}
.generate-form{background:white;padding:20px;border-radius:8px;margin-bottom:20px;box-shadow:0 2px 4px rgba(0,0,0,0.1);}
.form-grid{display:grid;grid-template-columns:repeat(auto-fit, minmax(250px, 1fr));gap:15px;margin-bottom:15px;}
.form-group label{display:block;margin-bottom:5px;color:#555;font-weight:bold;}
.form-group input, .form-group textarea{width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;box-sizing:border-box;}
.form-group textarea{height:80px;resize:vertical;}
.submit-btn{background:#4a6cf7;color:white;border:none;padding:10px 20px;border-radius:4px;cursor:pointer;font-size:16px;}
.submit-btn:hover{background:#3653d3;}
.tokens-table{width:100%;border-collapse:collapse;background:white;border-radius:8px;overflow:hidden;box-shadow:0 2px 4px rgba(0,0,0,0.1);}
.tokens-table th{background:#4a6cf7;color:white;padding:12px 8px;text-align:left;font-weight:normal;}
.tokens-table td{padding:8px;border-bottom:1px solid #eee;}
.tokens-table tr:hover{background:#f9f9f9;}
.token-code{font-family:monospace;background:#f8f9fa;padding:2px 6px;border-radius:3px;border:1px solid #ddd;}
.status-enabled{color:#5cb85c;font-weight:bold;}
.status-disabled{color:#d9534f;font-weight:bold;}
.usage-bar{width:100px;height:10px;background:#eee;border-radius:5px;overflow:hidden;display:inline-block;margin-right:10px;}
.usage-fill{height:100%;background:#5cb85c;transition:width 0.3s;}
.action-btn{padding:3px 8px;border:none;border-radius:3px;cursor:pointer;font-size:12px;margin:2px;}
.copy-token-btn{background:#5bc0de;color:white;}
.toggle-btn{background:#f0ad4e;color:white;}
.delete-btn{background:#d9534f;color:white;}
.message{background:#d4edda;color:#155724;padding:10px;border-radius:4px;margin-bottom:15px;border:1px solid #c3e6cb;}
.instruction-box{background:#e3f2fd;border:1px solid #bbdefb;border-radius:5px;padding:15px;margin-bottom:20px;}
.instruction-box h3{margin-top:0;color:#1976d2;}
.instruction-box ul{padding-left:20px;}
.instruction-box li{margin-bottom:8px;}
.usage-info{background:#f8f9fa;border:1px solid #28a745;border-radius:5px;padding:15px;margin-bottom:20px;}
.usage-info h4{margin-top:0;color:#28a745;}
.code-block{background:#333;color:#fff;padding:15px;border-radius:5px;font-family:monospace;overflow-x:auto;margin:10px 0;}
</style>
</head>
<body>
<div class="container">
  <a href="./search.html?manage_token=${managementToken}" class="back-link">← 返回管理页面</a>
  
  <div class="header">
    <h1>🎯 酷9播放器令牌管理</h1>
  </div>
  
  ${messages.map(msg => `<div class="message">${msg}</div>`).join('')}
  
  <div class="instruction-box">
    <h3>📖 使用说明：</h3>
    <ul>
      <li>酷9播放器需要使用专属令牌才能访问加密内容</li>
      <li>每个令牌对应一个设备，可设置使用次数限制</li>
      <li>令牌可通过HTTP头 <code>X-Ku9-Token</code> 或查询参数 <code>ku9_token</code> 传递</li>
      <li>酷9播放器需修改配置，在接口URL后添加 <code>?ku9_token=YOUR_TOKEN</code></li>
    </ul>
  </div>
  
  <div class="usage-info">
    <h4>🔧 酷9播放器配置方法：</h4>
    <p>在酷9播放器的接口地址中添加令牌参数：</p>
    <div class="code-block">
      原地址：https://your-domain.com/z/filename.txt<br>
      新地址：https://your-domain.com/z/filename.txt?ku9_token=YOUR_TOKEN<br><br>
      或使用酷9专用端点：<br>
      https://your-domain.com/k9/filename.txt?ku9_token=YOUR_TOKEN
    </div>
  </div>
  
  <div class="generate-form">
    <h2>生成新令牌</h2>
    <form method="post" id="generateForm">
      <input type="hidden" name="manage_token" value="${managementToken}">
      <div class="form-grid">
        <div class="form-group">
          <label for="device_name">设备名称：</label>
          <input type="text" id="device_name" name="device_name" placeholder="例如：客厅电视、卧室手机" required>
        </div>
        <div class="form-group">
          <label for="expires_days">有效期（天）：</label>
          <input type="number" id="expires_days" name="expires_days" value="30" min="1" max="365">
        </div>
        <div class="form-group">
          <label for="max_usage">最大使用次数：</label>
          <input type="number" id="max_usage" name="max_usage" value="1000" min="1">
        </div>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label for="allowed_ips">允许的IP（可选，逗号分隔）：</label>
          <input type="text" id="allowed_ips" name="allowed_ips" placeholder="例如：192.168.1.100, 192.168.1.101">
        </div>
        <div class="form-group" style="grid-column: span 2;">
          <label for="description">描述（可选）：</label>
          <textarea id="description" name="description" placeholder="设备描述信息"></textarea>
        </div>
      </div>
      <button type="submit" name="generate_token" value="1" class="submit-btn">🎫 生成酷9令牌</button>
    </form>
  </div>
  
  <h2>现有令牌列表</h2>
  <table class="tokens-table">
    <thead>
      <tr>
        <th>令牌</th>
        <th>设备名称</th>
        <th>创建时间</th>
        <th>过期时间</th>
        <th>使用次数</th>
        <th>使用率</th>
        <th>最后使用</th>
        <th>状态</th>
        <th>操作</th>
      </tr>
    </thead>
    <tbody>
      ${tokensHTML}
    </tbody>
  </table>
</div>

<script>
// 复制令牌
function copyToken(token) {
  navigator.clipboard.writeText(token)
    .then(() => alert('令牌已复制到剪贴板'))
    .catch(err => alert('复制失败: ' + err));
}

// 切换令牌状态
function toggleToken(token, enable) {
  const action = enable ? '启用' : '禁用';
  if (confirm('确定要' + action + '此令牌吗？')) {
    fetch('/api_update_device?manage_token=${managementToken}', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'device_token=' + encodeURIComponent(token) + '&enabled=' + enable
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        alert('令牌状态已更新');
        location.reload();
      } else {
        alert('更新失败: ' + (data.error || ''));
      }
    })
    .catch(error => {
      console.error('切换令牌状态失败:', error);
      alert('操作失败');
    });
  }
}

// 删除令牌
function deleteToken(token) {
  if (confirm('确定要删除此令牌吗？此操作不可恢复！')) {
    fetch('/api_delete_ku9_token?manage_token=${managementToken}', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'token=' + encodeURIComponent(token)
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        alert('令牌已删除');
        location.reload();
      } else {
        alert('删除失败: ' + (data.error || ''));
      }
    })
    .catch(error => {
      console.error('删除令牌失败:', error);
      alert('删除失败');
    });
  }
}
</script>
</body>
</html>`;
}

// 设备管理页面 HTML
async function getDevicesHTML(request, env, managementToken) {
  const url = new URL(request.url);
  const formData = await parseFormData(request);
  
  // 获取所有设备信息
  const allKeys = await env.MY_TEXT_STORAGE.list();
  const devices = new Map(); // 使用Map按设备ID分组
  
  // 获取所有日志，提取设备信息
  const allLogs = await env.MY_TEXT_STORAGE.list({ prefix: 'log_' });
  
  for (const key of allLogs.keys) {
    try {
      const logData = await env.MY_TEXT_STORAGE.get(key.name);
      if (logData) {
        const log = JSON.parse(logData);
        
        // 生成设备指纹：IP + UA的哈希
        const deviceFingerprint = await generateDeviceFingerprint(log.ip, log.userAgent);
        const deviceId = deviceFingerprint.substring(0, 16); // 取前16位作为设备ID
        
        if (!devices.has(deviceId)) {
          devices.set(deviceId, {
            id: deviceId,
            ip: log.ip,
            userAgent: log.userAgent,
            firstSeen: log.timestamp,
            lastSeen: log.timestamp,
            accessCount: 1,
            ku9Status: 'unknown', // unknown, confirmed, blocked
            isKu9: false,
            status: 'pending', // pending, allowed, blocked
            logs: [log]
          });
        } else {
          const device = devices.get(deviceId);
          device.lastSeen = Math.max(device.lastSeen, log.timestamp);
          device.firstSeen = Math.min(device.firstSeen, log.timestamp);
          device.accessCount++;
          device.logs.push(log);
          
          // 更新酷9状态
          if (log.ku9_detected === 'confirmed') {
            device.ku9Status = 'confirmed';
            device.isKu9 = true;
          }
        }
      }
    } catch (error) {
      console.error('解析设备日志失败:', key.name, error);
    }
  }
  
  // 处理标记操作
  if (formData.mark_device) {
    const deviceId = formData.device_id;
    const markAsKu9 = formData.mark_as_ku9 === 'true';
    
    if (deviceId && devices.has(deviceId)) {
      const device = devices.get(deviceId);
      
      // 更新设备信息
      device.ku9Status = markAsKu9 ? 'confirmed' : 'blocked';
      device.isKu9 = markAsKu9;
      device.status = markAsKu9 ? 'allowed' : 'blocked';
      
      // 保存到存储
      await env.MY_TEXT_STORAGE.put(`device_${deviceId}`, JSON.stringify(device));
      
      // 更新相关日志
      for (const log of device.logs) {
        if (log.id) {
          const logKey = `log_${log.id}`;
          const logData = await env.MY_TEXT_STORAGE.get(logKey);
          if (logData) {
            const logObj = JSON.parse(logData);
            logObj.ku9_detected = markAsKu9 ? 'confirmed' : 'blocked';
            logObj.device_id = deviceId;
            await env.MY_TEXT_STORAGE.put(logKey, JSON.stringify(logObj));
          }
        }
      }
    }
  }
  
  // 转换Map为数组并排序
  const deviceList = Array.from(devices.values());
  deviceList.sort((a, b) => b.lastSeen - a.lastSeen);
  
  // 生成设备列表HTML
  let devicesHTML = '';
  if (deviceList.length > 0) {
    for (const device of deviceList) {
      const firstSeen = new Date(device.firstSeen).toLocaleString('zh-CN');
      const lastSeen = new Date(device.lastSeen).toLocaleString('zh-CN');
      const lastActive = Math.floor((Date.now() - device.lastSeen) / (1000 * 60 * 60)); // 小时
      
      let ku9StatusHTML = '';
      let statusHTML = '';
      let actionHTML = '';
      
      if (device.ku9Status === 'confirmed') {
        ku9StatusHTML = '<span class="status-confirmed">✅ 已确认为酷9</span>';
        statusHTML = '<span class="status-allowed">✅ 允许访问</span>';
        actionHTML = `<button class="action-btn block-btn" onclick="markDevice('${device.id}', false)">标记为非酷9</button>`;
      } else if (device.ku9Status === 'blocked') {
        ku9StatusHTML = '<span class="status-blocked">❌ 确认为非酷9</span>';
        statusHTML = '<span class="status-blocked">❌ 禁止访问</span>';
        actionHTML = `<button class="action-btn allow-btn" onclick="markDevice('${device.id}', true)">标记为酷9</button>`;
      } else {
        ku9StatusHTML = '<span class="status-unknown">❓ 待确认</span>';
        statusHTML = '<span class="status-pending">⏳ 待审核</span>';
        actionHTML = `
          <button class="action-btn allow-btn" onclick="markDevice('${device.id}', true)">标记为酷9</button>
          <button class="action-btn block-btn" onclick="markDevice('${device.id}', false)">标记为非酷9</button>
        `;
      }
      
      // 提取UA特征
      const uaPreview = device.userAgent.length > 40 ? 
        device.userAgent.substring(0, 40) + '...' : device.userAgent;
      
      devicesHTML += `
<tr>
  <td><code>${device.id}</code></td>
  <td>${device.ip}</td>
  <td title="${device.userAgent}">${uaPreview}</td>
  <td>${device.accessCount}</td>
  <td>${firstSeen}</td>
  <td>${lastSeen} (${lastActive}小时前)</td>
  <td>${ku9StatusHTML}</td>
  <td>${statusHTML}</td>
  <td>
    ${actionHTML}
    <button class="action-btn detail-btn" onclick="showDeviceDetail('${device.id}')">详情</button>
  </td>
</tr>
`;
    }
  } else {
    devicesHTML = '<tr><td colspan="9" style="text-align:center;padding:20px;">暂无设备信息</td></tr>';
  }
  
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>设备管理</title>
<style>
body{font-family:"Segoe UI",Tahoma,sans-serif;font-size:14px;color:#333;margin:0;padding:10px;background:#f5f5f5;}
.container{max-width:100%;margin:0 auto;}
.back-link{display:inline-block;margin-bottom:15px;color:#4a6cf7;text-decoration:none;padding:6px 12px;background:white;border-radius:4px;border:1px solid #ddd;}
.header{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;}
.header h1{margin:0;color:#4a6cf7;}
.devices-table{width:100%;border-collapse:collapse;background:white;border-radius:8px;overflow:hidden;box-shadow:0 2px 4px rgba(0,0,0,0.1);}
.devices-table th{background:#4a6cf7;color:white;padding:12px 8px;text-align:left;font-weight:normal;}
.devices-table td{padding:8px;border-bottom:1px solid #eee;}
.devices-table tr:hover{background:#f9f9f9;}
.status-confirmed{color:#5cb85c;font-weight:bold;}
.status-blocked{color:#d9534f;font-weight:bold;}
.status-unknown{color:#f0ad4e;font-weight:bold;}
.status-allowed{color:#5cb85c;font-weight:bold;}
.status-pending{color:#5bc0de;font-weight:bold;}
.action-btn{padding:3px 8px;border:none;border-radius:3px;cursor:pointer;font-size:12px;margin:2px;}
.allow-btn{background:#5cb85c;color:white;}
.block-btn{background:#d9534f;color:white;}
.detail-btn{background:#5bc0de;color:white;}
.stats-grid{display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:15px;margin-bottom:20px;}
.stat-card{background:white;padding:15px;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,0.1);text-align:center;}
.stat-card h3{margin:0 0 8px 0;font-size:14px;color:#666;}
.stat-number{font-size:28px;font-weight:bold;color:#333;}
.stat-number.total{color:#4a6cf7;}
.stat-number.ku9{color:#5cb85c;}
.stat-number.non-ku9{color:#d9534f;}
.stat-number.pending{color:#f0ad4e;}
.modal{display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:1000;}
.modal-content{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:white;padding:20px;border-radius:8px;max-width:800px;width:90%;max-height:80%;overflow:auto;}
.modal-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;border-bottom:1px solid #eee;padding-bottom:10px;}
.modal-title{margin:0;color:#333;}
.close-btn{background:none;border:none;font-size:20px;cursor:pointer;color:#999;}
.close-btn:hover{color:#333;}
.device-detail{font-family:monospace;background:#f8f9fa;padding:10px;border-radius:4px;overflow:auto;max-height:400px;}
</style>
</head>
<body>
<div class="container">
  <a href="./search.html?manage_token=${managementToken}" class="back-link">← 返回管理页面</a>
  
  <div class="header">
    <h1>📱 设备管理</h1>
  </div>
  
  <!-- 统计信息 -->
  <div class="stats-grid">
    <div class="stat-card">
      <h3>总设备数</h3>
      <div class="stat-number total">${deviceList.length}</div>
    </div>
    <div class="stat-card">
      <h3>酷9设备</h3>
      <div class="stat-number ku9">${deviceList.filter(d => d.ku9Status === 'confirmed').length}</div>
    </div>
    <div class="stat-card">
      <h3>非酷9设备</h3>
      <div class="stat-number non-ku9">${deviceList.filter(d => d.ku9Status === 'blocked').length}</div>
    </div>
    <div class="stat-card">
      <h3>待确认设备</h3>
      <div class="stat-number pending">${deviceList.filter(d => d.ku9Status === 'unknown').length}</div>
    </div>
  </div>
  
  <!-- 设备表格 -->
  <table class="devices-table">
    <thead>
      <tr>
        <th>设备ID</th>
        <th>IP地址</th>
        <th>User-Agent</th>
        <th>访问次数</th>
        <th>首次访问</th>
        <th>最后访问</th>
        <th>酷9状态</th>
        <th>访问状态</th>
        <th>操作</th>
      </tr>
    </thead>
    <tbody>
      ${devicesHTML}
    </tbody>
  </table>
</div>

<!-- 设备详情模态框 -->
<div id="deviceDetailModal" class="modal">
  <div class="modal-content">
    <div class="modal-header">
      <h3 class="modal-title">设备详情</h3>
      <button class="close-btn" onclick="closeModal()">×</button>
    </div>
    <div id="deviceDetailContent" class="device-detail"></div>
  </div>
</div>

<form id="markForm" method="post" style="display:none;">
  <input type="hidden" name="manage_token" value="${managementToken}">
  <input type="hidden" id="mark_device_id" name="device_id">
  <input type="hidden" id="mark_as_ku9" name="mark_as_ku9">
  <input type="hidden" name="mark_device" value="1">
</form>

<script>
// 标记设备
function markDevice(deviceId, isKu9) {
  const action = isKu9 ? '标记为酷9播放器' : '标记为非酷9播放器';
  if (confirm('确定要将此设备' + action + '吗？')) {
    document.getElementById('mark_device_id').value = deviceId;
    document.getElementById('mark_as_ku9').value = isKu9;
    document.getElementById('markForm').submit();
  }
}

// 显示设备详情
async function showDeviceDetail(deviceId) {
  try {
    // 这里可以加载更多设备详情信息
    const modal = document.getElementById('deviceDetailModal');
    const content = document.getElementById('deviceDetailContent');
    
    // 模拟加载设备详情
    content.innerHTML = '正在加载设备详情...';
    modal.style.display = 'block';
    
    // 在实际应用中，这里应该从服务器获取设备详情
    setTimeout(() => {
      content.innerHTML = \`
<strong>设备ID：</strong> \${deviceId}<br><br>
<strong>功能说明：</strong><br>
1. 设备通过IP和User-Agent自动识别<br>
2. 酷9设备需要手动确认<br>
3. 确认后设备可以正常访问<br>
4. 标记为非酷9的设备将被阻止<br><br>
<strong>操作建议：</strong><br>
• 查看设备的访问日志确认是否为酷9<br>
• 确认后设备会获得访问权限<br>
• 可以随时更改设备的标记状态
\`;
    }, 500);
    
  } catch (error) {
    console.error('加载设备详情失败:', error);
    alert('加载设备详情失败');
  }
}

// 关闭模态框
function closeModal() {
  document.getElementById('deviceDetailModal').style.display = 'none';
}

// 点击模态框外部关闭
window.onclick = function(event) {
  const modal = document.getElementById('deviceDetailModal');
  if (event.target === modal) {
    modal.style.display = 'none';
  }
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
            } else if (filterType === 'ku9_status' && !log.ku9_detected.includes(filterValue)) {
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
      ku9_confirmed: logs.filter(log => log.ku9_detected === 'confirmed').length,
      ku9_blocked: logs.filter(log => log.ku9_detected === 'blocked').length,
      ku9_unknown: logs.filter(log => !log.ku9_detected || log.ku9_detected === 'unknown').length,
      uniqueUserAgents: [...new Set(logs.map(log => log.userAgent))].length,
      uniqueIPs: [...new Set(logs.map(log => log.ip))].length
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

// 访问日志页面 HTML - 增强版，添加酷9状态列
async function getLogsHTML(logs, currentPage, totalPages, stats, filterType, filterValue, managementToken) {
  let logsTableHTML = '';
  
  if (logs.length > 0) {
    for (const log of logs) {
      const time = new Date(log.timestamp).toLocaleString('zh-CN', {
        year: 'numeric', month: '2-digit', day: '2-digit', 
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      }).replace(/\//g, '.');
      
      const statusClass = log.status === 'allowed' ? 'status-allowed' : 'status-blocked';
      const statusText = log.status === 'allowed' ? '✅ 允许' : '❌ 阻止';
      
      // 酷9状态
      let ku9StatusHTML = '';
      if (log.ku9_detected === 'confirmed') {
        ku9StatusHTML = '<span class="ku9-status confirmed">✅ 酷9</span>';
      } else if (log.ku9_detected === 'blocked') {
        ku9StatusHTML = '<span class="ku9-status blocked">❌ 非酷9</span>';
      } else {
        ku9StatusHTML = '<span class="ku9-status unknown">❓ 待确认</span>';
      }
      
      // 设备ID
      const deviceId = log.device_id || 'N/A';
      
      logsTableHTML += `
<tr>
  <td>${time}</td>
  <td><span class="${statusClass}">${statusText}</span></td>
  <td>${ku9StatusHTML}</td>
  <td><code>${log.filename || 'N/A'}</code></td>
  <td>${log.ip || 'N/A'}</td>
  <td><code>${deviceId}</code></td>
  <td>
    <div class="ua-preview" onclick="showUADetail('${log.id.replace(/'/g, "\\'")}')" title="点击查看完整UA">
      ${log.userAgent ? (log.userAgent.length > 40 ? log.userAgent.substring(0, 40) + '...' : log.userAgent) : 'N/A'}
    </div>
  </td>
  <td>${log.reason || 'N/A'}</td>
  <td>
    <button class="action-btn detail-btn" onclick="showLogDetail('${log.id.replace(/'/g, "\\'")}')">详情</button>
    <button class="action-btn mark-btn" onclick="markUA('${log.id.replace(/'/g, "\\'")}', true)" title="标记为酷9">✅</button>
    <button class="action-btn block-btn" onclick="markUA('${log.id.replace(/'/g, "\\'")}', false)" title="标记为非酷9">❌</button>
  </td>
</tr>
`;
    }
  } else {
    logsTableHTML = '<tr><td colspan="9" style="text-align:center;padding:20px;">暂无访问日志</td></tr>';
  }
  
  let paginationHTML = '';
  if (totalPages > 1) {
    paginationHTML = '<div class="pagination">';
    
    if (currentPage > 1) {
      paginationHTML += `<a href="?manage_token=${managementToken}&page=${currentPage - 1}&filter_type=${filterType}&filter_value=${encodeURIComponent(filterValue)}" class="page-link">上一页</a>`;
    }
    
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
      if (i === currentPage) {
        paginationHTML += `<span class="page-link current">${i}</span>`;
      } else {
        paginationHTML += `<a href="?manage_token=${managementToken}&page=${i}&filter_type=${filterType}&filter_value=${encodeURIComponent(filterValue)}" class="page-link">${i}</a>`;
      }
    }
    
    if (currentPage < totalPages) {
      paginationHTML += `<a href="?manage_token=${managementToken}&page=${currentPage + 1}&filter_type=${filterType}&filter_value=${encodeURIComponent(filterValue)}" class="page-link">下一页</a>`;
    }
    
    paginationHTML += '</div>';
  }
  
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>访问日志分析</title>
<style>
body{font-family:"Segoe UI",Tahoma,sans-serif;font-size:14px;color:#333;margin:0;padding:10px;background:#f5f5f5;}
.logs-container{max-width:100%;margin:0 auto;}
.back-link{display:inline-block;margin-bottom:15px;color:#4a6cf7;text-decoration:none;padding:6px 12px;background:white;border-radius:4px;border:1px solid #ddd;}
.stats-grid{display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:15px;margin-bottom:20px;}
.stat-card{background:white;padding:15px;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,0.1);text-align:center;}
.stat-card h3{margin:0 0 8px 0;font-size:14px;color:#666;}
.stat-number{font-size:28px;font-weight:bold;color:#333;}
.stat-number.total{color:#4a6cf7;}
.stat-number.today{color:#28a745;}
.stat-number.allowed{color:#5cb85c;}
.stat-number.blocked{color:#d9534f;}
.stat-number.ku9-confirmed{color:#5cb85c;}
.stat-number.ku9-blocked{color:#d9534f;}
.stat-number.ku9-unknown{color:#f0ad4e;}
.filters{background:white;padding:15px;border-radius:8px;margin-bottom:15px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;}
.filter-input{padding:6px 10px;border:1px solid #ddd;border-radius:4px;min-width:200px;}
.filter-btn{background:#4a6cf7;color:white;border:none;padding:6px 15px;border-radius:4px;cursor:pointer;}
.logs-table{width:100%;border-collapse:collapse;background:white;border-radius:8px;overflow:hidden;box-shadow:0 2px 4px rgba(0,0,0,0.1);}
.logs-table th{background:#4a6cf7;color:white;padding:12px 8px;text-align:left;font-weight:normal;}
.logs-table td{padding:8px;border-bottom:1px solid #eee;}
.logs-table tr:hover{background:#f9f9f9;}
.status-allowed{color:#5cb85c;font-weight:bold;}
.status-blocked{color:#d9534f;font-weight:bold;}
.ku9-status.confirmed{color:#5cb85c;font-weight:bold;}
.ku9-status.blocked{color:#d9534f;font-weight:bold;}
.ku9-status.unknown{color:#f0ad4e;font-weight:bold;}
.ua-preview{padding:4px;background:#f9f9f9;border-radius:3px;cursor:pointer;max-width:300px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.ua-preview:hover{background:#e3f2fd;}
.action-btn{padding:3px 8px;border:none;border-radius:3px;cursor:pointer;font-size:12px;margin:2px;}
.detail-btn{background:#5bc0de;color:white;}
.mark-btn{background:#5cb85c;color:white;padding:3px 6px;}
.block-btn{background:#d9534f;color:white;padding:3px 6px;}
.pagination{margin-top:20px;text-align:center;}
.page-link{display:inline-block;padding:6px 12px;margin:0 2px;border:1px solid #ddd;border-radius:4px;text-decoration:none;color:#333;}
.page-link:hover{background:#f0f0f0;}
.page-link.current{background:#4a6cf7;color:white;border-color:#4a6cf7;}
.modal{display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:1000;}
.modal-content{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:white;padding:20px;border-radius:8px;max-width:800px;width:90%;max-height:80%;overflow:auto;}
.modal-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;border-bottom:1px solid #eee;padding-bottom:10px;}
.modal-title{margin:0;color:#333;}
.close-btn{background:none;border:none;font-size:20px;cursor:pointer;color:#999;}
.close-btn:hover{color:#333;}
.log-detail{font-family:monospace;background:#f8f9fa;padding:10px;border-radius:4px;overflow:auto;max-height:400px;}
.clear-logs-btn{background:#d9534f;color:white;border:none;padding:8px 15px;border-radius:4px;cursor:pointer;margin-left:10px;}
.clear-logs-btn:hover{background:#c9302c;}
.export-btn{background:#5cb85c;color:white;border:none;padding:8px 15px;border-radius:4px;cursor:pointer;margin-left:10px;}
.export-btn:hover{background:#4cae4c;}
.devices-btn{background:#5bc0de;color:white;border:none;padding:8px 15px;border-radius:4px;cursor:pointer;margin-left:10px;}
.devices-btn:hover{background:#46b8da;}
</style>
</head>

<body>
<div class="logs-container">
  <a href="./search.html?manage_token=${managementToken}" class="back-link">← 返回管理页面</a>
  
  <div class="stats-grid">
    <div class="stat-card">
      <h3>总访问量</h3>
      <div class="stat-number total">${stats.total}</div>
    </div>
    <div class="stat-card">
      <h3>今日访问</h3>
      <div class="stat-number today">${stats.today}</div>
    </div>
    <div class="stat-card">
      <h3>允许访问</h3>
      <div class="stat-number allowed">${stats.allowed}</div>
    </div>
    <div class="stat-card">
      <h3>阻止访问</h3>
      <div class="stat-number blocked">${stats.blocked}</div>
    </div>
    <div class="stat-card">
      <h3>酷9已确认</h3>
      <div class="stat-number ku9-confirmed">${stats.ku9_confirmed}</div>
    </div>
    <div class="stat-card">
      <h3>酷9已阻止</h3>
      <div class="stat-number ku9-blocked">${stats.ku9_blocked}</div>
    </div>
    <div class="stat-card">
      <h3>待确认</h3>
      <div class="stat-number ku9-unknown">${stats.ku9_unknown}</div>
    </div>
  </div>
  
  <div class="filters">
    <form method="get" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
      <input type="hidden" name="manage_token" value="${managementToken}">
      <select name="filter_type" class="filter-input">
        <option value="all" ${filterType === 'all' ? 'selected' : ''}>所有类型</option>
        <option value="filename" ${filterType === 'filename' ? 'selected' : ''}>文件名</option>
        <option value="user_agent" ${filterType === 'user_agent' ? 'selected' : ''}>User-Agent</option>
        <option value="ip" ${filterType === 'ip' ? 'selected' : ''}>IP地址</option>
        <option value="status" ${filterType === 'status' ? 'selected' : ''}>访问状态</option>
        <option value="ku9_status" ${filterType === 'ku9_status' ? 'selected' : ''}>酷9状态</option>
      </select>
      <input type="text" name="filter_value" value="${filterValue}" placeholder="筛选条件..." class="filter-input">
      <button type="submit" class="filter-btn">筛选</button>
      <button type="button" class="export-btn" onclick="exportLogs()">导出日志</button>
      <button type="button" class="devices-btn" onclick="location.href='devices.html?manage_token=${managementToken}'">设备管理</button>
      <button type="button" class="clear-logs-btn" onclick="clearLogs()">清空日志</button>
    </form>
  </div>
  
  <table class="logs-table">
    <thead>
      <tr>
        <th>时间</th>
        <th>状态</th>
        <th>酷9状态</th>
        <th>文件名</th>
        <th>IP地址</th>
        <th>设备ID</th>
        <th>User-Agent (预览)</th>
        <th>原因</th>
        <th>操作</th>
      </tr>
    </thead>
    <tbody>
      ${logsTableHTML}
    </tbody>
  </table>
  
  ${paginationHTML}
</div>

<!-- 模态框 -->
<div id="logDetailModal" class="modal">
  <div class="modal-content">
    <div class="modal-header">
      <h3 class="modal-title">日志详情</h3>
      <button class="close-btn" onclick="closeModal()">×</button>
    </div>
    <div id="logDetailContent" class="log-detail"></div>
  </div>
</div>

<script>
// 显示日志详情
function showLogDetail(logId) {
  fetch('/api_log_detail?manage_token=${managementToken}&log_id=' + encodeURIComponent(logId))
    .then(response => response.json())
    .then(data => {
      const modal = document.getElementById('logDetailModal');
      const content = document.getElementById('logDetailContent');
      
      let html = '';
      if (data.log) {
        const log = data.log;
        html += \`<strong>时间：</strong> \${new Date(log.timestamp).toLocaleString()}<br><br>\`;
        html += \`<strong>状态：</strong> \${log.status === 'allowed' ? '✅ 允许访问' : '❌ 阻止访问'}<br><br>\`;
        html += \`<strong>酷9状态：</strong> \${log.ku9_detected || 'unknown'}<br><br>\`;
        html += \`<strong>设备ID：</strong> \${log.device_id || 'N/A'}<br><br>\`;
        html += \`<strong>文件名：</strong> \${log.filename || 'N/A'}<br><br>\`;
        html += \`<strong>IP地址：</strong> \${log.ip || 'N/A'}<br><br>\`;
        html += \`<strong>User-Agent：</strong><br>\${log.userAgent || 'N/A'}<br><br>\`;
        html += \`<strong>访问原因：</strong> \${log.reason || 'N/A'}<br><br>\`;
        html += \`<strong>完整日志：</strong><br><code>\${JSON.stringify(log, null, 2)}</code>\`;
      } else {
        html = '日志详情加载失败';
      }
      
      content.innerHTML = html;
      modal.style.display = 'block';
    })
    .catch(error => {
      console.error('加载日志详情失败:', error);
      alert('加载日志详情失败');
    });
}

// 标记UA为酷9或非酷9
function markUA(logId, isKu9) {
  const action = isKu9 ? '标记为酷9播放器' : '标记为非酷9播放器';
  if (confirm('确定要将此UA' + action + '吗？')) {
    fetch('/api_mark_ua?manage_token=${managementToken}', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'log_id=' + encodeURIComponent(logId) + '&is_ku9=' + isKu9
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        alert('标记成功');
        location.reload();
      } else {
        alert('标记失败: ' + (data.error || ''));
      }
    })
    .catch(error => {
      console.error('标记UA失败:', error);
      alert('标记失败');
    });
  }
}

// 关闭模态框
function closeModal() {
  document.getElementById('logDetailModal').style.display = 'none';
}

// 导出日志
function exportLogs() {
  const filterType = '${filterType}';
  const filterValue = '${filterValue}';
  window.open('/api_export_logs?manage_token=${managementToken}&filter_type=' + encodeURIComponent(filterType) + '&filter_value=' + encodeURIComponent(filterValue), '_blank');
}

// 清空日志
function clearLogs() {
  if (confirm('确定要清空所有访问日志吗？此操作不可恢复！')) {
    fetch('/api_clear_logs?manage_token=${managementToken}', { method: 'POST' })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          alert('日志已清空');
          location.reload();
        } else {
          alert('清空失败: ' + (data.error || ''));
        }
      })
      .catch(error => {
        console.error('清空日志失败:', error);
        alert('清空日志失败');
      });
  }
}

// 点击模态框外部关闭
window.onclick = function(event) {
  const modal = document.getElementById('logDetailModal');
  if (event.target === modal) {
    modal.style.display = 'none';
  }
}
</script>
</body>
</html>`;
}

// 搜索管理页面 HTML - 保持不变
async function getSearchHTML(request, env, managementToken) {
  // ... 保持原有代码不变，增加酷9管理链接 ...
  // 在原有的返回HTML中，在按钮区域添加：
  // <button type="button" class="search-btn" onclick="location.href='ku9.html?manage_token=${managementToken}'">🎯 酷9令牌</button>
  // 由于代码过长，这里省略重复部分，您可以将上面的按钮添加到现有的按钮组中
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

// 记录访问日志函数 - 增强版，记录设备信息
async function logAccess(env, request, filename, status, reason, userAgent, ip, ku9Detected = 'unknown', deviceId = null) {
  try {
    const timestamp = Date.now();
    const logId = `log_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 如果没有设备ID，生成一个
    if (!deviceId) {
      deviceId = await generateDeviceFingerprint(ip, userAgent);
      deviceId = deviceId.substring(0, 16); // 取前16位
    }
    
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
      ku9_detected: ku9Detected,
      device_id: deviceId,
      ku9_token_used: request.headers.get('X-Ku9-Token') || new URL(request.url).searchParams.get('ku9_token') || false
    };
    
    await env.MY_TEXT_STORAGE.put(logId, JSON.stringify(logData), { 
      expirationTtl: 2592000 // 30天过期
    });
    
    console.log('✅ 日志已保存:', logId, filename, status, '酷9状态:', ku9Detected);
    
    return logId;
  } catch (error) {
    console.error('❌ 记录访问日志失败:', error);
    return null;
  }
}

// 酷9播放器检测函数 - 增强版
async function detectKu9Player(userAgent, requestHeaders, ip, env) {
  const lowerUserAgent = (userAgent || '').toLowerCase();
  
  // 1. 检查是否有手动标记
  const uaHash = await hashString(userAgent);
  const manualMark = await env.MY_TEXT_STORAGE.get(`ku9_mark_${uaHash}`);
  
  if (manualMark === 'confirmed') {
    return { isKu9: true, confidence: 100, method: 'manual_confirmed' };
  } else if (manualMark === 'blocked') {
    return { isKu9: false, confidence: 100, method: 'manual_blocked' };
  }
  
  // 2. 检查酷9专属特征
  const ku9Signatures = [
    { pattern: /^mtv$/i, weight: 100 }, // 完全匹配"MTV"
    { pattern: /ku9[-\s]?player/i, weight: 95 },
    { pattern: /酷9[-\s]?播放器/i, weight: 95 },
    { pattern: /k9[-\s]?player/i, weight: 90 },
    { pattern: /com\.ku9\.player/i, weight: 85 },
    { pattern: /ku9.*android/i, weight: 80 },
    { pattern: /android.*ku9/i, weight: 80 },
    { pattern: /ku9.*tv/i, weight: 75 },
    { pattern: /tv.*ku9/i, weight: 75 },
    { pattern: /okhttp.*ku9/i, weight: 70 },
    { pattern: /ku9.*okhttp/i, weight: 70 }
  ];
  
  let totalWeight = 0;
  let matchedMethods = [];
  
  for (const signature of ku9Signatures) {
    if (signature.pattern.test(userAgent)) {
      totalWeight += signature.weight;
      matchedMethods.push(signature.pattern.toString());
    }
  }
  
  // 3. 检查请求头特征
  const ku9Headers = [
    'x-ku9-version',
    'x-ku9-device',
    'x-player-type',
    'x-ku9-player'
  ];
  
  for (const header of ku9Headers) {
    if (requestHeaders.get(header)) {
      totalWeight += 60;
      matchedMethods.push(`header_${header}`);
      break;
    }
  }
  
  // 4. 检查设备ID特征
  const deviceId = requestHeaders.get('X-Device-ID');
  if (deviceId && deviceId.includes('ku9')) {
    totalWeight += 50;
    matchedMethods.push('device_id_ku9');
  }
  
  // 5. 检查已知的酷9设备IP模式
  const knownKu9IPs = await env.MY_TEXT_STORAGE.get('ku9_known_ips');
  if (knownKu9IPs) {
    try {
      const ips = JSON.parse(knownKu9IPs);
      if (ips.includes(ip)) {
        totalWeight += 80;
        matchedMethods.push('known_ip');
      }
    } catch (e) {
      console.error('解析已知IP列表失败:', e);
    }
  }
  
  // 判断结果
  if (totalWeight >= 70) {
    return { 
      isKu9: true, 
      confidence: Math.min(totalWeight, 100),
      method: matchedMethods.join(', '),
      features: matchedMethods
    };
  } else if (totalWeight >= 40) {
    return { 
      isKu9: null, // 不确定
      confidence: totalWeight,
      method: matchedMethods.join(', '),
      features: matchedMethods
    };
  } else {
    return { 
      isKu9: false, 
      confidence: 100 - totalWeight,
      method: 'no_ku9_signature',
      features: []
    };
  }
}

// 酷9专用下载端点
async function handleKu9SecureDownload(filename, request, env) {
  try {
    // 解码文件名
    const decodedFilename = decodeURIComponent(filename);
    const safeFilename = sanitizeFilename(decodedFilename);
    const content = await env.MY_TEXT_STORAGE.get('file_' + safeFilename);
    
    if (!content) {
      await logAccess(env, request, safeFilename, 'blocked', '文件不存在', 
                     request.headers.get('User-Agent'), 
                     request.headers.get('CF-Connecting-IP'),
                     'unknown');
      
      return new Response('文件不存在', { 
        status: 404,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }
    
    // 获取酷9令牌
    const url = new URL(request.url);
    const ku9Token = request.headers.get('X-Ku9-Token') || url.searchParams.get('ku9_token');
    
    if (!ku9Token) {
      await logAccess(env, request, safeFilename, 'blocked', '缺少酷9令牌', 
                     request.headers.get('User-Agent'), 
                     request.headers.get('CF-Connecting-IP'),
                     'blocked');
      
      return new Response('酷9令牌缺失', { 
        status: 401,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }
    
    // 验证酷9令牌
    const tokenData = await env.MY_TEXT_STORAGE.get(`ku9_token_${ku9Token}`);
    if (!tokenData) {
      await logAccess(env, request, safeFilename, 'blocked', '无效的酷9令牌', 
                     request.headers.get('User-Agent'), 
                     request.headers.get('CF-Connecting-IP'),
                     'blocked');
      
      return new Response('无效的酷9令牌', { 
        status: 401,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }
    
    const tokenInfo = JSON.parse(tokenData);
    
    // 检查令牌状态
    if (!tokenInfo.enabled) {
      await logAccess(env, request, safeFilename, 'blocked', '令牌已禁用', 
                     request.headers.get('User-Agent'), 
                     request.headers.get('CF-Connecting-IP'),
                     'blocked');
      
      return new Response('酷9令牌已禁用', { 
        status: 403,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }
    
    // 检查过期时间
    if (Date.now() > tokenInfo.expires_at) {
      await logAccess(env, request, safeFilename, 'blocked', '令牌已过期', 
                     request.headers.get('User-Agent'), 
                     request.headers.get('CF-Connecting-IP'),
                     'blocked');
      
      return new Response('酷9令牌已过期', { 
        status: 403,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }
    
    // 检查使用次数
    if (tokenInfo.used_count >= tokenInfo.max_usage) {
      await logAccess(env, request, safeFilename, 'blocked', '令牌使用次数超限', 
                     request.headers.get('User-Agent'), 
                     request.headers.get('CF-Connecting-IP'),
                     'blocked');
      
      return new Response('酷9令牌使用次数超限', { 
        status: 403,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }
    
    // 检查IP限制
    const clientIP = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
    if (tokenInfo.allowed_ips && tokenInfo.allowed_ips.length > 0) {
      if (!tokenInfo.allowed_ips.includes(clientIP)) {
        await logAccess(env, request, safeFilename, 'blocked', 'IP地址不在允许列表中', 
                       request.headers.get('User-Agent'), 
                       clientIP,
                       'blocked');
        
        return new Response('IP地址未授权', { 
          status: 403,
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
            'X-Content-Type-Options': 'nosniff'
          }
        });
      }
    }
    
    // 检测是否为酷9播放器
    const ku9Detection = await detectKu9Player(
      request.headers.get('User-Agent'),
      request.headers,
      clientIP,
      env
    );
    
    // 只有真正的酷9播放器才能使用酷9令牌
    if (!ku9Detection.isKu9) {
      await logAccess(env, request, safeFilename, 'blocked', '非酷9播放器使用酷9令牌', 
                     request.headers.get('User-Agent'), 
                     clientIP,
                     'blocked');
      
      return new Response('非酷9播放器不能使用酷9令牌', { 
        status: 403,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }
    
    // 更新令牌使用信息
    tokenInfo.used_count++;
    tokenInfo.last_used = Date.now();
    await env.MY_TEXT_STORAGE.put(`ku9_token_${ku9Token}`, JSON.stringify(tokenInfo));
    
    // 记录成功的访问
    await logAccess(env, request, safeFilename, 'allowed', 
                   `酷9令牌访问，检测方法: ${ku9Detection.method}`, 
                   request.headers.get('User-Agent'), 
                   clientIP,
                   'confirmed');
    
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
    }
    
    // 返回加密内容
    return new Response(encryptedContent, {
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Ku9-Token, X-Device-ID',
        'X-Content-Type-Options': 'nosniff',
        'X-Encryption-Time': timestamp.toString(),
        'X-Encryption-Version': '2.0',
        'X-Ku9-Access': 'authorized',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
  } catch (error) {
    console.error('酷9文件下载错误:', error);
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

// 安全文件下载处理 - 通用端点，支持酷9令牌
async function handleSecureFileDownload(filename, request, env) {
  try {
    const decodedFilename = decodeURIComponent(filename);
    const safeFilename = sanitizeFilename(decodedFilename);
    const content = await env.MY_TEXT_STORAGE.get('file_' + safeFilename);
    
    if (!content) {
      await logAccess(env, request, safeFilename, 'blocked', '文件不存在', 
                     request.headers.get('User-Agent'), 
                     request.headers.get('CF-Connecting-IP'),
                     'unknown');
      
      return new Response('文件不存在', { 
        status: 404,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }
    
    // 检查管理令牌
    const url = new URL(request.url);
    const managementToken = url.searchParams.get('manage_token');
    const expectedToken = await env.MY_TEXT_STORAGE.get('management_token') || 'default_manage_token_2024';
    
    if (managementToken && managementToken === expectedToken) {
      await logAccess(env, request, safeFilename, 'allowed', '管理访问', 
                     request.headers.get('User-Agent'), 
                     request.headers.get('CF-Connecting-IP'),
                     'confirmed');
      
      let contentType = 'text/plain; charset=utf-8';
      if (safeFilename.endsWith('.json')) {
        contentType = 'application/json; charset=utf-8';
      } else if (safeFilename.endsWith('.m3u') || safeFilename.endsWith('.m3u8')) {
        contentType = 'audio/x-mpegurl; charset=utf-8';
      }
      
      return new Response(content, {
        headers: {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*',
          'X-Content-Type-Options': 'nosniff',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    }
    
    const userAgent = request.headers.get('User-Agent') || '';
    const clientIP = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
    
    // 检测酷9播放器
    const ku9Detection = await detectKu9Player(userAgent, request.headers, clientIP, env);
    
    // 检查酷9令牌
    const ku9Token = request.headers.get('X-Ku9-Token') || url.searchParams.get('ku9_token');
    
    // 决策逻辑
    let allowAccess = false;
    let reason = '';
    let ku9Status = 'unknown';
    
    if (ku9Token) {
      // 有酷9令牌的情况
      const tokenData = await env.MY_TEXT_STORAGE.get(`ku9_token_${ku9Token}`);
      
      if (!tokenData) {
        reason = '无效的酷9令牌';
        ku9Status = 'blocked';
      } else {
        const tokenInfo = JSON.parse(tokenData);
        
        if (!tokenInfo.enabled) {
          reason = '酷9令牌已禁用';
          ku9Status = 'blocked';
        } else if (Date.now() > tokenInfo.expires_at) {
          reason = '酷9令牌已过期';
          ku9Status = 'blocked';
        } else if (tokenInfo.used_count >= tokenInfo.max_usage) {
          reason = '酷9令牌使用次数超限';
          ku9Status = 'blocked';
        } else if (!ku9Detection.isKu9) {
          reason = '非酷9播放器使用酷9令牌';
          ku9Status = 'blocked';
        } else {
          // 验证通过
          allowAccess = true;
          reason = `酷9令牌访问，检测方法: ${ku9Detection.method}`;
          ku9Status = 'confirmed';
          
          // 更新令牌使用信息
          tokenInfo.used_count++;
          tokenInfo.last_used = Date.now();
          await env.MY_TEXT_STORAGE.put(`ku9_token_${ku9Token}`, JSON.stringify(tokenInfo));
        }
      }
    } else {
      // 没有酷9令牌的情况，使用原有检测逻辑
      const lowerUserAgent = userAgent.toLowerCase();
      
      // 播放器白名单
      const playerWhitelist = [
        'tvbox', 'tv-box', 'tv.box', '影视仓', 'yingshicang',
        'ku9', 'k9player', 'k9 player', '酷9', 'k9',
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
        'm3u', 'm3u8', 'hls'
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
      
      const isPlayer = playerWhitelist.some(player => lowerUserAgent.includes(player));
      const isSniffer = snifferBlacklist.some(sniffer => lowerUserAgent.includes(sniffer));
      
      if (isSniffer) {
        allowAccess = false;
        reason = '抓包软件被阻止';
        ku9Status = 'blocked';
      } else if (isPlayer) {
        allowAccess = true;
        reason = '播放器访问';
        ku9Status = ku9Detection.isKu9 ? 'confirmed' : 'unknown';
      } else {
        allowAccess = false;
        reason = '未识别的客户端';
        ku9Status = 'blocked';
      }
    }
    
    // 如果不允许访问
    if (!allowAccess) {
      await logAccess(env, request, safeFilename, 'blocked', reason, userAgent, clientIP, ku9Status);
      
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
          'X-Ku9-Status': ku9Status
        }
      });
    }
    
    // 生成设备ID
    const deviceId = await generateDeviceFingerprint(clientIP, userAgent);
    const shortDeviceId = deviceId.substring(0, 16);
    
    // 记录允许的访问日志
    await logAccess(env, request, safeFilename, 'allowed', reason, userAgent, clientIP, ku9Status, shortDeviceId);
    
    // 动态时间加密内容
    const timestamp = Math.floor(Date.now() / 60000);
    const encryptedContent = dynamicEncrypt(content, timestamp);
    
    // 设置Content-Type
    let contentType = 'text/plain; charset=utf-8';
    if (safeFilename.endsWith('.json')) {
      contentType = 'application/json; charset=utf-8';
    } else if (safeFilename.endsWith('.m3u') || safeFilename.endsWith('.m3u8')) {
      contentType = 'audio/x-mpegurl; charset=utf-8';
    }
    
    // 返回加密内容
    return new Response(encryptedContent, {
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Client-Time, X-Management-Access, X-Ku9-Token, X-Device-ID',
        'X-Content-Type-Options': 'nosniff',
        'X-Encryption-Time': timestamp.toString(),
        'X-Encryption-Version': '1.0',
        'X-Ku9-Status': ku9Status,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
  } catch (error) {
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

// API处理函数
async function handleGenerateKu9Token(request, env) {
  try {
    const formData = await parseFormData(request);
    const managementToken = new URL(request.url).searchParams.get('manage_token');
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
    
    const deviceName = formData.device_name || '未命名设备';
    const expiresDays = parseInt(formData.expires_days) || 30;
    const maxUsage = parseInt(formData.max_usage) || 1000;
    
    // 生成令牌
    const token = generateToken();
    const tokenData = {
      token: token,
      device_name: deviceName,
      created_at: Date.now(),
      expires_at: Date.now() + (expiresDays * 24 * 60 * 60 * 1000),
      max_usage: maxUsage,
      used_count: 0,
      last_used: 0,
      enabled: true,
      description: formData.description || '',
      allowed_ips: formData.allowed_ips ? formData.allowed_ips.split(',').map(ip => ip.trim()).filter(ip => ip) : []
    };
    
    await env.MY_TEXT_STORAGE.put(`ku9_token_${token}`, JSON.stringify(tokenData));
    
    return new Response(JSON.stringify({
      success: true,
      token: token,
      data: tokenData
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

async function handleDeleteKu9Token(request, env) {
  try {
    const formData = await parseFormData(request);
    const managementToken = new URL(request.url).searchParams.get('manage_token');
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
    
    const token = formData.token;
    if (!token) {
      return new Response(JSON.stringify({
        success: false,
        error: '缺少令牌参数'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }
    
    await env.MY_TEXT_STORAGE.delete(`ku9_token_${token}`);
    
    return new Response(JSON.stringify({
      success: true,
      message: '令牌已删除'
    }), {
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff'
      }
    });
    
  } catch (error) {
    console.error('删除酷9令牌错误:', error);
    return new Response(JSON.stringify({
      success: false,
      error: `删除酷9令牌失败: ${error.message}`
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }
}

async function handleMarkUA(request, env) {
  try {
    const formData = await parseFormData(request);
    const managementToken = new URL(request.url).searchParams.get('manage_token');
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
    
    const logId = formData.log_id;
    const isKu9 = formData.is_ku9 === 'true';
    
    if (!logId) {
      return new Response(JSON.stringify({
        success: false,
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
        success: false,
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
    
    // 保存UA标记
    const uaHash = await hashString(log.userAgent);
    await env.MY_TEXT_STORAGE.put(`ku9_mark_${uaHash}`, isKu9 ? 'confirmed' : 'blocked');
    
    // 更新日志
    log.ku9_detected = isKu9 ? 'confirmed' : 'blocked';
    await env.MY_TEXT_STORAGE.put(logKey, JSON.stringify(log));
    
    return new Response(JSON.stringify({
      success: true,
      message: `UA已标记为${isKu9 ? '酷9播放器' : '非酷9播放器'}`
    }), {
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff'
      }
    });
    
  } catch (error) {
    console.error('标记UA错误:', error);
    return new Response(JSON.stringify({
      success: false,
      error: `标记UA失败: ${error.message}`
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }
}

async function handleUpdateDevice(request, env) {
  try {
    const formData = await parseFormData(request);
    const managementToken = new URL(request.url).searchParams.get('manage_token');
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
    
    const deviceToken = formData.device_token;
    const enabled = formData.enabled === 'true';
    
    if (!deviceToken) {
      return new Response(JSON.stringify({
        success: false,
        error: '缺少设备令牌'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }
    
    const tokenData = await env.MY_TEXT_STORAGE.get(`ku9_token_${deviceToken}`);
    if (!tokenData) {
      return new Response(JSON.stringify({
        success: false,
        error: '设备令牌不存在'
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }
    
    const tokenInfo = JSON.parse(tokenData);
    tokenInfo.enabled = enabled;
    
    await env.MY_TEXT_STORAGE.put(`ku9_token_${deviceToken}`, JSON.stringify(tokenInfo));
    
    return new Response(JSON.stringify({
      success: true,
      message: `设备令牌已${enabled ? '启用' : '禁用'}`
    }), {
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff'
      }
    });
    
  } catch (error) {
    console.error('更新设备错误:', error);
    return new Response(JSON.stringify({
      success: false,
      error: `更新设备失败: ${error.message}`
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }
}

// 其他API处理函数保持不变
async function handleReadFile(request, env) {
  // ... 保持原有代码不变 ...
}

async function handleUploadFile(request, env) {
  // ... 保持原有代码不变 ...
}

async function handleUpdatePassword(request, env) {
  // ... 保持原有代码不变 ...
}

async function handleGetEncryptionKey(request, env) {
  // ... 保持原有代码不变 ...
}

async function handleLogDetail(request, env) {
  // ... 保持原有代码不变 ...
}

async function handleUADetail(request, env) {
  // ... 保持原有代码不变 ...
}

async function handleExportLogs(request, env) {
  // ... 保持原有代码不变 ...
}

async function handleClearLogs(request, env) {
  // ... 保持原有代码不变 ...
}

// 辅助函数
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

// 生成随机令牌
function generateToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// 生成字符串哈希
async function hashString(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// 生成设备指纹
async function generateDeviceFingerprint(ip, userAgent) {
  const combined = `${ip}|${userAgent}`;
  return await hashString(combined);
}

// 管理登录页面 - 保持不变
async function getManagementLoginHTML(request) {
  // ... 保持原有代码不变 ...
}
