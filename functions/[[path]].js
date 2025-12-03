// Cloudflare Pages Functions - 简洁高效安全文本存储
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  // 处理预检请求
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
      }
    });
  }

  try {
    // 主页
    if (pathname === '/' || pathname === '/index.html') {
      return new Response(await getIndexHTML(), {
        headers: { 
          'content-type': 'text/html;charset=UTF-8',
          'Cache-Control': 'no-cache'
        },
      });
    }

    // 搜索管理页面
    if (pathname === '/search.html' || pathname === '/search.php') {
      const url = new URL(request.url);
      const managementToken = url.searchParams.get('manage_token');
      const expectedToken = await env.MY_TEXT_STORAGE.get('management_token') || 'default_manage_token_2024';
      
      if (!managementToken || managementToken !== expectedToken) {
        return new Response(await getManagementLoginHTML(), {
          headers: { 
            'content-type': 'text/html;charset=UTF-8',
            'Cache-Control': 'no-cache'
          },
        });
      }
      
      return new Response(await getSearchHTML(env, managementToken), {
        headers: { 
          'content-type': 'text/html;charset=UTF-8',
          'Cache-Control': 'no-cache'
        },
      });
    }

    // 读取文件
    if (pathname === '/read0.php' && request.method === 'GET') {
      return await handleReadFile(request, env);
    }

    // 上传文件
    if (pathname === '/upload.php' && request.method === 'POST') {
      return await handleUploadFile(request, env);
    }

    // 更新密码
    if (pathname === '/update_password.php' && request.method === 'POST') {
      return await handleUpdatePassword(request, env);
    }

    // 安全下载文件
    if (pathname.startsWith('/z/')) {
      const filename = pathname.substring(3);
      return await handleSecureDownload(filename, request, env);
    }

    // 默认主页
    return new Response(await getIndexHTML(), {
      headers: { 
        'content-type': 'text/html;charset=UTF-8',
        'Cache-Control': 'no-cache'
      },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(`Error: ${error.message}`, { 
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}

// ==================== 主页HTML ====================
async function getIndexHTML() {
  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>安全文本存储</title>
    <style>
        body { font-family: Arial; margin: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; }
        h2 { color: #333; }
        textarea { width: 100%; height: 200px; padding: 10px; border: 1px solid #ddd; }
        input { padding: 8px; margin: 5px 0; border: 1px solid #ddd; }
        button { background: #4CAF50; color: white; padding: 10px 20px; border: none; cursor: pointer; }
        .link-box { background: #e8f5e8; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .security-note { background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h2>🔒 安全文本存储系统</h2>
        
        <div class="security-note">
            <strong>安全特性：</strong>
            1. 动态加密 - 每次访问内容不同<br>
            2. 播放器专用 - 只允许TVBox/酷9等<br>
            3. 防抓包 - 屏蔽蓝鸟黄鸟等工具
        </div>
        
        <p><a href="./search.html">管理页面</a></p>
        
        <form id="uploadForm">
            <div>文件名：<input type="text" id="filename" required placeholder="如：api.json"></div>
            <div>密码：<input type="text" id="password" required></div>
            <div>内容：<textarea id="content" required></textarea></div>
            <button type="button" onclick="readFile()">读取文件</button>
            <button type="button" onclick="uploadFile()">生成安全链接</button>
        </form>
        
        <div id="result" class="link-box" style="display:none;">
            <strong>✅ 安全链接已生成：</strong><br>
            <a id="link" href="" target="_blank"></a>
            <button onclick="copyLink()">复制链接</button>
        </div>
        
        <script>
            function readFile() {
                const filename = document.getElementById('filename').value;
                const password = document.getElementById('password').value;
                
                if (!filename) {
                    alert('请输入文件名');
                    return;
                }
                
                fetch('read0.php?filename=' + encodeURIComponent(filename) + 
                      '&password=' + encodeURIComponent(password))
                    .then(r => r.json())
                    .then(data => {
                        if (data.error) {
                            alert('错误：' + data.error);
                        } else {
                            document.getElementById('content').value = data.content;
                            showLink(data.fileLink);
                        }
                    })
                    .catch(e => alert('读取失败：' + e));
            }
            
            function uploadFile() {
                const filename = document.getElementById('filename').value;
                const password = document.getElementById('password').value;
                const content = document.getElementById('content').value;
                
                if (!filename || !password || !content) {
                    alert('请填写所有字段');
                    return;
                }
                
                const formData = new FormData();
                formData.append('filename', filename);
                formData.append('password', password);
                formData.append('content', content);
                
                fetch('upload.php', {
                    method: 'POST',
                    body: new URLSearchParams({
                        filename: filename,
                        password: password,
                        content: content
                    })
                })
                .then(r => r.json())
                .then(data => {
                    if (data.success) {
                        showLink(data.fileLink);
                    } else {
                        alert('失败：' + data.error);
                    }
                })
                .catch(e => alert('上传失败：' + e));
            }
            
            function showLink(link) {
                document.getElementById('link').href = link;
                document.getElementById('link').textContent = link;
                document.getElementById('result').style.display = 'block';
            }
            
            function copyLink() {
                const link = document.getElementById('link').href;
                navigator.clipboard.writeText(link).then(() => alert('已复制'));
            }
        </script>
    </div>
</body>
</html>`;
}

// ==================== 管理登录页面 ====================
async function getManagementLoginHTML() {
  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>管理登录</title>
    <style>
        body { font-family: Arial; display: flex; justify-content: center; align-items: center; height: 100vh; background: #f5f5f5; }
        .login-box { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        input { padding: 10px; margin: 10px 0; width: 300px; }
        button { background: #4CAF50; color: white; padding: 10px; border: none; width: 100%; cursor: pointer; }
    </style>
</head>
<body>
    <div class="login-box">
        <h2>🔐 管理登录</h2>
        <p>默认令牌：<code>default_manage_token_2024</code></p>
        <input type="password" id="token" placeholder="输入管理令牌">
        <button onclick="login()">登录</button>
    </div>
    <script>
        function login() {
            const token = document.getElementById('token').value;
            if (!token) return alert('请输入令牌');
            window.location.href = 'search.html?manage_token=' + encodeURIComponent(token);
        }
    </script>
</body>
</html>`;
}

// ==================== 管理页面 ====================
async function getSearchHTML(env, managementToken) {
  // 获取所有文件
  const allFiles = await env.MY_TEXT_STORAGE.list();
  const files = [];
  
  for (const key of allFiles.keys) {
    if (key.name.startsWith('file_')) {
      const filename = key.name.substring(5);
      const size = key.metadata ? key.metadata.size : 0;
      const ctime = key.metadata ? key.metadata.ctime : Date.now();
      
      files.push({
        name: filename,
        size: size,
        ctime: ctime
      });
    }
  }
  
  // 按时间排序
  files.sort((a, b) => b.ctime - a.ctime);
  
  let fileListHTML = '';
  for (const file of files) {
    const time = new Date(file.ctime).toLocaleString('zh-CN');
    const size = formatFileSize(file.size);
    
    fileListHTML += `
    <tr>
        <td><input type="checkbox" name="file" value="${file.name}"></td>
        <td><a href="/z/${encodeURIComponent(file.name)}?manage_token=${managementToken}" target="_blank">${file.name}</a></td>
        <td>${size}</td>
        <td>${time}</td>
        <td>
            <button onclick="editFile('${file.name}', '${managementToken}')">编辑</button>
            <button onclick="deleteFile('${file.name}')">删除</button>
        </td>
    </tr>`;
  }
  
  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>文件管理</title>
    <style>
        body { font-family: Arial; margin: 20px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f2f2f2; }
        button { padding: 5px 10px; margin: 2px; cursor: pointer; }
    </style>
</head>
<body>
    <h2>📁 文件管理</h2>
    <p><a href="./">返回主页</a></p>
    
    <button onclick="editFile('', '${managementToken}')">新建文件</button>
    
    <table>
        <tr>
            <th><input type="checkbox" onclick="toggleAll(this)"></th>
            <th>文件名</th>
            <th>大小</th>
            <th>创建时间</th>
            <th>操作</th>
        </tr>
        ${fileListHTML}
    </table>
    
    <script>
        function toggleAll(source) {
            const checkboxes = document.querySelectorAll('input[name="file"]');
            checkboxes.forEach(checkbox => checkbox.checked = source.checked);
        }
        
        function editFile(filename, token) {
            const url = filename ? 
                '/z/' + encodeURIComponent(filename) + '?manage_token=' + token :
                '';
            window.open(url || 'about:blank', '_blank');
        }
        
        function deleteFile(filename) {
            if (!confirm('确定删除 ' + filename + ' 吗？')) return;
            // 这里需要实现删除逻辑
            alert('删除功能需要在后端实现');
        }
    </script>
</body>
</html>`;
}

// ==================== 核心安全功能 ====================

// 简单有效的混淆加密
function simpleEncrypt(text, key = '') {
  if (!text) return '';
  
  // 使用时间作为基础密钥
  const timeKey = Math.floor(Date.now() / 60000); // 每分钟变化一次
  const finalKey = key + timeKey.toString();
  
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    const keyChar = finalKey.charCodeAt(i % finalKey.length);
    // 简单的XOR加密
    const encrypted = (charCode ^ keyChar ^ (i * 13)) % 256;
    result += String.fromCharCode(encrypted);
  }
  
  // 转为Base64
  return btoa(result);
}

// 解密函数
function simpleDecrypt(encryptedText, key = '') {
  if (!encryptedText) return '';
  
  try {
    // Base64解码
    const decoded = atob(encryptedText);
    const timeKey = Math.floor(Date.now() / 60000);
    const finalKey = key + timeKey.toString();
    
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i);
      const keyChar = finalKey.charCodeAt(i % finalKey.length);
      // 反向XOR解密
      const decrypted = (charCode ^ keyChar ^ (i * 13)) % 256;
      result += String.fromCharCode(decrypted);
    }
    
    return result;
  } catch (e) {
    return '';
  }
}

// 检测播放器
function isAllowedPlayer(userAgent = '') {
  const ua = userAgent.toLowerCase();
  
  // 播放器关键词
  const playerKeywords = [
    'tvbox', 'tv-box', '影视仓', 'yingshicang',
    'ku9', 'k9player', '酷9',
    'tivimate', 'tivi',
    'vlc', 'kodi', 'mxplayer',
    'exoplayer', 'justplayer',
    'iptv', 'stb', 'mag',
    'curl', 'wget'  // 允许命令行工具
  ];
  
  return playerKeywords.some(keyword => ua.includes(keyword));
}

// 检测抓包工具
function isSniffer(userAgent = '') {
  const ua = userAgent.toLowerCase();
  
  const snifferKeywords = [
    'httpcanary', '蓝鸟', '黄鸟',
    'fiddler', 'charles', 'wireshark',
    'packetcapture', '抓包',
    'mitmproxy', 'burpsuite'
  ];
  
  return snifferKeywords.some(keyword => ua.includes(keyword));
}

// ==================== 文件处理函数 ====================

// 读取文件
async function handleReadFile(request, env) {
  const url = new URL(request.url);
  const filename = url.searchParams.get('filename');
  const password = url.searchParams.get('password');

  if (!filename) {
    return jsonResponse({error: '需要文件名'});
  }

  const safeFilename = sanitizeFilename(filename);
  
  // 检查文件
  const encryptedContent = await env.MY_TEXT_STORAGE.get('file_' + safeFilename);
  if (!encryptedContent) {
    return jsonResponse({error: '文件不存在'});
  }

  // 检查密码
  const storedPassword = await env.MY_TEXT_STORAGE.get('pwd_' + safeFilename);
  if (!storedPassword) {
    return jsonResponse({error: '密码文件不存在'});
  }

  if (!password || password !== storedPassword) {
    return jsonResponse({error: '密码错误'});
  }

  try {
    // 解密内容（管理访问直接返回原内容）
    const content = encryptedContent;
    
    const domain = request.headers.get('host');
    const fileLink = 'https://' + domain + '/z/' + encodeURIComponent(safeFilename);

    return jsonResponse({
      content: content,
      fileLink: fileLink
    });
  } catch (error) {
    return jsonResponse({error: '解密失败'});
  }
}

// 上传文件
async function handleUploadFile(request, env) {
  try {
    const formData = await parseFormData(request);
    
    const filename = formData.filename;
    const password = formData.password;
    const content = formData.content;

    if (!filename || !content) {
      return jsonResponse({
        success: false,
        error: '缺少文件名或内容'
      });
    }

    const safeFilename = sanitizeFilename(filename.trim());
    const finalPassword = password || 'default_password';
    
    // 保存文件（不加密存储，下载时动态加密）
    await env.MY_TEXT_STORAGE.put('file_' + safeFilename, content);
    await env.MY_TEXT_STORAGE.put('pwd_' + safeFilename, finalPassword);
    
    // 保存元数据
    const metadata = {
      ctime: Date.now(),
      size: content.length
    };
    await env.MY_TEXT_STORAGE.put('meta_' + safeFilename, JSON.stringify(metadata));

    const domain = request.headers.get('host');
    const link = 'https://' + domain + '/z/' + encodeURIComponent(safeFilename);

    return jsonResponse({
      success: true,
      fileLink: link,
      filename: safeFilename
    });
  } catch (error) {
    return jsonResponse({
      success: false,
      error: error.message
    });
  }
}

// 安全下载 - 这是核心安全模块
async function handleSecureDownload(filename, request, env) {
  try {
    const decodedFilename = decodeURIComponent(filename);
    const safeFilename = sanitizeFilename(decodedFilename);
    
    // 获取原始内容
    const originalContent = await env.MY_TEXT_STORAGE.get('file_' + safeFilename);
    if (!originalContent) {
      return new Response('文件不存在', { status: 404 });
    }

    // 检查管理令牌
    const url = new URL(request.url);
    const managementToken = url.searchParams.get('manage_token');
    const expectedToken = await env.MY_TEXT_STORAGE.get('management_token') || 'default_manage_token_2024';
    
    // 管理访问：返回原始内容
    if (managementToken && managementToken === expectedToken) {
      return new Response(originalContent, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache'
        }
      });
    }

    // === 客户端验证 ===
    const userAgent = request.headers.get('User-Agent') || '';
    
    // 1. 阻止抓包工具
    if (isSniffer(userAgent)) {
      console.log(`🚫 抓包工具被阻止: ${userAgent.substring(0, 100)}`);
      
      // 返回假数据
      const fakeData = `// 安全系统已阻止抓包工具访问\n// 时间: ${new Date().toISOString()}\n// 请使用合法播放器访问`;
      const encryptedFake = simpleEncrypt(fakeData, 'fake_key_' + Date.now());
      
      return new Response(encryptedFake, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'X-Security': 'BLOCKED',
          'Cache-Control': 'no-cache'
        }
      });
    }
    
    // 2. 只允许播放器访问
    if (!isAllowedPlayer(userAgent)) {
      console.log(`🚫 非法客户端: ${userAgent.substring(0, 100)}`);
      
      return new Response('// 请使用TVBox、酷9等播放器访问', {
        status: 403,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache'
        }
      });
    }
    
    // === 合法播放器访问 ===
    console.log(`✅ 播放器访问: ${userAgent.substring(0, 100)}`);
    
    // 使用动态密钥加密内容
    const timestamp = Math.floor(Date.now() / 60000); // 每分钟变化
    const dynamicKey = `player_key_${timestamp}`;
    const encryptedContent = simpleEncrypt(originalContent, dynamicKey);
    
    return new Response(encryptedContent, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Encryption': 'DYNAMIC',
        'X-Encryption-Time': timestamp.toString(),
        'Cache-Control': 'no-cache'
      }
    });
    
  } catch (error) {
    console.error('下载错误:', error);
    return new Response('系统错误', { status: 500 });
  }
}

// 更新密码
async function handleUpdatePassword(request, env) {
  const formData = await parseFormData(request);
  
  const filename = formData.filename;
  const newPassword = formData.new_password;

  if (!filename || !newPassword) {
    return jsonResponse({
      success: false,
      error: '缺少参数'
    });
  }

  const safeFilename = sanitizeFilename(filename.trim());
  
  try {
    // 检查文件是否存在
    const fileExists = await env.MY_TEXT_STORAGE.get('file_' + safeFilename);
    if (!fileExists) {
      return jsonResponse({
        success: false,
        error: '文件不存在'
      });
    }

    // 更新密码
    await env.MY_TEXT_STORAGE.put('pwd_' + safeFilename, newPassword.trim());

    return jsonResponse({
      success: true,
      message: '密码更新成功'
    });
  } catch (error) {
    return jsonResponse({
      success: false,
      error: error.message
    });
  }
}

// ==================== 辅助函数 ====================

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
  
  return {};
}

function sanitizeFilename(name) {
  if (!name) return 'unnamed';
  // 只允许字母、数字、中文、下划线、点和短横线
  return name.replace(/[^a-zA-Z0-9_\-\u4e00-\u9fa5.]/g, '_');
}

function formatFileSize(bytes) {
  if (!bytes) return '0B';
  if (bytes < 1024) return bytes + 'B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(2) + 'KB';
  return (bytes / 1048576).toFixed(2) + 'MB';
}

function jsonResponse(data) {
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
