
scp -r -i "C:\Users\KW-302\Desktop\자료실\키페어\kdt3.pem" "C:\Users\KW-302\Desktop\자료실\project\jenkins" ubuntu@54.180.153.178:/home/ubuntu/
docker compose exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword