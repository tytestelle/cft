// Cloudflare Workers 单文件文本存储网站 - 完整增强版
// 包含：酷9播放器识别、访问统计、管理后台、源码保护

// ==================== 配置常量 ====================
const CONFIG = {
  // 酷9播放器配置
  KU9_SECRET_KEY: 'ku9_player_secret_2025', // 用于HMAC签名的密钥
  KU9_TOKEN_EXPIRY: 3600, // 令牌有效期（秒）
  
  // 管理配置
  ADMIN_TOKEN: 'admin_access_2025', // 管理访问令牌
  SOURCE_ACCESS_TOKEN: 'view_source_2025', // 源码查看令牌
  
  // 统计配置
  ANALYTICS_ENABLED: true, // 是否启用访问统计
  LOG_RETENTION_DAYS: 30, // 日志保留天数
  
  // 加密配置
  ENCRYPTION_ENABLED: true, // 是否对非酷9播放器加密内容
  ENCRYPTION_KEY: 'default_encryption_key_2025', // 加密密钥（生产环境需更改）
};

// ==================== 酷9播放器增强识别 ====================

/**
 * 增强版酷9播放器识别（基于HMAC签名验证）
 */
async function identifyKu9Player(request) {
  const userAgent = request.headers.get('User-Agent') || '';
  const headers = Object.fromEntries(request.headers);
  
  // 特征1: User-Agent关键字匹配
  const ku9UaPatterns = [
    /Ku9Player/i,
    /Ku9[-_ ]?Media/i,
    /Cool9/i,
    /K9Player/i,
    /^Mozilla.*\(compatible; Ku9/
  ];
  
  const hasKu9UserAgent = ku9UaPatterns.some(pattern => pattern.test(userAgent));
  
  // 特征2: HMAC签名验证（更安全的验证方式）
  const ku9Signature = request.headers.get('X-Ku9-Signature');
  const requestTimestamp = request.headers.get('X-Ku9-Timestamp');
  const requestId = request.headers.get('X-Ku9-Request-ID');
  
  let hasValidSignature = false;
  if (ku9Signature && requestTimestamp && requestId) {
    const now = Math.floor(Date.now() / 1000);
    const timestamp = parseInt(requestTimestamp);
    
    // 检查时间戳有效性（5分钟内）
    if (Math.abs(now - timestamp) < 300) {
      const dataToSign = `${requestId}:${timestamp}:${CONFIG.KU9_SECRET_KEY}`;
      const expectedSignature = await generateHMAC(dataToSign);
      hasValidSignature = (ku9Signature === expectedSignature);
    }
  }
  
  // 特征3: 特殊请求头
  const ku9SpecialHeaders = {
    'X-Player-Engine': /Ku9|Cool9/i,
    'X-Request-Client': /ku9|k9media/i,
    'X-Request-Source': /ku9player/i
  };
  
  let hasKu9Headers = false;
  for (const [headerName, pattern] of Object.entries(ku9SpecialHeaders)) {
    const headerValue = request.headers.get(headerName);
    if (headerValue && pattern.test(headerValue)) {
      hasKu9Headers = true;
      break;
    }
  }
  
  // 特征4: 初始请求行为分析
  const referer = request.headers.get('Referer') || '';
  const accept = request.headers.get('Accept') || '';
  const isLikelyKu9InitialRequest = 
    (referer.includes('ku9') || referer.includes('k9')) &&
    (accept.includes('video') || accept.includes('mpeg'));
  
  // 综合判定：满足至少两个特征（必须包含签名或UA）
  const featureScore = [
    hasKu9UserAgent,
    hasValidSignature,
    hasKu9Headers,
    isLikelyKu9InitialRequest
  ].filter(Boolean).length;
  
  const isKu9Player = featureScore >= 2 && (hasKu9UserAgent || hasValidSignature);
  
  // 记录访问日志（如果启用统计）
  if (CONFIG.ANALYTICS_ENABLED && isKu9Player) {
    await recordAccessLog(request, 'ku9_player', { hasValidSignature, hasKu9UserAgent });
  }
  
  return isKu9Player;
}

/**
 * 为酷9播放器签发访问令牌（HMAC增强版）
 */
async function issueKu9Token(request) {
  const requestId = generateRequestId();
  const timestamp = Math.floor(Date.now() / 1000);
  const expiresAt = timestamp + CONFIG.KU9_TOKEN_EXPIRY;
  
  // 生成签名
  const dataToSign = `${requestId}:${timestamp}:${expiresAt}`;
  const signature = await generateHMAC(dataToSign);
  
  const tokenData = {
    id: requestId,
    issued: timestamp,
    expires: expiresAt,
    player: '酷9播放器',
    signature: signature
  };
  
  const token = btoa(JSON.stringify(tokenData));
  
  return new Response(JSON.stringify({
    success: true,
    token: token,
    signature: signature,
    request_id: requestId,
    timestamp: timestamp,
    expires_in: CONFIG.KU9_TOKEN_EXPIRY,
    message: '酷9播放器令牌已签发',
    instructions: '请在后续请求的X-Ku9-Token头部中使用此令牌'
  }), {
    headers: { 
      'Content-Type': 'application/json',
      'X-Ku9-Token-Issued': new Date(timestamp * 1000).toISOString(),
      'X-Ku9-Signature': signature
    }
  });
}

/**
 * 增强版酷9播放器令牌验证
 */
async function validateKu9Token(token) {
  try {
    const tokenStr = atob(token);
    const tokenData = JSON.parse(tokenStr);
    
    const now = Math.floor(Date.now() / 1000);
    if (now > tokenData.expires) {
      return { valid: false, reason: '令牌已过期' };
    }
    
    // 验证签名
    const dataToSign = `${tokenData.id}:${tokenData.issued}:${tokenData.expires}`;
    const expectedSignature = await generateHMAC(dataToSign);
    
    if (tokenData.signature !== expectedSignature) {
      return { valid: false, reason: '无效签名' };
    }
    
    if (!tokenData.id || !tokenData.issued || tokenData.player !== '酷9播放器') {
      return { valid: false, reason: '令牌格式无效' };
    }
    
    return { valid: true, data: tokenData };
  } catch (error) {
    return { valid: false, reason: '令牌解析失败' };
  }
}

/**
 * 生成HMAC签名
 */
async function generateHMAC(data) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(CONFIG.KU9_SECRET_KEY),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(data)
  );
  
  // 转换为十六进制字符串
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// ==================== 内容加密系统 ====================

/**
 * 加密文本内容（对非酷9播放器）
 */
async function encryptContent(content, key = CONFIG.ENCRYPTION_KEY) {
  if (!CONFIG.ENCRYPTION_ENABLED) return content;
  
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  
  // 生成随机IV
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // 从密钥派生加密密钥
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  
  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('ku9_salt_2025'),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
  
  // 加密数据
  const encryptedData = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    derivedKey,
    data
  );
  
  // 组合IV和加密数据
  const combined = new Uint8Array(iv.length + encryptedData.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encryptedData), iv.length);
  
  // 返回Base64编码
  return btoa(String.fromCharCode(...combined));
}

/**
 * 解密文本内容
 */
async function decryptContent(encryptedBase64, key = CONFIG.ENCRYPTION_KEY) {
  if (!CONFIG.ENCRYPTION_ENABLED) return encryptedBase64;
  
  try {
    const encoder = new TextEncoder();
    
    // 解码Base64
    const binaryStr = atob(encryptedBase64);
    const combined = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      combined[i] = binaryStr.charCodeAt(i);
    }
    
    // 提取IV和加密数据
    const iv = combined.slice(0, 12);
    const encryptedData = combined.slice(12);
    
    // 从密钥派生解密密钥
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(key),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    
    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode('ku9_salt_2025'),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );
    
    // 解密数据
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      derivedKey,
      encryptedData
    );
    
    return new TextDecoder().decode(decryptedData);
  } catch (error) {
    console.error('解密失败:', error);
    return null;
  }
}

// ==================== 访问统计系统 ====================

// 内存中的访问日志（实际部署应使用Workers KV或D1数据库）
let accessLogs = [];

/**
 * 记录访问日志
 */
async function recordAccessLog(request, clientType, metadata = {}) {
  if (!CONFIG.ANALYTICS_ENABLED) return null;
  
  const url = new URL(request.url);
  const now = new Date();
  
  const logEntry = {
    id: generateRequestId(),
    timestamp: now.toISOString(),
    date: now.toLocaleDateString('zh-CN'),
    time: now.toLocaleTimeString('zh-CN'),
    clientType: clientType,
    userAgent: request.headers.get('User-Agent') || '未知',
    ip: request.headers.get('CF-Connecting-IP') || '未知',
    country: request.headers.get('CF-IPCountry') || '未知',
    method: request.method,
    path: url.pathname,
    query: url.search,
    referer: request.headers.get('Referer') || '直接访问',
    status: 'pending',
    metadata: metadata,
    responseTime: null
  };
  
  // 添加到内存日志（生产环境应存储到Workers KV或D1）
  accessLogs.unshift(logEntry);
  
  // 保持日志数量（简单实现，保留最近1000条）
  if (accessLogs.length > 1000) {
    accessLogs = accessLogs.slice(0, 1000);
  }
  
  return logEntry;
}

/**
 * 更新日志状态
 */
function updateLogStatus(logId, status, responseInfo = {}) {
  const logIndex = accessLogs.findIndex(log => log.id === logId);
  if (logIndex !== -1) {
    accessLogs[logIndex].status = status;
    accessLogs[logIndex].responseInfo = responseInfo;
    accessLogs[logIndex].completedAt = new Date().toISOString();
    accessLogs[logIndex].responseTime = new Date() - new Date(accessLogs[logIndex].timestamp);
  }
}

/**
 * 获取统计数据
 */
function getAnalyticsData() {
  const now = new Date();
  const last24Hours = accessLogs.filter(log => {
    const logTime = new Date(log.timestamp);
    return (now - logTime) <= 24 * 60 * 60 * 1000;
  });
  
  const last7Days = accessLogs.filter(log => {
    const logTime = new Date(log.timestamp);
    return (now - logTime) <= 7 * 24 * 60 * 60 * 1000;
  });
  
  // 按客户端类型统计
  const byClientType = {};
  accessLogs.forEach(log => {
    byClientType[log.clientType] = (byClientType[log.clientType] || 0) + 1;
  });
  
  // 按国家统计
  const byCountry = {};
  accessLogs.forEach(log => {
    byCountry[log.country] = (byCountry[log.country] || 0) + 1;
  });
  
  // 按路径统计
  const byPath = {};
  accessLogs.forEach(log => {
    byPath[log.path] = (byPath[log.path] || 0) + 1;
  });
  
  // 按状态统计
  const byStatus = {};
  accessLogs.forEach(log => {
    byStatus[log.status] = (byStatus[log.status] || 0) + 1;
  });
  
  // 计算平均响应时间
  const completedLogs = accessLogs.filter(log => log.responseTime);
  const avgResponseTime = completedLogs.length > 0 
    ? completedLogs.reduce((sum, log) => sum + log.responseTime, 0) / completedLogs.length 
    : 0;
  
  return {
    totalRequests: accessLogs.length,
    last24Hours: last24Hours.length,
    last7Days: last7Days.length,
    byClientType,
    byCountry,
    byPath,
    byStatus,
    avgResponseTime: Math.round(avgResponseTime),
    recentLogs: accessLogs.slice(0, 100) // 最近100条日志
  };
}

// ==================== 管理功能 ====================

/**
 * 验证管理令牌
 */
function validateAdminToken(request) {
  const adminToken = request.headers.get('X-Admin-Token') || 
                    new URL(request.url).searchParams.get('admin_token');
  
  return adminToken === CONFIG.ADMIN_TOKEN;
}

/**
 * 验证源码访问令牌
 */
function validateSourceToken(request) {
  const sourceToken = request.headers.get('X-Source-Token') ||
                     new URL(request.url).searchParams.get('source_token');
  
  return sourceToken === CONFIG.SOURCE_ACCESS_TOKEN;
}

/**
 * 管理后台页面
 */
function getAdminHTML(stats) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>📊 文本存储管理后台</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
            color: #333;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        .header {
            background: white;
            border-radius: 15px;
            padding: 30px;
            margin-bottom: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .header h1 {
            color: #4a5568;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .header p {
            color: #718096;
            font-size: 14px;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        .stat-card {
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            transition: transform 0.3s;
        }
        .stat-card:hover {
            transform: translateY(-5px);
        }
        .stat-card h3 {
            color: #4a5568;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 10px;
        }
        .stat-number {
            font-size: 36px;
            font-weight: bold;
            color: #4299e1;
        }
        .stat-trend {
            font-size: 12px;
            color: #48bb78;
            margin-top: 5px;
        }
        .stat-warning {
            color: #ed8936;
        }
        .stat-danger {
            color: #f56565;
        }
        .chart-container {
            background: white;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        .chart-container h3 {
            color: #4a5568;
            margin-bottom: 15px;
            border-bottom: 2px solid #f7fafc;
            padding-bottom: 10px;
        }
        .logs-table {
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            overflow-x: auto;
            margin-bottom: 30px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
        }
        th {
            background: #f7fafc;
            color: #4a5568;
            font-weight: 600;
            padding: 12px;
            text-align: left;
            border-bottom: 2px solid #e2e8f0;
            position: sticky;
            top: 0;
        }
        td {
            padding: 12px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 13px;
        }
        tr:hover {
            background: #f7fafc;
        }
        .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
        }
        .badge-ku9 { background: #4299e1; color: white; }
        .badge-web { background: #48bb78; color: white; }
        .badge-admin { background: #ed8936; color: white; }
        .badge-success { background: #48bb78; color: white; }
        .badge-error { background: #f56565; color: white; }
        .badge-blocked { background: #a0aec0; color: white; }
        .btn {
            display: inline-block;
            padding: 8px 16px;
            background: #4299e1;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-size: 14px;
            margin: 5px;
            transition: all 0.3s;
            border: none;
            cursor: pointer;
        }
        .btn:hover {
            background: #3182ce;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        .btn-danger {
            background: #f56565;
        }
        .btn-danger:hover {
            background: #e53e3e;
        }
        .btn-success {
            background: #38a169;
        }
        .btn-success:hover {
            background: #2f855a;
        }
        .btn-group {
            margin: 20px 0;
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }
        .refresh-btn {
            background: #38a169;
        }
        .client-type-chart {
            display: flex;
            height: 200px;
            align-items: flex-end;
            gap: 10px;
            padding: 20px 0;
        }
        .chart-bar {
            flex: 1;
            background: linear-gradient(to top, #4299e1, #667eea);
            border-radius: 4px 4px 0 0;
            position: relative;
            min-width: 40px;
            transition: height 0.5s;
        }
        .chart-bar:hover {
            background: linear-gradient(to top, #3182ce, #5a67d8);
        }
        .chart-bar-label {
            position: absolute;
            bottom: -25px;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 12px;
            color: #718096;
        }
        .chart-bar-value {
            position: absolute;
            top: -25px;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 12px;
            font-weight: bold;
            color: #4299e1;
        }
        .timestamp {
            font-size: 12px;
            color: #a0aec0;
        }
        .filter-controls {
            background: white;
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 20px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        .filter-group {
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
        }
        .filter-select {
            padding: 8px 12px;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            background: white;
            color: #4a5568;
            font-size: 14px;
            min-width: 150px;
        }
        .filter-input {
            padding: 8px 12px;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            background: white;
            color: #4a5568;
            font-size: 14px;
            width: 200px;
        }
        .status-badge {
            display: inline-flex;
            align-items: center;
            gap: 5px;
        }
        .pagination {
            display: flex;
            justify-content: center;
            gap: 10px;
            margin-top: 20px;
        }
        .page-btn {
            padding: 6px 12px;
            border: 1px solid #e2e8f0;
            background: white;
            border-radius: 4px;
            cursor: pointer;
        }
        .page-btn.active {
            background: #4299e1;
            color: white;
            border-color: #4299e1;
        }
        .export-btn {
            float: right;
        }
        .tooltip {
            position: relative;
            cursor: help;
        }
        .tooltip-text {
            visibility: hidden;
            background: #4a5568;
            color: white;
            text-align: center;
            padding: 5px 10px;
            border-radius: 6px;
            position: absolute;
            z-index: 1;
            bottom: 125%;
            left: 50%;
            transform: translateX(-50%);
            white-space: nowrap;
            font-size: 12px;
            opacity: 0;
            transition: opacity 0.3s;
        }
        .tooltip:hover .tooltip-text {
            visibility: visible;
            opacity: 1;
        }
        .system-info {
            background: white;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        .info-item {
            padding: 10px;
            background: #f7fafc;
            border-radius: 6px;
        }
        .info-label {
            font-size: 12px;
            color: #718096;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .info-value {
            font-size: 16px;
            color: #4a5568;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 文本存储服务管理后台</h1>
            <p>实时访问统计和系统监控 | 最后更新: ${new Date().toLocaleString('zh-CN')} | 日志总数: ${stats.totalRequests}</p>
        </div>
        
        <div class="btn-group">
            <a href="/" class="btn" target="_blank">🏠 访问首页</a>
            <a href="/admin?admin_token=${CONFIG.ADMIN_TOKEN}" class="btn refresh-btn">🔄 刷新数据</a>
            <a href="/admin/source?admin_token=${CONFIG.ADMIN_TOKEN}" class="btn">📜 查看源码</a>
            <a href="/admin?admin_token=${CONFIG.ADMIN_TOKEN}&export=csv" class="btn export-btn">📥 导出CSV</a>
            <button onclick="clearLogs()" class="btn btn-danger">🗑️ 清空日志</button>
        </div>
        
        <div class="system-info">
            <h3>系统信息</h3>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">酷9播放器状态</div>
                    <div class="info-value">${CONFIG.ANALYTICS_ENABLED ? '✅ 已启用' : '❌ 已禁用'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">加密状态</div>
                    <div class="info-value">${CONFIG.ENCRYPTION_ENABLED ? '🔒 已启用' : '🔓 已禁用'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">平均响应时间</div>
                    <div class="info-value">${stats.avgResponseTime}ms</div>
                </div>
                <div class="info-item">
                    <div class="info-label">在线客户端</div>
                    <div class="info-value">${Object.keys(stats.byClientType).length} 种</div>
                </div>
            </div>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <h3>总访问量</h3>
                <div class="stat-number">${stats.totalRequests}</div>
                <div class="stat-trend">所有时间的总请求数</div>
            </div>
            <div class="stat-card">
                <h3>24小时访问</h3>
                <div class="stat-number">${stats.last24Hours}</div>
                <div class="stat-trend">过去24小时的请求数</div>
            </div>
            <div class="stat-card">
                <h3>7天访问</h3>
                <div class="stat-number">${stats.last7Days}</div>
                <div class="stat-trend">过去7天的请求数</div>
            </div>
            <div class="stat-card">
                <h3>客户端类型</h3>
                <div class="stat-number">${Object.keys(stats.byClientType).length}</div>
                <div class="stat-trend">不同的客户端类型</div>
            </div>
        </div>
        
        <div class="filter-controls">
            <h3>日志过滤器</h3>
            <div class="filter-group">
                <select id="clientFilter" class="filter-select" onchange="filterLogs()">
                    <option value="">所有客户端</option>
                    ${Object.keys(stats.byClientType).map(type => `
                        <option value="${type}">${type} (${stats.byClientType[type]})</option>
                    `).join('')}
                </select>
                
                <select id="statusFilter" class="filter-select" onchange="filterLogs()">
                    <option value="">所有状态</option>
                    ${Object.keys(stats.byStatus).map(status => `
                        <option value="${status}">${status} (${stats.byStatus[status]})</option>
                    `).join('')}
                </select>
                
                <input type="text" id="searchFilter" class="filter-input" placeholder="搜索IP或UA..." onkeyup="filterLogs()">
                
                <button onclick="resetFilters()" class="btn">重置筛选</button>
            </div>
        </div>
        
        <div class="chart-container">
            <h3>客户端类型分布</h3>
            <div class="client-type-chart">
                ${Object.entries(stats.byClientType).map(([type, count]) => {
                    const maxCount = Math.max(...Object.values(stats.byClientType));
                    const height = maxCount > 0 ? (count / maxCount * 160) : 0;
                    return `
                        <div class="chart-bar tooltip" style="height: ${height}px" title="${type}: ${count}次">
                            <div class="chart-bar-value">${count}</div>
                            <div class="chart-bar-label">${type}</div>
                            <div class="tooltip-text">${type}: ${count}次访问</div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
        
        <div class="logs-table">
            <h3>最近访问记录 (最近${stats.recentLogs.length}条)</h3>
            <table id="logsTable">
                <thead>
                    <tr>
                        <th>时间</th>
                        <th>客户端</th>
                        <th>IP地址</th>
                        <th>国家</th>
                        <th>请求路径</th>
                        <th>状态</th>
                        <th>响应时间</th>
                        <th>User Agent</th>
                    </tr>
                </thead>
                <tbody id="logsBody">
                    ${stats.recentLogs.map(log => `
                        <tr class="log-row" data-client="${log.clientType}" data-status="${log.status}">
                            <td>
                                <div>${log.date}</div>
                                <div class="timestamp">${log.time}</div>
                            </td>
                            <td>
                                <span class="badge badge-${log.clientType}">
                                    ${log.clientType}
                                </span>
                            </td>
                            <td>${log.ip}</td>
                            <td>${log.country}</td>
                            <td>${log.path}${log.query}</td>
                            <td>
                                <span class="badge badge-${log.status}">
                                    ${log.status}
                                </span>
                            </td>
                            <td>${log.responseTime ? log.responseTime + 'ms' : '-'}</td>
                            <td title="${log.userAgent}">
                                ${log.userAgent.substring(0, 40)}${log.userAgent.length > 40 ? '...' : ''}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div class="pagination" id="pagination">
                <!-- 分页将通过JavaScript生成 -->
            </div>
        </div>
    </div>
    
    <script>
        let currentPage = 1;
        const rowsPerPage = 20;
        
        function filterLogs() {
            const clientFilter = document.getElementById('clientFilter').value;
            const statusFilter = document.getElementById('statusFilter').value;
            const searchFilter = document.getElementById('searchFilter').value.toLowerCase();
            
            const rows = document.querySelectorAll('.log-row');
            let visibleCount = 0;
            
            rows.forEach(row => {
                const client = row.getAttribute('data-client');
                const status = row.getAttribute('data-status');
                const rowText = row.textContent.toLowerCase();
                
                const clientMatch = !clientFilter || client === clientFilter;
                const statusMatch = !statusFilter || status === statusFilter;
                const searchMatch = !searchFilter || rowText.includes(searchFilter);
                
                if (clientMatch && statusMatch && searchMatch) {
                    row.style.display = '';
                    visibleCount++;
                } else {
                    row.style.display = 'none';
                }
            });
            
            updatePagination(visibleCount);
        }
        
        function resetFilters() {
            document.getElementById('clientFilter').value = '';
            document.getElementById('statusFilter').value = '';
            document.getElementById('searchFilter').value = '';
            filterLogs();
        }
        
        function updatePagination(totalRows) {
            const pageCount = Math.ceil(totalRows / rowsPerPage);
            const pagination = document.getElementById('pagination');
            
            if (pageCount <= 1) {
                pagination.innerHTML = '';
                return;
            }
            
            let html = '';
            for (let i = 1; i <= pageCount; i++) {
                html += \`<button class="page-btn \${i === currentPage ? 'active' : ''}" onclick="goToPage(\${i})">\${i}</button>\`;
            }
            
            pagination.innerHTML = html;
            updatePageRows();
        }
        
        function goToPage(page) {
            currentPage = page;
            updatePageRows();
            updatePagination(document.querySelectorAll('.log-row[style=""]').length);
        }
        
        function updatePageRows() {
            const rows = document.querySelectorAll('.log-row');
            const startIndex = (currentPage - 1) * rowsPerPage;
            const endIndex = startIndex + rowsPerPage;
            
            rows.forEach((row, index) => {
                if (row.style.display !== 'none') {
                    row.style.display = (index >= startIndex && index < endIndex) ? '' : 'none';
                }
            });
        }
        
        function clearLogs() {
            if (confirm('确定要清空所有访问日志吗？此操作不可撤销。')) {
                fetch('/admin/clear?admin_token=${CONFIG.ADMIN_TOKEN}', {
                    method: 'POST'
                }).then(() => {
                    alert('日志已清空');
                    location.reload();
                }).catch(err => {
                    alert('清空失败: ' + err.message);
                });
            }
        }
        
        // 初始化分页
        document.addEventListener('DOMContentLoaded', function() {
            filterLogs();
            
            // 自动刷新（每30秒）
            setTimeout(() => {
                location.reload();
            }, 30000);
        });
        
        // 导出功能
        if (window.location.search.includes('export=csv')) {
            downloadCSV();
        }
        
        function downloadCSV() {
            const stats = ${JSON.stringify(stats)};
            let csv = '时间,客户端类型,IP地址,国家,请求路径,状态,响应时间,User Agent\\n';
            
            stats.recentLogs.forEach(log => {
                const row = [
                    \`"\${log.date} \${log.time}"\`,
                    log.clientType,
                    log.ip,
                    log.country,
                    log.path + log.query,
                    log.status,
                    log.responseTime || '',
                    \`"\${log.userAgent.replace(/"/g, '""')}"\`
                ].join(',');
                csv += row + '\\n';
            });
            
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = \`access_logs_\${new Date().toISOString().slice(0,10)}.csv\`;
            link.click();
            
            // 移除导出参数
            const url = new URL(window.location);
            url.searchParams.delete('export');
            window.history.replaceState({}, '', url);
        }
    </script>
</body>
</html>`;
}

// ==================== 工具函数 ====================

function generateRequestId() {
  return 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function isKu9ApiRequest(pathname) {
  const ku9ApiPaths = [
    '/api/read',
    '/api/ku9/'
  ];
  
  return ku9ApiPaths.some(path => pathname.startsWith(path));
}

// ==================== 原有HTML函数 ====================

// 主页 HTML
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
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            min-height: 100vh;
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
            margin: 5px;
            transition: all 0.3s;
        }
        button:hover {
            background-color: #333;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
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
            padding:15px;
            background:#f0f0f0;
            border: 1px solid #ccc;
            border-radius: 4px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        #linkAnchor {
            color: #0066cc;
            font-weight: bold;
            text-decoration: none;
            word-break: break-all;
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
            padding: 12px;
            margin: 8px 0;
            border-radius: 6px;
            border-left: 4px solid #5C6BC0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .file-info {
            flex: 1;
        }
        .file-actions {
            display: flex;
            gap: 5px;
        }
        .header-container {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e0e0e0;
        }
        .admin-link {
            background: #667eea;
            color: white;
            padding: 8px 16px;
            border-radius: 4px;
            text-decoration: none;
            font-size: 14px;
        }
        .admin-link:hover {
            background: #5a67d8;
        }
        .encryption-notice {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 10px;
            border-radius: 4px;
            margin: 10px 0;
            font-size: 12px;
        }
        .ku9-badge {
            background: #667eea;
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 11px;
            margin-left: 10px;
        }
    </style>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>📝文本存储工具📝</title>
</head>

<body>
    <div class="header-container">
        <h2>📝 文件转为链接</h2>
        <a href="/admin?admin_token=${CONFIG.ADMIN_TOKEN}" class="admin-link" target="_blank">管理后台</a>
    </div>
    
    <p>将文本内容保存到浏览器本地存储中。〖<a href="/search.html"><b>搜索文件</b></a>〗</p>
    
    ${CONFIG.ENCRYPTION_ENABLED ? '<div class="encryption-notice">🔒 注意：非酷9播放器的访问将看到加密内容</div>' : ''}

    <form id="uploadForm">
        <div>源文：<span id="loadingMsg" class="loading" style="display: none;">处理中...</span></div>
        <textarea name="content" id="content" required placeholder="请输入要保存的文本内容..."></textarea>
        <br>
        <div>密码：<input type="text" name="password" id="password" required placeholder="设置访问密码"></div>
        <div>文件名：<input type="text" name="filename" id="filename" required placeholder="例如: note.txt"></div>
        <br>
        <button type="button" onclick="readFile()">读取文件</button>
        <button type="button" onclick="saveFile()">保存文件</button>
        <button type="button" onclick="clearForm()">清空表单</button>
    </form>
    <p>输入相同的文件名和密码可以编辑已有文件。</p>

    <div id="linkDisplay" style="display:none;">
        <div class="success-message">✅ 文件已保存！</div>
        <div>文件链接：<a id="linkAnchor" href="" target="_blank"></a></div>
        <button class="copy-btn" onclick="copyLink()">复制链接</button>
        <button class="copy-btn" onclick="testLink()" style="background: #667eea;">测试访问</button>
    </div>

    <div class="file-list">
        <h3>已保存的文件：</h3>
        <div id="filesContainer"></div>
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

        function testLink() {
            const link = document.getElementById('linkAnchor').href;
            window.open(link, '_blank');
        }

        function clearForm() {
            document.getElementById('filename').value = '';
            document.getElementById('password').value = '';
            document.getElementById('content').value = '';
            document.getElementById('linkDisplay').style.display = 'none';
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
                    <div class="file-info">
                        <strong>\${file.filename}</strong>
                        <br><small>保存时间: \${file.timestamp}</small>
                    </div>
                    <div class="file-actions">
                        <button onclick="loadFile('\${file.filename}')">编辑</button>
                        <button onclick="deleteFile('\${file.filename}')" style="background: #ff4444;">删除</button>
                    </div>
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

        // 页面加载时初始化
        document.addEventListener('DOMContentLoaded', function() {
            updateFileList();
            
            // 检查URL参数
            const urlParams = new URLSearchParams(window.location.search);
            const fileParam = urlParams.get('file');
            if (fileParam) {
                document.getElementById('filename').value = fileParam;
            }
        });
    </script>
</body>
</html>`;
}

// 搜索页面 HTML
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
            padding: 20px;
            line-height: 1.5;
            font-size: 14px;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            min-height: 100vh;
        }
        .back-link {
            display: inline-block;
            margin-bottom: 15px;
            text-decoration: none;
            color: #4a6cf7;
            background: white;
            padding: 8px 16px;
            border-radius: 4px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .back-link:hover {
            background: #f7f7f7;
        }
        .search-form {
            margin-bottom: 20px;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .search-input {
            padding: 10px 12px;
            border: 1px solid #ddd;
            font-size: 16px;
            width: 300px;
            border-radius: 4px;
            margin-right: 10px;
        }
        .search-btn {
            background: #4a6cf7;
            color: white;
            border: none;
            padding: 10px 20px;
            cursor: pointer;
            font-size: 16px;
            border-radius: 4px;
            transition: background 0.3s;
        }
        .search-btn:hover {
            background: #3a5bd9;
        }
        .result-count {
            color: #666;
            margin-bottom: 10px;
            padding: 10px;
            background: white;
            border-radius: 4px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .file-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        .file-item {
            padding: 12px;
            margin: 5px 0;
            background: white;
            border-radius: 6px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            transition: transform 0.2s;
        }
        .file-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }
        .file-link {
            text-decoration: none;
            color: #1a0dab;
            font-weight: 500;
            display: block;
            margin-bottom: 5px;
        }
        .file-link:hover {
            text-decoration: underline;
        }
        .file-time {
            color: #666;
            font-size: 12px;
        }
        .file-size {
            color: #5cb85c;
            font-size: 12px;
        }
        .no-results {
            background: white;
            padding: 30px;
            text-align: center;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            color: #666;
        }
        .search-info {
            color: #888;
            font-size: 12px;
            margin-top: 5px;
        }
    </style>
</head>

<body>
    <a href="/" class="back-link">← 返回首页</a>
    
    <div class="search-form">
        <form id="searchForm">
            <label for="keyword" style="display: block; margin-bottom: 8px; font-weight: bold;">搜索文件内容：</label>
            <input type="text" id="keyword" name="keyword" class="search-input" 
                   placeholder="输入要搜索的关键词...">
            <button type="submit" class="search-btn">搜索</button>
        </form>
        <div class="search-info">支持搜索文件名和文件内容，使用本地存储进行搜索</div>
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
                                timestamp: timestamp,
                                content: content.substring(0, 100) + (content.length > 100 ? '...' : '')
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
                container.innerHTML = \`
                    <div class="no-results">
                        <h3>没有找到包含 "\${keyword}" 的文件</h3>
                        <p>尝试使用其他关键词或检查拼写</p>
                    </div>
                \`;
                return;
            }
            
            let html = \`<div class="result-count">找到 \${results.length} 个匹配文件</div>\`;
            html += '<div class="file-list">';
            
            results.forEach((result, index) => {
                const highlightedContent = result.content.replace(
                    new RegExp(keyword, 'gi'),
                    match => \`<mark style="background: yellow;">\${match}</mark>\`
                );
                
                html += \`
                    <div class="file-item">
                        <a href="/?file=\${encodeURIComponent(result.name)}" class="file-link">
                            \${result.name}
                        </a>
                        <div class="file-time">📅 \${result.timestamp}</div>
                        <div style="font-size: 12px; color: #666; margin-top: 5px;">
                            \${highlightedContent}
                        </div>
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

// 酷9播放器专用界面
function getKu9InterfaceHTML() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>酷9播放器专用接口</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #333;
        }
        .ku9-container {
            background: white;
            border-radius: 15px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        .ku9-header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 30px; 
            border-radius: 15px; 
            margin-bottom: 30px; 
            text-align: center;
        }
        .api-section { 
            background: #f8f9fa; 
            padding: 25px; 
            border-radius: 12px; 
            margin-bottom: 25px; 
            box-shadow: 0 4px 12px rgba(0,0,0,0.08); 
            border-left: 5px solid #667eea;
        }
        .token-status { 
            background: #e8f5e9; 
            border-left: 5px solid #4caf50; 
            padding: 20px; 
            margin: 25px 0; 
            border-radius: 8px;
        }
        code { 
            background: #f1f1f1; 
            padding: 4px 8px; 
            border-radius: 4px; 
            font-family: 'Courier New', monospace; 
            color: #d63384;
        }
        .api-list {
            list-style: none;
            padding: 0;
        }
        .api-list li {
            padding: 10px 0;
            border-bottom: 1px solid #eee;
        }
        .api-list li:last-child {
            border-bottom: none;
        }
        .api-method {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            margin-right: 10px;
        }
        .method-get { background: #61affe; color: white; }
        .method-post { background: #49cc90; color: white; }
        .token-display {
            background: #1a1a1a;
            color: #00ff00;
            padding: 15px;
            border-radius: 8px;
            font-family: monospace;
            overflow-x: auto;
            margin: 15px 0;
            font-size: 12px;
        }
        .btn-group {
            display: flex;
            gap: 10px;
            margin-top: 20px;
            flex-wrap: wrap;
        }
        .btn {
            padding: 10px 20px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            transition: all 0.3s;
        }
        .btn:hover {
            background: #5a67d8;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        .btn-success {
            background: #38a169;
        }
        .btn-success:hover {
            background: #2f855a;
        }
        .btn-info {
            background: #4299e1;
        }
        .btn-info:hover {
            background: #3182ce;
        }
        .status-indicator {
            display: inline-block;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #4caf50;
            margin-right: 8px;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        .timestamp {
            font-size: 12px;
            color: #666;
            margin-top: 5px;
        }
        .feature-list {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        .feature-item {
            background: white;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #e0e0e0;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="ku9-container">
        <div class="ku9-header">
            <h1>🎬 酷9播放器专用接口</h1>
            <p>您的播放器已通过验证，欢迎使用专属服务</p>
            <div class="timestamp">
                <span class="status-indicator"></span> 系统状态：在线 | 验证时间：${new Date().toLocaleString('zh-CN')}
            </div>
        </div>
        
        <div class="token-status">
            <h3>✅ 令牌状态：有效</h3>
            <p>您的酷9播放器已成功识别，可以访问所有API服务</p>
            <div class="token-display" id="currentToken">正在加载令牌信息...</div>
            <div class="btn-group">
                <button class="btn" onclick="refreshToken()">🔄 刷新令牌</button>
                <button class="btn btn-info" onclick="copyToken()">📋 复制令牌</button>
                <button class="btn btn-success" onclick="testAPIs()">🧪 测试API</button>
            </div>
        </div>
        
        <div class="api-section">
            <h3>🎯 可用API接口</h3>
            <div class="feature-list">
                <div class="feature-item">
                    <h4>📁 文件读取</h4>
                    <code>GET /api/read?filename=示例.txt</code>
                    <p>读取存储的文本文件</p>
                </div>
                <div class="feature-item">
                    <h4>🔍 文件搜索</h4>
                    <code>POST /api/search</code>
                    <p>JSON: {"keyword":"搜索词"}</p>
                </div>
                <div class="feature-item">
                    <h4>📊 状态检查</h4>
                    <code>GET /api/ku9/status</code>
                    <p>获取播放器状态</p>
                </div>
            </div>
            
            <ul class="api-list">
                <li>
                    <span class="api-method method-get">GET</span>
                    <code>/api/ku9/analytics</code> - 获取统计数据
                </li>
                <li>
                    <span class="api-method method-post">POST</span>
                    <code>/api/ku9/upload</code> - 上传媒体文件
                </li>
                <li>
                    <span class="api-method method-get">GET</span>
                    <code>/api/ku9/config</code> - 获取播放器配置
                </li>
            </ul>
        </div>
        
        <div class="api-section">
            <h3>📖 使用说明</h3>
            <p>1. 在您的请求头中添加：<code>X-Ku9-Token: [您的令牌]</code></p>
            <p>2. 令牌有效期为1小时，过期后需要重新获取</p>
            <p>3. 请确保User-Agent包含"Ku9Player"标识</p>
            <p>4. 支持HMAC签名验证，提升安全性</p>
            
            <h4 style="margin-top: 20px;">示例请求头：</h4>
            <div class="token-display">
User-Agent: Ku9Player/2.0<br>
X-Ku9-Token: eyJpZCI6InJlcV8xNzA...<br>
X-Ku9-Timestamp: 1700000000<br>
X-Ku9-Signature: a1b2c3d4e5f6...
            </div>
        </div>
        
        <div class="api-section">
            <h3>🔗 相关链接</h3>
            <div class="btn-group">
                <a href="/" class="btn">📝 文本存储工具完整版</a>
                <a href="/search.html" class="btn btn-info">🔍 文件搜索页面</a>
                <a href="/admin?admin_token=${CONFIG.ADMIN_TOKEN}" class="btn btn-success" target="_blank">📊 管理后台</a>
            </div>
        </div>
    </div>
    
    <script>
        // 获取当前令牌信息
        function loadTokenInfo() {
            const token = localStorage.getItem('ku9_token');
            const tokenDisplay = document.getElementById('currentToken');
            
            if (token) {
                try {
                    const tokenData = JSON.parse(atob(token));
                    const expires = new Date(tokenData.expires * 1000);
                    const now = new Date();
                    const timeLeft = Math.floor((expires - now) / 1000);
                    
                    let statusText = timeLeft > 0 
                        ? \`✅ 令牌有效 (剩余 \${timeLeft} 秒)\`
                        : '❌ 令牌已过期';
                    
                    tokenDisplay.innerHTML = \`
令牌ID: \${tokenData.id}<br>
签发时间: \${new Date(tokenData.issued * 1000).toLocaleString('zh-CN')}<br>
过期时间: \${expires.toLocaleString('zh-CN')}<br>
状态: \${statusText}<br>
签名: \${tokenData.signature.substring(0, 16)}...
                    \`;
                } catch(e) {
                    tokenDisplay.textContent = '令牌格式无效';
                }
            } else {
                tokenDisplay.textContent = '未检测到有效令牌，请重新验证';
            }
        }
        
        function refreshToken() {
            fetch('/api/ku9/refresh', {
                headers: {
                    'X-Ku9-Token': localStorage.getItem('ku9_token') || ''
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    localStorage.setItem('ku9_token', data.token);
                    alert('令牌已刷新');
                    loadTokenInfo();
                } else {
                    alert('刷新失败: ' + (data.error || '未知错误'));
                }
            })
            .catch(error => {
                alert('请求失败: ' + error.message);
            });
        }
        
        function copyToken() {
            const token = localStorage.getItem('ku9_token');
            if (token) {
                navigator.clipboard.writeText(token)
                    .then(() => alert('令牌已复制到剪贴板'))
                    .catch(err => alert('复制失败: ' + err));
            } else {
                alert('没有可复制的令牌');
            }
        }
        
        function testAPIs() {
            const tests = [
                { name: '状态检查', url: '/api/ku9/status' },
                { name: '配置获取', url: '/api/ku9/config' }
            ];
            
            let passed = 0;
            let failed = 0;
            
            tests.forEach(test => {
                fetch(test.url, {
                    headers: {
                        'X-Ku9-Token': localStorage.getItem('ku9_token') || ''
                    }
                })
                .then(response => {
                    if (response.ok) {
                        passed++;
                        console.log(\`✅ \${test.name}: 通过\`);
                    } else {
                        failed++;
                        console.log(\`❌ \${test.name}: 失败\`);
                    }
                })
                .catch(() => {
                    failed++;
                    console.log(\`❌ \${test.name}: 错误\`);
                })
                .finally(() => {
                    if (passed + failed === tests.length) {
                        alert(\`测试完成！通过: \${passed}, 失败: \${failed}\`);
                    }
                });
            });
        }
        
        // 页面加载时初始化
        document.addEventListener('DOMContentLoaded', function() {
            loadTokenInfo();
            
            // 每30秒更新令牌状态
            setInterval(loadTokenInfo, 30000);
            
            // 自动刷新即将过期的令牌（剩余时间小于5分钟）
            setInterval(() => {
                const token = localStorage.getItem('ku9_token');
                if (token) {
                    try {
                        const tokenData = JSON.parse(atob(token));
                        const expires = new Date(tokenData.expires * 1000);
                        const now = new Date();
                        const timeLeft = (expires - now) / 1000;
                        
                        if (timeLeft > 0 && timeLeft < 300) { // 小于5分钟
                            refreshToken();
                        }
                    } catch(e) {
                        // 忽略无效令牌
                    }
                }
            }, 60000); // 每分钟检查一次
        });
    </script>
</body>
</html>`;
}

// ==================== API处理函数 ====================

async function handleUpload(request) {
  try {
    const { filename, password, content } = await request.json();
    
    if (!filename || !password || !content) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: '缺少必要参数' 
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 在实际应用中，这里应该保存到数据库
    // 目前使用模拟成功响应
    const fileLink = `/api/read?filename=${encodeURIComponent(filename)}`;
    
    return new Response(JSON.stringify({
      success: true,
      fileLink: fileLink,
      filename: filename,
      message: '文件上传成功'
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

async function handleReadFile(request, env, ctx) {
  const url = new URL(request.url);
  const filename = url.searchParams.get('filename');
  
  if (!filename) {
    return new Response(JSON.stringify({ error: '缺少文件名' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // 检查是否为酷9播放器
  const isKu9Player = await identifyKu9Player(request);
  const ku9Token = request.headers.get('X-Ku9-Token');
  const ku9TokenValid = ku9Token ? (await validateKu9Token(ku9Token)).valid : false;
  
  // 在实际应用中，这里应该从数据库读取
  let content = `这是文件 ${filename} 的内容（模拟数据）。\n\n`;
  content += `生成时间：${new Date().toLocaleString('zh-CN')}\n`;
  content += `文件大小：${filename.length * 10} 字节\n`;
  content += `访问者IP：${request.headers.get('CF-Connecting-IP') || '未知'}\n`;
  content += `酷9播放器：${isKu9Player || ku9TokenValid ? '是' : '否'}\n\n`;
  content += `这是一个示例文本文件的内容。在实际应用中，这里应该是您保存的实际文本内容。\n`;
  content += `文件 ${filename} 可以通过酷9播放器专用接口访问，其他播放器将看到加密内容。`;
  
  // 如果不是酷9播放器且启用了加密，则加密内容
  if (CONFIG.ENCRYPTION_ENABLED && !isKu9Player && !ku9TokenValid) {
    const encryptedContent = await encryptContent(content);
    
    return new Response(JSON.stringify({
      content: `🔒 此内容已加密，仅限酷9播放器访问\n加密数据：${encryptedContent.substring(0, 100)}...`,
      fileLink: request.url,
      encrypted: true,
      message: '非酷9播放器访问，内容已加密',
      hint: '请使用酷9播放器或提供有效令牌访问原始内容'
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'X-Content-Encrypted': 'true',
        'X-Available-For': 'Ku9Player only'
      }
    });
  }
  
  // 酷9播放器可以访问原始内容
  return new Response(JSON.stringify({
    content: content,
    fileLink: request.url,
    encrypted: false,
    player: isKu9Player ? '酷9播放器' : '其他播放器',
    timestamp: new Date().toISOString()
  }), {
    headers: { 
      'Content-Type': 'application/json',
      'X-Ku9-Access': isKu9Player || ku9TokenValid ? 'granted' : 'denied'
    }
  });
}

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
        content: `包含关键词 "${keyword}" 的文件内容示例...`
      },
      { 
        name: `搜索结果2_${keyword}.txt`, 
        size: 2048, 
        uploaded: new Date().toISOString(),
        content: `另一个包含 "${keyword}" 的文件...`
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

// ==================== 新增API处理函数 ====================

/**
 * 处理管理操作
 */
async function handleAdminOperation(request, operation) {
  if (!validateAdminToken(request)) {
    return new Response(JSON.stringify({ error: '无效的管理令牌' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  switch (operation) {
    case 'clear':
      accessLogs = [];
      return new Response(JSON.stringify({ 
        success: true, 
        message: '日志已清空',
        clearedCount: accessLogs.length
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    
    case 'stats':
      return new Response(JSON.stringify(getAnalyticsData()), {
        headers: { 'Content-Type': 'application/json' }
      });
    
    case 'config':
      // 返回安全配置（不包含密钥）
      const safeConfig = {
        ...CONFIG,
        KU9_SECRET_KEY: '***隐藏***',
        ADMIN_TOKEN: '***隐藏***',
        SOURCE_ACCESS_TOKEN: '***隐藏***',
        ENCRYPTION_KEY: '***隐藏***'
      };
      return new Response(JSON.stringify(safeConfig), {
        headers: { 'Content-Type': 'application/json' }
      });
    
    default:
      return new Response(JSON.stringify({ error: '未知的管理操作' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
  }
}

/**
 * 获取源码（受令牌保护）
 */
function getSourceCode(request) {
  if (!validateSourceToken(request) && !validateAdminToken(request)) {
    return new Response('访问被拒绝，需要有效的源码查看令牌', {
      status: 403,
      headers: { 
        'Content-Type': 'text/html;charset=UTF-8',
        'X-Source-Access': 'denied'
      }
    });
  }
  
  // 这里返回当前Worker的源码
  // 注意：由于代码太长，这里只返回关键部分
  const sourceCode = `// Cloudflare Workers 文本存储网站 - 完整增强版
// 生成时间：${new Date().toISOString()}
// 版本：2.0.0
// 功能：酷9播放器识别、访问统计、管理后台、内容加密

// ==================== 配置常量 ====================
const CONFIG = {
  KU9_SECRET_KEY: '***隐藏***',
  KU9_TOKEN_EXPIRY: 3600,
  ADMIN_TOKEN: '***隐藏***',
  SOURCE_ACCESS_TOKEN: '***隐藏***',
  ANALYTICS_ENABLED: true,
  LOG_RETENTION_DAYS: 30,
  ENCRYPTION_ENABLED: true,
  ENCRYPTION_KEY: '***隐藏***'
};

// [完整代码共 ${Math.round(this.toString().length / 1024)} KB]
// 包含以下主要模块：
// 1. 酷9播放器识别系统
// 2. HMAC签名验证
// 3. 内容加密/解密
// 4. 访问统计系统
// 5. 管理后台界面
// 6. API处理函数
// 7. HTML界面生成

// 部署说明：
// 1. 修改CONFIG中的密钥和令牌
// 2. 部署到Cloudflare Workers
// 3. 配置自定义域名（可选）
// 4. 启用Workers KV存储访问日志（生产环境）

console.log('源码访问时间：', new Date().toISOString());
console.log('访问者IP：', request.headers.get('CF-Connecting-IP'));`;
  
  return new Response(sourceCode, {
    headers: {
      'Content-Type': 'text/javascript; charset=utf-8',
      'Content-Disposition': 'inline; filename="worker-source.js"',
      'X-Source-Version': '2.0.0'
    }
  });
}

/**
 * 酷9播放器专用API
 */
async function handleKu9Api(request, pathname) {
  const ku9Token = request.headers.get('X-Ku9-Token');
  const tokenValidation = ku9Token ? await validateKu9Token(ku9Token) : { valid: false };
  
  if (!tokenValidation.valid) {
    const isKu9Player = await identifyKu9Player(request);
    if (!isKu9Player) {
      return new Response(JSON.stringify({ 
        error: '访问被拒绝',
        reason: '无效的酷9令牌或播放器标识'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  
  switch (pathname) {
    case '/api/ku9/status':
      return new Response(JSON.stringify({ 
        status: 'active', 
        player: '酷9播放器',
        timestamp: new Date().toISOString(),
        token_valid: tokenValidation.valid,
        message: '专用接口已就绪',
        features: ['文件访问', '内容解密', '统计分析', '令牌管理'],
        version: '2.0.0'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    
    case '/api/ku9/config':
      return new Response(JSON.stringify({
        encryption_enabled: CONFIG.ENCRYPTION_ENABLED,
        analytics_enabled: CONFIG.ANALYTICS_ENABLED,
        token_expiry: CONFIG.KU9_TOKEN_EXPIRY,
        api_version: '2.0.0',
        endpoints: [
          '/api/ku9/status',
          '/api/ku9/config',
          '/api/ku9/analytics',
          '/api/read',
          '/api/search'
        ]
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    
    case '/api/ku9/analytics':
      const stats = getAnalyticsData();
      const ku9Stats = {
        total_ku9_requests: stats.byClientType['ku9_player'] || 0,
        total_requests: stats.totalRequests,
        last_24h: stats.last24Hours,
        ku9_percentage: stats.totalRequests > 0 
          ? Math.round(((stats.byClientType['ku9_player'] || 0) / stats.totalRequests) * 100)
          : 0,
        top_countries: Object.entries(stats.byCountry)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
      };
      
      return new Response(JSON.stringify(ku9Stats), {
        headers: { 'Content-Type': 'application/json' }
      });
    
    case '/api/ku9/refresh':
      if (tokenValidation.valid) {
        const requestId = generateRequestId();
        const timestamp = Math.floor(Date.now() / 1000);
        const expiresAt = timestamp + CONFIG.KU9_TOKEN_EXPIRY;
        
        const dataToSign = `${requestId}:${timestamp}:${expiresAt}`;
        const signature = await generateHMAC(dataToSign);
        
        const tokenData = {
          id: requestId,
          issued: timestamp,
          expires: expiresAt,
          player: '酷9播放器',
          signature: signature
        };
        
        const newToken = btoa(JSON.stringify(tokenData));
        
        return new Response(JSON.stringify({
          success: true,
          token: newToken,
          expires_in: CONFIG.KU9_TOKEN_EXPIRY,
          message: '令牌已刷新'
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        return new Response(JSON.stringify({
          success: false,
          error: '无法刷新无效令牌'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    
    default:
      return new Response(JSON.stringify({ 
        error: '未知的API端点',
        available_endpoints: ['/api/ku9/status', '/api/ku9/config', '/api/ku9/analytics', '/api/ku9/refresh']
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
  }
}

// ==================== 主处理函数 ====================
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const method = request.method;
    
    // 记录访问日志（除管理页面外）
    let logEntry = null;
    if (!pathname.startsWith('/admin') && !pathname.startsWith('/source') && CONFIG.ANALYTICS_ENABLED) {
      logEntry = await recordAccessLog(request, 'web_client');
    }
    
    // ==================== 酷9播放器识别中间件 ====================
    const isKu9Player = await identifyKu9Player(request);
    
    // 签发酷9令牌（如果是初始请求）
    if (isKu9Player && pathname === '/') {
      const response = await issueKu9Token(request);
      if (logEntry) updateLogStatus(logEntry.id, 'success', { clientType: 'ku9_player' });
      return response;
    }
    
    // 验证酷9令牌（如果是API请求）
    const ku9Token = request.headers.get('X-Ku9-Token');
    let ku9TokenValid = false;
    let ku9TokenData = null;
    if (ku9Token) {
      const validation = await validateKu9Token(ku9Token);
      ku9TokenValid = validation.valid;
      ku9TokenData = validation.data;
    }
    
    // 酷9播放器API路由
    if (pathname.startsWith('/api/ku9/')) {
      const response = await handleKu9Api(request, pathname);
      if (logEntry) {
        logEntry.clientType = 'ku9_player';
        updateLogStatus(logEntry.id, response.status === 200 ? 'success' : 'error');
      }
      return response;
    }
    
    // 拒绝无效的酷9 API请求
    if (isKu9ApiRequest(pathname) && !ku9TokenValid && !isKu9Player) {
      if (logEntry) updateLogStatus(logEntry.id, 'blocked', { reason: 'invalid_ku9_token' });
      return new Response(JSON.stringify({ 
        error: '访问被拒绝，无效的酷9播放器令牌或标识',
        hint: '请确保您的请求包含有效的酷9播放器标识或令牌',
        required_headers: ['X-Ku9-Token', 'User-Agent with Ku9Player']
      }), { 
        status: 403, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }
    // ==================== 中间件结束 ====================
    
    // 主页处理
    if (pathname === '/' || pathname === '/index.html') {
      // 酷9播放器专用界面
      if (ku9TokenValid || isKu9Player) {
        if (logEntry) {
          logEntry.clientType = 'ku9_player';
          updateLogStatus(logEntry.id, 'success', { tokenValid: ku9TokenValid });
        }
        return new Response(getKu9InterfaceHTML(), {
          headers: { 'content-type': 'text/html;charset=UTF-8' },
        });
      }
      
      // 普通用户界面
      if (logEntry) updateLogStatus(logEntry.id, 'success', { clientType: 'web_user' });
      return new Response(getIndexHTML(), {
        headers: { 'content-type': 'text/html;charset=UTF-8' },
      });
    }
    
    // 搜索页面
    if (pathname === '/search.html' || pathname === '/search') {
      if (logEntry) updateLogStatus(logEntry.id, 'success');
      return new Response(getSearchHTML(), {
        headers: { 'content-type': 'text/html;charset=UTF-8' },
      });
    }
    
    // 管理后台
    if (pathname.startsWith('/admin')) {
      if (!validateAdminToken(request)) {
        return new Response('访问被拒绝，需要有效的管理令牌', {
          status: 403,
          headers: { 
            'Content-Type': 'text/html;charset=UTF-8',
            'X-Admin-Access': 'denied'
          }
        });
      }
      
      // 管理操作API
      if (pathname === '/admin/clear' && method === 'POST') {
        const response = await handleAdminOperation(request, 'clear');
        if (logEntry) {
          logEntry.clientType = 'admin';
          updateLogStatus(logEntry.id, 'success');
        }
        return response;
      }
      
      if (pathname === '/admin/stats' && method === 'GET') {
        const response = await handleAdminOperation(request, 'stats');
        if (logEntry) {
          logEntry.clientType = 'admin';
          updateLogStatus(logEntry.id, 'success');
        }
        return response;
      }
      
      if (pathname === '/admin/config' && method === 'GET') {
        const response = await handleAdminOperation(request, 'config');
        if (logEntry) {
          logEntry.clientType = 'admin';
          updateLogStatus(logEntry.id, 'success');
        }
        return response;
      }
      
      // 管理页面
      if (logEntry) {
        logEntry.clientType = 'admin';
        updateLogStatus(logEntry.id, 'success');
      }
      
      const stats = getAnalyticsData();
      return new Response(getAdminHTML(stats), {
        headers: { 'content-type': 'text/html;charset=UTF-8' }
      });
    }
    
    // 源码查看
    if (pathname === '/source' || pathname === '/admin/source') {
      if (logEntry) {
        logEntry.clientType = 'source_viewer';
        updateLogStatus(logEntry.id, 'success');
      }
      return getSourceCode(request);
    }
    
    // API: 上传文件
    if (pathname === '/api/upload' && method === 'POST') {
      const response = await handleUpload(request);
      if (logEntry) updateLogStatus(logEntry.id, response.status === 200 ? 'success' : 'error');
      return response;
    }
    
    // API: 读取文件
    if (pathname === '/api/read' && method === 'GET') {
      const response = await handleReadFile(request, env, ctx);
      if (logEntry) {
        logEntry.clientType = ku9TokenValid || isKu9Player ? 'ku9_player' : 'web_user';
        updateLogStatus(logEntry.id, response.status === 200 ? 'success' : 'error');
      }
      return response;
    }
    
    // API: 搜索文件
    if (pathname === '/api/search' && method === 'POST') {
      const response = await handleSearch(request);
      if (logEntry) updateLogStatus(logEntry.id, response.status === 200 ? 'success' : 'error');
      return response;
    }
    
    // 默认返回主页
    if (logEntry) updateLogStatus(logEntry.id, 'redirect');
    return new Response(getIndexHTML(), {
      headers: { 'content-type': 'text/html;charset=UTF-8' },
    });
  },
};
