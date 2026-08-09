# 运行时镜像：直接用本地已构建好的静态文件，服务器上不再跑 npm 构建
# 本地先执行：npm run build
# 产出 dist/ 需要和本文件一起出现在构建上下文里
FROM nginx:1.27-alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY dist /usr/share/nginx/html

EXPOSE 80 443
