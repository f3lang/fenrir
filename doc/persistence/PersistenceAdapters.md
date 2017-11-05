#Persistence

Persistence in Fenrir workes similar to mysql/mariadb etc. You may decide for each collection, which persistence
adapter you want to use. The standard persistence adapter is the file adapter. It makes use of the project gleipnir-io
to deliver an extremely fast storage backend for a collection.
  

The internal logic for persisting a collection creates the collection object separately from the persistence adapter.
The persistence adapter is then attached to the collection object. As long, as no persistence adapter is attached
to the collection, it acts as an in memory database. When a persistence adapter is attached to the collection,
all preexising documents in the collection are wiped and connected ResultSets are updated. 

Collections therefore may need some time for initialization. This depends heavily on the storage engine used, on 
the indices, that need to be rebuilt, caches, that need to warmed up and much more. 

You can always check in the collection for the isReady() method. The isReady() method will return a promise, 
which resolves, once the collection is initialized. 


ResultSets. 

You may use ResultSet just like collections, they offer the same API and will be updated 
as soon, as data changes. By default, ResultSets are not persisted, but if you turn on persistence on a ResultSet,
it will be persisted alongside with the collection in the same persistence adapter.


Persistence Adapters  
For the documentation of the individual different Persistence adapters please visit the proper documentation.

Fun Part (Wishlist):

- since the persistence is coupled only loosely to the collection, it could be possible to attach multiple persistence
adapters to one collection simultaneously. This would be great for fault tolerance of webservices. e.g. you
connect a file persistence adapter and an s3 adapter at the same time. The s3 isn't very fast, but very reliable. The 
file adapter speeds up the collection initialization when the db is restarted. In case of the launch of a new instance,
the current state of the database is pulled from s3 and mirrored on the file adapter. 
On the other side, this means, you need to define a primary adapter and all others are merely replications, since
you don't want to save every change of the database immediately in s3, this heavily affect access times.