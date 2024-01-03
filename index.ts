import { createClient, type NormalizeOAS, type OASModel, type JSONSchema, type OpenAPIDocument } from 'fets'
import type openapi from './openapi'
 
// This OAS contains a single endpoint GET /articles/:id, which conforms to the JSONAPI spec.
// The endpoint returns a single JSONAPI resource object of type 'articles'.
//
// Articles have two fields: title and body (both rendered by default).
// Articles have a single relationship 'author' (singular) of type 'user' (included by default).
//
// Users have two fields: email (rendered by default) and name (not rendered by default).
// Users have a relationship with 'articles' (plural) of type 'article' (not included by default).
//
// The property x-default is used to indicate in the OAS whether fields and relationships are
// included/rendered by default.
const client = createClient<NormalizeOAS<typeof openapi>>({})

type OASWithSchemas = OpenAPIDocument & {
  components: {
    schemas: Record<string, JSONSchema>
  }
}
;

type OASArray<T> =
  { type: 'array', items: T }

type OASJSONAPIdentifier<T> = JSONSchema & {
  properties: {
    type: {
      const: T
    },
    id: {
      type: 'string'
    }
  }
}

type OASJSONAPIRelationship<T> =
  OASJSONAPIdentifier<T> | OASArray<OASJSONAPIdentifier<T>>

type OASJSONAPIModel<T> = JSONSchema & {
  properties: {
    attributes: {
      properties: Record<string, { 'x-default': boolean }>
    },
    relationships: {
      properties: Record<string, {
        'x-default': boolean,
        properties: {
          data: OASJSONAPIRelationship<T>
        }
      }>
    }
  }
}

type FieldsFromOASModel<TModel extends OASJSONAPIModel<any>, Predicate = {}> =
  keyof {
    [A in keyof TModel['properties']['attributes']['properties'] as TModel['properties']['attributes']['properties'][A] extends Predicate ? A : never]:
    string
  }
;

type TypesFromOAS<TOAS extends OpenAPIDocument> =
  TOAS extends OASWithSchemas
    ? keyof {
        [K in keyof TOAS['components']['schemas'] as TOAS['components']['schemas'][K] extends OASJSONAPIModel<any> ? K : never]:
          TOAS['components']['schemas'][K]
      } & string
    : never
;

type OnlyDefaults = { 'x-default': true }

type FieldsFromOAS<TOAS extends OpenAPIDocument, Predicate = {}> =
  TOAS extends OASWithSchemas
    ? {
      [K in TypesFromOAS<TOAS>]:
        TOAS['components']['schemas'][K] extends OASJSONAPIModel<any>
          ? FieldsFromOASModel<TOAS['components']['schemas'][K], Predicate>
          : never
      } 
    : never
;

type IncludesFromOAS<TOAS extends OASWithSchemas, TName extends TypesFromOAS<TOAS>, Predicate = {}> =
  TOAS['components']['schemas'][TName] extends OASJSONAPIModel<TypesFromOAS<TOAS>>
    ? { [K in keyof TOAS['components']['schemas'][TName]['properties']['relationships']['properties'] as TOAS['components']['schemas'][TName]['properties']['relationships']['properties'][K] extends Predicate ? K : never]:
          TOAS['components']['schemas'][TName]['properties']['relationships']['properties'][K]['properties']['data'] extends OASJSONAPIRelationship<infer T extends TypesFromOAS<TOAS>>
          ? IncludesFromOAS<TOAS, T, Predicate>
          : never
      }
    : never
;

type JSONAPIModel<T extends string> = {
  type: T,
  id: string,
  attributes: Record<string, any>
  relationships: Record<string, { id: string, type: any }>
}

type JSONAPIData<T extends string> =
  JSONAPIModel<T> | Array<JSONAPIModel<T>>

type JSONAPIResponse<T extends string> = {
  data: JSONAPIData<T>
  included?: Array<JSONAPIModel<string>>
}

type ResolveAttributes<
  TModel extends JSONAPIModel<any>,
  Fields extends Record<TModel['type'], keyof TModel['attributes'] & keyof TModel['relationships']>
> = 
  Omit<TModel, 'attributes'>
  &
  {
    attributes: Pick<
      TModel['attributes'],
      Fields[TModel['type']]
    >
  }
  &
  {
    relationships: Pick<
      TModel['relationships'],
      Fields[TModel['type']]
    >
  }

type ResolveIncluded<
  TModel extends JSONAPIModel<any>,
  Included extends Record<TModel['type'], TModel['relationships'][string]['type'] & JSONAPIModel<any>>,
  Fields extends Record<TModel['type'] & keyof Included, keyof TModel['attributes'] & keyof Included[string]['attributes']>,
  Include extends { [K in keyof TModel['relationships']]: Included[TModel['relationships'][K]]['type'] },
> =
  Omit<TModel, 'relationships'>
  &
  {
    relationships: {
      [K in keyof Include]:
        ResolveItem<
            Included[K],
            Included,
            Fields,
            Include[K]
          >;
    };
  };

type ResolveItem<
  TModel extends JSONAPIModel<any>,
  Included extends Record<TModel['type'], TModel['relationships'][string]['type']>,
  Fields extends Record<TModel['type'] & keyof Included, keyof TModel['attributes'] & keyof Included[string]['attributes']>,
  Include extends { [K in keyof TModel['relationships']]?: Record<keyof Included[TModel['relationships'][K]]['type'], any>},
> =
  ResolveAttributes<
    ResolveIncluded<TModel, Included, Fields, Include>,
    Fields
  > & JSONAPIModel<any>
;

type Unarray<T> = T extends Array<infer U> ? U : T;

type OrDefaultTo<T, Default> = T extends undefined ? Default : Required<T>;

type IndexBy<K extends string, A extends Array<{ [X in K]: string }>> =
  { [V in A[number] as V[K]]: V }
;

type Merge<A, B> =
  A & { [K in Exclude<keyof B, keyof A>]: B[K] }
;

type ResolveData<
    TOAS extends OASWithSchemas,
    TResponse extends JSONAPIResponse<TypesFromOAS<TOAS>>,
    Fields extends Partial<FieldsFromOAS<TOAS> & { [K in TypesFromOAS<TOAS>]: any }>,
    Include extends Partial<IncludesFromOAS<TOAS, Unarray<TResponse['data']>['type']>>
  > =
    TResponse['data'] extends JSONAPIModel<TypesFromOAS<TOAS>>
      ? ResolveItem<
          TResponse['data'],
          Merge<
            IndexBy<'type', OrDefaultTo<TResponse['included'], []>>,
            IncludesFromOAS<TOAS, TResponse['data']['type'], OnlyDefaults>
          >,
          Merge<
            Fields,
            FieldsFromOAS<TOAS, OnlyDefaults>
          >,
          Include
        >
      : TResponse['data'] extends Array<infer TModel extends JSONAPIModel<TypesFromOAS<TOAS>>>
        ? Array<
            ResolveItem<
              TModel,
              Merge<
                IndexBy<'type', OrDefaultTo<TResponse['included'], []>>,
                IncludesFromOAS<TOAS, TModel['type'], OnlyDefaults>
              >,
              Merge<
                Fields,
                FieldsFromOAS<TOAS, OnlyDefaults>
              >,
              Inlcude
            >
          >
        : never

type user = OASModel<NormalizeOAS<typeof openapi>, 'user'>;

type Q = ResolveData<
  NormalizeOAS<typeof openapi>,
  { data: { type: 'user', id: string, attributes: { email: string, name: string}, relationships: {}} },
  { },
  { }
> & {};

const u : Q = { type: 'user', id: '1', attributes: { email: 'a'}};
 
// Example 1: The response should contain the default fields and default related resources for all
// JSONAPI types.
{
  const response = await client['/articles/{id}'].get({ params: { id: '42' }});
  const body = await response.json();
}

// Example 2: The response should only contain the field 'title' for the articles type.
// The author relationship should not be included.
{
  const response = await client['/articles/{id}'].get({
    params: { id: '42' },
    //query: {
    //  fields: {
    //    articles: 'title'
    //  }
    //}
  });
  const body = await response.json();
}

// Example 3: The response should only contain the field 'title' for the articles type, and the
// 'name' field for the author type. The author relationship and the author.articles relationship
// should be included, i.e. article -> author -> articles.
{
  const response = await client['/articles/{id}'].get({
    params: { id: '42' },
    //query: {
    //  fields: {
    //    articles: 'title,author'
    //    users: 'name,articles'
    //  },
    //  include: 'author,author.articles'
    //}
  });
  const body = await response.json();
}