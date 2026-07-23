# Деплой BAKAR на bakar-seeds.com

Стек: **nginx** (HTTPS + статика) → **PM2** (Node-процесс) → **MySQL**. Без Docker.
Инструкция для чистого Ubuntu 22.04 / 24.04.

```
Интернет ──HTTPS──> nginx ──┬──> /assets/, /uploads/   (с диска, кэш надолго)
                            └──> всё остальное → PM2 → Node :4000 (127.0.0.1)
                                 ├─ HTML с подстановкой мета-тегов (SEO)
                                 ├─ /api/*
                                 ├─ /img/*  (ресайз картинок)
                                 └─ /sitemap.xml, /robots.txt
```

> **Почему HTML не раздаётся с диска.** Node подставляет в `index.html` свои `<title>`,
> `description`, Open Graph и JSON-LD под каждый маршрут — именно это делает SPA
> индексируемым. Если отдать `client/dist/index.html` через nginx напрямую, поисковики
> получат пустой шаблон. Поэтому проксируется всё, кроме статики.

---

## 0. DNS

| Тип | Имя | Значение |
|-----|-----|----------|
| A   | `@` (bakar-seeds.com) | `IP_СЕРВЕРА` |
| A   | `www`                 | `IP_СЕРВЕРА` |

```bash
dig +short bakar-seeds.com
dig +short www.bakar-seeds.com
```
Пока записи не разошлись, certbot сертификат не выдаст.

---

## 1. Софт

```bash
sudo apt update && sudo apt upgrade -y

curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx mysql-server certbot git

sudo npm install -g pm2
node -v && nginx -v
```

Файрвол (порт 4000 наружу не открываем — Node слушает только `127.0.0.1`):
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## 2. Пользователь и каталоги

```bash
sudo adduser --system --group --home /var/www/bakar bakar
sudo mkdir -p /var/www/bakar /var/log/bakar /var/www/certbot
sudo chown -R bakar:bakar /var/www/bakar /var/log/bakar

# nginx (www-data) должен уметь заходить в каталог и читать статику,
# иначе на /assets/ и /uploads/ будет 403.
sudo chmod 755 /var/www/bakar
```

---

## 3. Код на сервер

**Вариант А — git:**
```bash
sudo -u bakar git clone <URL_РЕПОЗИТОРИЯ> /var/www/bakar
```

**Вариант Б — rsync с локальной машины.** Исключения обязательны: без них `--delete`
сотрёт на сервере `server/.env` и все загруженные файлы.
```bash
rsync -avz --delete \
  --exclude 'node_modules' --exclude 'dist' \
  --exclude '.env' --exclude 'server/uploads' \
  ./ user@СЕРВЕР:/tmp/bakar/

ssh user@СЕРВЕР "sudo rsync -a --delete \
  --exclude '.env' --exclude 'uploads' \
  /tmp/bakar/ /var/www/bakar/ && sudo chown -R bakar:bakar /var/www/bakar"
```

---

## 4. База данных

```bash
sudo mysql_secure_installation
sudo mysql
```
```sql
CREATE DATABASE bakar CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'bakar'@'localhost' IDENTIFIED BY 'СИЛЬНЫЙ_ПАРОЛЬ_БД';
GRANT ALL PRIVILEGES ON bakar.* TO 'bakar'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```
Отдельный пользователь, не `root` — права только на свою базу.

> **Пароль в `DATABASE_URL` — это URL.** Спецсимволы нужно percent-кодировать:
> `@` → `%40`, `:` → `%3A`, `/` → `%2F`, `#` → `%23`, `?` → `%3F`.
> Пароль `p@ss:w/ord` записывается как `mysql://bakar:p%40ss%3Aw%2Ford@localhost:3306/bakar`.
> Проще всего сгенерировать пароль без спецсимволов: `openssl rand -base64 24 | tr -d '/+='`

---

## 5. Переменные окружения

```bash
sudo -u bakar cp /var/www/bakar/deploy/env.production.example /var/www/bakar/server/.env
sudo -u bakar nano /var/www/bakar/server/.env
sudo chmod 600 /var/www/bakar/server/.env
```

Обязательно заменить:
- `DATABASE_URL` — пароль из шага 4 (см. про кодирование выше)
- `JWT_SECRET` — `openssl rand -hex 48`. **В production приложение не запустится с пустым значением** — это защита от случайного дефолтного ключа.
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — первый вход

---

## 6. Зависимости, сборка, база

```bash
cd /var/www/bakar

sudo -u bakar npm install --prefix server
sudo -u bakar npm install --prefix client

sudo -u bakar npm run prisma:generate --prefix server
sudo -u bakar npm run build --prefix server     # → server/dist
sudo -u bakar npm run build --prefix client     # → client/dist

sudo -u bakar npm run db:deploy --prefix server # применить миграции
```

> `npm run --prefix` выполняется с рабочим каталогом `server/`, поэтому Prisma находит
> `server/.env`. Форма `npx --prefix server prisma ...` рабочий каталог **не меняет** —
> команда упадёт с `Environment variable not found: DATABASE_URL`.

### Начальный контент — только при первой установке

> ⚠️ **`db:seed` очищает контентные таблицы** (баннеры, категории, товары, сертификаты,
> отзывы, тексты) и заливает демо-данные Bakar. На работающем сайте это удалит всё,
> что наполнил заказчик. Запускать **один раз**, сразу после установки:

```bash
sudo -u bakar npm run db:seed --prefix server
```

Если наполняете сайт вручную — пропустите этот шаг и создайте только администратора.

---

## 7. PM2

```bash
cd /var/www/bakar
sudo -u bakar pm2 start ecosystem.config.cjs
sudo -u bakar pm2 save

# автозапуск после перезагрузки
sudo pm2 startup systemd -u bakar --hp /var/www/bakar

# ротация логов, иначе /var/log/bakar со временем забьёт диск
sudo -u bakar pm2 install pm2-logrotate
sudo -u bakar pm2 set pm2-logrotate:max_size 10M
sudo -u bakar pm2 set pm2-logrotate:retain 14
```

Проверка:
```bash
sudo -u bakar pm2 status
curl -s http://127.0.0.1:4000/health     # → {"ok":true}
```

---

## 8. HTTPS

Боевой конфиг ссылается на файлы сертификата, которых ещё нет, поэтому сначала —
временный HTTP-блок.

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

**8.2. Сертификат.** `--deploy-hook` обязателен: без него после автопродления nginx
продолжит отдавать старый сертификат до ближайшего ручного перезапуска.
```bash
sudo certbot certonly --webroot -w /var/www/certbot \
  -d bakar-seeds.com -d www.bakar-seeds.com \
  --email ВАШ_EMAIL --agree-tos --no-eff-email \
  --deploy-hook "systemctl reload nginx"
```

Конфиг подключает `options-ssl-nginx.conf` и `ssl-dhparams.pem`. Обычно их создаёт
пакет `python3-certbot-nginx`; если файлов нет — создайте их сами:
```bash
if [ ! -f /etc/letsencrypt/options-ssl-nginx.conf ]; then
sudo tee /etc/letsencrypt/options-ssl-nginx.conf >/dev/null <<'EOF'
ssl_session_cache shared:le_nginx_SSL:10m;
ssl_session_timeout 1440m;
ssl_session_tickets off;
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers off;
ssl_ciphers "ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384";
EOF
fi
[ -f /etc/letsencrypt/ssl-dhparams.pem ] || sudo openssl dhparam -out /etc/letsencrypt/ssl-dhparams.pem 2048
```

**8.3. Боевой конфиг** (сначала сниппеты — конфиг их подключает):
```bash
sudo mkdir -p /etc/nginx/snippets
sudo cp /var/www/bakar/deploy/nginx/security-headers.conf /etc/nginx/snippets/bakar-security-headers.conf
sudo cp /var/www/bakar/deploy/nginx/proxy.conf            /etc/nginx/snippets/bakar-proxy.conf
sudo cp /var/www/bakar/deploy/nginx/bakar-seeds.com.conf  /etc/nginx/sites-available/bakar-seeds.com
sudo nginx -t && sudo systemctl reload nginx
```

**8.4. Автопродление:**
```bash
systemctl list-timers | grep certbot
sudo certbot renew --dry-run
```

---

## 9. Проверка

```bash
curl -I  https://bakar-seeds.com                    # 200
curl -I  http://bakar-seeds.com                     # 301 → https
curl -I  https://www.bakar-seeds.com                # 301 → apex
curl -s  https://bakar-seeds.com/sitemap.xml | head # URL из базы
curl -s  https://bakar-seeds.com/robots.txt

# главное — мета подставляются сервером (SEO работает):
curl -s https://bakar-seeds.com/products/grechka | grep -o '<title>[^<]*</title>'
#   → <title>Гречка — BAKAR</title>

curl -I "https://bakar-seeds.com/img/packs-grains.jpg?w=640"   # image/webp
curl -sI https://bakar-seeds.com/assets/ | grep -i strict-transport   # заголовки на статике
```

В браузере:
- переключаются языки TM/RU/EN и тема;
- `https://bakar-seeds.com/admin` — вход под `ADMIN_EMAIL`;
- **сразу смените пароль**: Профиль → Смена пароля;
- загрузите картинку в баннер — файл появится в `server/uploads`.

---

## 10. Обновление

```bash
cd /var/www/bakar
sudo -u bakar bash deploy/deploy.sh
```
Код → зависимости → сборка → миграции → перезапуск PM2. Сборка идёт **до** миграций:
если сборка упала, база остаётся в согласии с работающей версией.

---

## 11. Бэкапы

```bash
sudo chmod +x /var/www/bakar/deploy/backup.sh
sudo crontab -e
```
```
30 3 * * * /var/www/bakar/deploy/backup.sh >> /var/log/bakar/backup.log 2>&1
```
Дамп базы + архив `uploads` в `/var/backups/bakar`, хранение 14 дней, права `600`.
Пароль передаётся через временный файл, а не в командной строке.

Восстановление:
```bash
gunzip < /var/backups/bakar/db-2026-07-23_0330.sql.gz | mysql -u bakar -p bakar

sudo tar -xzf /var/backups/bakar/uploads-2026-07-23_0330.tar.gz -C /var/www/bakar/server
sudo chown -R bakar:bakar /var/www/bakar/server/uploads   # иначе приложение не сможет писать
```

---

## 12. Если что-то не работает

| Симптом | Причина / куда смотреть |
|---|---|
| 502 Bad Gateway | процесс упал: `sudo -u bakar pm2 logs bakar-api` |
| Приложение не стартует, в логе про `JWT_SECRET` | пустой `JWT_SECRET` в `server/.env` (в проде это намеренно фатально) |
| 403 на `/assets/` или `/uploads/` | права: `sudo chmod 755 /var/www/bakar` |
| Сайт открывается пустым | не собран клиент: `npm run build --prefix client` |
| В `<title>` шаблон вместо названия | nginx отдаёт `index.html` с диска — проверьте, что `location /` проксирует на Node |
| `Environment variable not found: DATABASE_URL` | команда Prisma запущена не из `server/` — используйте `npm run db:deploy --prefix server` |
| 500 на всех запросах API | нет связи с MySQL: `systemctl status mysql`, проверьте `DATABASE_URL` |
| Бэкап пустой | смотрите `/var/log/bakar/backup.log`; дамп пишется атомарно, битый `.part` не сохраняется |
| Не приходят заявки в Telegram | переменные `TELEGRAM_*`, затем `pm2 restart bakar-api` |

```bash
sudo -u bakar pm2 restart bakar-api
sudo -u bakar pm2 logs bakar-api --lines 100
sudo nginx -t && sudo systemctl reload nginx
tail -f /var/log/nginx/bakar-error.log
```

---

## Безопасность: что уже сделано

- Node слушает только `127.0.0.1:4000`; наружу открыты 80/443.
- `server/.env` в режиме `600`; пользователь MySQL имеет права только на свою базу.
- В production пустой `JWT_SECRET` останавливает запуск (нет тихого дефолтного ключа).
- Вход в админку: 10 попыток / 15 минут с IP; форма заявок: 5 / час.
- Заголовки безопасности отдаются и на проксируемых ответах, и на статике
  (в nginx они продублированы через сниппет — `add_header` в `location`
  отменяет родительские заголовки).
- Cookie с токеном уходит с флагом `Secure` (работает поверх HTTPS).
- PM2 запущен в одном экземпляре намеренно: счётчики лимитера живут в памяти,
  при нескольких воркерах каждый выдавал бы свою квоту.
