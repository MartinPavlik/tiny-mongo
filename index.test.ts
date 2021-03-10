require('dotenv').config()

import { connect, createCollectionFactory } from './index'

let connection

beforeAll(async () => {
  connection = await connect(process.env.MONGO_TEST_URI)
})

afterAll(async () => {
  await connection.close()
})

describe('createOne', () => {
  it('returns created object', async () => {
    const createCollection = createCollectionFactory(connection.database)
    type UserType = {
      name: string
      isAdmin: boolean,
    }
    const defaults = {
      isAdmin: false,
    }
    const userCollection = createCollection<UserType, typeof defaults>('test-users', {
      defaults
    })

    const result = await userCollection.createOne({
      name: '123-test'
    })

    expect(result).toHaveProperty('name', '123-test')
    expect(result).toHaveProperty('isAdmin', false)
    expect(result).toHaveProperty('_id')
    expect(typeof result).toEqual('object')
  })
})


describe('readOne', () => {
  it('finds one document', async () => {
    // Let's first create a document
    const createCollection = createCollectionFactory(connection.database)
    type UserType = {
      name: string
      isAdmin: boolean,
    }
    const defaults = {
      isAdmin: false,
    }
    const userCollection = createCollection<UserType, typeof defaults>('test-users', {
      defaults
    })

    const name = Math.random().toString()

    const result = await userCollection.createOne({
      name,
    })


    expect(result).toHaveProperty('name', name)
    expect(result).toHaveProperty('_id')
    expect(typeof result).toEqual('object')

    const found = await userCollection.readOne({
      name,
    })

    expect(found).toEqual(result)
  })

  it('returns null if a document is not found', async () => {
    const createCollection = createCollectionFactory(connection.database)
    type UserType = {
      name: string
      isAdmin: boolean,
    }
    const defaults = {
      isAdmin: false,
    }
    const userCollection = createCollection<UserType, typeof defaults>('test-users', {
      defaults
    })

    const result = await userCollection.readOne({
      name: 'does not exist'
    })

    expect(result).toEqual(null)
  })
})


describe('readMany', () => {
  it('finds all related documents', async () => {
    // Let's first create some documents
    const name1 = Math.random().toString()
    const name2 = Math.random().toString()

    const createCollection = createCollectionFactory(connection.database)
    type UserType = {
      name: string
      isAdmin: boolean,
    }
    const defaults = {
      isAdmin: false,
    }
    const userCollection = createCollection<UserType, typeof defaults>('test-users', {
      defaults
    })

    const result1 = await userCollection.createOne({
      name: name1
    })
    const result2 = await userCollection.createOne({
      name: name2
    })

    const found = await userCollection.readMany({
      $or: [{ name: name1 }, { name: name2 }],
    })

    expect(found).toEqual([result1, result2])
  })

  it('returns empty array if nothing is found', async () => {
    const createCollection = createCollectionFactory(connection.database)
    type UserType = {
      name: string
      isAdmin: boolean,
    }
    const defaults = {
      isAdmin: false,
    }
    const userCollection = createCollection<UserType, typeof defaults>('test-users', {
      defaults
    })

    const result = await userCollection.readMany({
      name: 'does-not-exist'
    })

    expect(result).toEqual([])
  })
})



describe('updateMany', () => {
  it('updates all matched documents', async () => {
    // Let's first create some documents
    const name1 = Math.random().toString()
    const name2 = Math.random().toString()

    const createCollection = createCollectionFactory(connection.database)
    type UserType = {
      name: string
      isAdmin: boolean,
    }
    const defaults = {
      isAdmin: false,
    }
    const userCollection = createCollection<UserType, typeof defaults>('test-users', {
      defaults
    })

    const result1 = await userCollection.createOne({
      name: name1
    })
    const result2 = await userCollection.createOne({
      name: name2
    })


    const numberUpdated = await userCollection.updateMany(
      {
        $or: [{ name: name1 }, { name: name2 }],
      },
      {
        isAdmin: true,
      }
    )

    expect(numberUpdated).toEqual(2)

    const result = await userCollection.readMany(
      {
        $or: [{ name: name1 }, { name: name2 }],
      }
    )

    expect(result).toEqual([result1, result2].map(r => ({ ...r, isAdmin: true })))
  })

  it('returns 0 if there are no matching documents to update', async () => {
    const createCollection = createCollectionFactory(connection.database)
    type UserType = {
      name: string
      isAdmin: boolean,
    }
    const defaults = {
      isAdmin: false,
    }
    const userCollection = createCollection<UserType, typeof defaults>('test-users', {
      defaults
    })


    const numberUpdated = await userCollection.updateMany(
      {
        name: 'does-not-exist'
      },
      {
        isAdmin: true,
      }
    )

    expect(numberUpdated).toEqual(0)
  })
})


describe('deleteMany', () => {
  it('deletes all matching documents', async () => {
    // Let's first create some documents
    const name1 = Math.random().toString()
    const name2 = Math.random().toString()

    const createCollection = createCollectionFactory(connection.database)
    type UserType = {
      name: string
      isAdmin: boolean,
    }
    const defaults = {
      isAdmin: false,
    }
    const userCollection = createCollection<UserType, typeof defaults>('test-users', {
      defaults
    })

    await userCollection.createOne({
      name: name1
    })
    await userCollection.createOne({
      name: name2
    })


    const numberDeleted = await userCollection.deleteMany(
      {
        $or: [{ name: name1 }, { name: name2 }],
      }
    )

    expect(numberDeleted).toEqual(2)

    const result = await userCollection.readMany(
      {
        $or: [{ name: name1 }, { name: name2 }],
      }
    )

    expect(result).toEqual([])
  })

  it('returns 0 if there is nothing to delete', async () => {
    const createCollection = createCollectionFactory(connection.database)
    type UserType = {
      name: string
      isAdmin: boolean,
    }
    const defaults = {
      isAdmin: false,
    }
    const userCollection = createCollection<UserType, typeof defaults>('test-users', {
      defaults
    })

    const numberDeleted = await userCollection.deleteMany(
      {
        name: 'does-not-exist'
      }
    )

    expect(numberDeleted).toEqual(0)
  })
})


describe('deleteOne', () => {
  it('deletes matched document', async () => {
    // Let's first create some documents
    const name1 = Math.random().toString()
    const name2 = Math.random().toString()

    const createCollection = createCollectionFactory(connection.database)
    type UserType = {
      name: string
      isAdmin: boolean,
    }
    const defaults = {
      isAdmin: false,
    }
    const userCollection = createCollection<UserType, typeof defaults>('test-users', {
      defaults
    })

    const result1 = await userCollection.createOne({
      name: name1
    })
    const result2 = await userCollection.createOne({
      name: name2
    })

    const deletedDocument = await userCollection.deleteOne({
      name: name1
    })

    expect(deletedDocument).toEqual(result1)

    const found = await userCollection.readMany({
      $or: [{ name: name1 }, { name: name2 }],
    })

    expect(found).toEqual([result2])
  })

  it('returns null if there is nothing to delete', async () => {

    const createCollection = createCollectionFactory(connection.database)
    type UserType = {
      name: string
      isAdmin: boolean,
    }
    const defaults = {
      isAdmin: false,
    }
    const userCollection = createCollection<UserType, typeof defaults>('test-users', {
      defaults
    })

    const result = await userCollection.deleteOne({
      name: 'does-not-exist'
    })

    expect(result).toEqual(null)
  })
})