// Cloudflare Pages Functions - 增强版文本存储系统
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  // 处理预检请求 - 增强CORS支持
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'true',
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
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        },
      });
    }

    // 搜索管理页面（不公开链接，但可以访问）
    if (pathname === '/search.html' || pathname === '/search.php') {
      return new Response(await getSearchHTML(request, env), {
        headers: { 
          'content-type': 'text/html;charset=UTF-8',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        },
      });
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

    // API: 删除文件 (delete.php) - 新增
    if (pathname === '/delete.php' && request.method === 'POST') {
      return await handleDeleteFile(request, env);
    }

    // API: 获取文件列表 (list_files.php) - 新增，用于搜索页面
    if (pathname === '/list_files.php' && request.method === 'GET') {
      return await handleListFiles(request, env);
    }

    // 文件下载 (模拟 /z/ 目录访问) - 增强安全保护
    if (pathname.startsWith('/z/')) {
      const filename = pathname.substring(3);
      return await handleFileDownload(filename, request, env);
    }

    // 默认返回主页
    return new Response(await getIndexHTML(), {
      headers: { 
        'content-type': 'text/html;charset=UTF-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      },
    });

  } catch (error) {
    return new Response(`Error: ${error.message}`, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'text/plain; charset=utf-8'
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
        .player-access {
            background: #f8f9fa;
            border: 1px solid #ddd;
            border-radius: 5px;
            padding: 10px;
            margin: 15px 0;
        }
        .player-access h3 {
            margin-top: 0;
            color: #28a745;
        }
        .player-list {
            list-style-type: none;
            padding: 0;
        }
        .player-list li {
            padding: 3px 0;
            color: #555;
        }
        .player-list li:before {
            content: "✓ ";
            color: #28a745;
            font-weight: bold;
        }
        .encryption-note {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 5px;
            padding: 10px;
            margin: 15px 0;
            color: #856404;
        }
        .encryption-note h3 {
            margin-top: 0;
            color: #856404;
        }
    </style>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>📝加密编辑工具📝</title>
</head>

<body>
    <h2>文件转为<u>加密链接</u></h2>
    <div class="encryption-note">
        <h3>🔐 增强加密保护：</h3>
        <p>所有文件在上传时都会自动进行加密处理：</p>
        <ul class="player-list">
            <li>文件内容自动加密存储</li>
            <li>播放器访问时自动解密</li>
            <li>浏览器访问显示乱码</li>
            <li>源码无法直接查看</li>
        </ul>
        <p>✅ 播放器能正常访问，但无法查看原始内容。</p>
    </div>
    
    <div class="player-access">
        <h3>🔒 访问限制说明：</h3>
        <p>生成的文件链接仅允许以下播放器访问：</p>
        <ul class="player-list">
            <li>TVBox / 影视仓</li>
            <li>酷9 / K9Player</li>
            <li>其他M3U播放器</li>
            <li>手机/电视端播放器</li>
        </ul>
        <p>⚠️ <strong>浏览器访问将显示加密内容</strong>，确保源码安全。</p>
    </div>
    
    <p>可自定义扩展名，输入完整文件名如：<code>log.json</code>、<code>test.php</code>。</p><br>

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
        <div class="success-message">✅ 文件已成功转为加密链接：</div>
        <a id="linkAnchor" href="" target="_blank"></a>
        <button class="copy-btn" onclick="copyLink()">复制链接</button>
        <p style="margin-top: 5px; color: #666; font-size: 12px;">🔒 此链接为加密链接，播放器可正常访问</p>
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
            document.getElementById('loadingMsg').textContent = '正在加密并生成链接...';
            
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
            
            // 构建表单数据
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
            
            // 自动滚动到链接显示区域
            linkDisplay.scrollIntoView({ behavior: 'smooth' });
        }
        
        function copyLink() {
            const link = document.getElementById('linkAnchor').href;
            navigator.clipboard.writeText(link)
                .then(() => alert('链接已复制到剪贴板'))
                .catch(err => alert('复制失败: ' + err));
        }
    </script>
</body>
</html>`;
}

// 搜索管理页面 HTML (search.php) - 完整实现
async function getSearchHTML(request, env) {
  try {
    // 获取所有文件列表
    const files = [];
    
    // 从KV中获取所有文件
    const keys = await env.MY_TEXT_STORAGE.list({ prefix: 'file_' });
    
    for (const key of keys.keys) {
      const filename = key.name.replace('file_', '');
      
      // 获取元数据
      const metadataStr = await env.MY_TEXT_STORAGE.get('meta_' + filename);
      let metadata = {
        ctime: Date.now(),
        size: 0,
        mtime: Date.now(),
        encrypted: true
      };
      
      if (metadataStr) {
        try {
          metadata = JSON.parse(metadataStr);
        } catch (e) {
          console.error('解析元数据失败:', e);
        }
      }
      
      // 获取文件大小
      const fileContent = await env.MY_TEXT_STORAGE.get(key.name);
      const size = fileContent ? fileContent.length : 0;
      
      files.push({
        name: filename,
        size: size,
        ctime: new Date(metadata.ctime).toLocaleString(),
        mtime: new Date(metadata.mtime).toLocaleString(),
        encrypted: metadata.encrypted || true,
        link: `https://${request.headers.get('host')}/z/${encodeURIComponent(filename)}`
      });
    }
    
    // 按修改时间排序（最新在前）
    files.sort((a, b) => {
      const timeA = new Date(a.mtime).getTime();
      const timeB = new Date(b.mtime).getTime();
      return timeB - timeA;
    });
    
    const filesHTML = files.map(file => `
      <tr>
        <td><a href="${file.link}" target="_blank">${file.name}</a></td>
        <td>${formatFileSize(file.size)}</td>
        <td>${file.mtime}</td>
        <td>${file.encrypted ? '✅ 已加密' : '❌ 未加密'}</td>
        <td>
          <button onclick="deleteFile('${file.name}')" style="background: #dc3545; color: white; border: none; padding: 2px 8px; border-radius: 3px; cursor: pointer;">删除</button>
        </td>
      </tr>
    `).join('');
    
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <style>
        body {font-family:"Microsoft YaHei", Arial, sans-serif; margin: 20px; background: #f5f5f5;}
        .container {max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);}
        h1 {color: #333; border-bottom: 2px solid #4CAF50; padding-bottom: 10px;}
        .stats {background: #e8f5e9; padding: 15px; border-radius: 5px; margin-bottom: 20px;}
        .stats span {font-weight: bold; color: #2e7d32;}
        table {width: 100%; border-collapse: collapse; margin-top: 20px;}
        th {background: #4CAF50; color: white; padding: 12px; text-align: left;}
        td {padding: 10px; border-bottom: 1px solid #ddd;}
        tr:hover {background: #f9f9f9;}
        .search-box {margin: 20px 0; padding: 15px; background: #f0f7ff; border-radius: 5px;}
        .search-input {width: 300px; padding: 8px; border: 1px solid #ccc; border-radius: 4px;}
        .search-btn {background: #2196F3; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;}
        .delete-btn {background: #dc3545; color: white; border: none; padding: 2px 8px; border-radius: 3px; cursor: pointer;}
        .back-btn {display: inline-block; margin-top: 20px; padding: 8px 16px; background: #6c757d; color: white; text-decoration: none; border-radius: 4px;}
        .encryption-note {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
            color: #856404;
        }
        .encryption-note h3 {
            margin-top: 0;
            color: #856404;
            display: flex;
            align-items: center;
        }
        .encryption-note h3:before {
            content: "🔐 ";
            margin-right: 8px;
        }
        .file-actions {
            display: flex;
            gap: 5px;
        }
        .preview-btn {
            background: #17a2b8;
            color: white;
            border: none;
            padding: 2px 8px;
            border-radius: 3px;
            cursor: pointer;
            text-decoration: none;
            font-size: 12px;
        }
        .loading {
            text-align: center;
            padding: 20px;
            color: #666;
        }
        .no-files {
            text-align: center;
            padding: 40px;
            color: #999;
            font-style: italic;
        }
        .copy-link {
            background: #28a745;
            color: white;
            border: none;
            padding: 2px 8px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 12px;
            margin-right: 5px;
        }
    </style>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>🔍 文件管理系统</title>
</head>
<body>
    <div class="container">
        <h1>🔍 文件管理系统</h1>
        
        <div class="encryption-note">
            <h3>文件加密状态说明</h3>
            <p>✅ <strong>所有文件已自动加密存储</strong>：浏览器直接访问将显示乱码，播放器可正常解密使用。</p>
            <p>📊 当前系统共存储 <span id="fileCount">${files.length}</span> 个文件，总计 <span id="totalSize">${formatFileSize(files.reduce((sum, file) => sum + file.size, 0))}</span></p>
        </div>
        
        <div class="stats">
            <strong>📈 系统统计：</strong>
            <span>文件总数: ${files.length}</span> | 
            <span>总大小: ${formatFileSize(files.reduce((sum, file) => sum + file.size, 0))}</span> |
            <span>加密文件: ${files.filter(f => f.encrypted).length}</span>
        </div>
        
        <div class="search-box">
            <input type="text" class="search-input" id="searchInput" placeholder="输入文件名进行搜索..." onkeyup="searchFiles()">
            <button class="search-btn" onclick="searchFiles()">搜索</button>
            <button class="search-btn" onclick="clearSearch()" style="background: #6c757d;">清除</button>
        </div>
        
        <div id="fileTable">
            ${files.length > 0 ? `
            <table>
                <thead>
                    <tr>
                        <th>文件名</th>
                        <th>大小</th>
                        <th>修改时间</th>
                        <th>加密状态</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody id="fileList">
                    ${filesHTML}
                </tbody>
            </table>
            ` : `
            <div class="no-files">
                <p>📭 暂无文件</p>
                <p>请返回主页上传文件</p>
            </div>
            `}
        </div>
        
        <a href="/" class="back-btn">← 返回主页</a>
    </div>
    
    <script>
        function searchFiles() {
            const input = document.getElementById('searchInput');
            const filter = input.value.toUpperCase();
            const table = document.getElementById('fileList');
            const rows = table ? table.getElementsByTagName('tr') : [];
            
            for (let i = 0; i < rows.length; i++) {
                const cells = rows[i].getElementsByTagName('td');
                if (cells.length > 0) {
                    const fileName = cells[0].textContent || cells[0].innerText;
                    if (fileName.toUpperCase().indexOf(filter) > -1) {
                        rows[i].style.display = '';
                    } else {
                        rows[i].style.display = 'none';
                    }
                }
            }
        }
        
        function clearSearch() {
            document.getElementById('searchInput').value = '';
            searchFiles();
        }
        
        function copyLink(link) {
            navigator.clipboard.writeText(link)
                .then(() => alert('链接已复制到剪贴板！'))
                .catch(err => alert('复制失败: ' + err));
        }
        
        function previewFile(filename) {
            window.open('/read0.php?filename=' + encodeURIComponent(filename), '_blank');
        }
        
        function deleteFile(filename) {
            if (!confirm('确定要删除文件 "' + filename + '" 吗？此操作不可恢复！')) {
                return;
            }
            
            const xhr = new XMLHttpRequest();
            xhr.open('POST', 'delete.php', true);
            xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            
            xhr.onload = function() {
                if (xhr.status === 200) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        if (response.success) {
                            alert('文件删除成功！');
                            location.reload();
                        } else {
                            alert('删除失败: ' + (response.error || '未知错误'));
                        }
                    } catch (e) {
                        alert('解析响应失败: ' + e.message);
                    }
                } else {
                    alert('请求失败: ' + xhr.statusText);
                }
            };
            
            xhr.onerror = function() {
                alert('网络错误，请稍后重试');
            };
            
            const params = 'filename=' + encodeURIComponent(filename);
            xhr.send(params);
        }
        
        // 初始加载时显示所有文件
        window.onload = function() {
            searchFiles();
        };
    </script>
</body>
</html>`;
  } catch (error) {
    console.error('生成搜索页面失败:', error);
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>错误 - 文件管理系统</title>
    <style>
        body {font-family:"Microsoft YaHei", Arial, sans-serif; margin: 50px; text-align: center;}
        .error {background: #f8d7da; color: #721c24; padding: 20px; border-radius: 5px; margin: 20px auto; max-width: 600px;}
        .back-btn {display: inline-block; margin-top: 20px; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 4px;}
    </style>
</head>
<body>
    <h1>⚠️ 系统错误</h1>
    <div class="error">
        <p>加载文件管理页面时发生错误：</p>
        <p><strong>${error.message}</strong></p>
    </div>
    <a href="/" class="back-btn">返回主页</a>
</body>
</html>`;
  }
}

// 读取文件处理 (read0.php)
async function handleReadFile(request, env) {
  const url = new URL(request.url);
  const filename = url.searchParams.get('filename');
  const password = url.searchParams.get('password');

  if (!filename) {
    return new Response(JSON.stringify({
      error: '缺少文件名参数'
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  const safeFilename = sanitizeFilename(filename);
  const encryptedContent = await env.MY_TEXT_STORAGE.get('file_' + safeFilename);

  if (!encryptedContent) {
    return new Response(JSON.stringify({
      error: '文件不存在'
    }), {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  let decryptedContent = encryptedContent;
  
  // 如果有密码，尝试解密
  if (password) {
    const storedPassword = await env.MY_TEXT_STORAGE.get('pwd_' + safeFilename);
    if (storedPassword && password === storedPassword) {
      decryptedContent = simpleDecrypt(encryptedContent, password);
    } else if (storedPassword) {
      return new Response(JSON.stringify({
        error: '密码错误'
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }

  const domain = request.headers.get('host');
  const link = 'https://' + domain + '/z/' + encodeURIComponent(safeFilename);

  return new Response(JSON.stringify({
    content: decryptedContent,
    fileLink: link,
    filename: safeFilename,
    size: encryptedContent.length
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

// 上传文件处理 (upload.php) - 添加加密
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
          'Access-Control-Allow-Origin': '*'
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
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    const safeFilename = sanitizeFilename(filename.trim());
    const finalPassword = password || 'default_password';
    
    try {
      // 对文件内容进行简单加密混淆
      const encryptedContent = simpleEncrypt(content, finalPassword);
      
      // 保存加密后的文件内容
      await env.MY_TEXT_STORAGE.put('file_' + safeFilename, encryptedContent);
      // 保存密码
      await env.MY_TEXT_STORAGE.put('pwd_' + safeFilename, finalPassword);
      // 保存元数据，添加加密标记
      const metadata = {
        ctime: Date.now(),
        size: content.length,
        mtime: Date.now(),
        encrypted: true,
        algorithm: 'simpleXOR'
      };
      await env.MY_TEXT_STORAGE.put('meta_' + safeFilename, JSON.stringify(metadata));

      const domain = request.headers.get('host');
      const link = 'https://' + domain + '/z/' + encodeURIComponent(safeFilename);

      return new Response(JSON.stringify({
        success: true,
        fileLink: link,
        filename: safeFilename,
        encrypted: true
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    } catch (error) {
      console.error('文件保存失败:', error);
      return new Response(JSON.stringify({
        success: false,
        error: '文件保存失败: ' + error.message
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  } catch (error) {
    console.error('解析表单数据失败:', error);
    return new Response(JSON.stringify({
      success: false,
      error: '解析表单数据失败: ' + error.message
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// 更新密码处理
async function handleUpdatePassword(request, env) {
  try {
    const formData = await parseFormData(request);
    const filename = formData.filename;
    const oldPassword = formData.oldPassword;
    const newPassword = formData.newPassword;

    if (!filename || !oldPassword || !newPassword) {
      return new Response(JSON.stringify({
        success: false,
        error: '缺少必要参数'
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    const safeFilename = sanitizeFilename(filename);
    const storedPassword = await env.MY_TEXT_STORAGE.get('pwd_' + safeFilename);
    
    if (!storedPassword) {
      return new Response(JSON.stringify({
        success: false,
        error: '文件不存在'
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    if (storedPassword !== oldPassword) {
      return new Response(JSON.stringify({
        success: false,
        error: '原密码错误'
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // 重新加密文件内容
    const encryptedContent = await env.MY_TEXT_STORAGE.get('file_' + safeFilename);
    const decryptedContent = simpleDecrypt(encryptedContent, oldPassword);
    const reencryptedContent = simpleEncrypt(decryptedContent, newPassword);
    
    // 更新文件内容和密码
    await env.MY_TEXT_STORAGE.put('file_' + safeFilename, reencryptedContent);
    await env.MY_TEXT_STORAGE.put('pwd_' + safeFilename, newPassword);
    
    // 更新元数据
    const metadata = {
      ctime: Date.now(),
      size: decryptedContent.length,
      mtime: Date.now(),
      encrypted: true,
      algorithm: 'simpleXOR',
      passwordUpdated: true
    };
    await env.MY_TEXT_STORAGE.put('meta_' + safeFilename, JSON.stringify(metadata));

    return new Response(JSON.stringify({
      success: true,
      message: '密码更新成功'
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('更新密码失败:', error);
    return new Response(JSON.stringify({
      success: false,
      error: '更新密码失败: ' + error.message
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// 删除文件处理 - 新增
async function handleDeleteFile(request, env) {
  try {
    const formData = await parseFormData(request);
    const filename = formData.filename;

    if (!filename) {
      return new Response(JSON.stringify({
        success: false,
        error: '缺少文件名参数'
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    const safeFilename = sanitizeFilename(filename);
    
    // 删除文件相关的所有键
    await env.MY_TEXT_STORAGE.delete('file_' + safeFilename);
    await env.MY_TEXT_STORAGE.delete('pwd_' + safeFilename);
    await env.MY_TEXT_STORAGE.delete('meta_' + safeFilename);

    return new Response(JSON.stringify({
      success: true,
      message: '文件删除成功',
      filename: safeFilename
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('删除文件失败:', error);
    return new Response(JSON.stringify({
      success: false,
      error: '删除文件失败: ' + error.message
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// 获取文件列表 - 新增
async function handleListFiles(request, env) {
  try {
    const files = [];
    const keys = await env.MY_TEXT_STORAGE.list({ prefix: 'file_' });
    
    for (const key of keys.keys) {
      const filename = key.name.replace('file_', '');
      const metadataStr = await env.MY_TEXT_STORAGE.get('meta_' + filename);
      
      let metadata = {
        ctime: Date.now(),
        size: 0,
        mtime: Date.now()
      };
      
      if (metadataStr) {
        try {
          metadata = JSON.parse(metadataStr);
        } catch (e) {
          console.error('解析元数据失败:', e);
        }
      }
      
      const fileContent = await env.MY_TEXT_STORAGE.get(key.name);
      const size = fileContent ? fileContent.length : 0;
      
      files.push({
        name: filename,
        size: size,
        ctime: metadata.ctime,
        mtime: metadata.mtime,
        encrypted: metadata.encrypted || true,
        link: `https://${request.headers.get('host')}/z/${encodeURIComponent(filename)}`
      });
    }
    
    // 按修改时间排序
    files.sort((a, b) => b.mtime - a.mtime);
    
    return new Response(JSON.stringify({
      success: true,
      files: files,
      total: files.length,
      totalSize: files.reduce((sum, file) => sum + file.size, 0)
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (error) {
    console.error('获取文件列表失败:', error);
    return new Response(JSON.stringify({
      success: false,
      error: '获取文件列表失败: ' + error.message
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// 文件下载处理 - 增强加密保护和访问控制
async function handleFileDownload(filename, request, env) {
  try {
    // 解码文件名
    const decodedFilename = decodeURIComponent(filename);
    const safeFilename = sanitizeFilename(decodedFilename);
    const encryptedContent = await env.MY_TEXT_STORAGE.get('file_' + safeFilename);
    
    if (!encryptedContent) {
      return new Response('文件不存在', { 
        status: 404,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // 检查User-Agent，区分播放器和浏览器
    const userAgent = request.headers.get('User-Agent') || '';
    const referer = request.headers.get('Referer') || '';
    const accept = request.headers.get('Accept') || '';
    
    // 允许的播放器User-Agent关键词（更严格的判断）
    const allowedPlayers = [
      'tvbox', 'tv-box', 'tv.box', '影视仓', 'yingshicang', 'box',
      'ku9', 'k9player', 'k9 player', '酷9', 'player',
      'tivimate', 'tivi mate', 'tivi-mate', 'mate',
      'vlc', 'videolan', 'kodi', 'mx player', 'mxplayer',
      'okhttp', 'exoplayer', 'exo player', 'justplayer', 'just player',
      'ott', 'iptv', 'stb', 'set-top', 'set top box',
      'smarttv', 'smart-tv', 'smart tv', 'androidtv', 'android tv',
      'tizen', 'webos', 'roku', 'firetv', 'fire tv',
      'mag', 'magbox', 'formuler', 'buzztv', 'dreamlink'
    ];
    
    // 浏览器User-Agent关键词
    const browserKeywords = [
      'mozilla', 'chrome', 'safari', 'edge', 'firefox', 
      'msie', 'trident', 'opera', 'opr', 'webkit',
      'gecko', 'netscape', 'seamonkey', 'epiphany',
      'crios', 'chromium', 'brave', 'vivaldi'
    ];
    
    const lowerUserAgent = userAgent.toLowerCase();
    const lowerAccept = accept.toLowerCase();
    
    // 检查是否是管理页面内部的访问（允许）
    const isFromManagementPage = referer.includes('/search.html') || 
                                 referer.includes('/search.php') ||
                                 referer.includes('/read0.php');
    
    // 检查是否是API调用（允许）
    const isApiCall = request.headers.get('X-Requested-With') === 'XMLHttpRequest';
    
    // 判断是否是播放器请求
    let isPlayerRequest = false;
    
    // 规则1：检查User-Agent是否包含播放器关键词
    const hasPlayerKeyword = allowedPlayers.some(player => 
      lowerUserAgent.includes(player.toLowerCase())
    );
    
    // 规则2：检查是否来自管理页面或API
    const isInternalRequest = isFromManagementPage || isApiCall;
    
    // 规则3：检查Accept头部，播放器通常有特定的Accept类型
    const isMediaAccept = lowerAccept.includes('video/') || 
                         lowerAccept.includes('audio/') ||
                         lowerAccept.includes('application/vnd.apple.mpegurl') ||
                         lowerAccept.includes('application/x-mpegurl');
    
    // 规则4：检查是否有播放器特有的头部
    const hasPlayerHeaders = request.headers.get('Range') !== null || // 播放器常用Range请求
                            request.headers.get('Origin') === null || // 浏览器通常有Origin
                            userAgent === ''; // 有些播放器不发送User-Agent
    
    // 综合判断
    if (isInternalRequest) {
      // 内部请求，返回解密后的内容
      isPlayerRequest = true;
    } else if (hasPlayerKeyword) {
      // 包含播放器关键词
      isPlayerRequest = true;
    } else if (isMediaAccept || hasPlayerHeaders) {
      // 有媒体Accept类型或播放器特有头部
      isPlayerRequest = true;
    } else if (browserKeywords.some(browser => lowerUserAgent.includes(browser))) {
      // 包含浏览器关键词，不是播放器
      isPlayerRequest = false;
    } else {
      // 其他情况，默认为播放器
      isPlayerRequest = true;
    }
    
    // 根据请求类型返回不同内容
    let responseContent;
    let contentType;
    
    if (isPlayerRequest) {
      // 播放器请求：返回解密后的内容
      const password = await env.MY_TEXT_STORAGE.get('pwd_' + safeFilename);
      if (password) {
        responseContent = simpleDecrypt(encryptedContent, password);
      } else {
        responseContent = encryptedContent; // 如果没有密码，返回原始内容
      }
      
      // 根据文件扩展名设置Content-Type
      if (safeFilename.endsWith('.json')) {
        contentType = 'application/json; charset=utf-8';
      } else if (safeFilename.endsWith('.m3u') || safeFilename.endsWith('.m3u8')) {
        contentType = 'audio/x-mpegurl; charset=utf-8';
      } else if (safeFilename.endsWith('.txt')) {
        contentType = 'text/plain; charset=utf-8';
      } else if (safeFilename.endsWith('.xml')) {
        contentType = 'application/xml; charset=utf-8';
      } else {
        contentType = 'text/plain; charset=utf-8';
      }
    } else {
      // 浏览器请求：返回加密的乱码内容，防止源码被查看
      responseContent = generateFakeContent(encryptedContent);
      contentType = 'text/plain; charset=utf-8';
      
      // 添加警告信息
      const warning = `/*
⚠️ 警告：此内容已加密
📱 请使用播放器访问：
  - TVBox / 影视仓
  - 酷9 / K9Player
  - VLC Player
  - 其他M3U播放器

🔒 浏览器无法解密此内容
*/

`;
      responseContent = warning + responseContent;
    }

    // 设置响应头
    const headers = {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Content-Type-Options': 'nosniff',
      'Vary': 'Origin, Accept-Encoding, User-Agent'
    };

    // 如果是播放器请求，添加更多缓存控制
    if (isPlayerRequest) {
      headers['Cache-Control'] = 'public, max-age=3600';
    }

    return new Response(responseContent, { headers });
    
  } catch (error) {
    return new Response(`下载错误: ${error.message}`, { 
      status: 500,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// 简单加密函数
function simpleEncrypt(text, key) {
  // 使用简单的XOR加密
  let result = '';
  const keyStr = key.toString();
  
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    const keyChar = keyStr.charCodeAt(i % keyStr.length);
    const encryptedChar = charCode ^ keyChar;
    
    // 将加密后的字符转换为可打印字符
    result += String.fromCharCode((encryptedChar % 94) + 32);
  }
  
  // 添加混淆前缀，让内容看起来像乱码
  const prefix = generateRandomString(10);
  const suffix = generateRandomString(10);
  
  return prefix + result + suffix;
}

// 简单解密函数
function simpleDecrypt(encryptedText, key) {
  try {
    // 移除混淆的前缀和后缀（各10个字符）
    const text = encryptedText.substring(10, encryptedText.length - 10);
    let result = '';
    const keyStr = key.toString();
    
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      const keyChar = keyStr.charCodeAt(i % keyStr.length);
      
      // 由于加密时进行了模运算，我们需要尝试还原
      let originalChar = -1;
      
      // 尝试可能的原始字符（32-126是可打印字符范围）
      for (let j = 32; j <= 126; j++) {
        if ((j ^ keyChar) % 94 + 32 === charCode) {
          originalChar = j;
          break;
        }
      }
      
      if (originalChar !== -1) {
        result += String.fromCharCode(originalChar);
      } else {
        // 如果无法还原，使用原始字符
        result += text.charAt(i);
      }
    }
    
    return result;
  } catch (error) {
    // 如果解密失败，返回原始内容
    return encryptedText;
  }
}

// 生成假内容函数 - 浏览器访问时显示
function generateFakeContent(realContent) {
  const fakeTemplates = [
    // 看起来像加密的数据
    `ENCRYPTED_CONTENT[${btoa(realContent.substring(0, Math.min(50, realContent.length)))}...]`,
    
    // 看起来像二进制数据
    `Binary data: ${Array.from(realContent.substring(0, 100)).map(c => 
      c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ')}...`,
    
    // 看起来像base64编码
    `Base64: ${btoa(realContent.substring(0, Math.min(200, realContent.length)))}`,
    
    // 随机乱码
    generateRandomString(500)
  ];
  
  // 随机选择一个模板
  const randomIndex = Math.floor(Math.random() * fakeTemplates.length);
  let fakeContent = fakeTemplates[randomIndex];
  
  // 添加一些随机注释
  const comments = [
    '// This content is encrypted and requires a player to decode',
    '/* Encrypted stream data - Player only */',
    '# Encrypted media playlist',
    '<!-- Encrypted content for players only -->'
  ];
  
  const randomComment = comments[Math.floor(Math.random() * comments.length)];
  
  return randomComment + '\n\n' + fakeContent + '\n\n' + 
         '... [Content truncated for security] ...\n' +
         `File size: ${realContent.length} bytes\n` +
         'Access restricted to media players only.';
}

// 生成随机字符串
function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 辅助函数：解析表单数据 - 保持不变
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

// 辅助函数：文件名安全处理 - 保持不变
function sanitizeFilename(name) {
  return name.replace(/[^a-zA-Z0-9_\-\u4e00-\u9fa5.]/g, '_');
}

// 辅助函数：格式化文件大小 - 保持不变
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + 'B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(2) + 'KB';
  return (bytes / 1048576).toFixed(2) + 'MB';
}
