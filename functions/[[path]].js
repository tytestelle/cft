// Cloudflare Pages Functions - 完整文本存储系统
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

    // 搜索管理页面 - 修复备注功能
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

    // 文件下载 (模拟 /z/ 目录访问) - 修复TVBox访问问题
    if (pathname.startsWith('/z/')) {
      const filename = pathname.substring(3);
      return await handleFileDownload(filename, env);
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
    </style>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>📝编辑工具📝</title>
</head>

<body>
    <h2>文件转为<u>链接</u></h2>
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
        <div class="success-message">✅ 文件已成功转为链接：</div>
        <a id="linkAnchor" href="" target="_blank"></a>
        <button class="copy-btn" onclick="copyLink()">复制链接</button>
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
            document.getElementById('loadingMsg').textContent = '正在生成链接...';
            
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

// 搜索管理页面 HTML (search.php) - 修复备注功能
async function getSearchHTML(request, env) {
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

  // 处理各种操作 - 修复备注保存功能
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
        // 保存文件内容
        await env.MY_TEXT_STORAGE.put('file_' + safeFilename, content);
        // 保存密码
        await env.MY_TEXT_STORAGE.put('pwd_' + safeFilename, password);
        // 保存元数据
        const metadata = {
          ctime: Date.now(),
          size: content.length
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
            // 如果没有元数据，创建默认元数据
            const fileContent = await env.MY_TEXT_STORAGE.get(key.name);
            metadata = {
              ctime: Date.now(),
              size: fileContent ? fileContent.length : 0
            };
            await env.MY_TEXT_STORAGE.put(metaKey, JSON.stringify(metadata));
          }
        } catch (e) {
          console.log('解析元数据失败:', e);
          // 创建默认元数据
          const fileContent = await env.MY_TEXT_STORAGE.get(key.name);
          metadata = {
            ctime: Date.now(),
            size: fileContent ? fileContent.length : 0
          };
        }
        
        fileEntries.push({
          name: filename,
          size: metadata.size || 0,
          ctime: metadata.ctime || Date.now()
        });
      }
    }
  }

  // 排序
  fileEntries.sort((a, b) => {
    let result = 0;
    if (sortField === 'ctime') {
      result = a.ctime - b.ctime;
    } else if (sortField === 'size') {
      result = a.size - b.size;
    } else {
      result = a.name.localeCompare(b.name);
    }
    return sortOrder === 'asc' ? result : -result;
  });

  searchResults = fileEntries;

  // 获取所有备注和密码 - 修复备注获取
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

  // 生成搜索结果的HTML - 修复备注显示和表单提交
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
      
      // 修复备注显示：正确转义特殊字符
      const safeRemark = currentRemark.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
      const remarkPreview = currentRemark ? 
        (currentRemark.length > 20 ? currentRemark.substring(0, 20) + '...' : currentRemark) : '';
      
      fileListHTML += `
<div class='file-item'>
  <input type='checkbox' name='selected_files[]' value='${r.name.replace(/"/g, '&quot;')}'>
  <a href='/z/${encodeURIComponent(r.name)}' class='file-link' target='_blank'>${r.name}</a>
  <span class='file-time'>🌷${time}</span>
  <span class='file-size'>🌵${size}</span>
  <button type='button' class='search-btn' onclick='editFile("${r.name.replace(/"/g, '&quot;')}")'>✏️编辑</button>
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

  // 返回完整的HTML页面 - 修复备注表单提交
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
</style>
</head>

<body>
<a href="./" class="back-link">．．． 返回</a>
${messages.map(function(msg) { return '<div class="message">' + msg + '</div>'; }).join('')}

<form method="post" id="searchForm">
<label>搜索词:</label>
<input type="text" name="keyword" class="search-input" value="${keyword.replace(/"/g, '&quot;')}">
<label><input type="checkbox" name="include_pwd" ${includePwd ? 'checked' : ''}> 显示密码文件(.pwd)</label>
<input type="hidden" id="sortField" name="sort_field" value="${sortField}">
<input type="hidden" id="sortOrder" name="sort_order" value="${sortOrder}">
<input type="submit" name="submit_search" class="search-btn" value="搜索">
<input type="submit" name="show_all" class="search-btn" value="显示全部文件">
<button type="button" class="search-btn" onclick="toggleSort('ctime')">时间排序 (${sortField==='ctime'?(sortOrder==='asc'?'↑':'↓'):'-'})</button>
<button type="button" class="search-btn" onclick="toggleSort('size')">大小排序 (${sortField==='size'?(sortOrder==='asc'?'↑':'↓'):'-'})</button>
<button type="button" class="search-btn" onclick="editFile()">🆕 新建文件</button>
<button type="button" class="search-btn" onclick="uploadFiles()">📤 上传文件</button>
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
    
    // 移除旧的隐藏字段
    const oldForceSearch = document.getElementById('force_search');
    const oldForceShowAll = document.getElementById('force_show_all');
    if(oldForceSearch) oldForceSearch.remove();
    if(oldForceShowAll) oldForceShowAll.remove();
    
    // 添加新的隐藏字段
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
function editFile(filename){
    if(filename === undefined) filename = '';
    
    // 移除已存在的模态框
    const existingModal = document.getElementById('editModal');
    const existingOverlay = document.getElementById('modalOverlay');
    if(existingModal) existingModal.remove();
    if(existingOverlay) existingOverlay.remove();

    // 创建遮罩层
    const overlay = document.createElement('div');
    overlay.id = 'modalOverlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.3);z-index:999;';
    overlay.onclick = function(){overlay.remove(); modal.remove();};
    document.body.appendChild(overlay);

    // 创建模态框
    const modal = document.createElement('form');
    modal.id = 'editModal';
    modal.method = 'post';
    modal.style.cssText = 'display:flex;flex-direction:column;position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:700px;max-width:95%;height:550px;min-height:350px;padding:10px;background:white;border:1px solid #ccc;box-shadow:0 0 12px rgba(0,0,0,0.3);z-index:1000;';
    
    modal.innerHTML = '<div id="modalHeader" style="cursor:move;padding:8px 10px;background:#f1f1f1;border-bottom:1px solid #ccc;display:flex;justify-content:space-between;align-items:center;"><span>编辑文件</span><div class="btn-group"><button type="button" id="maximizeBtn">🖥️ 最大化/恢复</button><span class="close-btn" style="cursor:pointer;color:#d9534f;font-weight:bold;font-size:16px;">×</span></div></div><input type="text" name="file_name" id="edit_file_name" style="width:100%;margin-top:6px;padding:6px;box-sizing:border-box;font-family:monospace;font-size:14px;"><input type="text" name="file_password" id="edit_file_password" placeholder="文件密码（新建文件必填）" style="width:100%;margin-top:6px;padding:6px;box-sizing:border-box;font-family:monospace;font-size:14px;"><textarea name="file_content" id="edit_file_content" style="flex:1;width:100%;margin-top:6px;padding:6px;box-sizing:border-box;font-family:monospace;font-size:14px;resize:none;"></textarea><button type="submit" name="save_file" class="search-btn" style="margin-top:6px;">💾 保存文件</button><div id="resizeHandle" style="width:15px;height:15px;background:#ccc;position:absolute;right:2px;bottom:2px;cursor:se-resize;"></div>';
    
    document.body.appendChild(modal);

    const fname = modal.querySelector('#edit_file_name');
    const fpassword = modal.querySelector('#edit_file_password');
    const fcontent = modal.querySelector('#edit_file_content');
    fname.value = filename;
    
    if(filename){
        fname.readOnly = true;
        fpassword.placeholder = "文件密码（编辑时无需修改）";
        fpassword.required = false;
        
        // 加载文件内容
        fetch('/z/' + encodeURIComponent(filename))
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

    // 关闭按钮事件
    modal.querySelector('.close-btn').onclick = function(){modal.remove(); overlay.remove();};

    // 拖拽功能
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

    // 最大化/恢复功能
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

    // 调整大小功能
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
    // 移除已存在的模态框
    const existingModal = document.getElementById('passwordModal');
    const existingOverlay = document.getElementById('passwordOverlay');
    if(existingModal) existingModal.remove();
    if(existingOverlay) existingOverlay.remove();

    // 创建遮罩层
    const overlay = document.createElement('div');
    overlay.id = 'passwordOverlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.3);z-index:999;';
    document.body.appendChild(overlay);

    // 创建模态框
    const modal = document.createElement('div');
    modal.id = 'passwordModal';
    modal.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:400px;max-width:90%;padding:15px;background:white;border:1px solid #ccc;box-shadow:0 0 12px rgba(0,0,0,0.3);z-index:1000;';
    
    modal.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;"><span><strong>文件密码：</strong>' + filename + '</span><span class="close-btn" style="cursor:pointer;color:#d9534f;font-weight:bold;font-size:16px;">×</span></div><div style="padding:10px;background:#f9f9f9;border:1px solid #ddd;border-radius:4px;margin-bottom:10px;"><strong>密码：</strong><span style="font-family:monospace;color:#d9534f;">' + password + '</span></div><div style="display:flex;justify-content:space-between;"><button type="button" class="search-btn" onclick="copyPassword(\\'' + password + '\\')">📋 复制密码</button><button type="button" class="search-btn" onclick="editPassword(\\'' + filename + '\\', \\'' + password + '\\')">✏️ 修改密码</button></div>';
    
    document.body.appendChild(modal);

    // 关闭按钮事件
    modal.querySelector('.close-btn').onclick = function(){modal.remove(); overlay.remove();};
    overlay.onclick = function(){modal.remove(); overlay.remove();};
}

// 复制密码函数
function copyPassword(password) {
    navigator.clipboard.writeText(password)
        .then(() => alert('密码已复制到剪贴板'))
        .catch(err => alert('复制失败: ' + err));
}

// 修改密码功能
function editPassword(filename, currentPassword){
    // 移除已存在的模态框
    const existingModal = document.getElementById('editPasswordModal');
    const existingOverlay = document.getElementById('editPasswordOverlay');
    if(existingModal) existingModal.remove();
    if(existingOverlay) existingOverlay.remove();

    // 创建遮罩层
    const overlay = document.createElement('div');
    overlay.id = 'editPasswordOverlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.3);z-index:999;';
    document.body.appendChild(overlay);

    // 创建模态框
    const modal = document.createElement('form');
    modal.id = 'editPasswordModal';
    modal.method = 'post';
    modal.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:400px;max-width:90%;padding:15px;background:white;border:1px solid #ccc;box-shadow:0 0 12px rgba(0,0,0,0.3);z-index:1000;';
    
    modal.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;"><span><strong>修改密码：</strong>' + filename + '</span><span class="close-btn" style="cursor:pointer;color:#d9534f;font-weight:bold;font-size:16px;">×</span></div><div style="margin-bottom:10px;"><label>当前密码：</label><span style="font-family:monospace;color:#777;">' + currentPassword + '</span></div><input type="text" name="new_password" placeholder="输入新密码" value="' + currentPassword + '" style="width:100%;padding:8px;box-sizing:border-box;border:1px solid #ddd;margin-bottom:10px;"><div style="display:flex;justify-content:space-between;"><button type="button" class="search-btn" onclick="updatePassword(\\'' + filename + '\\', this.form.new_password.value)">💾 更新密码</button></div>';
    
    document.body.appendChild(modal);

    // 关闭按钮事件
    modal.querySelector('.close-btn').onclick = function(){modal.remove(); overlay.remove();};
    overlay.onclick = function(){modal.remove(); overlay.remove();};
}

// 更新密码函数
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

// 编辑备注弹窗 - 修复版本
function editRemark(filename, currentRemark){
    if(currentRemark === undefined) currentRemark = '';
    
    // 移除已存在的模态框
    const existingModal = document.getElementById('remarkModal');
    const existingOverlay = document.getElementById('remarkOverlay');
    if(existingModal) existingModal.remove();
    if(existingOverlay) existingOverlay.remove();

    // 创建遮罩层
    const overlay = document.createElement('div');
    overlay.id = 'remarkOverlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.3);z-index:999;';
    document.body.appendChild(overlay);

    // 创建模态框 - 修复：使用正确的表单字段名和提交方式
    const modal = document.createElement('form');
    modal.id = 'remarkModal';
    modal.method = 'post';
    modal.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:500px;max-width:90%;padding:15px;background:white;border:1px solid #ccc;box-shadow:0 0 12px rgba(0,0,0,0.3);z-index:1000;';
    
    modal.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;"><span><strong>编辑备注：</strong>' + filename + '</span><span class="close-btn" style="cursor:pointer;color:#d9534f;font-weight:bold;font-size:16px;">×</span></div><input type="hidden" name="file_name" value="' + filename + '"><textarea name="remark_content" style="width:100%;height:120px;padding:8px;box-sizing:border-box;border:1px solid #ddd;resize:vertical;">' + currentRemark + '</textarea><div style="margin-top:10px;display:flex;justify-content:space-between;"><button type="button" class="search-btn" onclick="this.form.querySelector(\\'textarea\\').value=\\'\\'">清空备注</button><button type="submit" name="save_remark" value="1" class="search-btn">💾 保存备注</button></div>';
    
    document.body.appendChild(modal);

    // 关闭按钮事件
    modal.querySelector('.close-btn').onclick = function(){modal.remove(); overlay.remove();};
    overlay.onclick = function(){modal.remove(); overlay.remove();};
}

// 上传文件弹窗
function uploadFiles(){
    // 移除已存在的模态框
    const existingModal = document.getElementById('uploadModal');
    const existingOverlay = document.getElementById('uploadOverlay');
    if(existingModal) existingModal.remove();
    if(existingOverlay) existingOverlay.remove();

    // 创建遮罩层
    const overlay = document.createElement('div');
    overlay.id = 'uploadOverlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.3);z-index:999;';
    document.body.appendChild(overlay);

    // 创建模态框
    const modal = document.createElement('div');
    modal.id = 'uploadModal';
    modal.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:500px;max-width:90%;max-height:80%;padding:10px;background:white;border:1px solid #ccc;box-shadow:0 0 12px rgba(0,0,0,0.3);z-index:1000;display:flex;flex-direction:column;';
    
    modal.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;"><span>上传文件</span><span class="close-btn" style="cursor:pointer;color:#d9534f;font-weight:bold;font-size:16px;">×</span></div><div style="margin-bottom:10px;"><input type="text" id="uploadPassword" placeholder="文件密码（默认：default_password）" style="width:100%;padding:6px;box-sizing:border-box;"></div><div id="uploadContent" style="flex:1;overflow:auto;padding:5px;border:1px dashed #aaa;display:flex;flex-direction:column;gap:4px;"><input type="file" id="fileInput" multiple><div id="fileList"></div><div id="progressContainer"></div></div><button id="startUpload" class="search-btn" style="margin-top:6px;">📤 开始上传</button>';
    
    document.body.appendChild(modal);

    // 关闭按钮事件
    modal.querySelector('.close-btn').onclick = function(){modal.remove(); overlay.remove();};

    const startBtn = modal.querySelector('#startUpload');
    const fileInput = modal.querySelector('#fileInput');
    const fileList = modal.querySelector('#fileList');
    const progressContainer = modal.querySelector('#progressContainer');
    const uploadPassword = modal.querySelector('#uploadPassword');

    // 显示选择的文件列表
    fileInput.addEventListener('change', function() {
        fileList.innerHTML = '';
        for(let i = 0; i < this.files.length; i++) {
            const file = this.files[i];
            const fileItem = document.createElement('div');
            fileItem.style.cssText = 'padding:4px;border-bottom:1px solid #eee;font-size:12px;';
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
                    
                    // 所有文件上传完成后刷新页面
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
                
                // 构建表单数据
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

// 读取文件处理 (read0.php)
async function handleReadFile(request, env) {
  const url = new URL(request.url);
  const filename = url.searchParams.get('filename');
  const password = url.searchParams.get('password');

  if (!filename || filename.trim() === '') {
    return new Response(JSON.stringify({error: '请提供文件名'}), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
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
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  // 检查密码文件是否存在
  const storedPassword = await env.MY_TEXT_STORAGE.get('pwd_' + safeFilename);
  if (!storedPassword) {
    return new Response(JSON.stringify({error: '密码文件不存在'}), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  // 验证密码
  if (!password || password.trim() === '') {
    return new Response(JSON.stringify({error: '请提供密码'}), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  if (storedPassword !== password.trim()) {
    return new Response(JSON.stringify({error: '密码错误'}), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  // 构建返回结果
  const domain = request.headers.get('host');
  const fileLink = 'https://' + domain + '/z/' + encodeURIComponent(safeFilename);

  const response = {
    content: fileContent,
    fileLink: fileLink
  };

  return new Response(JSON.stringify(response), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
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

    console.log('上传文件参数:', { filename, password: password ? '***' : '未提供', contentLength: content?.length });

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
      // 保存文件内容
      await env.MY_TEXT_STORAGE.put('file_' + safeFilename, content);
      // 保存密码
      await env.MY_TEXT_STORAGE.put('pwd_' + safeFilename, finalPassword);
      // 保存元数据
      const metadata = {
        ctime: Date.now(),
        size: content.length,
        mtime: Date.now()
      };
      await env.MY_TEXT_STORAGE.put('meta_' + safeFilename, JSON.stringify(metadata));

      const domain = request.headers.get('host');
      const link = 'https://' + domain + '/z/' + encodeURIComponent(safeFilename);

      console.log('文件保存成功:', safeFilename);

      return new Response(JSON.stringify({
        success: true,
        fileLink: link,
        filename: safeFilename
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
        'Access-Control-Allow-Origin': '*'
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
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // 只更新密码，不修改文件内容
    await env.MY_TEXT_STORAGE.put('pwd_' + safeFilename, newPassword.trim());

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
    return new Response(JSON.stringify({
      success: false,
      error: '密码更新失败: ' + error.message
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// 文件下载处理 - 增强浏览器兼容性
async function handleFileDownload(filename, env) {
  try {
    // 解码文件名，确保中文文件名正确显示
    const decodedFilename = decodeURIComponent(filename);
    const safeFilename = sanitizeFilename(decodedFilename);
    const content = await env.MY_TEXT_STORAGE.get('file_' + safeFilename);
    
    if (!content) {
      return new Response('文件不存在', { 
        status: 404,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Vary': 'Origin, Accept-Encoding'
        }
      });
    }

    // 为了更好的浏览器兼容性，设置适当的Content-Type
    let contentType = 'text/plain; charset=utf-8';
    
    // 根据文件扩展名设置合适的Content-Type
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
    }

    // 增强的响应头，提高浏览器兼容性
    const response = new Response(content, {
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Allow-Credentials': 'true',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Content-Type-Options': 'nosniff',
        'Vary': 'Origin, Accept-Encoding',
        'Content-Disposition': `inline; filename="${encodeURIComponent(safeFilename)}"`
      }
    });

    return response;
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
  // 允许中文、字母、数字、下划线、连字符和点
  return name.replace(/[^a-zA-Z0-9_\-\u4e00-\u9fa5.]/g, '_');
}

// 辅助函数：格式化文件大小
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + 'B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(2) + 'KB';
  return (bytes / 1048576).toFixed(2) + 'MB';
}
