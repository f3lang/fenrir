Queries

What are queries? 
Queries are Objects, that are called and executed by Data Providers like the ResultSet 
or the Collection to retrieve filtered Data from them. You can perform Queries on every
Object that inherits the Abstract Data Provider. 
Right now, those are:

- Collection
- ResultSet
- View

How do you define queries?
Of course, you don't need to define queries by hand and modelling all of the Object logic
behind them. You can define queries with nested objects.

Let's look at a fairly simple example:

````json
{ 
  "$and": 
    [
      {"$or": [{"$eq": {"name": "Mustermann"}}, {"$eq": {"name": "Meier"}}]},
      {"$eq": {"gender": "m"}}
    ]
}
````

What does this query do?
As a result you will get every document that has the gender "m"
and either the name "Mustermann" or "Meier"

A Query consists of a nested object of so called "operations".
One operation always consists of an operator and its value(s).
e.g. {'$eq': {'address.city': 'Munich'}} uses the operator '$eq', which compares 
a given value 'Munich' to the values of the documents under the path 'address.city'  

You may nest the Object as deep as you want. But keep in mind, that each new iteration will 
slow down your query a bit. Not much, but it will ;)

 
Available Operators:
Logic operators:

'$and':
Logically concatenates an array of operations with an AND operator. Takes, as you probably 
guessed right now an array of operations as a value. The operation array may have as many
operations as you want. As soon, as one operation returns false, the whole operator returns false.

'$or': 
Logically concatenates an array of operations with an OR operator. Takes an array of operations as 
a value. The operation array may have as many operations as you want. As soon, as one operation
returns true, the whole operator returns true.

'$not':
Inverts the result of an operation. Takes one operation object as a value.

Value Operators:
Value operators compare a document property under a certain path with a given value.
Dot notation is supported

'$eq':
Compares the value in the document to be exact the given value.
example: {'$eq': {'address.city': 'Munich'}}

'$aeq':
Compares the value in the document to loosely be equal to the supplied value
example: {'$aeq': {'age': '20'}} will get you the same result as {'$aeq': {'age': 20}}

'$ne':
Checks if the value in the document is not equal to the supplied value
example: {'$ne': {'gender': 'm'}} will ounly get you all documents with a different value to 'm'
in the field gender



