import { prisma } from '../server/src/db';

async function main() {
  console.log('--- 写入 P7 开发者与社区冷启动官方权威指引 ---');

  const admin = await prisma.user.findFirst();
  const authorId = admin?.id || 'admin';

  const guides = [
    {
      title: '软游部落开发者入驻与官方认证全流程指南',
      slug: 'developer-verification-guide',
      summary: '面向软件原厂开发团队、独立作者与开源维护者的软游部落入驻认证标准、权益说明与审核规范。',
      content: `## 为什么入驻软游部落？

软游部落致力于打造中文互联网可信、透明、无捆绑的优质软件与游戏发现门户。通过官方开发者认证，您将获得：

1. **原厂官方认证徽章**：在软件详情页与社区回复中展示专属官方作者徽章，建立权威信任。
2. **软件资产所有权绑定**：认领属于您团队的软件词条，直接维护官方发行渠道、版本更新日志与正版说明。
3. **开放 API 专属接入权益**：获取每日高达数万次的高额 OpenAPI 访问限额，轻松集成自动化版本发布流水线。
4. **直达社区反馈**：接收用户提交的使用反馈与故障工单，直接进行官方答疑与排障沟通。

## 入驻流程与准备材料

1. **注册会员账号**：使用常用手机号或邮箱注册软游部落账号并完成实名登录。
2. **提交开发者申请**：进入 [开发者门户](/developer) 填写开发者名称、机构信息、官方域名及 GitHub/Gitee 主页。
3. **审核与复核**：平台编辑将在 1-2 个工作日内核实官方主体真实性，审核通过后即可获得 VERIFIED 认证身份。`,
      seoTitle: '软游部落开发者入驻指南 - 官方认证与软件维护通道',
      seoKeywords: '开发者入驻,软件认领,官方认证,软游部落,开发者生态',
      seoDescription: '软游部落官方开发者入驻标准与流程指南，支持开源作者与商业团队认领软件主页，提供开放 API 与版本维护权限。',
      status: 'PUBLISHED',
    },
    {
      title: '软件所有权认领操作教程：DNS TXT 与 .well-known 文件校验实战',
      slug: 'software-claim-verification-tutorial',
      summary: '手把手教您如何通过 DNS TXT 记录或 Web 根目录文件校验，安全完成软游部落软件词条所有权认领。',
      content: `## 认领背景与安全边界

为杜绝冒领与恶意篡改他人软件信息，软游部落采用业界标准的 **密码学不可预测挑战凭证** 进行所有权核验。

## 认领步骤

### 方式一：DNS TXT 记录校验（推荐）
1. 在已认证开发者工作台提交认领申请，选择“DNS TXT 验证”。
2. 系统将生成一组唯一的随机指纹，如：\`softbuluo-claim-xxxxxxxxxxxxxxxx\`。
3. 登录您的域名 DNS 管理控制台（阿里云、腾讯云、Cloudflare 等），添加一条主机记录为 \`@\` 或 \`_softbuluo\` 的 TXT 记录，内容为该随机指纹。
4. 返回软游部落工作台点击“发起校验”，系统验证 DNS 解析匹配后即可完成官方认领。

### 方式二：.well-known 静态文件校验
1. 选择“文件验证”，在您的官网服务器根目录下创建目录：\`/.well-known/\`。
2. 创建文本文件 \`softbuluo.txt\`，并将系统分配的挑战密钥写入文件。
3. 确保外网可通过 \`https://yourdomain.com/.well-known/softbuluo.txt\` 正常访问且响应为纯文本。
4. 返回工作台提交核验即可。`,
      seoTitle: '软件所有权认领教程 - DNS TXT与文件校验 - 软游部落',
      seoKeywords: '软件认领,DNS TXT验证,well-known,所有权校验,软游部落',
      seoDescription: '详尽的软游部落软件词条所有权认领指引，通过权威 DNS TXT 记录或 Web 根目录文件验证，确保权属安全。',
      status: 'PUBLISHED',
    },
    {
      title: '软游部落社区行为准则与高质量软件问题反馈指南',
      slug: 'community-guidelines-and-feedback-rules',
      summary: '共同维护友善、客观、高质量的技术交流环境，掌握清晰准确提交软件 Bug 与环境报错的提问模板。',
      content: `## 社区基本原则

1. **尊重事实，文明交流**：讨论基于真实使用体验与可复现事实，禁止人身攻击、恶意抹黑或软文营销。
2. **坚决打击恶意推广与盗版**：严禁发布任何侵权破解补丁、恶意木马外链、赌博引流或违规内容。
3. **官方作者权威尊重**：认证开发者的回复代表官方意见，用户可在对应回复下进行深入技术探讨。

## 规范反馈模板（提升 90% 解决效率）

在社区发起【安装故障】或【技术求助】时，建议包含以下核心要素：

- **软件名称与具体版本**：例如 \`VS Code v1.96.0 x64\`。
- **操作系统与补丁版本**：例如 \`Windows 11 23H2 (OS Build 22631.3880)\`。
- **问题现象与具体复现步骤**：点击什么按钮后出现何种异常。
- **关键报错弹窗与错误代码**：如 \`0x80070005\`、缺少 \`VCRUNTIME140.dll\` 等。
- **已尝试过的排障方法**：已重新安装但仍报错等。`,
      seoTitle: '社区交流准则与问题反馈指南 - 软游部落社区',
      seoKeywords: '社区准则,Bug反馈,问题求助,故障排查,提问艺术',
      seoDescription: '软游部落社区交流规范与高质量排障求助模板，促进用户与官方开发者之间的高效客观沟通。',
      status: 'PUBLISHED',
    },
    {
      title: '软游部落下载来源管理规范与安全免责白皮书',
      slug: 'official-download-source-policy',
      summary: '公开透明地了解软游部落官方外链、开源镜像与授权资源的审核标准及安全检测流程。',
      content: `## 我们的资源收录准则

软游部落始终坚持 **“原厂直达、官方核验、无捆绑流氓、杜绝篡改”** 的建站初心：

1. **官方权威来源优先**：所有收录软件默认提供原厂官方主页与开发者公开直链，绝不使用高速下载器进行流氓捆绑。
2. **严禁虚假安全认证**：对于未在物理沙箱执行完整多引擎病毒查杀的外部直链，系统如实输出 \`NOT_SCANNED\` 状态，仅出具官方域名核验结论，绝不冒充“100%安全无毒”。
3. **数字签名证书核实**：针对实体分发包，系统通过 Authenticode 规范提取开发者代码签名证书与 SHA-256 哈希值，确保文件自出厂以来未被任何第三方篡改。
4. **版权保护与侵权处理**：平台尊重一切正版软件与开源协议著作权，设立公开的侵权投诉渠道，核实后 24 小时内下架争议内容。`,
      seoTitle: '下载来源规范与安全白皮书 - 软游部落',
      seoKeywords: '安全规范,下载来源,代码签名,数字证书,无捆绑下载',
      seoDescription: '软游部落官方关于下载来源审核、代码数字签名核验及安全免责的公开透明声明。',
      status: 'PUBLISHED',
    }
  ];

  for (const g of guides) {
    const existing = await prisma.tutorial.findUnique({ where: { slug: g.slug } });
    if (existing) {
      console.log(`  - 已存在: ${g.title}`);
    } else {
      await prisma.tutorial.create({
        data: {
          title: g.title,
          slug: g.slug,
          summary: g.summary,
          content: g.content,
          seoTitle: g.seoTitle,
          seoKeywords: g.seoKeywords,
          seoDescription: g.seoDescription,
          status: g.status,
          authorId,
          publishedAt: new Date()
        }
      });
      console.log(`  + 成功写入冷启动指引: ${g.title}`);
    }
  }

  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
