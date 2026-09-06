# Ghi chú vận hành hiện tại: Hacom Cloud Admin

> Cập nhật: 2026-09-04  
> Đây là ghi chú vận hành theo trạng thái hiện tại, không phải bằng chứng Cloud đã
> được triển khai production.

## 1. Nơi phát triển và repository boundary

Cloud Admin được phát triển riêng tại:

<https://github.com/DoCuong2611/hacom-cloud-admin-panel>

Repository công ty `hacom-holding-dx/chat-admin-panel` không còn chứa branch Cloud.
Không dùng repository công ty làm remote push cho Cloud Admin.

`chat-admin-panel` chỉ là nguồn UI/UX kế thừa. Mọi code Cloud Admin phải nằm
trong repository riêng này. Không commit, push hoặc triển khai Cloud Admin từ
repository công ty nếu chưa có phê duyệt rõ ràng.

## 2. Trạng thái runtime

Repository mới hiện có frontend Cloud Admin tích hợp A+B và CI `Lint and build`.
Backend `hacom-cloud-service` chưa cung cấp đầy đủ public admin API Cloud; vì vậy UI local có
fixture để kiểm tra layout, filter, drawer, modal và error state.

Fixture không phải dữ liệu thật và không được bật khi staging hoặc production.
Không kết luận quota, user, item, job hoặc audit từ fixture.

## 3. Luồng runtime bắt buộc

```text
Admin browser
  -> hacom-cloud-admin-panel
  -> hacom-cloud-service /api/v1/admin/cloud/*
  -> Auth JWT/account authority
```

Prometheus chỉ scrape metrics nội bộ của Cloud API/Worker. Grafana đọc Prometheus để
hiển thị dashboard và alert. Browser không gọi trực tiếp Prometheus, Grafana, Cloud
internal API, database, object storage hoặc `/metrics`.

## 4. Điều kiện mở staging

Chỉ mở staging khi đã có:

- Cloud service public admin API cho quota review;
- browser admin JWT được Cloud service verify qua Auth JWKS/account authority;
- permission và verified actor;
- request ID, idempotency key và audit;
- response/error envelope đã test;
- Prometheus target Cloud API/Worker có owner;
- Grafana dashboard và runbook cho alert;
- cấu hình backend không chứa secret trong frontend.

## 5. Kiểm tra trước mỗi lần push

```bash
git remote -v
git status --short
npm run lint
npm run build
```

Remote phải là repository Cloud Admin. Nếu đang đứng trong `chat-admin-panel` công ty
thì dừng, không push Cloud.

## 6. Sự cố và cách phân loại

| Hiện tượng | Ý nghĩa |
| --- | --- |
| `404 /api/v1/admin/cloud/*` | Public admin API trong Cloud service chưa có hoặc route chưa được expose |
| `403` | Permission admin hoặc service authorization không đủ |
| `409` | Conflict state hoặc idempotency conflict |
| `429` | Bị rate limit, giữ retry information nếu backend trả về |
| Observability `partial/unavailable` | Prometheus/Grafana hoặc một source metrics chưa sẵn sàng |
| UI hiện fixture | Chỉ là local test mode, không phản ánh backend |

Khi gặp lỗi, giữ request ID, route, status code và environment; không log token,
cookie, authorization header, secret, signed URL hoặc raw object key.

## 7. Tiêu chí release

Không release Cloud Admin nếu còn một trong các điều kiện sau:

- frontend còn gọi internal Cloud API trực tiếp;
- Cloud service admin API chưa có contract test và staging E2E;
- fixture còn bật;
- chưa có audit actor/request ID;
- Grafana link chưa được allowlist;
- alert chưa có owner/runbook;
- CI lint/build hoặc test liên quan thất bại;
- repository/remote chưa được xác nhận là repository Cloud Admin.
