import {
  CollectionInsertManyOptions,
  CollectionInsertOneOptions,
  CommonOptions,
  Db,
  FilterQuery,
  FindOneAndDeleteOption,
  FindOneOptions,
  MongoClient,
  UpdateManyOptions,
  UpdateOneOptions,
  WithId,
} from 'mongodb';


type Difference<A, B> = {
  [K in keyof A as Exclude<K, keyof B>]: A[K];
}


type CollectionConfig<T, Defaults> = {
  defaults?: Defaults,
  hooks?: {
    postCreateHook?: (newDocument: WithId<T>) => Promise<void>,
    postUpdateHook?: (updatedDocument: WithId<T>) => Promise<void>,
    postDeleteHook?: (deletedDocument: WithId<T>) => Promise<void>,
  }
}

export const createCollectionFactory =
  (database: Db) => <T extends Defaults, Defaults extends Object>(
    name: string,
    {
      defaults,
      hooks,
    }: CollectionConfig<T, Defaults> = {}
  ) => {
    type CreateOneInputType = Difference<T, Defaults> & Partial<Defaults>
    return {
      createOne: async (input: CreateOneInputType, options?: CollectionInsertOneOptions) => {
        const inputWithDefaults = defaults ? {
          ...defaults,
          ...input
        } : input

        // mongo db...
        const result = await database.collection<T>(name).insertOne(
          inputWithDefaults as any,
          options
        )

        const newDocument = result.ops && result.result.ok ? result.ops[0] : undefined

        if (!newDocument) throw new Error('Fa`iled to create new document')

        if (hooks && hooks.postCreateHook) {
          await hooks.postCreateHook(newDocument)
        }

        return newDocument
      },
      createMany: async (inputs: CreateOneInputType[], options?: CollectionInsertManyOptions) => {
        const inputsWithDefaults = defaults ? inputs.map(i => ({
          ...defaults,
          ...i,
        })) : inputs;

        const result = await database.collection<T>(name).insertMany(
          inputsWithDefaults as any,
          options,
        )

        return Object.values(result.insertedIds)
      },
      updateOne: async (query: FilterQuery<T>, update: Partial<T>, options?: UpdateOneOptions): Promise<WithId<T> | null> => {
        const result = await database.collection<T>(name).findOneAndUpdate(
          query,
          {
            $set: update,
          },
          options
        )

        const updatedDocument = result.value as WithId<T> | null

        if (updatedDocument && hooks && hooks.postUpdateHook) {
          await hooks.postUpdateHook(updatedDocument)
        }

        return updatedDocument
      },
      deleteOne: async (query: FilterQuery<T>, options?: FindOneAndDeleteOption<T>): Promise<WithId<T> | null> => {
        const result = await database.collection<T>(name).findOneAndDelete(query, options)
        const deletedDocument = result.value as WithId<T> | null

        if (deletedDocument && hooks && hooks.postDeleteHook) {
          await hooks.postDeleteHook(deletedDocument)
        }

        return deletedDocument
      },
      readOne: async (query: FilterQuery<T>, options?: FindOneOptions<T>): Promise<WithId<T> | null> => {
        const result: any = await database.collection<T>(name).findOne(query, options as any)
        return result || null
      },
      readMany: async (query: FilterQuery<T>, options?: FindOneOptions<T>): Promise<Array<WithId<T>>> => {
        const result: any = await database.collection<T>(name).find(query, options as any).toArray()
        return result
      },
      updateMany: async (query: FilterQuery<T>, update: Partial<T>, options?: UpdateManyOptions): Promise<number> => {
        const result = await database.collection(name).updateMany(
          query,
          {
            $set: update,
          },
          options
        )
        return result.matchedCount
      },
      deleteMany: async (query: FilterQuery<T>, options?: CommonOptions): Promise<number> => {
        const result = await database.collection<T>(name).deleteMany(query, options)
        return result.deletedCount
      }
    }
  }

export type Connection = {
  database: Db,
  close: () => void,
}

export const connect = async (uri: string): Promise<Connection> => {
  const client = new MongoClient(uri)
  await client.connect()
  const database = client.db()
  return {
    database,
    close: () => client.close()
  }
}

