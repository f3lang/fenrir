#!/usr/bin/env groovy
pipeline { 
  tools {
    nodejs 'nodejs'
  }
 
  stages {
    stage ('Checkout Code') {
      steps {
        checkout scm
      }
    }
    stage ('Verify Tools'){
      steps {
        parallel (
          node: { sh "npm -v" },
          docker: { sh "docker -v" }
        )
      }
    }
    stage ('Build app') {
      steps {
        sh "npm prune"
        sh "npm install"
      }
    }
    stage ('Test'){
      steps {
        sh "npm test"
      }
    }

    stage ('Clean') {
      steps {
        sh "npm prune"
        sh "rm -rf node_modules"
      }
    }
  }
}
