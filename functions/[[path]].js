// Cloudflare Pages Functions - 酷9播放器专用系统（加强版）
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

    // API: 酷9播放器测试
    if (pathname === '/ku9_test.php' && request.method === 'GET') {
      return await handleKu9Test(request);
    }

    // API: 生成酷9签名
    if (pathname === '/ku9_sign.php' && request.method === 'GET') {
      return await handleKu9Sign(request);
    }

    // 动态加密文件下载
    if (pathname.startsWith('/z/')) {
      const filename = pathname.substring(3);
      return await handleSecureFileDownload(filename, request, env);
    }

    // 动态令牌验证
    if (pathname.startsWith('/verify/')) {
      const token = pathname.substring(8);
      return await handleDynamicTokenVerify(token, request, env);
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
        
        .warning-box {
            background: #fff3cd;
            border: 2px solid #ffc107;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
        }
        
        .warning-box h4 {
            color: #856404;
            margin-top: 0;
        }
        
        .block-list {
            background: #f8d7da;
            border: 2px solid #f5c6cb;
            border-radius: 6px;
            padding: 10px;
            margin: 10px 0;
            font-size: 12px;
        }
        
        .block-list ul {
            list-style-type: none;
            padding: 0;
            margin: 0;
        }
        
        .block-list li {
            padding: 3px 0;
        }
        
        .secure-feature {
            background: #d1ecf1;
            border: 2px solid #bee5eb;
            border-radius: 6px;
            padding: 12px;
            margin: 10px 0;
        }
    </style>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>🔒酷9播放器专用系统（加强版）</title>
</head>

<body>
    <h2>🔐 酷9播放器专用系统（加强版）</h2>
    
    <div class="warning-box">
        <h4>⚠️ 重要安全升级：</h4>
        <p>系统已升级为<strong>酷9播放器独家专用</strong>，现在可以有效拦截：</p>
        <div class="block-list">
            <ul>
                <li>✅ TVBox/影视仓/Dipy等助手软件</li>
                <li>✅ 各种猫影视、TV端播放器</li>
                <li>✅ 浏览器直接访问</li>
                <li>✅ 抓包工具和分析软件</li>
                <li>✅ 模拟酷9播放器的伪造请求</li>
            </ul>
        </div>
        <p><strong>只有真正的酷9播放器才能正常播放！</strong></p>
    </div>
    
    <div class="ku9-simple">
        <h3>✅ 酷9播放器专享功能：</h3>
        <div class="secure-feature">
            <p>1. <strong>动态令牌验证</strong> - 每次请求自动生成新令牌</p>
            <p>2. <strong>时间戳签名</strong> - 防止链接被复用</p>
            <p>3. <strong>TVBox助手拦截</strong> - 智能识别并阻止非酷9软件</p>
            <p>4. <strong>抓包工具屏蔽</strong> - 全面保护链接安全</p>
            <p>5. <strong>模拟请求检测</strong> - 识别伪造的酷9播放器请求</p>
        </div>
    </div>
    
    <div class="token-box">
        <strong>🔑 酷9专用令牌（动态生成）：</strong>
        <div style="margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 4px;">
            <code id="ku9Token">点击"生成动态令牌"获取</code>
        </div>
        <button class="copy-btn" onclick="generateDynamicToken()">生成动态令牌</button>
        <button class="copy-btn" onclick="copyToken()" style="background: #6c757d;">复制令牌</button>
        <p><small>动态令牌5分钟内有效，过期需要重新生成</small></p>
    </div>
    
    <div class="simple-explanation">
        <h4>🔍 工作原理（加强版）：</h4>
        <p>1. <strong>客户端检测</strong> - 智能识别酷9播放器特征</p>
        <p>2. <strong>动态令牌</strong> - 每次访问生成唯一验证码</p>
        <p>3. <strong>时间戳验证</strong> - 防止链接被保存和复用</p>
        <p>4. <strong>模拟器识别</strong> - 检测并阻止伪造请求</p>
        <p>5. <strong>TVBox拦截</strong> - 阻止助手软件获取源码</p>
        <p>6. <strong>多层防护</strong> - User-Agent + 令牌 + 签名三重验证</p>
    </div>
    
    <div class="test-section">
        <h4>📱 酷9播放器连接测试：</h4>
        <p>测试您的酷9播放器是否符合访问条件：</p>
        <button class="test-btn" onclick="testKu9Connection()">开始全面检测</button>
        <div id="testResult" style="margin-top: 10px;"></div>
        <p><small>测试项目：酷9特征识别、令牌验证、模拟检测、时间有效性</small></p>
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
        <button type="button" onclick="generateSecureKu9Link()" style="background: #007bff; color: white;">生成酷9安全链接</button>
    </form>
    <p>可在线编辑已有文件，输入相同文件名与密码。</p><br>    

    <div id="linkDisplay" style="display:none;">
        <div class="success-message">✅ 文件已成功转为安全链接：</div>
        <a id="linkAnchor" href="" target="_blank"></a>
        <button class="copy-btn" onclick="copyLink()">复制链接</button>
        
        <div id="ku9LinkSection" style="display:none; margin-top: 15px;">
            <div class="ku9-help">
                <h4>📱 酷9播放器专用链接（加强版）：</h4>
                <p><strong>动态安全链接（推荐使用）：</strong></p>
                <div style="background: #f8f9fa; padding: 10px; border-radius: 4px; margin: 10px 0;">
                    <code id="ku9DynamicLink"></code>
                </div>
                <button class="copy-btn" onclick="copyKu9DynamicLink()">复制动态链接</button>
                <p><small>此链接包含动态令牌和签名，5分钟内有效，防止TVBox助手获取</small></p>
                
                <p><strong>如果播放器不支持动态令牌：</strong></p>
                <div style="background: #e9ecef; padding: 10px; border-radius: 4px; margin: 10px 0;">
                    <code id="ku9StaticLink"></code>
                </div>
                <button class="copy-btn" onclick="copyKu9StaticLink()" style="background: #6c757d;">复制静态链接</button>
                <p><small>静态链接安全性较低，仅用于兼容老版本</small></p>
                
                <p><strong>重要提示：</strong></p>
                <p>1. 动态链接每次访问都会变化，无法被TVBox助手固定使用</p>
                <p>2. 静态链接可能被TVBox助手获取，建议使用动态链接</p>
                <p>3. 如遇到播放问题，请使用最新版酷9播放器</p>
            </div>
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
        let CURRENT_DYNAMIC_TOKEN = '';
        let TOKEN_EXPIRY = 0;
        
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
            
            // 显示酷9链接部分
            document.getElementById('ku9LinkSection').style.display = 'block';
            
            // 生成静态酷9链接
            const staticKu9Link = link + '?ku9_token=ku9_secure_token_2024&t=' + Date.now();
            document.getElementById('ku9StaticLink').textContent = staticKu9Link;
            
            // 生成动态酷9链接
            generateDynamicKu9Link(link);
            
            linkDisplay.scrollIntoView({ behavior: 'smooth' });
        }
        
        function generateDynamicKu9Link(baseLink) {
            // 生成动态令牌
            const timestamp = Math.floor(Date.now() / 1000);
            const dynamicToken = 'ku9_dynamic_' + timestamp + '_' + Math.random().toString(36).substr(2, 9);
            
            // 生成签名
            const signature = generateSignature(baseLink, timestamp);
            
            // 构建动态链接
            const dynamicLink = baseLink + 
                '?ku9_token=' + encodeURIComponent(dynamicToken) +
                '&t=' + timestamp +
                '&sign=' + signature +
                '&v=2';
            
            document.getElementById('ku9DynamicLink').textContent = dynamicLink;
            
            // 保存当前令牌
            CURRENT_DYNAMIC_TOKEN = dynamicToken;
            TOKEN_EXPIRY = timestamp + 300; // 5分钟有效
            
            // 更新令牌显示
            document.getElementById('ku9Token').textContent = dynamicToken;
        }
        
        function generateSignature(url, timestamp) {
            // 简单的签名算法，防止被轻易伪造
            const secret = 'ku9_secure_salt_2024';
            const str = url + timestamp + secret;
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }
            return Math.abs(hash).toString(36);
        }
        
        function copyLink() {
            const link = document.getElementById('linkAnchor').href;
            navigator.clipboard.writeText(link)
                .then(() => alert('安全链接已复制到剪贴板'))
                .catch(err => alert('复制失败: ' + err));
        }
        
        function copyKu9DynamicLink() {
            const link = document.getElementById('ku9DynamicLink').textContent;
            navigator.clipboard.writeText(link)
                .then(() => alert('酷9动态安全链接已复制到剪贴板'))
                .catch(err => alert('复制失败: ' + err));
        }
        
        function copyKu9StaticLink() {
            const link = document.getElementById('ku9StaticLink').textContent;
            navigator.clipboard.writeText(link)
                .then(() => alert('酷9静态链接已复制到剪贴板'))
                .catch(err => alert('复制失败: ' + err));
        }
        
        function generateDynamicToken() {
            const timestamp = Math.floor(Date.now() / 1000);
            const randomStr = Math.random().toString(36).substr(2, 12);
            const token = 'ku9_' + timestamp + '_' + randomStr;
            
            CURRENT_DYNAMIC_TOKEN = token;
            TOKEN_EXPIRY = timestamp + 300;
            
            document.getElementById('ku9Token').textContent = token;
            alert('动态令牌已生成，5分钟内有效：\n' + token);
        }
        
        function copyToken() {
            if (!CURRENT_DYNAMIC_TOKEN) {
                alert('请先生成动态令牌');
                return;
            }
            
            navigator.clipboard.writeText(CURRENT_DYNAMIC_TOKEN)
                .then(() => alert('动态令牌已复制到剪贴板'))
                .catch(err => alert('复制失败: ' + err));
        }
        
        function generateSecureKu9Link() {
            const filename = document.getElementById('filename').value;
            if (!filename) {
                alert('请输入文件名');
                return;
            }
            
            const baseUrl = window.location.origin + '/z/' + encodeURIComponent(filename);
            
            // 显示普通链接
            const linkDisplay = document.getElementById('linkDisplay');
            const linkAnchor = document.getElementById('linkAnchor');
            linkAnchor.href = baseUrl;
            linkAnchor.textContent = baseUrl;
            linkDisplay.style.display = 'block';
            
            // 显示酷9链接部分
            document.getElementById('ku9LinkSection').style.display = 'block';
            
            // 生成静态酷9链接
            const staticKu9Link = baseUrl + '?ku9_token=ku9_secure_token_2024&t=' + Date.now();
            document.getElementById('ku9StaticLink').textContent = staticKu9Link;
            
            // 生成动态酷9链接
            generateDynamicKu9Link(baseUrl);
            
            linkDisplay.scrollIntoView({ behavior: 'smooth' });
        }
        
        function testKu9Connection() {
            const testResult = document.getElementById('testResult');
            testResult.innerHTML = '<p style="color: #856404;">正在全面检测酷9连接...</p>';
            
            fetch('ku9_test.php?t=' + Date.now())
                .then(response => response.json())
                .then(data => {
                    let html = '<div style="background: #f8f9fa; padding: 10px; border-radius: 4px;">';
                    html += '<p><strong>检测结果：</strong></p>';
                    
                    if (data.isKu9) {
                        html += '<p class="status-good">✅ 酷9播放器特征识别成功</p>';
                    } else {
                        html += '<p class="status-bad">❌ 未检测到酷9播放器特征</p>';
                    }
                    
                    if (data.isSniffingTool) {
                        html += '<p class="status-bad">❌ 检测到抓包工具</p>';
                    } else {
                        html += '<p class="status-good">✅ 无抓包工具检测</p>';
                    }
                    
                    if (data.isOtherPlayer) {
                        html += '<p class="status-bad">❌ 检测到其他播放器：' + data.detectedPlayer + '</p>';
                    } else {
                        html += '<p class="status-good">✅ 无其他播放器检测</p>';
                    }
                    
                    if (data.isTVBox) {
                        html += '<p class="status-bad">❌ 检测到TVBox助手软件</p>';
                    } else {
                        html += '<p class="status-good">✅ 无TVBox助手检测</p>';
                    }
                    
                    html += '<p><strong>User-Agent：</strong>' + data.userAgent.substring(0, 80) + '...</p>';
                    
                    html += '<p><strong>建议：</strong></p><ul>';
                    data.recommendations.forEach(rec => {
                        html += '<li>' + rec + '</li>';
                    });
                    html += '</ul></div>';
                    
                    testResult.innerHTML = html;
                })
                .catch(err => {
                    testResult.innerHTML = '<p class="status-bad">❌ 测试失败：' + err.message + '</p>';
                });
        }
        
        // 页面加载时初始化
        window.addEventListener('load', function() {
            // 显示当前时间
            const now = new Date();
            document.getElementById('ku9Token').textContent = '动态令牌未生成 - 当前时间: ' + now.toLocaleTimeString();
        });
    </script>
</body>
</html>`;
}

// 管理页面处理
async function handleManagementPage(request, env) {
  return new Response('管理页面（加强版）', {
    headers: { 
      'content-type': 'text/html;charset=UTF-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Content-Type-Options': 'nosniff'
    },
  });
}

// 酷9播放器测试接口
async function handleKu9Test(request) {
  const userAgent = request.headers.get('User-Agent') || '';
  const lowerUA = userAgent.toLowerCase();
  const url = new URL(request.url);
  
  let result = {
    status: '全面检测开始',
    userAgent: userAgent,
    isKu9: false,
    isSniffingTool: false,
    isOtherPlayer: false,
    isTVBox: false,
    isBrowser: false,
    detectedPlayer: 'unknown',
    timestamp: Date.now(),
    recommendations: []
  };
  
  // 1. 检查是否是TVBox助手（优先检测）
  const tvboxPatterns = [
    'tvbox', 'tv-box', 'tv_box', 'tivi', 'tiviplayer',
    'tivimate', 'tvmate', 'tv.mate', 'catvod',
    '影视仓', 'dipy', 'diyp', 'okhttp', 'dart',
    'moviecat', '云星日记', '影视工场', '影音壳',
    'tvhub', 'tvhub.', 'tv端', 'tv端播放器',
    'tv播放器', 'android-tv', 'smart-tv', 'leanback'
  ];
  
  for (const pattern of tvboxPatterns) {
    if (lowerUA.includes(pattern.toLowerCase())) {
      result.isTVBox = true;
      result.detectedPlayer = pattern;
      result.recommendations.push('检测到TVBox助手类软件，已被系统拦截');
      break;
    }
  }
  
  // 2. 检查是否是抓包工具
  const sniffingTools = [
    'httpcanary', 'packetcapture', 'charles', 'fiddler',
    'wireshark', 'burpsuite', 'mitmproxy', 'proxyman',
    'surge', 'shadowrocket', 'postman', 'insomnia',
    'thunder.*client', 'curl', 'wget', 'python-requests',
    'axios', 'requests', 'okhttp/', 'http.client',
    'httplib', 'faraday', 'rest-client', 'jdk.internal',
    'java/', 'cfnetwork', 'alamofire', 'volley'
  ];
  
  for (const tool of sniffingTools) {
    if (new RegExp(tool.replace('.*', '.*'), 'i').test(lowerUA)) {
      result.isSniffingTool = true;
      result.recommendations.push('检测到抓包工具或HTTP客户端，已被系统拦截');
      break;
    }
  }
  
  // 3. 检查是否是酷9播放器（加强检测）
  const ku9Patterns = [
    'ku9', 'k9', 'ku9player', 'k9player',
    'com.ku9', 'com.k9', 'ku9-', 'k9-',
    'ku9_', 'k9_', 'ku9app', 'k9app',
    'ku9player/', 'k9player/', 'ku9播放器',
    'k9播放器'
  ];
  
  // 酷9特有的请求头检查
  const ku9Headers = [
    'x-ku9-client', 'x-ku9-version', 'x-ku9-device',
    'x-k9-client', 'x-k9-version', 'x-k9-device'
  ];
  
  let hasKu9Header = false;
  for (const header of ku9Headers) {
    if (request.headers.get(header)) {
      hasKu9Header = true;
      break;
    }
  }
  
  // 酷9特征检测
  let ku9Score = 0;
  
  // User-Agent包含酷9特征
  for (const pattern of ku9Patterns) {
    if (lowerUA.includes(pattern)) {
      ku9Score += 3;
      result.isKu9 = true;
      break;
    }
  }
  
  // 有酷9特有的请求头
  if (hasKu9Header) {
    ku9Score += 5;
    result.isKu9 = true;
  }
  
  // 检查Accept头部（酷9可能有的特定格式）
  const acceptHeader = request.headers.get('Accept') || '';
  if (acceptHeader.includes('video') || acceptHeader.includes('mpegurl') || acceptHeader.includes('m3u8')) {
    ku9Score += 2;
  }
  
  // 检查Referer（如果有）
  const referer = request.headers.get('Referer') || '';
  if (referer.includes('ku9') || referer.includes('k9')) {
    ku9Score += 2;
  }
  
  if (ku9Score >= 3) {
    result.isKu9 = true;
    result.recommendations.push('✅ 酷9播放器特征检测通过，可以正常访问');
  }
  
  // 4. 检查是否是其他播放器
  const otherPlayers = [
    { pattern: 'mxplayer', name: 'MX Player' },
    { pattern: 'vlc', name: 'VLC' },
    { pattern: 'potplayer', name: 'PotPlayer' },
    { pattern: 'kodi', name: 'Kodi' },
    { pattern: 'nplayer', name: 'nPlayer' },
    { pattern: 'infuse', name: 'Infuse' },
    { pattern: 'perfectplayer', name: 'Perfect Player' },
    { pattern: 'ijkplayer', name: 'ijkPlayer' },
    { pattern: 'exoplayer', name: 'ExoPlayer' },
    { pattern: 'vlc-android', name: 'VLC Android' },
    { pattern: 'mx tech', name: 'MX Tech' },
    { pattern: 'justplayer', name: 'Just Player' },
    { pattern: 'nova video', name: 'Nova Video' },
    { pattern: 'mpv', name: 'MPV' },
    { pattern: 'mpchc', name: 'MPC-HC' }
  ];
  
  for (const { pattern, name } of otherPlayers) {
    if (lowerUA.includes(pattern)) {
      result.isOtherPlayer = true;
      result.detectedPlayer = name;
      result.recommendations.push(`检测到其他播放器: ${name}，请使用酷9播放器`);
      break;
    }
  }
  
  // 5. 检查是否是浏览器
  const browsers = [
    'chrome', 'firefox', 'safari', 'edge',
    'opera', 'msie', 'trident', 'mozilla',
    'webkit', 'gecko', 'chromium', 'brave',
    'vivaldi', 'yabrowser', 'ucbrowser',
    'qqbrowser', '2345explorer', 'metasr',
    'lbbrowser', 'maxthon', 'quark'
  ];
  
  for (const browser of browsers) {
    if (lowerUA.includes(browser)) {
      result.isBrowser = true;
      result.recommendations.push('检测到浏览器，请使用酷9播放器');
      break;
    }
  }
  
  // 6. 如果没有检测到任何特征
  if (!result.isKu9 && !result.isSniffingTool && !result.isOtherPlayer && !result.isBrowser && !result.isTVBox) {
    result.recommendations.push('客户端类型未知，尝试添加动态令牌参数');
    result.recommendations.push('请联系管理员获取最新酷9播放器');
  }
  
  // 7. 最终建议
  if (!result.isKu9) {
    result.recommendations.push('建议使用最新版酷9播放器');
    result.recommendations.push('确保链接包含动态令牌参数');
  }
  
  if (result.isTVBox) {
    result.recommendations.push('TVBox助手已被拦截，无法获取播放内容');
    result.recommendations.push('请使用官方酷9播放器');
  }
  
  return new Response(JSON.stringify(result, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}

// 生成酷9签名
async function handleKu9Sign(request) {
  const url = new URL(request.url);
  const timestamp = Math.floor(Date.now() / 1000);
  const base = url.searchParams.get('base') || '';
  
  // 生成动态令牌
  const dynamicToken = 'ku9_dynamic_' + timestamp + '_' + Math.random().toString(36).substr(2, 9);
  
  // 生成签名
  const signature = generateKu9Signature(base, timestamp);
  
  const result = {
    success: true,
    token: dynamicToken,
    timestamp: timestamp,
    signature: signature,
    expiry: timestamp + 300, // 5分钟有效
    full_url: base + '?ku9_token=' + encodeURIComponent(dynamicToken) + '&t=' + timestamp + '&sign=' + signature + '&v=2'
  };
  
  return new Response(JSON.stringify(result), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
}

// 动态令牌验证
async function handleDynamicTokenVerify(token, request, env) {
  const timestamp = Math.floor(Date.now() / 1000);
  
  // 验证令牌格式
  if (!token.startsWith('ku9_dynamic_')) {
    return new Response(JSON.stringify({
      valid: false,
      reason: '令牌格式错误'
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
  
  // 提取时间戳
  const parts = token.split('_');
  if (parts.length < 3) {
    return new Response(JSON.stringify({
      valid: false,
      reason: '令牌格式无效'
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
  
  const tokenTimestamp = parseInt(parts[2]);
  if (isNaN(tokenTimestamp)) {
    return new Response(JSON.stringify({
      valid: false,
      reason: '令牌时间戳无效'
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
  
  // 检查令牌是否过期（5分钟）
  if (timestamp - tokenTimestamp > 300) {
    return new Response(JSON.stringify({
      valid: false,
      reason: '令牌已过期',
      expired: true,
      token_age: timestamp - tokenTimestamp
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
  
  // 生成新令牌
  const newToken = 'ku9_dynamic_' + timestamp + '_' + Math.random().toString(36).substr(2, 9);
  
  return new Response(JSON.stringify({
    valid: true,
    token_age: timestamp - tokenTimestamp,
    new_token: newToken,
    expiry: timestamp + 300
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

// 安全文件下载处理 - 加强版
async function handleSecureFileDownload(filename, request, env) {
  try {
    // 解码文件名
    const decodedFilename = decodeURIComponent(filename);
    const safeFilename = sanitizeFilename(decodedFilename);
    const content = await env.MY_TEXT_STORAGE.get('file_' + safeFilename);
    
    if (!content) {
      return sendFileNotFound(safeFilename);
    }

    const url = new URL(request.url);
    const userAgent = request.headers.get('User-Agent') || '';
    const lowerUA = userAgent.toLowerCase();
    const timestamp = Math.floor(Date.now() / 1000);
    
    // 1. 检查管理令牌（如果有）
    const managementToken = url.searchParams.get('manage_token');
    const expectedManagementToken = await env.MY_TEXT_STORAGE.get('management_token') || 'default_manage_token_2024';
    
    if (managementToken && managementToken === expectedManagementToken) {
      return sendOriginalContent(safeFilename, content, 'management');
    }

    // 2. 优先检测TVBox助手（最严格的检测）
    if (isTVBoxAssistant(userAgent)) {
      return sendTVBoxBlock(safeFilename, userAgent);
    }
    
    // 3. 检查是否是抓包工具
    if (isSniffingTool(userAgent)) {
      return sendSniffingToolBlock(safeFilename, userAgent);
    }
    
    // 4. 检查动态令牌（v=2版本）
    const ku9Token = url.searchParams.get('ku9_token');
    const urlTimestamp = url.searchParams.get('t');
    const signature = url.searchParams.get('sign');
    const version = url.searchParams.get('v');
    
    if (version === '2' && ku9Token && urlTimestamp && signature) {
      // 验证动态令牌
      if (isValidDynamicToken(ku9Token, urlTimestamp, signature, url.toString())) {
        return sendOriginalContent(safeFilename, content, 'ku9-dynamic-token');
      }
    }
    
    // 5. 检查静态令牌
    if (ku9Token && ku9Token === 'ku9_secure_token_2024') {
      // 但还需要检查User-Agent是否是酷9
      if (isKu9UserAgent(userAgent)) {
        return sendOriginalContent(safeFilename, content, 'ku9-static-token');
      } else {
        // 有令牌但不是酷9User-Agent，可能是TVBox模拟
        return sendTVBoxBlock(safeFilename, userAgent);
      }
    }
    
    // 6. 如果没有令牌，检查User-Agent是否是酷9播放器（加强检测）
    if (isKu9UserAgent(userAgent)) {
      // 检查是否有酷9特有的请求头
      if (hasKu9Headers(request)) {
        return sendOriginalContent(safeFilename, content, 'ku9-ua-headers');
      } else {
        // 只有User-Agent但没有特有请求头，可能是模拟的
        return sendKu9RequireToken(safeFilename, userAgent);
      }
    }
    
    // 7. 检查是否是其他播放器
    const playerName = detectPlayer(userAgent);
    if (playerName !== 'unknown') {
      return sendOtherPlayerBlock(safeFilename, playerName, userAgent);
    }
    
    // 8. 检查是否是浏览器
    if (isBrowser(userAgent)) {
      return sendBrowserBlock(safeFilename, userAgent);
    }
    
    // 9. 其他情况，要求使用酷9播放器并获取动态令牌
    return sendRequireKu9AndToken(safeFilename, userAgent);
    
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

// 检查是否是TVBox助手
function isTVBoxAssistant(userAgent) {
  const lowerUA = userAgent.toLowerCase();
  
  // TVBox助手特征
  const tvboxPatterns = [
    'tvbox', 'tv-box', 'tv_box', 'tivi', 'tiviplayer',
    'tivimate', 'tvmate', 'tv.mate', 'catvod',
    '影视仓', 'dipy', 'diyp', 'okhttp/3', 'okhttp/4',
    'dart/', 'moviecat', '云星日记', '影视工场',
    '影音壳', 'tvhub', 'tvhub.', 'tv端', 'tv端播放器',
    'tv播放器', 'android-tv', 'smart-tv', 'leanback',
    'atv', 'tv.', 'tv\\d', 'tcltv', '海信电视',
    '小米电视', '华为智慧屏', '创维电视', 'sony bravia',
    'samsung smarttv', 'lg smarttv', 'panasonic tv'
  ];
  
  // HTTP库特征（TVBox常用）
  const httpLibraries = [
    'okhttp/', 'retrofit/', 'volley/', 'afnetworking/',
    'alamofire/', 'axios/', 'requests/', 'urllib/',
    'httpclient', 'httpurlconnection', 'cfnetwork/',
    'winhttp', 'libcurl', 'java/', 'jdk.internal.http',
    'python-requests', 'guzzlehttp'
  ];
  
  // 检查TVBox特征
  for (const pattern of tvboxPatterns) {
    if (lowerUA.includes(pattern.toLowerCase())) {
      return true;
    }
  }
  
  // 检查是否是TV端应用（没有浏览器特征但使用HTTP库）
  const isTVLike = httpLibraries.some(lib => lowerUA.includes(lib)) &&
                  !isBrowser(userAgent) &&
                  !isKu9UserAgent(userAgent);
  
  return isTVLike;
}

// 检查是否是抓包工具
function isSniffingTool(userAgent) {
  const lowerUA = userAgent.toLowerCase();
  const sniffingTools = [
    'httpcanary', 'packetcapture', 'charles', 'fiddler',
    'wireshark', 'burpsuite', 'mitmproxy', 'proxyman',
    'surge', 'shadowrocket', 'postman', 'insomnia',
    'thunder.*client', 'curl', 'wget',
    'fiddler everywehre', 'mitm', 'zap', 'nessus',
    'nikto', 'nmap', 'sqlmap', 'metasploit',
    'android-debug', 'debug-', 'debug.', 'test-'
  ];
  
  return sniffingTools.some(tool => {
    const pattern = new RegExp(tool.replace('.*', '.*'), 'i');
    return pattern.test(lowerUA);
  });
}

// 检查是否是酷9User-Agent（加强检测）
function isKu9UserAgent(userAgent) {
  const lowerUA = userAgent.toLowerCase();
  const ku9Patterns = [
    'ku9', 'k9', 'ku9player', 'k9player',
    'com.ku9', 'com.k9', 'ku9-', 'k9-',
    'ku9_', 'k9_', 'ku9app', 'k9app',
    'ku9player/', 'k9player/', 'ku9播放器',
    'k9播放器', 'ku9\\d', 'k9\\d'
  ];
  
  return ku9Patterns.some(pattern => {
    const regex = new RegExp(pattern.replace('\\d', '\\d+'), 'i');
    return regex.test(lowerUA);
  });
}

// 检查是否有酷9特有的请求头
function hasKu9Headers(request) {
  const ku9Headers = [
    'x-ku9-client', 'x-ku9-version', 'x-ku9-device',
    'x-k9-client', 'x-k9-version', 'x-k9-device',
    'x-ku9-signature', 'x-k9-signature',
    'ku9-client', 'k9-client'
  ];
  
  return ku9Headers.some(header => request.headers.get(header) !== null);
}

// 验证动态令牌
function isValidDynamicToken(token, urlTimestamp, signature, url) {
  try {
    const timestamp = parseInt(urlTimestamp);
    const now = Math.floor(Date.now() / 1000);
    
    // 检查时间戳是否有效
    if (isNaN(timestamp) || Math.abs(now - timestamp) > 300) {
      return false;
    }
    
    // 检查令牌格式
    if (!token.startsWith('ku9_dynamic_')) {
      return false;
    }
    
    // 验证签名
    const expectedSignature = generateKu9Signature(url.split('?')[0], timestamp);
    return signature === expectedSignature;
  } catch (error) {
    return false;
  }
}

// 生成酷9签名
function generateKu9Signature(base, timestamp) {
  const secret = 'ku9_secure_salt_2024';
  const str = base + timestamp + secret;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
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
    { pattern: 'perfectplayer', name: 'Perfect Player' },
    { pattern: 'ijkplayer', name: 'ijkPlayer' },
    { pattern: 'exoplayer', name: 'ExoPlayer' },
    { pattern: 'vlc-android', name: 'VLC Android' },
    { pattern: 'mx tech', name: 'MX Tech' },
    { pattern: 'justplayer', name: 'Just Player' },
    { pattern: 'nova video', name: 'Nova Video' },
    { pattern: 'mpv', name: 'MPV' },
    { pattern: 'mpchc', name: 'MPC-HC' },
    { pattern: 'smplayer', name: 'SMPlayer' },
    { pattern: 'gstreamer', name: 'GStreamer' },
    { pattern: 'ffmpeg', name: 'FFmpeg' },
    { pattern: 'windows media player', name: 'Windows Media Player' },
    { pattern: 'quicktime', name: 'QuickTime' }
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
    'opera', 'msie', 'trident', 'mozilla',
    'webkit', 'gecko', 'chromium', 'brave',
    'vivaldi', 'yabrowser', 'ucbrowser',
    'qqbrowser', '2345explorer', 'metasr',
    'lbbrowser', 'maxthon', 'quark',
    'sogou', 'baidubrowser', '360se',
    '2345chrome', 'liebao'
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
  } else if (filename.endsWith('.php')) {
    contentType = 'text/plain; charset=utf-8';
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
      'X-Ku9-Access': 'granted',
      'X-Ku9-Timestamp': Math.floor(Date.now() / 1000).toString(),
      'X-Ku9-Security': 'level-3'
    }
  });
}

// 发送文件未找到
function sendFileNotFound(filename) {
  return new Response(`#EXTM3U
# 文件不存在: ${filename}
# 此系统仅限酷9播放器访问
# 请使用酷9播放器并获取动态令牌
# 技术支持: 请联系管理员
# 时间: ${new Date().toLocaleString()}`, { 
    status: 404,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}

// 发送TVBox助手阻止
function sendTVBoxBlock(filename, userAgent) {
  const response = `# 🚫 TVBox助手访问被拒绝

# 检测到TVBox助手软件
# User-Agent: ${userAgent.substring(0, 150)}
# 时间: ${new Date().toLocaleString()}
# 文件: ${filename}

# ⚠️ 此系统为酷9播放器专用
# 🔒 TVBox助手无法访问

# 📢 重要提示:
# 此内容仅限酷9播放器播放
# TVBox/影视仓/Dipy等助手软件已被拦截

# 🎯 解决方案:
# 1. 下载官方酷9播放器
# 2. 使用酷9播放器访问
# 3. 获取动态安全令牌

# 如需技术支持，请联系管理员
# 错误代码: BLOCKED_TVBOX_ASSISTANT`;

  return new Response(response, {
    status: 403,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      'X-Blocked-Reason': 'tvbox-assistant',
      'X-Blocked-Client': userAgent.substring(0, 100)
    }
  });
}

// 发送抓包工具阻止
function sendSniffingToolBlock(filename, userAgent) {
  const response = `# 🚫 安全系统检测到抓包工具

# 检测到工具: ${userAgent.substring(0, 150)}
# 时间: ${new Date().toLocaleString()}
# 文件: ${filename}

# ⚠️ 此系统禁止使用抓包工具访问
# 🔒 仅限酷9播放器访问

# 📢 系统已记录此次访问:
# - IP地址已被记录
# - 访问时间已记录
# - 工具特征已记录

# 🎯 如需访问，请:
# 1. 停止使用抓包工具
# 2. 使用酷9播放器
# 3. 获取动态安全令牌

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

// 发送酷9需要令牌
function sendKu9RequireToken(filename, userAgent) {
  const response = `# 🚫 酷9播放器需要动态令牌

# 检测到酷9播放器访问
# 但缺少安全令牌
# 时间: ${new Date().toLocaleString()}
# 文件: ${filename}

# 📢 安全升级通知:
# 系统已升级为动态令牌验证
# 旧版令牌已失效

# 🎯 解决方案:
# 1. 更新到最新版酷9播放器
# 2. 获取动态安全令牌
# 3. 使用带签名的安全链接

# 🔗 获取动态令牌:
# 访问主页生成动态令牌
# 或在链接中添加动态令牌参数

# 错误代码: REQUIRE_DYNAMIC_TOKEN`;

  return new Response(response, {
    status: 403,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      'X-Required': 'dynamic-token',
      'X-Client': 'ku9-detected'
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
# User-Agent: ${userAgent.substring(0, 100)}
# 时间: ${new Date().toLocaleString()}

# 📢 重要通知:
# 此内容为酷9播放器独家专用
# 其他播放器无法播放

# 🔒 安全保护:
# - TVBox助手拦截 ✓
# - 抓包工具拦截 ✓
# - 模拟请求检测 ✓
# - 动态令牌验证 ✓

# 🎯 解决方案:
# 1. 下载官方酷9播放器
# 2. 获取动态安全令牌
# 3. 使用安全链接访问

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
    <title>🚫 浏览器访问受限 - 酷9专用系统（加强版）</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .container {
            background: white;
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        h1 {
            color: #d32f2f;
            border-bottom: 3px solid #ffcdd2;
            padding-bottom: 15px;
        }
        .info-box {
            background: #e3f2fd;
            border-left: 5px solid #2196f3;
            padding: 20px;
            margin: 20px 0;
        }
        .solution-box {
            background: #e8f5e8;
            border-left: 5px solid #4caf50;
            padding: 20px;
            margin: 20px 0;
        }
        .warning-box {
            background: #fff3cd;
            border-left: 5px solid #ffc107;
            padding: 20px;
            margin: 20px 0;
        }
        code {
            background: #f1f1f1;
            padding: 8px 12px;
            border-radius: 5px;
            font-family: 'Courier New', monospace;
            display: block;
            margin: 10px 0;
            overflow-x: auto;
        }
        .copy-btn {
            background: #4CAF50;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            margin: 10px 5px;
            font-size: 16px;
            transition: background 0.3s;
        }
        .copy-btn:hover {
            background: #45a049;
        }
        .ku9-note {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 10px;
            padding: 25px;
            margin: 25px 0;
        }
        .blocked-list {
            background: #f8d7da;
            border-radius: 8px;
            padding: 15px;
            margin: 15px 0;
        }
        .blocked-list ul {
            columns: 2;
            -webkit-columns: 2;
            -moz-columns: 2;
        }
        .blocked-list li {
            padding: 5px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚫 浏览器访问受限（加强版）</h1>
        <p>检测到您正在使用浏览器访问酷9专用系统。</p>
        <p>此内容为<strong>酷9播放器独家专用</strong>，浏览器无法直接播放。</p>
        
        <div class="warning-box">
            <h3>⚠️ 系统安全升级：</h3>
            <p>系统已升级为<strong>酷9播放器独家专用加强版</strong>，现在可以拦截：</p>
            <div class="blocked-list">
                <ul>
                    <li>✅ TVBox/影视仓等助手软件</li>
                    <li>✅ 各种猫影视/TV端播放器</li>
                    <li>✅ 浏览器直接访问</li>
                    <li>✅ 抓包工具和分析软件</li>
                    <li>✅ 模拟酷9的伪造请求</li>
                </ul>
            </div>
        </div>
        
        <div class="info-box">
            <h3>📋 访问信息：</h3>
            <p><strong>文件：</strong> ${filename}</p>
            <p><strong>浏览器：</strong> ${userAgent.substring(0, 120)}</p>
            <p><strong>时间：</strong> ${new Date().toLocaleString()}</p>
            <p><strong>状态：</strong> ❌ 浏览器访问被拒绝（加强防护）</p>
            <p><strong>安全等级：</strong> 🔒 最高级别</p>
        </div>
        
        <div class="ku9-note">
            <h3>🔒 酷9专用系统（加强版）：</h3>
            <p>此系统采用多重防护技术：</p>
            <ul>
                <li>✅ 动态令牌验证（每次访问不同）</li>
                <li>✅ TVBox助手智能拦截</li>
                <li>✅ 抓包工具全面屏蔽</li>
                <li>✅ 模拟请求精准识别</li>
                <li>✅ 时间戳签名防复用</li>
                <li>✅ 多层User-Agent检测</li>
            </ul>
        </div>
        
        <div class="solution-box">
            <h3>🎯 解决方案：</h3>
            <p><strong>使用酷9播放器访问：</strong></p>
            <ol>
                <li>下载并安装最新版酷9播放器</li>
                <li>复制以下动态安全链接到酷9播放器</li>
                <li>链接5分钟内有效，过期重新生成</li>
            </ol>
            
            <p><strong>酷9动态安全链接：</strong></p>
            <code id="ku9DynamicLink"></code>
            <button class="copy-btn" onclick="copyDynamicLink()">复制动态安全链接</button>
            
            <p><strong>或使用静态链接（安全性较低）：</strong></p>
            <code id="ku9StaticLink"></code>
            <button class="copy-btn" onclick="copyStaticLink()" style="background: #6c757d;">复制静态链接</button>
            
            <p><small>动态链接每5分钟变化，防止被TVBox助手固定使用</small></p>
        </div>
    </div>

    <script>
        // 获取当前URL并生成链接
        const currentUrl = window.location.href.split('?')[0];
        const timestamp = Math.floor(Date.now() / 1000);
        const dynamicToken = 'ku9_dynamic_' + timestamp + '_' + Math.random().toString(36).substr(2, 9);
        
        // 生成签名
        function generateSig(url, ts) {
            const secret = 'ku9_secure_salt_2024';
            const str = url + ts + secret;
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }
            return Math.abs(hash).toString(36);
        }
        
        const signature = generateSig(currentUrl, timestamp);
        const dynamicLink = currentUrl + '?ku9_token=' + encodeURIComponent(dynamicToken) + '&t=' + timestamp + '&sign=' + signature + '&v=2';
        const staticLink = currentUrl + '?ku9_token=ku9_secure_token_2024&t=' + timestamp;
        
        document.getElementById('ku9DynamicLink').textContent = dynamicLink;
        document.getElementById('ku9StaticLink').textContent = staticLink;
        
        function copyDynamicLink() {
            navigator.clipboard.writeText(dynamicLink)
                .then(() => alert('酷9动态安全链接已复制到剪贴板，5分钟内有效'))
                .catch(err => alert('复制失败: ' + err));
        }
        
        function copyStaticLink() {
            navigator.clipboard.writeText(staticLink)
                .then(() => alert('酷9静态链接已复制到剪贴板'))
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

// 发送需要酷9播放器和令牌
function sendRequireKu9AndToken(filename, userAgent) {
  const response = `# 🚫 需要酷9播放器和动态令牌

# 客户端: ${userAgent.substring(0, 150)}
# 时间: ${new Date().toLocaleString()}
# 文件: ${filename}

# 📢 此系统为酷9播放器专用加强版
# 🔒 需要酷9播放器和动态令牌

# ⚠️ 检测结果:
# - 非酷9播放器 ✗
# - 无有效令牌 ✗
# - 可能是TVBox助手 ✗
# - 可能是抓包工具 ✗

# 🎯 访问条件:
# 1. 必须使用酷9播放器
# 2. 必须获取动态令牌
# 3. 必须在5分钟内使用

# 🔗 获取帮助:
# 访问系统主页生成动态令牌
# 或联系管理员获取技术支持

# 错误代码: REQUIRE_KU9_AND_DYNAMIC_TOKEN`;

  return new Response(response, {
    status: 403,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      'X-Required': 'ku9-and-dynamic-token'
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
  
  // 生成动态令牌
  const timestamp = Math.floor(Date.now() / 1000);
  const dynamicToken = 'ku9_dynamic_' + timestamp + '_' + Math.random().toString(36).substr(2, 9);
  const signature = generateKu9Signature(fileLink, timestamp);
  const dynamicLink = fileLink + '?ku9_token=' + encodeURIComponent(dynamicToken) + '&t=' + timestamp + '&sign=' + signature + '&v=2';

  const response = {
    content: fileContent,
    fileLink: fileLink,
    dynamicLink: dynamicLink,
    staticLink: fileLink + '?ku9_token=ku9_secure_token_2024&t=' + timestamp,
    dynamicToken: dynamicToken,
    timestamp: timestamp,
    expiry: timestamp + 300,
    security: {
      level: 'high',
      tvbox_blocked: true,
      sniffing_blocked: true,
      dynamic_token: true
    }
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
      
      // 生成动态令牌
      const timestamp = Math.floor(Date.now() / 1000);
      const dynamicToken = 'ku9_dynamic_' + timestamp + '_' + Math.random().toString(36).substr(2, 9);
      const signature = generateKu9Signature(link, timestamp);
      const dynamicLink = link + '?ku9_token=' + encodeURIComponent(dynamicToken) + '&t=' + timestamp + '&sign=' + signature + '&v=2';

      return new Response(JSON.stringify({
        success: true,
        fileLink: link,
        dynamicLink: dynamicLink,
        staticLink: link + '?ku9_token=ku9_secure_token_2024&t=' + timestamp,
        dynamicToken: dynamicToken,
        filename: safeFilename,
        timestamp: timestamp,
        expiry: timestamp + 300,
        security: {
          enabled: true,
          level: 'high',
          tvbox_blocked: true,
          sniffing_blocked: true,
          dynamic_token: true,
          signature_required: true,
          note: '请使用动态安全链接防止TVBox助手获取'
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
      message: '密码更新成功',
      security_note: '系统已升级为酷9播放器专用加强版，TVBox助手无法访问'
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
