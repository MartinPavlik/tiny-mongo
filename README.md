# Tiny Mongo

- Lightweight - just a tiny wrapper around mongodb nodejs driver
- TypeScript support
- Post-mutation hooks (handy for event systems etc.)

## Why
I created this package because I had a bunch of projects that used [https://mongoosejs.com/](Mongoose) and I needed to migrate them to something more lightweight, especially performance wise.


# Example
```typescript
import {connect, createCollectionFactory} from '@satankebab/tiny-mongo'

const run = async () => {
  // Connect to the db
  const connection = await connect(process.env.MONGO_URI)
  const createCollection = createCollectionFactory(connection.database)

  // Define your "data model"
  type UserType = {
    name: string
    isAdmin: boolean,
  }
  
  // Default values for each newly created document
  const defaults = {
    isAdmin: false,
  }

  // Create an user collection from the data model
  const userCollection = createCollection<UserType, typeof defaults>('test-users', {
    defaults
  })


  // Create bunch of users
  const user1 = await userCollection.createOne({
    name: 'Yoda'
  })
  /*
    {
      _id: ObjectId(...),
      name: 'Yoda',
      isAdmin: false
    }
  */

  const user2 = await userCollection.createOne({
    name: 'Vader'
  })
  /*
    {
      _id: ObjectId(...),
      name: 'Vader',
      isAdmin: false
    }
  */


  // Update the users
  const updatedUser1 = await userCollection.updateOne(
    // Query
    {
      name: 'Yoda'
    },
    // Update
    {
      name: 'Master Yoda',
      isAdmin: true
    }
  )
  /*
    {
      _id: ObjectId(...),
      name: 'Master Yoda',
      isAdmin: true
    }
  */

   const users = await userCollection.readMany({
     $or: [{ name: 'Master Yoda' }, { name: 'Vader' }]
   })
  /*
    [
      {
        _id: ObjectId(...),
        name: 'Master Yoda',
        isAdmin: true
      },
      {
        _id: ObjectId(...),
        name: 'Vader',
        isAdmin: false
      }
    ]
  */


  // Delete documents
  const deletedDocument = await userCollection.deleteOne({
    name: 'Vader'
  })
  /*
    {
      _id: ObjectId(...),
      name: 'Vader',
      isAdmin: false
    }
  */

  connection.close()
}
```

# API


## `connect(uri: string) => Connection`
- connects to MongoDB via given uri
- returns:
```ts
type Connection = {
  database: Db // Mongo db instance
  close: () => void // Closes the opened connection
}
```

## `createCollectionFactory(database: Db)`
- it just injects database connection and returns createCollection function
- returns a function `createCollection(name, config)` that can be used to create collection models

### `createCollection<T, Defaults>(name: string, config: CollectionConfig)`
- returns a "collection instance"
- `name` is a name of the MongoDB collection
- `config` can be used to configure the collection
  - `defaults` - object that is spreaded to each document that is passed to `collection.createOne`
  - `hooks` - a hook that is executed after each single mutation operation (`collection.createOne`, ...)
```typescript
type CollectionConfig<T, Defaults> = {
  defaults?: Defaults,
  hooks?: {
    postCreateHook?: (newDocument: WithId<T>) => Promise<void>,
    postUpdateHook?: (updatedDocument: WithId<T>) => Promise<void>,
    postDeleteHook?: (deletedDocument: WithId<T>) => Promise<void>,
  }
}
```

### Collection methods

Explanation of the types:
- `T` represent the type of document
- `WithOptionalDefaults<T, Defaults>` means, that you can omit any fields that are present in `config.defaults` of the collection
- `WithId<T>` means that the document always has `_id` field
- `Options` differ a bit for each operation, but the types are so complex that you should let your IDE help you

### createOne
```ts
createOne(document: WithOptionalDefaults<T, Defaults>, options: Options) =>
  Promise<WithId<T> | null>
```

### updateOne
```ts
updateOne(query: FilterQuery<T>, update: Partial<T>, options: Options) =>
  Promise<WithId<T> | null>
```

### deleteOne
```ts
deleteOne(query: FilterQuery<T>, options: Options) => Promise<WithId<T> | null>
```

### readOne
```ts
readOne(query: FilterQuery<T>, options: Options) =>
  Promise<WithId<T> | null>
```

### readMany
```ts
readMany(query: FilterQuery<T>, options: Options) =>
  Promise<Array<WithId<T>>>
```

### updateMany
```ts
updateMany(query: FilterQuery<T>, update: Partial<T>, options: Options) =>
  Promise<number>
```
- **WARNING**: updateMany does not call `postUpdateHook` because of performance reasons
- returned number means the number of matched documents

### deleteMany
```ts
deleteMany(query: FilterQuery<T>, options: Options) =>
  Promise<number>
```
- **WARNING**: deleteMany does not call `postDeleteHook` because of performance reasons
- returned number means the number of matched documents

# Typescript compatibility
- Version `^4.2.3`


# Future plans
- Declarative definition of Mongo indices directly in the "data model"
- Migrations
- Support for MongoDB schemas for the model (and their migrations)
- Support for a custom type of `_id`

# Contributing
Any form of contribution is welcomed. Feel free to open issues & PRs :-)