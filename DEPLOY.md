# Деплой BAKAR на bakar-seeds.com

Стек развёртывания: **nginx** (HTTPS + статика) → **PM2** (Node-процесс) → **MySQL**.
Без Docker. Инструкция для чистого Ubuntu 22.04/24.04.

Схема:

```
Интернет ──HTTPS──> nginx ──┬──> /assets/, /uploads/   (с диска, кэш надолго)
                            └──> всё остальное → PM2 → Node :4000 (127.0.0.1)
                                 ├─ HTML с подстановкой мета-тегов (SEO)
                                 ├─ /api/*
                                 ├─ /img/* (ресайз картинок)
                                 └─ /sitemap.xml, /robots.txt
```

> **Почему HTML не раздаётся напрямую с диска.** Node подставляет в `index.html`
> свои `<title>`, `description`, Open Graph и JSON-LD под каждый маршрут — именно это
> делает SPA индексируемым. Если отдать `client/dist/index.html` через nginx напрямую,
> поисковики получат пустой шаблон. Поэтому в конфиге проксируется всё, кроме статики.

---

## 0. DNS

В панели домена создайте записи, указывающие на IP сервера:

| Тип | Имя | Значение |
|-----|-----|----------|
| A   | `@` (bakar-seeds.com) | `IP_СЕРВЕРА` |
| A   | `www`                 | `IP_СЕРВЕРА` |

Проверьте, что записи разошлись (иначе certbot не выдаст сертификат):
```bash
dig +short bakar-seeds.com
dig +short www.bakar-seeds.com
```

---

## 1. Софт на сервере

```bash
sudo apt update && sudo apt upgrade -y

# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# nginx, MySQL, certbot, утилиты
sudo apt install -y nginx mysql-server certbot python3-certbot-nginx git

# PM2 глобально
sudo npm install -g pm2

node -v && nginx -v && mysql --version
```

Файрвол:
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'      # 80 + 443
sudo ufw enable
sudo ufw status
```
Порт 4000 наружу **не открываем** — приложение слушает только `127.0.0.1`.

---

## 2. Пользователь и каталоги

```bash
sudo adduser --system --group --home /var/www/bakar bakar
sudo mkdir -p /var/www/bakar /var/log/bakar /var/www/certbot
sudo chown -R bakar:bakar /var/www/bakar /var/log/bakar
```

---

## 3. Код на сервер

Вариант А — через git:
```bash
sudo -u bakar git clone <URL_РЕПОЗИТОРИЯ> /var/www/bakar
```

Вариант Б — залить с локальной машины (из папки проекта):
```bash
rsync -avz --delete \
  --exclude node_modules --exclude dist --exclude .env \
  --exclude 'server/uploads/.cache' \
  ./ user@СЕРВЕР:/tmp/bakar/
ssh user@СЕРВЕР 'sudo rsync -a --delete /tmp/bakar/ /var/www/bakar/ && sudo chown -R bakar:bakar /var/www/bakar'
```

---

## 4. База данных

```bash
sudo mysql_secure_installation      # задать root-пароль, убрать анонимов
sudo mysql
```
```sql
CREATE DATABASE bakar CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'bakar'@'localhost' IDENTIFIED BY 'СИЛЬНЫЙ_ПАРОЛЬ_БД';
GRANT ALL PRIVILEGES ON bakar.* TO 'bakar'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```
Отдельный пользователь БД, не `root` — приложению не нужны права на другие базы.

---

## 5. Переменные окружения

```bash
sudo -u bakar cp /var/www/bakar/deploy/env.production.example /var/www/bakar/server/.env
sudo -u bakar nano /var/www/bakar/server/.env
sudo chmod 600 /var/www/bakar/server/.env
```

Обязательно заменить:
- `DATABASE_URL` — пароль из шага 4
- `JWT_SECRET` — сгенерировать: `openssl rand -hex 48`
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — первый вход в админку

---

## 6. Сборка и первый запуск БД

```bash
cd /var/www/bakar

sudo -u bakar npm install --prefix server
sudo -u bakar npm install --prefix client

sudo -u bakar npm run prisma:generate --prefix server
sudo -u bakar npx --prefix server prisma migrate deploy --schema server/prisma/schema.prisma
sudo -u bakar npm run db:seed --prefix server      # админ + стартовый контент

sudo -u bakar npm run build --prefix server        # → server/dist
sudo -u bakar npm run build --prefix client        # → client/dist
```

> `migrate deploy` накатывает готовую миграцию `server/prisma/migrations/0_init`
> и **не трогает** существующие данные. `db push` в проде не используем.

---

## 7. PM2

```bash
cd /var/www/bakar
sudo -u bakar pm2 start ecosystem.config.cjs
sudo -u bakar pm2 save

# автозапуск после перезагрузки сервера
sudo pm2 startup systemd -u bakar --hp /var/www/bakar
```

Проверка:
```bash
sudo -u bakar pm2 status
curl -s http://127.0.0.1:4000/health     # → {"ok":true}
```

---

## 8. HTTPS (сначала сертификат, потом полный конфиг)

Полный конфиг ссылается на файлы сертификата, которых ещё нет, — поэтому
сначала поднимаем временный HTTP-блок и получаем сертификат.

**8.1. Временный конфиг:**
```bash
sudo tee /etc/nginx/sites-available/bakar-seeds.com >/dev/null <<'EOF'
server {
    listen 80;
    server_name bakar-seeds.com www.bakar-seeds.com;
    location ^~ /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 200 'ok'; add_header Content-Type text/plain; }
}
EOF
sudo ln -sf /etc/nginx/sites-available/bakar-seeds.com /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

**8.2. Сертификат:**
```bash
sudo certbot certonly --webroot -w /var/www/certbot \
  -d bakar-seeds.com -d www.bakar-seeds.com \
  --email ВАШ_EMAIL --agree-tos --no-eff-email
```

Если certbot не создал вспомогательные файлы:
```bash
[ -f /etc/letsencrypt/options-ssl-nginx.conf ] || sudo curl -so /etc/letsencrypt/options-ssl-nginx.conf \
  https://raw.githubusercontent.com/certbot/certbot/main/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf
[ -f /etc/letsencrypt/ssl-dhparams.pem ] || sudo openssl dhparam -out /etc/letsencrypt/ssl-dhparams.pem 2048
```

**8.3. Боевой конфиг:**
```bash
sudo cp /var/www/bakar/deploy/nginx/bakar-seeds.com.conf /etc/nginx/sites-available/bakar-seeds.com
sudo nginx -t && sudo systemctl reload nginx
```

**8.4. Автопродление** (certbot ставит таймер сам, проверьте):
```bash
systemctl list-timers | grep certbot
sudo certbot renew --dry-run
```

---

## 9. Проверка после запуска

```bash
curl -I  https://bakar-seeds.com                       # 200, HTTP/2
curl -I  http://bakar-seeds.com                        # 301 → https
curl -I  https://www.bakar-seeds.com                   # 301 → apex
curl -s  https://bakar-seeds.com/sitemap.xml | head    # список URL из базы
curl -s  https://bakar-seeds.com/robots.txt
curl -s  https://bakar-seeds.com/products/grechka | grep -o '<title>[^<]*</title>'
#   → <title>Гречка — BAKAR</title>   (мета подставляются сервером = SEO работает)
curl -I  "https://bakar-seeds.com/img/packs-grains.jpg?w=640"   # image/webp
```

В браузере:
- сайт открывается, переключаются языки TM/RU/EN и тема;
- `https://bakar-seeds.com/admin` — вход под `ADMIN_EMAIL`;
- **сразу смените пароль**: Профиль → Смена пароля;
- загрузите тестовую картинку в баннер — файл появится в `server/uploads`.

---

## 10. Обновление сайта

```bash
cd /var/www/bakar
sudo -u bakar bash deploy/deploy.sh
```
Скрипт: обновляет код → ставит зависимости → накатывает миграции → пересобирает
сервер и клиент → перезапускает PM2.

---

## 11. Бэкапы

```bash
sudo chmod +x /var/www/bakar/deploy/backup.sh
sudo crontab -e
```
Добавить:
```
30 3 * * * /var/www/bakar/deploy/backup.sh >> /var/log/bakar/backup.log 2>&1
```
Складывает дамп базы и архив `uploads` в `/var/backups/bakar`, хранит 14 дней.

Восстановление:
```bash
gunzip < /var/backups/bakar/db-2026-07-23_0330.sql.gz | mysql -u bakar -p bakar
tar -xzf /var/backups/bakar/uploads-2026-07-23_0330.tar.gz -C /var/www/bakar/server
```

---

## 12. Если что-то не работает

| Симптом | Куда смотреть |
|---|---|
| 502 Bad Gateway | `sudo -u bakar pm2 logs bakar-api` — процесс упал или не слушает 4000 |
| Сайт открывается, но пустой | не собран клиент: `npm run build --prefix client` |
| В `<title>` шаблон вместо названия | nginx отдаёт `index.html` с диска — проверьте, что `location /` проксирует на Node |
| 500 на любом запросе к API | нет связи с MySQL: проверьте `DATABASE_URL` и `systemctl status mysql` |
| Картинки 404 | путь `alias` в блоке `/uploads/` и права на `server/uploads` |
| Не приходят заявки в Telegram | переменные `TELEGRAM_*` в `server/.env`, затем `pm2 restart bakar-api` |
| Логи | `pm2 logs bakar-api`, `/var/log/nginx/bakar-error.log`, `/var/log/bakar/` |

Полезное:
```bash
sudo -u bakar pm2 restart bakar-api      # перезапуск приложения
sudo -u bakar pm2 logs bakar-api --lines 100
sudo nginx -t && sudo systemctl reload nginx
```

---

## Замечания по безопасности

- `server/.env` — режим `600`, внутри пароль БД и `JWT_SECRET`.
- Пользователь MySQL `bakar` имеет права только на свою базу.
- Node слушает `127.0.0.1:4000`, наружу открыты только 80/443.
- Вход в админку ограничен: 10 попыток / 15 минут с одного IP.
- Cookie с токеном в проде уходит с флагом `Secure` (нужен HTTPS — он у нас есть).
- PM2 запущен в одном экземпляре намеренно: счётчики лимитера живут в памяти,
  при нескольких воркерах каждый выдавал бы свою квоту.
