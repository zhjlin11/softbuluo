# 软游部落 P8.9.1 —— 生产下载来源健康度、可达性与可信度分级复检报告

**文档编号**：ST-P891-DL-06  
**审计时间**：2026-11-12 14:45:00 (CST)  
**审计样本**：正式发布的 30 款软件所绑定的全部 97 条下载来源  
**审计方式**：生产环境真实联网微探针（限制 5 秒超时、SSRF 环回过滤与防轰炸限速）

---

## 一、下载来源可达性全量统计

通过执行 [scripts/analyze_audit.py](file:///E:/Code/新建文件夹/scripts/analyze_audit.py)，对线上生产数据库中的 97 条下载源进行了逐一网络连通性探测，实测真实汇总如下：

| 指标维度 | 数量 / 占比 | 行业标准评价 |
| :--- | :---: | :--- |
| **审计下载来源总量** | **97 条** | 覆盖 30 款正式发布软件的官方渠道与备用下载点 |
| **HTTPS 协议合规率** | **97 / 97 (100.0%)** | **达到顶级安全标准**，无任何明文 HTTP 不安全链接 |
| **直接可达（HTTP 200/OK）** | **53 条 (54.6%)** | 官方直接下载包或无 WAF 阻拦的外部下载页面 |
| **WAF / 登录防御（401/403）** | **9 条 (9.3%)** | 受 Cloudflare/人机验证防护的官方页面（如 Blender、HWiNFO） |
| **失效或链接调整（HTTP 404）**| **35 条 (36.1%)** | **需人工复核与数据治理的核心对象**（主要为历史重复项） |

### 来源类型分布
- `EXTERNAL_DOWNLOAD_PAGE`（官方外部下载页）：**78 条**
- `OFFICIAL_DIRECT`（官方直链安装包）：**17 条**
- `OFFICIAL_RELEASE`（GitHub Release 等发布页）：**2 条**

---

## 二、需要人工复核与重点治理的来源清单（Top 15）

```text
1. [HTTP 404] 7-Zip | 7-Zip 官方直链安装包 (Windows ARM64)
   URL: https://www.7-zip.org/a/7z2409-arm64.exe
   原因: 7-Zip 官网已发布新版本号，原写死版本文件路径变更。
   建议: 调整为最新版本安装包路径或回退为官网统一下载页。

2. [AUTH_OR_FORBIDDEN (403)] Blender 顶尖开源全能三维动画与渲染套件
   URL: https://www.blender.org/download/
   原因: 遭遇 Blender 官网 Cloudflare 客户端指纹防护，非真实故障。
   建议: 浏览器人工点击确认完全正常，保留该官方下载页。

3. [AUTH_OR_FORBIDDEN (403)] HWiNFO64 专业硬件传感器监控
   URL: https://www.hwinfo.com/download/
   原因: 官网防爬虫策略阻止了服务器 HEAD 探测，人工访问正常。
   建议: 判定为合规官方来源，标注状态为人工审核通过。

4. [HTTP 404] Visual Studio Code | 历史冗余记录 (多条重复指向 updates/latest)
   URL: https://code.visualstudio.com/updates/latest
   原因: 微软官方已调整该路由，且数据库中存在早前导入的重复记录。
   建议: 在数据库中安全清理重复无用的旧记录，保留正规稳定的下载链接。
```

---

## 三、可信度分级（Level 1 ~ Level 6）严格标尺

为了坚决杜绝夸大宣传，项目确立了科学、客观、同口径的下载源可信度 6 级标尺：

```text
Level 1 ── 【协议安全】URL 符合标准 HTTPS 加密传输规范（当前达标率 100%）。
Level 2 ── 【网络可达】探针检测 HTTP 200，无恶意重定向。
Level 3 ── 【官方来源】经人工复核或备案核验确认为开发者官方域名（如 *.microsoft.com）。
Level 4 ── 【官方直链】直达官方服务器或官方 CDN 原始安装包（如 VSCodeUserSetup.exe）。
Level 5 ── 【哈希比对】经自动化或人工拉取文件并与原厂公布的 SHA-256 完全校验一致（目前为 0，不盲目宣称）。
Level 6 ── 【数字签名】校验 Windows Authenticode / macOS Developer 证书签名链有效（目前为 0，不盲目宣称）。
```

> [!IMPORTANT]
> **真实度原则**：在未实际下载可执行二进制文件并解析 PE 签名证书前，**严禁将任何下载源标定为 Level 5 或 Level 6**。当前系统最高标定为 Level 4，如实告知用户，彰显技术诚信。
