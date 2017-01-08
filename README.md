# fenrir
##Overview
fenrir is a document orientated database written in es6, published under MIT License.
Its purpose is to store javascript objects as documents in a noSQL fashion and retrieve them with a similar mechanism.
It's API and in-memory logic is based on [LokiJS](http://lokijs.org). It offers different Persistence Adapters for 
the most use cases. 

At the moment the following Persistence Adapters are available:

 [ ] File System Adapter (best for use in embedded scenarios like node-webkit, electron and cordova/phonegap)
 [ ] MongoDB Adapter (best for usage in server-environments... but to be honest: you would rather use mongodb directly, wouldn't you?)
 [ ] MySQL Adapter
 [ ] Replicating Storage Adapter (still highly experimental. Use with **extreme** care)