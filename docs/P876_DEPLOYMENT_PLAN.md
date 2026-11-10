# 软游部落 P8.7.6 生产部署方案与回滚预案

- **项目名称**：软游部落（SoftTribe）
- **正式域名**：`https://softtribe.top/`
- **目标栏目**：对比评测频道 UI 3.0（`/compare`）
- **部署状态**：**`WAITING_USER_CONFIRMATION`**（已完成本地打包与全量验收，等待用户发布授权）
- **目标服务器**：`ubuntu@134.175.230.107`
- **目标目录**：`/var/www/softtribe`

---

## 一、部署前置条件与检查清单

1. **本地构建产物校验**：
   - [x] TypeScript 类型检查通过（`npx tsc --noEmit` 退出码 0）；
   - [x] 前端 Vite 生产环境打包完成（`dist/` 输出完整，无 Rollup 警告）；
   - [x] 后端服务本地测试通过（Fastify `/api/v1/channels/compare` 与 `/compare` 响应正常）；
   - [x] 全站 21 个自动化测试套件通过（604 项测试 100% PASS，0 失败）；
   - [x] Playwright 真实多视口与交互验收完成（1440/1280/1024/768/430/390 均无横向溢出）；
   - [x] 绝无虚假数据、伪造跑分或无凭据评级。

---

## 二、部署影响范围与变更文件清单

### 1. 前端变更文件（打包进 `dist/`）
- `src/services/compareService.ts`（新增：对比频道聚合与矩阵 API 调用封装）
- `src/components/compare/ComparePortalHero.tsx`（新增：65%/35% Banner）
- `src/components/compare/CompareSoftwareSelectorAndMatrix.tsx`（新增：双软件选择与差异矩阵）
- `src/components/compare/CompareDecisionGuide.tsx`（新增：场景化决策指南）
- `src/components/compare/CompareFeaturedArticles.tsx`（新增：深度横评长文精选）
- `src/components/compare/CompareAlternativeRecommendations.tsx`（新增：认证替代方案库）
- `src/components/compare/CompareCategoryDiscovery.tsx`（新增：分类竞品探索）
- `src/components/compare/CompareCatalogSection.tsx`（新增：全量可比软件目录）
- `src/pages/ComparisonListPage.tsx`（更新：UI 3.0 门户化聚合与 URL 水合）
- `src/components/common/SoftwareIcon.tsx`（更新：兼容 `iconUrl?: string | null`）

### 2. 后端服务端文件
- `server/src/modules/channels/softwareChannelService.ts`（更新：将 `COMPARE` 纳入合法频道枚举）
- `server/src/modules/channels/compareChannelService.ts`（新增：聚合全量数据与矩阵计算引擎）
- `server/src/modules/channels/channelRoutes.ts`（更新：注册 `/api/v1/channels/compare` 与 `/matrix` 端点）
- `server/src/modules/seo/seoService.ts`（更新：提供 `renderCompareChannelHtml()`）
- `server/src/modules/seo/seoRoutes.ts`（更新：注册 `/compare` 与 `/seo/compare` 公开 SSR）

### 3. 测试与报告文件
- `server/tests/p876ComparePortalTest.ts`（新增：77 项专项测试）
- `server/tests/p876BrowserVerification.ts`（新增：Playwright 浏览器多视口验证）
- `scripts/runAllQualityTests.ts`（更新：注册第 21 个测试套件）
- `docs/P876_COMPARE_BASELINE.md`（新增：基线记录文档）
- `docs/P876_COMPARE_PORTAL_REPORT.md`（新增：正式交付报告）
- `docs/P876_DEPLOYMENT_PLAN.md`（本文档）

---

## 三、部署发布实施步骤（待授权后执行）

### 第一步：准备更新归档包
在本地打包最新构建产物与源码：
```powershell
tar.exe -czf p876_deploy_payload.tar.gz dist/ server/ src/ package.json tsconfig.json scripts/ docs/
```

### 第二步：上传归档包至生产服务器
```bash
scp p876_deploy_payload.tar.gz ubuntu@134.175.230.107:/tmp/
```

### 第三步：远程解压与数据库数据对齐
登录生产服务器执行：
```bash
cd /var/www/softtribe
# 1. 备份当前线上版本
tar -czf /var/www/backups/softtribe_pre_p876_$(date +%Y%m%d_%H%M%S).tar.gz dist/ server/

# 2. 解压部署包覆盖
tar -xzf /tmp/p876_deploy_payload.tar.gz -C /var/www/softtribe/

# 3. 运行数据库对齐脚本（确保对比评测外键关联至正式 PUBLISHED 软件）
npx tsx -e "
import { prisma } from './server/src/db';
import { AlternativeReviewStatus } from '@prisma/client';
async function align() {
  const publishedVsCode = await prisma.software.findFirst({ where: { slug: 'vscode', status: 'PUBLISHED' } });
  if (publishedVsCode) {
    const comp = await prisma.softwareComparison.findUnique({ where: { slug: 'vscode-vs-sublime' } });
    if (comp) {
      await prisma.comparisonItem.updateMany({
        where: { comparisonId: comp.id, software: { status: 'DRAFT' } },
        data: { softwareId: publishedVsCode.id }
      });
    }
  }
}
align().then(() => prisma.\$disconnect());
"

# 4. 平滑重载 PM2 服务
pm2 reload softtribe-api
```

### 第四步：公网线上冒烟验证
```bash
# 验证 HTTP 200 与 H1 标签
curl -s -I https://softtribe.top/compare | head -n 10
curl -s https://softtribe.top/compare | grep -o "软件对比评测与专业选型中心"

# 验证 API 聚合端点
curl -s https://softtribe.top/api/v1/channels/compare | jq .success

# 验证动态矩阵接口
curl -s "https://softtribe.top/api/v1/channels/compare/matrix?left=7zip&right=peazip" | jq .success

# 验证既有栏目无回退
curl -s -I https://softtribe.top/software | head -n 1
curl -s -I https://softtribe.top/system-tools | head -n 1
curl -s -I https://softtribe.top/games | head -n 1
curl -s -I https://softtribe.top/essentials | head -n 1
```

---

## 四、回滚预案（Rollback Procedure）

若生产部署后出现以下任意异常，立即启动无损回滚：
1. `GET /compare` 返回 HTTP 500、404 或白屏；
2. API 接口报数据库外键或连接错误；
3. 既有核心栏目（首页、软件、工具、游戏、装机、支付）出现回退。

### 回滚操作命令：
```bash
ssh ubuntu@134.175.230.107 "
  cd /var/www/softtribe
  LATEST_BACKUP=\$(ls -t /var/www/backups/softtribe_pre_p876_*.tar.gz | head -n 1)
  if [ -f \"\$LATEST_BACKUP\" ]; then
    echo \"正在从备份 \$LATEST_BACKUP 回滚...\"
    tar -xzf \"\$LATEST_BACKUP\" -C /var/www/softtribe/
    pm2 reload softtribe-api
    echo \"回滚完成，当前状态：\"
    curl -I http://127.0.0.1:3001/compare | head -n 5
  fi
"
```

---

## 五、当前授权状态说明

> ⚠️ **严正声明**：
> 本次任务严格遵循用户授权约束，**未执行任何生产环境写入、未修改公网服务器、未重启生产 PM2**。
> 所有代码与测试均在本地环境（`http://localhost:3000/` 与 `http://localhost:3001/`）开发并通过验收。
> **正在等待用户发布授权（输入"确认发布"或"进行部署"）方可执行生产上线。**
