# Kế hoạch hiện tại: Hacom Cloud Admin

> Cập nhật: 2026-09-04  
> Trạng thái: đang phát triển và thử nghiệm; chưa sẵn sàng production.  
> Repository phát triển: <https://github.com/DoCuong2611/hacom-cloud-admin-panel>  
> Commit đang dùng: `e82ab20` (`ci: validate Cloud Admin build`)

Tài liệu này thay thế các bản kế hoạch cũ. Mục tiêu của bản này là ghi đúng những gì
đã có, những gì còn thiếu và thứ tự làm tiếp theo. Không coi giao diện demo hoặc
fixture là backend đã hoàn thành.

## 1. Quyết định về repository

Cloud Admin không được phát triển hoặc push vào repository công ty:

`https://github.com/hacom-holding-dx/chat-admin-panel`

Repository `chat-admin-panel` chỉ giữ admin panel hiện tại của công ty. Các branch
Cloud đã từng push vào đó đã được xóa; `origin/main` không còn mã Cloud.

Cloud Admin được phát triển độc lập tại:

`https://github.com/DoCuong2611/hacom-cloud-admin-panel`

Quy tắc bắt buộc:

- Chỉ push Cloud Admin vào repository mới.
- Trước khi push phải kiểm tra `git remote -v`.
- Không copy thư mục `.git` của repository công ty sang repository mới.
- Không đưa secret, token, cookie, service credential hoặc file môi trường thật lên Git.
- Không triển khai repository cá nhân lên server production của công ty.

## 2. Trạng thái thực tế

| Hạng mục | Trạng thái hiện tại | Kết luận |
| --- | --- | --- |
| Tách repository Cloud Admin | Đã hoàn tất | Có repository riêng cho Cloud Admin |
| UI Cloud Admin | Đã có bản A+B tích hợp | Đang dùng để phát triển và thử nghiệm |
| API client frontend | Đã có | Chỉ gọi public admin facade theo contract |
| Fixture local | Đã có | Chỉ được dùng khi phát triển local, không phải dữ liệu thật |
| `chat-admin-service` Cloud facade | Chưa có trong phạm vi repository này | Đây là dependency backend bắt buộc |
| Backend endpoint `/api/v1/admin/cloud/*` | Chưa được triển khai/verify đầy đủ | Không được coi tính năng đã chạy end-to-end |
| Prometheus/Grafana Cloud | Chưa tích hợp vận hành | Chỉ đưa vào sau khi có backend summary và datasource thật |
| Production deployment | Chưa được phép | Repo cá nhân không có workflow deploy production |
| CI repository mới | Đã có | `npm ci`, `npm run lint`, `npm run build` đã pass ở `e82ab20` |

Lỗi `404` đã quan sát khi gọi `/api/v1/admin/cloud/overview` xác nhận rằng giao diện
không thể tự thay thế backend. Khi backend chưa có facade, local fixture có thể giúp
kiểm tra layout và tương tác, nhưng không được dùng để kết luận Cloud đã tích hợp.

## 3. Mã nguồn hiện có

Bản Cloud Admin đã push vào `main` của repository mới gồm:

- `src/features/cloud/`: các page, hook, component, type và trạng thái Cloud;
- `src/api/clients/cloudClient/`: client cho Cloud admin facade;
- `src/api/clients/cloudOperationalClient/`: client cho operational summary;
- `src/api/cloud/` và `src/api/types/cloud/`: export và type dùng chung;
- route/menu Cloud trong `src/app/router/` và `src/app/layout/navigationConfig/`;
- fixture local và banner báo chế độ fixture;
- workflow `CI` cho lint/build.

Các đường dẫn trên mô tả snapshot trong repository Cloud Admin. Repository công ty
không được nhận các file này.

Các màn hình hiện có trong snapshot:

- Cloud Overview/read models;
- Cloud Observability;
- Cloud Quota Requests;
- Cloud Users, Drives và Items;
- Cloud Trash;
- Cloud Jobs;
- Cloud Audit.

Các màn hình trên mới là lớp frontend. Chúng chỉ trở thành chức năng thật sau khi
public facade, permission, dữ liệu canonical và test end-to-end đã sẵn sàng.

## 4. Contract đã thống nhất

Contract dưới đây đã được thống nhất ở mức đặc tả. Không gọi là “contract v1” hoặc
“contract dự kiến”. Tuy nhiên, contract chưa được coi là vận hành hoàn tất cho đến
khi backend triển khai và test qua staging.

### 4.1. Trust boundary

```text
Browser
  -> chat-admin-panel
  -> chat-admin-service public facade
  -> Auth service-token
  -> hacom-cloud-service internal API
  -> Cloud database/object storage/worker
```

Frontend không được gọi trực tiếp:

- `/internal/v1/cloud/*`;
- Cloud database hoặc object storage;
- Prometheus API hoặc `/metrics`;
- Grafana API hoặc URL nội bộ chưa được allowlist.

### 4.2. Contract quota review

Public facade mà frontend sẽ gọi:

```http
GET  /api/v1/admin/cloud/quota-requests
POST /api/v1/admin/cloud/quota-requests/{requestID}/approve
POST /api/v1/admin/cloud/quota-requests/{requestID}/reject
```

Danh sách dùng:

- `status=pending|approved|rejected`;
- `limit` từ 1 đến 100, mặc định 25;
- `cursor` opaque, không tự diễn giải ở frontend.

Mutation dùng:

```http
Authorization: browser-admin-bearer
Idempotency-Key: <1..128 chars>
X-Request-ID: <request-trace-id>
Content-Type: application/json
```

Body là `{}` nếu không có note. Chỉ cho phép chuyển `pending` sang `approved` hoặc
`rejected`. Backend phải giữ invariant quota, idempotency, actor và audit.

Frontend phải hiển thị đúng các trường hợp `400`, `403`, `404`, `409`, `429` và lỗi
upstream `502/503/504`; không đổi lỗi backend thành thông báo thành công.

### 4.3. Permission và service token

Browser permission:

- `admin.cloud.read`;
- `admin.cloud.quota.review`;
- `admin.cloud.observability.read`;
- các permission lifecycle/jobs/audit chỉ mở khi phase tương ứng có backend.

Cloud service scope:

- `cloud.quota.review` cho quota;
- `cloud.admin.read` cho read model và observability;
- scope lifecycle/jobs/audit chỉ cấp khi backend đã triển khai.

Browser không được tự gửi `X-Admin-Actor-ID`. Admin service phải lấy actor từ verified
admin context và tự thêm actor khi gọi Cloud internal API.

### 4.4. Observability

Frontend chỉ nhận summary từ facade:

```http
GET /api/v1/admin/cloud/observability
```

Prometheus là nơi lưu time-series; Grafana là nơi dashboard, drill-down và alert.
Hai hệ thống này không phải nguồn dữ liệu thay cho quota, user, item, job hoặc audit.

Nếu datasource không có dữ liệu, backend phải trả `partial` hoặc `unavailable` và
frontend phải hiển thị đúng trạng thái, không đổi thành số 0 giả.

## 5. Roadmap theo phase

### Phase 0 — Tách repository và đặt guardrail

Trạng thái: **hoàn tất**.

Đầu ra:

- repository Cloud Admin riêng;
- remote cá nhân đã được kiểm tra;
- Cloud không còn trên `origin/main` của repository công ty;
- CI cá nhân không chạy deploy production của công ty.

### Phase 1 — Backend facade quota review

Trạng thái: **chưa hoàn tất; đang chờ backend**.

Owner chính: `chat-admin-service`, phối hợp Auth và `hacom-cloud-service`.

Việc cần làm:

- provision service client và scope theo contract;
- triển khai `CloudServiceTokenClient` có cache và timeout;
- triển khai public facade quota list/approve/reject;
- kiểm tra browser permission và verified actor;
- forward request ID và idempotency key;
- map lỗi upstream và ghi audit;
- viết contract test giữa Admin Service và Cloud Service.

Gate hoàn thành: gọi thật từ Admin Service đến Cloud internal API qua staging, nhận
đúng response/error envelope và request ID. Nếu gate này chưa đạt, Phase 2 chỉ được
test bằng fixture local.

### Phase 2 — Kết nối UI quota review

Trạng thái: **frontend đã có bản triển khai; tích hợp thật chưa hoàn tất**.

Đã có:

- table quota request;
- cursor pagination và filter status;
- detail drawer;
- review modal, note và confirmation;
- loading, empty, forbidden, conflict, rate-limit và upstream states;
- API client tập trung.

Còn thiếu:

- kết nối và verify facade staging;
- tắt fixture khi chạy staging;
- test approve/reject end-to-end;
- xác nhận query invalidate và idempotent retry với backend thật.

### Phase 3 — Observability Cloud

Trạng thái: **UI shell có thể hiển thị fixture; backend Prometheus/Grafana chưa hoàn tất**.

Việc cần làm:

- expose summary qua Admin Service;
- cấu hình scrape Cloud API và Worker bằng Prometheus nội bộ;
- provision dashboard/alert Grafana có owner và runbook;
- trả freshness, source status, bounded signals và warning code;
- không cho browser query PromQL hoặc Grafana API trực tiếp.

### Phase 4 — Cloud read model

Trạng thái: **UI read-model có trong snapshot; backend read API chưa hoàn tất**.

Phạm vi:

- overview Cloud;
- user usage;
- drive metadata;
- item metadata.

Backend phải cung cấp dữ liệu bounded, pagination, permission và masking. Frontend
không được dùng user API owner-scoped để đọc dữ liệu của user khác.

### Phase 5 — Trash và lifecycle

Trạng thái: **UI shell có trong snapshot; backend policy và mutation chưa hoàn tất**.

Chỉ mở restore/permanent delete sau khi có permission riêng, retention policy, audit,
confirmation và nếu cần dual-control. Không expose raw object key, signed URL hoặc
raw content trong admin UI.

### Phase 6 — Worker jobs và Cloud audit

Trạng thái: **UI shell có trong snapshot; backend contract và vận hành chưa hoàn tất**.

Phạm vi:

- bounded job list/detail;
- trạng thái queued/running/succeeded/failed/dead/cancelled;
- retry/cancel theo permission riêng;
- audit Cloud có actor, request ID và operation ID;
- dashboard dead job/retry/purge có alert và runbook.

## 6. Phân công A/B trong repository mới

Hai người chỉ làm song song trong `hacom-cloud-admin-panel`:

| Người | Phạm vi chính | Không tự ý thay đổi |
| --- | --- | --- |
| A | `src/api/`, API types, route helper, response adapter, contract tests frontend | UI business rendering của B |
| B | `src/features/cloud/`, page, hook, component, UI state và fixture local | API envelope hoặc backend contract của A |

Quy tắc:

- A và B tạo branch từ `main` của repository Cloud Admin.
- Không dùng branch của repository công ty.
- Mỗi branch giữ phạm vi file riêng để tránh conflict.
- Khi tích hợp, người merge kiểm tra import, route, type, query key, API path và
  dependency trước khi giải quyết conflict.
- Không xóa logic của bên kia chỉ để hết conflict.
- Fixture chỉ được giữ cho local development và phải có chỉ báo rõ ràng.

## 7. Cấu hình và môi trường

Local frontend dùng public admin root:

```text
VITE_ADMIN_API_ROOT=/api/v1/admin
VITE_AUTH_BASE_URL=/api/v1/auth
```

Chế độ fixture local có thể dùng để kiểm tra UI khi backend chưa có:

```text
VITE_CLOUD_API_MODE=fixture
```

Biến này không được dùng để giả lập staging/production. Khi backend đã sẵn sàng,
staging phải chạy backend mode và xác nhận request đi qua Admin Service facade.

Các biến service token, Cloud base URL, Prometheus và Grafana chỉ thuộc backend;
không đưa vào bundle frontend.

## 8. Thứ tự công việc tiếp theo

1. Backend owner hoàn thành Phase 1 và contract test ở staging.
2. Team frontend dùng repository Cloud Admin để chạy Phase 2 với backend thật.
3. Xác nhận login → list → detail → approve/reject → audit.
4. Sau khi quota review ổn định, triển khai Phase 3 observability.
5. Tiếp tục Phase 4, 5 và 6 theo đúng permission và read model tương ứng.
6. Chỉ release khi không còn fixture, không còn 404 facade và có rollback/runbook.

## 9. Definition of Done

Cloud Admin chỉ được coi là sẵn sàng tích hợp khi:

- mã nguồn nằm trong repository Cloud Admin riêng;
- frontend chỉ gọi `/api/v1/admin/cloud/*`;
- backend facade đã deploy và verify ở staging;
- permission, service token, actor, request ID và idempotency hoạt động đúng;
- quota state là dữ liệu canonical từ Cloud Service;
- lỗi 403/404/409/429/upstream được hiển thị đúng;
- Prometheus/Grafana được gọi gián tiếp qua summary backend;
- fixture đã tắt ở staging/production;
- có test frontend, contract test backend và E2E flow;
- `npm run lint`, `npm run build` và test liên quan đều pass;
- không có secret hoặc production deployment không được phê duyệt.

Hiện tại mới đạt phần tách repository, frontend snapshot A+B và CI lint/build. Các
gate backend, staging E2E, observability thật và production release vẫn chưa đạt.
