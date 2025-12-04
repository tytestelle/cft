// Cloudflare Pages Functions - 增强安全文本存储系统 V3.0
// 升级：为酷9播放器添加专属令牌系统和精确识别
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

    // UA管理页面
    if (pathname === '/ua.html' || pathname === '/ua.php') {
      return await handleUAManagementPage(request, env);
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

    // API: 更新酷9令牌
    if (pathname === '/api_update_ku9_token' && request.method === 'POST') {
      return await handleUpdateKu9Token(request, env);
    }

    // API: 获取酷9令牌状态
    if (pathname === '/api_ku9_token_status' && request.method === 'GET') {
      return await handleKu9TokenStatus(request, env);
    }

    // API: UA管理 - 标记为酷9
    if (pathname === '/api_mark_as_ku9' && request.method === 'POST') {
      return await handleMarkAsKu9(request, env);
    }

    // API: UA管理 - 移除酷9标记
    if (pathname === '/api_remove_ku9_mark' && request.method === 'POST') {
      return await handleRemoveKu9Mark(request, env);
    }

    // API: UA管理 - 设置访问规则
    if (pathname === '/api_set_access_rule' && request.method === 'POST') {
      return await handleSetAccessRule(request, env);
    }

    // API: UA管理 - 获取UA列表
    if (pathname === '/api_get_ua_list' && request.method === 'GET') {
      return await handleGetUAList(request, env);
    }

    // API: 设备指纹分析
    if (pathname === '/api_device_fingerprint' && request.method === 'GET') {
      return await handleDeviceFingerprint(request, env);
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

// 主页 HTML (index.html) - 保持不变
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
            background: #e8f5e9;
            border: 1px solid #c8e6c9;
            border-radius: 5px;
            padding: 10px;
            margin: 15px 0;
        }
        
        .ku9-info h4 {
            margin-top: 0;
            color: #388e3c;
        }
    </style>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>🔒安全编辑工具🔒</title>
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
            <li><span class="security-icon">✅</span> 酷9专属令牌 - 精确识别酷9播放器</li>
        </ul>
    </div>
    
    <div class="ku9-info">
        <h4>🎬 酷9播放器说明：</h4>
        <p>✅ 酷9播放器已支持专属令牌访问</p>
        <p>✅ 管理员可标记UA为酷9并放行</p>
        <p>✅ 设备指纹识别，精确追踪访问</p>
        <p>✅ 专属令牌只对酷9播放器有效</p>
    </div>
    
    <div class="blocked-software">
        <h4>🚫 已屏蔽的抓包软件：</h4>
        <p>蓝鸟、黄鸟、HTTPCanary、Fiddler、Charles、Wireshark、PacketCapture等</p>
    </div>
    
    <p>可自定义扩展名，输入完整文件名如：<code>log.json</code>、<code>test.php</code>。〖<a href="./search.html"><b>接口搜索</b></a>〗〖<a href="./logs.html"><b>访问日志</b></a>〗〖<a href="./ua.html"><b>UA管理</b></a>〗</p><br>

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
            5. 酷9播放器可使用专属令牌访问
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

// UA管理页面处理
async function handleUAManagementPage(request, env) {
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
    
    // 令牌正确，显示UA管理页面
    return new Response(await getUAManagementHTML(request, env, managementToken), {
      headers: { 
        'content-type': 'text/html;charset=UTF-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Content-Type-Options': 'nosniff'
      },
    });
  } catch (error) {
    console.error('UA管理页面错误:', error);
    return new Response(`UA管理页面错误: ${error.message}`, { 
      status: 500,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }
}

// UA管理页面 HTML
async function getUAManagementHTML(request, env, managementToken) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page')) || 1;
  const pageSize = parseInt(url.searchParams.get('page_size')) || 100;
  const filter = url.searchParams.get('filter') || 'all';
  const searchKeyword = url.searchParams.get('search') || '';
  
  // 获取所有UA数据
  const uaKeys = await env.MY_TEXT_STORAGE.list({ prefix: 'ua_analysis_' });
  const uaList = [];
  
  for (const key of uaKeys.keys) {
    try {
      const uaData = await env.MY_TEXT_STORAGE.get(key.name);
      if (uaData) {
        const data = JSON.parse(uaData);
        const uaHash = key.name.substring(12); // 移除'ua_analysis_'前缀
        
        // 获取UA标记
        const uaMark = await env.MY_TEXT_STORAGE.get(`ua_mark_${uaHash}`);
        if (uaMark) {
          const mark = JSON.parse(uaMark);
          data.isKu9 = mark.isKu9 || false;
          data.allowAccess = mark.allowAccess || false;
          data.markedBy = mark.markedBy || 'system';
          data.markTime = mark.markTime || Date.now();
        } else {
          data.isKu9 = false;
          data.allowAccess = false;
          data.markedBy = 'system';
          data.markTime = null;
        }
        
        uaList.push({
          hash: uaHash,
          ...data
        });
      }
    } catch (error) {
      console.error('解析UA数据失败:', key.name, error);
    }
  }
  
  // 过滤和搜索
  let filteredList = uaList;
  
  if (filter === 'ku9') {
    filteredList = uaList.filter(item => item.isKu9);
  } else if (filter === 'non_ku9') {
    filteredList = uaList.filter(item => !item.isKu9);
  } else if (filter === 'allowed') {
    filteredList = uaList.filter(item => item.allowAccess);
  } else if (filter === 'blocked') {
    filteredList = uaList.filter(item => !item.allowAccess && item.accessCount > 0);
  }
  
  if (searchKeyword) {
    const keyword = searchKeyword.toLowerCase();
    filteredList = filteredList.filter(item => 
      (item.ua && item.ua.toLowerCase().includes(keyword)) ||
      (item.userAgent && item.userAgent.toLowerCase().includes(keyword)) ||
      (item.deviceType && item.deviceType.toLowerCase().includes(keyword))
    );
  }
  
  // 排序（按访问次数倒序）
  filteredList.sort((a, b) => (b.accessCount || 0) - (a.accessCount || 0));
  
  // 分页
  const totalItems = filteredList.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedList = filteredList.slice(startIndex, endIndex);
  
  // 统计数据
  const stats = {
    total: uaList.length,
    ku9: uaList.filter(item => item.isKu9).length,
    allowed: uaList.filter(item => item.allowAccess).length,
    uniqueDevices: [...new Set(uaList.map(item => item.deviceId || item.userAgent))].length,
    totalAccesses: uaList.reduce((sum, item) => sum + (item.accessCount || 0), 0)
  };
  
  // 获取酷9令牌状态
  const ku9Token = await env.MY_TEXT_STORAGE.get('ku9_token') || 'ku9_default_token_' + Date.now().toString(36);
  const ku9TokenActive = await env.MY_TEXT_STORAGE.get('ku9_token_active');
  const isKu9TokenActive = ku9TokenActive !== 'false'; // 默认激活
  
  // 生成UA表格HTML
  let uaTableHTML = '';
  
  if (paginatedList.length > 0) {
    for (const item of paginatedList) {
      const ua = item.userAgent || item.ua || '未知';
      const deviceId = item.deviceId || '无';
      const accessCount = item.accessCount || 0;
      const lastAccess = item.lastAccess ? new Date(item.lastAccess).toLocaleString() : '从未访问';
      const deviceType = item.deviceType || '未知';
      const isKu9 = item.isKu9;
      const allowAccess = item.allowAccess;
      
      // 提取UA关键信息
      const uaShort = ua.length > 80 ? ua.substring(0, 80) + '...' : ua;
      
      uaTableHTML += `
<tr>
  <td><input type="checkbox" class="ua-checkbox" value="${item.hash}"></td>
  <td>
    <div class="ua-preview" onclick="showUADetail('${item.hash.replace(/'/g, "\\'")}')">
      ${uaShort}
    </div>
    <div class="ua-hash">${item.hash.substring(0, 16)}...</div>
  </td>
  <td>${deviceId.substring(0, 16)}...</td>
  <td>${deviceType}</td>
  <td>${accessCount}</td>
  <td>${lastAccess}</td>
  <td>
    <span class="status-badge ${isKu9 ? 'status-ku9' : 'status-other'}">
      ${isKu9 ? '🎬 酷9' : '其他'}
    </span>
  </td>
  <td>
    <span class="status-badge ${allowAccess ? 'status-allowed' : 'status-blocked'}">
      ${allowAccess ? '✅ 允许' : '❌ 阻止'}
    </span>
  </td>
  <td>
    <div class="action-buttons">
      <button class="action-btn ${isKu9 ? 'active' : ''}" onclick="toggleKu9Mark('${item.hash.replace(/'/g, "\\'")}', ${!isKu9})">
        ${isKu9 ? '取消标记' : '标记酷9'}
      </button>
      <button class="action-btn ${allowAccess ? 'active' : ''}" onclick="toggleAccessRule('${item.hash.replace(/'/g, "\\'")}', ${!allowAccess})">
        ${allowAccess ? '禁止访问' : '允许访问'}
      </button>
      <button class="action-btn info-btn" onclick="showUADetail('${item.hash.replace(/'/g, "\\'")}')">
        详情
      </button>
    </div>
  </td>
</tr>
`;
    }
  } else {
    uaTableHTML = '<tr><td colspan="9" style="text-align:center;padding:20px;">暂无UA数据</td></tr>';
  }
  
  // 生成分页HTML
  let paginationHTML = '';
  if (totalPages > 1) {
    paginationHTML = '<div class="pagination">';
    
    if (page > 1) {
      paginationHTML += `<a href="?manage_token=${managementToken}&page=${page - 1}&filter=${filter}&search=${encodeURIComponent(searchKeyword)}&page_size=${pageSize}" class="page-link">上一页</a>`;
    }
    
    for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) {
      if (i === page) {
        paginationHTML += `<span class="page-link current">${i}</span>`;
      } else {
        paginationHTML += `<a href="?manage_token=${managementToken}&page=${i}&filter=${filter}&search=${encodeURIComponent(searchKeyword)}&page_size=${pageSize}" class="page-link">${i}</a>`;
      }
    }
    
    if (page < totalPages) {
      paginationHTML += `<a href="?manage_token=${managementToken}&page=${page + 1}&filter=${filter}&search=${encodeURIComponent(searchKeyword)}&page_size=${pageSize}" class="page-link">下一页</a>`;
    }
    
    paginationHTML += '</div>';
  }
  
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>User-Agent 管理</title>
<style>
body{font-family:"Segoe UI",Tahoma,sans-serif;font-size:14px;color:#333;margin:0;padding:10px;background:#f5f5f5;}
.ua-container{max-width:100%;margin:0 auto;}
.back-link{display:inline-block;margin-bottom:15px;color:#4a6cf7;text-decoration:none;padding:6px 12px;background:white;border-radius:4px;border:1px solid #ddd;}
.back-link:hover{background:#f0f0f0;}
.stats-grid{display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:15px;margin-bottom:20px;}
.stat-card{background:white;padding:15px;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,0.1);text-align:center;}
.stat-card h3{margin:0 0 8px 0;font-size:14px;color:#666;}
.stat-number{font-size:28px;font-weight:bold;color:#333;}
.stat-number.total{color:#4a6cf7;}
.stat-number.ku9{color:#ff9800;}
.stat-number.allowed{color:#5cb85c;}
.stat-number.devices{color:#5bc0de;}
.token-section{background:white;padding:20px;border-radius:8px;margin-bottom:20px;box-shadow:0 2px 4px rgba(0,0,0,0.1);}
.token-section h2{color:#4a6cf7;margin-top:0;}
.token-display{background:#f8f9fa;border:1px solid #ddd;border-radius:5px;padding:15px;margin:15px 0;font-family:monospace;word-break:break-all;}
.token-controls{display:flex;gap:10px;margin-top:15px;}
.token-btn{background:#4a6cf7;color:white;border:none;padding:8px 15px;border-radius:4px;cursor:pointer;font-size:14px;}
.token-btn:hover{background:#3653d3;}
.token-btn.generate{background:#28a745;}
.token-btn.generate:hover{background:#218838;}
.token-btn.deactivate{background:#dc3545;}
.token-btn.deactivate:hover{background:#c82333;}
.token-status{margin-top:10px;font-weight:bold;}
.token-status.active{color:#28a745;}
.token-status.inactive{color:#dc3545;}
.filters{background:white;padding:15px;border-radius:8px;margin-bottom:15px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;}
.filter-input{padding:6px 10px;border:1px solid #ddd;border-radius:4px;min-width:200px;}
.filter-btn{background:#4a6cf7;color:white;border:none;padding:6px 15px;border-radius:4px;cursor:pointer;}
.filter-btn:hover{background:#3653d3;}
.batch-controls{background:white;padding:15px;border-radius:8px;margin-bottom:15px;display:flex;gap:10px;align-items:center;}
.batch-btn{background:#6c757d;color:white;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-size:13px;}
.batch-btn:hover{background:#5a6268;}
.ua-table{width:100%;border-collapse:collapse;background:white;border-radius:8px;overflow:hidden;box-shadow:0 2px 4px rgba(0,0,0,0.1);}
.ua-table th{background:#4a6cf7;color:white;padding:12px 8px;text-align:left;font-weight:normal;}
.ua-table td{padding:8px;border-bottom:1px solid #eee;}
.ua-table tr:hover{background:#f9f9f9;}
.ua-preview{padding:4px;background:#f9f9f9;border-radius:3px;cursor:pointer;max-width:400px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-family:monospace;font-size:12px;}
.ua-preview:hover{background:#e3f2fd;}
.ua-hash{font-size:11px;color:#999;margin-top:2px;}
.status-badge{display:inline-block;padding:2px 8px;border-radius:12px;font-size:12px;font-weight:bold;}
.status-ku9{background:#fff3cd;color:#856404;}
.status-other{background:#e2e3e5;color:#383d41;}
.status-allowed{background:#d4edda;color:#155724;}
.status-blocked{background:#f8d7da;color:#721c24;}
.action-buttons{display:flex;gap:4px;}
.action-btn{padding:3px 8px;border:1px solid #ddd;border-radius:3px;cursor:pointer;font-size:11px;background:white;color:#333;}
.action-btn:hover{background:#f0f0f0;}
.action-btn.active{background:#4a6cf7;color:white;border-color:#4a6cf7;}
.action-btn.info-btn{background:#5bc0de;color:white;border-color:#5bc0de;}
.action-btn.info-btn:hover{background:#31b0d5;}
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
.ua-detail{font-family:monospace;background:#f8f9fa;padding:10px;border-radius:4px;overflow:auto;max-height:400px;font-size:12px;}
.detail-section{margin-bottom:15px;}
.detail-section h4{margin:0 0 5px 0;color:#4a6cf7;}
.detail-grid{display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:10px;margin-bottom:10px;}
.detail-item{background:#f8f9fa;padding:8px;border-radius:4px;border-left:3px solid #4a6cf7;}
.detail-label{font-weight:bold;color:#666;font-size:12px;}
.detail-value{color:#333;}
.device-analysis{background:#e3f2fd;border-radius:5px;padding:15px;margin-top:15px;}
.device-analysis h4{color:#1976d2;margin-top:0;}
.ku9-help{background:#fff3cd;border-radius:5px;padding:15px;margin:15px 0;border:1px solid #ffeaa7;}
.ku9-help h4{color:#856404;margin-top:0;}
</style>
</head>

<body>
<div class="ua-container">
  <a href="./search.html?manage_token=${managementToken}" class="back-link">← 返回管理页面</a>
  <a href="./logs.html?manage_token=${managementToken}" class="back-link">📊 查看访问日志</a>
  
  <div class="stats-grid">
    <div class="stat-card">
      <h3>总UA数量</h3>
      <div class="stat-number total">${stats.total}</div>
    </div>
    <div class="stat-card">
      <h3>酷9标记</h3>
      <div class="stat-number ku9">${stats.ku9}</div>
    </div>
    <div class="stat-card">
      <h3>允许访问</h3>
      <div class="stat-number allowed">${stats.allowed}</div>
    </div>
    <div class="stat-card">
      <h3>唯一设备</h3>
      <div class="stat-number devices">${stats.uniqueDevices}</div>
    </div>
    <div class="stat-card">
      <h3>总访问量</h3>
      <div class="stat-number">${stats.totalAccesses}</div>
    </div>
  </div>
  
  <div class="token-section">
    <h2>🎬 酷9播放器专属令牌</h2>
    <p>此令牌仅对酷9播放器有效，其他软件使用此令牌会被拒绝。</p>
    
    <div class="token-display">
      <strong>当前酷9令牌：</strong><br>
      <code style="word-break:break-all;color:#d9534f;">${ku9Token}</code>
    </div>
    
    <div class="token-status ${isKu9TokenActive ? 'active' : 'inactive'}">
      ${isKu9TokenActive ? '✅ 令牌已激活' : '❌ 令牌已停用'}
    </div>
    
    <div class="token-controls">
      <button class="token-btn generate" onclick="generateKu9Token()">生成新令牌</button>
      <button class="token-btn" onclick="copyKu9Token()">复制令牌</button>
      ${isKu9TokenActive ? 
        `<button class="token-btn deactivate" onclick="toggleKu9Token(false)">停用令牌</button>` : 
        `<button class="token-btn generate" onclick="toggleKu9Token(true)">激活令牌</button>`
      }
      <button class="token-btn" onclick="showKu9Help()">使用说明</button>
    </div>
    
    <div class="ku9-help">
      <h4>酷9令牌使用说明：</h4>
      <p>1. 酷9播放器需要在请求头中添加：<code>X-Ku9-Token: ${ku9Token.substring(0, 20)}...</code></p>
      <p>2. 其他播放器使用此令牌会被拒绝访问</p>
      <p>3. 可以在后台标记特定UA为酷9播放器，绕过令牌验证</p>
      <p>4. 生成新令牌后，旧令牌立即失效</p>
    </div>
  </div>
  
  <div class="filters">
    <form method="get" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
      <input type="hidden" name="manage_token" value="${managementToken}">
      <select name="filter" class="filter-input">
        <option value="all" ${filter === 'all' ? 'selected' : ''}>所有UA</option>
        <option value="ku9" ${filter === 'ku9' ? 'selected' : ''}>酷9播放器</option>
        <option value="non_ku9" ${filter === 'non_ku9' ? 'selected' : ''}>非酷9</option>
        <option value="allowed" ${filter === 'allowed' ? 'selected' : ''}>允许访问</option>
        <option value="blocked" ${filter === 'blocked' ? 'selected' : ''}>阻止访问</option>
      </select>
      <input type="text" name="search" value="${searchKeyword}" placeholder="搜索UA..." class="filter-input">
      <select name="page_size" class="filter-input" style="width:100px;">
        <option value="50" ${pageSize === 50 ? 'selected' : ''}>每页50条</option>
        <option value="100" ${pageSize === 100 ? 'selected' : ''}>每页100条</option>
        <option value="200" ${pageSize === 200 ? 'selected' : ''}>每页200条</option>
      </select>
      <button type="submit" class="filter-btn">筛选</button>
      <button type="button" class="filter-btn" onclick="refreshUAList()">刷新列表</button>
    </form>
  </div>
  
  <div class="batch-controls">
    <span>批量操作：</span>
    <button class="batch-btn" onclick="selectAllUA()">全选</button>
    <button class="batch-btn" onclick="deselectAllUA()">全不选</button>
    <button class="batch-btn" onclick="invertSelection()">反选</button>
    <button class="batch-btn" onclick="batchMarkAsKu9()">批量标记为酷9</button>
    <button class="batch-btn" onclick="batchRemoveKu9Mark()">批量取消标记</button>
    <button class="batch-btn" onclick="batchAllowAccess()">批量允许访问</button>
    <button class="batch-btn" onclick="batchBlockAccess()">批量禁止访问</button>
  </div>
  
  <table class="ua-table">
    <thead>
      <tr>
        <th style="width:30px;"><input type="checkbox" id="selectAll" onclick="toggleSelectAll()"></th>
        <th>User-Agent</th>
        <th>设备ID</th>
        <th>设备类型</th>
        <th>访问次数</th>
        <th>最后访问</th>
        <th>酷9标记</th>
        <th>访问规则</th>
        <th>操作</th>
      </tr>
    </thead>
    <tbody>
      ${uaTableHTML}
    </tbody>
  </table>
  
  ${paginationHTML}
</div>

<div id="uaDetailModal" class="modal">
  <div class="modal-content">
    <div class="modal-header">
      <h3 class="modal-title">UA 详情分析</h3>
      <button class="close-btn" onclick="closeModal('uaDetailModal')">×</button>
    </div>
    <div id="uaDetailContent">
      <!-- 内容由JS动态填充 -->
    </div>
  </div>
</div>

<div id="ku9HelpModal" class="modal">
  <div class="modal-content">
    <div class="modal-header">
      <h3 class="modal-title">酷9播放器配置说明</h3>
      <button class="close-btn" onclick="closeModal('ku9HelpModal')">×</button>
    </div>
    <div id="ku9HelpContent" style="padding:15px;">
      <h4>方法一：使用酷9专属令牌</h4>
      <p>在酷9播放器的请求头中添加：</p>
      <div style="background:#f8f9fa;padding:10px;border-radius:5px;font-family:monospace;">
        X-Ku9-Token: ${ku9Token}
      </div>
      
      <h4 style="margin-top:20px;">方法二：后台标记为酷9播放器</h4>
      <p>在UA管理页面，找到酷9播放器的UA，点击"标记酷9"按钮。</p>
      
      <h4 style="margin-top:20px;">方法三：自动识别酷9播放器</h4>
      <p>系统会自动识别以下特征的UA为酷9播放器：</p>
      <ul>
        <li>包含 "ku9" 或 "酷9" 关键词</li>
        <li>UA为 "MTV"（酷9默认标识）</li>
        <li>包含 "K9Player" 或 "K9 Player"</li>
      </ul>
      
      <h4 style="margin-top:20px;">注意事项：</h4>
      <ul>
        <li>专属令牌只对酷9播放器有效</li>
        <li>其他播放器使用专属令牌会被拒绝</li>
        <li>可以在后台手动调整访问规则</li>
        <li>建议同时使用设备指纹进行精确识别</li>
      </ul>
    </div>
  </div>
</div>

<script>
// 酷9令牌管理
function generateKu9Token() {
  if (confirm('生成新令牌会使旧令牌立即失效，确定继续吗？')) {
    fetch('/api_generate_ku9_token?manage_token=${managementToken}', { method: 'POST' })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          alert('新令牌已生成：' + data.token.substring(0, 20) + '...');
          location.reload();
        } else {
          alert('生成失败: ' + (data.error || ''));
        }
      })
      .catch(error => {
        console.error('生成令牌失败:', error);
        alert('生成令牌失败');
      });
  }
}

function copyKu9Token() {
  const token = '${ku9Token}';
  navigator.clipboard.writeText(token)
    .then(() => alert('酷9令牌已复制到剪贴板'))
    .catch(err => alert('复制失败: ' + err));
}

function toggleKu9Token(activate) {
  const action = activate ? '激活' : '停用';
  if (confirm(`确定要${action}酷9令牌吗？`)) {
    fetch('/api_update_ku9_token?manage_token=${managementToken}', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'active=' + activate
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          alert(`酷9令牌已${action}`);
          location.reload();
        } else {
          alert(`${action}失败: ` + (data.error || ''));
        }
      })
      .catch(error => {
        console.error(`${action}令牌失败:`, error);
        alert(`${action}令牌失败`);
      });
  }
}

function showKu9Help() {
  document.getElementById('ku9HelpModal').style.display = 'block';
}

// UA详情显示
function showUADetail(uaHash) {
  fetch('/api_device_fingerprint?manage_token=${managementToken}&ua_hash=' + encodeURIComponent(uaHash))
    .then(response => response.json())
    .then(data => {
      const modal = document.getElementById('uaDetailModal');
      const content = document.getElementById('uaDetailContent');
      
      if (data.success && data.analysis) {
        const analysis = data.analysis;
        let html = '';
        
        html += \`
<div class="detail-section">
  <h4>基本信息</h4>
  <div class="detail-grid">
    <div class="detail-item">
      <div class="detail-label">UA哈希</div>
      <div class="detail-value">\${analysis.hash}</div>
    </div>
    <div class="detail-item">
      <div class="detail-label">设备ID</div>
      <div class="detail-value">\${analysis.deviceId || '无'}</div>
    </div>
    <div class="detail-item">
      <div class="detail-label">设备类型</div>
      <div class="detail-value">\${analysis.deviceType || '未知'}</div>
    </div>
    <div class="detail-item">
      <div class="detail-label">访问次数</div>
      <div class="detail-value">\${analysis.accessCount || 0}</div>
    </div>
  </div>
</div>

<div class="detail-section">
  <h4>标记状态</h4>
  <div class="detail-grid">
    <div class="detail-item">
      <div class="detail-label">酷9标记</div>
      <div class="detail-value">
        <span class="status-badge \${analysis.isKu9 ? 'status-ku9' : 'status-other'}">
          \${analysis.isKu9 ? '✅ 已标记为酷9' : '❌ 未标记'}
        </span>
      </div>
    </div>
    <div class="detail-item">
      <div class="detail-label">访问规则</div>
      <div class="detail-value">
        <span class="status-badge \${analysis.allowAccess ? 'status-allowed' : 'status-blocked'}">
          \${analysis.allowAccess ? '✅ 允许访问' : '❌ 禁止访问'}
        </span>
      </div>
    </div>
    <div class="detail-item">
      <div class="detail-label">标记人员</div>
      <div class="detail-value">\${analysis.markedBy || '系统自动'}</div>
    </div>
    <div class="detail-item">
      <div class="detail-label">标记时间</div>
      <div class="detail-value">\${analysis.markTime ? new Date(analysis.markTime).toLocaleString() : '未标记'}</div>
    </div>
  </div>
</div>

<div class="detail-section">
  <h4>完整 User-Agent</h4>
  <div class="ua-detail">\${analysis.userAgent || analysis.ua || '未知'}</div>
</div>

<div class="device-analysis">
  <h4>设备指纹分析</h4>
  <div class="detail-grid">
    <div class="detail-item">
      <div class="detail-label">操作系统</div>
      <div class="detail-value">\${analysis.os || '未知'}</div>
    </div>
    <div class="detail-item">
      <div class="detail-label">浏览器/播放器</div>
      <div class="detail-value">\${analysis.browser || '未知'}</div>
    </div>
    <div class="detail-item">
      <div class="detail-label">是否为酷9</div>
      <div class="detail-value">\${analysis.isKu9UA ? '✅ 是' : '❌ 否'}</div>
    </div>
    <div class="detail-item">
      <div class="detail-label">最后访问时间</div>
      <div class="detail-value">\${analysis.lastAccess ? new Date(analysis.lastAccess).toLocaleString() : '从未访问'}</div>
    </div>
  </div>
</div>

<div class="detail-section">
  <div class="detail-grid">
    <div class="detail-item">
      <div class="detail-label">操作</div>
      <div class="detail-value">
        <button class="action-btn \${analysis.isKu9 ? 'active' : ''}" onclick="toggleKu9Mark('\${analysis.hash}', \${!analysis.isKu9}); closeModal('uaDetailModal')">
          \${analysis.isKu9 ? '取消酷9标记' : '标记为酷9'}
        </button>
        <button class="action-btn \${analysis.allowAccess ? 'active' : ''}" onclick="toggleAccessRule('\${analysis.hash}', \${!analysis.allowAccess}); closeModal('uaDetailModal')">
          \${analysis.allowAccess ? '禁止访问' : '允许访问'}
        </button>
      </div>
    </div>
  </div>
</div>
\`;
        
        content.innerHTML = html;
        modal.style.display = 'block';
      } else {
        content.innerHTML = '<div style="padding:20px;text-align:center;">加载详情失败</div>';
        modal.style.display = 'block';
      }
    })
    .catch(error => {
      console.error('加载UA详情失败:', error);
      const content = document.getElementById('uaDetailContent');
      content.innerHTML = '<div style="padding:20px;text-align:center;">加载详情失败</div>';
      document.getElementById('uaDetailModal').style.display = 'block';
    });
}

// UA标记操作
function toggleKu9Mark(uaHash, isKu9) {
  const endpoint = isKu9 ? '/api_mark_as_ku9' : '/api_remove_ku9_mark';
  const action = isKu9 ? '标记为酷9' : '取消酷9标记';
  
  if (confirm(\`确定要\${action}吗？\`)) {
    fetch(endpoint + '?manage_token=${managementToken}', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'ua_hash=' + encodeURIComponent(uaHash)
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          alert(\`已\${action}\`);
          location.reload();
        } else {
          alert(\`\${action}失败: \` + (data.error || ''));
        }
      })
      .catch(error => {
        console.error(\`\${action}失败:\`, error);
        alert(\`\${action}失败\`);
      });
  }
}

function toggleAccessRule(uaHash, allowAccess) {
  const endpoint = '/api_set_access_rule';
  const action = allowAccess ? '允许访问' : '禁止访问';
  
  if (confirm(\`确定要\${action}吗？\`)) {
    fetch(endpoint + '?manage_token=${managementToken}', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'ua_hash=' + encodeURIComponent(uaHash) + '&allow_access=' + allowAccess
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          alert(\`已\${action}\`);
          location.reload();
        } else {
          alert(\`\${action}失败: \` + (data.error || ''));
        }
      })
      .catch(error => {
        console.error(\`\${action}失败:\`, error);
        alert(\`\${action}失败\`);
      });
  }
}

// 批量操作
function selectAllUA() {
  document.querySelectorAll('.ua-checkbox').forEach(checkbox => {
    checkbox.checked = true;
  });
  document.getElementById('selectAll').checked = true;
}

function deselectAllUA() {
  document.querySelectorAll('.ua-checkbox').forEach(checkbox => {
    checkbox.checked = false;
  });
  document.getElementById('selectAll').checked = false;
}

function invertSelection() {
  document.querySelectorAll('.ua-checkbox').forEach(checkbox => {
    checkbox.checked = !checkbox.checked;
  });
  updateSelectAllCheckbox();
}

function toggleSelectAll() {
  const selectAll = document.getElementById('selectAll').checked;
  document.querySelectorAll('.ua-checkbox').forEach(checkbox => {
    checkbox.checked = selectAll;
  });
}

function updateSelectAllCheckbox() {
  const checkboxes = document.querySelectorAll('.ua-checkbox');
  const allChecked = checkboxes.length > 0 && Array.from(checkboxes).every(cb => cb.checked);
  const noneChecked = checkboxes.length > 0 && Array.from(checkboxes).every(cb => !cb.checked);
  
  const selectAll = document.getElementById('selectAll');
  if (allChecked) {
    selectAll.checked = true;
    selectAll.indeterminate = false;
  } else if (noneChecked) {
    selectAll.checked = false;
    selectAll.indeterminate = false;
  } else {
    selectAll.checked = false;
    selectAll.indeterminate = true;
  }
}

// 为每个复选框添加事件监听
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.ua-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', updateSelectAllCheckbox);
  });
});

function getSelectedUAHashes() {
  const selected = [];
  document.querySelectorAll('.ua-checkbox:checked').forEach(checkbox => {
    selected.push(checkbox.value);
  });
  return selected;
}

function batchMarkAsKu9() {
  const hashes = getSelectedUAHashes();
  if (hashes.length === 0) {
    alert('请先选择要操作的UA');
    return;
  }
  
  if (confirm(\`确定要批量标记 \${hashes.length} 个UA为酷9播放器吗？\`)) {
    const promises = hashes.map(hash => 
      fetch('/api_mark_as_ku9?manage_token=${managementToken}', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'ua_hash=' + encodeURIComponent(hash)
      }).then(r => r.json())
    );
    
    Promise.all(promises)
      .then(results => {
        const successCount = results.filter(r => r.success).length;
        alert(\`批量标记完成，成功 \${successCount} 个，失败 \${hashes.length - successCount} 个\`);
        location.reload();
      })
      .catch(error => {
        console.error('批量标记失败:', error);
        alert('批量标记失败');
      });
  }
}

function batchRemoveKu9Mark() {
  const hashes = getSelectedUAHashes();
  if (hashes.length === 0) {
    alert('请先选择要操作的UA');
    return;
  }
  
  if (confirm(\`确定要批量取消 \${hashes.length} 个UA的酷9标记吗？\`)) {
    const promises = hashes.map(hash => 
      fetch('/api_remove_ku9_mark?manage_token=${managementToken}', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'ua_hash=' + encodeURIComponent(hash)
      }).then(r => r.json())
    );
    
    Promise.all(promises)
      .then(results => {
        const successCount = results.filter(r => r.success).length;
        alert(\`批量取消完成，成功 \${successCount} 个，失败 \${hashes.length - successCount} 个\`);
        location.reload();
      })
      .catch(error => {
        console.error('批量取消失败:', error);
        alert('批量取消失败');
      });
  }
}

function batchAllowAccess() {
  const hashes = getSelectedUAHashes();
  if (hashes.length === 0) {
    alert('请先选择要操作的UA');
    return;
  }
  
  if (confirm(\`确定要批量允许 \${hashes.length} 个UA访问吗？\`)) {
    const promises = hashes.map(hash => 
      fetch('/api_set_access_rule?manage_token=${managementToken}', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'ua_hash=' + encodeURIComponent(hash) + '&allow_access=true'
      }).then(r => r.json())
    );
    
    Promise.all(promises)
      .then(results => {
        const successCount = results.filter(r => r.success).length;
        alert(\`批量设置完成，成功 \${successCount} 个，失败 \${hashes.length - successCount} 个\`);
        location.reload();
      })
      .catch(error => {
        console.error('批量设置失败:', error);
        alert('批量设置失败');
      });
  }
}

function batchBlockAccess() {
  const hashes = getSelectedUAHashes();
  if (hashes.length === 0) {
    alert('请先选择要操作的UA');
    return;
  }
  
  if (confirm(\`确定要批量禁止 \${hashes.length} 个UA访问吗？\`)) {
    const promises = hashes.map(hash => 
      fetch('/api_set_access_rule?manage_token=${managementToken}', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'ua_hash=' + encodeURIComponent(hash) + '&allow_access=false'
      }).then(r => r.json())
    );
    
    Promise.all(promises)
      .then(results => {
        const successCount = results.filter(r => r.success).length;
        alert(\`批量设置完成，成功 \${successCount} 个，失败 \${hashes.length - successCount} 个\`);
        location.reload();
      })
      .catch(error => {
        console.error('批量设置失败:', error);
        alert('批量设置失败');
      });
  }
}

function refreshUAList() {
  location.reload();
}

// 模态框控制
function closeModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
}

// 点击模态框外部关闭
window.onclick = function(event) {
  if (event.target.classList.contains('modal')) {
    event.target.style.display = 'none';
  }
}
</script>
</body>
</html>`;
}

// 管理页面处理
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

// 访问日志页面处理
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
            } else if (filterType === 'device_id' && !log.deviceId.includes(filterValue)) {
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
      uniqueIPs: [...new Set(logs.map(log => log.ip))].length,
      uniqueDevices: [...new Set(logs.map(log => log.deviceId || log.ip))].length
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

// 访问日志页面 HTML
async function getLogsHTML(logs, currentPage, totalPages, stats, filterType, filterValue, managementToken) {
  // 生成日志表格行
  let logsTableHTML = '';
  
  if (logs.length > 0) {
    for (const log of logs) {
      const time = new Date(log.timestamp).toLocaleString('zh-CN', {
        year: 'numeric', month: '2-digit', day: '2-digit', 
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      }).replace(/\//g, '.');
      
      const statusClass = log.status === 'allowed' ? 'status-allowed' : 'status-blocked';
      const statusText = log.status === 'allowed' ? '✅ 允许' : '❌ 阻止';
      
      // 设备标识
      const deviceId = log.deviceId || log.ip || '未知';
      const deviceShort = deviceId.length > 20 ? deviceId.substring(0, 20) + '...' : deviceId;
      
      // 提取播放器特征
      const userAgent = log.userAgent || '';
      let playerType = '未知';
      let ku9Status = '';
      
      if (log.isKu9) {
        playerType = '🎬 酷9';
        ku9Status = 'ku9-marked';
      } else if (log.isKu9UA) {
        playerType = '🎬 酷9(自动)';
        ku9Status = 'ku9-auto';
      } else if (userAgent.toLowerCase().includes('tvbox') || userAgent.toLowerCase().includes('tv-box')) {
        playerType = 'TVBox';
      } else if (userAgent.toLowerCase().includes('kodi')) {
        playerType = 'Kodi';
      } else if (userAgent.toLowerCase().includes('vlc')) {
        playerType = 'VLC';
      } else if (userAgent.toLowerCase().includes('mozilla') || userAgent.toLowerCase().includes('chrome')) {
        playerType = '浏览器';
      }
      
      logsTableHTML += `
<tr>
  <td>${time}</td>
  <td><span class="${statusClass}">${statusText}</span></td>
  <td><code>${log.filename || 'N/A'}</code></td>
  <td>${log.ip || 'N/A'}</td>
  <td title="${deviceId}">${deviceShort}</td>
  <td><span class="player-type ${playerType.toLowerCase()} ${ku9Status}">${playerType}</span></td>
  <td>
    <div class="ua-preview" onclick="showUADetail('${log.uaHash ? log.uaHash.replace(/'/g, "\\'") : ''}')" title="点击查看完整UA">
      ${userAgent.length > 50 ? userAgent.substring(0, 50) + '...' : userAgent}
    </div>
  </td>
  <td>${log.reason || 'N/A'}</td>
  <td>
    <button class="action-btn detail-btn" onclick="showLogDetail('${log.id.replace(/'/g, "\\'")}')">详情</button>
    <button class="action-btn copy-btn" onclick="copyUAToClipboard('${userAgent.replace(/'/g, "\\'").replace(/"/g, '&quot;')}')">复制UA</button>
    ${log.uaHash ? `<button class="action-btn manage-btn" onclick="manageUA('${log.uaHash.replace(/'/g, "\\'")}')">管理UA</button>` : ''}
  </td>
</tr>
`;
    }
  } else {
    logsTableHTML = '<tr><td colspan="9" style="text-align:center;padding:20px;">暂无访问日志</td></tr>';
  }
  
  // 生成分页导航
  let paginationHTML = '';
  if (totalPages > 1) {
    paginationHTML = '<div class="pagination">';
    
    // 上一页
    if (currentPage > 1) {
      paginationHTML += `<a href="?manage_token=${managementToken}&page=${currentPage - 1}&filter_type=${filterType}&filter_value=${encodeURIComponent(filterValue)}" class="page-link">上一页</a>`;
    }
    
    // 页码
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
      if (i === currentPage) {
        paginationHTML += `<span class="page-link current">${i}</span>`;
      } else {
        paginationHTML += `<a href="?manage_token=${managementToken}&page=${i}&filter_type=${filterType}&filter_value=${encodeURIComponent(filterValue)}" class="page-link">${i}</a>`;
      }
    }
    
    // 下一页
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
.back-link:hover{background:#f0f0f0;}
.stats-grid{display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:15px;margin-bottom:20px;}
.stat-card{background:white;padding:15px;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,0.1);text-align:center;}
.stat-card h3{margin:0 0 8px 0;font-size:14px;color:#666;}
.stat-number{font-size:28px;font-weight:bold;color:#333;}
.stat-number.total{color:#4a6cf7;}
.stat-number.today{color:#28a745;}
.stat-number.allowed{color:#5cb85c;}
.stat-number.blocked{color:#d9534f;}
.stat-number.devices{color:#5bc0de;}
.filters{background:white;padding:15px;border-radius:8px;margin-bottom:15px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;}
.filter-input{padding:6px 10px;border:1px solid #ddd;border-radius:4px;min-width:200px;}
.filter-btn{background:#4a6cf7;color:white;border:none;padding:6px 15px;border-radius:4px;cursor:pointer;}
.filter-btn:hover{background:#3653d3;}
.logs-table{width:100%;border-collapse:collapse;background:white;border-radius:8px;overflow:hidden;box-shadow:0 2px 4px rgba(0,0,0,0.1);}
.logs-table th{background:#4a6cf7;color:white;padding:12px 8px;text-align:left;font-weight:normal;}
.logs-table td{padding:8px;border-bottom:1px solid #eee;}
.logs-table tr:hover{background:#f9f9f9;}
.status-allowed{color:#5cb85c;font-weight:bold;}
.status-blocked{color:#d9534f;font-weight:bold;}
.player-type{display:inline-block;padding:2px 8px;border-radius:12px;font-size:12px;font-weight:bold;}
.player-type.tvbox{background:#e3f2fd;color:#1976d2;}
.player-type.🎬 酷9, .player-type.ku9-marked{background:#fff3cd;color:#856404;border:1px solid #ffc107;}
.player-type.ku9-auto{background:#ffeaa7;color:#856404;}
.player-type.kodi{background:#fff3e0;color:#f57c00;}
.player-type.vlc{background:#f3e5f5;color:#7b1fa2;}
.player-type.浏览器{background:#ffebee;color:#d32f2f;}
.player-type.未知{background:#f5f5f5;color:#757575;}
.ua-preview{padding:4px;background:#f9f9f9;border-radius:3px;cursor:pointer;max-width:300px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-family:monospace;font-size:12px;}
.ua-preview:hover{background:#e3f2fd;}
.action-btn{padding:3px 8px;border:none;border-radius:3px;cursor:pointer;font-size:12px;margin:2px;}
.detail-btn{background:#5bc0de;color:white;}
.copy-btn{background:#5cb85c;color:white;}
.manage-btn{background:#ff9800;color:white;}
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
.ua-signature{margin-top:15px;padding:10px;background:#e3f2fd;border-radius:4px;}
.signature-title{font-weight:bold;margin-bottom:5px;color:#1976d2;}
.clear-logs-btn{background:#d9534f;color:white;border:none;padding:8px 15px;border-radius:4px;cursor:pointer;margin-left:10px;}
.clear-logs-btn:hover{background:#c9302c;}
.export-btn{background:#5cb85c;color:white;border:none;padding:8px 15px;border-radius:4px;cursor:pointer;margin-left:10px;}
.export-btn:hover{background:#4cae4c;}
.debug-info{background:#f8f9fa;border:1px solid #ddd;border-radius:5px;padding:10px;margin:15px 0;font-size:12px;color:#666;}
.debug-info h4{margin-top:0;color:#333;}
.ku9-warning{background:#fff3cd;border:1px solid #ffeaa7;border-radius:5px;padding:10px;margin:15px 0;}
.ku9-warning h4{margin-top:0;color:#856404;}
</style>
</head>

<body>
<div class="logs-container">
  <a href="./search.html?manage_token=${managementToken}" class="back-link">← 返回管理页面</a>
  <a href="./ua.html?manage_token=${managementToken}" class="back-link">🎬 UA管理</a>
  
  <div class="ku9-warning">
    <h4>🎬 酷9播放器识别说明：</h4>
    <p>✅ 标记为酷9：后台手动标记的酷9播放器</p>
    <p>✅ 自动识别：系统自动识别的酷9播放器</p>
    <p>✅ 专属令牌：酷9播放器可使用专属令牌访问</p>
    <p>✅ 设备指纹：同一设备多次访问会被识别</p>
  </div>
  
  <div class="debug-info">
    <h4>调试信息：</h4>
    <div>找到的日志总数：${stats.total} 条</div>
    <div>当前显示：${logs.length} 条（第${currentPage}/${totalPages}页）</div>
    <div>过滤器：${filterType} = "${filterValue}"</div>
  </div>
  
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
      <h3>唯一设备</h3>
      <div class="stat-number devices">${stats.uniqueDevices}</div>
    </div>
    <div class="stat-card">
      <h3>唯一UA</h3>
      <div class="stat-number">${stats.uniqueUserAgents}</div>
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
        <option value="device_id" ${filterType === 'device_id' ? 'selected' : ''}>设备ID</option>
        <option value="status" ${filterType === 'status' ? 'selected' : ''}>访问状态</option>
      </select>
      <input type="text" name="filter_value" value="${filterValue}" placeholder="筛选条件..." class="filter-input">
      <button type="submit" class="filter-btn">筛选</button>
      <button type="button" class="export-btn" onclick="exportLogs()">导出日志</button>
      <button type="button" class="clear-logs-btn" onclick="clearLogs()">清空日志</button>
    </form>
  </div>
  
  <table class="logs-table">
    <thead>
      <tr>
        <th>时间</th>
        <th>状态</th>
        <th>文件名</th>
        <th>IP地址</th>
        <th>设备ID</th>
        <th>播放器类型</th>
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

<div id="logDetailModal" class="modal">
  <div class="modal-content">
    <div class="modal-header">
      <h3 class="modal-title">日志详情</h3>
      <button class="close-btn" onclick="closeModal('logDetailModal')">×</button>
    </div>
    <div id="logDetailContent" class="log-detail"></div>
  </div>
</div>

<div id="uaDetailModal" class="modal">
  <div class="modal-content">
    <div class="modal-header">
      <h3 class="modal-title">User-Agent 详情</h3>
      <button class="close-btn" onclick="closeModal('uaDetailModal')">×</button>
    </div>
    <div id="uaDetailContent" class="log-detail"></div>
    <div id="uaSignature" class="ua-signature">
      <div class="signature-title">播放器特征码：</div>
      <div id="signatureContent"></div>
    </div>
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
        html += \`<strong>文件名：</strong> \${log.filename || 'N/A'}<br><br>\`;
        html += \`<strong>IP地址：</strong> \${log.ip || 'N/A'}<br><br>\`;
        html += \`<strong>设备ID：</strong> \${log.deviceId || 'N/A'}<br><br>\`;
        html += \`<strong>是否为酷9：</strong> \${log.isKu9 ? '✅ 是（已标记）' : (log.isKu9UA ? '✅ 是（自动识别）' : '❌ 否')}<br><br>\`;
        html += \`<strong>User-Agent：</strong><br>\${log.userAgent || 'N/A'}<br><br>\`;
        html += \`<strong>访问原因：</strong> \${log.reason || 'N/A'}<br><br>\`;
        html += \`<strong>Referer：</strong> \${log.referer || 'N/A'}<br><br>\`;
        html += \`<strong>Accept：</strong> \${log.accept || 'N/A'}<br><br>\`;
        html += \`<strong>UA哈希：</strong> \${log.uaHash || 'N/A'}<br><br>\`;
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

// 显示UA详情
function showUADetail(uaHash) {
  if (!uaHash) {
    alert('此日志没有UA哈希信息');
    return;
  }
  
  window.open('ua.html?manage_token=${managementToken}&search=' + encodeURIComponent(uaHash), '_blank');
}

// 管理UA
function manageUA(uaHash) {
  window.open('ua.html?manage_token=${managementToken}&search=' + encodeURIComponent(uaHash), '_blank');
}

// 关闭模态框
function closeModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
}

// 复制UA到剪贴板
function copyUAToClipboard(ua) {
  navigator.clipboard.writeText(ua)
    .then(() => alert('User-Agent 已复制到剪贴板'))
    .catch(err => alert('复制失败: ' + err));
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
  if (event.target.classList.contains('modal')) {
    event.target.style.display = 'none';
  }
}
</script>
</body>
</html>`;
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

// 搜索管理页面 HTML (search.php)
async function getSearchHTML(request, env, managementToken) {
  const url = new URL(request.url);
  const formData = await parseFormData(request);
  
  let messages = [];
  let searchResults = [];
  let keyword = formData.keyword || '';
  let includePwd = formData.include_pwd === 'on';
  let sortField = formData.sort_field || 'ctime';
  let sortOrder = formData.sort_order || 'desc';
  let searchPerformed = !!(formData.submit_search || formData.force_search);
  let showAll = !!(formData.show_all || formData.force_show_all);

  // 处理各种操作
  if (formData.save_remark) {
    const filename = formData.file_name;
    const remark = formData.remark_content;
    
    if (filename) {
      try {
        const safeFilename = sanitizeFilename(filename);
        if (remark && remark.trim() !== '') {
          await env.MY_TEXT_STORAGE.put('remark_' + safeFilename, remark.trim());
          messages.push('✅ 备注已保存：' + filename);
        } else {
          await env.MY_TEXT_STORAGE.delete('remark_' + safeFilename);
          messages.push('✅ 备注已清空：' + filename);
        }
        showAll = true;
      } catch (error) {
        console.error('保存备注失败:', error);
        messages.push('❌ 保存备注失败：' + error.message);
      }
    } else {
      messages.push('❌ 文件名不能为空');
    }
  }

  // 删除文件操作
  if (formData.delete_file) {
    const fileToDelete = formData.delete_file;
    try {
      const safeFilename = sanitizeFilename(fileToDelete);
      await env.MY_TEXT_STORAGE.delete('file_' + safeFilename);
      await env.MY_TEXT_STORAGE.delete('pwd_' + safeFilename);
      await env.MY_TEXT_STORAGE.delete('remark_' + safeFilename);
      await env.MY_TEXT_STORAGE.delete('meta_' + safeFilename);
      messages.push('✅ 已删除：' + fileToDelete);
      showAll = true;
    } catch (error) {
      messages.push('❌ 删除失败：' + error.message);
    }
  }

  // 批量删除操作
  if (formData.delete_selected && formData.selected_files) {
    const filesToDelete = Array.isArray(formData.selected_files) ? formData.selected_files : [formData.selected_files];
    let count = 0;
    let errorCount = 0;
    
    for (const fileName of filesToDelete) {
      try {
        const safeFileName = sanitizeFilename(fileName);
        await env.MY_TEXT_STORAGE.delete('file_' + safeFileName);
        await env.MY_TEXT_STORAGE.delete('pwd_' + safeFileName);
        await env.MY_TEXT_STORAGE.delete('remark_' + safeFileName);
        await env.MY_TEXT_STORAGE.delete('meta_' + safeFileName);
        count++;
      } catch (error) {
        errorCount++;
        console.error('删除文件失败:', fileName, error);
      }
    }
    
    if (errorCount > 0) {
      messages.push(`🍄 批量删除完成，成功 ${count} 个，失败 ${errorCount} 个`);
    } else {
      messages.push('🍄 批量删除 ' + count + ' 个文件');
    }
    showAll = true;
  }

  // 新建文件保存功能
  if (formData.save_file) {
    const filename = formData.file_name;
    const content = formData.file_content;
    const password = formData.file_password || 'default_password';
    
    if (filename) {
      try {
        const safeFilename = sanitizeFilename(filename);
        await env.MY_TEXT_STORAGE.put('file_' + safeFilename, content);
        await env.MY_TEXT_STORAGE.put('pwd_' + safeFilename, password);
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
        
        messages.push('✅ 保存成功：' + filename);
        showAll = true;
      } catch (error) {
        messages.push('❌ 保存失败：' + error.message);
      }
    } else {
      messages.push('⚠️ 文件名不能为空！');
    }
  }

  // 获取文件列表
  const allFiles = await env.MY_TEXT_STORAGE.list();
  const fileEntries = [];
  
  for (const key of allFiles.keys) {
    if (key.name.startsWith('file_')) {
      const filename = key.name.substring(5);
      
      // 过滤密码文件
      if (!includePwd && (filename.endsWith('.pwd') || filename.includes('.pwd.'))) {
        continue;
      }

      let shouldInclude = false;
      
      if (searchPerformed && keyword.trim() !== '') {
        const content = await env.MY_TEXT_STORAGE.get(key.name);
        if (content && (content.includes(keyword) || filename.includes(keyword))) {
          shouldInclude = true;
        }
      } else if (showAll) {
        shouldInclude = true;
      }

      if (shouldInclude) {
        // 获取元数据
        const metaKey = 'meta_' + filename;
        let metadata = { ctime: Date.now(), size: 0 };
        try {
          const metaData = await env.MY_TEXT_STORAGE.get(metaKey);
          if (metaData) {
            metadata = JSON.parse(metaData);
          } else {
            const fileContent = await env.MY_TEXT_STORAGE.get(key.name);
            metadata = {
              ctime: Date.now(),
              mtime: Date.now(),
              size: fileContent ? fileContent.length : 0
            };
            await env.MY_TEXT_STORAGE.put(metaKey, JSON.stringify(metadata));
          }
        } catch (e) {
          console.log('解析元数据失败:', e);
          const fileContent = await env.MY_TEXT_STORAGE.get(key.name);
          metadata = {
            ctime: Date.now(),
            mtime: Date.now(),
            size: fileContent ? fileContent.length : 0
          };
        }
        
        fileEntries.push({
          name: filename,
          size: metadata.size || 0,
          ctime: metadata.ctime || Date.now(),
          mtime: metadata.mtime || Date.now()
        });
      }
    }
  }

  // 排序
  fileEntries.sort((a, b) => {
    let result = 0;
    if (sortField === 'ctime') {
      result = a.ctime - b.ctime;
    } else if (sortField === 'mtime') {
      result = a.mtime - b.mtime;
    } else if (sortField === 'size') {
      result = a.size - b.size;
    } else {
      result = a.name.localeCompare(b.name);
    }
    return sortOrder === 'asc' ? result : -result;
  });

  searchResults = fileEntries;

  // 获取所有备注和密码
  const remarks = {};
  const passwords = {};
  
  for (const key of allFiles.keys) {
    if (key.name.startsWith('remark_')) {
      const filename = key.name.substring(7);
      try {
        const remark = await env.MY_TEXT_STORAGE.get(key.name);
        if (remark) {
          remarks[filename] = remark;
        }
      } catch (error) {
        console.error('获取备注失败:', filename, error);
      }
    }
    if (key.name.startsWith('pwd_')) {
      const filename = key.name.substring(4);
      try {
        const password = await env.MY_TEXT_STORAGE.get(key.name);
        if (password) {
          passwords[filename] = password;
        }
      } catch (error) {
        console.error('获取密码失败:', filename, error);
      }
    }
  }

  // 生成搜索结果的HTML
  let searchResultsHTML = '';
  if (searchResults.length > 0) {
    let fileListHTML = '';
    for (const r of searchResults) {
      const time = new Date(r.ctime).toLocaleString('zh-CN', {
        year: 'numeric', month: '2-digit', day: '2-digit', 
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      }).replace(/\//g, '.');
      
      const size = formatFileSize(r.size);
      const currentRemark = remarks[r.name] || '';
      const currentPassword = passwords[r.name] || '未设置';
      
      const safeRemark = currentRemark.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
      const remarkPreview = currentRemark ? 
        (currentRemark.length > 20 ? currentRemark.substring(0, 20) + '...' : currentRemark) : '';
      
      fileListHTML += `
<div class='file-item'>
  <input type='checkbox' name='selected_files[]' value='${r.name.replace(/"/g, '&quot;')}'>
  <a href='/z/${encodeURIComponent(r.name)}?manage_token=${managementToken}' class='file-link' target='_blank'>${r.name}</a>
  <span class='file-time'>🌷${time}</span>
  <span class='file-size'>🌵${size}</span>
  <button type='button' class='search-btn' onclick='editFile("${r.name.replace(/"/g, '&quot;')}", "${managementToken}")'>✏️编辑</button>
  <button type='button' class='remark-btn' onclick='editRemark("${r.name.replace(/"/g, '&quot;')}", "${safeRemark}")'>📝备注</button>
  <button type='button' class='password-btn' onclick='showPassword("${r.name.replace(/"/g, '&quot;')}", "${currentPassword.replace(/"/g, '&quot;')}")'>🔑密码</button>
  ${remarkPreview ? `<span class='remark-preview' title='${safeRemark}'>${remarkPreview}</span>` : ''}
  <button type='submit' name='delete_file' value='${r.name.replace(/"/g, '&quot;')}' class='delete-btn'>🍄</button>
</div>
`;
    }
    
    searchResultsHTML = `
<form method='post' onsubmit='return confirm("确定删除选中的文件吗？");'>
  <div class='select-controls'>
    <button type='button' class='search-btn' onclick='toggleSelectAll(true)'>全选</button>
    <button type='button' class='search-btn' onclick='toggleSelectAll(false)'>全不选</button>
    <button type='button' class='search-btn' onclick='invertSelection()'>反选</button>
  </div>
  <div class='file-list'>
    ${fileListHTML}
  </div>
  <button type='submit' name='delete_selected' class='batch-delete-btn'>🍄 批量删除选中</button>
</form>
`;
  } else if (searchPerformed || showAll) {
    searchResultsHTML = '<div>没有找到相关文件。</div>';
  }

  // 获取酷9令牌状态
  const ku9Token = await env.MY_TEXT_STORAGE.get('ku9_token') || 'ku9_default_token_' + Date.now().toString(36);
  
  // 返回完整的HTML页面
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>文件搜索与管理</title>
<style>
body{font-family:"Segoe UI",Tahoma,sans-serif;font-size:14px;color:#333;margin:0;padding:10px;}
.back-link{display:block;margin-bottom:15px;color:#4a6cf7;text-decoration:none;}
.search-input{padding:5px 8px;border:1px solid #ddd;width:300px;}
.search-btn{background:#4a6cf7;color:white;border:none;padding:6px 10px;cursor:pointer;margin:0 2px;}
.search-btn:hover{background:#3653d3;}
.delete-btn{background:none;border:none;color:#d9534f;cursor:pointer;font-size:16px;padding:0 4px;line-height:1;}
.delete-btn:hover{transform:scale(1.2);}
.batch-delete-btn{background:none;border:1px solid #d9534f;color:#d9534f;padding:5px 10px;cursor:pointer;font-size:14px;border-radius:4px;margin-top:8px;}
.batch-delete-btn:hover{background:#d9534f;color:white;}
.file-list{margin-top:10px;}
.file-item{padding:3px 0;display:flex;align-items:center;gap:6px;}
.file-link{text-decoration:none;color:#1a0dab;flex-shrink:0;}
.file-time{color:#d9534f;margin-left:5px;}
.file-size{color:#5cb85c;margin-left:5px;}
.remark-btn{background:none;border:none;color:#f0ad4e;cursor:pointer;font-size:14px;padding:0 4px;}
.remark-btn:hover{color:#ec971f;}
.password-btn{background:none;border:none;color:#5bc0de;cursor:pointer;font-size:14px;padding:0 4px;}
.password-btn:hover{color:#31b0d5;}
.remark-preview{color:#777;font-size:12px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-left:5px;}
.message{margin-bottom:10px;color:#007bff;}
input[type=checkbox]{margin-right:5px;}
.select-controls{margin:6px 0;}
.upload-progress{width:100%;height:18px;background:#eee;margin-top:5px;border-radius:4px;overflow:hidden;}
.upload-bar{height:100%;width:0%;background:#4a6cf7;color:white;text-align:center;font-size:12px;line-height:18px;}
.password-input{margin-top:6px;padding:6px;width:100%;box-sizing:border-box;border:1px solid #ddd;}
.security-note {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px;
  padding: 15px;
  margin: 15px 0;
}
.security-note h3 {
  margin-top: 0;
  color: white;
}
.security-list {
  list-style-type: none;
  padding: 0;
}
.security-list li {
  padding: 5px 0;
  display: flex;
  align-items: center;
  gap: 10px;
}
.security-list li:before {
  content: "✓ ";
  color: #4CAF50;
  font-weight: bold;
}
.management-token {
  background: #f8f9fa;
  border: 1px solid #28a745;
  border-radius: 5px;
  padding: 10px;
  margin: 15px 0;
}
.management-token h4 {
  margin-top: 0;
  color: #28a745;
}
.ku9-token-info {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 5px;
  padding: 10px;
  margin: 15px 0;
}
.ku9-token-info h4 {
  margin-top: 0;
  color: #856404;
}
.ku9-token-display {
  background: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 3px;
  padding: 8px;
  margin: 8px 0;
  font-family: monospace;
  word-break: break-all;
  font-size: 12px;
}
</style>
</head>

<body>
<a href="./" class="back-link">．．． 返回主页</a>
${messages.map(function(msg) { return '<div class="message">' + msg + '</div>'; }).join('')}

<div class="security-note">
  <h3>🛡️ 高级安全特性已启用</h3>
  <ul class="security-list">
    <li>✅ 动态时间加密 - 每次访问内容不同，防止抓包</li>
    <li>✅ 播放器白名单 - 只允许TVBox、酷9等</li>
    <li>✅ 抓包软件屏蔽 - 蓝鸟、黄鸟等无法访问</li>
    <li>✅ 汉字加密 - 所有文本动态加密</li>
    <li>✅ 管理豁免 - 此页面可直接访问文件</li>
    <li>✅ 酷9专属令牌 - 精确识别酷9播放器</li>
  </ul>
  <p style="color: #ffeb3b; font-weight: bold;">⚠️ 注意：通过 /z/ 下载的文件已加密，只有播放器能正常读取！</p>
</div>

<div class="ku9-token-info">
  <h4>🎬 酷9播放器专属令牌</h4>
  <p>当前酷9令牌（仅限酷9播放器使用）：</p>
  <div class="ku9-token-display">
    ${ku9Token.substring(0, 50)}...
  </div>
  <p style="font-size: 12px; color: #666;">
    <a href="ua.html?manage_token=${managementToken}" style="color: #4a6cf7; text-decoration: none;">🎬 前往UA管理页面配置酷9播放器</a>
  </p>
</div>

<div class="management-token">
  <h4>🔑 当前管理令牌：</h4>
  <p><code>${managementToken}</code></p>
  <p style="font-size: 12px; color: #666;">此令牌用于管理页面访问文件，请妥善保管！</p>
</div>

<form method="post" id="searchForm">
<input type="hidden" name="manage_token" value="${managementToken}">
<label>搜索词:</label>
<input type="text" name="keyword" class="search-input" value="${keyword.replace(/"/g, '&quot;')}">
<label><input type="checkbox" name="include_pwd" ${includePwd ? 'checked' : ''}> 显示密码文件(.pwd)</label>
<input type="hidden" id="sortField" name="sort_field" value="${sortField}">
<input type="hidden" id="sortOrder" name="sort_order" value="${sortOrder}">
<input type="submit" name="submit_search" class="search-btn" value="搜索">
<input type="submit" name="show_all" class="search-btn" value="显示全部文件">
<button type="button" class="search-btn" onclick="toggleSort('ctime')">时间排序 (${sortField==='ctime'?(sortOrder==='asc'?'↑':'↓'):'-'})</button>
<button type="button" class="search-btn" onclick="toggleSort('mtime')">修改时间 (${sortField==='mtime'?(sortOrder==='asc'?'↑':'↓'):'-'})</button>
<button type="button" class="search-btn" onclick="toggleSort('size')">大小排序 (${sortField==='size'?(sortOrder==='asc'?'↑':'↓'):'-'})</button>
<button type="button" class="search-btn" onclick="editFile('', '${managementToken}')">🆕 新建文件</button>
<button type="button" class="search-btn" onclick="uploadFiles('${managementToken}')">📤 上传文件</button>
<button type="button" class="search-btn" onclick="location.href='logs.html?manage_token=${managementToken}'">📊 访问日志</button>
<button type="button" class="search-btn" onclick="location.href='ua.html?manage_token=${managementToken}'">🎬 UA管理</button>
</form>

${searchResultsHTML}

<script>
// 格式化文件大小函数
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + 'B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(2) + 'KB';
  return (bytes / 1048576).toFixed(2) + 'MB';
}

// 排序功能
function toggleSort(field){
    const form = document.getElementById('searchForm');
    const fieldInput = document.getElementById('sortField');
    const orderInput = document.getElementById('sortOrder');
    
    if(fieldInput.value === field){
        orderInput.value = (orderInput.value === 'asc') ? 'desc' : 'asc';
    } else {
        fieldInput.value = field;
        orderInput.value = 'asc';
    }
    
    const oldForceSearch = document.getElementById('force_search');
    const oldForceShowAll = document.getElementById('force_show_all');
    if(oldForceSearch) oldForceSearch.remove();
    if(oldForceShowAll) oldForceShowAll.remove();
    
    ${searchPerformed ? `
    const hidden = document.createElement('input');
    hidden.type = 'hidden';
    hidden.name = 'force_search';
    hidden.id = 'force_search';
    hidden.value = '1';
    form.appendChild(hidden);
    ` : ''}
    
    ${showAll ? `
    const hidden = document.createElement('input');
    hidden.type = 'hidden';
    hidden.name = 'force_show_all';
    hidden.id = 'force_show_all';
    hidden.value = '1';
    form.appendChild(hidden);
    ` : ''}
    
    form.submit();
}

// 文件选择功能
function toggleSelectAll(check){
    const checkboxes = document.querySelectorAll('input[name="selected_files[]"]');
    checkboxes.forEach(function(checkbox) {
        checkbox.checked = check;
    });
}

function invertSelection(){
    const checkboxes = document.querySelectorAll('input[name="selected_files[]"]');
    checkboxes.forEach(function(checkbox) {
        checkbox.checked = !checkbox.checked;
    });
}

// 弹窗编辑/新建
function editFile(filename, manageToken){
    if(filename === undefined) filename = '';
    
    const existingModal = document.getElementById('editModal');
    const existingOverlay = document.getElementById('modalOverlay');
    if(existingModal) existingModal.remove();
    if(existingOverlay) existingOverlay.remove();

    const overlay = document.createElement('div');
    overlay.id = 'modalOverlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.3);z-index:999;';
    overlay.onclick = function(){overlay.remove(); modal.remove();};
    document.body.appendChild(overlay);

    const modal = document.createElement('form');
    modal.id = 'editModal';
    modal.method = 'post';
    modal.style.cssText = 'display:flex;flex-direction:column;position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:700px;max-width:95%;height:550px;min-height:350px;padding:10px;background:white;border:1px solid #ccc;box-shadow:0 0 12px rgba(0,0,0,0.3);z-index:1000;';
    
    modal.innerHTML = '<div id="modalHeader" style="cursor:move;padding:8px 10px;background:#f1f1f1;border-bottom:1px solid #ccc;display:flex;justify-content:space-between;align-items:center;"><span>编辑文件</span><div class="btn-group"><button type="button" id="maximizeBtn">🖥️ 最大化/恢复</button><span class="close-btn" style="cursor:pointer;color:#d9534f;font-weight:bold;font-size:16px;">×</span></div></div><input type="hidden" name="manage_token" value="' + manageToken + '"><input type="text" name="file_name" id="edit_file_name" style="width:100%;margin-top:6px;padding:6px;box-sizing:border-box;font-family:monospace;font-size:14px;"><input type="text" name="file_password" id="edit_file_password" placeholder="文件密码（新建文件必填）" style="width:100%;margin-top:6px;padding:6px;box-sizing:border-box;font-family:monospace;font-size:14px;"><textarea name="file_content" id="edit_file_content" style="flex:1;width:100%;margin-top:6px;padding:6px;box-sizing:border-box;font-family:monospace;font-size:14px;resize:none;"></textarea><button type="submit" name="save_file" class="search-btn" style="margin-top:6px;">💾 保存文件</button><div id="resizeHandle" style="width:15px;height:15px;background:#ccc;position:absolute;right:2px;bottom:2px;cursor:se-resize;"></div>';
    
    document.body.appendChild(modal);

    const fname = modal.querySelector('#edit_file_name');
    const fpassword = modal.querySelector('#edit_file_password');
    const fcontent = modal.querySelector('#edit_file_content');
    fname.value = filename;
    
    if(filename){
        fname.readOnly = true;
        fpassword.placeholder = "文件密码（编辑时无需修改）";
        fpassword.required = false;
        
        // 加载文件内容 - 使用管理令牌
        fetch('/z/' + encodeURIComponent(filename) + '?manage_token=' + encodeURIComponent(manageToken))
            .then(function(r){ return r.text(); })
            .then(function(t){ 
                fcontent.value = t; 
            })
            .catch(function(){ 
                fcontent.value = '(无法显示二进制文件，可直接保存覆盖)'; 
            });
    } else { 
        fname.readOnly = false; 
        fpassword.required = true;
        fcontent.value = ''; 
    }

    modal.querySelector('.close-btn').onclick = function(){modal.remove(); overlay.remove();};

    const header = modal.querySelector('#modalHeader');
    let isDragging = false, offsetX = 0, offsetY = 0;
    header.addEventListener('mousedown', function(e){
        if(e.target.tagName !== 'BUTTON'){
            isDragging = true;
            offsetX = e.clientX - modal.offsetLeft;
            offsetY = e.clientY - modal.offsetTop;
        }
    });
    
    document.addEventListener('mousemove', function(e){
        if(isDragging){
            modal.style.left = (e.clientX - offsetX) + 'px';
            modal.style.top = (e.clientY - offsetY) + 'px';
        }
    });
    
    document.addEventListener('mouseup', function(e){
        isDragging = false;
    });

    let isMaximized = false, prevSize = {width:0, height:0, left:0, top:0};
    const maximizeBtn = modal.querySelector('#maximizeBtn');
    maximizeBtn.onclick = function(){
        if(!isMaximized){
            prevSize.width = modal.offsetWidth;
            prevSize.height = modal.offsetHeight;
            prevSize.left = modal.offsetLeft;
            prevSize.top = modal.offsetTop;
            modal.style.left = '0';
            modal.style.top = '0';
            modal.style.width = '100%';
            modal.style.height = '100%';
            modal.style.transform = 'none';
            isMaximized = true;
        } else {
            modal.style.width = prevSize.width + 'px';
            modal.style.height = prevSize.height + 'px';
            modal.style.left = prevSize.left + 'px';
            modal.style.top = prevSize.top + 'px';
            modal.style.transform = 'translate(-50%,-50%)';
            isMaximized = false;
        }
        adjustTextarea();
    };

    const resizeHandle = modal.querySelector('#resizeHandle');
    let isResizing = false;
    resizeHandle.addEventListener('mousedown', function(e){
        e.stopPropagation();
        isResizing = true;
    });
    
    document.addEventListener('mousemove', function(e){
        if(isResizing){
            modal.style.width = (e.clientX - modal.offsetLeft) + 'px';
            modal.style.height = (e.clientY - modal.offsetTop) + 'px';
            adjustTextarea();
        }
    });
    
    document.addEventListener('mouseup', function(e){
        isResizing = false;
    });

    function adjustTextarea(){
        const headerHeight = header.offsetHeight;
        const nameHeight = fname.offsetHeight;
        const passwordHeight = fpassword.offsetHeight;
        const btnHeight = modal.querySelector('button[name="save_file"]').offsetHeight;
        const padding = 40;
        fcontent.style.height = (modal.offsetHeight - headerHeight - nameHeight - passwordHeight - btnHeight - padding) + 'px';
    }
    
    window.addEventListener('resize', adjustTextarea);
    adjustTextarea();
}

// 显示密码功能
function showPassword(filename, password){
    const existingModal = document.getElementById('passwordModal');
    const existingOverlay = document.getElementById('passwordOverlay');
    if(existingModal) existingModal.remove();
    if(existingOverlay) existingOverlay.remove();

    const overlay = document.createElement('div');
    overlay.id = 'passwordOverlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.3);z-index:999;';
    document.body.appendChild(overlay);

    const modal = document.createElement('div');
    modal.id = 'passwordModal';
    modal.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:400px;max-width:90%;padding:15px;background:white;border:1px solid #ccc;box-shadow:0 0 12px rgba(0,0,0,0.3);z-index:1000;';
    
    modal.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;"><span><strong>文件密码：</strong>' + filename + '</span><span class="close-btn" style="cursor:pointer;color:#d9534f;font-weight:bold;font-size:16px;">×</span></div><div style="padding:10px;background:#f9f9f9;border:1px solid #ddd;border-radius:4px;margin-bottom:10px;"><strong>密码：</strong><span style="font-family:monospace;color:#d9534f;">' + password + '</span></div><div style="display:flex;justify-content:space-between;"><button type="button" class="search-btn" onclick="copyPassword(\\'' + password + '\\')">📋 复制密码</button><button type="button" class="search-btn" onclick="editPassword(\\'' + filename + '\\', \\'' + password + '\\')">✏️ 修改密码</button></div>';
    
    document.body.appendChild(modal);

    modal.querySelector('.close-btn').onclick = function(){modal.remove(); overlay.remove();};
    overlay.onclick = function(){modal.remove(); overlay.remove();};
}

function copyPassword(password) {
    navigator.clipboard.writeText(password)
        .then(() => alert('密码已复制到剪贴板'))
        .catch(err => alert('复制失败: ' + err));
}

function editPassword(filename, currentPassword){
    const existingModal = document.getElementById('editPasswordModal');
    const existingOverlay = document.getElementById('editPasswordOverlay');
    if(existingModal) existingModal.remove();
    if(existingOverlay) existingOverlay.remove();

    const overlay = document.createElement('div');
    overlay.id = 'editPasswordOverlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.3);z-index:999;';
    document.body.appendChild(overlay);

    const modal = document.createElement('form');
    modal.id = 'editPasswordModal';
    modal.method = 'post';
    modal.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:400px;max-width:90%;padding:15px;background:white;border:1px solid #ccc;box-shadow:0 0 12px rgba(0,0,0,0.3);z-index:1000;';
    
    modal.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;"><span><strong>修改密码：</strong>' + filename + '</span><span class="close-btn" style="cursor:pointer;color:#d9534f;font-weight:bold;font-size:16px;">×</span></div><div style="margin-bottom:10px;"><label>当前密码：</label><span style="font-family:monospace;color:#777;">' + currentPassword + '</span></div><input type="text" name="new_password" placeholder="输入新密码" value="' + currentPassword + '" style="width:100%;padding:8px;box-sizing:border-box;border:1px solid #ddd;margin-bottom:10px;"><div style="display:flex;justify-content:space-between;"><button type="button" class="search-btn" onclick="updatePassword(\\'' + filename + '\\', this.form.new_password.value)">💾 更新密码</button></div>';
    
    document.body.appendChild(modal);

    modal.querySelector('.close-btn').onclick = function(){modal.remove(); overlay.remove();};
    overlay.onclick = function(){modal.remove(); overlay.remove();};
}

function updatePassword(filename, newPassword) {
    if (!newPassword) {
        alert('请输入新密码');
        return;
    }
    
    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'update_password.php', true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    
    const params = 'filename=' + encodeURIComponent(filename) + 
                  '&new_password=' + encodeURIComponent(newPassword);
    
    xhr.send(params);
    
    xhr.onload = function() {
        if(xhr.status === 200) {
            try {
                const response = JSON.parse(xhr.responseText);
                if(response.success) {
                    alert('密码更新成功');
                    document.getElementById('editPasswordModal').remove();
                    document.getElementById('editPasswordOverlay').remove();
                    document.getElementById('passwordModal').remove();
                    document.getElementById('passwordOverlay').remove();
                    location.reload();
                } else {
                    alert('密码更新失败: ' + (response.error || ''));
                }
            } catch(e) {
                alert('解析响应失败: ' + e.message);
            }
        } else {
            alert('请求失败: ' + xhr.statusText);
        }
    };
    
    xhr.onerror = function() {
        alert('网络错误');
    };
}

// 编辑备注弹窗
function editRemark(filename, currentRemark){
    if(currentRemark === undefined) currentRemark = '';
    
    const existingModal = document.getElementById('remarkModal');
    const existingOverlay = document.getElementById('remarkOverlay');
    if(existingModal) existingModal.remove();
    if(existingOverlay) existingOverlay.remove();

    const overlay = document.createElement('div');
    overlay.id = 'remarkOverlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.3);z-index:999;';
    document.body.appendChild(overlay);

    const modal = document.createElement('form');
    modal.id = 'remarkModal';
    modal.method = 'post';
    modal.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:500px;max-width:90%;padding:15px;background:white;border:1px solid #ccc;box-shadow:0 0 12px rgba(0,0,0,0.3);z-index:1000;';
    
    modal.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;"><span><strong>编辑备注：</strong>' + filename + '</span><span class="close-btn" style="cursor:pointer;color:#d9534f;font-weight:bold;font-size:16px;">×</span></div><input type="hidden" name="file_name" value="' + filename + '"><textarea name="remark_content" style="width:100%;height:120px;padding:8px;box-sizing:border-box;border:1px solid #ddd;resize:vertical;">' + currentRemark + '</textarea><div style="margin-top:10px;display:flex;justify-content:space-between;"><button type="button" class="search-btn" onclick="this.form.querySelector(\\'textarea\\').value=\\'\\'">清空备注</button><button type="submit" name="save_remark" value="1" class="search-btn">💾 保存备注</button></div>';
    
    document.body.appendChild(modal);

    modal.querySelector('.close-btn').onclick = function(){modal.remove(); overlay.remove();};
    overlay.onclick = function(){modal.remove(); overlay.remove();};
}

// 上传文件弹窗
function uploadFiles(manageToken){
    const existingModal = document.getElementById('uploadModal');
    const existingOverlay = document.getElementById('uploadOverlay');
    if(existingModal) existingModal.remove();
    if(existingOverlay) existingOverlay.remove();

    const overlay = document.createElement('div');
    overlay.id = 'uploadOverlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.3);z-index:999;';
    document.body.appendChild(overlay);

    const modal = document.createElement('div');
    modal.id = 'uploadModal';
    modal.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:500px;max-width:90%;max-height:80%;padding:10px;background:white;border:1px solid #ccc;box-shadow:0 0 12px rgba(0,0,0,0.3);z-index:1000;display:flex;flex-direction:column;';
    
    modal.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;"><span>上传文件</span><span class="close-btn" style="cursor:pointer;color:#d9534f;font-weight:bold;font-size:16px;">×</span></div><div style="margin-bottom:10px;"><input type="text" id="uploadPassword" placeholder="文件密码（默认：default_password）" style="width:100%;padding:6px;box-sizing:border-box;"></div><div id="uploadContent" style="flex:1;overflow:auto;padding:5px;border:1px dashed #aaa;display:flex;flex-direction:column;gap:4px;"><input type="file" id="fileInput" multiple><div id="fileList"></div><div id="progressContainer"></div></div><button id="startUpload" class="search-btn" style="margin-top:6px;">📤 开始上传</button>';
    
    document.body.appendChild(modal);

    modal.querySelector('.close-btn').onclick = function(){modal.remove(); overlay.remove();};

    const startBtn = modal.querySelector('#startUpload');
    const fileInput = modal.querySelector('#fileInput');
    const fileList = modal.querySelector('#fileList');
    const progressContainer = modal.querySelector('#progressContainer');
    const uploadPassword = modal.querySelector('#uploadPassword');

    fileInput.addEventListener('change', function() {
        fileList.innerHTML = '';
        for(let i = 0; i < this.files.length; i++) {
            const file = this.files[i];
            const fileItem = document.createElement('div');
            fileItem.style.cssText = 'padding:4px;border-bottom:1px solid #eee;font-size:12px';
            fileItem.textContent = file.name + ' (' + formatFileSize(file.size) + ')';
            fileList.appendChild(fileItem);
        }
    });

    startBtn.onclick = function(){
        const files = fileInput.files;
        if (files.length === 0) {
            alert('请选择要上传的文件');
            return;
        }

        const password = uploadPassword.value || 'default_password';
        let completedCount = 0;

        for(let i = 0; i < files.length; i++){
            const file = files[i];
            const progressBar = document.createElement('div');
            progressBar.className = 'upload-progress';
            progressBar.innerHTML = '<div class="upload-bar">0% - ' + file.name + '</div>';
            progressContainer.appendChild(progressBar);

            const reader = new FileReader();
            reader.onload = function(e) {
                const content = e.target.result;
                const xhr = new XMLHttpRequest();
                xhr.open('POST', 'upload.php', true);
                xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                
                xhr.onload = function(){
                    completedCount++;
                    if(xhr.status === 200){
                        try {
                            const response = JSON.parse(xhr.responseText);
                            if(response.success) {
                                progressBar.firstChild.style.width = '100%';
                                progressBar.firstChild.style.background = '#5cb85c';
                                progressBar.firstChild.textContent = '完成 - ' + file.name;
                            } else {
                                progressBar.firstChild.style.background = '#d9534f';
                                progressBar.firstChild.textContent = '失败 - ' + file.name + ': ' + response.error;
                            }
                        } catch(e) {
                            progressBar.firstChild.style.background = '#d9534f';
                            progressBar.firstChild.textContent = '错误 - ' + file.name;
                        }
                    } else {
                        progressBar.firstChild.style.background = '#d9534f';
                        progressBar.firstChild.textContent = '失败 - ' + file.name;
                    }
                    
                    if (completedCount === files.length) {
                        setTimeout(() => {
                            modal.remove();
                            overlay.remove();
                            location.reload();
                        }, 1000);
                    }
                };
                
                xhr.onerror = function(){
                    completedCount++;
                    progressBar.firstChild.style.background = '#d9534f';
                    progressBar.firstChild.textContent = '错误 - ' + file.name;
                    
                    if (completedCount === files.length) {
                        setTimeout(() => {
                            modal.remove();
                            overlay.remove();
                            location.reload();
                        }, 1000);
                    }
                };
                
                const params = 'filename=' + encodeURIComponent(file.name) + 
                              '&password=' + encodeURIComponent(password) + 
                              '&content=' + encodeURIComponent(content);
                xhr.send(params);
            };
            
            reader.onerror = function() {
                completedCount++;
                progressBar.firstChild.style.background = '#d9534f';
                progressBar.firstChild.textContent = '读取失败 - ' + file.name;
                
                if (completedCount === files.length) {
                    setTimeout(() => {
                        modal.remove();
                        overlay.remove();
                        location.reload();
                    }, 1000);
                }
            };
            
            reader.readAsText(file);
        }
    };
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

// 生成设备指纹
function generateDeviceFingerprint(request, userAgent) {
  try {
    const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
    const accept = request.headers.get('Accept') || '';
    const language = request.headers.get('Accept-Language') || '';
    const encoding = request.headers.get('Accept-Encoding') || '';
    
    // 生成设备ID：IP + UA哈希 + 其他特征
    const uaHash = simpleHash(userAgent);
    const fingerprintData = ip + uaHash + accept.substring(0, 20) + language.substring(0, 10);
    const deviceId = simpleHash(fingerprintData);
    
    // 分析UA特征
    const uaLower = userAgent.toLowerCase();
    let deviceType = 'unknown';
    let os = 'unknown';
    let browser = 'unknown';
    let isKu9UA = false;
    
    // 操作系统检测
    if (uaLower.includes('android')) {
      os = 'Android';
      deviceType = 'mobile';
    } else if (uaLower.includes('iphone') || uaLower.includes('ipad')) {
      os = 'iOS';
      deviceType = 'mobile';
    } else if (uaLower.includes('windows')) {
      os = 'Windows';
      deviceType = 'desktop';
    } else if (uaLower.includes('linux')) {
      os = 'Linux';
      deviceType = 'desktop';
    } else if (uaLower.includes('mac os')) {
      os = 'macOS';
      deviceType = 'desktop';
    }
    
    // 浏览器/播放器检测
    if (uaLower.includes('tvbox') || uaLower.includes('tv-box')) {
      browser = 'TVBox';
      deviceType = 'tv_player';
    } else if (uaLower.includes('ku9') || uaLower.includes('酷9') || userAgent === 'MTV' || uaLower.includes('k9player')) {
      browser = 'Ku9 Player';
      deviceType = 'tv_player';
      isKu9UA = true;
    } else if (uaLower.includes('kodi')) {
      browser = 'Kodi';
      deviceType = 'media_player';
    } else if (uaLower.includes('vlc')) {
      browser = 'VLC';
      deviceType = 'media_player';
    } else if (uaLower.includes('okhttp')) {
      browser = 'OkHttp';
      deviceType = 'http_client';
    } else if (uaLower.includes('curl')) {
      browser = 'cURL';
      deviceType = 'http_client';
    } else if (uaLower.includes('mozilla') || uaLower.includes('chrome') || uaLower.includes('safari')) {
      browser = 'Browser';
      deviceType = 'browser';
    }
    
    return {
      deviceId,
      uaHash,
      deviceType,
      os,
      browser,
      isKu9UA,
      ip,
      userAgent
    };
  } catch (error) {
    console.error('生成设备指纹失败:', error);
    return {
      deviceId: 'unknown_' + Date.now(),
      uaHash: simpleHash(userAgent || 'unknown'),
      deviceType: 'unknown',
      os: 'unknown',
      browser: 'unknown',
      isKu9UA: false,
      ip: 'unknown',
      userAgent: userAgent || 'unknown'
    };
  }
}

// 简单哈希函数
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  return Math.abs(hash).toString(36) + '_' + str.length.toString(36);
}

// 记录访问日志函数 - 增强版，包含设备指纹
async function logAccess(env, request, filename, status, reason, userAgent, ip) {
  try {
    const timestamp = Date.now();
    const logId = `log_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 生成设备指纹
    const fingerprint = generateDeviceFingerprint(request, userAgent);
    
    // 检查是否为酷9（标记或自动识别）
    let isKu9 = false;
    let isKu9UA = fingerprint.isKu9UA;
    let ku9Token = request.headers.get('X-Ku9-Token');
    
    // 检查UA标记
    const uaMarkKey = `ua_mark_${fingerprint.uaHash}`;
    const uaMark = await env.MY_TEXT_STORAGE.get(uaMarkKey);
    if (uaMark) {
      const mark = JSON.parse(uaMark);
      isKu9 = mark.isKu9 || false;
    }
    
    // 检查酷9令牌
    const validKu9Token = await env.MY_TEXT_STORAGE.get('ku9_token');
    const ku9TokenActive = await env.MY_TEXT_STORAGE.get('ku9_token_active');
    const isKu9TokenValid = ku9Token && validKu9Token && ku9Token === validKu9Token && ku9TokenActive !== 'false';
    
    const logData = {
      timestamp,
      filename: filename || 'unknown',
      status, // 'allowed' 或 'blocked' 或 'error'
      reason: reason || 'unknown',
      userAgent: userAgent || request.headers.get('User-Agent') || 'unknown',
      ip: ip || fingerprint.ip || 'unknown',
      deviceId: fingerprint.deviceId,
      uaHash: fingerprint.uaHash,
      deviceType: fingerprint.deviceType,
      os: fingerprint.os,
      browser: fingerprint.browser,
      isKu9: isKu9 || isKu9TokenValid,
      isKu9UA: isKu9UA,
      ku9TokenUsed: !!ku9Token,
      referer: request.headers.get('Referer') || '',
      accept: request.headers.get('Accept') || '',
      url: request.url,
      method: request.method
    };
    
    // 强制同步等待存储完成
    await env.MY_TEXT_STORAGE.put(logId, JSON.stringify(logData), { 
      expirationTtl: 2592000 // 30天过期
    });
    
    // 更新UA分析数据
    await updateUAAnalysis(env, fingerprint, logData);
    
    console.log('✅ 日志已保存:', logId, filename, status, reason, '酷9:', isKu9 || isKu9TokenValid);
    
    return true;
  } catch (error) {
    console.error('❌ 记录访问日志失败:', error);
    return false;
  }
}

// 更新UA分析数据
async function updateUAAnalysis(env, fingerprint, logData) {
  try {
    const uaKey = `ua_analysis_${fingerprint.uaHash}`;
    const existingData = await env.MY_TEXT_STORAGE.get(uaKey);
    
    let analysis = {
      hash: fingerprint.uaHash,
      userAgent: fingerprint.userAgent,
      deviceId: fingerprint.deviceId,
      deviceType: fingerprint.deviceType,
      os: fingerprint.os,
      browser: fingerprint.browser,
      isKu9UA: fingerprint.isKu9UA,
      firstAccess: logData.timestamp,
      lastAccess: logData.timestamp,
      accessCount: 1,
      lastStatus: logData.status,
      lastReason: logData.reason,
      ipHistory: [fingerprint.ip],
      filenameHistory: [logData.filename]
    };
    
    if (existingData) {
      const existing = JSON.parse(existingData);
      analysis.firstAccess = existing.firstAccess || logData.timestamp;
      analysis.accessCount = (existing.accessCount || 0) + 1;
      
      // 更新IP历史（去重）
      if (existing.ipHistory && Array.isArray(existing.ipHistory)) {
        analysis.ipHistory = [...new Set([...existing.ipHistory, fingerprint.ip])];
      }
      
      // 更新文件名历史（去重）
      if (existing.filenameHistory && Array.isArray(existing.filenameHistory)) {
        analysis.filenameHistory = [...new Set([...existing.filenameHistory, logData.filename])];
      }
    }
    
    await env.MY_TEXT_STORAGE.put(uaKey, JSON.stringify(analysis));
    
    // 更新设备指纹分析
    const deviceKey = `device_${fingerprint.deviceId}`;
    const deviceData = {
      deviceId: fingerprint.deviceId,
      uaHash: fingerprint.uaHash,
      userAgent: fingerprint.userAgent,
      deviceType: fingerprint.deviceType,
      os: fingerprint.os,
      browser: fingerprint.browser,
      ip: fingerprint.ip,
      lastAccess: logData.timestamp,
      accessCount: analysis.accessCount
    };
    
    await env.MY_TEXT_STORAGE.put(deviceKey, JSON.stringify(deviceData));
    
  } catch (error) {
    console.error('更新UA分析数据失败:', error);
  }
}

// 安全文件下载处理 - 增强版，支持酷9专属令牌
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

    // 检查管理令牌 - 如果存在管理令牌，返回原始内容
    const url = new URL(request.url);
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

    // 增强的用户代理检测和酷9令牌验证
    const userAgent = request.headers.get('User-Agent') || '';
    const referer = request.headers.get('Referer') || '';
    const accept = request.headers.get('Accept') || '';
    const ku9Token = request.headers.get('X-Ku9-Token');
    
    // 生成设备指纹
    const fingerprint = generateDeviceFingerprint(request, userAgent);
    
    // 检查酷9令牌
    const validKu9Token = await env.MY_TEXT_STORAGE.get('ku9_token') || 'ku9_default_token_' + Date.now().toString(36);
    const ku9TokenActive = await env.MY_TEXT_STORAGE.get('ku9_token_active');
    const isKu9TokenValid = ku9Token && ku9Token === validKu9Token && ku9TokenActive !== 'false';
    
    // 检查UA标记
    const uaMarkKey = `ua_mark_${fingerprint.uaHash}`;
    const uaMark = await env.MY_TEXT_STORAGE.get(uaMarkKey);
    let isKu9Marked = false;
    let allowAccessMarked = false;
    
    if (uaMark) {
      try {
        const mark = JSON.parse(uaMark);
        isKu9Marked = mark.isKu9 || false;
        allowAccessMarked = mark.allowAccess || false;
      } catch (error) {
        console.error('解析UA标记失败:', error);
      }
    }
    
    // 播放器白名单 - 修复酷9播放器问题
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
      'm3u', 'm3u8', 'hls',
      'mtv', 'MTV',  // 修复：添加MTV
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
    let isKu9Access = false;
    
    // 规则0：酷9专属令牌验证
    if (isKu9TokenValid) {
      // 检查是否为酷9播放器（标记或自动识别）
      if (isKu9Marked || fingerprint.isKu9UA) {
        allowAccess = true;
        reason = '酷9专属令牌访问';
        isKu9Access = true;
        console.log('✅ 酷9令牌验证通过:', fingerprint.deviceId);
      } else {
        // 非酷9播放器使用酷9令牌，拒绝访问
        allowAccess = false;
        reason = '非酷9播放器使用酷9令牌';
        console.log('❌ 非酷9播放器使用酷9令牌:', userAgent);
      }
    }
    // 规则1：检查酷9标记
    else if (isKu9Marked) {
      if (allowAccessMarked) {
        allowAccess = true;
        reason = '酷9标记访问';
        isKu9Access = true;
      } else {
        allowAccess = false;
        reason = '酷9标记但禁止访问';
      }
    }
    // 规则2：检查播放器白名单 - 修复酷9识别
    else if (fingerprint.isKu9UA) {
      allowAccess = true;
      reason = '酷9播放器自动识别';
      isKu9Access = true;
    }
    else if (playerWhitelist.some(player => {
      // 特殊处理MTV：完全匹配或包含
      if ((player === 'mtv' || player === 'MTV') && userAgent.trim() === 'MTV') {
        return true;
      }
      // 其他关键词：不区分大小写包含匹配
      return lowerUserAgent.includes(player.toLowerCase());
    })) {
      allowAccess = true;
      reason = '播放器访问';
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
      const logReason = reason + (ku9Token ? ' (使用酷9令牌)' : '');
      await logAccess(env, request, safeFilename, 'blocked', logReason, userAgent, 
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
          'X-Encryption-Time': timestamp.toString(),
          'X-Is-Ku9': isKu9Access ? 'true' : 'false'
        }
      });
    }
    
    // 记录允许的访问日志
    const logReason = reason + (isKu9Access ? ' (酷9播放器)' : '') + (ku9Token ? ' (使用令牌)' : '');
    await logAccess(env, request, safeFilename, 'allowed', logReason, userAgent, 
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
        'Access-Control-Allow-Headers': 'Content-Type, X-Client-Time, X-Management-Access, X-Ku9-Token, X-Device-ID',
        'X-Content-Type-Options': 'nosniff',
        'X-Encryption-Time': timestamp.toString(),
        'X-Encryption-Version': '1.0',
        'X-Is-Ku9': isKu9Access ? 'true' : 'false',
        'X-Device-ID': fingerprint.deviceId,
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

// API: 生成酷9令牌
async function handleGenerateKu9Token(request, env) {
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
    
    // 生成新的酷9令牌
    const newToken = 'ku9_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 16);
    await env.MY_TEXT_STORAGE.put('ku9_token', newToken);
    await env.MY_TEXT_STORAGE.put('ku9_token_active', 'true');
    
    console.log('✅ 生成新酷9令牌:', newToken.substring(0, 20) + '...');
    
    return new Response(JSON.stringify({
      success: true,
      token: newToken,
      message: '酷9令牌已生成'
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

// API: 更新酷9令牌状态
async function handleUpdateKu9Token(request, env) {
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
    
    const formData = await parseFormData(request);
    const active = formData.active === 'true' || formData.active === '1' || formData.active === true;
    
    await env.MY_TEXT_STORAGE.put('ku9_token_active', active ? 'true' : 'false');
    
    console.log(`✅ ${active ? '激活' : '停用'}酷9令牌`);
    
    return new Response(JSON.stringify({
      success: true,
      message: `酷9令牌已${active ? '激活' : '停用'}`
    }), {
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  } catch (error) {
    console.error('更新酷9令牌状态错误:', error);
    return new Response(JSON.stringify({
      success: false,
      error: `更新酷9令牌状态失败: ${error.message}`
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }
}

// API: 获取酷9令牌状态
async function handleKu9TokenStatus(request, env) {
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
    
    const token = await env.MY_TEXT_STORAGE.get('ku9_token') || '未设置';
    const active = await env.MY_TEXT_STORAGE.get('ku9_token_active');
    const isActive = active !== 'false';
    
    return new Response(JSON.stringify({
      success: true,
      token,
      active: isActive,
      message: isActive ? '令牌已激活' : '令牌已停用'
    }), {
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  } catch (error) {
    console.error('获取酷9令牌状态错误:', error);
    return new Response(JSON.stringify({
      success: false,
      error: `获取酷9令牌状态失败: ${error.message}`
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }
}

// API: UA管理 - 标记为酷9
async function handleMarkAsKu9(request, env) {
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
    
    const formData = await parseFormData(request);
    const uaHash = formData.ua_hash;
    
    if (!uaHash) {
      return new Response(JSON.stringify({
        success: false,
        error: '缺少UA哈希'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }
    
    // 获取UA信息
    const uaKey = `ua_analysis_${uaHash}`;
    const uaData = await env.MY_TEXT_STORAGE.get(uaKey);
    
    if (!uaData) {
      return new Response(JSON.stringify({
        success: false,
        error: 'UA不存在'
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }
    
    // 创建或更新标记
    const mark = {
      isKu9: true,
      allowAccess: true,
      markedBy: managementToken.substring(0, 20) + '...',
      markTime: Date.now(),
      ...JSON.parse(uaData)
    };
    
    await env.MY_TEXT_STORAGE.put(`ua_mark_${uaHash}`, JSON.stringify(mark));
    
    console.log(`✅ 标记UA为酷9: ${uaHash}`);
    
    return new Response(JSON.stringify({
      success: true,
      message: '已标记为酷9播放器'
    }), {
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  } catch (error) {
    console.error('标记酷9错误:', error);
    return new Response(JSON.stringify({
      success: false,
      error: `标记酷9失败: ${error.message}`
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }
}

// API: UA管理 - 移除酷9标记
async function handleRemoveKu9Mark(request, env) {
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
    
    const formData = await parseFormData(request);
    const uaHash = formData.ua_hash;
    
    if (!uaHash) {
      return new Response(JSON.stringify({
        success: false,
        error: '缺少UA哈希'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }
    
    // 移除标记
    await env.MY_TEXT_STORAGE.delete(`ua_mark_${uaHash}`);
    
    console.log(`✅ 移除酷9标记: ${uaHash}`);
    
    return new Response(JSON.stringify({
      success: true,
      message: '已移除酷9标记'
    }), {
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  } catch (error) {
    console.error('移除酷9标记错误:', error);
    return new Response(JSON.stringify({
      success: false,
      error: `移除酷9标记失败: ${error.message}`
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }
}

// API: UA管理 - 设置访问规则
async function handleSetAccessRule(request, env) {
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
    
    const formData = await parseFormData(request);
    const uaHash = formData.ua_hash;
    const allowAccess = formData.allow_access === 'true' || formData.allow_access === '1' || formData.allow_access === true;
    
    if (!uaHash) {
      return new Response(JSON.stringify({
        success: false,
        error: '缺少UA哈希'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }
    
    // 获取现有标记或创建新标记
    const markKey = `ua_mark_${uaHash}`;
    const existingMark = await env.MY_TEXT_STORAGE.get(markKey);
    
    let mark = {};
    if (existingMark) {
      mark = JSON.parse(existingMark);
    } else {
      // 获取UA信息
      const uaKey = `ua_analysis_${uaHash}`;
      const uaData = await env.MY_TEXT_STORAGE.get(uaKey);
      if (uaData) {
        mark = JSON.parse(uaData);
      }
    }
    
    // 更新访问规则
    mark.allowAccess = allowAccess;
    mark.markedBy = managementToken.substring(0, 20) + '...';
    mark.markTime = Date.now();
    
    await env.MY_TEXT_STORAGE.put(markKey, JSON.stringify(mark));
    
    console.log(`✅ 设置访问规则: ${uaHash} = ${allowAccess ? '允许' : '禁止'}`);
    
    return new Response(JSON.stringify({
      success: true,
      message: `已${allowAccess ? '允许' : '禁止'}访问`
    }), {
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  } catch (error) {
    console.error('设置访问规则错误:', error);
    return new Response(JSON.stringify({
      success: false,
      error: `设置访问规则失败: ${error.message}`
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }
}

// API: UA管理 - 获取UA列表
async function handleGetUAList(request, env) {
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
    
    const page = parseInt(url.searchParams.get('page')) || 1;
    const pageSize = parseInt(url.searchParams.get('page_size')) || 100;
    const filter = url.searchParams.get('filter') || 'all';
    
    // 获取所有UA数据
    const uaKeys = await env.MY_TEXT_STORAGE.list({ prefix: 'ua_analysis_' });
    const uaList = [];
    
    for (const key of uaKeys.keys) {
      try {
        const uaData = await env.MY_TEXT_STORAGE.get(key.name);
        if (uaData) {
          const data = JSON.parse(uaData);
          const uaHash = key.name.substring(12);
          
          // 获取UA标记
          const uaMark = await env.MY_TEXT_STORAGE.get(`ua_mark_${uaHash}`);
          if (uaMark) {
            const mark = JSON.parse(uaMark);
            data.isKu9 = mark.isKu9 || false;
            data.allowAccess = mark.allowAccess || false;
            data.markedBy = mark.markedBy || 'system';
            data.markTime = mark.markTime || Date.now();
          } else {
            data.isKu9 = false;
            data.allowAccess = false;
            data.markedBy = 'system';
            data.markTime = null;
          }
          
          uaList.push({
            hash: uaHash,
            ...data
          });
        }
      } catch (error) {
        console.error('解析UA数据失败:', key.name, error);
      }
    }
    
    // 过滤
    let filteredList = uaList;
    if (filter === 'ku9') {
      filteredList = uaList.filter(item => item.isKu9);
    } else if (filter === 'non_ku9') {
      filteredList = uaList.filter(item => !item.isKu9);
    } else if (filter === 'allowed') {
      filteredList = uaList.filter(item => item.allowAccess);
    } else if (filter === 'blocked') {
      filteredList = uaList.filter(item => !item.allowAccess && item.accessCount > 0);
    }
    
    // 排序（按访问次数倒序）
    filteredList.sort((a, b) => (b.accessCount || 0) - (a.accessCount || 0));
    
    // 分页
    const totalItems = filteredList.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);
    const paginatedList = filteredList.slice(startIndex, endIndex);
    
    return new Response(JSON.stringify({
      success: true,
      data: paginatedList,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages
      }
    }), {
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  } catch (error) {
    console.error('获取UA列表错误:', error);
    return new Response(JSON.stringify({
      success: false,
      error: `获取UA列表失败: ${error.message}`
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }
}

// API: 设备指纹分析
async function handleDeviceFingerprint(request, env) {
  try {
    const url = new URL(request.url);
    const managementToken = url.searchParams.get('manage_token');
    const expectedToken = await env.MY_TEXT_STORAGE.get('management_token') || 'default_manage_token_2024';
    const uaHash = url.searchParams.get('ua_hash');
    
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
    
    if (!uaHash) {
      return new Response(JSON.stringify({
        success: false,
        error: '缺少UA哈希'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }
    
    // 获取UA分析数据
    const uaKey = `ua_analysis_${uaHash}`;
    const uaData = await env.MY_TEXT_STORAGE.get(uaKey);
    
    if (!uaData) {
      return new Response(JSON.stringify({
        success: false,
        error: 'UA不存在'
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }
    
    const analysis = JSON.parse(uaData);
    analysis.hash = uaHash;
    
    // 获取UA标记
    const uaMark = await env.MY_TEXT_STORAGE.get(`ua_mark_${uaHash}`);
    if (uaMark) {
      const mark = JSON.parse(uaMark);
      analysis.isKu9 = mark.isKu9 || false;
      analysis.allowAccess = mark.allowAccess || false;
      analysis.markedBy = mark.markedBy || 'system';
      analysis.markTime = mark.markTime || Date.now();
    } else {
      analysis.isKu9 = false;
      analysis.allowAccess = false;
      analysis.markedBy = 'system';
      analysis.markTime = null;
    }
    
    return new Response(JSON.stringify({
      success: true,
      analysis
    }), {
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  } catch (error) {
    console.error('设备指纹分析错误:', error);
    return new Response(JSON.stringify({
      success: false,
      error: `设备指纹分析失败: ${error.message}`
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
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
            } else if (filterType === 'device_id' && !log.deviceId.includes(filterValue)) {
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
    csvRows.push(['时间', '状态', '文件名', 'IP地址', '设备ID', '设备类型', 'User-Agent', '原因', '是否为酷9', 'Referer', 'Accept', 'URL', '方法'].join(','));
    
    // 数据行
    for (const log of logs) {
      const time = new Date(log.timestamp).toISOString();
      const status = log.status;
      const filename = `"${(log.filename || '').replace(/"/g, '""')}"`;
      const ip = log.ip || '';
      const deviceId = log.deviceId || '';
      const deviceType = log.deviceType || '';
      const userAgent = `"${(log.userAgent || '').replace(/"/g, '""')}"`;
      const reason = `"${(log.reason || '').replace(/"/g, '""')}"`;
      const isKu9 = log.isKu9 ? '是' : '否';
      const referer = `"${(log.referer || '').replace(/"/g, '""')}"`;
      const accept = `"${(log.accept || '').replace(/"/g, '""')}"`;
      const url = `"${(log.url || '').replace(/"/g, '""')}"`;
      const method = log.method || '';
      
      csvRows.push([time, status, filename, ip, deviceId, deviceType, userAgent, reason, isKu9, referer, accept, url, method].join(','));
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
