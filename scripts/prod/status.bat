@echo off
call "%~dp0config.bat"

if not exist "%SSH_KEY%" (
    echo [ERROR] SSH key not found
    exit /b 1
)

ssh -i "%SSH_KEY%" %SSH_OPTS% %SSH_USER%@%SSH_HOST% "echo '=== SERVER ===' && echo \"CPU: $(top -bn1 | grep 'Cpu(s)' | awk '{print 100-$8}')%%\" && echo \"RAM: $(free -h | awk '/Mem:/ {print $3\"/\"$2}')\" && echo \"Disk: $(df -h / | awk 'NR==2 {print $3\"/\"$2}')\" && echo '' && echo '=== CONTAINERS ===' && for c in closo_nginx closo_frontend closo_backend closo_storage closo_db closo_certbot; do if docker ps -q -f name=^$c$ 2>/dev/null | grep -q .; then echo \"[OK] $c\"; else echo \"[--] $c\"; fi; done"
