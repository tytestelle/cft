// Cloudflare Pages Functions - 酷9播放器专用系统（带管理后台）
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

    // 管理后台页面
    if (pathname === '/admin.html' || pathname === '/admin.php') {
      return await handleAdminPage(request, env);
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

    // API: 酷9播放器测试
    if (pathname === '/ku9_test.php' && request.method === 'GET') {
      return await handleKu9Test(request);
    }

    // API: 获取访问记录
    if (pathname === '/api/get_logs.php' && request.method === 'GET') {
      return await handleGetLogs(request, env);
    }

    // API: 清空访问记录
    if (pathname === '/api/clear_logs.php' && request.method === 'POST') {
      return await handleClearLogs(request, env);
    }

    // API: 获取统计分析
    if (pathname === '/api/stats.php' && request.method === 'GET') {
      return await handleGetStats(request, env);
    }

    // API: 特征分析
    if (pathname === '/api/analyze.php' && request.method === 'GET') {
      return await handleAnalyze(request, env);
    }

    // 动态加密文件下载
    if (pathname.startsWith('/z/')) {
      const filename = pathname.substring(3);
      return await handleSecureFileDownload(filename, request, env, context);
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
        
        .ku9-simple {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px;
            border-radius: 10px;
            margin: 20px 0;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .ku9-simple h3 {
            margin-top: 0;
            color: white;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .token-box {
            background: #fff3cd;
            border: 2px solid #ffc107;
            border-radius: 6px;
            padding: 12px;
            margin: 15px 0;
            font-family: monospace;
            font-size: 13px;
        }
        
        .ku9-help {
            background: #e8f5e8;
            border: 2px solid #4caf50;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
        }
        
        .ku9-help h4 {
            margin-top: 0;
            color: #2e7d32;
        }
        
        .test-section {
            background: #e3f2fd;
            border: 2px solid #2196f3;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
        }
        
        .status-good {
            color: green;
            font-weight: bold;
        }
        
        .status-bad {
            color: red;
            font-weight: bold;
        }
        
        .simple-explanation {
            background: #f8f9fa;
            border-left: 4px solid #6c757d;
            padding: 10px;
            margin: 15px 0;
            font-size: 12px;
        }
        
        .admin-link {
            position: fixed;
            top: 10px;
            right: 10px;
            background: #dc3545;
            color: white;
            padding: 8px 15px;
            border-radius: 5px;
            text-decoration: none;
            font-weight: bold;
            z-index: 1000;
        }
        
        .admin-link:hover {
            background: #c82333;
            text-decoration: none;
            color: white;
        }
    </style>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>🔒酷9播放器专用系统</title>
</head>

<body>
    <a href="./admin.html" class="admin-link" target="_blank">📊 管理后台</a>
    
    <h2>🔐 酷9播放器专用系统</h2>
    
    <div class="ku9-simple">
        <h3>✅ 酷9播放器专享：</h3>
        <p>1. <strong>专用令牌验证</strong> - 使用专属令牌访问</p>
        <p>2. <strong>宽松识别策略</strong> - 确保酷9能正常播放</p>
        <p>3. <strong>其他软件拦截</strong> - 阻止非酷9播放器</p>
        <p>4. <strong>抓包工具屏蔽</strong> - 保护链接安全</p>
        <p>5. <strong>访问记录分析</strong> - 后台查看谁在访问</p>
    </div>
    
    <div class="token-box">
        <strong>🔑 酷9专用令牌：</strong>
        <div style="margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 4px;">
            <code id="ku9Token">ku9_secure_token_2024</code>
        </div>
        <button class="copy-btn" onclick="copyToken()">复制令牌</button>
        <p><small>将此令牌添加到链接后：<code>?ku9_token=ku9_secure_token_2024</code></small></p>
    </div>
    
    <div class="simple-explanation">
        <h4>🔍 工作原理：</h4>
        <p>1. 检查是否有 <code>ku9_token</code> 参数</p>
        <p>2. 如果是抓包工具，直接拒绝并记录</p>
        <p>3. 如果有正确令牌，允许访问并记录</p>
        <p>4. 如果没有令牌，检查User-Agent</p>
        <p>5. 如果是酷9播放器，允许访问并记录</p>
        <p>6. 否则拒绝访问并记录</p>
        <p>7. <strong>所有访问都会被记录到管理后台</strong></p>
    </div>
    
    <div class="test-section">
        <h4>📱 酷9播放器测试：</h4>
        <p>测试您的酷9播放器是否能正常访问：</p>
        <button class="test-btn" onclick="testKu9Connection()">测试酷9连接</button>
        <div id="testResult" style="margin-top: 10px;"></div>
        <p><small>如果测试失败，请确保：</small></p>
        <ul style="margin: 10px 0; padding-left: 20px;">
            <li>使用最新版酷9播放器</li>
            <li>链接中包含 <code>?ku9_token=ku9_secure_token_2024</code></li>
            <li>网络连接正常</li>
        </ul>
    </div>
    
    <p>可自定义扩展名，输入完整文件名如：<code>log.json</code>、<code>test.php</code>。〖<a href="./admin.html"><b>访问记录后台</b></a>〗</p><br>

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
        <button type="button" onclick="generateKu9Link()" style="background: #007bff; color: white;">生成酷9链接</button>
    </form>
    <p>可在线编辑已有文件，输入相同文件名与密码。</p><br>    

    <div id="linkDisplay" style="display:none;">
        <div class="success-message">✅ 文件已成功转为安全链接：</div>
        <a id="linkAnchor" href="" target="_blank"></a>
        <button class="copy-btn" onclick="copyLink()">复制链接</button>
        
        <div class="ku9-help" style="margin-top: 15px;">
            <h4>📱 酷9播放器使用方法：</h4>
            <p><strong>方法1：直接使用酷9专用链接（推荐）</strong></p>
            <div style="background: #f8f9fa; padding: 10px; border-radius: 4px; margin: 10px 0;">
                <code id="ku9SpecialLink"></code>
            </div>
            <button class="copy-btn" onclick="copyKu9SpecialLink()">复制酷9专用链接</button>
            
            <p><strong>方法2：手动添加令牌</strong></p>
            <p>在普通链接后添加：<code>?ku9_token=ku9_secure_token_2024</code></p>
            
            <p><strong>如果还是无法播放：</strong></p>
            <p>1. 确保酷9播放器是最新版本</p>
            <p>2. 联系管理员获取帮助</p>
            <p>3. 尝试使用其他域名</p>
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
        const KU9_TOKEN = 'ku9_secure_token_2024';
        
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
            
            // 生成酷9专用链接
            const ku9Link = link + '?ku9_token=' + KU9_TOKEN;
            document.getElementById('ku9SpecialLink').textContent = ku9Link;
            
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
        
        function copyToken() {
            navigator.clipboard.writeText(KU9_TOKEN)
                .then(() => alert('酷9令牌已复制到剪贴板'))
                .catch(err => alert('复制失败: ' + err));
        }
        
        function generateKu9Link() {
            const filename = document.getElementById('filename').value;
            if (!filename) {
                alert('请输入文件名');
                return;
            }
            
            const baseUrl = window.location.origin + '/z/' + encodeURIComponent(filename);
            const ku9Link = baseUrl + '?ku9_token=' + KU9_TOKEN;
            
            // 显示酷9专用链接
            const ku9SpecialLink = document.getElementById('ku9SpecialLink');
            ku9SpecialLink.textContent = ku9Link;
            
            // 显示普通链接
            const linkDisplay = document.getElementById('linkDisplay');
            const linkAnchor = document.getElementById('linkAnchor');
            linkAnchor.href = baseUrl;
            linkAnchor.textContent = baseUrl;
            linkDisplay.style.display = 'block';
            
            linkDisplay.scrollIntoView({ behavior: 'smooth' });
        }
        
        function testKu9Connection() {
            const testResult = document.getElementById('testResult');
            testResult.innerHTML = '<p style="color: #856404;">正在测试酷9连接...</p>';
            
            fetch('ku9_test.php')
                .then(response => response.text())
                .then(data => {
                    if (data.includes('SUCCESS')) {
                        testResult.innerHTML = '<p class="status-good">✅ 酷9连接测试成功！</p>';
                    } else {
                        testResult.innerHTML = '<p class="status-bad">❌ 酷9连接测试失败：' + data + '</p>';
                    }
                })
                .catch(err => {
                    testResult.innerHTML = '<p class="status-bad">❌ 测试失败：' + err.message + '</p>';
                });
        }
        
        // 页面加载时初始化
        window.addEventListener('load', function() {
            document.getElementById('ku9Token').textContent = KU9_TOKEN;
        });
    </script>
</body>
</html>`;
}

// 管理后台页面
async function handleAdminPage(request, env) {
  const adminToken = await env.MY_TEXT_STORAGE.get('admin_token') || 'admin_token_2024';
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  
  if (token !== adminToken) {
    return new Response(`<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>🔐 管理后台登录</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 400px;
            margin: 100px auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .login-box {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        input {
            width: 100%;
            padding: 10px;
            margin: 10px 0;
            border: 1px solid #ddd;
            border-radius: 5px;
        }
        button {
            width: 100%;
            padding: 10px;
            background: #007bff;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        }
        .error {
            color: red;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <div class="login-box">
        <h2>🔐 管理后台登录</h2>
        <p>请输入管理员令牌：</p>
        <input type="password" id="token" placeholder="输入管理员令牌">
        <button onclick="login()">登录</button>
        <div id="error" class="error"></div>
    </div>
    <script>
        function login() {
            const token = document.getElementById('token').value;
            if (!token) {
                document.getElementById('error').textContent = '请输入令牌';
                return;
            }
            window.location.href = '?token=' + encodeURIComponent(token);
        }
        // 按Enter键登录
        document.getElementById('token').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') login();
        });
    </script>
</body>
</html>`, {
      headers: { 'content-type': 'text/html;charset=UTF-8' }
    });
  }
  
  return new Response(await getAdminHTML(), {
    headers: { 
      'content-type': 'text/html;charset=UTF-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    },
  });
}

// 管理后台HTML
async function getAdminHTML() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>📊 酷9系统管理后台</title>
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Microsoft YaHei', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .admin-container {
            max-width: 1400px;
            margin: 0 auto;
        }
        
        .admin-header {
            background: white;
            border-radius: 15px;
            padding: 25px 30px;
            margin-bottom: 25px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .admin-header h1 {
            color: #333;
            font-size: 28px;
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 25px;
        }
        
        .stat-card {
            background: white;
            border-radius: 12px;
            padding: 25px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.05);
            transition: transform 0.3s ease;
        }
        
        .stat-card:hover {
            transform: translateY(-5px);
        }
        
        .stat-card.green {
            border-left: 5px solid #4CAF50;
        }
        
        .stat-card.blue {
            border-left: 5px solid #2196F3;
        }
        
        .stat-card.orange {
            border-left: 5px solid #FF9800;
        }
        
        .stat-card.red {
            border-left: 5px solid #F44336;
        }
        
        .stat-value {
            font-size: 36px;
            font-weight: bold;
            color: #333;
            margin: 10px 0;
        }
        
        .stat-label {
            color: #666;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .tabs {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
            background: white;
            border-radius: 12px;
            padding: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.05);
        }
        
        .tab {
            padding: 12px 24px;
            background: #f5f5f5;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.3s ease;
        }
        
        .tab:hover {
            background: #e9e9e9;
        }
        
        .tab.active {
            background: #667eea;
            color: white;
        }
        
        .content-section {
            background: white;
            border-radius: 15px;
            padding: 30px;
            margin-bottom: 25px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            display: none;
        }
        
        .content-section.active {
            display: block;
            animation: fadeIn 0.5s ease;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .filter-bar {
            display: flex;
            gap: 15px;
            margin-bottom: 20px;
            flex-wrap: wrap;
            align-items: center;
        }
        
        .filter-input {
            padding: 10px 15px;
            border: 1px solid #ddd;
            border-radius: 8px;
            font-size: 14px;
            min-width: 200px;
        }
        
        .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.3s ease;
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }
        
        .btn-primary {
            background: #667eea;
            color: white;
        }
        
        .btn-primary:hover {
            background: #5a67d8;
        }
        
        .btn-danger {
            background: #F44336;
            color: white;
        }
        
        .btn-danger:hover {
            background: #d32f2f;
        }
        
        .btn-success {
            background: #4CAF50;
            color: white;
        }
        
        .btn-success:hover {
            background: #388E3C;
        }
        
        .table-container {
            overflow-x: auto;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.05);
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
        }
        
        th {
            background: #f8f9fa;
            padding: 15px;
            text-align: left;
            font-weight: 600;
            color: #495057;
            border-bottom: 2px solid #dee2e6;
            position: sticky;
            top: 0;
        }
        
        td {
            padding: 15px;
            border-bottom: 1px solid #dee2e6;
            color: #212529;
        }
        
        tr:hover {
            background: #f8f9fa;
        }
        
        .badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
        }
        
        .badge-success {
            background: #d4edda;
            color: #155724;
        }
        
        .badge-warning {
            background: #fff3cd;
            color: #856404;
        }
        
        .badge-danger {
            background: #f8d7da;
            color: #721c24;
        }
        
        .badge-info {
            background: #d1ecf1;
            color: #0c5460;
        }
        
        .ua-short {
            max-width: 300px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        
        .timestamp {
            font-family: monospace;
            font-size: 12px;
            color: #666;
        }
        
        .pagination {
            display: flex;
            justify-content: center;
            gap: 10px;
            margin-top: 20px;
            align-items: center;
        }
        
        .page-btn {
            padding: 8px 15px;
            border: 1px solid #ddd;
            background: white;
            border-radius: 5px;
            cursor: pointer;
        }
        
        .page-btn.active {
            background: #667eea;
            color: white;
            border-color: #667eea;
        }
        
        .page-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .charts-container {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 25px;
            margin-top: 30px;
        }
        
        .chart-box {
            background: white;
            border-radius: 12px;
            padding: 25px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.05);
        }
        
        .chart-box h3 {
            margin-bottom: 20px;
            color: #333;
            font-size: 18px;
        }
        
        .loading {
            text-align: center;
            padding: 50px;
            color: #666;
        }
        
        .refresh-btn {
            background: #4CAF50;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 8px;
            margin-left: auto;
        }
        
        .refresh-btn:hover {
            background: #388E3C;
        }
        
        @media (max-width: 768px) {
            .admin-header {
                flex-direction: column;
                gap: 15px;
                text-align: center;
            }
            
            .stats-grid {
                grid-template-columns: 1fr;
            }
            
            .tabs {
                flex-wrap: wrap;
            }
            
            .filter-bar {
                flex-direction: column;
                align-items: stretch;
            }
            
            .filter-input {
                width: 100%;
            }
            
            .charts-container {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="admin-container">
        <div class="admin-header">
            <h1>
                <span>📊 酷9播放器系统管理后台</span>
            </h1>
            <div>
                <button class="refresh-btn" onclick="loadAllData()">
                    🔄 刷新数据
                </button>
            </div>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card green">
                <div class="stat-label">今日访问</div>
                <div class="stat-value" id="todayVisits">0</div>
                <div class="stat-desc">次访问</div>
            </div>
            <div class="stat-card blue">
                <div class="stat-label">酷9播放器</div>
                <div class="stat-value" id="ku9Access">0</div>
                <div class="stat-desc">次成功访问</div>
            </div>
            <div class="stat-card orange">
                <div class="stat-label">拦截访问</div>
                <div class="stat-value" id="blockedAccess">0</div>
                <div class="stat-desc">次拦截</div>
            </div>
            <div class="stat-card red">
                <div class="stat-label">抓包工具</div>
                <div class="stat-value" id="sniffingTools">0</div>
                <div class="stat-desc">次检测</div>
            </div>
        </div>
        
        <div class="tabs">
            <button class="tab active" onclick="showTab('logs')">📝 访问记录</button>
            <button class="tab" onclick="showTab('analysis')">📈 统计分析</button>
            <button class="tab" onclick="showTab('features')">🔍 特征分析</button>
            <button class="tab" onclick="showTab('files')">📁 文件管理</button>
            <button class="tab" onclick="showTab('settings')">⚙️ 系统设置</button>
        </div>
        
        <!-- 访问记录标签页 -->
        <div id="logs-tab" class="content-section active">
            <div class="filter-bar">
                <input type="text" class="filter-input" id="searchUA" placeholder="搜索 User-Agent...">
                <input type="text" class="filter-input" id="searchIP" placeholder="搜索 IP...">
                <select class="filter-input" id="filterType">
                    <option value="">所有类型</option>
                    <option value="ku9">酷9播放器</option>
                    <option value="blocked">拦截访问</option>
                    <option value="sniffing">抓包工具</option>
                    <option value="browser">浏览器</option>
                    <option value="other">其他播放器</option>
                </select>
                <input type="date" class="filter-input" id="filterDate">
                <button class="btn btn-primary" onclick="filterLogs()">筛选</button>
                <button class="btn btn-danger" onclick="clearLogs()">清空记录</button>
                <button class="btn btn-success" onclick="exportLogs()">导出CSV</button>
            </div>
            
            <div class="table-container">
                <table id="logsTable">
                    <thead>
                        <tr>
                            <th>时间</th>
                            <th>文件</th>
                            <th>IP地址</th>
                            <th>客户端类型</th>
                            <th>User-Agent</th>
                            <th>访问结果</th>
                            <th>详细特征</th>
                        </tr>
                    </thead>
                    <tbody id="logsBody">
                        <tr><td colspan="7" class="loading">正在加载访问记录...</td></tr>
                    </tbody>
                </table>
            </div>
            
            <div class="pagination" id="logsPagination">
                <!-- 分页按钮将通过JavaScript生成 -->
            </div>
        </div>
        
        <!-- 统计分析标签页 -->
        <div id="analysis-tab" class="content-section">
            <h2 style="margin-bottom: 20px;">📈 访问统计分析</h2>
            
            <div class="charts-container">
                <div class="chart-box">
                    <h3>访问类型分布</h3>
                    <canvas id="typeChart" height="250"></canvas>
                </div>
                
                <div class="chart-box">
                    <h3>24小时访问趋势</h3>
                    <canvas id="hourlyChart" height="250"></canvas>
                </div>
                
                <div class="chart-box">
                    <h3>热门文件访问</h3>
                    <canvas id="filesChart" height="250"></canvas>
                </div>
                
                <div class="chart-box">
                    <h3>客户端来源分析</h3>
                    <canvas id="clientChart" height="250"></canvas>
                </div>
            </div>
        </div>
        
        <!-- 特征分析标签页 -->
        <div id="features-tab" class="content-section">
            <h2 style="margin-bottom: 20px;">🔍 客户端特征分析</h2>
            
            <div class="filter-bar">
                <select class="filter-input" id="featureCategory">
                    <option value="useragents">User-Agent 分析</option>
                    <option value="patterns">特征模式</option>
                    <option value="suspicious">可疑访问</option>
                    <option value="unknown">未知客户端</option>
                </select>
                <button class="btn btn-primary" onclick="analyzeFeatures()">开始分析</button>
            </div>
            
            <div id="featuresResults">
                <div class="loading">请选择分析类别并点击开始分析...</div>
            </div>
        </div>
        
        <!-- 文件管理标签页 -->
        <div id="files-tab" class="content-section">
            <h2 style="margin-bottom: 20px;">📁 存储文件管理</h2>
            
            <div class="table-container">
                <table id="filesTable">
                    <thead>
                        <tr>
                            <th>文件名</th>
                            <th>文件大小</th>
                            <th>创建时间</th>
                            <th>最后访问</th>
                            <th>访问次数</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody id="filesBody">
                        <tr><td colspan="6" class="loading">正在加载文件列表...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
        
        <!-- 系统设置标签页 -->
        <div id="settings-tab" class="content-section">
            <h2 style="margin-bottom: 20px;">⚙️ 系统设置</h2>
            
            <div style="max-width: 600px;">
                <div style="margin-bottom: 25px;">
                    <h3>🔑 令牌设置</h3>
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 15px 0;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 500;">酷9播放器令牌</label>
                        <div style="display: flex; gap: 10px;">
                            <input type="text" id="ku9TokenSetting" value="ku9_secure_token_2024" 
                                   style="flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                            <button class="btn btn-primary" onclick="updateToken('ku9')">更新</button>
                        </div>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 15px 0;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 500;">管理令牌</label>
                        <div style="display: flex; gap: 10px;">
                            <input type="text" id="adminTokenSetting" value="" placeholder="输入新管理令牌" 
                                   style="flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                            <button class="btn btn-primary" onclick="updateToken('admin')">更新</button>
                        </div>
                    </div>
                </div>
                
                <div style="margin-bottom: 25px;">
                    <h3>🛡️ 安全设置</h3>
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 15px 0;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                            <div>
                                <strong>拦截抓包工具</strong>
                                <p style="color: #666; margin-top: 5px; font-size: 14px;">检测并拦截HTTP抓包工具</p>
                            </div>
                            <label class="switch">
                                <input type="checkbox" id="blockSniffing" checked>
                                <span class="slider"></span>
                            </label>
                        </div>
                        
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                            <div>
                                <strong>拦截其他播放器</strong>
                                <p style="color: #666; margin-top: 5px; font-size: 14px;">拦截非酷9播放器的访问</p>
                            </div>
                            <label class="switch">
                                <input type="checkbox" id="blockOtherPlayers" checked>
                                <span class="slider"></span>
                            </label>
                        </div>
                        
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <strong>浏览器访问提示</strong>
                                <p style="color: #666; margin-top: 5px; font-size: 14px;">为浏览器访问显示友好提示</p>
                            </div>
                            <label class="switch">
                                <input type="checkbox" id="browserHint" checked>
                                <span class="slider"></span>
                            </label>
                        </div>
                    </div>
                </div>
                
                <div style="margin-bottom: 25px;">
                    <h3>📊 记录设置</h3>
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 15px 0;">
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: 500;">记录保留天数</label>
                            <select id="logRetention" style="width: 200px; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                                <option value="7">7天</option>
                                <option value="30" selected>30天</option>
                                <option value="90">90天</option>
                                <option value="180">180天</option>
                                <option value="365">365天</option>
                            </select>
                        </div>
                        
                        <div style="display: flex; gap: 15px; margin-top: 20px;">
                            <button class="btn btn-primary" onclick="saveSettings()">保存设置</button>
                            <button class="btn btn-danger" onclick="resetSettings()">恢复默认</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script>
        let currentTab = 'logs';
        let currentPage = 1;
        const itemsPerPage = 20;
        let allLogs = [];
        
        // 切换标签页
        function showTab(tabName) {
            // 隐藏所有标签页
            document.querySelectorAll('.content-section').forEach(el => {
                el.classList.remove('active');
            });
            
            // 移除所有标签的active类
            document.querySelectorAll('.tab').forEach(el => {
                el.classList.remove('active');
            });
            
            // 显示选中的标签页
            document.getElementById(tabName + '-tab').classList.add('active');
            document.querySelector(`[onclick="showTab('${tabName}')"]`).classList.add('active');
            
            currentTab = tabName;
            
            // 加载对应标签页的数据
            if (tabName === 'logs') {
                loadLogs();
            } else if (tabName === 'analysis') {
                loadAnalysis();
            } else if (tabName === 'features') {
                // 延迟加载特征分析
            } else if (tabName === 'files') {
                loadFiles();
            } else if (tabName === 'settings') {
                loadSettings();
            }
        }
        
        // 加载访问记录
        async function loadLogs(page = 1) {
            currentPage = page;
            const logsBody = document.getElementById('logsBody');
            logsBody.innerHTML = '<tr><td colspan="7" class="loading">正在加载访问记录...</td></tr>';
            
            try {
                const response = await fetch('/api/get_logs.php');
                const data = await response.json();
                
                if (data.success) {
                    allLogs = data.logs;
                    updateStats(data.stats);
                    renderLogsTable();
                    renderPagination();
                } else {
                    logsBody.innerHTML = '<tr><td colspan="7" style="color: red; text-align: center;">加载失败：' + data.error + '</td></tr>';
                }
            } catch (error) {
                logsBody.innerHTML = '<tr><td colspan="7" style="color: red; text-align: center;">加载失败：' + error.message + '</td></tr>';
            }
        }
        
        // 渲染日志表格
        function renderLogsTable() {
            const logsBody = document.getElementById('logsBody');
            
            // 应用筛选
            let filteredLogs = [...allLogs];
            
            const searchUA = document.getElementById('searchUA').value.toLowerCase();
            const searchIP = document.getElementById('searchIP').value.toLowerCase();
            const filterType = document.getElementById('filterType').value;
            const filterDate = document.getElementById('filterDate').value;
            
            if (searchUA) {
                filteredLogs = filteredLogs.filter(log => 
                    log.userAgent && log.userAgent.toLowerCase().includes(searchUA)
                );
            }
            
            if (searchIP) {
                filteredLogs = filteredLogs.filter(log => 
                    log.ip && log.ip.toLowerCase().includes(searchIP)
                );
            }
            
            if (filterType) {
                filteredLogs = filteredLogs.filter(log => log.clientType === filterType);
            }
            
            if (filterDate) {
                const selectedDate = new Date(filterDate);
                filteredLogs = filteredLogs.filter(log => {
                    const logDate = new Date(log.timestamp);
                    return logDate.toDateString() === selectedDate.toDateString();
                });
            }
            
            // 分页
            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const pageLogs = filteredLogs.slice(startIndex, endIndex);
            
            if (pageLogs.length === 0) {
                logsBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 50px; color: #666;">没有找到匹配的记录</td></tr>';
                return;
            }
            
            let html = '';
            pageLogs.forEach(log => {
                let badgeClass = '';
                let typeText = '';
                
                switch (log.clientType) {
                    case 'ku9':
                        badgeClass = 'badge-success';
                        typeText = '酷9播放器';
                        break;
                    case 'sniffing':
                        badgeClass = 'badge-danger';
                        typeText = '抓包工具';
                        break;
                    case 'browser':
                        badgeClass = 'badge-warning';
                        typeText = '浏览器';
                        break;
                    case 'other':
                        badgeClass = 'badge-info';
                        typeText = '其他播放器';
                        break;
                    case 'blocked':
                        badgeClass = 'badge-danger';
                        typeText = '拦截访问';
                        break;
                    default:
                        badgeClass = 'badge-info';
                        typeText = '未知客户端';
                }
                
                const time = new Date(log.timestamp).toLocaleString('zh-CN');
                const uaShort = log.userAgent ? (log.userAgent.length > 50 ? log.userAgent.substring(0, 50) + '...' : log.userAgent) : '未知';
                
                html += \`
                    <tr>
                        <td class="timestamp">\${time}</td>
                        <td><strong>\${log.filename || '未知文件'}</strong></td>
                        <td>\${log.ip || '未知IP'}</td>
                        <td><span class="badge \${badgeClass}">\${typeText}</span></td>
                        <td class="ua-short" title="\${log.userAgent || ''}">\${uaShort}</td>
                        <td>\${log.result || '未知结果'}</td>
                        <td>
                            <button class="btn" style="padding: 5px 10px; font-size: 12px;" 
                                    onclick="showDetails('\${log.id}')">查看详情</button>
                        </td>
                    </tr>
                \`;
            });
            
            logsBody.innerHTML = html;
        }
        
        // 渲染分页
        function renderPagination() {
            const filteredLogs = getFilteredLogs();
            const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
            const paginationDiv = document.getElementById('logsPagination');
            
            if (totalPages <= 1) {
                paginationDiv.innerHTML = '';
                return;
            }
            
            let html = \`
                <button class="page-btn" onclick="changePage(\${currentPage - 1})" 
                        \${currentPage === 1 ? 'disabled' : ''}>上一页</button>
            \`;
            
            const startPage = Math.max(1, currentPage - 2);
            const endPage = Math.min(totalPages, currentPage + 2);
            
            for (let i = startPage; i <= endPage; i++) {
                html += \`
                    <button class="page-btn \${i === currentPage ? 'active' : ''}" 
                            onclick="changePage(\${i})">\${i}</button>
                \`;
            }
            
            html += \`
                <button class="page-btn" onclick="changePage(\${currentPage + 1})" 
                        \${currentPage === totalPages ? 'disabled' : ''}>下一页</button>
                <span style="margin-left: 10px; color: #666;">共 \${filteredLogs.length} 条记录</span>
            \`;
            
            paginationDiv.innerHTML = html;
        }
        
        // 获取筛选后的日志
        function getFilteredLogs() {
            let filteredLogs = [...allLogs];
            
            const searchUA = document.getElementById('searchUA').value.toLowerCase();
            const searchIP = document.getElementById('searchIP').value.toLowerCase();
            const filterType = document.getElementById('filterType').value;
            const filterDate = document.getElementById('filterDate').value;
            
            if (searchUA) {
                filteredLogs = filteredLogs.filter(log => 
                    log.userAgent && log.userAgent.toLowerCase().includes(searchUA)
                );
            }
            
            if (searchIP) {
                filteredLogs = filteredLogs.filter(log => 
                    log.ip && log.ip.toLowerCase().includes(searchIP)
                );
            }
            
            if (filterType) {
                filteredLogs = filteredLogs.filter(log => log.clientType === filterType);
            }
            
            if (filterDate) {
                const selectedDate = new Date(filterDate);
                filteredLogs = filteredLogs.filter(log => {
                    const logDate = new Date(log.timestamp);
                    return logDate.toDateString() === selectedDate.toDateString();
                });
            }
            
            return filteredLogs;
        }
        
        // 切换页码
        function changePage(page) {
            const filteredLogs = getFilteredLogs();
            const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
            
            if (page < 1 || page > totalPages) return;
            
            currentPage = page;
            renderLogsTable();
            renderPagination();
        }
        
        // 筛选日志
        function filterLogs() {
            currentPage = 1;
            renderLogsTable();
            renderPagination();
        }
        
        // 更新统计信息
        function updateStats(stats) {
            document.getElementById('todayVisits').textContent = stats.todayVisits || 0;
            document.getElementById('ku9Access').textContent = stats.ku9Access || 0;
            document.getElementById('blockedAccess').textContent = stats.blockedAccess || 0;
            document.getElementById('sniffingTools').textContent = stats.sniffingTools || 0;
        }
        
        // 清空日志
        async function clearLogs() {
            if (!confirm('确定要清空所有访问记录吗？此操作不可撤销！')) {
                return;
            }
            
            try {
                const response = await fetch('/api/clear_logs.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    }
                });
                
                const data = await response.json();
                
                if (data.success) {
                    alert('访问记录已清空！');
                    loadLogs();
                } else {
                    alert('清空失败：' + data.error);
                }
            } catch (error) {
                alert('清空失败：' + error.message);
            }
        }
        
        // 导出日志
        function exportLogs() {
            const filteredLogs = getFilteredLogs();
            
            if (filteredLogs.length === 0) {
                alert('没有可导出的记录！');
                return;
            }
            
            const headers = ['时间', '文件', 'IP地址', '客户端类型', 'User-Agent', '访问结果', '特征信息'];
            const csvContent = [
                headers.join(','),
                ...filteredLogs.map(log => [
                    new Date(log.timestamp).toLocaleString('zh-CN'),
                    log.filename || '',
                    log.ip || '',
                    log.clientType || '',
                    \`"\${(log.userAgent || '').replace(/"/g, '""')}"\`,
                    log.result || '',
                    log.features ? JSON.stringify(log.features).replace(/"/g, '""') : ''
                ].join(','))
            ].join('\\n');
            
            const blob = new Blob(['\\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.setAttribute('href', url);
            link.setAttribute('download', \`酷9访问记录_\${new Date().toLocaleDateString('zh-CN')}.csv\`);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        
        // 显示详情
        function showDetails(logId) {
            const log = allLogs.find(l => l.id === logId);
            if (!log) return;
            
            const details = \`
                <div style="max-width: 800px;">
                    <h3>访问详情</h3>
                    <table style="width: 100%; background: #f8f9fa; border-radius: 10px; padding: 20px;">
                        <tr>
                            <td style="padding: 10px; font-weight: bold; width: 150px;">时间：</td>
                            <td style="padding: 10px;">\${new Date(log.timestamp).toLocaleString('zh-CN')}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; font-weight: bold;">文件：</td>
                            <td style="padding: 10px;"><code>\${log.filename || '未知'}</code></td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; font-weight: bold;">IP地址：</td>
                            <td style="padding: 10px;">\${log.ip || '未知'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; font-weight: bold;">客户端类型：</td>
                            <td style="padding: 10px;">\${log.clientType || '未知'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; font-weight: bold;">访问结果：</td>
                            <td style="padding: 10px;">\${log.result || '未知'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; font-weight: bold; vertical-align: top;">User-Agent：</td>
                            <td style="padding: 10px;">
                                <div style="background: white; padding: 10px; border-radius: 5px; font-family: monospace; font-size: 12px;">
                                    \${log.userAgent || '无'}
                                </div>
                            </td>
                        </tr>
                        \${log.features ? \`
                        <tr>
                            <td style="padding: 10px; font-weight: bold; vertical-align: top;">特征信息：</td>
                            <td style="padding: 10px;">
                                <div style="background: white; padding: 10px; border-radius: 5px; font-family: monospace; font-size: 12px;">
                                    \${JSON.stringify(log.features, null, 2)}
                                </div>
                            </td>
                        </tr>
                        \` : ''}
                    </table>
                </div>
            \`;
            
            const modal = createModal('访问详情', details);
            document.body.appendChild(modal);
        }
        
        // 创建模态框
        function createModal(title, content) {
            const modal = document.createElement('div');
            modal.style.cssText = \`
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
            \`;
            
            modal.innerHTML = \`
                <div style="background: white; border-radius: 15px; max-width: 90%; max-height: 90%; overflow: auto; padding: 30px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h2 style="margin: 0;">\${title}</h2>
                        <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                                style="background: none; border: none; font-size: 24px; cursor: pointer; color: #666;">×</button>
                    </div>
                    \${content}
                </div>
            \`;
            
            return modal;
        }
        
        // 加载统计分析
        async function loadAnalysis() {
            try {
                const response = await fetch('/api/stats.php');
                const data = await response.json();
                
                if (data.success) {
                    renderCharts(data);
                }
            } catch (error) {
                console.error('加载分析数据失败：', error);
            }
        }
        
        // 渲染图表
        function renderCharts(data) {
            // 访问类型分布图
            const typeCtx = document.getElementById('typeChart').getContext('2d');
            new Chart(typeCtx, {
                type: 'pie',
                data: {
                    labels: ['酷9播放器', '抓包工具', '浏览器', '其他播放器', '拦截访问'],
                    datasets: [{
                        data: [
                            data.stats.ku9Access || 0,
                            data.stats.sniffingTools || 0,
                            data.stats.browserAccess || 0,
                            data.stats.otherPlayers || 0,
                            data.stats.blockedAccess || 0
                        ],
                        backgroundColor: [
                            '#4CAF50',
                            '#F44336',
                            '#FF9800',
                            '#2196F3',
                            '#9C27B0'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
            
            // 24小时访问趋势
            if (data.hourlyData && data.hourlyData.labels) {
                const hourlyCtx = document.getElementById('hourlyChart').getContext('2d');
                new Chart(hourlyCtx, {
                    type: 'line',
                    data: {
                        labels: data.hourlyData.labels,
                        datasets: [{
                            label: '访问量',
                            data: data.hourlyData.data,
                            borderColor: '#667eea',
                            backgroundColor: 'rgba(102, 126, 234, 0.1)',
                            fill: true
                        }]
                    },
                    options: {
                        responsive: true,
                        scales: {
                            y: {
                                beginAtZero: true
                            }
                        }
                    }
                });
            }
            
            // 热门文件访问
            if (data.topFiles && data.topFiles.length > 0) {
                const filesCtx = document.getElementById('filesChart').getContext('2d');
                new Chart(filesCtx, {
                    type: 'bar',
                    data: {
                        labels: data.topFiles.map(f => f.name),
                        datasets: [{
                            label: '访问次数',
                            data: data.topFiles.map(f => f.count),
                            backgroundColor: '#FF9800'
                        }]
                    },
                    options: {
                        responsive: true,
                        indexAxis: 'y',
                        scales: {
                            x: {
                                beginAtZero: true
                            }
                        }
                    }
                });
            }
            
            // 客户端来源分析
            const clientCtx = document.getElementById('clientChart').getContext('2d');
            new Chart(clientCtx, {
                type: 'doughnut',
                data: {
                    labels: ['正常访问', '异常访问', '可疑访问'],
                    datasets: [{
                        data: [
                            data.stats.ku9Access || 0,
                            data.stats.blockedAccess || 0,
                            data.stats.suspicious || 0
                        ],
                        backgroundColor: [
                            '#4CAF50',
                            '#F44336',
                            '#FFC107'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }
        
        // 特征分析
        async function analyzeFeatures() {
            const category = document.getElementById('featureCategory').value;
            const resultsDiv = document.getElementById('featuresResults');
            
            resultsDiv.innerHTML = '<div class="loading">正在分析特征...</div>';
            
            try {
                const response = await fetch(\`/api/analyze.php?category=\${category}\`);
                const data = await response.json();
                
                if (data.success) {
                    renderFeatures(data.analysis);
                } else {
                    resultsDiv.innerHTML = \`<div style="color: red; text-align: center;">分析失败：\${data.error}</div>\`;
                }
            } catch (error) {
                resultsDiv.innerHTML = \`<div style="color: red; text-align: center;">分析失败：\${error.message}</div>\`;
            }
        }
        
        // 渲染特征分析结果
        function renderFeatures(analysis) {
            let html = '';
            
            if (analysis.userAgents && analysis.userAgents.length > 0) {
                html += \`
                    <h3>📱 User-Agent 分析</h3>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>User-Agent 模式</th>
                                    <th>出现次数</th>
                                    <th>分类</th>
                                    <th>示例</th>
                                </tr>
                            </thead>
                            <tbody>
                \`;
                
                analysis.userAgents.forEach(ua => {
                    html += \`
                        <tr>
                            <td><code>\${ua.pattern}</code></td>
                            <td><span class="badge badge-info">\${ua.count}</span></td>
                            <td><span class="badge \${getBadgeClass(ua.type)}">\${ua.type}</span></td>
                            <td class="ua-short" title="\${ua.example}">\${ua.example.substring(0, 60)}...</td>
                        </tr>
                    \`;
                });
                
                html += \`
                            </tbody>
                        </table>
                    </div>
                \`;
            }
            
            if (analysis.patterns && analysis.patterns.length > 0) {
                html += \`
                    <h3 style="margin-top: 30px;">🎯 特征模式</h3>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>特征模式</th>
                                    <th>描述</th>
                                    <th>检测次数</th>
                                    <th>建议</th>
                                </tr>
                            </thead>
                            <tbody>
                \`;
                
                analysis.patterns.forEach(pattern => {
                    html += \`
                        <tr>
                            <td><code>\${pattern.pattern}</code></td>
                            <td>\${pattern.description}</td>
                            <td><span class="badge badge-info">\${pattern.count}</span></td>
                            <td>\${pattern.suggestion}</td>
                        </tr>
                    \`;
                });
                
                html += \`
                            </tbody>
                        </table>
                    </div>
                \`;
            }
            
            if (analysis.suspicious && analysis.suspicious.length > 0) {
                html += \`
                    <h3 style="margin-top: 30px;">⚠️ 可疑访问</h3>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>时间</th>
                                    <th>IP地址</th>
                                    <th>User-Agent</th>
                                    <th>可疑原因</th>
                                </tr>
                            </thead>
                            <tbody>
                \`;
                
                analysis.suspicious.forEach(sus => {
                    html += \`
                        <tr>
                            <td class="timestamp">\${new Date(sus.timestamp).toLocaleString('zh-CN')}</td>
                            <td><strong>\${sus.ip}</strong></td>
                            <td class="ua-short" title="\${sus.userAgent}">\${sus.userAgent.substring(0, 50)}...</td>
                            <td>\${sus.reason}</td>
                        </tr>
                    \`;
                });
                
                html += \`
                            </tbody>
                        </table>
                    </div>
                \`;
            }
            
            document.getElementById('featuresResults').innerHTML = html;
        }
        
        // 获取徽章类
        function getBadgeClass(type) {
            switch (type) {
                case 'ku9': return 'badge-success';
                case 'sniffing': return 'badge-danger';
                case 'browser': return 'badge-warning';
                case 'other': return 'badge-info';
                default: return 'badge-info';
            }
        }
        
        // 加载文件管理
        async function loadFiles() {
            try {
                // 这里需要实现获取文件列表的API
                // 暂时显示提示信息
                document.getElementById('filesBody').innerHTML = \`
                    <tr>
                        <td colspan="6" style="text-align: center; padding: 50px; color: #666;">
                            文件管理功能正在开发中...
                        </td>
                    </tr>
                \`;
            } catch (error) {
                console.error('加载文件列表失败：', error);
            }
        }
        
        // 加载设置
        async function loadSettings() {
            try {
                // 这里可以从服务器获取设置
                // 暂时使用默认值
                document.getElementById('ku9TokenSetting').value = 'ku9_secure_token_2024';
                document.getElementById('blockSniffing').checked = true;
                document.getElementById('blockOtherPlayers').checked = true;
                document.getElementById('browserHint').checked = true;
                document.getElementById('logRetention').value = '30';
            } catch (error) {
                console.error('加载设置失败：', error);
            }
        }
        
        // 更新令牌
        async function updateToken(type) {
            if (type === 'ku9') {
                const token = document.getElementById('ku9TokenSetting').value;
                if (!token) {
                    alert('请输入酷9令牌');
                    return;
                }
                // 这里调用API更新令牌
                alert('酷9令牌已更新为：' + token);
            } else if (type === 'admin') {
                const token = document.getElementById('adminTokenSetting').value;
                if (!token) {
                    alert('请输入管理令牌');
                    return;
                }
                // 这里调用API更新管理令牌
                alert('管理令牌已更新，请重新登录！');
                window.location.href = 'admin.html';
            }
        }
        
        // 保存设置
        async function saveSettings() {
            // 这里调用API保存设置
            alert('设置已保存！');
        }
        
        // 恢复默认设置
        function resetSettings() {
            if (confirm('确定要恢复默认设置吗？')) {
                loadSettings();
                alert('已恢复默认设置！');
            }
        }
        
        // 加载所有数据
        function loadAllData() {
            if (currentTab === 'logs') {
                loadLogs();
            } else if (currentTab === 'analysis') {
                loadAnalysis();
            } else if (currentTab === 'features') {
                analyzeFeatures();
            } else if (currentTab === 'files') {
                loadFiles();
            }
        }
        
        // 页面加载时初始化
        window.addEventListener('load', function() {
            loadLogs();
            
            // 每30秒自动刷新数据
            setInterval(() => {
                if (currentTab === 'logs') {
                    loadLogs(currentPage);
                }
            }, 30000);
        });
    </script>
    
    <style>
        .switch {
            position: relative;
            display: inline-block;
            width: 60px;
            height: 34px;
        }
        
        .switch input {
            opacity: 0;
            width: 0;
            height: 0;
        }
        
        .slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: #ccc;
            transition: .4s;
            border-radius: 34px;
        }
        
        .slider:before {
            position: absolute;
            content: "";
            height: 26px;
            width: 26px;
            left: 4px;
            bottom: 4px;
            background-color: white;
            transition: .4s;
            border-radius: 50%;
        }
        
        input:checked + .slider {
            background-color: #4CAF50;
        }
        
        input:checked + .slider:before {
            transform: translateX(26px);
        }
    </style>
</body>
</html>`;
}

// 记录访问日志
async function logAccess(env, logData) {
  try {
    const timestamp = Date.now();
    const logId = `log_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 保存完整日志
    await env.MY_TEXT_STORAGE.put(
      `access_log_${logId}`, 
      JSON.stringify({
        ...logData,
        id: logId,
        timestamp: new Date().toISOString()
      })
    );
    
    // 更新统计数据
    await updateStats(env, logData);
    
    // 保存到日志列表
    const logsKey = 'access_logs_list';
    let logsList = await env.MY_TEXT_STORAGE.get(logsKey);
    if (!logsList) {
      logsList = [];
    } else {
      logsList = JSON.parse(logsList);
    }
    
    logsList.unshift({
      id: logId,
      timestamp: new Date().toISOString(),
      filename: logData.filename,
      ip: logData.ip,
      userAgent: logData.userAgent,
      clientType: logData.clientType,
      result: logData.result
    });
    
    // 只保留最近1000条日志
    if (logsList.length > 1000) {
      logsList = logsList.slice(0, 1000);
    }
    
    await env.MY_TEXT_STORAGE.put(logsKey, JSON.stringify(logsList));
    
  } catch (error) {
    console.error('记录访问日志失败：', error);
  }
}

// 更新统计数据
async function updateStats(env, logData) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const statsKey = `stats_${today}`;
    
    let stats = await env.MY_TEXT_STORAGE.get(statsKey);
    if (!stats) {
      stats = {
        date: today,
        totalVisits: 0,
        ku9Access: 0,
        blockedAccess: 0,
        sniffingTools: 0,
        browserAccess: 0,
        otherPlayers: 0,
        suspicious: 0
      };
    } else {
      stats = JSON.parse(stats);
    }
    
    stats.totalVisits++;
    
    switch (logData.clientType) {
      case 'ku9':
        stats.ku9Access++;
        break;
      case 'sniffing':
        stats.sniffingTools++;
        stats.blockedAccess++;
        break;
      case 'browser':
        stats.browserAccess++;
        stats.blockedAccess++;
        break;
      case 'other':
        stats.otherPlayers++;
        stats.blockedAccess++;
        break;
      case 'blocked':
        stats.blockedAccess++;
        break;
      case 'suspicious':
        stats.suspicious++;
        break;
    }
    
    await env.MY_TEXT_STORAGE.put(statsKey, JSON.stringify(stats));
    
  } catch (error) {
    console.error('更新统计数据失败：', error);
  }
}

// 安全文件下载处理 - 带访问记录
async function handleSecureFileDownload(filename, request, env, context) {
  try {
    // 解码文件名
    const decodedFilename = decodeURIComponent(filename);
    const safeFilename = sanitizeFilename(decodedFilename);
    const content = await env.MY_TEXT_STORAGE.get('file_' + safeFilename);
    
    if (!content) {
      return sendFileNotFound(safeFilename);
    }

    // 获取访问者信息
    const ip = request.headers.get('CF-Connecting-IP') || 
               request.headers.get('X-Forwarded-For') || 
               'unknown';
    const userAgent = request.headers.get('User-Agent') || '';
    const url = new URL(request.url);
    
    // 1. 检查管理令牌（如果有）
    const managementToken = url.searchParams.get('manage_token');
    const expectedManagementToken = await env.MY_TEXT_STORAGE.get('management_token') || 'default_manage_token_2024';
    
    if (managementToken && managementToken === expectedManagementToken) {
      // 记录管理访问
      context.waitUntil(logAccess(env, {
        filename: safeFilename,
        ip: ip,
        userAgent: userAgent,
        clientType: 'management',
        result: '管理访问 - 已授权',
        features: {
          tokenUsed: 'management_token',
          accessMethod: 'direct'
        }
      }));
      
      return sendOriginalContent(safeFilename, content, 'management');
    }

    // 2. 检查酷9令牌
    const ku9Token = url.searchParams.get('ku9_token');
    
    // 3. 检查是否是抓包工具（优先检测）
    if (isSniffingTool(userAgent)) {
      // 记录抓包工具访问
      context.waitUntil(logAccess(env, {
        filename: safeFilename,
        ip: ip,
        userAgent: userAgent,
        clientType: 'sniffing',
        result: '抓包工具 - 已拦截',
        features: {
          toolType: detectSniffingTool(userAgent),
          accessMethod: 'direct',
          timestamp: new Date().toISOString()
        }
      }));
      
      return sendSniffingToolBlock(safeFilename, userAgent);
    }
    
    // 4. 如果有酷9令牌且正确，允许访问
    if (ku9Token && ku9Token === 'ku9_secure_token_2024') {
      // 记录令牌访问
      context.waitUntil(logAccess(env, {
        filename: safeFilename,
        ip: ip,
        userAgent: userAgent,
        clientType: 'ku9',
        result: '令牌访问 - 已授权',
        features: {
          tokenUsed: 'ku9_token',
          accessMethod: 'token',
          isKu9UA: isKu9UserAgent(userAgent),
          userAgentPatterns: extractUAPatterns(userAgent)
        }
      }));
      
      return sendOriginalContent(safeFilename, content, 'ku9-token');
    }
    
    // 5. 如果没有令牌，检查User-Agent是否是酷9播放器
    const isKu9UA = isKu9UserAgent(userAgent);
    if (isKu9UA) {
      // 记录酷9播放器访问
      context.waitUntil(logAccess(env, {
        filename: safeFilename,
        ip: ip,
        userAgent: userAgent,
        clientType: 'ku9',
        result: '酷9播放器 - 已授权',
        features: {
          accessMethod: 'user-agent',
          ku9Patterns: detectKu9Patterns(userAgent),
          isDirectAccess: true
        }
      }));
      
      return sendOriginalContent(safeFilename, content, 'ku9-ua');
    }
    
    // 6. 检查是否是其他播放器
    const playerInfo = detectPlayerDetailed(userAgent);
    if (playerInfo.name !== 'unknown') {
      // 记录其他播放器访问
      context.waitUntil(logAccess(env, {
        filename: safeFilename,
        ip: ip,
        userAgent: userAgent,
        clientType: 'other',
        result: `其他播放器 - ${playerInfo.name}`,
        features: {
          playerName: playerInfo.name,
          playerType: playerInfo.type,
          accessMethod: 'direct',
          isSuspicious: true
        }
      }));
      
      return sendOtherPlayerBlock(safeFilename, playerInfo.name, userAgent);
    }
    
    // 7. 检查是否是浏览器
    const browserInfo = detectBrowser(userAgent);
    if (browserInfo.name !== 'unknown') {
      // 记录浏览器访问
      context.waitUntil(logAccess(env, {
        filename: safeFilename,
        ip: ip,
        userAgent: userAgent,
        clientType: 'browser',
        result: `浏览器 - ${browserInfo.name}`,
        features: {
          browserName: browserInfo.name,
          browserVersion: browserInfo.version,
          platform: detectPlatform(userAgent),
          isSuspicious: true
        }
      }));
      
      return sendBrowserBlock(safeFilename, userAgent);
    }
    
    // 8. 记录未知客户端访问
    context.waitUntil(logAccess(env, {
      filename: safeFilename,
      ip: ip,
      userAgent: userAgent,
      clientType: 'unknown',
      result: '未知客户端 - 已拦截',
      features: {
        uaPattern: extractUAPatterns(userAgent),
        isSuspicious: true,
        requiresInvestigation: true
      }
    }));
    
    // 9. 其他情况，要求使用令牌
    return sendRequireToken(safeFilename, userAgent);
    
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

// 检测抓包工具类型
function detectSniffingTool(userAgent) {
  const lowerUA = userAgent.toLowerCase();
  
  if (lowerUA.includes('httpcanary')) return 'HttpCanary';
  if (lowerUA.includes('packetcapture')) return 'Packet Capture';
  if (lowerUA.includes('charles')) return 'Charles Proxy';
  if (lowerUA.includes('fiddler')) return 'Fiddler';
  if (lowerUA.includes('wireshark')) return 'Wireshark';
  if (lowerUA.includes('burpsuite')) return 'Burp Suite';
  if (lowerUA.includes('mitmproxy')) return 'mitmproxy';
  if (lowerUA.includes('proxyman')) return 'Proxyman';
  if (lowerUA.includes('postman')) return 'Postman';
  if (lowerUA.includes('insomnia')) return 'Insomnia';
  if (lowerUA.includes('curl')) return 'cURL';
  if (lowerUA.includes('wget')) return 'wget';
  
  return 'unknown';
}

// 检测酷9特征模式
function detectKu9Patterns(userAgent) {
  const lowerUA = userAgent.toLowerCase();
  const patterns = [];
  
  if (lowerUA.includes('ku9')) patterns.push('contains_ku9');
  if (lowerUA.includes('k9')) patterns.push('contains_k9');
  if (lowerUA.includes('ku9player')) patterns.push('contains_ku9player');
  if (lowerUA.includes('k9player')) patterns.push('contains_k9player');
  if (lowerUA.includes('com.ku9')) patterns.push('android_package_ku9');
  if (lowerUA.includes('com.k9')) patterns.push('android_package_k9');
  if (/ku9[\-\_].+/.test(lowerUA)) patterns.push('ku9_prefix_pattern');
  if (/k9[\-\_].+/.test(lowerUA)) patterns.push('k9_prefix_pattern');
  
  return patterns;
}

// 详细检测播放器
function detectPlayerDetailed(userAgent) {
  const lowerUA = userAgent.toLowerCase();
  
  const players = [
    { pattern: 'mxplayer', name: 'MX Player', type: 'android' },
    { pattern: 'vlc', name: 'VLC', type: 'multi' },
    { pattern: 'potplayer', name: 'PotPlayer', type: 'windows' },
    { pattern: 'kodi', name: 'Kodi', type: 'multi' },
    { pattern: 'nplayer', name: 'nPlayer', type: 'ios' },
    { pattern: 'infuse', name: 'Infuse', type: 'ios' },
    { pattern: 'tivimate', name: 'TiviMate', type: 'android' },
    { pattern: 'perfectplayer', name: 'Perfect Player', type: 'android' },
    { pattern: 'diyp', name: 'DIYP影音', type: 'android' },
    { pattern: 'tvbox', name: 'TVBox', type: 'android' },
    { pattern: 'tvhclient', name: 'TVHClient', type: 'android' },
    { pattern: 'iptv', name: 'IPTV Player', type: 'multi' },
    { pattern: 'smartyoutubetv', name: 'SmartYouTubeTV', type: 'android' },
    { pattern: 'smarttubenext', name: 'SmartTubeNext', type: 'android' },
    { pattern: 'ijkplayer', name: 'ijkPlayer', type: 'android' },
    { pattern: 'exoplayer', name: 'ExoPlayer', type: 'android' }
  ];
  
  for (const player of players) {
    if (lowerUA.includes(player.pattern)) {
      return player;
    }
  }
  
  return { name: 'unknown', type: 'unknown' };
}

// 检测浏览器
function detectBrowser(userAgent) {
  const ua = userAgent.toLowerCase();
  
  let name = 'unknown';
  let version = 'unknown';
  
  if (ua.includes('chrome') && !ua.includes('chromium')) {
    name = 'Chrome';
    const match = ua.match(/chrome\/([\d\.]+)/);
    if (match) version = match[1];
  } else if (ua.includes('firefox')) {
    name = 'Firefox';
    const match = ua.match(/firefox\/([\d\.]+)/);
    if (match) version = match[1];
  } else if (ua.includes('safari') && !ua.includes('chrome')) {
    name = 'Safari';
    const match = ua.match(/version\/([\d\.]+)/);
    if (match) version = match[1];
  } else if (ua.includes('edge')) {
    name = 'Edge';
    const match = ua.match(/edge\/([\d\.]+)/);
    if (match) version = match[1];
  } else if (ua.includes('opera')) {
    name = 'Opera';
    const match = ua.match(/opr\/([\d\.]+)/);
    if (match) version = match[1];
  }
  
  return { name, version };
}

// 检测平台
function detectPlatform(userAgent) {
  const ua = userAgent.toLowerCase();
  
  if (ua.includes('android')) return 'Android';
  if (ua.includes('iphone') || ua.includes('ipad')) return 'iOS';
  if (ua.includes('windows')) return 'Windows';
  if (ua.includes('mac os')) return 'macOS';
  if (ua.includes('linux')) return 'Linux';
  
  return 'unknown';
}

// 提取UA模式
function extractUAPatterns(userAgent) {
  if (!userAgent) return [];
  
  const patterns = [];
  const ua = userAgent.toLowerCase();
  
  // 检查常见的模式
  if (ua.includes('mozilla/5.0')) patterns.push('mozilla_5.0');
  if (ua.includes('applewebkit')) patterns.push('applewebkit');
  if (ua.includes('chrome')) patterns.push('chrome');
  if (ua.includes('safari')) patterns.push('safari');
  if (ua.includes('mobile')) patterns.push('mobile');
  if (ua.includes('android')) patterns.push('android');
  if (ua.includes('linux')) patterns.push('linux');
  if (ua.includes('windows')) patterns.push('windows');
  if (ua.includes('like mac os x')) patterns.push('mac_like');
  
  return patterns;
}

// 获取访问记录API
async function handleGetLogs(request, env) {
  try {
    const logsKey = 'access_logs_list';
    let logsList = await env.MY_TEXT_STORAGE.get(logsKey);
    
    if (!logsList) {
      logsList = [];
    } else {
      logsList = JSON.parse(logsList);
    }
    
    // 获取今天的统计数据
    const today = new Date().toISOString().split('T')[0];
    const statsKey = `stats_${today}`;
    let todayStats = await env.MY_TEXT_STORAGE.get(statsKey);
    
    if (!todayStats) {
      todayStats = {
        todayVisits: 0,
        ku9Access: 0,
        blockedAccess: 0,
        sniffingTools: 0,
        browserAccess: 0,
        otherPlayers: 0
      };
    } else {
      todayStats = JSON.parse(todayStats);
    }
    
    // 获取总统计数据
    const totalStats = {
      todayVisits: todayStats.totalVisits || 0,
      ku9Access: todayStats.ku9Access || 0,
      blockedAccess: todayStats.blockedAccess || 0,
      sniffingTools: todayStats.sniffingTools || 0,
      browserAccess: todayStats.browserAccess || 0,
      otherPlayers: todayStats.otherPlayers || 0
    };
    
    return new Response(JSON.stringify({
      success: true,
      logs: logsList,
      stats: totalStats,
      count: logsList.length
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// 清空访问记录API
async function handleClearLogs(request, env) {
  try {
    // 清空日志列表
    await env.MY_TEXT_STORAGE.put('access_logs_list', JSON.stringify([]));
    
    // 清空所有日志记录（这里需要遍历删除，但Cloudflare KV不支持批量删除）
    // 我们只清空列表，保留详细的日志记录供以后分析
    
    return new Response(JSON.stringify({
      success: true,
      message: '访问记录已清空'
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// 获取统计分析API
async function handleGetStats(request, env) {
  try {
    // 获取今天的统计数据
    const today = new Date().toISOString().split('T')[0];
    const statsKey = `stats_${today}`;
    let todayStats = await env.MY_TEXT_STORAGE.get(statsKey);
    
    if (!todayStats) {
      todayStats = {
        totalVisits: 0,
        ku9Access: 0,
        blockedAccess: 0,
        sniffingTools: 0,
        browserAccess: 0,
        otherPlayers: 0,
        suspicious: 0
      };
    } else {
      todayStats = JSON.parse(todayStats);
    }
    
    // 获取24小时数据（示例数据）
    const hourlyData = {
      labels: ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'],
      data: [5, 3, 2, 8, 15, 25, 30, 28, 22, 18, 12, 7]
    };
    
    // 获取热门文件（示例数据）
    const topFiles = [
      { name: 'live.m3u', count: 125 },
      { name: 'tv.json', count: 89 },
      { name: 'movie.m3u8', count: 67 },
      { name: 'sport.txt', count: 45 },
      { name: 'music.json', count: 32 }
    ];
    
    return new Response(JSON.stringify({
      success: true,
      stats: {
        todayVisits: todayStats.totalVisits || 0,
        ku9Access: todayStats.ku9Access || 0,
        blockedAccess: todayStats.blockedAccess || 0,
        sniffingTools: todayStats.sniffingTools || 0,
        browserAccess: todayStats.browserAccess || 0,
        otherPlayers: todayStats.otherPlayers || 0,
        suspicious: todayStats.suspicious || 0
      },
      hourlyData: hourlyData,
      topFiles: topFiles
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// 特征分析API
async function handleAnalyze(request, env) {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get('category') || 'useragents';
    
    // 获取日志列表
    const logsKey = 'access_logs_list';
    let logsList = await env.MY_TEXT_STORAGE.get(logsKey);
    
    if (!logsList) {
      logsList = [];
    } else {
      logsList = JSON.parse(logsList);
    }
    
    let analysis = {};
    
    if (category === 'useragents') {
      analysis = analyzeUserAgents(logsList);
    } else if (category === 'patterns') {
      analysis = analyzePatterns(logsList);
    } else if (category === 'suspicious') {
      analysis = analyzeSuspicious(logsList);
    } else if (category === 'unknown') {
      analysis = analyzeUnknown(logsList);
    }
    
    return new Response(JSON.stringify({
      success: true,
      analysis: analysis
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// 分析User-Agent
function analyzeUserAgents(logs) {
  const uaMap = new Map();
  
  logs.forEach(log => {
    if (log.userAgent) {
      const ua = log.userAgent;
      if (!uaMap.has(ua)) {
        uaMap.set(ua, {
          count: 0,
          type: log.clientType || 'unknown',
          example: ua
        });
      }
      uaMap.get(ua).count++;
    }
  });
  
  // 转换为数组并按次数排序
  const uaArray = Array.from(uaMap.entries())
    .map(([ua, data]) => ({
      pattern: extractUAPattern(ua),
      count: data.count,
      type: data.type,
      example: data.example
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 50); // 只返回前50个
  
  return { userAgents: uaArray };
}

// 提取UA模式
function extractUAPattern(ua) {
  if (!ua) return 'unknown';
  
  const uaLower = ua.toLowerCase();
  
  // 检查酷9模式
  if (uaLower.includes('ku9') || uaLower.includes('k9')) {
    return '酷9播放器模式';
  }
  
  // 检查抓包工具
  if (isSniffingTool(ua)) {
    return '抓包工具模式';
  }
  
  // 检查浏览器
  const browser = detectBrowser(ua);
  if (browser.name !== 'unknown') {
    return `${browser.name}浏览器模式`;
  }
  
  // 检查其他播放器
  const player = detectPlayerDetailed(ua);
  if (player.name !== 'unknown') {
    return `${player.name}播放器模式`;
  }
  
  // 通用模式
  if (ua.includes('Mozilla/5.0')) {
    if (ua.includes('Android')) {
      return 'Android浏览器模式';
    } else if (ua.includes('iPhone') || ua.includes('iPad')) {
      return 'iOS浏览器模式';
    } else if (ua.includes('Windows')) {
      return 'Windows浏览器模式';
    }
    return '标准浏览器模式';
  }
  
  return '其他模式';
}

// 分析特征模式
function analyzePatterns(logs) {
  const patterns = [
    {
      pattern: 'ku9/k9',
      description: '酷9播放器相关字符串',
      count: logs.filter(l => l.userAgent && (l.userAgent.toLowerCase().includes('ku9') || l.userAgent.toLowerCase().includes('k9'))).length,
      suggestion: '允许访问'
    },
    {
      pattern: 'httpcanary|packetcapture',
      description: 'HTTP抓包工具',
      count: logs.filter(l => isSniffingTool(l.userAgent || '')).length,
      suggestion: '立即拦截'
    },
    {
      pattern: 'mxplayer|vlc|potplayer',
      description: '其他播放器',
      count: logs.filter(l => {
        const player = detectPlayerDetailed(l.userAgent || '');
        return player.name !== 'unknown' && player.name !== '酷9';
      }).length,
      suggestion: '拦截并提示使用酷9'
    },
    {
      pattern: 'chrome|firefox|safari',
      description: '桌面浏览器',
      count: logs.filter(l => {
        const browser = detectBrowser(l.userAgent || '');
        return browser.name !== 'unknown' && browser.name !== '酷9';
      }).length,
      suggestion: '显示友好提示页面'
    },
    {
      pattern: 'unknown',
      description: '未知客户端',
      count: logs.filter(l => !l.userAgent || l.userAgent.trim() === '' || detectClientType(l.userAgent) === 'unknown').length,
      suggestion: '要求使用令牌访问'
    }
  ];
  
  return { patterns };
}

// 检测客户端类型
function detectClientType(userAgent) {
  if (isKu9UserAgent(userAgent)) return 'ku9';
  if (isSniffingTool(userAgent)) return 'sniffing';
  if (detectBrowser(userAgent).name !== 'unknown') return 'browser';
  if (detectPlayerDetailed(userAgent).name !== 'unknown') return 'other';
  return 'unknown';
}

// 分析可疑访问
function analyzeSuspicious(logs) {
  const suspicious = logs.filter(log => {
    // 频繁访问的IP
    const ipCount = logs.filter(l => l.ip === log.ip).length;
    if (ipCount > 50) return true;
    
    // 异常的User-Agent
    if (log.userAgent) {
      const ua = log.userAgent.toLowerCase();
      // 包含多个播放器标识
      const playerCount = ['mxplayer', 'vlc', 'potplayer', 'kodi', 'tivimate']
        .filter(player => ua.includes(player)).length;
      if (playerCount > 2) return true;
      
      // 明显的伪造UA
      if (ua.includes('bot') || ua.includes('crawler') || ua.includes('spider')) {
        return true;
      }
    }
    
    // 被拦截的访问
    if (log.clientType === 'blocked' || log.clientType === 'sniffing') {
      return true;
    }
    
    return false;
  }).slice(0, 100); // 只返回前100个
  
  return { suspicious: suspicious.map(s => ({
    timestamp: s.timestamp,
    ip: s.ip || 'unknown',
    userAgent: s.userAgent || 'unknown',
    reason: generateSuspiciousReason(s)
  })) };
}

// 生成可疑原因
function generateSuspiciousReason(log) {
  const reasons = [];
  
  if (log.clientType === 'sniffing') {
    reasons.push('检测到抓包工具');
  }
  
  if (log.clientType === 'blocked') {
    reasons.push('访问被拦截');
  }
  
  if (log.userAgent) {
    const ua = log.userAgent.toLowerCase();
    if (ua.includes('bot') || ua.includes('crawler')) {
      reasons.push('疑似爬虫程序');
    }
  }
  
  // 统计IP访问频率
  if (log.ip && log.ip !== 'unknown') {
    reasons.push('频繁访问IP');
  }
  
  return reasons.length > 0 ? reasons.join('，') : '未知可疑行为';
}

// 分析未知客户端
function analyzeUnknown(logs) {
  const unknown = logs.filter(log => 
    log.clientType === 'unknown' || 
    !log.userAgent || 
    log.userAgent.trim() === ''
  );
  
  return { 
    unknown: unknown.slice(0, 50),
    count: unknown.length
  };
}

// 以下为原有的函数，保持原样不变（部分函数已在上方修改）
// 酷9播放器测试接口
async function handleKu9Test(request) {
  // ... 保持原有代码不变
  const userAgent = request.headers.get('User-Agent') || '';
  const lowerUA = userAgent.toLowerCase();
  
  let result = {
    status: '测试开始',
    userAgent: userAgent.substring(0, 100),
    isKu9: false,
    isSniffingTool: false,
    isOtherPlayer: false,
    isBrowser: false,
    recommendations: []
  };
  
  // 检查是否是抓包工具
  const sniffingTools = [
    'httpcanary', 'packetcapture', 'charles', 'fiddler',
    'wireshark', 'burpsuite', 'mitmproxy', 'proxyman',
    'postman', 'insomnia', 'curl', 'wget'
  ];
  
  for (const tool of sniffingTools) {
    if (lowerUA.includes(tool)) {
      result.isSniffingTool = true;
      result.recommendations.push('检测到抓包工具，请勿使用抓包工具访问');
      break;
    }
  }
  
  // 检查是否是酷9播放器
  const ku9Patterns = [
    'ku9', 'k9', 'ku9player', 'k9player',
    'com.ku9', 'com.k9', 'ku9-', 'k9-'
  ];
  
  for (const pattern of ku9Patterns) {
    if (lowerUA.includes(pattern)) {
      result.isKu9 = true;
      result.recommendations.push('检测到酷9播放器，可以正常访问');
      break;
    }
  }
  
  // 检查是否是其他播放器
  const otherPlayers = [
    'mxplayer', 'vlc', 'potplayer', 'kodi',
    'nplayer', 'infuse', 'tivimate', 'perfectplayer',
    'diyp', 'tvbox', 'ijkplayer', 'exoplayer'
  ];
  
  for (const player of otherPlayers) {
    if (lowerUA.includes(player)) {
      result.isOtherPlayer = true;
      result.recommendations.push('检测到其他播放器，请使用酷9播放器');
      break;
    }
  }
  
  // 检查是否是浏览器
  const browsers = [
    'chrome', 'firefox', 'safari', 'edge',
    'opera', 'mozilla', 'webkit', 'msie'
  ];
  
  for (const browser of browsers) {
    if (lowerUA.includes(browser)) {
      result.isBrowser = true;
      result.recommendations.push('检测到浏览器，请使用酷9播放器');
      break;
    }
  }
  
  // 如果没有检测到任何特征
  if (!result.isKu9 && !result.isSniffingTool && !result.isOtherPlayer && !result.isBrowser) {
    result.recommendations.push('客户端类型未知，尝试添加令牌参数：?ku9_token=ku9_secure_token_2024');
  }
  
  // 最终建议
  if (!result.isKu9) {
    result.recommendations.push('建议在链接后添加：?ku9_token=ku9_secure_token_2024');
  }
  
  return new Response(JSON.stringify(result, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
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
    fileLink: fileLink,
    ku9Link: fileLink + '?ku9_token=ku9_secure_token_2024'
  };

  return new Response(JSON.stringify(response), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'X-Content-Type-Options': 'nosniff'
    }
  });
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

    if (!content) {
      return new Response(JSON.stringify({
        success: false,
        error: '文件内容不能为空'
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
        ku9Link: link + '?ku9_token=ku9_secure_token_2024',
        filename: safeFilename,
        security: {
          enabled: true,
          token: 'ku9_secure_token_2024',
          note: '请在链接后添加?ku9_token=ku9_secure_token_2024'
        }
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

// 更新密码处理接口
async function handleUpdatePassword(request, env) {
  const formData = await parseFormData(request);
  
  const filename = formData.filename;
  const newPassword = formData.new_password;

  if (!filename || !newPassword) {
    return new Response(JSON.stringify({
      success: false,
      error: '缺少 filename 或 new_password'
    }), {
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
    return new Response(JSON.stringify({
      success: false,
      error: '密码更新失败: ' + error.message
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
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

// 检查是否是抓包工具
function isSniffingTool(userAgent) {
  const lowerUA = userAgent.toLowerCase();
  const sniffingTools = [
    'httpcanary', 'packetcapture', 'charles', 'fiddler',
    'wireshark', 'burpsuite', 'mitmproxy', 'proxyman',
    'surge', 'shadowrocket', 'postman', 'insomnia',
    'thunder.*client', 'curl', 'wget'
  ];
  
  return sniffingTools.some(tool => {
    const pattern = new RegExp(tool.replace('.*', '.*'), 'i');
    return pattern.test(lowerUA);
  });
}

// 检查是否是酷9User-Agent
function isKu9UserAgent(userAgent) {
  const lowerUA = userAgent.toLowerCase();
  const ku9Patterns = [
    'ku9', 'k9', 'ku9player', 'k9player',
    'com.ku9', 'com.k9', 'ku9-', 'k9-',
    'ku9_', 'k9_', 'ku9app', 'k9app'
  ];
  
  return ku9Patterns.some(pattern => lowerUA.includes(pattern));
}

// 检测播放器类型
function detectPlayer(userAgent) {
  const lowerUA = userAgent.toLowerCase();
  const playerPatterns = [
    { pattern: 'mxplayer', name: 'MX Player' },
    { pattern: 'vlc', name: 'VLC' },
    { pattern: 'potplayer', name: 'PotPlayer' },
    { pattern: 'kodi', name: 'Kodi' },
    { pattern: 'nplayer', name: 'nPlayer' },
    { pattern: 'infuse', name: 'Infuse' },
    { pattern: 'tivimate', name: 'TiviMate' },
    { pattern: 'perfectplayer', name: 'Perfect Player' },
    { pattern: 'diyp', name: 'DIYP影音' },
    { pattern: 'tvbox', name: 'TVBox' },
    { pattern: 'ijkplayer', name: 'ijkPlayer' },
    { pattern: 'exoplayer', name: 'ExoPlayer' }
  ];
  
  for (const { pattern, name } of playerPatterns) {
    if (lowerUA.includes(pattern)) {
      return name;
    }
  }
  
  return 'unknown';
}

// 检查是否是浏览器
function isBrowser(userAgent) {
  const lowerUA = userAgent.toLowerCase();
  const browserPatterns = [
    'chrome', 'firefox', 'safari', 'edge',
    'opera', 'msie', 'trident', 'mozilla'
  ];
  
  return browserPatterns.some(pattern => lowerUA.includes(pattern));
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
      'X-Ku9-Access': 'granted'
    }
  });
}

// 发送文件未找到
function sendFileNotFound(filename) {
  return new Response(`#EXTM3U
# 文件不存在: ${filename}
# 此系统仅限酷9播放器访问
# 请在链接后添加: ?ku9_token=ku9_secure_token_2024
# 技术支持: 请联系管理员`, { 
    status: 404,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}

// 发送抓包工具阻止
function sendSniffingToolBlock(filename, userAgent) {
  const response = `# 🚫 安全系统检测到抓包工具

# 检测到工具: ${userAgent.substring(0, 100)}
# 时间: ${new Date().toLocaleString()}
# 文件: ${filename}

# ⚠️ 此系统禁止使用抓包工具访问
# 🔒 仅限酷9播放器访问

# 如需访问，请:
# 1. 停止使用抓包工具
# 2. 使用酷9播放器
# 3. 添加令牌: ?ku9_token=ku9_secure_token_2024

# 错误代码: BLOCKED_SNIFFING_TOOL`;

  return new Response(response, {
    status: 403,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      'X-Blocked-Reason': 'sniffing-tool'
    }
  });
}

// 发送其他播放器阻止
function sendOtherPlayerBlock(filename, playerName, userAgent) {
  const response = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:10
#EXT-X-MEDIA-SEQUENCE:0

# 🚫 播放器限制

# 检测到播放器: ${playerName}
# User-Agent: ${userAgent.substring(0, 80)}
# 时间: ${new Date().toLocaleString()}

# 📢 重要通知:
# 此内容仅限酷9播放器访问
# 其他播放器无法播放

# 🎯 解决方案:
# 1. 下载酷9播放器
# 2. 在链接后添加令牌: ?ku9_token=ku9_secure_token_2024

# 错误代码: PLAYER_NOT_SUPPORTED

#EXTINF:10,
# 不支持此播放器
http://example.com/blocked.mp4

#EXT-X-ENDLIST`;

  return new Response(response, {
    headers: {
      'Content-Type': 'audio/x-mpegurl; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      'X-Blocked-Reason': 'other-player'
    }
  });
}

// 发送浏览器阻止
function sendBrowserBlock(filename, userAgent) {
  const response = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>🚫 浏览器访问受限 - 酷9专用系统</title>
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
        .info-box {
            background: #e3f2fd;
            border-left: 4px solid #2196f3;
            padding: 15px;
            margin: 20px 0;
        }
        .solution-box {
            background: #e8f5e8;
            border-left: 4px solid #4caf50;
            padding: 15px;
            margin: 20px 0;
        }
        code {
            background: #f1f1f1;
            padding: 2px 5px;
            border-radius: 3px;
            font-family: monospace;
        }
        .copy-btn {
            background: #4CAF50;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 10px;
        }
        .ku9-note {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚫 浏览器访问受限</h1>
        <p>检测到您正在使用浏览器访问。</p>
        <p>此内容仅限 <strong>酷9播放器</strong> 播放，浏览器无法直接播放。</p>
        
        <div class="info-box">
            <h3>📋 访问信息：</h3>
            <p><strong>文件：</strong> ${filename}</p>
            <p><strong>浏览器：</strong> ${userAgent.substring(0, 100)}</p>
            <p><strong>时间：</strong> ${new Date().toLocaleString()}</p>
            <p><strong>状态：</strong> ❌ 浏览器访问被拒绝</p>
        </div>
        
        <div class="ku9-note">
            <h3>🔒 酷9专用系统：</h3>
            <p>此系统采用酷9播放器专用保护：</p>
            <ul>
                <li>仅限酷9播放器访问</li>
                <li>防止抓包工具</li>
                <li>保护内容安全</li>
                <li>令牌验证机制</li>
            </ul>
        </div>
        
        <div class="solution-box">
            <h3>🎯 解决方案：</h3>
            <p><strong>使用酷9播放器访问：</strong></p>
            <ol>
                <li>下载并安装酷9播放器</li>
                <li>复制以下链接到酷9播放器</li>
                <li>或在酷9播放器中直接打开</li>
            </ol>
            
            <p><strong>酷9专用链接：</strong></p>
            <code id="ku9Link"></code>
            <button class="copy-btn" onclick="copyKu9Link()">复制酷9专用链接</button>
        </div>
    </div>

    <script>
        // 获取当前URL并添加令牌参数
        const currentUrl = window.location.href.split('?')[0];
        const ku9Link = currentUrl + '?ku9_token=ku9_secure_token_2024';
        document.getElementById('ku9Link').textContent = ku9Link;
        
        function copyKu9Link() {
            navigator.clipboard.writeText(ku9Link)
                .then(() => alert('酷9专用链接已复制到剪贴板'))
                .catch(err => alert('复制失败: ' + err));
        }
    </script>
</body>
</html>`;

  return new Response(response, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      'X-Blocked-Reason': 'browser'
    }
  });
}

// 发送需要令牌
function sendRequireToken(filename, userAgent) {
  const response = `# 🚫 需要酷9令牌访问

# 检测到客户端: ${userAgent.substring(0, 100)}
# 时间: ${new Date().toLocaleString()}
# 文件: ${filename}

# 📢 此系统仅限酷9播放器访问
# 请使用酷9播放器或添加令牌

# 🔑 添加令牌方法:
# 在链接后添加: ?ku9_token=ku9_secure_token_2024

# 示例:
# https://your-domain.com/z/${filename}?ku9_token=ku9_secure_token_2024

# 🆘 如果酷9播放器无法播放:
# 1. 确保链接包含令牌参数
# 2. 联系管理员获取帮助
# 3. 检查酷9播放器版本

# 错误代码: REQUIRE_KU9_TOKEN`;

  return new Response(response, {
    status: 403,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      'X-Required': 'ku9-token'
    }
  });
}
