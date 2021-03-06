'use strict'

const config = require('config')
const Joi = require('joi')
const joiToSchema = require('joi-to-json-schema')
const {get} = require('lodash')

const {errorsSchemas} = require('./errors')
const host = config.get('hapi.host')
const port = config.get('hapi.port')

const namedObject = function (name) {
  return Joi.object()
    .description(name)
    .keys({
      id: Joi.string()
        .description(`${name} id`)
        .example(name)
    })
    .requiredKeys('id')
    .unknown(true)
}

const stringOrObject = function (name) {
  return Joi.alternatives(
    namedObject(name),
    Joi.string()
      .description(`${name} id`)
      .example(name)
      .required()
      .error(errors => {
        const value = get(errors, '0.context.value')

        // The value is object, ignore all the errors here
        if (typeof value === 'object' && !Array.isArray(value)) return {}
        // Overwrite message for invalid type
        return {type: 'custom.stringOrObject'}
      })
  ).example(name)
}

const dateTime = Joi.string()
  .description('Trail timestamp in ISO 8601 format')
  .example('2018-01-02T03:04:05.123Z')
  .isoDate()

const trailSchema = {
  params: {
    id: Joi.number()
      .description('Trail id')
      .meta({id: 'models/trail.params.id'})
      .required()
      .min(0)
      .example(12345)
  },
  search: {
    from: dateTime
      .description('The minimum timestamp (inclusive)')
      .required(),
    to: dateTime
      .description('The maximum timestamp (inclusive)')
      .required(),
    who: Joi.string()
      .description(`A portion of the trail actor id`)
      .example('act'),
    what: Joi.string()
      .description(`A portion of the trail subject id`)
      .example('sub'),
    subject: Joi.string()
      .description(`A portion of the trail target id`)
      .example('tar'),
    page: Joi.number()
      .description('The page of results to return (first page is 1)')
      .min(0)
      .example(5),
    pageSize: Joi.number()
      .description('The number of results per page (default is 25)')
      .min(1)
      .example(25),
    sort: Joi.string()
      .description(`The field to use for sorting results. Default order is ascending, which can be reversed by prepending a dash. Default is "-when"`)
      .valid(['when', 'id', 'who', 'what', 'subject', '-when', '-id', '-who', '-what', '-subject'])
      .example('-when')
  },
  enumerate: {
    from: dateTime
      .description('The minimum timestamp (inclusive)')
      .required(),
    to: dateTime
      .description('The maximum timestamp (inclusive)')
      .required(),
    type: Joi.string()
      .description(`The type of id to search`)
      .required()
      .valid(['who', 'what', 'subject'])
      .example('who'),
    page: Joi.number()
      .description('The page of results to return (first page is 1)')
      .min(0)
      .example(5),
    pageSize: Joi.number()
      .description('The number of results per page (default is 25)')
      .min(1)
      .example(25),
    desc: Joi.boolean()
      .description(`If to sort alphabetically by descending order`)
      .example(true)
  },
  request: Joi.object()
    .description('A audit trail')
    .meta({id: 'models/trail.request'})
    .keys({
      when: dateTime,
      who: stringOrObject('Trail actor'),
      what: stringOrObject('Trail subject'),
      subject: stringOrObject('Trail target'),
      where: Joi.object()
        .description('Trail where'),
      why: Joi.object()
        .description('Trail reason'),
      meta: Joi.object()
        .description('Trail meta')
    })
    .requiredKeys('when', 'who', 'what', 'subject')
    .unknown(false),
  response: Joi.object()
    .description('A audit trail')
    .meta({id: 'models/trail.response'})
    .keys({
      id: Joi.number()
        .description('Trail id')
        .example(12345),
      when: Joi.any()
        .description('Trail UTC timestamp in ISO 8601 format')
        .tags('datetime')
        .example('2018-01-02T03:04:05.123Z'),
      who: namedObject('Trail actor'),
      what: namedObject('Trail subject'),
      subject: namedObject('Trail target'),
      where: Joi.object()
        .description('Trail where'),
      why: Joi.object()
        .description('Trail reason'),
      meta: Joi.object()
        .description('Trail meta')
    })
    .requiredKeys('when', 'who', 'what', 'subject')
    .unknown(false)
}

const spec = {
  openapi: '3.0.1',
  info: {
    title: 'Trail API Documentation',
    description: 'This page documents Trail\'s API endpoints, along with their various inputs and outputs. For more information about Trail please see the <a href="https://nearform.github.io/trail">Documentation Site.</a>',
    contact: {
      name: 'nearForm',
      url: 'https://github.com/nearform/trail',
      email: 'ireland@nearform.com'
    },
    license: {
      name: 'MIT',
      url: 'https://choosealicense.com/licenses/mit/'
    },
    version: require('../../package').version
  },
  servers: [
    {
      url: `http://${[host, port].join(':')}/`,
      description: 'Current API server'
    }
  ],
  tags: [
    {
      name: 'trails',
      description: 'Manage audit trails'
    },
    {
      name: 'monitoring',
      description: 'Endpoints for monitoring and uptime'
    }
  ],
  components: {
    models: {
      'trail.params.id': joiToSchema(trailSchema.params.id),
      'trail.request': joiToSchema(trailSchema.request),
      'trail.response': joiToSchema(trailSchema.response)
    },
    errors: {
      400: joiToSchema(errorsSchemas['400']),
      404: joiToSchema(errorsSchemas['404']),
      422: joiToSchema(errorsSchemas['422']),
      500: joiToSchema(errorsSchemas['500'])
    }
  },
  paths: {}
}

module.exports = {
  trailSchema,
  spec
}
