#!/usr/bin/env groovy
pipeline { 
  agent any
  
  tools {
    nodejs 'nodejs'
  }
 
  stages {
    stage ('Checkout') {
      checkout scm
    }
    stage ('Verify Tools'){
      steps {
        parallel (
          node: { sh "npm -v" }
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
