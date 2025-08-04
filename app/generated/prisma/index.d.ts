
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model Trader
 * 
 */
export type Trader = $Result.DefaultSelection<Prisma.$TraderPayload>
/**
 * Model Consignee
 * 
 */
export type Consignee = $Result.DefaultSelection<Prisma.$ConsigneePayload>

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Traders
 * const traders = await prisma.trader.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Traders
   * const traders = await prisma.trader.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

  /**
   * Add a middleware
   * @deprecated since 4.16.0. For new code, prefer client extensions instead.
   * @see https://pris.ly/d/extensions
   */
  $use(cb: Prisma.Middleware): void

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.trader`: Exposes CRUD operations for the **Trader** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Traders
    * const traders = await prisma.trader.findMany()
    * ```
    */
  get trader(): Prisma.TraderDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.consignee`: Exposes CRUD operations for the **Consignee** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Consignees
    * const consignees = await prisma.consignee.findMany()
    * ```
    */
  get consignee(): Prisma.ConsigneeDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.11.1
   * Query Engine version: f40f79ec31188888a2e33acda0ecc8fd10a853a9
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    Trader: 'Trader',
    Consignee: 'Consignee'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "trader" | "consignee"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      Trader: {
        payload: Prisma.$TraderPayload<ExtArgs>
        fields: Prisma.TraderFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TraderFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TraderPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TraderFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TraderPayload>
          }
          findFirst: {
            args: Prisma.TraderFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TraderPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TraderFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TraderPayload>
          }
          findMany: {
            args: Prisma.TraderFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TraderPayload>[]
          }
          create: {
            args: Prisma.TraderCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TraderPayload>
          }
          createMany: {
            args: Prisma.TraderCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TraderCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TraderPayload>[]
          }
          delete: {
            args: Prisma.TraderDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TraderPayload>
          }
          update: {
            args: Prisma.TraderUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TraderPayload>
          }
          deleteMany: {
            args: Prisma.TraderDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TraderUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.TraderUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TraderPayload>[]
          }
          upsert: {
            args: Prisma.TraderUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TraderPayload>
          }
          aggregate: {
            args: Prisma.TraderAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTrader>
          }
          groupBy: {
            args: Prisma.TraderGroupByArgs<ExtArgs>
            result: $Utils.Optional<TraderGroupByOutputType>[]
          }
          count: {
            args: Prisma.TraderCountArgs<ExtArgs>
            result: $Utils.Optional<TraderCountAggregateOutputType> | number
          }
        }
      }
      Consignee: {
        payload: Prisma.$ConsigneePayload<ExtArgs>
        fields: Prisma.ConsigneeFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ConsigneeFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConsigneePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ConsigneeFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConsigneePayload>
          }
          findFirst: {
            args: Prisma.ConsigneeFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConsigneePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ConsigneeFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConsigneePayload>
          }
          findMany: {
            args: Prisma.ConsigneeFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConsigneePayload>[]
          }
          create: {
            args: Prisma.ConsigneeCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConsigneePayload>
          }
          createMany: {
            args: Prisma.ConsigneeCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ConsigneeCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConsigneePayload>[]
          }
          delete: {
            args: Prisma.ConsigneeDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConsigneePayload>
          }
          update: {
            args: Prisma.ConsigneeUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConsigneePayload>
          }
          deleteMany: {
            args: Prisma.ConsigneeDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ConsigneeUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ConsigneeUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConsigneePayload>[]
          }
          upsert: {
            args: Prisma.ConsigneeUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConsigneePayload>
          }
          aggregate: {
            args: Prisma.ConsigneeAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateConsignee>
          }
          groupBy: {
            args: Prisma.ConsigneeGroupByArgs<ExtArgs>
            result: $Utils.Optional<ConsigneeGroupByOutputType>[]
          }
          count: {
            args: Prisma.ConsigneeCountArgs<ExtArgs>
            result: $Utils.Optional<ConsigneeCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Defaults to stdout
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events
     * log: [
     *   { emit: 'stdout', level: 'query' },
     *   { emit: 'stdout', level: 'info' },
     *   { emit: 'stdout', level: 'warn' }
     *   { emit: 'stdout', level: 'error' }
     * ]
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    trader?: TraderOmit
    consignee?: ConsigneeOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type GetLogType<T extends LogLevel | LogDefinition> = T extends LogDefinition ? T['emit'] extends 'event' ? T['level'] : never : never
  export type GetEvents<T extends any> = T extends Array<LogLevel | LogDefinition> ?
    GetLogType<T[0]> | GetLogType<T[1]> | GetLogType<T[2]> | GetLogType<T[3]>
    : never

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  /**
   * These options are being passed into the middleware as "params"
   */
  export type MiddlewareParams = {
    model?: ModelName
    action: PrismaAction
    args: any
    dataPath: string[]
    runInTransaction: boolean
  }

  /**
   * The `T` type makes sure, that the `return proceed` is not forgotten in the middleware implementation
   */
  export type Middleware<T = any> = (
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => $Utils.JsPromise<T>,
  ) => $Utils.JsPromise<T>

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */



  /**
   * Models
   */

  /**
   * Model Trader
   */

  export type AggregateTrader = {
    _count: TraderCountAggregateOutputType | null
    _avg: TraderAvgAggregateOutputType | null
    _sum: TraderSumAggregateOutputType | null
    _min: TraderMinAggregateOutputType | null
    _max: TraderMaxAggregateOutputType | null
  }

  export type TraderAvgAggregateOutputType = {
    id: number | null
  }

  export type TraderSumAggregateOutputType = {
    id: number | null
  }

  export type TraderMinAggregateOutputType = {
    id: number | null
    ntn: string | null
    name: string | null
    address: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type TraderMaxAggregateOutputType = {
    id: number | null
    ntn: string | null
    name: string | null
    address: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type TraderCountAggregateOutputType = {
    id: number
    ntn: number
    name: number
    address: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type TraderAvgAggregateInputType = {
    id?: true
  }

  export type TraderSumAggregateInputType = {
    id?: true
  }

  export type TraderMinAggregateInputType = {
    id?: true
    ntn?: true
    name?: true
    address?: true
    createdAt?: true
    updatedAt?: true
  }

  export type TraderMaxAggregateInputType = {
    id?: true
    ntn?: true
    name?: true
    address?: true
    createdAt?: true
    updatedAt?: true
  }

  export type TraderCountAggregateInputType = {
    id?: true
    ntn?: true
    name?: true
    address?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type TraderAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Trader to aggregate.
     */
    where?: TraderWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Traders to fetch.
     */
    orderBy?: TraderOrderByWithRelationInput | TraderOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TraderWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Traders from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Traders.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Traders
    **/
    _count?: true | TraderCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: TraderAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: TraderSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TraderMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TraderMaxAggregateInputType
  }

  export type GetTraderAggregateType<T extends TraderAggregateArgs> = {
        [P in keyof T & keyof AggregateTrader]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTrader[P]>
      : GetScalarType<T[P], AggregateTrader[P]>
  }




  export type TraderGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TraderWhereInput
    orderBy?: TraderOrderByWithAggregationInput | TraderOrderByWithAggregationInput[]
    by: TraderScalarFieldEnum[] | TraderScalarFieldEnum
    having?: TraderScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TraderCountAggregateInputType | true
    _avg?: TraderAvgAggregateInputType
    _sum?: TraderSumAggregateInputType
    _min?: TraderMinAggregateInputType
    _max?: TraderMaxAggregateInputType
  }

  export type TraderGroupByOutputType = {
    id: number
    ntn: string
    name: string
    address: string | null
    createdAt: Date
    updatedAt: Date
    _count: TraderCountAggregateOutputType | null
    _avg: TraderAvgAggregateOutputType | null
    _sum: TraderSumAggregateOutputType | null
    _min: TraderMinAggregateOutputType | null
    _max: TraderMaxAggregateOutputType | null
  }

  type GetTraderGroupByPayload<T extends TraderGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TraderGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TraderGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TraderGroupByOutputType[P]>
            : GetScalarType<T[P], TraderGroupByOutputType[P]>
        }
      >
    >


  export type TraderSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    ntn?: boolean
    name?: boolean
    address?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["trader"]>

  export type TraderSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    ntn?: boolean
    name?: boolean
    address?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["trader"]>

  export type TraderSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    ntn?: boolean
    name?: boolean
    address?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["trader"]>

  export type TraderSelectScalar = {
    id?: boolean
    ntn?: boolean
    name?: boolean
    address?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type TraderOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "ntn" | "name" | "address" | "createdAt" | "updatedAt", ExtArgs["result"]["trader"]>

  export type $TraderPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Trader"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: number
      ntn: string
      name: string
      address: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["trader"]>
    composites: {}
  }

  type TraderGetPayload<S extends boolean | null | undefined | TraderDefaultArgs> = $Result.GetResult<Prisma.$TraderPayload, S>

  type TraderCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<TraderFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: TraderCountAggregateInputType | true
    }

  export interface TraderDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Trader'], meta: { name: 'Trader' } }
    /**
     * Find zero or one Trader that matches the filter.
     * @param {TraderFindUniqueArgs} args - Arguments to find a Trader
     * @example
     * // Get one Trader
     * const trader = await prisma.trader.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TraderFindUniqueArgs>(args: SelectSubset<T, TraderFindUniqueArgs<ExtArgs>>): Prisma__TraderClient<$Result.GetResult<Prisma.$TraderPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Trader that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {TraderFindUniqueOrThrowArgs} args - Arguments to find a Trader
     * @example
     * // Get one Trader
     * const trader = await prisma.trader.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TraderFindUniqueOrThrowArgs>(args: SelectSubset<T, TraderFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TraderClient<$Result.GetResult<Prisma.$TraderPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Trader that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TraderFindFirstArgs} args - Arguments to find a Trader
     * @example
     * // Get one Trader
     * const trader = await prisma.trader.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TraderFindFirstArgs>(args?: SelectSubset<T, TraderFindFirstArgs<ExtArgs>>): Prisma__TraderClient<$Result.GetResult<Prisma.$TraderPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Trader that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TraderFindFirstOrThrowArgs} args - Arguments to find a Trader
     * @example
     * // Get one Trader
     * const trader = await prisma.trader.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TraderFindFirstOrThrowArgs>(args?: SelectSubset<T, TraderFindFirstOrThrowArgs<ExtArgs>>): Prisma__TraderClient<$Result.GetResult<Prisma.$TraderPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Traders that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TraderFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Traders
     * const traders = await prisma.trader.findMany()
     * 
     * // Get first 10 Traders
     * const traders = await prisma.trader.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const traderWithIdOnly = await prisma.trader.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TraderFindManyArgs>(args?: SelectSubset<T, TraderFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TraderPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Trader.
     * @param {TraderCreateArgs} args - Arguments to create a Trader.
     * @example
     * // Create one Trader
     * const Trader = await prisma.trader.create({
     *   data: {
     *     // ... data to create a Trader
     *   }
     * })
     * 
     */
    create<T extends TraderCreateArgs>(args: SelectSubset<T, TraderCreateArgs<ExtArgs>>): Prisma__TraderClient<$Result.GetResult<Prisma.$TraderPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Traders.
     * @param {TraderCreateManyArgs} args - Arguments to create many Traders.
     * @example
     * // Create many Traders
     * const trader = await prisma.trader.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TraderCreateManyArgs>(args?: SelectSubset<T, TraderCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Traders and returns the data saved in the database.
     * @param {TraderCreateManyAndReturnArgs} args - Arguments to create many Traders.
     * @example
     * // Create many Traders
     * const trader = await prisma.trader.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Traders and only return the `id`
     * const traderWithIdOnly = await prisma.trader.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TraderCreateManyAndReturnArgs>(args?: SelectSubset<T, TraderCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TraderPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Trader.
     * @param {TraderDeleteArgs} args - Arguments to delete one Trader.
     * @example
     * // Delete one Trader
     * const Trader = await prisma.trader.delete({
     *   where: {
     *     // ... filter to delete one Trader
     *   }
     * })
     * 
     */
    delete<T extends TraderDeleteArgs>(args: SelectSubset<T, TraderDeleteArgs<ExtArgs>>): Prisma__TraderClient<$Result.GetResult<Prisma.$TraderPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Trader.
     * @param {TraderUpdateArgs} args - Arguments to update one Trader.
     * @example
     * // Update one Trader
     * const trader = await prisma.trader.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TraderUpdateArgs>(args: SelectSubset<T, TraderUpdateArgs<ExtArgs>>): Prisma__TraderClient<$Result.GetResult<Prisma.$TraderPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Traders.
     * @param {TraderDeleteManyArgs} args - Arguments to filter Traders to delete.
     * @example
     * // Delete a few Traders
     * const { count } = await prisma.trader.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TraderDeleteManyArgs>(args?: SelectSubset<T, TraderDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Traders.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TraderUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Traders
     * const trader = await prisma.trader.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TraderUpdateManyArgs>(args: SelectSubset<T, TraderUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Traders and returns the data updated in the database.
     * @param {TraderUpdateManyAndReturnArgs} args - Arguments to update many Traders.
     * @example
     * // Update many Traders
     * const trader = await prisma.trader.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Traders and only return the `id`
     * const traderWithIdOnly = await prisma.trader.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends TraderUpdateManyAndReturnArgs>(args: SelectSubset<T, TraderUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TraderPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Trader.
     * @param {TraderUpsertArgs} args - Arguments to update or create a Trader.
     * @example
     * // Update or create a Trader
     * const trader = await prisma.trader.upsert({
     *   create: {
     *     // ... data to create a Trader
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Trader we want to update
     *   }
     * })
     */
    upsert<T extends TraderUpsertArgs>(args: SelectSubset<T, TraderUpsertArgs<ExtArgs>>): Prisma__TraderClient<$Result.GetResult<Prisma.$TraderPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Traders.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TraderCountArgs} args - Arguments to filter Traders to count.
     * @example
     * // Count the number of Traders
     * const count = await prisma.trader.count({
     *   where: {
     *     // ... the filter for the Traders we want to count
     *   }
     * })
    **/
    count<T extends TraderCountArgs>(
      args?: Subset<T, TraderCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TraderCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Trader.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TraderAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TraderAggregateArgs>(args: Subset<T, TraderAggregateArgs>): Prisma.PrismaPromise<GetTraderAggregateType<T>>

    /**
     * Group by Trader.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TraderGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TraderGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TraderGroupByArgs['orderBy'] }
        : { orderBy?: TraderGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TraderGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTraderGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Trader model
   */
  readonly fields: TraderFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Trader.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TraderClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Trader model
   */
  interface TraderFieldRefs {
    readonly id: FieldRef<"Trader", 'Int'>
    readonly ntn: FieldRef<"Trader", 'String'>
    readonly name: FieldRef<"Trader", 'String'>
    readonly address: FieldRef<"Trader", 'String'>
    readonly createdAt: FieldRef<"Trader", 'DateTime'>
    readonly updatedAt: FieldRef<"Trader", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Trader findUnique
   */
  export type TraderFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Trader
     */
    select?: TraderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Trader
     */
    omit?: TraderOmit<ExtArgs> | null
    /**
     * Filter, which Trader to fetch.
     */
    where: TraderWhereUniqueInput
  }

  /**
   * Trader findUniqueOrThrow
   */
  export type TraderFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Trader
     */
    select?: TraderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Trader
     */
    omit?: TraderOmit<ExtArgs> | null
    /**
     * Filter, which Trader to fetch.
     */
    where: TraderWhereUniqueInput
  }

  /**
   * Trader findFirst
   */
  export type TraderFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Trader
     */
    select?: TraderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Trader
     */
    omit?: TraderOmit<ExtArgs> | null
    /**
     * Filter, which Trader to fetch.
     */
    where?: TraderWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Traders to fetch.
     */
    orderBy?: TraderOrderByWithRelationInput | TraderOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Traders.
     */
    cursor?: TraderWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Traders from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Traders.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Traders.
     */
    distinct?: TraderScalarFieldEnum | TraderScalarFieldEnum[]
  }

  /**
   * Trader findFirstOrThrow
   */
  export type TraderFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Trader
     */
    select?: TraderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Trader
     */
    omit?: TraderOmit<ExtArgs> | null
    /**
     * Filter, which Trader to fetch.
     */
    where?: TraderWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Traders to fetch.
     */
    orderBy?: TraderOrderByWithRelationInput | TraderOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Traders.
     */
    cursor?: TraderWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Traders from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Traders.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Traders.
     */
    distinct?: TraderScalarFieldEnum | TraderScalarFieldEnum[]
  }

  /**
   * Trader findMany
   */
  export type TraderFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Trader
     */
    select?: TraderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Trader
     */
    omit?: TraderOmit<ExtArgs> | null
    /**
     * Filter, which Traders to fetch.
     */
    where?: TraderWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Traders to fetch.
     */
    orderBy?: TraderOrderByWithRelationInput | TraderOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Traders.
     */
    cursor?: TraderWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Traders from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Traders.
     */
    skip?: number
    distinct?: TraderScalarFieldEnum | TraderScalarFieldEnum[]
  }

  /**
   * Trader create
   */
  export type TraderCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Trader
     */
    select?: TraderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Trader
     */
    omit?: TraderOmit<ExtArgs> | null
    /**
     * The data needed to create a Trader.
     */
    data: XOR<TraderCreateInput, TraderUncheckedCreateInput>
  }

  /**
   * Trader createMany
   */
  export type TraderCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Traders.
     */
    data: TraderCreateManyInput | TraderCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Trader createManyAndReturn
   */
  export type TraderCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Trader
     */
    select?: TraderSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Trader
     */
    omit?: TraderOmit<ExtArgs> | null
    /**
     * The data used to create many Traders.
     */
    data: TraderCreateManyInput | TraderCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Trader update
   */
  export type TraderUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Trader
     */
    select?: TraderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Trader
     */
    omit?: TraderOmit<ExtArgs> | null
    /**
     * The data needed to update a Trader.
     */
    data: XOR<TraderUpdateInput, TraderUncheckedUpdateInput>
    /**
     * Choose, which Trader to update.
     */
    where: TraderWhereUniqueInput
  }

  /**
   * Trader updateMany
   */
  export type TraderUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Traders.
     */
    data: XOR<TraderUpdateManyMutationInput, TraderUncheckedUpdateManyInput>
    /**
     * Filter which Traders to update
     */
    where?: TraderWhereInput
    /**
     * Limit how many Traders to update.
     */
    limit?: number
  }

  /**
   * Trader updateManyAndReturn
   */
  export type TraderUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Trader
     */
    select?: TraderSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Trader
     */
    omit?: TraderOmit<ExtArgs> | null
    /**
     * The data used to update Traders.
     */
    data: XOR<TraderUpdateManyMutationInput, TraderUncheckedUpdateManyInput>
    /**
     * Filter which Traders to update
     */
    where?: TraderWhereInput
    /**
     * Limit how many Traders to update.
     */
    limit?: number
  }

  /**
   * Trader upsert
   */
  export type TraderUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Trader
     */
    select?: TraderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Trader
     */
    omit?: TraderOmit<ExtArgs> | null
    /**
     * The filter to search for the Trader to update in case it exists.
     */
    where: TraderWhereUniqueInput
    /**
     * In case the Trader found by the `where` argument doesn't exist, create a new Trader with this data.
     */
    create: XOR<TraderCreateInput, TraderUncheckedCreateInput>
    /**
     * In case the Trader was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TraderUpdateInput, TraderUncheckedUpdateInput>
  }

  /**
   * Trader delete
   */
  export type TraderDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Trader
     */
    select?: TraderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Trader
     */
    omit?: TraderOmit<ExtArgs> | null
    /**
     * Filter which Trader to delete.
     */
    where: TraderWhereUniqueInput
  }

  /**
   * Trader deleteMany
   */
  export type TraderDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Traders to delete
     */
    where?: TraderWhereInput
    /**
     * Limit how many Traders to delete.
     */
    limit?: number
  }

  /**
   * Trader without action
   */
  export type TraderDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Trader
     */
    select?: TraderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Trader
     */
    omit?: TraderOmit<ExtArgs> | null
  }


  /**
   * Model Consignee
   */

  export type AggregateConsignee = {
    _count: ConsigneeCountAggregateOutputType | null
    _avg: ConsigneeAvgAggregateOutputType | null
    _sum: ConsigneeSumAggregateOutputType | null
    _min: ConsigneeMinAggregateOutputType | null
    _max: ConsigneeMaxAggregateOutputType | null
  }

  export type ConsigneeAvgAggregateOutputType = {
    id: number | null
  }

  export type ConsigneeSumAggregateOutputType = {
    id: number | null
  }

  export type ConsigneeMinAggregateOutputType = {
    id: number | null
    ntn: string | null
    name: string | null
    asdf: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ConsigneeMaxAggregateOutputType = {
    id: number | null
    ntn: string | null
    name: string | null
    asdf: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ConsigneeCountAggregateOutputType = {
    id: number
    ntn: number
    name: number
    asdf: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ConsigneeAvgAggregateInputType = {
    id?: true
  }

  export type ConsigneeSumAggregateInputType = {
    id?: true
  }

  export type ConsigneeMinAggregateInputType = {
    id?: true
    ntn?: true
    name?: true
    asdf?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ConsigneeMaxAggregateInputType = {
    id?: true
    ntn?: true
    name?: true
    asdf?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ConsigneeCountAggregateInputType = {
    id?: true
    ntn?: true
    name?: true
    asdf?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ConsigneeAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Consignee to aggregate.
     */
    where?: ConsigneeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Consignees to fetch.
     */
    orderBy?: ConsigneeOrderByWithRelationInput | ConsigneeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ConsigneeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Consignees from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Consignees.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Consignees
    **/
    _count?: true | ConsigneeCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ConsigneeAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ConsigneeSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ConsigneeMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ConsigneeMaxAggregateInputType
  }

  export type GetConsigneeAggregateType<T extends ConsigneeAggregateArgs> = {
        [P in keyof T & keyof AggregateConsignee]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateConsignee[P]>
      : GetScalarType<T[P], AggregateConsignee[P]>
  }




  export type ConsigneeGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ConsigneeWhereInput
    orderBy?: ConsigneeOrderByWithAggregationInput | ConsigneeOrderByWithAggregationInput[]
    by: ConsigneeScalarFieldEnum[] | ConsigneeScalarFieldEnum
    having?: ConsigneeScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ConsigneeCountAggregateInputType | true
    _avg?: ConsigneeAvgAggregateInputType
    _sum?: ConsigneeSumAggregateInputType
    _min?: ConsigneeMinAggregateInputType
    _max?: ConsigneeMaxAggregateInputType
  }

  export type ConsigneeGroupByOutputType = {
    id: number
    ntn: string
    name: string
    asdf: string | null
    createdAt: Date
    updatedAt: Date
    _count: ConsigneeCountAggregateOutputType | null
    _avg: ConsigneeAvgAggregateOutputType | null
    _sum: ConsigneeSumAggregateOutputType | null
    _min: ConsigneeMinAggregateOutputType | null
    _max: ConsigneeMaxAggregateOutputType | null
  }

  type GetConsigneeGroupByPayload<T extends ConsigneeGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ConsigneeGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ConsigneeGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ConsigneeGroupByOutputType[P]>
            : GetScalarType<T[P], ConsigneeGroupByOutputType[P]>
        }
      >
    >


  export type ConsigneeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    ntn?: boolean
    name?: boolean
    asdf?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["consignee"]>

  export type ConsigneeSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    ntn?: boolean
    name?: boolean
    asdf?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["consignee"]>

  export type ConsigneeSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    ntn?: boolean
    name?: boolean
    asdf?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["consignee"]>

  export type ConsigneeSelectScalar = {
    id?: boolean
    ntn?: boolean
    name?: boolean
    asdf?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type ConsigneeOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "ntn" | "name" | "asdf" | "createdAt" | "updatedAt", ExtArgs["result"]["consignee"]>

  export type $ConsigneePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Consignee"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: number
      ntn: string
      name: string
      asdf: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["consignee"]>
    composites: {}
  }

  type ConsigneeGetPayload<S extends boolean | null | undefined | ConsigneeDefaultArgs> = $Result.GetResult<Prisma.$ConsigneePayload, S>

  type ConsigneeCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ConsigneeFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ConsigneeCountAggregateInputType | true
    }

  export interface ConsigneeDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Consignee'], meta: { name: 'Consignee' } }
    /**
     * Find zero or one Consignee that matches the filter.
     * @param {ConsigneeFindUniqueArgs} args - Arguments to find a Consignee
     * @example
     * // Get one Consignee
     * const consignee = await prisma.consignee.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ConsigneeFindUniqueArgs>(args: SelectSubset<T, ConsigneeFindUniqueArgs<ExtArgs>>): Prisma__ConsigneeClient<$Result.GetResult<Prisma.$ConsigneePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Consignee that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ConsigneeFindUniqueOrThrowArgs} args - Arguments to find a Consignee
     * @example
     * // Get one Consignee
     * const consignee = await prisma.consignee.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ConsigneeFindUniqueOrThrowArgs>(args: SelectSubset<T, ConsigneeFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ConsigneeClient<$Result.GetResult<Prisma.$ConsigneePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Consignee that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConsigneeFindFirstArgs} args - Arguments to find a Consignee
     * @example
     * // Get one Consignee
     * const consignee = await prisma.consignee.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ConsigneeFindFirstArgs>(args?: SelectSubset<T, ConsigneeFindFirstArgs<ExtArgs>>): Prisma__ConsigneeClient<$Result.GetResult<Prisma.$ConsigneePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Consignee that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConsigneeFindFirstOrThrowArgs} args - Arguments to find a Consignee
     * @example
     * // Get one Consignee
     * const consignee = await prisma.consignee.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ConsigneeFindFirstOrThrowArgs>(args?: SelectSubset<T, ConsigneeFindFirstOrThrowArgs<ExtArgs>>): Prisma__ConsigneeClient<$Result.GetResult<Prisma.$ConsigneePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Consignees that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConsigneeFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Consignees
     * const consignees = await prisma.consignee.findMany()
     * 
     * // Get first 10 Consignees
     * const consignees = await prisma.consignee.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const consigneeWithIdOnly = await prisma.consignee.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ConsigneeFindManyArgs>(args?: SelectSubset<T, ConsigneeFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ConsigneePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Consignee.
     * @param {ConsigneeCreateArgs} args - Arguments to create a Consignee.
     * @example
     * // Create one Consignee
     * const Consignee = await prisma.consignee.create({
     *   data: {
     *     // ... data to create a Consignee
     *   }
     * })
     * 
     */
    create<T extends ConsigneeCreateArgs>(args: SelectSubset<T, ConsigneeCreateArgs<ExtArgs>>): Prisma__ConsigneeClient<$Result.GetResult<Prisma.$ConsigneePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Consignees.
     * @param {ConsigneeCreateManyArgs} args - Arguments to create many Consignees.
     * @example
     * // Create many Consignees
     * const consignee = await prisma.consignee.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ConsigneeCreateManyArgs>(args?: SelectSubset<T, ConsigneeCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Consignees and returns the data saved in the database.
     * @param {ConsigneeCreateManyAndReturnArgs} args - Arguments to create many Consignees.
     * @example
     * // Create many Consignees
     * const consignee = await prisma.consignee.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Consignees and only return the `id`
     * const consigneeWithIdOnly = await prisma.consignee.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ConsigneeCreateManyAndReturnArgs>(args?: SelectSubset<T, ConsigneeCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ConsigneePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Consignee.
     * @param {ConsigneeDeleteArgs} args - Arguments to delete one Consignee.
     * @example
     * // Delete one Consignee
     * const Consignee = await prisma.consignee.delete({
     *   where: {
     *     // ... filter to delete one Consignee
     *   }
     * })
     * 
     */
    delete<T extends ConsigneeDeleteArgs>(args: SelectSubset<T, ConsigneeDeleteArgs<ExtArgs>>): Prisma__ConsigneeClient<$Result.GetResult<Prisma.$ConsigneePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Consignee.
     * @param {ConsigneeUpdateArgs} args - Arguments to update one Consignee.
     * @example
     * // Update one Consignee
     * const consignee = await prisma.consignee.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ConsigneeUpdateArgs>(args: SelectSubset<T, ConsigneeUpdateArgs<ExtArgs>>): Prisma__ConsigneeClient<$Result.GetResult<Prisma.$ConsigneePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Consignees.
     * @param {ConsigneeDeleteManyArgs} args - Arguments to filter Consignees to delete.
     * @example
     * // Delete a few Consignees
     * const { count } = await prisma.consignee.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ConsigneeDeleteManyArgs>(args?: SelectSubset<T, ConsigneeDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Consignees.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConsigneeUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Consignees
     * const consignee = await prisma.consignee.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ConsigneeUpdateManyArgs>(args: SelectSubset<T, ConsigneeUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Consignees and returns the data updated in the database.
     * @param {ConsigneeUpdateManyAndReturnArgs} args - Arguments to update many Consignees.
     * @example
     * // Update many Consignees
     * const consignee = await prisma.consignee.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Consignees and only return the `id`
     * const consigneeWithIdOnly = await prisma.consignee.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ConsigneeUpdateManyAndReturnArgs>(args: SelectSubset<T, ConsigneeUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ConsigneePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Consignee.
     * @param {ConsigneeUpsertArgs} args - Arguments to update or create a Consignee.
     * @example
     * // Update or create a Consignee
     * const consignee = await prisma.consignee.upsert({
     *   create: {
     *     // ... data to create a Consignee
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Consignee we want to update
     *   }
     * })
     */
    upsert<T extends ConsigneeUpsertArgs>(args: SelectSubset<T, ConsigneeUpsertArgs<ExtArgs>>): Prisma__ConsigneeClient<$Result.GetResult<Prisma.$ConsigneePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Consignees.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConsigneeCountArgs} args - Arguments to filter Consignees to count.
     * @example
     * // Count the number of Consignees
     * const count = await prisma.consignee.count({
     *   where: {
     *     // ... the filter for the Consignees we want to count
     *   }
     * })
    **/
    count<T extends ConsigneeCountArgs>(
      args?: Subset<T, ConsigneeCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ConsigneeCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Consignee.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConsigneeAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ConsigneeAggregateArgs>(args: Subset<T, ConsigneeAggregateArgs>): Prisma.PrismaPromise<GetConsigneeAggregateType<T>>

    /**
     * Group by Consignee.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConsigneeGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ConsigneeGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ConsigneeGroupByArgs['orderBy'] }
        : { orderBy?: ConsigneeGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ConsigneeGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetConsigneeGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Consignee model
   */
  readonly fields: ConsigneeFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Consignee.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ConsigneeClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Consignee model
   */
  interface ConsigneeFieldRefs {
    readonly id: FieldRef<"Consignee", 'Int'>
    readonly ntn: FieldRef<"Consignee", 'String'>
    readonly name: FieldRef<"Consignee", 'String'>
    readonly asdf: FieldRef<"Consignee", 'String'>
    readonly createdAt: FieldRef<"Consignee", 'DateTime'>
    readonly updatedAt: FieldRef<"Consignee", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Consignee findUnique
   */
  export type ConsigneeFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Consignee
     */
    select?: ConsigneeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Consignee
     */
    omit?: ConsigneeOmit<ExtArgs> | null
    /**
     * Filter, which Consignee to fetch.
     */
    where: ConsigneeWhereUniqueInput
  }

  /**
   * Consignee findUniqueOrThrow
   */
  export type ConsigneeFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Consignee
     */
    select?: ConsigneeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Consignee
     */
    omit?: ConsigneeOmit<ExtArgs> | null
    /**
     * Filter, which Consignee to fetch.
     */
    where: ConsigneeWhereUniqueInput
  }

  /**
   * Consignee findFirst
   */
  export type ConsigneeFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Consignee
     */
    select?: ConsigneeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Consignee
     */
    omit?: ConsigneeOmit<ExtArgs> | null
    /**
     * Filter, which Consignee to fetch.
     */
    where?: ConsigneeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Consignees to fetch.
     */
    orderBy?: ConsigneeOrderByWithRelationInput | ConsigneeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Consignees.
     */
    cursor?: ConsigneeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Consignees from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Consignees.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Consignees.
     */
    distinct?: ConsigneeScalarFieldEnum | ConsigneeScalarFieldEnum[]
  }

  /**
   * Consignee findFirstOrThrow
   */
  export type ConsigneeFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Consignee
     */
    select?: ConsigneeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Consignee
     */
    omit?: ConsigneeOmit<ExtArgs> | null
    /**
     * Filter, which Consignee to fetch.
     */
    where?: ConsigneeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Consignees to fetch.
     */
    orderBy?: ConsigneeOrderByWithRelationInput | ConsigneeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Consignees.
     */
    cursor?: ConsigneeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Consignees from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Consignees.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Consignees.
     */
    distinct?: ConsigneeScalarFieldEnum | ConsigneeScalarFieldEnum[]
  }

  /**
   * Consignee findMany
   */
  export type ConsigneeFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Consignee
     */
    select?: ConsigneeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Consignee
     */
    omit?: ConsigneeOmit<ExtArgs> | null
    /**
     * Filter, which Consignees to fetch.
     */
    where?: ConsigneeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Consignees to fetch.
     */
    orderBy?: ConsigneeOrderByWithRelationInput | ConsigneeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Consignees.
     */
    cursor?: ConsigneeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Consignees from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Consignees.
     */
    skip?: number
    distinct?: ConsigneeScalarFieldEnum | ConsigneeScalarFieldEnum[]
  }

  /**
   * Consignee create
   */
  export type ConsigneeCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Consignee
     */
    select?: ConsigneeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Consignee
     */
    omit?: ConsigneeOmit<ExtArgs> | null
    /**
     * The data needed to create a Consignee.
     */
    data: XOR<ConsigneeCreateInput, ConsigneeUncheckedCreateInput>
  }

  /**
   * Consignee createMany
   */
  export type ConsigneeCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Consignees.
     */
    data: ConsigneeCreateManyInput | ConsigneeCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Consignee createManyAndReturn
   */
  export type ConsigneeCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Consignee
     */
    select?: ConsigneeSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Consignee
     */
    omit?: ConsigneeOmit<ExtArgs> | null
    /**
     * The data used to create many Consignees.
     */
    data: ConsigneeCreateManyInput | ConsigneeCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Consignee update
   */
  export type ConsigneeUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Consignee
     */
    select?: ConsigneeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Consignee
     */
    omit?: ConsigneeOmit<ExtArgs> | null
    /**
     * The data needed to update a Consignee.
     */
    data: XOR<ConsigneeUpdateInput, ConsigneeUncheckedUpdateInput>
    /**
     * Choose, which Consignee to update.
     */
    where: ConsigneeWhereUniqueInput
  }

  /**
   * Consignee updateMany
   */
  export type ConsigneeUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Consignees.
     */
    data: XOR<ConsigneeUpdateManyMutationInput, ConsigneeUncheckedUpdateManyInput>
    /**
     * Filter which Consignees to update
     */
    where?: ConsigneeWhereInput
    /**
     * Limit how many Consignees to update.
     */
    limit?: number
  }

  /**
   * Consignee updateManyAndReturn
   */
  export type ConsigneeUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Consignee
     */
    select?: ConsigneeSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Consignee
     */
    omit?: ConsigneeOmit<ExtArgs> | null
    /**
     * The data used to update Consignees.
     */
    data: XOR<ConsigneeUpdateManyMutationInput, ConsigneeUncheckedUpdateManyInput>
    /**
     * Filter which Consignees to update
     */
    where?: ConsigneeWhereInput
    /**
     * Limit how many Consignees to update.
     */
    limit?: number
  }

  /**
   * Consignee upsert
   */
  export type ConsigneeUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Consignee
     */
    select?: ConsigneeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Consignee
     */
    omit?: ConsigneeOmit<ExtArgs> | null
    /**
     * The filter to search for the Consignee to update in case it exists.
     */
    where: ConsigneeWhereUniqueInput
    /**
     * In case the Consignee found by the `where` argument doesn't exist, create a new Consignee with this data.
     */
    create: XOR<ConsigneeCreateInput, ConsigneeUncheckedCreateInput>
    /**
     * In case the Consignee was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ConsigneeUpdateInput, ConsigneeUncheckedUpdateInput>
  }

  /**
   * Consignee delete
   */
  export type ConsigneeDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Consignee
     */
    select?: ConsigneeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Consignee
     */
    omit?: ConsigneeOmit<ExtArgs> | null
    /**
     * Filter which Consignee to delete.
     */
    where: ConsigneeWhereUniqueInput
  }

  /**
   * Consignee deleteMany
   */
  export type ConsigneeDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Consignees to delete
     */
    where?: ConsigneeWhereInput
    /**
     * Limit how many Consignees to delete.
     */
    limit?: number
  }

  /**
   * Consignee without action
   */
  export type ConsigneeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Consignee
     */
    select?: ConsigneeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Consignee
     */
    omit?: ConsigneeOmit<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const TraderScalarFieldEnum: {
    id: 'id',
    ntn: 'ntn',
    name: 'name',
    address: 'address',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type TraderScalarFieldEnum = (typeof TraderScalarFieldEnum)[keyof typeof TraderScalarFieldEnum]


  export const ConsigneeScalarFieldEnum: {
    id: 'id',
    ntn: 'ntn',
    name: 'name',
    asdf: 'asdf',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type ConsigneeScalarFieldEnum = (typeof ConsigneeScalarFieldEnum)[keyof typeof ConsigneeScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    
  /**
   * Deep Input Types
   */


  export type TraderWhereInput = {
    AND?: TraderWhereInput | TraderWhereInput[]
    OR?: TraderWhereInput[]
    NOT?: TraderWhereInput | TraderWhereInput[]
    id?: IntFilter<"Trader"> | number
    ntn?: StringFilter<"Trader"> | string
    name?: StringFilter<"Trader"> | string
    address?: StringNullableFilter<"Trader"> | string | null
    createdAt?: DateTimeFilter<"Trader"> | Date | string
    updatedAt?: DateTimeFilter<"Trader"> | Date | string
  }

  export type TraderOrderByWithRelationInput = {
    id?: SortOrder
    ntn?: SortOrder
    name?: SortOrder
    address?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TraderWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    ntn?: string
    AND?: TraderWhereInput | TraderWhereInput[]
    OR?: TraderWhereInput[]
    NOT?: TraderWhereInput | TraderWhereInput[]
    name?: StringFilter<"Trader"> | string
    address?: StringNullableFilter<"Trader"> | string | null
    createdAt?: DateTimeFilter<"Trader"> | Date | string
    updatedAt?: DateTimeFilter<"Trader"> | Date | string
  }, "id" | "ntn">

  export type TraderOrderByWithAggregationInput = {
    id?: SortOrder
    ntn?: SortOrder
    name?: SortOrder
    address?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: TraderCountOrderByAggregateInput
    _avg?: TraderAvgOrderByAggregateInput
    _max?: TraderMaxOrderByAggregateInput
    _min?: TraderMinOrderByAggregateInput
    _sum?: TraderSumOrderByAggregateInput
  }

  export type TraderScalarWhereWithAggregatesInput = {
    AND?: TraderScalarWhereWithAggregatesInput | TraderScalarWhereWithAggregatesInput[]
    OR?: TraderScalarWhereWithAggregatesInput[]
    NOT?: TraderScalarWhereWithAggregatesInput | TraderScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"Trader"> | number
    ntn?: StringWithAggregatesFilter<"Trader"> | string
    name?: StringWithAggregatesFilter<"Trader"> | string
    address?: StringNullableWithAggregatesFilter<"Trader"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Trader"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Trader"> | Date | string
  }

  export type ConsigneeWhereInput = {
    AND?: ConsigneeWhereInput | ConsigneeWhereInput[]
    OR?: ConsigneeWhereInput[]
    NOT?: ConsigneeWhereInput | ConsigneeWhereInput[]
    id?: IntFilter<"Consignee"> | number
    ntn?: StringFilter<"Consignee"> | string
    name?: StringFilter<"Consignee"> | string
    asdf?: StringNullableFilter<"Consignee"> | string | null
    createdAt?: DateTimeFilter<"Consignee"> | Date | string
    updatedAt?: DateTimeFilter<"Consignee"> | Date | string
  }

  export type ConsigneeOrderByWithRelationInput = {
    id?: SortOrder
    ntn?: SortOrder
    name?: SortOrder
    asdf?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ConsigneeWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    ntn?: string
    AND?: ConsigneeWhereInput | ConsigneeWhereInput[]
    OR?: ConsigneeWhereInput[]
    NOT?: ConsigneeWhereInput | ConsigneeWhereInput[]
    name?: StringFilter<"Consignee"> | string
    asdf?: StringNullableFilter<"Consignee"> | string | null
    createdAt?: DateTimeFilter<"Consignee"> | Date | string
    updatedAt?: DateTimeFilter<"Consignee"> | Date | string
  }, "id" | "ntn">

  export type ConsigneeOrderByWithAggregationInput = {
    id?: SortOrder
    ntn?: SortOrder
    name?: SortOrder
    asdf?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ConsigneeCountOrderByAggregateInput
    _avg?: ConsigneeAvgOrderByAggregateInput
    _max?: ConsigneeMaxOrderByAggregateInput
    _min?: ConsigneeMinOrderByAggregateInput
    _sum?: ConsigneeSumOrderByAggregateInput
  }

  export type ConsigneeScalarWhereWithAggregatesInput = {
    AND?: ConsigneeScalarWhereWithAggregatesInput | ConsigneeScalarWhereWithAggregatesInput[]
    OR?: ConsigneeScalarWhereWithAggregatesInput[]
    NOT?: ConsigneeScalarWhereWithAggregatesInput | ConsigneeScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"Consignee"> | number
    ntn?: StringWithAggregatesFilter<"Consignee"> | string
    name?: StringWithAggregatesFilter<"Consignee"> | string
    asdf?: StringNullableWithAggregatesFilter<"Consignee"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Consignee"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Consignee"> | Date | string
  }

  export type TraderCreateInput = {
    ntn: string
    name: string
    address?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TraderUncheckedCreateInput = {
    id?: number
    ntn: string
    name: string
    address?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TraderUpdateInput = {
    ntn?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    address?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TraderUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    ntn?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    address?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TraderCreateManyInput = {
    id?: number
    ntn: string
    name: string
    address?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TraderUpdateManyMutationInput = {
    ntn?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    address?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TraderUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    ntn?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    address?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ConsigneeCreateInput = {
    ntn: string
    name: string
    asdf?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ConsigneeUncheckedCreateInput = {
    id?: number
    ntn: string
    name: string
    asdf?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ConsigneeUpdateInput = {
    ntn?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    asdf?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ConsigneeUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    ntn?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    asdf?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ConsigneeCreateManyInput = {
    id?: number
    ntn: string
    name: string
    asdf?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ConsigneeUpdateManyMutationInput = {
    ntn?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    asdf?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ConsigneeUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    ntn?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    asdf?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type TraderCountOrderByAggregateInput = {
    id?: SortOrder
    ntn?: SortOrder
    name?: SortOrder
    address?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TraderAvgOrderByAggregateInput = {
    id?: SortOrder
  }

  export type TraderMaxOrderByAggregateInput = {
    id?: SortOrder
    ntn?: SortOrder
    name?: SortOrder
    address?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TraderMinOrderByAggregateInput = {
    id?: SortOrder
    ntn?: SortOrder
    name?: SortOrder
    address?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TraderSumOrderByAggregateInput = {
    id?: SortOrder
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type ConsigneeCountOrderByAggregateInput = {
    id?: SortOrder
    ntn?: SortOrder
    name?: SortOrder
    asdf?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ConsigneeAvgOrderByAggregateInput = {
    id?: SortOrder
  }

  export type ConsigneeMaxOrderByAggregateInput = {
    id?: SortOrder
    ntn?: SortOrder
    name?: SortOrder
    asdf?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ConsigneeMinOrderByAggregateInput = {
    id?: SortOrder
    ntn?: SortOrder
    name?: SortOrder
    asdf?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ConsigneeSumOrderByAggregateInput = {
    id?: SortOrder
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}