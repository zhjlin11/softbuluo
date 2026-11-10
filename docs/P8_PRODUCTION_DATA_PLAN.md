# 软游部落 P8-2 生产数据隔离与定向迁移实施方案

> **方案制定时间**：2026-11-09 21:32:00 (Asia/Shanghai)  
> **责任角色**：首席技术架构师 / 数据库工程师 / 支付安全工程师  
> **核心目标**：彻底将生产数据库与长期开发/回归测试使用的数据库实行物理隔离，确保公网正式运营环境拥有 100% 纯净、真实、合法的数据资产，绝不混入任何模拟订单、虚拟会员与测试工具。

---

## 1. 四级环境数据隔离架构 (Data Environment Topology)

软游部落正式确立严格的四级数据环境拓扑，各环境采用独立的数据库连接串与访问凭据：

```
+---------------------------------------------------------------------------------------+
|                                  环境数据隔离矩阵                                      |
+-------------------+-----------------------------+-------------------+-----------------+
| 环境级别          | 数据库标识 (DB Name)        | 允许的数据特征    | 商业支付模式    |
+-------------------+-----------------------------+-------------------+-----------------+
| 1. Development    | softbuluo                   | 真实资源 + 测试工具| MOCK 模拟支付   |
| 2. Automated Test | softbuluo_test / 内存库     | 纯测试数据 (用后清)| 模拟假回调      |
| 3. Staging Drill  | softbuluo_prod_drill        | 定向迁移已核实资源| 禁用 MOCK / 探针|
| 4. Production     | softbuluo_prod (生产物理库) | 100% 纯净真实资产 | 真实微信 API v3 |
+-------------------+-----------------------------+-------------------+-----------------+
```

### 生产环境隔离准则
1. **严禁直接恢复 dev 库**：严禁通过 `pg_restore` 将本地长期开发测试的 `softbuluo` 备份直接导入生产库。
2. **专属非 root 运行账号**：生产数据库建立专属只读/读写受限账号 `softbuluo_app`，严禁生产服务以 `postgres` 超级管理员身份直连。
3. **网络访问控制**：生产 PostgreSQL 端口 5432 仅监听 `127.0.0.1` 本地回环接口，防火墙物理阻断公网直连访问。

---

## 2. 数据分类与治理标签规范 (Data Classification Taxonomy)

历史数据根据可信度与来源划分为五大资产等级：

| 分类标识 | 定义范围 | 处理策略与流向 |
| :--- | :--- | :--- |
| **`REAL_VERIFIED`** | 经人工审核通过的 20 款主流开源/免费软件、官方分类、官方来源、审核凭证、发布教程、精选专题 | **允许定向迁移至生产数据库** |
| **`TEST_ONLY`** | 历史回归测试生成的 `test-tool-*` 软件 (16款)、`test_*@softbuluo.com` 会员 (14个)、测试令牌 | **永久留在开发测试库，严禁迁移** |
| **`MOCK_PAYMENT`** | 本地及测试套件生成的 136 笔订单 (含 78 笔 PAID)、模拟支付流水 `PaymentLog` | **永久留在开发测试库，严禁计入生产财务** |
| **`UNKNOWN_ORIGIN`** | 无官方权威域名或下载直链已失效的临时外链 | **降级并标记隔离，严禁发布** |
| **`IMPORTED_UNVERIFIED`** | P5 阶段批量爬取与收录的 63 款草稿资源 (`DRAFT`) | **保留在待审工作台，逐款人工审核，绝不批量发布** |

---

## 3. 生产数据库标准化初始化流程

当运维团队在正式公网服务器初始化生产数据库时，必须依序执行以下 4 步标准作业（SOP）：

### 步骤 1：创建空白生产数据库与专用业务账号
```sql
-- 以 postgres 超管登录后执行
CREATE DATABASE "softbuluo_prod" WITH ENCODING 'UTF8';
CREATE USER softbuluo_app WITH PASSWORD 'Strong_Random_App_Password_2026!';
GRANT ALL PRIVILEGES ON DATABASE "softbuluo_prod" TO softbuluo_app;
```

### 步骤 2：应用官方完整 Prisma 迁移
在服务器工程目录下，配置生产数据库连接串后执行：
```bash
DATABASE_URL="postgresql://softbuluo_app:Strong_Random_App_Password_2026!@127.0.0.1:5432/softbuluo_prod?schema=public" \
npx prisma migrate deploy --schema=server/prisma/schema.prisma
```
> **注意**：已在 P8 彻底修复 `20261108000000_init/migration.sql` 中的 UTF-8 BOM 头，确保在任何 Linux 生产环境中执行 `prisma migrate deploy` 零语法报错。

### 步骤 3：执行定向真实公开内容迁移
运行迁移工具脚本：
```bash
TARGET_DATABASE_URL="postgresql://softbuluo_app:Strong_Random_App_Password_2026!@127.0.0.1:5432/softbuluo_prod?schema=public" \
npx tsx scripts/importVerifiedPublicContent.ts
```

### 步骤 4：生产首个合规超级管理员安全创建
迁移脚本将自动生成初始超管 `admin@softbuluo.com`，初始密码采用 `crypto.scrypt` 不可逆加盐哈希（`SoftBuluo@2026!ProdMaster`，满足 10 位以上含大小写字母、数字及特殊符号策略），并在首次登录后强制要求修改。

---

## 4. 生产隔离演练结果与指标验收 (`softbuluo_prod_drill`)

在本地隔离环境测试库 `softbuluo_prod_drill` 上执行了端到端全流程初始化与迁移演练，实测验证数据如下：

```
================================================================
🛡️  软游部落 P8-2 隔离生产数据库演练终审核验结果
================================================================
【已迁移正式公开内容】
  * 真实发布软件 (Software)        : 20 款 (100% 正式开源/免费工具)
  * 官方分类目录 (Category)        : 10 个
  * 官方软件版本 (SoftwareVersion) : 20 个
  * 官方下载渠道 (DownloadSource)  : 32 条 (100% 官方正版外链)
  * 官方数据来源 (SoftwareSource)  : 76 个 (100% 官方域名)
  * 真实审核凭证 (Evidence)        : 120 条 (真实凭据链)
  * 官方实用教程 (Tutorial)        : 29 篇 (含 4 篇冷启动指南)
  * 精选运营专题 (Topic)           : 13 个
  * 深度对比评测 (Comparison)      : 2 篇
  * 官方商业商品 (Product)         : 3 款 (月度/年度VIP与单次服务)
  * 初始超管账号 (User)            : 1 个 (强哈希加密)

【严格安全红线指标 (必须全部为 0)】
  * 模拟测试订单 (Order)           : 0 笔  [PASS ✅]
  * 历史测试会员 (MemberUser)      : 0 名  [PASS ✅]
  * 虚假会员权益 (Entitlement)      : 0 条  [PASS ✅]
  * 模拟支付流水 (PaymentLog)      : 0 条  [PASS ✅]
  * 虚拟测试工具 (isTestData=true) : 0 款  [PASS ✅]
================================================================
```

---

## 5. 结论与上线准入判定

1. **方案可行性验证完毕**：定向内容迁移脚本 `scripts/importVerifiedPublicContent.ts` 运行稳定，耗时仅 577ms，外键依赖与唯一索引级联完整无损。
2. **生产财务纯净性 100% 保证**：生产库初始订单为 0，彻底切断了模拟测试资金数据外泄或污染正式财务账目的可能。
3. **技术演练状态**：`VERIFIED & READY`。当运维获得公网正式服务器权限后，可直接依此 SOP 执行正式落库。
