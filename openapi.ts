export default {
  "openapi": "3.0.3",
  "info": {
    "title": "JSON:API example",
  },
  "paths": {
    "/articles/{id}": {
      "get": {
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
            }
          },
        ],
        "responses": {
          "200": {
            "description": "Successful operation",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "data": {
                      "$ref": "#/components/schemas/article"
                    },
                    "included": {
                      "type": "array",
                      "items": {
                        "anyOf": [
                          {
                            "$ref": "#/components/schemas/user"
                          }
                        ]
                      }
                    },
                  }
                }
              }
            }
          },
        }
      }
    },
  },
  "components": {
    "schemas": {
      "article": {
        "type": "object",
        "properties": {
          "type": {
            "const": "article",
          },
          "id": {
            "type": "string"
          },
          "attributes": {
            "type": "object",
            "properties": {
              "title": {
                "type": "string",
                "x-default": true
              },
              "body": {
                "type": "string",
                "x-default": true
              },
            }
          },
          "relationships": {
            "type": "object",
            "properties": {
              "author": {
                "type": "object",
                "x-default": false,
                "properties": {
                  "data": {
                    "type": "object",
                    "x-default": true,
                    "properties": {
                      "type": {
                        "const": "user"
                      },
                      "id": {
                        "type": "number"
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      "user": {
        "type": "object",
        "properties": {
          "type": {
            "const": "user",
          },
          "id": {
            "type": "string"
          },
          "attributes": {
            "type": "object",
            "properties": {
              "email": {
                "type": "string",
                "x-default": true
              },
              "name": {
                "type": "string",
                "x-default": false
              }
            }
          },
          "relationships": {
            "type": "object",
            "properties": {
              "articles": {
                "type": "object",
                "x-default": false,
                "properties": {
                  "data": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "type": {
                          "const": "article"
                        },
                        "id": {
                          "type": "number"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
} as const;
