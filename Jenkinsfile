```groovy
pipeline {
    agent any

    triggers {
        githubPush()
    }

    options {
        disableConcurrentBuilds()
        buildDiscarder(logRotator(daysToKeepStr: '2'))
    }

    environment {
        GIT_URL = 'https://github.com/Vidyasagar18snc/New-Demo-kubernet.git'
        GIT_BRANCH = 'main'
        GIT_CREDENTIALS = 'Vidyasagar18snc'

        IMAGE_NAME = 'vidyasagar91/keemeds'
        IMAGE_TAG = "v1-${BUILD_NUMBER}"
        DOCKERFILE_BASE = 'Dockerfile'
        DOCKER_REGISTRY_CRED_ID = 'vidyasagar91'

        SONAR_HOST_URL = 'http://52.66.164.11:9000'
        VALUES_FILE = 'k8s/backend/values.yaml'

        ARGOCD_HOST = 'a36edd65a80a149b487c1695ba444326-183639487.ap-south-1.elb.amazonaws.com'
    }

    stages {

        stage('CHECKOUT') {
            steps {
                script {
                    gitcheckout(
                        env.GIT_URL,
                        env.GIT_BRANCH,
                        env.GIT_CREDENTIALS
                    )
                }
            }
        }

        stage('Sonar Code Quality Check') {
            steps {
                withCredentials([
                    string(
                        credentialsId: 'SONAR_TOKEN',
                        variable: 'SONAR_TOKEN'
                    )
                ]) {
                    sh '''
                        set -eu

                        sonar-scanner \
                          -Dsonar.projectKey=Demoproject \
                          -Dsonar.projectName=Demoproject \
                          -Dsonar.sources=. \
                          -Dsonar.host.url="$SONAR_HOST_URL" \
                          -Dsonar.token="$SONAR_TOKEN"
                    '''
                }
            }
        }

        stage('Docker Build and Push') {
            steps {
                script {
                    sh 'ls -la'

                    def dockerImage = docker.build(
                        "${IMAGE_NAME}:${IMAGE_TAG}",
                        "-f ${DOCKERFILE_BASE} ."
                    )

                    docker.withRegistry(
                        'https://index.docker.io/v1/',
                        "${DOCKER_REGISTRY_CRED_ID}"
                    ) {
                        dockerImage.push()
                    }
                }
            }
        }

        stage('Trivy Scan') {
            steps {
                sh '''
                    set -eu

                    trivy image \
                      --severity HIGH,CRITICAL \
                      --format template \
                      --template '@/home/ubuntu/trivy/trivy_html.tpl' \
                      --output trivy_backend.html \
                      "$IMAGE_NAME:$IMAGE_TAG"
                '''
            }
        }

        stage('Update Image Tag in Git') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: "${GIT_CREDENTIALS}",
                        usernameVariable: 'GIT_USER',
                        passwordVariable: 'GIT_PASS'
                    )
                ]) {
                    sh '''
                        set -eu

                        git config user.email "jenkins@ci.local"
                        git config user.name "Jenkins CI"

                        sed -i "s|tag: .*|tag: \\"${IMAGE_TAG}\\"|" "$VALUES_FILE"

                        git add "$VALUES_FILE"

                        if ! git diff --cached --quiet; then
                            git commit -m "ci: update backend image tag to ${IMAGE_TAG}"

                            # Avoid putting the Git token in the remote URL.
                            GIT_ASKPASS_SCRIPT="$(mktemp)"
                            export GIT_ASKPASS_SCRIPT

                            cat > "$GIT_ASKPASS_SCRIPT" <<'EOF'
#!/bin/sh
case "$1" in
    *Username*) printf '%s\\n' "$GIT_USER" ;;
    *Password*) printf '%s\\n' "$GIT_PASS" ;;
    *) exit 1 ;;
esac
EOF
                            chmod 700 "$GIT_ASKPASS_SCRIPT"

                            export GIT_ASKPASS="$GIT_ASKPASS_SCRIPT"
                            export GIT_TERMINAL_PROMPT=0

                            git push "$GIT_URL" "HEAD:${GIT_BRANCH}"

                            rm -f "$GIT_ASKPASS_SCRIPT"
                        else
                            echo "No image tag changes to commit."
                        fi
                    '''
                }
            }
        }

        stage('Deploy K8S via Argo CD') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'argocd-cli-creds',
                        usernameVariable: 'ARGO_USER',
                        passwordVariable: 'ARGO_PASS'
                    )
                ]) {
                    script {
                        argoAppSyncWithCLI(
                            appName: 'backend',
                            argocdHost: env.ARGOCD_HOST,
                            username: env.ARGO_USER,
                            password: env.ARGO_PASS,
                            insecure: true
                        )
                    }
                }
            }
        }
    }

    post {
        always {
            publishHTML(target: [
                allowMissing: true,
                alwaysLinkToLastBuild: false,
                keepAll: true,
                reportDir: '.',
                reportFiles: 'trivy_backend.html',
                reportName: 'Backend Trivy',
                reportTitles: 'Trivy Security Report'
            ])

            cleanWs()
        }

        success {
            echo 'Pipeline completed successfully.'
        }

        failure {
            echo 'Pipeline failed. Check Console Output for the failing stage.'
        }
    }
}
```
