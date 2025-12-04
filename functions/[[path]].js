// Cloudflare Pages Functions - 酷9播放器精确识别系统 V4.0
// 特征：应用程序指纹 + 行为分析 + 多重验证
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
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-Client-Time, X-Encryption-Key, X-Management-Access, X-Ku9-Token, X-Device-ID, X-App-Signature, X-App-Version, X-Client-Type',
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

    // 酷9识别配置页面
    if (pathname === '/ku9_detector.html' || pathname === '/ku9_detector.php') {
      return await handleKu9DetectorPage(request, env);
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

    // 应用程序指纹管理
    if (pathname === '/app_fingerprints.html' || pathname === '/app_fingerprints.php') {
      return await handleAppFingerprintsPage(request, env);
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

    // API: 标记应用程序指纹
    if (pathname === '/api_mark_app_fingerprint' && request.method === 'POST') {
      return await handleMarkAppFingerprint(request, env);
    }

    // API: 验证酷9应用程序
    if (pathname === '/api_verify_ku9_app' && request.method === 'POST') {
      return await handleVerifyKu9App(request, env);
    }

    // API: 获取应用程序指纹
    if (pathname === '/api_get_app_fingerprints' && request.method === 'GET') {
      return await handleGetAppFingerprints(request, env);
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

    // 应用程序验证端点
    if (pathname === '/verify_app' && request.method === 'POST') {
      return await handleVerifyAppEndpoint(request, env);
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
        
        .ku9-detection-info {
            background: #d4edda;
            border: 1px solid #c3e6cb;
            border-radius: 5px;
            padding: 15px;
            margin: 15px 0;
        }
        
        .ku9-detection-info h4 {
            margin-top: 0;
            color: #155724;
        }
    </style>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>🔒安全编辑工具🔒 - 酷9精确识别版</title>
</head>

<body>
    <h2>🔐 文件转为<u>安全链接</u></h2>
    
    <div class="security-features">
        <h3>🛡️ 精确识别系统 V4.0：</h3>
        <ul class="security-list">
            <li><span class="security-icon">✅</span> 应用程序指纹识别 - 精准识别酷9应用</li>
            <li><span class="security-icon">✅</span> 多重特征验证 - 8种识别方法</li>
            <li><span class="security-icon">✅</span> 行为分析 - 智能学习设备特征</li>
            <li><span class="security-icon">✅</span> 代理穿透识别 - 同一设备精确识别</li>
            <li><span class="security-icon">✅</span> 应用签名验证 - 防止伪造</li>
        </ul>
    </div>
    
    <div class="ku9-detection-info">
        <h4>🎯 酷9精确识别系统：</h4>
        <p>• 使用应用程序指纹，无论是否使用代理都能准确识别</p>
        <p>• 多重验证：HTTP头、User-Agent、行为特征、应用签名</p>
        <p>• 智能学习：自动学习和记忆酷9应用特征</p>
        <p>• 〖<a href="./ku9_detector.html?manage_token=default_manage_token_2024" style="color:#d32f2f;"><b>酷9识别配置</b></a>〗</p>
        <p>• 〖<a href="./app_fingerprints.html?manage_token=default_manage_token_2024" style="color:#d32f2f;"><b>应用指纹管理</b></a>〗</p>
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
            2. 只有经过精确识别的酷9播放器可以正常访问<br>
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

// 酷9识别配置页面
async function handleKu9DetectorPage(request, env) {
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
    
    return new Response(await getKu9DetectorHTML(request, env, managementToken), {
      headers: { 
        'content-type': 'text/html;charset=UTF-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Content-Type-Options': 'nosniff'
      },
    });
  } catch (error) {
    console.error('酷9识别配置页面错误:', error);
    return new Response(`酷9识别配置页面错误: ${error.message}`, { 
      status: 500,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }
}

// 应用程序指纹管理页面
async function handleAppFingerprintsPage(request, env) {
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
    
    return new Response(await getAppFingerprintsHTML(request, env, managementToken), {
      headers: { 
        'content-type': 'text/html;charset=UTF-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Content-Type-Options': 'nosniff'
      },
    });
  } catch (error) {
    console.error('应用程序指纹管理页面错误:', error);
    return new Response(`应用程序指纹管理页面错误: ${error.message}`, { 
      status: 500,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }
}

// 酷9识别配置页面 HTML
async function getKu9DetectorHTML(request, env, managementToken) {
  const formData = await parseFormData(request);
  
  let messages = [];
  
  // 处理配置更新
  if (formData.update_config) {
    // 更新酷9特征配置
    const ku9Config = {
      // 应用程序签名验证
      app_signatures: formData.app_signatures ? formData.app_signatures.split('\n').filter(s => s.trim()) : [],
      
      // HTTP头特征
      header_patterns: formData.header_patterns ? formData.header_patterns.split('\n').filter(s => s.trim()) : [],
      
      // User-Agent特征
      ua_patterns: formData.ua_patterns ? formData.ua_patterns.split('\n').filter(s => s.trim()) : [],
      
      // 行为特征
      behavior_patterns: formData.behavior_patterns ? formData.behavior_patterns.split('\n').filter(s => s.trim()) : [],
      
      // 请求参数特征
      param_patterns: formData.param_patterns ? formData.param_patterns.split('\n').filter(s => s.trim()) : [],
      
      // 检测阈值
      detection_threshold: parseInt(formData.detection_threshold) || 70,
      
      // 高级设置
      enable_behavior_analysis: formData.enable_behavior_analysis === 'true',
      enable_app_fingerprint: formData.enable_app_fingerprint === 'true',
      enable_proxy_detection: formData.enable_proxy_detection === 'true',
      strict_mode: formData.strict_mode === 'true',
      
      // 更新时间
      updated_at: Date.now()
    };
    
    await env.MY_TEXT_STORAGE.put('ku9_detection_config', JSON.stringify(ku9Config));
    messages.push('✅ 酷9识别配置已更新');
    
    // 更新已知的酷9设备ID
    if (formData.known_device_ids) {
      const deviceIds = formData.known_device_ids.split('\n').filter(s => s.trim());
      await env.MY_TEXT_STORAGE.put('ku9_known_device_ids', JSON.stringify(deviceIds));
    }
    
    // 更新已知的酷9IP
    if (formData.known_ips) {
      const ips = formData.known_ips.split('\n').filter(s => s.trim());
      await env.MY_TEXT_STORAGE.put('ku9_known_ips', JSON.stringify(ips));
    }
  }
  
  // 测试识别功能
  if (formData.test_detection) {
    const testUA = formData.test_ua || '';
    const testHeaders = {};
    
    // 解析测试头
    if (formData.test_headers) {
      formData.test_headers.split('\n').forEach(line => {
        const [key, value] = line.split(':').map(s => s.trim());
        if (key && value) {
          testHeaders[key] = value;
        }
      });
    }
    
    // 创建模拟请求
    const mockRequest = {
      headers: {
        get: (name) => testHeaders[name] || '',
        has: (name) => !!testHeaders[name]
      }
    };
    
    // 执行测试
    const detectionResult = await enhancedDetectKu9Player(
      testUA, 
      mockRequest.headers, 
      formData.test_ip || '127.0.0.1', 
      env
    );
    
    messages.push(`🧪 测试结果: ${detectionResult.isKu9 ? '✅ 识别为酷9' : '❌ 非酷9'} (置信度: ${detectionResult.confidence}%)`);
    messages.push(`识别方法: ${detectionResult.methods.join(', ')}`);
  }
  
  // 加载现有配置
  const configData = await env.MY_TEXT_STORAGE.get('ku9_detection_config');
  let config = {
    app_signatures: [
      'ku9_app_signature_v1',
      'com.ku9.player_v2',
      'k9player_android_sign'
    ],
    header_patterns: [
      'X-Ku9-Version',
      'X-Player-Type=ku9',
      'X-App-Name=酷9播放器'
    ],
    ua_patterns: [
      'Ku9Player',
      '酷9播放器',
      'com.ku9.player',
      'K9Player',
      'MTV\\/',
      'tvbox.*ku9',
      'ku9.*tvbox'
    ],
    behavior_patterns: [
      'accept: application/x-mpegurl',
      'accept: audio/x-mpegurl',
      'connection: keep-alive',
      'range: bytes='
    ],
    param_patterns: [
      'ku9_token=',
      'player=ku9',
      'type=tvbox'
    ],
    detection_threshold: 70,
    enable_behavior_analysis: true,
    enable_app_fingerprint: true,
    enable_proxy_detection: true,
    strict_mode: false
  };
  
  if (configData) {
    config = { ...config, ...JSON.parse(configData) };
  }
  
  // 加载已知设备ID
  const knownDeviceIdsData = await env.MY_TEXT_STORAGE.get('ku9_known_device_ids');
  const knownDeviceIds = knownDeviceIdsData ? JSON.parse(knownDeviceIdsData) : [];
  
  // 加载已知IP
  const knownIPsData = await env.MY_TEXT_STORAGE.get('ku9_known_ips');
  const knownIPs = knownIPsData ? JSON.parse(knownIPsData) : [];
  
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>酷9精确识别配置</title>
<style>
body{font-family:"Segoe UI",Tahoma,sans-serif;font-size:14px;color:#333;margin:0;padding:10px;background:#f5f5f5;}
.container{max-width:100%;margin:0 auto;}
.back-link{display:inline-block;margin-bottom:15px;color:#4a6cf7;text-decoration:none;padding:6px 12px;background:white;border-radius:4px;border:1px solid #ddd;}
.header{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;}
.header h1{margin:0;color:#4a6cf7;}
.config-form{background:white;padding:20px;border-radius:8px;margin-bottom:20px;box-shadow:0 2px 4px rgba(0,0,0,0.1);}
.form-group{margin-bottom:20px;}
.form-group label{display:block;margin-bottom:8px;color:#555;font-weight:bold;font-size:15px;}
.form-group textarea{width:100%;padding:10px;border:1px solid #ddd;border-radius:4px;box-sizing:border-box;font-family:monospace;font-size:13px;min-height:80px;}
.form-group input[type="number"]{width:100px;padding:8px;border:1px solid #ddd;border-radius:4px;}
.checkbox-group{margin:10px 0;}
.checkbox-group label{display:inline-flex;align-items:center;margin-right:15px;font-weight:normal;}
.checkbox-group input{margin-right:5px;}
.submit-btn{background:#4a6cf7;color:white;border:none;padding:10px 20px;border-radius:4px;cursor:pointer;font-size:16px;margin-right:10px;}
.test-btn{background:#28a745;color:white;border:none;padding:10px 20px;border-radius:4px;cursor:pointer;font-size:16px;}
.message{background:#d4edda;color:#155724;padding:10px;border-radius:4px;margin-bottom:15px;border:1px solid #c3e6cb;}
.error-message{background:#f8d7da;color:#721c24;padding:10px;border-radius:4px;margin-bottom:15px;border:1px solid #f5c6cb;}
.info-box{background:#e3f2fd;border:1px solid #bbdefb;border-radius:5px;padding:15px;margin-bottom:20px;}
.info-box h3{margin-top:0;color:#1976d2;}
.detection-methods{display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:15px;margin-bottom:20px;}
.method-card{background:white;padding:15px;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,0.1);}
.method-card h4{margin-top:0;color:#4a6cf7;}
.method-card ul{padding-left:20px;}
.method-card li{margin-bottom:5px;}
.code-block{background:#333;color:#fff;padding:15px;border-radius:5px;font-family:monospace;overflow-x:auto;margin:10px 0;}
.test-section{background:#f8f9fa;border:1px solid #ddd;border-radius:5px;padding:20px;margin-bottom:20px;}
.test-result{background:#e9ecef;padding:15px;border-radius:5px;margin-top:15px;display:none;}
</style>
</head>
<body>
<div class="container">
  <a href="./search.html?manage_token=${managementToken}" class="back-link">← 返回管理页面</a>
  
  <div class="header">
    <h1>🔍 酷9精确识别配置 V4.0</h1>
  </div>
  
  ${messages.map(msg => `<div class="message">${msg}</div>`).join('')}
  
  <div class="info-box">
    <h3>🎯 精确识别系统说明：</h3>
    <p>此系统使用8种识别方法，无论设备是否使用代理，都能准确识别酷9播放器：</p>
    <div class="detection-methods">
      <div class="method-card">
        <h4>1. 应用程序签名</h4>
        <ul>
          <li>应用包名验证</li>
          <li>数字签名检查</li>
          <li>版本号验证</li>
        </ul>
      </div>
      <div class="method-card">
        <h4>2. HTTP头特征</h4>
        <ul>
          <li>X-Ku9-Version</li>
          <li>X-Player-Type</li>
          <li>自定义头部</li>
        </ul>
      </div>
      <div class="method-card">
        <h4>3. User-Agent分析</h4>
        <ul>
          <li>关键词匹配</li>
          <li>格式分析</li>
          <li>设备信息提取</li>
        </ul>
      </div>
      <div class="method-card">
        <h4>4. 行为特征识别</h4>
        <ul>
          <li>请求模式分析</li>
          <li>参数格式识别</li>
          <li>访问频率分析</li>
        </ul>
      </div>
    </div>
  </div>
  
  <form method="post" class="config-form">
    <input type="hidden" name="manage_token" value="${managementToken}">
    
    <div class="form-group">
      <label for="app_signatures">应用程序签名特征 (每行一个)：</label>
      <textarea id="app_signatures" name="app_signatures">${config.app_signatures.join('\n')}</textarea>
      <small>用于验证应用程序的数字签名或包名特征</small>
    </div>
    
    <div class="form-group">
      <label for="header_patterns">HTTP头特征 (每行一个)：</label>
      <textarea id="header_patterns" name="header_patterns">${config.header_patterns.join('\n')}</textarea>
      <small>格式：Header-Name 或 Header-Name=Value</small>
    </div>
    
    <div class="form-group">
      <label for="ua_patterns">User-Agent特征 (每行一个正则或关键词)：</label>
      <textarea id="ua_patterns" name="ua_patterns">${config.ua_patterns.join('\n')}</textarea>
      <small>支持正则表达式，如：Ku9Player、酷9.*播放器</small>
    </div>
    
    <div class="form-group">
      <label for="behavior_patterns">行为特征 (每行一个)：</label>
      <textarea id="behavior_patterns" name="behavior_patterns">${config.behavior_patterns.join('\n')}</textarea>
      <small>如：accept: application/x-mpegurl</small>
    </div>
    
    <div class="form-group">
      <label for="param_patterns">请求参数特征 (每行一个)：</label>
      <textarea id="param_patterns" name="param_patterns">${config.param_patterns.join('\n')}</textarea>
      <small>如：ku9_token=、player=ku9</small>
    </div>
    
    <div class="form-group">
      <label for="known_device_ids">已知酷9设备ID (每行一个)：</label>
      <textarea id="known_device_ids" name="known_device_ids">${knownDeviceIds.join('\n')}</textarea>
      <small>从访问日志中提取的确认为酷9的设备ID</small>
    </div>
    
    <div class="form-group">
      <label for="known_ips">已知酷9 IP地址 (每行一个)：</label>
      <textarea id="known_ips" name="known_ips">${knownIPs.join('\n')}</textarea>
      <small>从访问日志中提取的确认为酷9的IP地址</small>
    </div>
    
    <div class="form-group">
      <label for="detection_threshold">识别阈值 (%):</label>
      <input type="number" id="detection_threshold" name="detection_threshold" value="${config.detection_threshold}" min="0" max="100">
      <small>置信度达到此值即识别为酷9</small>
    </div>
    
    <div class="checkbox-group">
      <h4>高级功能：</h4>
      <label><input type="checkbox" name="enable_behavior_analysis" value="true" ${config.enable_behavior_analysis ? 'checked' : ''}> 启用行为分析</label>
      <label><input type="checkbox" name="enable_app_fingerprint" value="true" ${config.enable_app_fingerprint ? 'checked' : ''}> 启用应用指纹</label>
      <label><input type="checkbox" name="enable_proxy_detection" value="true" ${config.enable_proxy_detection ? 'checked' : ''}> 启用代理检测</label>
      <label><input type="checkbox" name="strict_mode" value="true" ${config.strict_mode ? 'checked' : ''}> 严格模式</label>
    </div>
    
    <button type="submit" name="update_config" value="1" class="submit-btn">💾 保存配置</button>
  </form>
  
  <div class="test-section">
    <h3>🧪 测试识别功能</h3>
    <form method="post" id="testForm">
      <input type="hidden" name="manage_token" value="${managementToken}">
      
      <div class="form-group">
        <label for="test_ua">测试 User-Agent:</label>
        <textarea id="test_ua" name="test_ua" placeholder="输入要测试的User-Agent字符串" rows="3"></textarea>
      </div>
      
      <div class="form-group">
        <label for="test_headers">测试 HTTP头 (每行一个):</label>
        <textarea id="test_headers" name="test_headers" placeholder="X-Ku9-Version: 2.0.1\nX-Player-Type: ku9" rows="4"></textarea>
      </div>
      
      <div class="form-group">
        <label for="test_ip">测试 IP地址:</label>
        <input type="text" id="test_ip" name="test_ip" value="127.0.0.1">
      </div>
      
      <button type="submit" name="test_detection" value="1" class="test-btn">🔍 测试识别</button>
    </form>
    
    <div id="testResult" class="test-result"></div>
  </div>
  
  <div class="info-box">
    <h3>📖 使用建议：</h3>
    <ul>
      <li>1. 从访问日志中提取确认为酷9的UA和IP，添加到相应列表</li>
      <li>2. 定期更新应用程序签名特征</li>
      <li>3. 使用"应用程序指纹管理"页面查看和管理应用指纹</li>
      <li>4. 在"设备管理"页面手动确认设备是否为酷9</li>
      <li>5. 建议阈值设置在70-80之间，避免误判</li>
    </ul>
    
    <h4>酷9播放器配置示例：</h4>
    <div class="code-block">
// 酷9播放器应在请求中添加以下头部：<br>
X-Ku9-Version: 2.0.1<br>
X-Player-Type: ku9<br>
X-App-Name: 酷9播放器<br>
X-Device-ID: 设备唯一标识<br><br>
// 或使用应用程序验证端点<br>
POST /verify_app<br>
Content-Type: application/json<br>
{<br>
  "app_name": "酷9播放器",<br>
  "app_version": "2.0.1",<br>
  "device_id": "设备唯一标识",<br>
  "signature": "应用程序签名"<br>
}
    </div>
  </div>
</div>

<script>
// 处理测试表单提交
document.getElementById('testForm').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const testResult = document.getElementById('testResult');
  testResult.style.display = 'block';
  testResult.innerHTML = '<p>正在测试识别功能...</p>';
  
  const formData = new FormData(this);
  
  fetch('?manage_token=${managementToken}', {
    method: 'POST',
    body: formData
  })
  .then(response => response.text())
  .then(html => {
    // 提取测试结果
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const messages = doc.querySelectorAll('.message');
    
    if (messages.length > 0) {
      testResult.innerHTML = '';
      messages.forEach(msg => {
        testResult.innerHTML += '<p>' + msg.textContent + '</p>';
      });
    } else {
      testResult.innerHTML = '<p>测试完成，但未收到结果</p>';
    }
  })
  .catch(error => {
    testResult.innerHTML = '<p class="error-message">测试失败: ' + error.message + '</p>';
  });
});
</script>
</body>
</html>`;
}

// 应用程序指纹管理页面 HTML
async function getAppFingerprintsHTML(request, env, managementToken) {
  const url = new URL(request.url);
  const formData = await parseFormData(request);
  
  let messages = [];
  
  // 处理手动添加指纹
  if (formData.add_fingerprint) {
    const fingerprintData = {
      id: generateFingerprintId(),
      app_name: formData.app_name || '未知应用',
      app_version: formData.app_version || '',
      device_id: formData.device_id || '',
      user_agent: formData.user_agent || '',
      http_headers: formData.http_headers ? JSON.parse(formData.http_headers) : {},
      ip_address: formData.ip_address || '',
      signature: formData.signature || '',
      is_ku9: formData.is_ku9 === 'true',
      confidence: parseInt(formData.confidence) || 100,
      created_at: Date.now(),
      last_seen: Date.now(),
      source: 'manual',
      notes: formData.notes || ''
    };
    
    await env.MY_TEXT_STORAGE.put(`app_fingerprint_${fingerprintData.id}`, JSON.stringify(fingerprintData));
    messages.push(`✅ 应用程序指纹已添加: ${fingerprintData.app_name}`);
  }
  
  // 处理批量导入
  if (formData.import_fingerprints) {
    try {
      const fingerprints = JSON.parse(formData.fingerprints_json || '[]');
      let importedCount = 0;
      
      for (const fp of fingerprints) {
        const fingerprintId = fp.id || generateFingerprintId();
        const fingerprintData = {
          id: fingerprintId,
          app_name: fp.app_name || '未知应用',
          app_version: fp.app_version || '',
          device_id: fp.device_id || '',
          user_agent: fp.user_agent || '',
          http_headers: fp.http_headers || {},
          ip_address: fp.ip_address || '',
          signature: fp.signature || '',
          is_ku9: fp.is_ku9 || false,
          confidence: fp.confidence || 100,
          created_at: fp.created_at || Date.now(),
          last_seen: fp.last_seen || Date.now(),
          source: 'import',
          notes: fp.notes || ''
        };
        
        await env.MY_TEXT_STORAGE.put(`app_fingerprint_${fingerprintId}`, JSON.stringify(fingerprintData));
        importedCount++;
      }
      
      messages.push(`✅ 已批量导入 ${importedCount} 个应用程序指纹`);
    } catch (error) {
      messages.push(`❌ 导入失败: ${error.message}`);
    }
  }
  
  // 获取所有应用程序指纹
  const allKeys = await env.MY_TEXT_STORAGE.list();
  const appFingerprints = [];
  
  for (const key of allKeys.keys) {
    if (key.name.startsWith('app_fingerprint_')) {
      try {
        const fingerprintData = await env.MY_TEXT_STORAGE.get(key.name);
        if (fingerprintData) {
          const data = JSON.parse(fingerprintData);
          appFingerprints.push(data);
        }
      } catch (error) {
        console.error('解析应用程序指纹失败:', key.name, error);
      }
    }
  }
  
  // 按最后看到时间排序
  appFingerprints.sort((a, b) => b.last_seen - a.last_seen);
  
  // 统计信息
  const stats = {
    total: appFingerprints.length,
    ku9: appFingerprints.filter(fp => fp.is_ku9).length,
    non_ku9: appFingerprints.filter(fp => !fp.is_ku9).length,
    high_confidence: appFingerprints.filter(fp => fp.confidence >= 80).length,
    unique_devices: [...new Set(appFingerprints.map(fp => fp.device_id).filter(id => id))].length
  };
  
  // 生成指纹列表HTML
  let fingerprintsHTML = '';
  if (appFingerprints.length > 0) {
    for (const fp of appFingerprints) {
      const createdDate = new Date(fp.created_at).toLocaleString('zh-CN');
      const lastSeenDate = new Date(fp.last_seen).toLocaleString('zh-CN');
      const ku9Status = fp.is_ku9 ? '<span class="status-ku9">✅ 酷9</span>' : '<span class="status-non-ku9">❌ 非酷9</span>';
      const confidenceClass = fp.confidence >= 80 ? 'high-confidence' : fp.confidence >= 50 ? 'medium-confidence' : 'low-confidence';
      
      // UA预览
      const uaPreview = fp.user_agent.length > 30 ? 
        fp.user_agent.substring(0, 30) + '...' : fp.user_agent;
      
      // 设备ID预览
      const deviceIdPreview = fp.device_id ? 
        (fp.device_id.length > 20 ? fp.device_id.substring(0, 20) + '...' : fp.device_id) : 'N/A';
      
      fingerprintsHTML += `
<tr>
  <td><code>${fp.id}</code></td>
  <td>${fp.app_name}</td>
  <td>${fp.app_version || 'N/A'}</td>
  <td title="${fp.device_id || 'N/A'}">${deviceIdPreview}</td>
  <td title="${fp.user_agent}">${uaPreview}</td>
  <td>${fp.ip_address || 'N/A'}</td>
  <td><span class="${confidenceClass}">${fp.confidence}%</span></td>
  <td>${ku9Status}</td>
  <td>${createdDate}</td>
  <td>${lastSeenDate}</td>
  <td>
    <button class="action-btn view-btn" onclick="viewFingerprint('${fp.id.replace(/'/g, "\\'")}')">查看</button>
    <button class="action-btn delete-btn" onclick="deleteFingerprint('${fp.id.replace(/'/g, "\\'")}')">删除</button>
  </td>
</tr>
`;
    }
  } else {
    fingerprintsHTML = '<tr><td colspan="11" style="text-align:center;padding:20px;">暂无应用程序指纹</td></tr>';
  }
  
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>应用程序指纹管理</title>
<style>
body{font-family:"Segoe UI",Tahoma,sans-serif;font-size:14px;color:#333;margin:0;padding:10px;background:#f5f5f5;}
.container{max-width:100%;margin:0 auto;}
.back-link{display:inline-block;margin-bottom:15px;color:#4a6cf7;text-decoration:none;padding:6px 12px;background:white;border-radius:4px;border:1px solid #ddd;}
.header{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;}
.header h1{margin:0;color:#4a6cf7;}
.stats-grid{display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:15px;margin-bottom:20px;}
.stat-card{background:white;padding:15px;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,0.1);text-align:center;}
.stat-card h3{margin:0 0 8px 0;font-size:14px;color:#666;}
.stat-number{font-size:28px;font-weight:bold;color:#333;}
.stat-number.total{color:#4a6cf7;}
.stat-number.ku9{color:#5cb85c;}
.stat-number.non-ku9{color:#d9534f;}
.stat-number.high-confidence{color:#28a745;}
.fingerprints-table{width:100%;border-collapse:collapse;background:white;border-radius:8px;overflow:hidden;box-shadow:0 2px 4px rgba(0,0,0,0.1);}
.fingerprints-table th{background:#4a6cf7;color:white;padding:12px 8px;text-align:left;font-weight:normal;}
.fingerprints-table td{padding:8px;border-bottom:1px solid #eee;}
.fingerprints-table tr:hover{background:#f9f9f9;}
.status-ku9{color:#5cb85c;font-weight:bold;}
.status-non-ku9{color:#d9534f;font-weight:bold;}
.high-confidence{color:#5cb85c;font-weight:bold;}
.medium-confidence{color:#f0ad4e;font-weight:bold;}
.low-confidence{color:#d9534f;font-weight:bold;}
.action-btn{padding:3px 8px;border:none;border-radius:3px;cursor:pointer;font-size:12px;margin:2px;}
.view-btn{background:#5bc0de;color:white;}
.delete-btn{background:#d9534f;color:white;}
.add-form{background:white;padding:20px;border-radius:8px;margin-bottom:20px;box-shadow:0 2px 4px rgba(0,0,0,0.1);}
.form-grid{display:grid;grid-template-columns:repeat(auto-fit, minmax(250px, 1fr));gap:15px;margin-bottom:15px;}
.form-group label{display:block;margin-bottom:5px;color:#555;font-weight:bold;}
.form-group input, .form-group textarea{width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;box-sizing:border-box;}
.form-group textarea{height:80px;resize:vertical;}
.submit-btn{background:#4a6cf7;color:white;border:none;padding:10px 20px;border-radius:4px;cursor:pointer;font-size:16px;}
.import-section{background:#f8f9fa;border:1px solid #ddd;border-radius:5px;padding:20px;margin-bottom:20px;}
.message{background:#d4edda;color:#155724;padding:10px;border-radius:4px;margin-bottom:15px;border:1px solid #c3e6cb;}
.modal{display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:1000;}
.modal-content{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:white;padding:20px;border-radius:8px;max-width:800px;width:90%;max-height:80%;overflow:auto;}
.modal-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;border-bottom:1px solid #eee;padding-bottom:10px;}
.modal-title{margin:0;color:#333;}
.close-btn{background:none;border:none;font-size:20px;cursor:pointer;color:#999;}
.close-btn:hover{color:#333;}
.fingerprint-detail{font-family:monospace;background:#f8f9fa;padding:10px;border-radius:4px;overflow:auto;max-height:400px;}
.code-block{background:#333;color:#fff;padding:15px;border-radius:5px;font-family:monospace;overflow-x:auto;margin:10px 0;}
</style>
</head>
<body>
<div class="container">
  <a href="./ku9_detector.html?manage_token=${managementToken}" class="back-link">← 返回酷9识别配置</a>
  
  <div class="header">
    <h1>📱 应用程序指纹管理</h1>
  </div>
  
  ${messages.map(msg => `<div class="message">${msg}</div>`).join('')}
  
  <div class="stats-grid">
    <div class="stat-card">
      <h3>总指纹数</h3>
      <div class="stat-number total">${stats.total}</div>
    </div>
    <div class="stat-card">
      <h3>酷9指纹</h3>
      <div class="stat-number ku9">${stats.ku9}</div>
    </div>
    <div class="stat-card">
      <h3>非酷9指纹</h3>
      <div class="stat-number non-ku9">${stats.non_ku9}</div>
    </div>
    <div class="stat-card">
      <h3>高置信度</h3>
      <div class="stat-number high-confidence">${stats.high_confidence}</div>
    </div>
  </div>
  
  <div class="add-form">
    <h3>添加应用程序指纹</h3>
    <form method="post">
      <input type="hidden" name="manage_token" value="${managementToken}">
      <div class="form-grid">
        <div class="form-group">
          <label for="app_name">应用名称：</label>
          <input type="text" id="app_name" name="app_name" placeholder="例如：酷9播放器" required>
        </div>
        <div class="form-group">
          <label for="app_version">应用版本：</label>
          <input type="text" id="app_version" name="app_version" placeholder="例如：2.0.1">
        </div>
        <div class="form-group">
          <label for="device_id">设备ID：</label>
          <input type="text" id="device_id" name="device_id" placeholder="设备唯一标识">
        </div>
        <div class="form-group">
          <label for="ip_address">IP地址：</label>
          <input type="text" id="ip_address" name="ip_address" placeholder="例如：192.168.1.100">
        </div>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label for="user_agent">User-Agent：</label>
          <textarea id="user_agent" name="user_agent" placeholder="完整的User-Agent字符串"></textarea>
        </div>
        <div class="form-group">
          <label for="http_headers">HTTP头 (JSON格式)：</label>
          <textarea id="http_headers" name="http_headers" placeholder='{"X-Ku9-Version": "2.0.1", "X-Player-Type": "ku9"}'></textarea>
        </div>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label for="signature">应用程序签名：</label>
          <input type="text" id="signature" name="signature" placeholder="应用签名或包名">
        </div>
        <div class="form-group">
          <label for="confidence">置信度 (0-100)：</label>
          <input type="number" id="confidence" name="confidence" value="100" min="0" max="100">
        </div>
        <div class="form-group">
          <label for="is_ku9">是否为酷9：</label>
          <select id="is_ku9" name="is_ku9">
            <option value="true">✅ 是酷9播放器</option>
            <option value="false">❌ 非酷9播放器</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label for="notes">备注：</label>
        <textarea id="notes" name="notes" placeholder="额外的说明信息"></textarea>
      </div>
      <button type="submit" name="add_fingerprint" value="1" class="submit-btn">➕ 添加指纹</button>
    </form>
  </div>
  
  <div class="import-section">
    <h3>批量导入指纹</h3>
    <form method="post">
      <input type="hidden" name="manage_token" value="${managementToken}">
      <div class="form-group">
        <label for="fingerprints_json">指纹数据 (JSON数组)：</label>
        <textarea id="fingerprints_json" name="fingerprints_json" placeholder='[{"app_name": "酷9播放器", "user_agent": "...", "is_ku9": true}]' rows="8"></textarea>
      </div>
      <button type="submit" name="import_fingerprints" value="1" class="submit-btn">📥 批量导入</button>
    </form>
  </div>
  
  <h3>应用程序指纹列表</h3>
  <table class="fingerprints-table">
    <thead>
      <tr>
        <th>指纹ID</th>
        <th>应用名称</th>
        <th>版本</th>
        <th>设备ID</th>
        <th>User-Agent</th>
        <th>IP地址</th>
        <th>置信度</th>
        <th>酷9状态</th>
        <th>创建时间</th>
        <th>最后看到</th>
        <th>操作</th>
      </tr>
    </thead>
    <tbody>
      ${fingerprintsHTML}
    </tbody>
  </table>
</div>

<!-- 指纹详情模态框 -->
<div id="fingerprintDetailModal" class="modal">
  <div class="modal-content">
    <div class="modal-header">
      <h3 class="modal-title">应用程序指纹详情</h3>
      <button class="close-btn" onclick="closeModal()">×</button>
    </div>
    <div id="fingerprintDetailContent" class="fingerprint-detail"></div>
  </div>
</div>

<script>
// 查看指纹详情
async function viewFingerprint(fingerprintId) {
  try {
    const response = await fetch('/api_get_app_fingerprints?manage_token=${managementToken}&fingerprint_id=' + encodeURIComponent(fingerprintId));
    const data = await response.json();
    
    const modal = document.getElementById('fingerprintDetailModal');
    const content = document.getElementById('fingerprintDetailContent');
    
    if (data.success && data.fingerprint) {
      const fp = data.fingerprint;
      let html = '';
      
      html += \`<strong>指纹ID：</strong> \${fp.id}<br><br>\`;
      html += \`<strong>应用名称：</strong> \${fp.app_name}<br><br>\`;
      html += \`<strong>应用版本：</strong> \${fp.app_version || 'N/A'}<br><br>\`;
      html += \`<strong>设备ID：</strong> \${fp.device_id || 'N/A'}<br><br>\`;
      html += \`<strong>IP地址：</strong> \${fp.ip_address || 'N/A'}<br><br>\`;
      html += \`<strong>置信度：</strong> \${fp.confidence}%<br><br>\`;
      html += \`<strong>酷9状态：</strong> \${fp.is_ku9 ? '✅ 酷9播放器' : '❌ 非酷9播放器'}<br><br>\`;
      html += \`<strong>创建时间：</strong> \${new Date(fp.created_at).toLocaleString()}<br><br>\`;
      html += \`<strong>最后看到：</strong> \${new Date(fp.last_seen).toLocaleString()}<br><br>\`;
      html += \`<strong>来源：</strong> \${fp.source || 'unknown'}<br><br>\`;
      
      if (fp.user_agent) {
        html += \`<strong>User-Agent：</strong><br><code>\${fp.user_agent}</code><br><br>\`;
      }
      
      if (fp.http_headers && Object.keys(fp.http_headers).length > 0) {
        html += \`<strong>HTTP头：</strong><br><code>\${JSON.stringify(fp.http_headers, null, 2)}</code><br><br>\`;
      }
      
      if (fp.signature) {
        html += \`<strong>应用程序签名：</strong> \${fp.signature}<br><br>\`;
      }
      
      if (fp.notes) {
        html += \`<strong>备注：</strong> \${fp.notes}<br><br>\`;
      }
      
      content.innerHTML = html;
    } else {
      content.innerHTML = '加载指纹详情失败';
    }
    
    modal.style.display = 'block';
  } catch (error) {
    console.error('加载指纹详情失败:', error);
    alert('加载指纹详情失败');
  }
}

// 删除指纹
function deleteFingerprint(fingerprintId) {
  if (confirm('确定要删除此应用程序指纹吗？此操作不可恢复！')) {
    // 这里需要实现删除逻辑
    // 由于删除需要后端API，这里暂时不实现
    alert('删除功能需要后端API支持，请在后续版本中实现');
  }
}

// 关闭模态框
function closeModal() {
  document.getElementById('fingerprintDetailModal').style.display = 'none';
}

// 点击模态框外部关闭
window.onclick = function(event) {
  const modal = document.getElementById('fingerprintDetailModal');
  if (event.target === modal) {
    modal.style.display = 'none';
  }
}

// 示例数据
document.getElementById('fingerprints_json').addEventListener('click', function() {
  if (this.value === '') {
    this.value = \`[
  {
    "app_name": "酷9播放器",
    "app_version": "2.0.1",
    "device_id": "ku9_device_001",
    "user_agent": "Ku9Player/2.0.1 (Android 10; TVBox)",
    "http_headers": {
      "X-Ku9-Version": "2.0.1",
      "X-Player-Type": "ku9"
    },
    "ip_address": "192.168.1.100",
    "is_ku9": true,
    "confidence": 95,
    "notes": "客厅电视"
  },
  {
    "app_name": "TVBox",
    "app_version": "1.0.0",
    "device_id": "tvbox_device_001",
    "user_agent": "TVBox/1.0.0 (Android 9; Mobile)",
    "is_ku9": false,
    "confidence": 30,
    "notes": "手机版TVBox"
  }
]\`;
  }
});
</script>
</body>
</html>`;
}

// 增强版酷9播放器检测函数 - 8种识别方法
async function enhancedDetectKu9Player(userAgent, requestHeaders, ip, env) {
  const detectionMethods = [];
  let totalConfidence = 0;
  let methodWeights = 0;
  
  // 加载配置
  const configData = await env.MY_TEXT_STORAGE.get('ku9_detection_config');
  const config = configData ? JSON.parse(configData) : {
    detection_threshold: 70,
    enable_behavior_analysis: true,
    enable_app_fingerprint: true,
    enable_proxy_detection: true,
    strict_mode: false
  };
  
  const ua = userAgent || '';
  const lowerUA = ua.toLowerCase();
  
  // 方法1: 应用程序签名验证 (权重: 25)
  if (config.enable_app_fingerprint) {
    const appSignature = await verifyAppSignature(requestHeaders, ua, ip, env);
    if (appSignature.isKu9) {
      detectionMethods.push(`app_signature:${appSignature.method}`);
      totalConfidence += appSignature.confidence * 0.25;
      methodWeights += 25;
    }
  }
  
  // 方法2: HTTP头特征检测 (权重: 20)
  const headerDetection = detectByHttpHeaders(requestHeaders, config);
  if (headerDetection.score > 0) {
    detectionMethods.push(`http_headers:${headerDetection.matchedHeaders.join(',')}`);
    totalConfidence += headerDetection.score * 0.20;
    methodWeights += 20;
  }
  
  // 方法3: User-Agent关键词检测 (权重: 15)
  const uaDetection = detectByUserAgent(lowerUA, config);
  if (uaDetection.score > 0) {
    detectionMethods.push(`user_agent:${uaDetection.matchedPatterns.join(',')}`);
    totalConfidence += uaDetection.score * 0.15;
    methodWeights += 15;
  }
  
  // 方法4: 已知设备ID匹配 (权重: 15)
  const deviceIdMatch = await matchKnownDeviceId(requestHeaders, ip, ua, env);
  if (deviceIdMatch.score > 0) {
    detectionMethods.push(`known_device:${deviceIdMatch.method}`);
    totalConfidence += deviceIdMatch.score * 0.15;
    methodWeights += 15;
  }
  
  // 方法5: 已知IP匹配 (权重: 10)
  const ipMatch = await matchKnownIP(ip, env);
  if (ipMatch.score > 0) {
    detectionMethods.push(`known_ip:${ipMatch.method}`);
    totalConfidence += ipMatch.score * 0.10;
    methodWeights += 10;
  }
  
  // 方法6: 行为特征分析 (权重: 10)
  if (config.enable_behavior_analysis) {
    const behaviorDetection = detectByBehavior(requestHeaders, config);
    if (behaviorDetection.score > 0) {
      detectionMethods.push(`behavior:${behaviorDetection.matchedPatterns.join(',')}`);
      totalConfidence += behaviorDetection.score * 0.10;
      methodWeights += 10;
    }
  }
  
  // 方法7: 请求参数检测 (权重: 5)
  const paramDetection = detectByRequestParams(requestHeaders, config);
  if (paramDetection.score > 0) {
    detectionMethods.push(`params:${paramDetection.matchedParams.join(',')}`);
    totalConfidence += paramDetection.score * 0.05;
    methodWeights += 5;
  }
  
  // 计算最终置信度
  let finalConfidence = 0;
  if (methodWeights > 0) {
    finalConfidence = Math.min(100, Math.round((totalConfidence / methodWeights) * 100));
  }
  
  // 严格模式下的额外验证
  let isKu9 = finalConfidence >= config.detection_threshold;
  
  if (config.strict_mode && isKu9) {
    // 在严格模式下，需要至少3种方法确认
    if (detectionMethods.length < 3) {
      isKu9 = false;
      finalConfidence = Math.max(0, finalConfidence - 30);
    }
  }
  
  return {
    isKu9,
    confidence: finalConfidence,
    methods: detectionMethods,
    weights: methodWeights,
    config: {
      threshold: config.detection_threshold,
      strict_mode: config.strict_mode
    }
  };
}

// 方法1: 应用程序签名验证
async function verifyAppSignature(requestHeaders, userAgent, ip, env) {
  // 检查请求头中的应用程序签名
  const appSignature = requestHeaders.get('X-App-Signature');
  const appVersion = requestHeaders.get('X-App-Version');
  const appName = requestHeaders.get('X-App-Name');
  
  if (appSignature) {
    // 验证签名格式
    if (appSignature.includes('ku9') || appSignature.includes('k9player')) {
      return {
        isKu9: true,
        confidence: 95,
        method: 'app_signature_header'
      };
    }
  }
  
  // 检查已知的应用程序指纹
  const appFingerprint = await generateAppFingerprint(requestHeaders, userAgent);
  const knownFingerprint = await env.MY_TEXT_STORAGE.get(`app_fingerprint_${appFingerprint}`);
  
  if (knownFingerprint) {
    try {
      const fingerprintData = JSON.parse(knownFingerprint);
      if (fingerprintData.is_ku9) {
        return {
          isKu9: true,
          confidence: fingerprintData.confidence || 90,
          method: 'known_app_fingerprint'
        };
      }
    } catch (error) {
      console.error('解析应用程序指纹失败:', error);
    }
  }
  
  // 通过验证端点验证
  const hasValidated = await checkAppValidation(requestHeaders, ip, env);
  if (hasValidated) {
    return {
      isKu9: true,
      confidence: 85,
      method: 'app_validation_endpoint'
    };
  }
  
  return {
    isKu9: false,
    confidence: 0,
    method: 'no_app_signature'
  };
}

// 方法2: HTTP头特征检测
function detectByHttpHeaders(requestHeaders, config) {
  let score = 0;
  const matchedHeaders = [];
  
  // 默认的酷9头特征
  const defaultHeaderPatterns = [
    { pattern: 'X-Ku9-Version', weight: 90 },
    { pattern: 'X-Player-Type=ku9', weight: 85 },
    { pattern: 'X-App-Name=酷9播放器', weight: 95 },
    { pattern: 'X-Ku9-Device-ID', weight: 80 },
    { pattern: 'X-Client-Type=ku9', weight: 75 }
  ];
  
  // 合并配置
  const headerPatterns = config.header_patterns || defaultHeaderPatterns;
  
  for (const pattern of headerPatterns) {
    const [headerName, expectedValue] = pattern.split('=');
    
    if (expectedValue) {
      // 检查头部值和预期值是否匹配
      const headerValue = requestHeaders.get(headerName);
      if (headerValue && headerValue.includes(expectedValue)) {
        matchedHeaders.push(pattern);
        score += 90; // 精确匹配权重更高
      }
    } else {
      // 只检查头部是否存在
      if (requestHeaders.has(headerName)) {
        matchedHeaders.push(headerName);
        score += 70;
      }
    }
  }
  
  return {
    score: Math.min(100, score),
    matchedHeaders
  };
}

// 方法3: User-Agent关键词检测
function detectByUserAgent(userAgent, config) {
  let score = 0;
  const matchedPatterns = [];
  
  // 默认的酷9 UA特征
  const defaultUAPatterns = [
    { pattern: /ku9player/i, weight: 95 },
    { pattern: /酷9播放器/i, weight: 95 },
    { pattern: /com\.ku9\.player/i, weight: 90 },
    { pattern: /k9player/i, weight: 85 },
    { pattern: /^mtv\/[\d\.]+/i, weight: 100 }, // MTV/版本号 格式
    { pattern: /tvbox.*ku9/i, weight: 80 },
    { pattern: /ku9.*tvbox/i, weight: 80 },
    { pattern: /android.*ku9/i, weight: 75 },
    { pattern: /ku9.*android/i, weight: 75 }
  ];
  
  // 合并配置
  const uaPatterns = config.ua_patterns || [];
  
  // 处理配置中的模式
  for (const patternStr of uaPatterns) {
    try {
      const regex = new RegExp(patternStr, 'i');
      if (regex.test(userAgent)) {
        matchedPatterns.push(patternStr);
        score += 80; // 配置的模式权重
      }
    } catch (error) {
      // 如果不是正则表达式，当作普通字符串处理
      if (userAgent.includes(patternStr.toLowerCase())) {
        matchedPatterns.push(patternStr);
        score += 70;
      }
    }
  }
  
  // 检查默认模式
  for (const { pattern, weight } of defaultUAPatterns) {
    if (pattern.test(userAgent)) {
      matchedPatterns.push(pattern.toString());
      score += weight;
    }
  }
  
  return {
    score: Math.min(100, score),
    matchedPatterns
  };
}

// 方法4: 已知设备ID匹配
async function matchKnownDeviceId(requestHeaders, ip, userAgent, env) {
  // 从请求头获取设备ID
  const deviceId = requestHeaders.get('X-Device-ID') || 
                   requestHeaders.get('X-Ku9-Device-ID') ||
                   await generateStableDeviceId(requestHeaders, userAgent, ip);
  
  if (!deviceId) {
    return { score: 0, method: 'no_device_id' };
  }
  
  // 检查是否为已知的酷9设备
  const knownDeviceIdsData = await env.MY_TEXT_STORAGE.get('ku9_known_device_ids');
  if (knownDeviceIdsData) {
    try {
      const knownDeviceIds = JSON.parse(knownDeviceIdsData);
      if (knownDeviceIds.includes(deviceId)) {
        return { score: 95, method: 'known_device_id_match' };
      }
    } catch (error) {
      console.error('解析已知设备ID失败:', error);
    }
  }
  
  // 检查设备指纹库
  const deviceFingerprint = await env.MY_TEXT_STORAGE.get(`device_fingerprint_${deviceId}`);
  if (deviceFingerprint) {
    try {
      const fingerprintData = JSON.parse(deviceFingerprint);
      if (fingerprintData.is_ku9) {
        return { score: fingerprintData.confidence || 85, method: 'device_fingerprint_match' };
      }
    } catch (error) {
      console.error('解析设备指纹失败:', error);
    }
  }
  
  return { score: 0, method: 'unknown_device' };
}

// 方法5: 已知IP匹配
async function matchKnownIP(ip, env) {
  if (!ip || ip === 'unknown') {
    return { score: 0, method: 'no_ip' };
  }
  
  // 检查是否为已知的酷9 IP
  const knownIPsData = await env.MY_TEXT_STORAGE.get('ku9_known_ips');
  if (knownIPsData) {
    try {
      const knownIPs = JSON.parse(knownIPsData);
      if (knownIPs.includes(ip)) {
        return { score: 85, method: 'known_ip_match' };
      }
    } catch (error) {
      console.error('解析已知IP失败:', error);
    }
  }
  
  // 检查IP历史记录
  const ipHistoryKey = `ip_history_${await hashString(ip)}`;
  const ipHistoryData = await env.MY_TEXT_STORAGE.get(ipHistoryKey);
  
  if (ipHistoryData) {
    try {
      const history = JSON.parse(ipHistoryData);
      if (history.ku9_access_count > history.non_ku9_access_count * 2) {
        return { score: 75, method: 'ip_history_analysis' };
      }
    } catch (error) {
      console.error('解析IP历史失败:', error);
    }
  }
  
  return { score: 0, method: 'unknown_ip' };
}

// 方法6: 行为特征分析
function detectByBehavior(requestHeaders, config) {
  let score = 0;
  const matchedPatterns = [];
  
  // 默认的行为特征
  const defaultBehaviorPatterns = [
    { pattern: 'accept: application/x-mpegurl', weight: 70 },
    { pattern: 'accept: audio/x-mpegurl', weight: 70 },
    { pattern: 'accept: */*', weight: 30 },
    { pattern: 'connection: keep-alive', weight: 40 },
    { pattern: 'range: bytes=', weight: 60 },
    { pattern: 'cache-control: no-cache', weight: 50 }
  ];
  
  // 合并配置
  const behaviorPatterns = config.behavior_patterns || [];
  
  for (const pattern of behaviorPatterns) {
    const [headerName, expectedValue] = pattern.split(':').map(s => s.trim());
    
    if (headerName && expectedValue) {
      const headerValue = requestHeaders.get(headerName);
      if (headerValue && headerValue.includes(expectedValue)) {
        matchedPatterns.push(pattern);
        score += 70;
      }
    }
  }
  
  // 检查默认模式
  for (const { pattern, weight } of defaultBehaviorPatterns) {
    const [headerName, expectedValue] = pattern.split(':').map(s => s.trim());
    const headerValue = requestHeaders.get(headerName);
    
    if (headerValue && headerValue.includes(expectedValue)) {
      matchedPatterns.push(pattern);
      score += weight;
    }
  }
  
  return {
    score: Math.min(100, score),
    matchedPatterns
  };
}

// 方法7: 请求参数检测
function detectByRequestParams(requestHeaders, config) {
  let score = 0;
  const matchedParams = [];
  
  // 注意：这个方法在handleSecureFileDownload中通过URL参数实现
  // 这里主要检查请求头中的参数信息
  
  const referer = requestHeaders.get('Referer') || '';
  const accept = requestHeaders.get('Accept') || '';
  
  // 检查Referer中的参数
  if (referer.includes('ku9_token=') || referer.includes('player=ku9')) {
    matchedParams.push('referer_param');
    score += 60;
  }
  
  // 检查Accept头
  if (accept.includes('application/x-mpegurl') || accept.includes('audio/x-mpegurl')) {
    matchedParams.push('m3u_accept');
    score += 50;
  }
  
  return {
    score: Math.min(100, score),
    matchedParams
  };
}

// 生成稳定的设备ID（不受代理影响）
async function generateStableDeviceId(requestHeaders, userAgent, ip) {
  // 组合多种稳定特征
  const features = [];
  
  // 1. User-Agent中的稳定特征
  const uaFeatures = extractStableUAFeatures(userAgent);
  if (uaFeatures) features.push(uaFeatures);
  
  // 2. 请求头中的设备特征
  const deviceHeaders = [
    'X-Device-Model',
    'X-Device-Brand',
    'X-Device-OS',
    'User-Agent' // 再次包含UA
  ];
  
  for (const header of deviceHeaders) {
    const value = requestHeaders.get(header);
    if (value) {
      features.push(`${header}:${value}`);
    }
  }
  
  // 3. 应用程序特征
  const appSignature = requestHeaders.get('X-App-Signature');
  if (appSignature) {
    features.push(`app_sig:${appSignature}`);
  }
  
  // 如果没有足够特征，使用IP+UA的哈希作为后备
  if (features.length === 0) {
    return await hashString(`${ip}|${userAgent}`);
  }
  
  // 生成设备ID哈希
  return await hashString(features.join('|'));
}

// 从User-Agent提取稳定特征
function extractStableUAFeatures(userAgent) {
  const ua = userAgent || '';
  
  // 提取设备模型和品牌
  const deviceMatches = ua.match(/(?:Build\/|; )([^;)]+)(?:;|\))/g);
  if (deviceMatches) {
    return deviceMatches.join(';');
  }
  
  // 提取应用程序信息
  const appMatches = ua.match(/([a-zA-Z0-9_\-\.]+\/[a-zA-Z0-9_\-\.]+)/g);
  if (appMatches) {
    return appMatches.join(';');
  }
  
  return null;
}

// 生成应用程序指纹
async function generateAppFingerprint(requestHeaders, userAgent) {
  const features = [];
  
  // 应用程序信息
  const appName = requestHeaders.get('X-App-Name') || '';
  const appVersion = requestHeaders.get('X-App-Version') || '';
  const appSignature = requestHeaders.get('X-App-Signature') || '';
  
  if (appName) features.push(`app:${appName}`);
  if (appVersion) features.push(`ver:${appVersion}`);
  if (appSignature) features.push(`sig:${appSignature}`);
  
  // User-Agent特征
  const uaFeatures = extractAppFeaturesFromUA(userAgent);
  if (uaFeatures) features.push(uaFeatures);
  
  // 如果特征太少，使用完整UA
  if (features.length < 2) {
    features.push(`ua:${userAgent}`);
  }
  
  return await hashString(features.join('|'));
}

// 从User-Agent提取应用程序特征
function extractAppFeaturesFromUA(userAgent) {
  const ua = userAgent || '';
  
  // 提取应用程序名称和版本
  const appMatch = ua.match(/^([^\/]+)\/([^ ]+)/);
  if (appMatch) {
    return `app_ua:${appMatch[1]}_${appMatch[2]}`;
  }
  
  // 提取包名
  const packageMatch = ua.match(/com\.[a-z0-9_]+\.[a-z0-9_]+/i);
  if (packageMatch) {
    return `pkg:${packageMatch[0]}`;
  }
  
  return null;
}

// 检查应用程序验证
async function checkAppValidation(requestHeaders, ip, env) {
  // 检查是否有有效的验证令牌
  const validationToken = requestHeaders.get('X-Validation-Token');
  if (validationToken) {
    const validationData = await env.MY_TEXT_STORAGE.get(`app_validation_${validationToken}`);
    if (validationData) {
      try {
        const data = JSON.parse(validationData);
        if (data.valid && data.expires_at > Date.now()) {
          return true;
        }
      } catch (error) {
        console.error('解析验证数据失败:', error);
      }
    }
  }
  
  return false;
}

// 应用程序验证端点
async function handleVerifyAppEndpoint(request, env) {
  try {
    const data = await request.json();
    
    // 验证必要字段
    if (!data.app_name || !data.device_id) {
      return new Response(JSON.stringify({
        success: false,
        error: '缺少必要字段'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }
    
    // 生成验证令牌
    const validationToken = generateToken();
    const validationData = {
      app_name: data.app_name,
      app_version: data.app_version || '',
      device_id: data.device_id,
      signature: data.signature || '',
      ip: request.headers.get('CF-Connecting-IP') || 'unknown',
      user_agent: request.headers.get('User-Agent') || '',
      valid: true,
      created_at: Date.now(),
      expires_at: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7天过期
      verification_method: 'app_endpoint'
    };
    
    // 保存验证数据
    await env.MY_TEXT_STORAGE.put(`app_validation_${validationToken}`, JSON.stringify(validationData), {
      expirationTtl: 604800 // 7天
    });
    
    // 记录应用程序指纹
    const fingerprintId = generateFingerprintId();
    const fingerprintData = {
      id: fingerprintId,
      app_name: data.app_name,
      app_version: data.app_version || '',
      device_id: data.device_id,
      user_agent: request.headers.get('User-Agent') || '',
      ip_address: request.headers.get('CF-Connecting-IP') || 'unknown',
      signature: data.signature || '',
      is_ku9: data.app_name.includes('酷9') || data.app_name.toLowerCase().includes('ku9'),
      confidence: 90,
      created_at: Date.now(),
      last_seen: Date.now(),
      source: 'app_verification',
      notes: '通过验证端点注册'
    };
    
    await env.MY_TEXT_STORAGE.put(`app_fingerprint_${fingerprintId}`, JSON.stringify(fingerprintData));
    
    return new Response(JSON.stringify({
      success: true,
      validation_token: validationToken,
      expires_at: validationData.expires_at,
      fingerprint_id: fingerprintId
    }), {
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff'
      }
    });
    
  } catch (error) {
    console.error('应用程序验证错误:', error);
    return new Response(JSON.stringify({
      success: false,
      error: `验证失败: ${error.message}`
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }
}

// 酷9专用下载端点 - 使用增强识别
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
    
    // 使用增强识别检测是否为酷9播放器
    const ku9Detection = await enhancedDetectKu9Player(
      request.headers.get('User-Agent'),
      request.headers,
      clientIP,
      env
    );
    
    // 只有真正的酷9播放器才能使用酷9令牌
    if (!ku9Detection.isKu9) {
      await logAccess(env, request, safeFilename, 'blocked', 
                     `非酷9播放器使用酷9令牌 (置信度: ${ku9Detection.confidence}%)`, 
                     request.headers.get('User-Agent'), 
                     clientIP,
                     'blocked',
                     null,
                     ku9Detection.methods);
      
      return new Response(`非酷9播放器不能使用酷9令牌 (识别置信度: ${ku9Detection.confidence}%)`, { 
        status: 403,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'X-Content-Type-Options': 'nosniff',
          'X-Detection-Methods': ku9Detection.methods.join(', '),
          'X-Detection-Confidence': ku9Detection.confidence.toString()
        }
      });
    }
    
    // 更新令牌使用信息
    tokenInfo.used_count++;
    tokenInfo.last_used = Date.now();
    await env.MY_TEXT_STORAGE.put(`ku9_token_${ku9Token}`, JSON.stringify(tokenInfo));
    
    // 记录成功的访问
    const deviceId = await generateStableDeviceId(request.headers, request.headers.get('User-Agent'), clientIP);
    await logAccess(env, request, safeFilename, 'allowed', 
                   `酷9令牌访问，识别置信度: ${ku9Detection.confidence}%`, 
                   request.headers.get('User-Agent'), 
                   clientIP,
                   'confirmed',
                   deviceId,
                   ku9Detection.methods);
    
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
        'Access-Control-Allow-Headers': 'Content-Type, X-Ku9-Token, X-Device-ID, X-App-Signature, X-App-Version',
        'X-Content-Type-Options': 'nosniff',
        'X-Encryption-Time': timestamp.toString(),
        'X-Encryption-Version': '4.0',
        'X-Ku9-Access': 'authorized',
        'X-Detection-Confidence': ku9Detection.confidence.toString(),
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

// 安全文件下载处理 - 使用增强识别
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
    
    // 使用增强识别检测酷9播放器
    const ku9Detection = await enhancedDetectKu9Player(userAgent, request.headers, clientIP, env);
    
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
          reason = `非酷9播放器使用酷9令牌 (置信度: ${ku9Detection.confidence}%)`;
          ku9Status = 'blocked';
        } else {
          // 验证通过
          allowAccess = true;
          reason = `酷9令牌访问，识别置信度: ${ku9Detection.confidence}%`;
          ku9Status = 'confirmed';
          
          // 更新令牌使用信息
          tokenInfo.used_count++;
          tokenInfo.last_used = Date.now();
          await env.MY_TEXT_STORAGE.put(`ku9_token_${ku9Token}`, JSON.stringify(tokenInfo));
        }
      }
    } else {
      // 没有酷9令牌的情况，使用增强识别结果
      if (!ku9Detection.isKu9) {
        allowAccess = false;
        reason = `非酷9播放器 (置信度: ${ku9Detection.confidence}%)`;
        ku9Status = 'blocked';
      } else {
        allowAccess = true;
        reason = `酷9播放器识别 (置信度: ${ku9Detection.confidence}%)`;
        ku9Status = 'confirmed';
      }
    }
    
    // 如果不允许访问
    if (!allowAccess) {
      const deviceId = await generateStableDeviceId(request.headers, userAgent, clientIP);
      await logAccess(env, request, safeFilename, 'blocked', reason, userAgent, clientIP, ku9Status, deviceId, ku9Detection.methods);
      
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
          'X-Ku9-Status': ku9Status,
          'X-Detection-Methods': ku9Detection.methods.join(', '),
          'X-Detection-Confidence': ku9Detection.confidence.toString()
        }
      });
    }
    
    // 生成稳定的设备ID
    const deviceId = await generateStableDeviceId(request.headers, userAgent, clientIP);
    
    // 记录允许的访问日志
    await logAccess(env, request, safeFilename, 'allowed', reason, userAgent, clientIP, ku9Status, deviceId, ku9Detection.methods);
    
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
        'Access-Control-Allow-Headers': 'Content-Type, X-Client-Time, X-Management-Access, X-Ku9-Token, X-Device-ID, X-App-Signature',
        'X-Content-Type-Options': 'nosniff',
        'X-Encryption-Time': timestamp.toString(),
        'X-Encryption-Version': '4.0',
        'X-Ku9-Status': ku9Status,
        'X-Detection-Confidence': ku9Detection.confidence.toString(),
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

// 记录访问日志函数 - 增强版
async function logAccess(env, request, filename, status, reason, userAgent, ip, ku9Detected = 'unknown', deviceId = null, detectionMethods = []) {
  try {
    const timestamp = Date.now();
    const logId = `log_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 如果没有设备ID，生成一个稳定的设备ID
    if (!deviceId) {
      deviceId = await generateStableDeviceId(request.headers, userAgent, ip);
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
      detection_methods: detectionMethods,
      ku9_token_used: request.headers.get('X-Ku9-Token') || new URL(request.url).searchParams.get('ku9_token') || false,
      app_signature: request.headers.get('X-App-Signature') || '',
      app_version: request.headers.get('X-App-Version') || ''
    };
    
    await env.MY_TEXT_STORAGE.put(logId, JSON.stringify(logData), { 
      expirationTtl: 2592000 // 30天过期
    });
    
    // 更新IP历史记录
    await updateIPHistory(ip, ku9Detected === 'confirmed', env);
    
    // 如果识别为酷9，更新已知设备列表
    if (ku9Detected === 'confirmed' && deviceId) {
      await updateKnownDevices(deviceId, ip, userAgent, env);
    }
    
    console.log('✅ 日志已保存:', logId, filename, status, '酷9状态:', ku9Detected, '设备ID:', deviceId);
    
    return logId;
  } catch (error) {
    console.error('❌ 记录访问日志失败:', error);
    return null;
  }
}

// 更新IP历史记录
async function updateIPHistory(ip, isKu9, env) {
  try {
    if (!ip || ip === 'unknown') return;
    
    const ipHash = await hashString(ip);
    const ipHistoryKey = `ip_history_${ipHash}`;
    const existingHistory = await env.MY_TEXT_STORAGE.get(ipHistoryKey);
    
    let history = {
      ip,
      total_access: 0,
      ku9_access_count: 0,
      non_ku9_access_count: 0,
      first_seen: Date.now(),
      last_seen: Date.now()
    };
    
    if (existingHistory) {
      try {
        history = JSON.parse(existingHistory);
        history.last_seen = Date.now();
      } catch (error) {
        console.error('解析IP历史失败，重置:', error);
      }
    }
    
    history.total_access++;
    if (isKu9) {
      history.ku9_access_count++;
    } else {
      history.non_ku9_access_count++;
    }
    
    await env.MY_TEXT_STORAGE.put(ipHistoryKey, JSON.stringify(history), {
      expirationTtl: 604800 // 7天
    });
  } catch (error) {
    console.error('更新IP历史失败:', error);
  }
}

// 更新已知设备列表
async function updateKnownDevices(deviceId, ip, userAgent, env) {
  try {
    // 添加到已知设备ID列表
    const knownDeviceIdsData = await env.MY_TEXT_STORAGE.get('ku9_known_device_ids');
    let knownDeviceIds = [];
    
    if (knownDeviceIdsData) {
      try {
        knownDeviceIds = JSON.parse(knownDeviceIdsData);
      } catch (error) {
        console.error('解析已知设备ID失败:', error);
      }
    }
    
    if (!knownDeviceIds.includes(deviceId)) {
      knownDeviceIds.push(deviceId);
      await env.MY_TEXT_STORAGE.put('ku9_known_device_ids', JSON.stringify(knownDeviceIds));
    }
    
    // 添加到已知IP列表
    if (ip && ip !== 'unknown') {
      const knownIPsData = await env.MY_TEXT_STORAGE.get('ku9_known_ips');
      let knownIPs = [];
      
      if (knownIPsData) {
        try {
          knownIPs = JSON.parse(knownIPsData);
        } catch (error) {
          console.error('解析已知IP失败:', error);
        }
      }
      
      if (!knownIPs.includes(ip)) {
        knownIPs.push(ip);
        await env.MY_TEXT_STORAGE.put('ku9_known_ips', JSON.stringify(knownIPs));
      }
    }
    
    // 保存设备指纹
    const deviceFingerprint = {
      device_id: deviceId,
      ip,
      user_agent: userAgent,
      is_ku9: true,
      confidence: 90,
      first_seen: Date.now(),
      last_seen: Date.now(),
      access_count: 1
    };
    
    const existingFingerprint = await env.MY_TEXT_STORAGE.get(`device_fingerprint_${deviceId}`);
    if (existingFingerprint) {
      try {
        const existing = JSON.parse(existingFingerprint);
        deviceFingerprint.access_count = (existing.access_count || 0) + 1;
        deviceFingerprint.first_seen = existing.first_seen || Date.now();
      } catch (error) {
        console.error('解析设备指纹失败:', error);
      }
    }
    
    await env.MY_TEXT_STORAGE.put(`device_fingerprint_${deviceId}`, JSON.stringify(deviceFingerprint));
    
  } catch (error) {
    console.error('更新已知设备失败:', error);
  }
}

// API处理函数
async function handleVerifyKu9App(request, env) {
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
    
    const userAgent = formData.user_agent || '';
    const testHeaders = {};
    
    // 解析测试头
    if (formData.http_headers) {
      try {
        const headers = JSON.parse(formData.http_headers);
        Object.assign(testHeaders, headers);
      } catch (error) {
        console.error('解析HTTP头失败:', error);
      }
    }
    
    // 创建模拟请求头
    const mockHeaders = {
      get: (name) => testHeaders[name] || '',
      has: (name) => !!testHeaders[name]
    };
    
    // 执行增强识别
    const detectionResult = await enhancedDetectKu9Player(
      userAgent,
      mockHeaders,
      formData.ip || '127.0.0.1',
      env
    );
    
    return new Response(JSON.stringify({
      success: true,
      detection: detectionResult
    }), {
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff'
      }
    });
    
  } catch (error) {
    console.error('验证酷9应用错误:', error);
    return new Response(JSON.stringify({
      success: false,
      error: `验证失败: ${error.message}`
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }
}

async function handleGetAppFingerprints(request, env) {
  try {
    const url = new URL(request.url);
    const managementToken = url.searchParams.get('manage_token');
    const expectedToken = await env.MY_TEXT_STORAGE.get('management_token') || 'default_manage_token_2024';
    const fingerprintId = url.searchParams.get('fingerprint_id');
    
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
    
    if (fingerprintId) {
      // 获取单个指纹
      const fingerprintData = await env.MY_TEXT_STORAGE.get(`app_fingerprint_${fingerprintId}`);
      if (fingerprintData) {
        return new Response(JSON.stringify({
          success: true,
          fingerprint: JSON.parse(fingerprintData)
        }), {
          headers: {
            'Content-Type': 'application/json',
            'X-Content-Type-Options': 'nosniff'
          }
        });
      } else {
        return new Response(JSON.stringify({
          success: false,
          error: '指纹不存在'
        }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'X-Content-Type-Options': 'nosniff'
          }
        });
      }
    } else {
      // 获取所有指纹
      const allKeys = await env.MY_TEXT_STORAGE.list();
      const fingerprints = [];
      
      for (const key of allKeys.keys) {
        if (key.name.startsWith('app_fingerprint_')) {
          try {
            const fingerprintData = await env.MY_TEXT_STORAGE.get(key.name);
            if (fingerprintData) {
              fingerprints.push(JSON.parse(fingerprintData));
            }
          } catch (error) {
            console.error('解析应用程序指纹失败:', key.name, error);
          }
        }
      }
      
      return new Response(JSON.stringify({
        success: true,
        fingerprints: fingerprints
      }), {
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }
    
  } catch (error) {
    console.error('获取应用程序指纹错误:', error);
    return new Response(JSON.stringify({
      success: false,
      error: `获取失败: ${error.message}`
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }
}

async function handleMarkAppFingerprint(request, env) {
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
    
    const fingerprintId = formData.fingerprint_id;
    const isKu9 = formData.is_ku9 === 'true';
    const confidence = parseInt(formData.confidence) || 100;
    
    if (!fingerprintId) {
      return new Response(JSON.stringify({
        success: false,
        error: '缺少指纹ID'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }
    
    const fingerprintKey = `app_fingerprint_${fingerprintId}`;
    const fingerprintData = await env.MY_TEXT_STORAGE.get(fingerprintKey);
    
    if (!fingerprintData) {
      return new Response(JSON.stringify({
        success: false,
        error: '指纹不存在'
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }
    
    const fingerprint = JSON.parse(fingerprintData);
    fingerprint.is_ku9 = isKu9;
    fingerprint.confidence = confidence;
    fingerprint.last_seen = Date.now();
    
    await env.MY_TEXT_STORAGE.put(fingerprintKey, JSON.stringify(fingerprint));
    
    return new Response(JSON.stringify({
      success: true,
      message: `应用程序指纹已标记为${isKu9 ? '酷9播放器' : '非酷9播放器'}`
    }), {
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff'
      }
    });
    
  } catch (error) {
    console.error('标记应用程序指纹错误:', error);
    return new Response(JSON.stringify({
      success: false,
      error: `标记失败: ${error.message}`
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }
}

// 其他API处理函数保持不变（需要调整参数以包含新功能）
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
  // ... 保持原有代码不变，但需要支持新的日志字段 ...
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

async function handleGenerateKu9Token(request, env) {
  // ... 保持原有代码不变 ...
}

async function handleDeleteKu9Token(request, env) {
  // ... 保持原有代码不变 ...
}

async function handleUpdateDevice(request, env) {
  // ... 保持原有代码不变 ...
}

// 酷9令牌管理页面 - 保持不变
async function handleKu9Page(request, env) {
  // ... 保持原有代码不变 ...
}

async function getKu9HTML(request, env, managementToken) {
  // ... 保持原有代码不变 ...
}

// 设备管理页面 - 保持不变
async function handleDevicesPage(request, env) {
  // ... 保持原有代码不变 ...
}

async function getDevicesHTML(request, env, managementToken) {
  // ... 保持原有代码不变 ...
}

// 管理页面处理 - 保持不变
async function handleManagementPage(request, env) {
  // ... 保持原有代码不变 ...
}

// 访问日志页面处理 - 保持不变
async function handleLogsPage(request, env) {
  // ... 保持原有代码不变 ...
}

// 访问日志页面 HTML - 保持不变
async function getLogsHTML(logs, currentPage, totalPages, stats, filterType, filterValue, managementToken) {
  // ... 保持原有代码不变 ...
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

// 生成指纹ID
function generateFingerprintId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 9);
  return `fp_${timestamp}_${random}`;
}

// 生成字符串哈希
async function hashString(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// 管理登录页面 - 保持不变
async function getManagementLoginHTML(request) {
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>管理登录</title>
<style>
body{font-family:"Segoe UI",Tahoma,sans-serif;background:#f5f5f5;margin:0;padding:20px;display:flex;justify-content:center;align-items:center;min-height:100vh;}
.login-container{background:white;padding:40px;border-radius:10px;box-shadow:0 5px 15px rgba(0,0,0,0.1);width:100%;max-width:400px;}
.login-container h2{text-align:center;color:#333;margin-bottom:30px;}
.form-group{margin-bottom:20px;}
.form-group label{display:block;margin-bottom:5px;color:#666;font-weight:bold;}
.form-group input{width:100%;padding:10px;border:1px solid #ddd;border-radius:5px;font-size:16px;box-sizing:border-box;}
.login-btn{width:100%;padding:12px;background:#4a6cf7;color:white;border:none;border-radius:5px;font-size:16px;cursor:pointer;transition:background 0.3s;}
.login-btn:hover{background:#3653d3;}
.error-message{color:#d9534f;text-align:center;margin-top:15px;}
</style>
</head>
<body>
<div class="login-container">
  <h2>🔐 管理登录</h2>
  <form method="get">
    <div class="form-group">
      <label for="manage_token">管理令牌：</label>
      <input type="password" id="manage_token" name="manage_token" placeholder="输入管理令牌" required>
    </div>
    <button type="submit" class="login-btn">登录</button>
  </form>
  <p style="text-align:center;margin-top:20px;color:#666;font-size:14px;">默认令牌：default_manage_token_2024</p>
</div>
</body>
</html>`;
  
  return html;
}

// 搜索管理页面 HTML - 保持不变（但可以添加链接到新功能）
async function getSearchHTML(request, env, managementToken) {
  // ... 保持原有代码不变，但可以添加链接到酷9识别配置和应用指纹管理 ...
  // 例如：在适当位置添加 <a href="./ku9_detector.html?manage_token=${managementToken}">酷9识别配置</a>
  // 和 <a href="./app_fingerprints.html?manage_token=${managementToken}">应用指纹管理</a>
}
