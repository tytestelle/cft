// Cloudflare Pages Functions - 安全文本存储系统 (最终密钥验证版)
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
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Access-Key',
        'Access-Control-Max-Age': '86400',
      }
    });
  }

  try {
    // 主页 - 文本编辑器
    if (pathname === '/' || pathname === '/index.html') {
      return new Response(await getIndexHTML(env), {
        headers: { 
          'content-type': 'text/html;charset=UTF-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    }

    // 搜索管理页面 (保持不变，从您提供的代码中完整复制)
    if (pathname === '/search.html' || pathname === '/search.php') {
      return await handleManagementPage(request, env);
    }

    // API: 读取文件 (read0.php) (保持不变)
    if (pathname === '/read0.php' && request.method === 'GET') {
      return await handleReadFile(request, env);
    }

    // API: 上传文件 (upload.php) (保持不变)
    if (pathname === '/upload.php' && request.method === 'POST') {
      return await handleUploadFile(request, env);
    }

    // API: 更新密码 (update_password.php) (保持不变)
    if (pathname === '/update_password.php' && request.method === 'POST') {
      return await handleUpdatePassword(request, env);
    }

    // 动态加密文件下载 - ！！！核心修改部分！！！
    if (pathname.startsWith('/z/')) {
      const filename = pathname.substring(3);
      return await handleSecureFileDownload(filename, request, env);
    }

    // 默认返回主页
    return new Response(await getIndexHTML(env), {
      headers: { 
        'content-type': 'text/html;charset=UTF-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });

  } catch (error) {
    return new Response(`Error: ${error.message}`, { 
      status: 500,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      }
    });
  }
}

// ==================== 主页HTML (index.html) - 关键修改 ====================
async function getIndexHTML(env) {
  // 从环境变量获取访问密钥，如果没有则使用默认值
  const ACCESS_KEY = env.ACCESS_KEY || 'ku9_secure_2025_key';
  
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <style>
        /* ... (样式部分保持不变，从您提供的代码中完整复制) ... */
    </style>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>🔒安全编辑工具🔒 (密钥验证版)</title>
</head>

<body>
    <h2>🔐 文件转为<u>安全链接</u></h2>
    
    <div class="ku9-feature">
        <h4>✅ 密钥验证模式已启用：</h4>
        <p>1. <strong>任何</strong>播放器必须携带密钥才能看到真实内容</p>
        <p>2. 无密钥的浏览器/抓包软件看到加密内容</p>
        <p>3. 密钥可随时更换，安全性极高</p>
        <p>4. 管理页面可直接管理所有文件</p>
        <div style="background:#cce5ff; padding:8px; margin-top:8px; border-radius:4px;">
            <strong>📢 重要提示：</strong><br>
            生成的链接仅供编辑预览。酷9播放器使用时，请在链接后追加：<br>
            <code style="background:#f8f9fa;padding:2px 5px;">&access_key=${ACCESS_KEY}</code>
        </div>
    </div>
    
    <div class="blocked-software">
        <h4>🚫 保护机制：</h4>
        <p>无密钥访问将返回加密/错误内容，有效屏蔽抓包软件、TVBox助手及其他未授权客户端。</p>
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
    </form>
    <p>可在线编辑已有文件，输入相同文件名与密码。</p><br>    

    <div id="linkDisplay" style="display:none;">
        <div class="success-message">✅ 文件已成功转为安全链接：</div>
        <a id="linkAnchor" href="" target="_blank"></a>
        <button class="copy-btn" onclick="copyLink()">复制链接</button>
        
        <div class="encryption-info">
            <strong>🔒 安全说明：</strong><br>
            1. 此链接本身不含密钥，仅用于在网页编辑器中预览。<br>
            2. <strong>酷9播放器使用时，必须手动在链接后添加访问密钥参数。</strong><br>
            3. 例如：<code id="fullLinkExample" style="font-size:10px; word-break:break-all;"></code><br>
            4. 任何未携带正确密钥的访问都将收到加密内容。
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
        // 从页面中获取访问密钥（由后端注入）
        const ACCESS_KEY = '${ACCESS_KEY}';
        
        function readFile() {
            // ... (读取文件函数保持不变) ...
        }
        
        function uploadFile() {
            // ... (上传文件函数保持不变) ...
        }
        
        function showLink(link) {
            const linkDisplay = document.getElementById('linkDisplay');
            const linkAnchor = document.getElementById('linkAnchor');
            const fullLinkExample = document.getElementById('fullLinkExample');
            
            // 显示基础链接
            linkAnchor.href = link;
            linkAnchor.textContent = link;
            
            // 生成并显示携带完整密钥的链接示例
            const fullLink = link + '?access_key=' + encodeURIComponent(ACCESS_KEY);
            fullLinkExample.textContent = fullLink;
            
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

// ==================== 安全文件下载处理 (核心修复函数) ====================
async function handleSecureFileDownload(filename, request, env) {
  try {
    // 解码文件名
    const decodedFilename = decodeURIComponent(filename);
    const safeFilename = sanitizeFilename(decodedFilename);
    const content = await env.MY_TEXT_STORAGE.get('file_' + safeFilename);
    
    if (!content) {
      return new Response('文件不存在', { 
        status: 404,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }

    // 1. 最高权限：检查管理令牌 (来自search.html的访问)
    const url = new URL(request.url);
    const managementToken = url.searchParams.get('manage_token');
    const expectedManageToken = await env.MY_TEXT_STORAGE.get('management_token') || 'default_manage_token_2024';
    
    if (managementToken && managementToken === expectedManageToken) {
      return sendOriginalContent(safeFilename, content, 'management-token');
    }

    // 2. 核心验证：检查访问密钥
    const accessKey = url.searchParams.get('access_key');
    const expectedAccessKey = env.ACCESS_KEY || 'ku9_secure_2025_key'; // 从环境变量读取
    
    // 如果提供了正确的访问密钥，返回原始内容
    if (accessKey && accessKey === expectedAccessKey) {
      return sendOriginalContent(safeFilename, content, 'access-key-authorized');
    }

    // 3. 无有效密钥：返回加密/误导内容 (屏蔽TVBox助手、抓包软件等所有未授权访问)
    return sendEncryptedContent(safeFilename, content, request);
    
  } catch (error) {
    return new Response(`下载错误: ${error.message}`, { 
      status: 500,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      }
    });
  }
}

// ==================== 发送原始内容 ====================
function sendOriginalContent(filename, content, authType) {
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
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Auth-Type': authType, // 用于调试，了解是通过哪种方式授权的
      'X-Content-Status': 'original' // 表明这是原始内容
    }
  });
}

// ==================== 发送加密内容 (给未授权客户端) ====================
function sendEncryptedContent(filename, content, request) {
  const userAgent = request.headers.get('User-Agent') || '';
  const url = new URL(request.url);
  
  // 判断是否为疑似播放器的请求（用于返回更“真实”的假内容）
  const isLikelyPlayer = userAgent.includes('okhttp') || 
                         userAgent.includes('exoplayer') || 
                         userAgent.includes('player') ||
                         userAgent.toLowerCase().includes('tvbox');
  
  let finalContent = '';
  let contentType = 'text/plain; charset=utf-8';
  
  // 根据文件类型和客户端类型，返回不同的误导内容
  if (filename.endsWith('.m3u') || filename.endsWith('.m3u8')) {
    contentType = 'audio/x-mpegurl; charset=utf-8';
    
    if (isLikelyPlayer) {
      // 对播放器返回一个看似正常但无法播放的M3U列表
      finalContent = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-TARGETDURATION:10
#EXT-X-PLAYLIST-TYPE:VOD
# 访问被拒绝 - 缺少有效访问密钥
# 请联系资源提供者获取正确的带密钥链接
# 错误代码: 403_ACCESS_DENIED_NO_KEY
#EXTINF:10.0,
https://example.com/fake_segment_1.ts
#EXTINF:10.0,
https://example.com/fake_segment_2.ts
#EXT-X-ENDLIST`;
    } else {
      // 对浏览器等返回明显的错误信息
      finalContent = `# 安全保护已启用
# 您正在尝试访问受保护的内容
# 此文件需要通过特定播放器并携带访问密钥才能获取真实内容
# 当前时间: ${new Date().toISOString()}
# 请求路径: ${url.pathname}
# 状态: 访问被拒绝 (缺少密钥)`;
    }
    
  } else if (filename.endsWith('.json')) {
    contentType = 'application/json; charset=utf-8';
    finalContent = JSON.stringify({
      status: "error",
      code: 403,
      message: "Access denied. Valid access key required.",
      timestamp: new Date().toISOString(),
      note: "This is protected content. Please use the correct URL with access key parameter."
    }, null, 2);
    
  } else {
    // 默认的文本响应
    finalContent = `===========================================
        ACCESS DENIED - PROTECTED CONTENT
===========================================

This content is protected by a secure access system.

如果你使用的是酷9播放器：
1. 请确保你的链接包含正确的访问密钥参数
2. 正确的链接格式应为：${url.pathname}?access_key=您的密钥

如果这是其他播放器或浏览器：
你看到此信息是正常的安全防护。

检测信息：
- 文件: ${filename}
- 时间: ${new Date().toLocaleString('zh-CN')}
- 客户端: ${userAgent.substring(0, 80)}...

===========================================
技术支持：请使用正确的授权链接访问内容。
===========================================`;
  }
  
  return new Response(finalContent, {
    status: 200, // 仍然返回200，但内容是加密/误导的
    headers: {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Content-Status': 'protected', // 表明这是受保护的内容
      'X-Access-Required': 'key-required' // 提示需要密钥
    }
  });
}

// ==================== 辅助函数 ====================
// 文本混淆函数（保持不变）
function textObfuscation(content) {
  // ... (函数主体保持不变，从您提供的代码中完整复制) ...
}

// 文件名安全处理（保持不变）
function sanitizeFilename(name) {
  // ... (函数主体保持不变，从您提供的代码中完整复制) ...
}

// ==================== 其他保持不变的功能函数 ====================
// 由于您提供的原始代码非常长，此处省略那些与核心修复无关的重复函数。
// 以下函数应从您最初提供的代码中原样复制，它们的工作方式不变：

// 1. handleManagementPage() - 管理页面处理
// 2. getManagementLoginHTML() - 管理登录页面
// 3. getSearchHTML() - 搜索管理页面HTML
// 4. handleReadFile() - 读取文件处理
// 5. handleUploadFile() - 上传文件处理
// 6. handleUpdatePassword() - 更新密码处理
// 7. parseFormData() - 解析表单数据
// 8. formatFileSize() - 格式化文件大小

// 注意：请确保将这些函数从您最初提供的代码中完整复制过来。
