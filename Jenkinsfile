
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
        DOCKERFILE_BASE = 'backend/Dockerfile'
        BUILD_CONTEXT = 'backend'
        DOCKER_REGISTRY_CRED_ID = 'vidyasagar91'
        SONAR_HOST_URL = 'http://52.66.164.11:9000'
        VALUES_FILE = 'k8s/backend/values.yaml'
        ARGOCD_HOST = 'a36edd65a80a149b487c1695ba444326-183639487.ap-south-1.elb.amazonaws.com'
    }

    stages {
        stage('CHECKOUT') {
            steps {
                checkout scm
            }
        }

        stage('Sonar Code Quality check') {
            steps {
                withCredentials([string(credentialsId: 'SONAR_TOKEN', variable: 'SONAR_TOKEN')]) {
                    sh 'sonar-scanner -Dsonar.projectKey=Demoproject -Dsonar.projectName=Demoproject -Dsonar.sources=backend -Dsonar.host.url=$SONAR_HOST_URL -Dsonar.token=$SONAR_TOKEN'
                }
            }
        }

        stage('Docker Build and Push') {
            steps {
                script {
                    def dockerImage = docker.build("${IMAGE_NAME}:${IMAGE_TAG}", "-f ${DOCKERFILE_BASE} ${BUILD_CONTEXT}")

                    docker.withRegistry('https://index.docker.io/v1/', DOCKER_REGISTRY_CRED_ID) {
                        dockerImage.push()
                    }
                }
            }
        }

        stage('Trivy Scan') {
            steps {
                sh 'trivy --config /dev/null image --severity HIGH,CRITICAL --format json --output trivy_backend.json $IMAGE_NAME:$IMAGE_TAG'
            }
        }

        stage('Update Image Tag in Git') {
            steps {
                script {
                    def values = readFile(env.VALUES_FILE)
                    def updatedValues = values.replaceFirst(/(?m)^(\s*tag:\s*).*/, '$1"' + env.IMAGE_TAG + '"')

                    if (values == updatedValues) {
                        error('No matching tag field found in k8s/backend/values.yaml. Check the Helm values structure.')
                    }

                    writeFile(file: env.VALUES_FILE, text: updatedValues)
                }

                withCredentials([gitUsernamePassword(credentialsId: env.GIT_CREDENTIALS, gitToolName: 'Default')]) {
                    sh 'git config user.email jenkins@ci.local'
                    sh 'git config user.name "Jenkins CI"'
                    sh 'git add $VALUES_FILE'

                    script {
                        if (sh(script: 'git diff --cached --quiet', returnStatus: true) != 0) {
                            sh 'git commit -m "ci: update backend image tag to $IMAGE_TAG"'
                            sh 'git push origin HEAD:$GIT_BRANCH'
                        } else {
                            echo 'No image tag changes to commit.'
                        }
                    }
                }
            }
        }

        stage('Deploy K8S') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'argocd-cli-creds', usernameVariable: 'ARGO_USER', passwordVariable: 'ARGO_PASS')]) {
                    sh 'argocd login $ARGOCD_HOST --username "$ARGO_USER" --password "$ARGO_PASS" --insecure --grpc-web'
                    sh 'argocd app sync backend --grpc-web'
                    sh 'argocd app wait backend --health --timeout 300 --grpc-web'
                }
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: 'trivy_backend.json', allowEmptyArchive: true
            cleanWs()
        }

        success {
            echo 'Pipeline completed successfully.'
        }

        failure {
            echo 'Pipeline failed. Check Console Output.'
        }
    }
}
