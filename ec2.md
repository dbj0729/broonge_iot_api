
# AWS EC2 instance configuration note

last update: 2022.11.08

---

## mobaxterm

- 현재 AWS EC2 서버는 linux를 기반으로 실행되기 때문에 linux에 보다 익숙하지 않을 시 UI의 편의성을 위하여 
mobaxterm을 설치(https://mobaxterm.mobatek.net/download.html)

## info

- instance id:
  i-0000000000
- alias:
  - Broonge
- AMI
  - id: ami-0000000000
  - name: ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-20220912
  - 마지막 해시 부분은 복제 당시 git commit hash임.
  - 이걸 사용해 scale up/out을 할 수 있음.
- public domain:
  - ec2-00-00-00-00.ap-northeast-2.compute.amazonaws.com
---

## mysql

[reference](https://www.digitalocean.com/community/tutorials/how-to-install-mysql-on-ubuntu-20-04)

### install

```shell
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation
# no to VALIDATE PASSWORD for simplicity
```

### issue

설치한 후 `mysql -u root -p` 하고 비번 치면

```shell
ERROR 1698 (28000): Access denied for user 'root'@'localhost'
```

오류가 발생할 수 있는데 root 계정의 password type 때문이다.

일단 sudo로 mysql접속

```shell
$ sudo mysql
```

비번 재설정

```sql
mysql> alter user 'root'@'localhost' identified with mysql_native_password by 'new-password-here';
Query OK, 0 rows affected (0.01 sec)

mysql> flush privileges;
Query OK, 0 rows affected (0.00 sec)

mysql> exit;
Bye
```

다시 로그인

```shell (22년 11월 기준 root 비번은 Yeol1234% 입니다.)
$ mysql -u root -p
Enter password:
Welcome to the MySQL monitor.  Commands end with ; or \g.
Your MySQL connection id is 13
Server version: 8.0.27-0ubuntu0.20.04.1 (Ubuntu)

Copyright (c) 2000, 2021, Oracle and/or its affiliates.
mysql> # logged in
```

### db 생성

```sql
mysql> create database db_명;
Query OK, 1 row affected (0.01 sec)
```

### user 생성

일단 내부에서만 접속을 허용한다. (localhost)

```sql
mysql> create user 'username'@'localhost' identified by 'new-password';
Query OK, 0 rows affected (0.01 sec)
```

외부에서 접속을 허용하려면

- 어디에서든(%),
  ```sql
  mysql> create user 'username'@'%' identified with mysql_native_password by 'password-for-username';
  Query OK, 0 rows affected (0.01 sec)
  ```
- 특정 아이피(0.0.0.0)
  ```sql
  mysql> create user 'broonge'@'0.0.0.0' identified  with mysql_native_password by 'password-for-broonge';
  Query OK, 0 rows affected (0.01 sec)
  ```

생성한 user에게 생성한 db의 권한을 모두 줌

```sql
mysql>  grant all privileges on broonge.* to 'broonge'@'localhost';
Query OK, 0 rows affected (0.01 sec)
```

또는

```sql
mysql>  grant all privileges on broonge.* to 'broonge'@'%';
Query OK, 0 rows affected (0.01 sec)
```

권한 반영

```sql
mysql> flush privileges;
Query OK, 0 rows affected (0.00 sec)

mysql> exit;
Bye
```

### check list

- [ ] root 계정을 아예 없애는 편이 낫지 않을까?
- [ ] 외부에서 접속을 허용해야 할까?

### MYSQL Uninstallation

모든 정보가 날아가기에 초기 Setup 시 문제가 될 경우에만 참고한다.

```shell
$ sudo apt purge mysql-server
$ sudo apt purge mysql-common
$ sudo rm -rf /var/log/mysql
$ sudo rm -rf /var/log/mysql.*
$ sudo rm -rf /var/lib/mysql
$ sudo rm -rf /etc/mysql
$ sudo apt install mysql-server --fix-missing --fix-broken
```

---

## nginx

### Install

```shell
sudo apt update
sudo apt install nginx
```

### check status

```shell
sudo systemctl status nginx
● nginx.service - A high performance web server and a reverse proxy server
     Loaded: loaded (/lib/systemd/system/nginx.service; enabled; vendor preset: enabled)
     Active: active (running) since Tue 2022-03-15 09:22:02 UTC; 8s ago
       Docs: man:nginx(8)
   Main PID: 3709 (nginx)
      Tasks: 3 (limit: 9524)
     Memory: 3.9M
     CGroup: /system.slice/nginx.service
             ├─3709 nginx: master process /usr/sbin/nginx -g daemon on; master_process on;
             ├─3710 nginx: worker process
             └─3711 nginx: worker process

```

### check firewall

```shell
sudo ufw app list
Available applications:
  Nginx Full
  Nginx HTTP
  Nginx HTTPS
  OpenSSH
```

###nginx 가 설치 되었는지 확인
ec2-43-200-180-65.ap-northeast-2.compute.amazonaws.com

---

## node

### install

[reference](https://github.com/nodesource/distributions/blob/master/README.md#debinstall)

```shell
$ curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
$ sudo apt install -y nodejs
```

### check

```shell
$ node -v
v18.12.1 

$ npm -v
v8.19.2
```

### install yarn

```shell
$ sudo npm install --global yarn
$ yarn -v
1.22.19
```

---

## git

[reference](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent)

### generate a new SSH key

```shell
$ ssh-keygen -t ed25519 -C "깃허브 아이디 (이메일)"
Generating public/private ed25519 key pair.
Enter file in which to save the key (/home/ubuntu/.ssh/id_ed25519):
Enter passphrase (empty for no passphrase): '그냥 엔터치고 넘어간다'
Enter same passphrase again: '그냥 엔터치고 넘어간다'
Your identification has been saved in /home/ubuntu/.ssh/id_ed25519
Your public key has been saved in /home/ubuntu/.ssh/id_ed25519.pub
The key fingerprint is:
SHA256:여기에 알 수 없는 코드가 보여지고 그 다음에 깃허브 아이디 (이메일) 가 보여진다.
The key's randomart image is:
+--[ED25519 256]--+
|.................|
|ooooooooooooooooo|
|=================|
|+++++++++++++++++|
|.................|
|ooooooooooooooooo|
|=================|
|+++++++++++++++++|
|ooooooooooooooooo|
+----[SHA256]-----+

```

### add ssh key to ssh-agent

> Before adding a new SSH key to the ssh-agent to manage your keys, you should have checked for existing SSH keys and generated a new SSH key.

백그라운드에서 ssh-agent 실행

```shell
$ eval "$(ssh-agent -s)"
Agent pid 0000 (숫자가 나온다)
```

ssh 개인키를 ssh-agent에 추가

```shell
$ ssh-add ~/.ssh/id_ed25519
Identity added: /home/ubuntu/.ssh/id_ed25519 (깃허브 아이디(이메일))
```

ssh 공개키를 복사하고 github에 등록
[reference](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/adding-a-new-ssh-key-to-your-github-account)

```shell
$ cat ~/.ssh/id_ed25519.pub
ssh-ed25519 여기에 알 수 없는 코드가 보여지고 그 다음에 깃허브 아이디 (이메일) 가 보여진다.
```

### github 에서 New SSH Keys 추가
1. github.com 에 로그인
2. Settings
3. SSH and GPG Keys
4. New SSH Keys
5. 제목 입력 후 Key Type 을 Authentication Key 로 선택
6. 위의 cat ~/.ssh/id_ed25519.pub 이라고 쳐서 나온 값을 Key 값으로 입력
### clone source code

```shell
$ git clone git@github.com:myid/repository_name.git
```

이제 소스코드가 준비되었다.

## Project Preparation

소스코드 경로로 이동

```shell
$ cd 소스코드 폴더명
```

### set .env

서비스 운영에 필요한 기본 값들을 채워넣는다.

```shell
$ cp .env.example .env
$ vim .env # set all required service level variables
```

### copy firebase admin sdk configuration file to root (json)

ooo-2db24-firebase-adminsdk-armzd-13c72e5329.json

### install node packages

```shell
$ yarn
```

### run migration

이 과정은 ec2 사양에 따라 많은 시간이 걸리기도 한다.

```shell
$ yarn typeorm migration:run
```

### fix mysql authentication protocol issue

[reference](https://stackoverflow.com/a/50547109)

mysql 드라이버가 mysql의 새 auth protocol을 지원하지 않아 다음과 같은 에러 발생

> startupError: Error: **ER_NOT_SUPPORTED_AUTH_MODE**: Client does not support authentication protocol requested by server; consider upgrading MySQL client

- mysql 8.0 이후부터 비번 처리하는 방식이 달라졌다고 함.
- 이전 버전 쓰느니 그냥 이부분만 적용해서 사용하는 게 나을 것 같음.

```shell
{
  startupError: Error: ER_NOT_SUPPORTED_AUTH_MODE: Client does not support authentication protocol requested by server; consider upgrading MySQL client
      at Handshake.Sequence._packetToError (/home/ubuntu/marie/node_modules/mysql/lib/protocol/sequences/Sequence.js:47:14)
      at Handshake.ErrorPacket (/home/ubuntu/marie/node_modules/mysql/lib/protocol/sequences/Handshake.js:123:18)
      at Protocol._parsePacket (/home/ubuntu/marie/node_modules/mysql/lib/protocol/Protocol.js:291:23)
      at Parser._parsePacket (/home/ubuntu/marie/node_modules/mysql/lib/protocol/Parser.js:433:10)
      at Parser.write (/home/ubuntu/marie/node_modules/mysql/lib/protocol/Parser.js:43:10)
      at Protocol.write (/home/ubuntu/marie/node_modules/mysql/lib/protocol/Protocol.js:38:16)
      at Socket.<anonymous> (/home/ubuntu/marie/node_modules/mysql/lib/Connection.js:88:28)
      at Socket.<anonymous> (/home/ubuntu/marie/node_modules/mysql/lib/Connection.js:526:10)
      at Socket.emit (node:events:390:28)
      at Socket.emit (node:domain:475:12)
      --------------------
      at Protocol._enqueue (/home/ubuntu/marie/node_modules/mysql/lib/protocol/Protocol.js:144:48)
      at Protocol.handshake (/home/ubuntu/marie/node_modules/mysql/lib/protocol/Protocol.js:51:23)
      at PoolConnection.connect (/home/ubuntu/marie/node_modules/mysql/lib/Connection.js:116:18)
      at Pool.getConnection (/home/ubuntu/marie/node_modules/mysql/lib/Pool.js:48:16)
      at /home/ubuntu/marie/src/driver/mysql/MysqlDriver.ts:981:18
      at new Promise (<anonymous>)
      at MysqlDriver.createPool (/home/ubuntu/marie/src/driver/mysql/MysqlDriver.ts:978:16)
      at MysqlDriver.<anonymous> (/home/ubuntu/marie/src/driver/mysql/MysqlDriver.ts:353:36)
      at step (/home/ubuntu/marie/node_modules/tslib/tslib.js:143:27)
      at Object.next (/home/ubuntu/marie/node_modules/tslib/tslib.js:124:57) {
    code: 'ER_NOT_SUPPORTED_AUTH_MODE',
    errno: 1251,
    sqlMessage: 'Client does not support authentication protocol requested by server; consider upgrading MySQL client',
    sqlState: '08004',
    fatal: true
  }
}
```

비번 방식을 `mysql_native_password`로 바꿔주자

```sql
mysql> alter user 'username'@'localhost' identified with mysql_native_password by 'password-here';
Query OK, 0 rows affected (0.07 sec)

mysql> flush privileges;
Query OK, 0 rows affected (0.01 sec)

mysql> exit
Bye
```

다시 마이그레이션

```shell
$ yarn typerom migration:run
Migration migration-name-1 has been executed successfully.
Migration migration-name-2 has been executed successfully.
Migration migration-name-3 has been executed successfully.
Done in 13.17s.
```

### set swap

[reference](https://www.javacodemonk.com/permanent-swap-space-in-centos-and-ubuntu-f36bb1bf)

t2.micro는 램이 1G 밖에 안 돼서 `yarn dev`, `yarn build`할 때 많은 시간이 걸리고 죽어버리기도 함. swap 설정으로 메모리를 확충하자.

```shell
$ sudo /bin/dd if=/dev/zero of=/var/swap.1 bs=1M count=1024
$ sudo chmod 600 /var/swap.1
$ sudo /sbin/mkswap /var/swap.1
$ sudo /sbin/swapon /var/swap.1
$ free -m
              total        used        free      shared  buff/cache   available
Mem:            968         528         230           0         209         288
Swap:          1023         158         865
```

##### Make swap permanent

add folling line to `/etc/fstab`

```bash
$ sudo vim /etc/fstab
```

```vim
/var/swap.1 swap swap defaults 0 0
```

check swappiness

> If you are using SSD, its better to keep system swappiness to a low value like 5 or 10 (so that lesser number of writes happen on swap)

```bash
cat /proc/sys/vm/swappiness
60
```

Add the below line to `/etc/sysctl.conf`

```bash
$ sudo vim /etc/sysctl.conf
```

```vim
vm.swappiness=10
```

##### 참고 swap 해제

- Turn off the swap `$ sudo swapoff -v /var/swap.1`
- Remove swap file entry from `/etc/fstab` which contains `/var/swap.1 swap swap defaults 0 0`
- Delete the actual swap file on system using `sudo rm /var/swap.1`

### test dev run

- ec2 인스턴스가 저사양인 경우 typescript compile에 많은 시간이 걸림
- 컴파일 후 정상적인 node js 실행에는 무리가 없음

```shell
$ yarn dev

# 2 years later...

server running at http://localhost:5003
visit http://localhost:5003/chat to test websocket
```

---

## 도메인 연결

- 도메인을 구입하고 ec2의 ip를 연결해준다.
- ec2를 중지 후 다시 시작하면 ip가 바뀌므로 도메인 설정에 가서 새 ip를 연결해줘야 한다.

이제 ec2 인스턴스를 해당 도메인 으로 접속할 수 있다.

---

## nginx reverse proxy

[reference](https://gist.github.com/merong/89dd4a74d29c7c57e0ee739301681fbc)

nginx server block 설정

```shell
$ sudo vim /etc/nginx/sites-available/(파일명 설정... 보통은 사이트 도메인명을 그대로 쓴다. ~~~.com)
```

아래 내용으로 채워 넣는다.
`# for websocket` 주석이 붙은 부분은 websocket proxy 때문에 추가된 것임.

```shell
server {
  listen [::]:80;
  listen 80;

  server_name 여기에 도메인명;

  location / {
    proxy_pass http://localhost:5003;
    proxy_set_header X-Real-IP $remote_addr; # for websocket
    proxy_set_header Host $http_host; # for websocket
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;  # for websocket
    proxy_http_version 1.1;  # for websocket
    proxy_set_header Upgrade $http_upgrade;  # for websocket
    proxy_set_header Connection "Upgrade";  # for websocket
    proxy_set_header Accept-Encoding "";  # for websocket
  }
}
```

### link to sites-enabled

```shell
$ sudo ln -s /etc/nginx/sites-available/설정한 파일명 /etc/nginx/sites-enabled/
```

### check link

```shell
ls -al /etc/nginx/sites-enabled
total 8
drwxr-xr-x 2 root root 4096 Jan 27 23:06 .
drwxr-xr-x 8 root root 4096 Jan 28 16:48 ..
lrwxrwxrwx 1 root root   34 Jan 27 05:05 default -> /etc/nginx/sites-available/default
lrwxrwxrwx 1 root root   48 Jan 27 04:14 설정한 파일명 -> /etc/nginx/sites-available/설정한 파일명
```

### test nginx configuration

```shell
$ sudo nginx -t
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### nginx reload

```shell
$ sudo systemctl reload nginx
```

- 이제 '도메인' 으로 들어오는 request는 모두 내부의 http://localhost:3000 으로 프록시된다.
- 앞서 `yarn dev`를 통해 서버를 실행했기 때문에 '도메인' 에 접속해서 확인.

이제 SSL ceritification을 획득하여 https로 암호화 통신을 할 수 있도록 하자.

---

## SSL with certbot

[reference](https://www.digitalocean.com/community/tutorials/how-to-secure-apache-with-let-s-encrypt-on-ubuntu-20-04)

ec2 기본 도메인 http://ec2-00-00-00-00.ap-northeast-2.compute.amazonaws.com/ 는 [certbot](https://certbot.eff.org/)을 사용해 [Let's Encrypt](https://letsencrypt.org/) certificate를 설정할 수 없음.

- [Let's encrypt policy on AWS instances](https://community.letsencrypt.org/t/policy-forbids-issuing-for-name-on-amazon-ec2-domain/12692/4) 확인
- EC2 기본 도메인은 가변적이라 오늘은 이 사람, 내일은 이 사람에게 발급될 수 있으므로 인증서를 내주지 않겠다는 것임



### install certbot
무료 & 처음 설정만 해주면 자동 리뉴얼 됨.

```shell
$ sudo apt install certbot python3-certbot-nginx
```

### ec2 default domain: fail

```shell
$ sudo certbot --nginx -d ec2-00-00-00-00.ap-northeast-2.compute.amazonaws.com # fail
...
Obtaining a new certificate
An unexpected error occurred:
The server will not issue certificates for the identifier :: Error creating new order :: Cannot issue for "ec2-00-00-00-00.ap-northeast-2.compute.amazonaws.com": The ACME server refuses to issue a certificate for this domain name, because it is forbidden by policy
Please see the logfiles in /var/log/letsencrypt for more details.
```

aws 기본 도메인은 정책적으로 안 해준다는 내용임

> The server will not issue certificates for the identifier :: Error creating new order :: Cannot issue for "ec2-00-00-00-00.ap-northeast-2.compute.amazonaws.com": The ACME server refuses to issue a certificate for this domain name, because it is **forbidden by policy**

### get ssl certification

```shell
$ sudo certbot --nginx -d 도메인명
```

- 설정 과정 중에 email 을 입력하여 만기 도래 등의 정보를 수신한다

### set redirect

http request를 https로 리다이렉트

```shell
Please choose whether or not to redirect HTTP traffic to HTTPS, removing HTTP access.
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
1: No redirect - Make no further changes to the webserver configuration.
2: Redirect - Make all requests redirect to secure HTTPS access. Choose this for
new sites, or if you're confident your site works on HTTPS. You can undo this
change by editing your web server's configuration.
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
Select the appropriate number [1-2] then [enter] (press 'c' to cancel): 2
Redirecting all traffic on port 80 to ssl in /etc/nginx/sites-enabled/default
```

성공

```shell
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
Congratulations! You have successfully enabled https://도메인명

You should test your configuration at:
https://www.ssllabs.com/ssltest/analyze.html?d=도메인명
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
```

이제 nginx 서버 블록은 아래와 같은 모양이 된다.

```shell
$ cat /etc/nginx/sites-enabled/도메인명

server {
  server_name 도메인명;

  location / {
    proxy_pass http://localhost:5003;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header Host $http_host; # for websocket
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;  # for websocket
    proxy_http_version 1.1;  # for websocket
    proxy_set_header Upgrade $http_upgrade;  # for websocket
    proxy_set_header Connection "Upgrade";  # for websocket
    proxy_set_header Accept-Encoding "";  # for websocket

    listen [::]:443 ssl ipv6only=on; # managed by Certbot
    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/도메인명/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/도메인명/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}

server {
  if ($host = 도메인명) {
    return 301 https://$host$request_uri;
  } # managed by Certbot

  server_name 도메인명;

  listen [::]:80;
  listen 80;
  return 404; # managed by Certbot
}
```

### test SSL certificate

https://www.ssllabs.com/ssltest/analyze.html?d=도메인명

### check auto certificate renewal

아래에서 `Active: active (waiting)` 상태이면

- 하루에 두번 인증 만료 확인하고
- 만료가 1달 이내이면 자동으로 재인증한다.

```shell
$ sudo systemctl status certbot.timer
● certbot.timer - Run certbot twice daily
     Loaded: loaded (/lib/systemd/system/certbot.timer; enabled; vendor preset: enabled)
     Active: active (waiting) since Wed 2022-01-26 16:00:02 UTC; 1h 13min ago
    Trigger: Thu 2022-01-27 08:45:41 UTC; 15h left
   Triggers: ● certbot.service

Jan 26 16:00:02 ip-172-31-7-14 systemd[1]: Started Run certbot twice daily.
```

- 수동으로 재인증하고 싶으면 `$ sudo certbot renew`
- 인증 삭제하고 싶으면 `$ sudo certbot delete --cert-name 도메인명`

### check renewal process

인증 만료 때 실행할 renewal process가 제대로 설정되었는지 테스트

- 실제 renewal이 되는 건 아니고 미리 검증하는 것임

  > Cert not due for renewal, but simulating renewal for dry run

  > The test certificates below have not been saved.

```shell
$ sudo certbot renew --dry-run
Saving debug log to /var/log/letsencrypt/letsencrypt.log

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
Processing /etc/letsencrypt/renewal/도메인명.conf
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
Cert not due for renewal, but simulating renewal for dry run
Plugins selected: Authenticator nginx, Installer nginx
Renewing an existing certificate
Performing the following challenges:
http-01 challenge for 도메인명
Waiting for verification...
Cleaning up challenges

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
new certificate deployed with reload of nginx server; fullchain is
/etc/letsencrypt/live/도메인명/fullchain.pem
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
** DRY RUN: simulating 'certbot renew' close to cert expiry
**          (The test certificates below have not been saved.)

Congratulations, all renewals succeeded. The following certs have been renewed:
  /etc/letsencrypt/live/도메인명/fullchain.pem (success)
** DRY RUN: simulating 'certbot renew' close to cert expiry
**          (The test certificates above have not been saved.)
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
```
---


## build

- tsc 명령으로 ts-to-js compile
- html, ejs, json for swagger 등은 수동으로 복사한다.

```shell
$ tsc                       # compile

$ yarn api-docs             # copy openapi.yaml
$ cp -R src/public build    # copy test chat page (vue)
$ cp -R src/views build     # copy admin pages (ejs)
```

이걸 npm command로 하면

```shell
$ yarn build                # compile
$ yarn copy                 # copy
```

package.json 확인

```json
{
  "scripts": {
    "migration": "NODE_ENV=production typeorm migration:run",
    "start": "NODE_ENV=production node build/server.js",
    "build": "tsc",
    "copy": "cp -R src/views build && yarn api-docs",
    "api-docs": "swagger-cli bundle ./src/swagger/openapi.yaml --outfile build/swagger/openapi.yaml --type yaml",
    "dev": "nodemon --exec ts-node src/server.ts",
    "typeorm": "node --require ts-node/register ./node_modules/typeorm/cli.js"
  }
}
```

이제 production 준비가 끝남.

## run server

```shell
$ NODE_ENV=production node build/server.js
```

이제 컴파일된 순수 js 기반 node 웹서버가 **프로덕션 모드**로 실행된다.

---

## pm2

pm2는 프로젝트를 백그라운드에서 실행하고 모니터하기 위한 node process manager이다.

### install

```shell
$ sudo yarn global add pm2@latest
```

### start

```shell
$ pm2 start --name "이름" yarn -- start


                        -------------

__/\\\\\\\\\\\\\____/\\\\____________/\\\\____/\\\\\\\\\_____
 _\/\\\/////////\\\_\/\\\\\\________/\\\\\\__/\\\///////\\\___
  _\/\\\_______\/\\\_\/\\\//\\\____/\\\//\\\_\///______\//\\\__
   _\/\\\\\\\\\\\\\/__\/\\\\///\\\/\\\/_\/\\\___________/\\\/___
    _\/\\\/////////____\/\\\__\///\\\/___\/\\\________/\\\//_____
     _\/\\\_____________\/\\\____\///_____\/\\\_____/\\\//________
      _\/\\\_____________\/\\\_____________\/\\\___/\\\/___________
       _\/\\\_____________\/\\\_____________\/\\\__/\\\\\\\\\\\\\\\_
        _\///______________\///______________\///__\///////////////__


                          Runtime Edition

        PM2 is a Production Process Manager for Node.js applications
                     with a built-in Load Balancer.

                Start and Daemonize any application:
                $ pm2 start app.js

                Load Balance 4 instances of api.js:
                $ pm2 start api.js -i 4

                Monitor in production:
                $ pm2 monitor

                Make pm2 auto-boot at server restart:
                $ pm2 startup

                To go further checkout:
                http://pm2.io/


                        -------------
```

## stop

```shell
$ pm2 stop 이름
```

## start

```shell
pm2 start 이름
```

## startup

[reference](https://jybaek.tistory.com/721)

서버가 부팅되면 node 서버도 자동으로 시작하게 해준다

```shell
$ pm2 startup
[PM2] Init System found: systemd
[PM2] To setup the Startup Script, copy/paste the following command:
sudo env PATH=$PATH:/usr/bin /home/ubuntu/.config/yarn/global/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu
$ sudo env PATH=$PATH:/usr/bin /home/ubuntu/.config/yarn/global/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu

                        -------------

__/\\\\\\\\\\\\\____/\\\\____________/\\\\____/\\\\\\\\\_____
 _\/\\\/////////\\\_\/\\\\\\________/\\\\\\__/\\\///////\\\___
  _\/\\\_______\/\\\_\/\\\//\\\____/\\\//\\\_\///______\//\\\__
   _\/\\\\\\\\\\\\\/__\/\\\\///\\\/\\\/_\/\\\___________/\\\/___
    _\/\\\/////////____\/\\\__\///\\\/___\/\\\________/\\\//_____
     _\/\\\_____________\/\\\____\///_____\/\\\_____/\\\//________
      _\/\\\_____________\/\\\_____________\/\\\___/\\\/___________
       _\/\\\_____________\/\\\_____________\/\\\__/\\\\\\\\\\\\\\\_
        _\///______________\///______________\///__\///////////////__


                          Runtime Edition

        PM2 is a Production Process Manager for Node.js applications
                     with a built-in Load Balancer.

                Start and Daemonize any application:
                $ pm2 start app.js

                Load Balance 4 instances of api.js:
                $ pm2 start api.js -i 4

                Monitor in production:
                $ pm2 monitor

                Make pm2 auto-boot at server restart:
                $ pm2 startup

                To go further checkout:
                http://pm2.io/


                        -------------

[PM2] Init System found: systemd
Platform systemd
Template
[Unit]
Description=PM2 process manager
Documentation=https://pm2.keymetrics.io/
After=network.target

[Service]
Type=forking
User=ubuntu
LimitNOFILE=infinity
LimitNPROC=infinity
LimitCORE=infinity
Environment=PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games:/snap/bin:/home/ubuntu/.yarn/bin:/usr/bin:/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin
Environment=PM2_HOME=/home/ubuntu/.pm2
PIDFile=/home/ubuntu/.pm2/pm2.pid
Restart=on-failure

ExecStart=/home/ubuntu/.config/yarn/global/node_modules/pm2/bin/pm2 resurrect
ExecReload=/home/ubuntu/.config/yarn/global/node_modules/pm2/bin/pm2 reload all
ExecStop=/home/ubuntu/.config/yarn/global/node_modules/pm2/bin/pm2 kill

[Install]
WantedBy=multi-user.target

Target path
/etc/systemd/system/pm2-ubuntu.service
Command list
[ 'systemctl enable pm2-ubuntu' ]
[PM2] Writing init configuration in /etc/systemd/system/pm2-ubuntu.service
[PM2] Making script booting at startup...
[PM2] [-] Executing: systemctl enable pm2-ubuntu...
Created symlink /etc/systemd/system/multi-user.target.wants/pm2-ubuntu.service → /etc/systemd/system/pm2-ubuntu.service.
[PM2] [v] Command successfully executed.
+---------------------------------------+
[PM2] Freeze a process list on reboot via:
$ pm2 save

[PM2] Remove init script via:
$ pm2 unstartup systemd

```

### monitor

#### shell monitor

```shell
$ pm2 monit
```

#### web monitor

```shell
$ pm2 monitor
```

id, pw, email 입력함
https://app.pm2.io/#/bucket/61f1bf6f9078dcba51ce4d14

---

## CI/CD

[Run SSH command](https://github.com/marketplace/actions/run-ssh-command) github action 사용

- main 브랜치가 깃헙에 커밋(푸시)되면
  - ec2 인스턴스에 ssh 원격접속 `ssh name@ec2-instance -i /path/to/private/key` -> 다음을 순차적으로 실행
    - pull souce from github `git pull origin main`
    - package install `yarn`
    - stop pm2 `pm2 stop 이름`
    - build `yarn build`
    - run migration `yarn migration`
    - copy non js/ts files to build folder `yarn copy`
    - start pm2 `pm2 start 이름`

github actions 탭에서 확인하면 각 명령의 결과를 실시간 모니터할 수 있음

```shell
Run garygrossgarten/github-action-ssh@release
  with:
    command: cd marie
  eval "$(ssh-agent -s)"
  ssh-add ~/.ssh/id_ed2551
  git pull origin main
  yarn
  /home/***/.yarn/bin/pm2 stop 이름
  yarn typeorm migration:run
  yarn build
  yarn copy
  /home/***/.yarn/bin/pm2 start 이름

    host: ***
    username: ***
    privateKey: ***
    port: 22

Establishing a SSH connection to ***.
using provided private key
(node:1485) [DEP0005] DeprecationWarning: Buffer() is deprecated due to security and usability issues. Please use the Buffer.alloc(), Buffer.allocUnsafe(), or Buffer.from() methods instead.
🤝 Connected to ***.
Executing command: cd marie
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed2551
git pull origin main
yarn
/home/***/.yarn/bin/pm2 stop 이름
yarn typeorm migration:run
yarn build
yarn copy
/home/***/.yarn/bin/pm2 start 이름
Agent pid 6240

/home/***/.ssh/id_ed2551: No such file or directory

From github.com:jhylmb/marie
 * branch            main       -> FETCH_HEAD

   5653bcb..5dfcd41  main       -> origin/main

Updating 5653bcb..5dfcd41
Fast-forward

 .github/workflows/{main.yml => rebuild.yml} |   4 +-
 ec2.md                                      | 122 +++++++++++++++++++++++-----
 package.json                                |   8 +-
 3 files changed, 110 insertions(+), 24 deletions(-)
 rename .github/workflows/{main.yml => rebuild.yml} (88%)

yarn install v1.22.17

warning package-lock.json found. Your project contains lock files generated by tools other than Yarn. It is advised not to mix package managers in order to avoid resolution inconsistencies caused by unsynchronized lock files. To clear this warning, remove package-lock.json.

[1/4] Resolving packages...

success Already up-to-date.

Done in 0.49s.

[PM2] Applying action stopProcessId on app [이름](ids: [ 0 ])

[PM2] [이름](0) ✓

⇆ PM2+ activated | Instance Name: ip-172-31-7-14-a4ad | Dash: https://app.pm2.io/#/r/mngftsz5eifmxfx

┌─────┬──────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id  │ name         │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├─────┼──────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0   │ 이름    │ default     │ N/A     │ fork    │ 0        │ 0      │ 0    │ stopped   │ 0%       │ 0b       │ ***   │ disabled │
└─────┴──────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘

yarn run v1.22.17

$ node --require ts-node/register ./node_modules/typeorm/cli.js migration:run

query: SELECT * FROM `INFORMATION_SCHEMA`.`COLUMNS` WHERE `TABLE_SCHEMA` = 'marie' AND `TABLE_NAME` = 'migrations'

query: SELECT * FROM `marie`.`migrations` `migrations` ORDER BY `id` DESC

No migrations are pending

Done in 27.22s.

yarn run v1.22.17

$ tsc

Done in 14.83s.

yarn run v1.22.17

$ cp -R src/public build && cp -R src/views build && yarn api-docs

$ swagger-cli bundle ./src/swagger/openapi.yaml --outfile build/swagger/openapi.yaml --type yaml

Created build/swagger/openapi.yaml from ./src/swagger/openapi.yaml

Done in 0.99s.

[PM2] Applying action restartProcessId on app [이름](ids: [ 0 ])

[PM2] [이름](0) ✓

[PM2] Process successfully started

⇆ PM2+ activated | Instance Name: ip-172-31-7-14-a4ad | Dash: https://app.pm2.io/#/r/mngftsz5eifmxfx

┌─────┬──────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id  │ name         │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├─────┼──────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0   │ 이름    │ default     │ N/A     │ fork    │ 6367     │ 0s     │ 0    │ online    │ 0%       │ 14.4mb   │ ***   │ disabled │
└─────┴──────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘

✅ SSH Action finished.
```

이제 main 브랜치를 깃헙에 푸시하면 자동으로 서버에 변경 사항이 적용된다.

```shell
$ git push origin main
```

https://github.com/github-user-name/명칭/actions 에서 실시간으로 변경사항을 볼 수 있다.

# 끝
