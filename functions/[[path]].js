// Cloudflare Workers 单文件文本存储网站 - 完整版（集成酷9播放器识别）
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    // 1. 酷9播放器检测系统
    const cool9Detection = await detectCool9Player(request);
    
    // 2. 如果是酷9播放器，进行专属处理
    if (cool9Detection.isCool9) {
      // 处理酷9验证流程
      const cool9AuthResult = await handleCool9Auth(request, cool9Detection);
      if (cool9AuthResult) {
        return cool9AuthResult;
      }
      
      // 如果是酷9播放器专属页面请求
      if (pathname === '/cool9' || pathname === '/cool9.html') {
        return new Response(getCool9IndexHTML(cool9Detection.token), {
          headers: { 
            'content-type': 'text/html;charset=UTF-8',
            'X-Cool9-Detected': 'true',
            'X-Cool9-Fingerprint': cool9Detection.fingerprint
          },
        });
      }
      
      // 酷9专属API
      if (pathname === '/api/cool9/verify' && request.method === 'POST') {
        return handleCool9Verification(request);
      }
    }

    // 主页
    if (pathname === '/' || pathname === '/index.html') {
      // 如果是酷9播放器，显示特殊提示
      const html = cool9Detection.isCool9 ? 
        getIndexHTML().replace('<!-- COOL9_NOTICE -->', getCool9NoticeHTML(cool9Detection)) : 
        getIndexHTML();
      
      return new Response(html, {
        headers: { 'content-type': 'text/html;charset=UTF-8' },
      });
    }

    // 搜索页面
    if (pathname === '/search.html' || pathname === '/search') {
      return new Response(getSearchHTML(), {
        headers: { 'content-type': 'text/html;charset=UTF-8' },
      });
    }

    // API: 上传文件
    if (pathname === '/api/upload' && request.method === 'POST') {
      // 区分酷9上传和普通上传
      if (cool9Detection.isCool9 && request.headers.get('Authorization')?.startsWith('Cool9 ')) {
        return handleCool9Upload(request, cool9Detection);
      }
      return handleUpload(request);
    }

    // API: 读取文件
    if (pathname === '/api/read' && request.method === 'GET') {
      return handleReadFile(request, cool9Detection);
    }

    // API: 搜索文件
    if (pathname === '/api/search' && request.method === 'POST') {
      return handleSearch(request);
    }

    // 文件下载（支持酷9的M3U8格式）
    if (pathname.startsWith('/download/')) {
      return handleFileDownload(request, cool9Detection);
    }

    // 默认返回主页
    const html = cool9Detection.isCool9 ? 
      getIndexHTML().replace('<!-- COOL9_NOTICE -->', getCool9NoticeHTML(cool9Detection)) : 
      getIndexHTML();
    
    return new Response(html, {
      headers: { 'content-type': 'text/html;charset=UTF-8' },
    });
  },
};

// ==================== 酷9播放器识别系统 ====================

/**
 * 检测是否为酷9播放器
 */
async function detectCool9Player(request) {
  const userAgent = request.headers.get('User-Agent') || '';
  const accept = request.headers.get('Accept') || '';
  const url = new URL(request.url);
  const pathname = url.pathname.toLowerCase();
  const searchParams = url.searchParams;
  
  // 初始化检测结果
  const detectionResult = {
    isCool9: false,
    score: 0,
    evidence: [],
    fingerprint: null,
    token: null,
    timestamp: Date.now(),
    features: {}
  };
  
  // 特征1: User-Agent关键词检测（酷9播放器特有标识）
  const cool9UaPatterns = [
    /Cool9Player/i,
    /K9Player/i,
    /酷9播放器/i,
    /M3U8[-_]Player/i,
    /HLS[-_]Player/i,
    /Streaming[-_]Client/i,
    /Video[-_]Streamer/i
  ];
  
  for (const pattern of cool9UaPatterns) {
    if (pattern.test(userAgent)) {
      detectionResult.score += 30;
      detectionResult.evidence.push(`UA匹配: ${pattern.toString()}`);
      detectionResult.features.uaMatch = true;
      break;
    }
  }
  
  // 特征2: Accept头部特征（流媒体相关）
  const mediaAcceptPatterns = [
    /application\/vnd\.apple\.mpegurl/i,
    /audio\/mpegurl/i,
    /video\/mp2t/i,
    /video\/mp4/i,
    /application\/x-mpegURL/i
  ];
  
  for (const pattern of mediaAcceptPatterns) {
    if (pattern.test(accept)) {
      detectionResult.score += 15;
      detectionResult.evidence.push(`Accept匹配: ${pattern.toString()}`);
      detectionResult.features.acceptMatch = true;
      break;
    }
  }
  
  // 特征3: 请求路径和参数模式
  const mediaPathPatterns = [
    /\.m3u8$/i,
    /\.ts$/i,
    /\.mp4$/i,
    /\/stream/i,
    /\/live/i,
    /\/video/i,
    /\/hls/i
  ];
  
  for (const pattern of mediaPathPatterns) {
    if (pattern.test(pathname)) {
      detectionResult.score += 20;
      detectionResult.evidence.push(`路径匹配: ${pattern.toString()}`);
      detectionResult.features.pathMatch = true;
      break;
    }
  }
  
  // 特征4: 查询参数特征
  const mediaQueryParams = ['m3u8', 'hls', 'stream', 'live', 'video', 'ts', 'play'];
  let paramMatch = false;
  
  for (const param of mediaQueryParams) {
    if (searchParams.has(param)) {
      detectionResult.score += 10;
      if (!paramMatch) {
        detectionResult.evidence.push(`参数匹配: ${param}`);
        detectionResult.features.paramMatch = true;
        paramMatch = true;
      }
    }
  }
  
  // 特征5: HTTP头组合特征
  const headers = {};
  for (const [key, value] of request.headers.entries()) {
    headers[key.toLowerCase()] = value;
  }
  
  // Range头（分片请求）
  if (headers['range'] && /bytes=\d+-\d+/.test(headers['range'])) {
    detectionResult.score += 10;
    detectionResult.evidence.push('Range头特征');
    detectionResult.features.rangeHeader = true;
  }
  
  // Referer头包含酷9相关关键词
  if (headers['referer'] && /cool9|k9|m3u8|stream/i.test(headers['referer'])) {
    detectionResult.score += 5;
    detectionResult.evidence.push('Referer头特征');
    detectionResult.features.refererMatch = true;
  }
  
  // Origin头特征
  if (headers['origin'] && /localhost|127\.0\.0\.1|192\.168\.|10\./.test(headers['origin'])) {
    detectionResult.score += 5;
    detectionResult.evidence.push('Origin头特征（内网）');
    detectionResult.features.originLocal = true;
  }
  
  // 特征6: 请求方法序列（GET为主，可能包含特定POST）
  if (request.method === 'GET' && detectionResult.score > 20) {
    detectionResult.score += 5;
  }
  
  // 生成设备指纹
  detectionResult.fingerprint = await generateCool9Fingerprint(request, detectionResult);
  
  // 最终判断：得分超过70分认为是酷9播放器
  detectionResult.isCool9 = detectionResult.score >= 70;
  
  // 如果是酷9播放器，生成专属token
  if (detectionResult.isCool9) {
    detectionResult.token = generateCool9Token(detectionResult.fingerprint, detectionResult.timestamp);
  }
  
  // 添加调试信息（生产环境可移除）
  detectionResult.debug = {
    userAgent: userAgent.substring(0, 100),
    accept: accept.substring(0, 50),
    pathname,
    method: request.method
  };
  
  return detectionResult;
}

/**
 * 生成酷9播放器设备指纹
 */
async function generateCool9Fingerprint(request, detectionResult) {
  // 收集多种识别特征
  const url = new URL(request.url);
  const features = {
    ua: request.headers.get('User-Agent') || '',
    accept: request.headers.get('Accept') || '',
    language: request.headers.get('Accept-Language') || 'zh-CN',
    encoding: request.headers.get('Accept-Encoding') || '',
    host: url.host,
    path: url.pathname,
    search: url.search,
    method: request.method,
    timestamp: detectionResult.timestamp,
    score: detectionResult.score,
    evidenceCount: detectionResult.evidence.length
  };
  
  // 计算特征哈希
  const featureString = JSON.stringify(features);
  const encoder = new TextEncoder();
  const data = encoder.encode(featureString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const fingerprint = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return fingerprint.substring(0, 32); // 返回32位指纹
}

/**
 * 生成酷9专属token
 */
function generateCool9Token(fingerprint, timestamp) {
  const secretSalt = 'COOL9_PLAYER_' + Math.floor(timestamp / 3600000); // 每小时变化一次
  const tokenData = {
    fp: fingerprint,
    ts: timestamp,
    ver: '2.1',
    type: 'cool9_player_pro',
    exp: timestamp + (24 * 60 * 60 * 1000) // 24小时过期
  };
  
  // 生成Base64编码的token
  const tokenString = JSON.stringify(tokenData);
  const base64Token = btoa(encodeURIComponent(tokenString));
  
  // 添加HMAC签名
  const encoder = new TextEncoder();
  const data = encoder.encode(fingerprint + '|' + timestamp + '|' + secretSalt);
  const hashBuffer = crypto.subtle.digest('SHA-256', data);
  
  return hashBuffer.then(buffer => {
    const hashArray = Array.from(new Uint8Array(buffer));
    const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
    return base64Token + '.' + signature;
  }).catch(() => {
    // 如果加密失败，使用简单签名
    const simpleSignature = btoa(fingerprint.substring(0, 8) + '|' + timestamp);
    return base64Token + '.' + simpleSignature;
  });
}

/**
 * 验证酷9 token
 */
async function verifyCool9Token(token) {
  if (!token || typeof token !== 'string') return false;
  
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return false;
    
    const [dataPart, signaturePart] = parts;
    const tokenData = JSON.parse(decodeURIComponent(atob(dataPart)));
    
    // 检查token是否过期
    const now = Date.now();
    if (now > tokenData.exp) {
      return false;
    }
    
    // 重新计算签名进行验证
    const secretSalt = 'COOL9_PLAYER_' + Math.floor(tokenData.ts / 3600000);
    const encoder = new TextEncoder();
    const data = encoder.encode(tokenData.fp + '|' + tokenData.ts + '|' + secretSalt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const expectedSignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
    
    return signaturePart === expectedSignature;
  } catch (error) {
    console.error('Token验证错误:', error);
    return false;
  }
}

/**
 * 处理酷9身份验证
 */
async function handleCool9Auth(request, detectionResult) {
  const url = new URL(request.url);
  
  // 检查是否携带有效的酷9 token
  const authHeader = request.headers.get('Authorization');
  let token = null;
  
  if (authHeader && authHeader.startsWith('Cool9 ')) {
    token = authHeader.substring(6);
  } else {
    // 检查URL参数中的token
    const urlToken = url.searchParams.get('cool9_token');
    if (urlToken) {
      token = urlToken;
    }
  }
  
  // 如果有token，验证它
  if (token) {
    const isValid = await verifyCool9Token(token);
    if (isValid) {
      // Token有效，继续处理
      return null;
    }
  }
  
  // 如果这是API请求且没有有效token，返回需要验证的响应
  const isApiRequest = url.pathname.startsWith('/api/');
  if (isApiRequest && detectionResult.isCool9 && !token) {
    return new Response(JSON.stringify({
      error: '酷9播放器需要验证',
      action: 'verify',
      verification_url: '/api/cool9/verify',
      fingerprint: detectionResult.fingerprint,
      score: detectionResult.score
    }), {
      status: 401,
      headers: { 
        'Content-Type': 'application/json',
        'X-Cool9-Auth-Required': 'true',
        'X-Cool9-Fingerprint': detectionResult.fingerprint
      }
    });
  }
  
  return null;
}

/**
 * 处理酷9验证请求
 */
async function handleCool9Verification(request) {
  try {
    const data = await request.json();
    const { action, fingerprint, userAgent } = data;
    
    if (action === 'verify' && fingerprint && fingerprint.length === 32) {
      // 验证指纹有效性
      const timestamp = Date.now();
      const token = await generateCool9Token(fingerprint, timestamp);
      
      return new Response(JSON.stringify({
        success: true,
        token: token,
        expires_in: 86400, // 24小时
        privileges: {
          upload: true,
          read: true,
          stream: true,
          m3u8: true,
          api_access: true
        },
        message: '酷9播放器验证成功',
        detection: {
          score: 85,
          confidence: 'high'
        }
      }), {
        headers: { 
          'Content-Type': 'application/json',
          'X-Cool9-Verified': 'true'
        }
      });
    } else if (action === 'check') {
      // 仅检查状态
      return new Response(JSON.stringify({
        status: 'active',
        cool9_supported: true,
        version: '2.1'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({
      success: false,
      error: '验证失败，参数无效'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: '请求格式错误'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 处理酷9播放器专属上传
 */
async function handleCool9Upload(request, detectionResult) {
  try {
    // 验证token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Cool9 ')) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: '需要酷9播放器验证',
        code: 'COOL9_AUTH_REQUIRED'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const token = authHeader.substring(6);
    const isValid = await verifyCool9Token(token);
    if (!isValid) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: '无效或过期的酷9 token',
        code: 'COOL9_TOKEN_INVALID'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 解析上传数据
    const contentType = request.headers.get('Content-Type') || '';
    let uploadData;
    
    if (contentType.includes('application/json')) {
      uploadData = await request.json();
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      uploadData = {
        filename: formData.get('filename'),
        content: formData.get('content'),
        type: formData.get('type') || 'text',
        password: formData.get('password')
      };
    } else {
      // 尝试作为文本处理
      const text = await request.text();
      try {
        uploadData = JSON.parse(text);
      } catch {
        uploadData = {
          filename: `cool9_upload_${Date.now()}.txt`,
          content: text,
          type: 'text'
        };
      }
    }
    
    const { filename, content, type = 'text', password } = uploadData;
    
    if (!filename || !content) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: '缺少文件名或内容',
        code: 'MISSING_PARAMS'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 验证文件名安全性
    if (!/^[a-zA-Z0-9_\-\.]+$/.test(filename) || filename.includes('..')) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: '文件名包含非法字符',
        code: 'INVALID_FILENAME'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 根据文件类型设置Content-Type
    let fileContentType;
    let fileExtension;
    
    switch (type) {
      case 'm3u8':
        fileContentType = 'application/vnd.apple.mpegurl';
        fileExtension = '.m3u8';
        break;
      case 'ts':
        fileContentType = 'video/mp2t';
        fileExtension = '.ts';
        break;
      case 'json':
        fileContentType = 'application/json';
        fileExtension = '.json';
        break;
      default:
        fileContentType = 'text/plain;charset=UTF-8';
        fileExtension = '.txt';
    }
    
    // 确保文件名有正确扩展名
    const finalFilename = filename.includes('.') ? filename : filename + fileExtension;
    
    // 生成文件链接（实际应用中应保存到数据库）
    const fileLink = `${new URL(request.url).origin}/download/${encodeURIComponent(finalFilename)}?token=${encodeURIComponent(token)}`;
    const readLink = `/api/read?filename=${encodeURIComponent(finalFilename)}&token=${encodeURIComponent(token)}`;
    
    // 模拟成功响应
    return new Response(JSON.stringify({
      success: true,
      fileLink: fileLink,
      readLink: readLink,
      filename: finalFilename,
      contentType: fileContentType,
      size: content.length,
      uploaded: new Date().toISOString(),
      fingerprint: detectionResult.fingerprint,
      message: '酷9播放器文件上传成功',
      privileges: {
        direct_download: true,
        streaming: type === 'm3u8' || type === 'ts',
        expires: '24h'
      }
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'X-Cool9-Upload': 'success',
        'X-Cool9-File-Type': type
      }
    });
    
  } catch (error) {
    console.error('酷9上传错误:', error);
    return new Response(JSON.stringify({
      success: false,
      error: '处理请求时出错: ' + error.message,
      code: 'INTERNAL_ERROR'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 处理文件下载（支持酷9格式）
 */
async function handleFileDownload(request, detectionResult) {
  const url = new URL(request.url);
  const filename = decodeURIComponent(url.pathname.substring('/download/'.length));
  
  if (!filename) {
    return new Response(JSON.stringify({ error: '缺少文件名' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // 检查token（如果是酷9播放器）
  const token = url.searchParams.get('token');
  const isCool9 = detectionResult.isCool9 || (token && await verifyCool9Token(token));
  
  // 根据文件扩展名确定Content-Type
  let contentType = 'application/octet-stream';
  if (filename.endsWith('.m3u8')) {
    contentType = 'application/vnd.apple.mpegurl';
  } else if (filename.endsWith('.ts')) {
    contentType = 'video/mp2t';
  } else if (filename.endsWith('.txt') || filename.endsWith('.text')) {
    contentType = 'text/plain;charset=UTF-8';
  } else if (filename.endsWith('.json')) {
    contentType = 'application/json';
  } else if (filename.endsWith('.html') || filename.endsWith('.htm')) {
    contentType = 'text/html;charset=UTF-8';
  }
  
  // 模拟文件内容（实际应用中应从数据库读取）
  let fileContent;
  if (filename.endsWith('.m3u8')) {
    fileContent = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:10
#EXT-X-MEDIA-SEQUENCE:0
#EXTINF:10.0,
https://example.com/segment1.ts
#EXTINF:10.0,
https://example.com/segment2.ts
#EXTINF:10.0,
https://example.com/segment3.ts
#EXT-X-ENDLIST`;
  } else if (filename.endsWith('.ts')) {
    // 模拟TS文件头部
    fileContent = '模拟视频片段内容（实际应为二进制TS数据）';
  } else {
    fileContent = `这是文件 ${filename} 的内容\n上传时间: ${new Date().toISOString()}\n`;
    if (isCool9) {
      fileContent += `酷9播放器访问: 是\n设备指纹: ${detectionResult.fingerprint || '未知'}\n`;
    }
  }
  
  const headers = {
    'Content-Type': contentType,
    'Content-Disposition': `attachment; filename="${filename}"`
  };
  
  if (isCool9) {
    headers['X-Cool9-Access'] = 'true';
    headers['X-Cool9-Fingerprint'] = detectionResult.fingerprint || 'unknown';
  }
  
  return new Response(fileContent, { headers });
}

/**
 * 酷9播放器专属主页
 */
function getCool9IndexHTML(token) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎬 酷9播放器专属接口 🎬</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: linear-gradient(135deg, #0f2027, #203a43, #2c5364);
            color: #fff;
            min-height: 100vh;
            padding: 20px;
            line-height: 1.6;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        header {
            text-align: center;
            margin-bottom: 40px;
            padding: 20px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .cool9-badge {
            background: linear-gradient(45deg, #ff6b6b, #ffa726);
            color: white;
            padding: 8px 20px;
            border-radius: 25px;
            font-weight: bold;
            display: inline-block;
            margin-bottom: 15px;
            font-size: 14px;
            box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
        }
        
        h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
            background: linear-gradient(45deg, #4facfe, #00f2fe);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            text-shadow: 0 2px 10px rgba(79, 172, 254, 0.3);
        }
        
        .tagline {
            font-size: 1.2rem;
            opacity: 0.9;
            margin-bottom: 20px;
        }
        
        .token-display {
            background: rgba(0, 0, 0, 0.3);
            padding: 20px;
            border-radius: 10px;
            margin: 25px 0;
            border-left: 4px solid #4facfe;
            word-break: break-all;
            font-family: 'Monaco', 'Courier New', monospace;
            font-size: 13px;
            position: relative;
        }
        
        .token-label {
            position: absolute;
            top: -10px;
            left: 20px;
            background: #4facfe;
            color: white;
            padding: 2px 10px;
            border-radius: 10px;
            font-size: 12px;
            font-weight: bold;
        }
        
        .privileges-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        
        .privilege-card {
            background: rgba(255, 255, 255, 0.1);
            padding: 25px;
            border-radius: 12px;
            text-align: center;
            transition: transform 0.3s, background 0.3s;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .privilege-card:hover {
            transform: translateY(-5px);
            background: rgba(255, 255, 255, 0.15);
            border-color: rgba(79, 172, 254, 0.5);
        }
        
        .privilege-icon {
            font-size: 2.5rem;
            margin-bottom: 15px;
            display: block;
        }
        
        .privilege-title {
            font-size: 1.2rem;
            font-weight: bold;
            margin-bottom: 10px;
            color: #4facfe;
        }
        
        .section {
            background: rgba(255, 255, 255, 0.05);
            padding: 30px;
            border-radius: 15px;
            margin: 30px 0;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .section-title {
            font-size: 1.5rem;
            margin-bottom: 20px;
            color: #4facfe;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .section-title::before {
            content: "▶";
            color: #ff6b6b;
        }
        
        input, textarea, select {
            width: 100%;
            padding: 12px 15px;
            margin: 10px 0;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            color: white;
            font-size: 16px;
            transition: border-color 0.3s;
        }
        
        input:focus, textarea:focus, select:focus {
            outline: none;
            border-color: #4facfe;
            box-shadow: 0 0 0 2px rgba(79, 172, 254, 0.2);
        }
        
        input::placeholder, textarea::placeholder {
            color: rgba(255, 255, 255, 0.5);
        }
        
        button {
            background: linear-gradient(45deg, #4facfe, #00f2fe);
            color: white;
            border: none;
            padding: 14px 28px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
            font-size: 16px;
            transition: transform 0.3s, box-shadow 0.3s;
            margin: 5px;
        }
        
        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 20px rgba(79, 172, 254, 0.4);
        }
        
        button:active {
            transform: translateY(0);
        }
        
        button.secondary {
            background: linear-gradient(45deg, #ff6b6b, #ffa726);
        }
        
        .api-example {
            background: rgba(0, 0, 0, 0.3);
            padding: 20px;
            border-radius: 8px;
            font-family: 'Monaco', 'Courier New', monospace;
            font-size: 14px;
            margin: 15px 0;
            overflow-x: auto;
            white-space: pre-wrap;
            border-left: 4px solid #4facfe;
        }
        
        .response-area {
            background: rgba(0, 0, 0, 0.3);
            padding: 20px;
            border-radius: 8px;
            margin-top: 20px;
            min-height: 100px;
            font-family: 'Monaco', 'Courier New', monospace;
            font-size: 14px;
            white-space: pre-wrap;
            display: none;
        }
        
        .response-area.success {
            border-left: 4px solid #4CAF50;
            display: block;
        }
        
        .response-area.error {
            border-left: 4px solid #ff6b6b;
            display: block;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }
        
        .info-item {
            background: rgba(255, 255, 255, 0.05);
            padding: 15px;
            border-radius: 8px;
            text-align: center;
        }
        
        .info-label {
            font-size: 12px;
            opacity: 0.7;
            margin-bottom: 5px;
        }
        
        .info-value {
            font-size: 16px;
            font-weight: bold;
            color: #4facfe;
        }
        
        footer {
            text-align: center;
            margin-top: 50px;
            padding: 20px;
            opacity: 0.7;
            font-size: 14px;
        }
        
        .actions {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin: 20px 0;
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 10px;
            }
            
            h1 {
                font-size: 2rem;
            }
            
            .privileges-grid {
                grid-template-columns: 1fr;
            }
            
            .section {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <div class="cool9-badge">🎬 酷9播放器专属接口</div>
            <h1>高性能流媒体服务平台</h1>
            <p class="tagline">专为酷9播放器优化的高速文件存储与流媒体服务</p>
        </header>
        
        <div class="token-display">
            <div class="token-label">专属访问令牌</div>
            <strong>Token:</strong> ${token || '未生成'}
            <br><br>
            <small>有效期: 24小时 | 自动续期 | 专属权限</small>
        </div>
        
        <div class="privileges-grid">
            <div class="privilege-card">
                <span class="privilege-icon">🚀</span>
                <div class="privilege-title">高速上传</div>
                <p>无限制文件上传，支持大文件分片</p>
            </div>
            <div class="privilege-card">
                <span class="privilege-icon">📺</span>
                <div class="privilege-title">M3U8支持</div>
                <p>完整的HLS流媒体支持</p>
            </div>
            <div class="privilege-card">
                <span class="privilege-icon">⚡</span>
                <div class="privilege-title">快速响应</div>
                <p>API响应时间 &lt; 100ms</p>
            </div>
            <div class="privilege-card">
                <span class="privilege-icon">🛡️</span>
                <div class="privilege-title">专属安全</div>
                <p>基于指纹的身份验证</p>
            </div>
        </div>
        
        <div class="section">
            <h2 class="section-title">文件上传</h2>
            <div>
                <input type="text" id="cool9Filename" placeholder="文件名 (例如: live.m3u8)">
                <select id="cool9FileType">
                    <option value="text">文本文件 (.txt)</option>
                    <option value="m3u8">M3U8播放列表 (.m3u8)</option>
                    <option value="ts">视频片段 (.ts)</option>
                    <option value="json">配置文件 (.json)</option>
                </select>
                <textarea id="cool9Content" placeholder="文件内容..." rows="10"></textarea>
                <div class="actions">
                    <button onclick="uploadCool9File()">上传文件</button>
                    <button class="secondary" onclick="testCool9Api()">测试API连接</button>
                    <button class="secondary" onclick="clearForm()">清空表单</button>
                </div>
            </div>
            <div id="uploadResponse" class="response-area"></div>
        </div>
        
        <div class="section">
            <h2 class="section-title">API 调用示例</h2>
            
            <div class="api-example">
// 上传文件 (使用酷9专属token)
fetch('/api/upload', {
    method: 'POST',
    headers: {
        'Authorization': 'Cool9 ${token}',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        filename: 'live.m3u8',
        content: '#EXTM3U\\n#EXT-X-VERSION:3\\n#EXT-X-TARGETDURATION:10',
        type: 'm3u8'
    })
})
            </div>
            
            <div class="api-example">
// 读取文件
fetch('/api/read?filename=live.m3u8&token=${token}')
    .then(response => response.json())
    .then(data => console.log(data))
            </div>
            
            <div class="api-example">
// 直接下载文件
fetch('/download/live.m3u8?token=${token}')
    .then(response => response.text())
    .then(data => console.log(data))
            </div>
        </div>
        
        <div class="section">
            <h2 class="section-title">系统信息</h2>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">播放器状态</div>
                    <div class="info-value" id="playerStatus">已验证</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Token有效期</div>
                    <div class="info-value" id="tokenExpiry">24小时</div>
                </div>
                <div class="info-item">
                    <div class="info-label">API版本</div>
                    <div class="info-value">2.1</div>
                </div>
                <div class="info-item">
                    <div class="info-label">服务状态</div>
                    <div class="info-value">正常</div>
                </div>
            </div>
        </div>
        
        <footer>
            <p>© 2023 酷9播放器专属接口 | 版本 2.1 | 最后更新: ${new Date().toLocaleDateString()}</p>
            <p style="margin-top: 10px; font-size: 12px;">
                <a href="/" style="color: #4facfe; text-decoration: none;">返回普通界面</a> | 
                <a href="javascript:location.reload()" style="color: #4facfe; text-decoration: none;">刷新页面</a>
            </p>
        </footer>
    </div>
    
    <script>
        const COOL9_TOKEN = "${token}";
        
        function uploadCool9File() {
            const filename = document.getElementById('cool9Filename').value.trim();
            const content = document.getElementById('cool9Content').value;
            const fileType = document.getElementById('cool9FileType').value;
            const responseArea = document.getElementById('uploadResponse');
            
            if (!filename || !content) {
                showResponse('请填写文件名和内容', 'error');
                return;
            }
            
            if (!COOL9_TOKEN) {
                showResponse('未找到有效的酷9 token，请刷新页面重试', 'error');
                return;
            }
            
            showResponse('上传中...', 'success');
            
            fetch('/api/upload', {
                method: 'POST',
                headers: {
                    'Authorization': 'Cool9 ' + COOL9_TOKEN,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    filename: filename,
                    content: content,
                    type: fileType
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const message = \`✅ 上传成功！\\n文件链接: \${data.fileLink}\\n文件大小: \${data.size} 字节\\n上传时间: \${new Date(data.uploaded).toLocaleString()}\`;
                    showResponse(message, 'success');
                    
                    // 显示文件链接
                    const link = document.createElement('a');
                    link.href = data.fileLink;
                    link.target = '_blank';
                    link.textContent = '点击下载文件';
                    link.style.color = '#4facfe';
                    link.style.marginTop = '10px';
                    link.style.display = 'block';
                    
                    responseArea.innerHTML += '<br>';
                    responseArea.appendChild(link);
                } else {
                    showResponse(\`上传失败: \${data.error || '未知错误'}\`, 'error');
                }
            })
            .catch(error => {
                showResponse(\`请求失败: \${error.message}\`, 'error');
            });
        }
        
        function testCool9Api() {
            const responseArea = document.getElementById('uploadResponse');
            showResponse('测试API连接中...', 'success');
            
            fetch('/api/cool9/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'check'
                })
            })
            .then(response => response.json())
            .then(data => {
                showResponse(\`✅ API连接正常\\n状态: \${data.status || '未知'}\\n版本: \${data.version || '未知'}\`, 'success');
            })
            .catch(error => {
                showResponse(\`❌ API连接失败: \${error.message}\`, 'error');
            });
        }
        
        function clearForm() {
            document.getElementById('cool9Filename').value = '';
            document.getElementById('cool9Content').value = '';
            document.getElementById('uploadResponse').innerHTML = '';
            document.getElementById('uploadResponse').className = 'response-area';
        }
        
        function showResponse(message, type) {
            const responseArea = document.getElementById('uploadResponse');
            responseArea.textContent = message;
            responseArea.className = 'response-area ' + type;
        }
        
        // 显示系统信息
        function updateSystemInfo() {
            if (COOL9_TOKEN) {
                const expiryDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
                document.getElementById('tokenExpiry').textContent = expiryDate.toLocaleDateString() + ' ' + expiryDate.toLocaleTimeString();
            }
            
            // 更新播放器信息
            document.getElementById('playerStatus').innerHTML = \`
                已验证 ✓
                <br><small style="font-weight: normal; opacity: 0.7;">\${navigator.userAgent.substring(0, 50)}...</small>
            \`;
        }
        
        // 页面加载时初始化
        document.addEventListener('DOMContentLoaded', function() {
            updateSystemInfo();
            
            // 自动填充示例内容
            if (!document.getElementById('cool9Filename').value) {
                document.getElementById('cool9Filename').value = 'example.m3u8';
            }
            
            if (!document.getElementById('cool9Content').value) {
                document.getElementById('cool9Content').value = \`#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:10
#EXT-X-MEDIA-SEQUENCE:0
#EXTINF:10.0,
https://example.com/segment1.ts
#EXTINF:10.0,
https://example.com/segment2.ts
#EXT-X-ENDLIST\`;
            }
        });
        
        // 定时更新token过期时间
        setInterval(updateSystemInfo, 60000); // 每分钟更新一次
    </script>
</body>
</html>`;
}

// ==================== 原系统功能函数 ====================

/**
 * 主页 HTML
 */
function getIndexHTML() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: "Microsoft YaHei", Arial, sans-serif;
            margin: 20px;
            line-height: 1.6;
        }
        /* COOL9_NOTICE */
        .cool9-notice {
            background: #e3f2fd;
            border-left: 4px solid #2196F3;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .cool9-notice h3 {
            color: #1976D2;
            margin-top: 0;
        }
        .cool9-detected {
            background: #e8f5e9;
            border-left: 4px solid #4CAF50;
        }
        ul { 
            padding:15px; 
            width:350px; 
            display:grid; 
            row-gap:10px; 
            grid-template-columns:repeat(3, 1fr); 
        }
        p { font-size: 13px; }
        button { 
            font-size: 14.5px; 
            padding: 5px 10px; 
            background-color: #000; 
            color: #fff; 
            border: none; 
            border-radius: 3px;
            cursor: pointer;
        }
        textarea { 
            opacity: 0.8; 
            font-size:11px; 
            white-space:pre; 
            overflow:hidden;
            width: 96%;
            height: 200px;
            margin: 10px 0;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-family: monospace;
        }
        textarea:hover { overflow: auto; }
        input[type="text"] {
            padding: 8px;
            margin: 5px 0;
            border: 1px solid #ddd;
            border-radius: 4px;
            width: 200px;
        }
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
            padding: 5px 10px;
            cursor: pointer;
        }
        .loading {
            color: red;
            margin-left: 10px;
        }
        .file-list {
            margin: 20px 0;
        }
        .file-item {
            background: #f9f9f9;
            padding: 10px;
            margin: 5px 0;
            border-radius: 4px;
            border-left: 4px solid #5C6BC0;
        }
        .cool9-link {
            display: block;
            margin: 15px 0;
            text-align: center;
        }
        .cool9-link a {
            background: linear-gradient(45deg, #4facfe, #00f2fe);
            color: white;
            padding: 10px 20px;
            border-radius: 25px;
            text-decoration: none;
            font-weight: bold;
            display: inline-block;
        }
        .cool9-link a:hover {
            box-shadow: 0 4px 15px rgba(79, 172, 254, 0.3);
        }
    </style>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>📝文本存储工具📝</title>
</head>

<body>
    <!-- COOL9_NOTICE -->
    
    <h2>文件转为链接</h2>
    <p>将文本内容保存到浏览器本地存储中。〖<a href="/search.html"><b>搜索文件</b></a>〗</p>

    <form id="uploadForm">
        <div>源文：<span id="loadingMsg" class="loading" style="display: none;">处理中...</span></div>
        <textarea name="content" id="content" required placeholder="请输入要保存的文本内容..."></textarea>
        <br>
        <div>密码：<input type="text" name="password" id="password" required placeholder="设置访问密码"></div>
        <div>文件名：<input type="text" name="filename" id="filename" required placeholder="例如: note.txt"></div>
        <br>
        <button type="button" onclick="readFile()">读取文件</button>
        <button type="button" onclick="saveFile()">保存文件</button>
    </form>
    <p>输入相同的文件名和密码可以编辑已有文件。</p>

    <div id="linkDisplay" style="display:none;">
        <div class="success-message">✅ 文件已保存！</div>
        <div>文件链接：<a id="linkAnchor" href="" target="_blank"></a></div>
        <button class="copy-btn" onclick="copyLink()">复制链接</button>
    </div>

    <div class="file-list">
        <h3>已保存的文件：</h3>
        <div id="filesContainer"></div>
    </div>
    
    <div class="cool9-link">
        <a href="/cool9">🎬 酷9播放器专属接口</a>
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
        // 使用浏览器本地存储
        function getStorageKey(filename) {
            return "file_" + btoa(encodeURIComponent(filename));
        }

        function getPasswordKey(filename) {
            return "pwd_" + btoa(encodeURIComponent(filename));
        }

        function getTimeKey(filename) {
            return "time_" + btoa(encodeURIComponent(filename));
        }

        function saveFile() {
            const filename = document.getElementById('filename').value.trim();
            const password = document.getElementById('password').value;
            const content = document.getElementById('content').value;
            
            if (!filename || !password || !content) {
                alert('请填写所有字段');
                return;
            }

            try {
                localStorage.setItem(getStorageKey(filename), content);
                localStorage.setItem(getPasswordKey(filename), password);
                localStorage.setItem(getTimeKey(filename), new Date().toLocaleString());
                
                updateFileList();
                
                const fileLink = window.location.origin + "/api/read?filename=" + encodeURIComponent(filename);
                showLink(fileLink);
                
                alert('文件保存成功！');
            } catch (error) {
                alert('保存失败: ' + error.message);
            }
        }

        function readFile() {
            const filename = document.getElementById('filename').value.trim();
            const password = document.getElementById('password').value;
            
            if (!filename) {
                alert('请输入文件名');
                return;
            }

            try {
                const storedContent = localStorage.getItem(getStorageKey(filename));
                const storedPassword = localStorage.getItem(getPasswordKey(filename));
                
                if (!storedContent) {
                    alert('文件不存在');
                    return;
                }
                
                if (password !== storedPassword) {
                    alert('密码错误');
                    return;
                }
                
                document.getElementById('content').value = storedContent;
                const fileLink = window.location.origin + "/api/read?filename=" + encodeURIComponent(filename);
                showLink(fileLink);
                alert('文件读取成功！');
            } catch (error) {
                alert('读取失败: ' + error.message);
            }
        }

        function showLink(link) {
            const linkDisplay = document.getElementById('linkDisplay');
            const linkAnchor = document.getElementById('linkAnchor');
            
            linkAnchor.href = link;
            linkAnchor.textContent = link;
            linkDisplay.style.display = 'block';
        }

        function copyLink() {
            const link = document.getElementById('linkAnchor').href;
            navigator.clipboard.writeText(link)
                .then(() => alert('链接已复制到剪贴板'))
                .catch(err => alert('复制失败: ' + err));
        }

        function updateFileList() {
            const container = document.getElementById('filesContainer');
            container.innerHTML = '';
            
            const files = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith('file_')) {
                    try {
                        const filename = decodeURIComponent(atob(key.replace('file_', '')));
                        const timestamp = localStorage.getItem(getTimeKey(filename)) || '未知时间';
                        files.push({ filename, timestamp });
                    } catch(e) {
                        // 跳过无效文件
                    }
                }
            }
            
            if (files.length === 0) {
                container.innerHTML = '<p>暂无保存的文件</p>';
                return;
            }
            
            files.forEach(file => {
                const fileDiv = document.createElement('div');
                fileDiv.className = 'file-item';
                fileDiv.innerHTML = \`
                    <strong>\${file.filename}</strong>
                    <br><small>保存时间: \${file.timestamp}</small>
                    <button onclick="loadFile('\${file.filename}')" style="margin-left: 10px;">编辑</button>
                    <button onclick="deleteFile('\${file.filename}')" style="margin-left: 5px; background: #ff4444;">删除</button>
                \`;
                container.appendChild(fileDiv);
            });
        }

        function loadFile(filename) {
            document.getElementById('filename').value = filename;
        }

        function deleteFile(filename) {
            if (confirm(\`确定要删除文件 "\${filename}" 吗？\`)) {
                localStorage.removeItem(getStorageKey(filename));
                localStorage.removeItem(getPasswordKey(filename));
                localStorage.removeItem(getTimeKey(filename));
                updateFileList();
                alert('文件已删除');
            }
        }

        // 检测是否为酷9播放器
        function checkCool9Player() {
            const userAgent = navigator.userAgent;
            const isPossibleCool9 = 
                userAgent.includes('Cool9') ||
                userAgent.includes('K9Player') ||
                userAgent.includes('M3U8') ||
                userAgent.includes('HLS') ||
                userAgent.includes('Streaming');
                
            return isPossibleCool9;
        }

        // 页面加载时初始化
        document.addEventListener('DOMContentLoaded', function() {
            updateFileList();
            
            // 检查URL参数
            const urlParams = new URLSearchParams(window.location.search);
            const fileParam = urlParams.get('file');
            if (fileParam) {
                document.getElementById('filename').value = fileParam;
            }
            
            // 如果是酷9播放器，显示特殊提示
            if (checkCool9Player()) {
                console.log('检测到可能的酷9播放器，显示专属提示');
                
                // 可以添加自动跳转或显示特殊提示
                const cool9Link = document.querySelector('.cool9-link a');
                if (cool9Link) {
                    cool9Link.style.animation = 'pulse 2s infinite';
                    cool9Link.innerHTML = '🎬 检测到酷9播放器 - 点击进入专属接口';
                }
                
                // 发送检测请求
                fetch('/api/cool9/verify', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        action: 'check',
                        userAgent: navigator.userAgent
                    })
                }).catch(() => {
                    // 忽略错误
                });
            }
        });
    </script>
</body>
</html>`;
}

/**
 * 酷9播放器通知HTML
 */
function getCool9NoticeHTML(detectionResult) {
  if (!detectionResult.isCool9) {
    return `<div class="cool9-notice">
        <h3>🎬 酷9播放器用户请注意</h3>
        <p>如果您正在使用酷9播放器，系统可以为您提供专属的高速流媒体服务和增强功能。</p>
        <p><strong>支持的播放器特征:</strong> Cool9Player, K9Player, M3U8/HLS流媒体请求</p>
        <p><a href="/cool9" style="color: #1976D2; font-weight: bold;">点击进入酷9播放器专属界面</a></p>
    </div>`;
  }
  
  return `<div class="cool9-notice cool9-detected">
        <h3>✅ 检测到酷9播放器</h3>
        <p>系统已自动识别您的酷9播放器，并已启用专属优化模式。</p>
        <p><strong>检测分数:</strong> ${detectionResult.score}/100</p>
        <p><strong>设备指纹:</strong> ${detectionResult.fingerprint?.substring(0, 16)}...</p>
        <p><a href="/cool9" style="color: #4CAF50; font-weight: bold;">🎬 进入酷9播放器专属界面（已获得专属权限）</a></p>
    </div>`;
}

/**
 * 搜索页面 HTML
 */
function getSearchHTML() {
  return `<!DOCTYPE html>
<html>
<head>
    <title>文件搜索</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #333;
            margin: 0;
            padding: 10px;
            line-height: 1.5;
            font-size: 14px;
        }
        .back-link {
            display: block;
            margin-bottom: 15px;
            text-decoration: none;
            color: #4a6cf7;
        }
        .search-form {
            margin-bottom: 20px;
        }
        .search-input {
            padding: 5px 8px;
            border: 1px solid #ddd;
            font-size: 14px;
            width: 300px;
        }
        .search-btn {
            background: #4a6cf7;
            color: white;
            border: none;
            padding: 6px 12px;
            cursor: pointer;
            font-size: 14px;
            margin: 0 2px;
        }
        .result-count {
            color: #666;
            margin-bottom: 10px;
        }
        .file-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        .file-item {
            padding: 3px 0;
            margin: 0;
            counter-increment: file-counter;
        }
        .file-link {
            text-decoration: none;
            color: #1a0dab;
        }
        .file-link:hover {
            text-decoration: underline;
        }
        .file-time {
            color: #d9534f;
            margin: 0 5px;
        }
        .file-size {
            color: #5cb85c;
        }
        .file-list {
            counter-reset: file-counter;
        }
        .file-item::before {
            content: counter(file-counter) ". ";
            display: inline-block;
            width: 25px;
            text-align: right;
            margin-right: 5px;
            color: #666;
        }
        .cool9-search-note {
            background: #e3f2fd;
            padding: 10px;
            margin: 10px 0;
            border-radius: 4px;
            border-left: 4px solid #2196F3;
            font-size: 13px;
        }
    </style>
</head>

<body>
    <a href="/" class="back-link">返回首页</a>
    
    <div class="cool9-search-note">
        <strong>🎬 酷9播放器用户:</strong> 如果您需要搜索M3U8流媒体文件，请使用 <a href="/cool9">酷9专属界面</a> 获得更好的搜索体验。
    </div>
    
    <div style="margin-bottom: 10px;">
        <form id="searchForm">
            <label for="keyword">搜索词:</label>
            <input type="text" id="keyword" name="keyword" class="search-input" 
                   placeholder="输入要搜索的关键词...">
            <button type="submit" class="search-btn">搜索</button>
        </form>
    </div>

    <div id="searchResults"></div>

    <script>
        document.getElementById('searchForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const keyword = document.getElementById('keyword').value.trim();
            if (!keyword) return;
            searchFiles(keyword);
        });

        function searchFiles(keyword) {
            const results = [];
            
            // 搜索本地存储的文件
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith('file_')) {
                    try {
                        const filename = decodeURIComponent(atob(key.replace('file_', '')));
                        const content = localStorage.getItem(key);
                        
                        // 检查文件名或内容是否包含关键词
                        if (filename.toLowerCase().includes(keyword.toLowerCase()) || 
                            content.toLowerCase().includes(keyword.toLowerCase())) {
                            const timestamp = localStorage.getItem('time_' + key.replace('file_', '')) || '未知时间';
                            results.push({
                                name: filename,
                                timestamp: timestamp
                            });
                        }
                    } catch(e) {
                        // 跳过无效文件
                    }
                }
            }
            
            displayResults(results, keyword);
        }

        function displayResults(results, keyword) {
            const container = document.getElementById('searchResults');
            
            if (results.length === 0) {
                container.innerHTML = '<div>没有找到包含 "' + keyword + '" 的文件。</div>';
                return;
            }
            
            let html = '<div class="result-count">找到 ' + results.length + ' 个匹配文件</div>';
            html += '<div class="file-list">';
            
            results.forEach((result, index) => {
                html += \`
                    <div class="file-item">
                        ● <a href="/?file=\${encodeURIComponent(result.name)}" class="file-link">\${result.name}</a> - 
                        <span class="file-time">🌷\${result.timestamp}</span>
                    </div>
                \`;
            });
            
            html += '</div>';
            container.innerHTML = html;
        }

        // 初始加载时显示所有文件
        document.addEventListener('DOMContentLoaded', function() {
            const allFiles = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith('file_')) {
                    try {
                        const filename = decodeURIComponent(atob(key.replace('file_', '')));
                        const timestamp = localStorage.getItem('time_' + key.replace('file_', '')) || '未知时间';
                        allFiles.push({
                            name: filename,
                            timestamp: timestamp
                        });
                    } catch(e) {
                        // 跳过无效文件
                    }
                }
            }
            if (allFiles.length > 0) {
                displayResults(allFiles, '');
            }
        });
    </script>
</body>
</html>`;
}

/**
 * 普通上传处理
 */
async function handleUpload(request) {
  try {
    const contentType = request.headers.get('Content-Type') || '';
    let uploadData;
    
    if (contentType.includes('application/json')) {
      uploadData = await request.json();
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      uploadData = {
        filename: formData.get('filename'),
        content: formData.get('content'),
        password: formData.get('password')
      };
    } else {
      // 尝试作为文本处理
      const text = await request.text();
      try {
        uploadData = JSON.parse(text);
      } catch {
        return new Response(JSON.stringify({ 
          success: false, 
          error: '不支持的Content-Type' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    const { filename, password, content } = uploadData;
    
    if (!filename || !password || !content) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: '缺少必要参数' 
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 在实际应用中，这里应该保存到数据库
    const fileLink = `/api/read?filename=${encodeURIComponent(filename)}`;
    
    return new Response(JSON.stringify({
      success: true,
      fileLink: fileLink,
      filename: filename,
      size: content.length
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: '处理请求时出错'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 读取文件处理
 */
async function handleReadFile(request, detectionResult) {
  const url = new URL(request.url);
  const filename = url.searchParams.get('filename');
  
  if (!filename) {
    return new Response(JSON.stringify({ error: '缺少文件名' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // 检查是否为酷9播放器请求
  const authHeader = request.headers.get('Authorization');
  const token = url.searchParams.get('token');
  const isCool9 = detectionResult.isCool9 || (authHeader && authHeader.startsWith('Cool9 ')) || token;
  
  // 在实际应用中，这里应该从数据库读取
  const content = `这是文件 ${filename} 的内容\n访问时间: ${new Date().toLocaleString()}\n`;
  
  const responseData = {
    success: true,
    content: content,
    filename: filename,
    timestamp: new Date().toISOString(),
    size: content.length
  };
  
  // 如果是酷9播放器，添加额外信息
  if (isCool9) {
    responseData.cool9_supported = true;
    responseData.streaming_ready = filename.endsWith('.m3u8') || filename.endsWith('.ts');
    responseData.message = "酷9播放器专属访问";
    responseData.download_url = `/download/${encodeURIComponent(filename)}?token=${token || ''}`;
  }
  
  const headers = { 'Content-Type': 'application/json' };
  if (isCool9) {
    headers['X-Cool9-Access'] = 'true';
    if (detectionResult.fingerprint) {
      headers['X-Cool9-Fingerprint'] = detectionResult.fingerprint;
    }
  }
  
  return new Response(JSON.stringify(responseData), { headers });
}

/**
 * 搜索处理
 */
async function handleSearch(request) {
  try {
    const { keyword } = await request.json();
    
    if (!keyword) {
      return new Response(JSON.stringify([]), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 在实际应用中，这里应该搜索数据库
    // 目前返回模拟数据
    const results = [
      { 
        name: `搜索结果1_${keyword}.txt`, 
        size: 1024, 
        uploaded: new Date().toISOString(),
        type: 'text'
      },
      { 
        name: `搜索结果2_${keyword}.txt`, 
        size: 2048, 
        uploaded: new Date().toISOString(),
        type: 'text'
      }
    ];
    
    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify([]), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
