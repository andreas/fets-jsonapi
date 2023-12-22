import { createClient, type NormalizeOAS } from 'fets'
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