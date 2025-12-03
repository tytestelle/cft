// Cloudflare Pages Functions - 酷9播放器专用系统（简化版）
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

    // API: 酷9播放器测试
    if (pathname === '/ku9_test.php' && request.method === 'GET') {
      return await handleKu9Test(request);
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
    </style>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>🔒酷9播放器专用系统</title>
</head>

<body>
    <h2>🔐 酷9播放器专用系统</h2>
    
    <div class="ku9-simple">
        <h3>✅ 酷9播放器专享：</h3>
        <p>1. <strong>专用令牌验证</strong> - 使用专属令牌访问</p>
        <p>2. <strong>宽松识别策略</strong> - 确保酷9能正常播放</p>
        <p>3. <strong>其他软件拦截</strong> - 阻止非酷9播放器</p>
        <p>4. <strong>抓包工具屏蔽</strong> - 保护链接安全</p>
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
        <p>2. 如果是抓包工具，直接拒绝</p>
        <p>3. 如果有正确令牌，允许访问</p>
        <p>4. 如果没有令牌，检查User-Agent</p>
        <p>5. 如果是酷9播放器，允许访问</p>
        <p>6. 否则拒绝访问</p>
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

// 管理页面处理
async function handleManagementPage(request, env) {
  return new Response('管理页面（简化版）', {
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
  
  let result = {
    status: '测试开始',
    userAgent: userAgent.substring(0, 100),
    isKu9: false,
    isSniffingTool: false,
    isOtherPlayer: false,
    isBrowser: false,
    recommendations: []
  };
  
  // 1. 检查是否是抓包工具
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
  
  // 2. 检查是否是酷9播放器（宽松检测）
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
  
  // 3. 检查是否是其他播放器
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
  
  // 4. 检查是否是浏览器
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
  
  // 5. 如果没有检测到任何特征
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

// 安全文件下载处理 - 简化版
async function handleSecureFileDownload(filename, request, env) {
  try {
    // 解码文件名
    const decodedFilename = decodeURIComponent(filename);
    const safeFilename = sanitizeFilename(decodedFilename);
    const content = await env.MY_TEXT_STORAGE.get('file_' + safeFilename);
    
    if (!content) {
      return sendFileNotFound(safeFilename);
    }

    // 1. 检查管理令牌（如果有）
    const url = new URL(request.url);
    const managementToken = url.searchParams.get('manage_token');
    const expectedManagementToken = await env.MY_TEXT_STORAGE.get('management_token') || 'default_manage_token_2024';
    
    if (managementToken && managementToken === expectedManagementToken) {
      return sendOriginalContent(safeFilename, content, 'management');
    }

    // 2. 检查酷9令牌
    const ku9Token = url.searchParams.get('ku9_token');
    const userAgent = request.headers.get('User-Agent') || '';
    const lowerUA = userAgent.toLowerCase();
    
    // 3. 检查是否是抓包工具（优先检测）
    if (isSniffingTool(userAgent)) {
      return sendSniffingToolBlock(safeFilename, userAgent);
    }
    
    // 4. 如果有酷9令牌且正确，允许访问
    if (ku9Token && ku9Token === 'ku9_secure_token_2024') {
      return sendOriginalContent(safeFilename, content, 'ku9-token');
    }
    
    // 5. 如果没有令牌，检查User-Agent是否是酷9播放器
    const isKu9UA = isKu9UserAgent(userAgent);
    if (isKu9UA) {
      return sendOriginalContent(safeFilename, content, 'ku9-ua');
    }
    
    // 6. 检查是否是其他播放器
    const playerName = detectPlayer(userAgent);
    if (playerName !== 'unknown') {
      return sendOtherPlayerBlock(safeFilename, playerName, userAgent);
    }
    
    // 7. 检查是否是浏览器
    if (isBrowser(userAgent)) {
      return sendBrowserBlock(safeFilename, userAgent);
    }
    
    // 8. 其他情况，要求使用令牌
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
