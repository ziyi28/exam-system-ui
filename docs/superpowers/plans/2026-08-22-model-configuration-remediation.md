# Unified Model Configuration Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复统一模型配置中心的跨仓接口、安全、六场景覆盖与 Embedding 重建一致性缺陷，使管理员能够安全配置所有模型调用并通过全量验证。

**Architecture:** Java 继续作为管理员 API 与业务调用入口，Python ai-service 继续负责密钥存储、供应商调用与模型解析；前端严格消费 Java DTO。六个能力场景使用同一套名称与状态契约，Embedding 重建在整个失败/重试/切换生命周期内保持写锁并校验文档快照。

**Tech Stack:** Vue 3、TypeScript、Element Plus、Spring Boot、JUnit/MockMvc、Python/FastAPI、pytest、SQLite、AES-256-GCM。

## Global Constraints

- 仅管理员可读取或修改模型配置、探活、审计和重建状态。
- API Key 不得通过读取接口、日志、异常或审计详情返回明文。
- 六个场景必须完整覆盖：`QUESTION_GENERATION`、`SUBJECTIVE_GRADING`、`EXAM_SUMMARY`、`RAG_CHAT`、`RAG_EMBEDDING`、`DOCUMENT_PARSING`。
- Base URL 默认拒绝本机、私网、链路本地和云元数据地址；只有显式白名单主机可例外放行。
- 未配置场景才允许迁移期旧链路回退；网关超时、5xx 或解析错误不得二次调用。
- 不重写已经存在的 `master` 提交历史，修复全部保留在 `feat/model-configuration`。

---

### Task 1: 前端与 Java 管理接口契约统一

**Files:**
- Modify: `src/api/admin-model-config.ts`
- Modify: `src/types/admin-model-config.ts`
- Modify: `src/views/admin/ModelConfigView.vue`
- Test: `src/api/admin-model-config.test.ts`（若现有前端无测试框架，建立最小 Vitest 配置）

**Interfaces:**
- Consumes: Java `AiModelConfigurationController` 的 `/providers/{id}/disable`、`/capabilities/{capability}/drafts`、`/capability-configs/{id}/test|activate`。
- Produces: 页面直接消费请求封装已解包的数据对象，不再读取二次 `data`；类型与后端 DTO 同名。

- [x] 先写失败测试，验证禁用、草稿、探活、激活 URL 和 HTTP 方法与 Java 控制器一致。
- [x] 运行定向测试，确认旧路径导致预期失败。
- [x] 最小修改 API 封装，并为审计接口选择真实 Java 路径；若后端尚未提供，先保持调用测试为红，交由 Task 3 补齐。
- [x] 写失败测试或组件级行为测试，证明已解包响应不会再被读取为 `response.data`。
- [x] 修改页面数据加载与操作结果处理，运行测试转绿。

### Task 2: 六场景 DTO 和页面完整覆盖

**Files:**
- Modify: `src/types/admin-model-config.ts`
- Modify: `src/views/admin/ModelConfigView.vue`

**Interfaces:**
- Consumes: 后端 provider 类型 `OPENAI_COMPATIBLE | MINERU`、配置状态 `DRAFT | ACTIVE | RETIRED`、测试状态 `NOT_TESTED | PASSED | FAILED`。
- Produces: 六个场景的标签、草稿表单与正确字段，包括 `maxTokens` 和 RAG collection 配置。

- [x] 写失败的表驱动测试，以六个字面量能力为输入，断言每个场景均可创建草稿数据。
- [x] 运行测试确认 `RAG_CHAT`、`DOCUMENT_PARSING` 缺失。
- [x] 最小修改类型、映射和表单，删除前端虚构的 provider/status 字段。
- [x] 运行定向测试、`vue-tsc` 和 Vite build。

### Task 3: Python 配置安全、审计与部署闭环

**Files:**
- Modify: `ai-service/app/model_config_service.py`
- Modify: `ai-service/app/main.py`
- Modify: `ai-service/app/config.py`
- Modify: `ai-service/.env.example`
- Modify: `docker-compose.rag.yml`
- Modify: Java 管理代理 service/controller 及 DTO（按现有包路径）
- Test: `ai-service/tests/test_model_config_api.py`
- Test: `ai-service/tests/test_model_config_store.py`
- Test: Java `AiModelConfigurationControllerTest.java`

**Interfaces:**
- Consumes: `AI_MODEL_CONFIG_MASTER_KEY`（Base64 解码后恰好 32 字节）与 `AI_MODEL_ALLOWED_HOSTS`。
- Produces: 安全 URL 校验、真实操作者审计、Java 管理员审计代理接口、容器环境变量传递。

- [x] 写失败的参数化测试，覆盖 localhost、IPv4/IPv6 loopback、RFC1918、link-local、`169.254.169.254`、DNS 解析为私网和白名单例外。
- [x] 写失败测试，验证 GET/日志/异常/审计不含 API Key，且审计 actor 来自调用上下文而非固定 `admin`。
- [x] 写 MockMvc 鉴权测试，匿名为 401、教师和学生为 403、管理员成功。
- [x] 实现最小 URL 主机与解析地址校验，统一环境变量名为 `AI_MODEL_ALLOWED_HOSTS`。
- [x] 将 `.env.example` 改为占位说明，不提交可用固定主密钥；在 compose 中显式传递新变量。
- [x] 增加 Java 审计只读代理并运行 Python/Java 定向测试。

### Task 4: DOCUMENT_PARSING 真实接入统一配置

**Files:**
- Modify: `ai-service/app/document_parser.py`
- Modify: `ai-service/app/services.py`
- Modify: `ai-service/app/model_gateway.py`
- Test: `ai-service/tests/test_services.py`
- Test: `ai-service/tests/test_model_gateway.py`

**Interfaces:**
- Consumes: `DOCUMENT_PARSING` 的 active 配置，provider 类型为 `MINERU`，含解密后的临时调用凭据。
- Produces: 文档解析调用不再只依赖旧环境变量；只有未配置时才按既定迁移规则回退。

- [x] 写失败测试：active MinerU 配置覆盖旧环境变量，禁用/未配置行为符合回退规则，探活使用真实协议契约而非字符串检查。
- [x] 运行测试确认现有 `IngestionService` 仍固定构造旧 `MinerUClient(settings)`。
- [x] 以最小依赖注入方式按请求解析配置并调用，不引入第二套抽象。
- [x] 运行解析与网关测试转绿，并检查异常不泄露凭据。

### Task 5: Embedding 重建快照与写锁一致性

**Files:**
- Modify: Java `AiEmbeddingReindexService.java`
- Modify: 对应 mapper/entity（仅在原子状态更新或唯一约束确有需要时）
- Test: `AiEmbeddingReindexServiceTest.java`

**Interfaces:**
- Consumes: 重建 run/item 的状态、`contentHash` 与当前知识库文档集合。
- Produces: `RUNNING | FAILED | READY_TO_ACTIVATE | SWITCHING` 生命周期内一致的写保护；重试前验证快照，过期目标不得激活。

- [x] 写失败测试：FAILED run 仍阻止上传/删除；失败后文档变化会令重试或激活拒绝；并发启动只能创建一个 active run。
- [x] 逐个运行测试确认旧状态集合与 check-then-insert 逻辑导致失败。
- [x] 最小扩展受保护状态并加入数据库原子占位/条件更新；重试时重新核对全部文档 hash 与集合完整性。
- [x] 运行定向测试与 Java 全量测试。

### Task 6: 跨仓整合、回归与发布前审查

**Files:**
- Modify: `model-configuration-migration.md`（仅同步最终真实变量、接口和迁移行为）
- Modify: 本计划复选框状态

**Interfaces:**
- Consumes: Tasks 1–5 的稳定契约。
- Produces: 可复现的验证证据与未合并的功能分支。

- [x] 运行 Python 全量 pytest，记录通过数与失败输出。
- [x] 运行 Java 全量测试，确认题目生成、主观题批阅、考试总评、RAG 与管理员鉴权无回归。
- [x] 运行前端类型检查、单测与生产构建。
- [x] 用安全审查清单检查密钥、SSRF、权限和错误输出；用简化审查移除本次改动产生的重复与死代码。
- [x] 对 `feat/model-configuration` 相对基线做 pre-landing review；不自动 merge/push，向用户提交可核验结果。
