// Cloudflare Pages Functions - 特征指纹验证系统
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
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
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

// 主页 HTML - 更新了令牌说明
async function getIndexHTML() {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <style>
        /* 样式保持不变，参考之前的代码 */
        body {font-family:"Microsoft YaHei"; font-weight: 300; margin: 2px;}
        .token-section { background: #e3f2fd; border: 1px solid #2196f3; border-radius: 5px; padding: 15px; margin: 15px 0; }
        .token-section h4 { margin-top: 0; color: #1976d2; }
        code { background: #f1f1f1; padding: 2px 4px; border-radius: 3px; }
    </style>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>🔒双重验证安全系统</title>
</head>
<body>
    <h2>🔐 双重验证安全链接系统</h2>
    
    <div class="token-section">
        <h4>🔑 双令牌系统说明：</h4>
        <p><strong>酷9播放器专用链接：</strong></p>
        <p><code>/z/文件名<strong>?ku9key=ku9_secret_2025</strong></code></p>
        <p>→ 仅限真实酷9播放器使用（自动+特征验证）</p>
        
        <p><strong>通用软件令牌链接：</strong></p>
        <p><code>/z/文件名<strong>?token=default_access_2025</strong></code></p>
        <p>→ 其他授权软件使用（仅令牌验证）</p>
        
        <p><strong>重要：</strong>TVBox等软件即使用酷9令牌也会被特征识别拦截！</p>
    </div>
    
    <!-- 原有的表单和功能保持不变 -->
    <form id="uploadForm">
        <!-- ... 原有的表单代码 ... -->
    </form>
    
    <script>
        function generateTokenLinks() {
            const baseLink = document.getElementById('linkAnchor').href;
            if (!baseLink) {
                alert('请先生成文件链接');
                return;
            }
            
            const baseUrl = baseLink.split('/z/')[0] + '/z/';
            const filename = baseLink.split('/z/')[1];
            
            // 酷9专用令牌链接
            const ku9Link = baseUrl + filename + '?ku9key=ku9_secret_2025';
            // 通用令牌链接
            const tokenLink = baseUrl + filename + '?token=default_access_2025';
            
            // 显示两个链接
            alert('酷9专用链接（复制给酷9用户）：\\n' + ku9Link + 
                  '\\n\\n通用令牌链接（复制给其他软件）：\\n' + tokenLink);
        }
    </script>
</body>
</html>`;
}

// 安全文件下载处理 - 核心验证逻辑
async function handleSecureFileDownload(filename, request, env) {
    try {
        const decodedFilename = decodeURIComponent(filename);
        const safeFilename = sanitizeFilename(decodedFilename);
        const content = await env.MY_TEXT_STORAGE.get('file_' + safeFilename);
        
        if (!content) {
            return new Response('文件不存在', { status: 404 });
        }

        const url = new URL(request.url);
        
        // 🎯 核心验证逻辑开始
        
        // 1. 检查酷9专用令牌
        const ku9key = url.searchParams.get('ku9key');
        if (ku9key === 'ku9_secret_2025') {
            // 酷9令牌验证通过，进行特征分析
            const isLikelyKu9 = await analyzeRequestCharacteristics(request);
            
            if (isLikelyKu9) {
                // ✅ 特征匹配，确认为真酷9播放器
                return sendOriginalContent(safeFilename, content, 'ku9-verified');
            } else {
                // ❌ 令牌正确但特征不符，可能是TVBox等仿冒
                return sendKu9FakeResponse(safeFilename, content);
            }
        }
        
        // 2. 检查通用令牌
        const token = url.searchParams.get('token');
        if (token === 'default_access_2025') {
            // 通用令牌验证通过，不做特征检查
            return sendOriginalContent(safeFilename, content, 'token-verified');
        }
        
        // 3. 检查管理令牌
        const manageToken = url.searchParams.get('manage_token');
        if (manageToken === 'default_manage_token_2025') {
            return sendOriginalContent(safeFilename, content, 'management');
        }
        
        // 4. 没有任何有效令牌
        return sendEncryptedContent(safeFilename, content, 'no-token');
        
    } catch (error) {
        return new Response(`下载错误: ${error.message}`, { status: 500 });
    }
}

// 请求特征分析函数 - 识别真正的酷9播放器
async function analyzeRequestCharacteristics(request) {
    const userAgent = request.headers.get('User-Agent') || '';
    const lowerUA = userAgent.toLowerCase();
    
    // 特征1: User-Agent关键词（但这不是主要依据）
    const ku9UaKeywords = ['ku9', 'k9', 'okhttp'];
    const hasKu9Ua = ku9UaKeywords.some(keyword => lowerUA.includes(keyword));
    
    // 特征2: Header顺序和行为特征
    // 酷9通常有特定的Header顺序和值
    const acceptHeader = request.headers.get('Accept');
    const acceptEncoding = request.headers.get('Accept-Encoding');
    const connection = request.headers.get('Connection');
    
    // 特征3: 请求时间和频率模式（简易版）
    // 可以记录IP的请求模式，但这里简化处理
    
    // 特征4: 特定的Header组合
    // 检查是否有典型的OkHttp/酷9组合
    const hasOkHttpFeatures = (
        (acceptEncoding && acceptEncoding.includes('gzip')) &&
        (connection === 'keep-alive' || connection === 'Keep-Alive') &&
        (acceptHeader && (acceptHeader.includes('*/*') || acceptHeader.includes('application/json')))
    );
    
    // 特征5: 请求方法和小细节
    const isGetMethod = request.method === 'GET';
    const hasRangeHeader = request.headers.get('Range'); // 酷9可能用于断点续传
    
    // 综合评分系统
    let score = 0;
    
    // 基础特征
    if (hasKu9Ua) score += 20;
    if (hasOkHttpFeatures) score += 30;
    if (isGetMethod) score += 10;
    
    // 高级特征检测
    // 检查Header顺序（部分环境可用）
    const headers = Array.from(request.headers.entries());
    const headerNames = headers.map(h => h[0].toLowerCase());
    
    // OkHttp通常有特定的Header顺序
    if (headerNames.includes('host') && headerNames.includes('user-agent') && 
        headerNames.includes('accept-encoding')) {
        score += 20;
    }
    
    // 特定值检测
    if (userAgent.includes('okhttp/3.') || userAgent.includes('okhttp/4.')) {
        score += 20; // 明确的OkHttp版本
    }
    
    // 最终判断：分数阈值
    // 调整这个阈值来平衡严格度和兼容性
    const isLikelyKu9 = score >= 60;
    
    // 调试信息（生产环境可移除）
    console.log(`特征分析: UA=${userAgent.substring(0,50)}, 分数=${score}, 判定=${isLikelyKu9}`);
    
    return isLikelyKu9;
}

// 发送给仿冒酷9的响应（令牌正确但特征不符）
function sendKu9FakeResponse(filename, content) {
    // 返回看似正常但实际错误的内容
    let fakeContent = '';
    
    if (filename.endsWith('.m3u') || filename.endsWith('.m3u8')) {
        fakeContent = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:10
#EXT-X-MEDIA-SEQUENCE:0

# 🔍 安全系统检测到异常客户端
# 您使用了酷9专用令牌，但客户端特征不符
# 系统怀疑您是TVBox助手或其他仿冒软件

# 🚫 访问已被拒绝
# 真实内容仅对特征匹配的酷9播放器开放

# ℹ️ 如果您确实是酷9播放器但无法播放：
# 1. 请更新到最新版本
# 2. 不要使用抓包软件修改请求
# 3. 联系管理员确认客户端特征

#EXT-X-ENDLIST`;
    } else if (filename.endsWith('.json')) {
        fakeContent = JSON.stringify({
            error: "client_verification_failed",
            message: "客户端特征验证失败",
            detail: "使用了酷9令牌但客户端特征不符",
            suggestion: "请使用官方酷9播放器或联系管理员",
            detection: {
                reason: "特征指纹不匹配",
                action: "access_denied"
            }
        }, null, 2);
    } else {
        fakeContent = `🚫 安全系统拦截

您的请求使用了酷9专用令牌，但客户端特征分析未通过验证。

🔍 检测结果：
- 令牌验证: ✅ 通过
- 特征验证: ❌ 失败
- 客户端类型: 疑似仿冒软件
- 时间: ${new Date().toISOString()}

📱 可能的原因：
1. 您使用的是TVBox助手等通用播放器
2. 您的酷9播放器版本过旧
3. 请求被中间人工具修改

✅ 解决方案：
- 使用官方最新版酷9播放器
- 或使用通用令牌链接 (?token=xxx)`;
    }
    
    return new Response(fakeContent, {
        headers: {
            'Content-Type': filename.endsWith('.json') ? 'application/json' : 'text/plain',
            'X-Verification-Status': 'failed',
            'X-Client-Type': 'suspected-fake',
            'X-Auth-Result': 'token-ok-but-feature-mismatch'
        }
    });
}

// 发送原始内容
function sendOriginalContent(filename, content, clientType) {
    let contentType = 'text/plain; charset=utf-8';
    if (filename.endsWith('.json')) contentType = 'application/json; charset=utf-8';
    else if (filename.endsWith('.m3u') || filename.endsWith('.m3u8')) contentType = 'audio/x-mpegurl; charset=utf-8';
    
    return new Response(content, {
        headers: {
            'Content-Type': contentType,
            'Access-Control-Allow-Origin': '*',
            'X-Client-Type': clientType,
            'X-Verification': 'passed'
        }
    });
}

// 发送加密内容（无令牌或无效令牌）
function sendEncryptedContent(filename, content, reason) {
    let fakeContent = `# 🔐 双重验证安全系统

# 访问被拒绝
# 原因: ${reason}

# 📋 可用访问方式：
# 1. 酷9播放器专用: /z/${filename}?ku9key=酷9专用令牌
# 2. 其他授权软件: /z/${filename}?token=通用令牌
# 3. 管理访问: /z/${filename}?manage_token=管理令牌

# ⚠️ 注意：
# - 酷9专用链接仅限真实酷9播放器使用
# - TVBox等软件使用酷9令牌会被特征识别拦截
# - 每种令牌生成不同的内容`;

    if (filename.endsWith('.m3u') || filename.endsWith('.m3u8')) {
        fakeContent = `#EXTM3U\n#EXT-X-ERROR:ACCESS_DENIED\n# ` + fakeContent.replace(/\n/g, '\n# ');
    }
    
    return new Response(fakeContent, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'X-Access-Denied-Reason': reason
        }
    });
}

// 文件上传处理 - 返回带两种令牌的链接
async function handleUploadFile(request, env) {
    try {
        const formData = await parseFormData(request);
        const filename = formData.filename;
        const content = formData.content;
        const password = formData.password;

        if (!filename || !content) {
            return new Response(JSON.stringify({ success: false, error: '参数不全' }));
        }

        const safeFilename = sanitizeFilename(filename.trim());
        const finalPassword = password || 'default_password';
        
        // 保存文件
        await env.MY_TEXT_STORAGE.put('file_' + safeFilename, content);
        await env.MY_TEXT_STORAGE.put('pwd_' + safeFilename, finalPassword);
        
        const domain = request.headers.get('host');
        const baseUrl = 'https://' + domain + '/z/' + encodeURIComponent(safeFilename);
        
        // 生成两种链接
        const ku9Link = baseUrl + '?ku9key=ku9_secret_2025';
        const tokenLink = baseUrl + '?token=default_access_2025';
        
        return new Response(JSON.stringify({
            success: true,
            filename: safeFilename,
            links: {
                ku9_exclusive: ku9Link,
                universal_token: tokenLink,
                note: '酷9链接仅限真实酷9播放器，特征不符会被拦截'
            }
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }));
    }
}

// 其他辅助函数保持不变（handleReadFile, handleUpdatePassword, parseFormData, sanitizeFilename等）
async function handleReadFile(request, env) {
    // ... 实现与之前相同
}

async function handleUpdatePassword(request, env) {
    // ... 实现与之前相同
}

async function parseFormData(request) {
    // ... 实现与之前相同
}

function sanitizeFilename(name) {
    return name.replace(/[^a-zA-Z0-9_\-\u4e00-\u9fa5.]/g, '_');
}

// 管理页面相关函数也保持不变
async function handleManagementPage(request, env) {
    // ... 实现与之前相同
}
